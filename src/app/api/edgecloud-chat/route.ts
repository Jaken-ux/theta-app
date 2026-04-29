import { NextResponse } from "next/server";
import { recordEdgecloudChat } from "../../../lib/db";

/**
 * Server-side proxy for the /use-edgecloud playground.
 *
 * Posts a single user message to a Theta EdgeCloud on-demand model and
 * returns the assistant text. The playground is a "press-button-and-see-it-
 * work" demo — no streaming, no context history, no tool calls.
 *
 * Endpoint shape (verified against live API):
 *   POST https://ondemand.thetaedgecloud.com/infer_request/{slug}/completions
 *   Auth: Bearer EDGECLOUD_API_KEY
 *   Body: { input: { messages: [...], max_tokens, stream: false } }
 *   Resp: { status, body: { infer_requests: [{ state, output: { message } }] } }
 */

// Vercel platform timeout for this route. Default on Hobby is 10s, which
// is shorter than even a healthy MiniMax response (~3-5s) once a cold
// start is added. 60s covers the fast models comfortably; Qwen3 Parallax
// can take 1-3 minutes and may still hit this on Hobby — Pro tier raises
// the cap to 300s if Qwen3 turns out to need more headroom.
export const maxDuration = 60;

interface ModelConfig {
  slug: string;
  /** Per-request abort timeout. Capped just under maxDuration above so
   *  the AbortController fires before Vercel kills the whole function —
   *  produces a clean "Request timed out" response instead of a 504/FUNCTION_INVOCATION_TIMEOUT. */
  timeoutMs: number;
}

const MODELS: Record<string, ModelConfig> = {
  minimax: { slug: "minimax_m2_5", timeoutMs: 55_000 },
  "gpt-oss": { slug: "gpt_oss_120b", timeoutMs: 55_000 },
  llama: { slug: "llama_3_8b", timeoutMs: 55_000 },
  qwen3: { slug: "qwen3", timeoutMs: 55_000 },
};

const BASE_URL = "https://ondemand.thetaedgecloud.com/infer_request";
const MAX_INPUT_CHARS = 500;
const MAX_OUTPUT_TOKENS = 500;

// In-memory rate limit: 10 requests per IP per hour.
// Caveat: serverless instances don't share state and cold starts reset
// the bucket — this is a soft anti-abuse layer, not a hard guarantee.
// Theta's own per-key quota (50/10min, 1000/day) is the real backstop.
const HOURLY_LIMIT = 10;
const HOUR_MS = 60 * 60 * 1000;
const buckets = new Map<string, { resetAt: number; count: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { resetAt: now + HOUR_MS, count: 1 });
    return true;
  }
  if (b.count >= HOURLY_LIMIT) return false;
  b.count++;
  return true;
}

// MiniMax-M2.5 emits its chain-of-thought as <think>...</think> blocks
// before the final answer. Strip those — playground users want the answer,
// not the reasoning trace.
function stripThinkTags(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: { message?: unknown; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const modelKey = typeof body.model === "string" ? body.model : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_INPUT_CHARS} characters` },
      { status: 400 }
    );
  }

  const cfg = MODELS[modelKey];
  if (!cfg) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  const apiKey = process.env.EDGECLOUD_API_KEY;
  if (!apiKey) {
    console.error("[edgecloud-chat] EDGECLOUD_API_KEY is not set in this environment");
    return NextResponse.json(
      { error: "Server is missing EDGECLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const url = `${BASE_URL}/${cfg.slug}/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const startedAt = Date.now();

  // Vercel function logs surface this. Mask the key so it never leaks
  // into a log search; just confirm length so we know the env var
  // is actually populated in the running environment.
  console.log("[edgecloud-chat] →", {
    url,
    model: modelKey,
    msgLen: message.length,
    timeoutMs: cfg.timeoutMs,
    keyLen: apiKey.length,
    keyPrefix: apiKey.slice(0, 4),
    auth: "Bearer ***",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: {
          messages: [{ role: "user", content: message }],
          max_tokens: MAX_OUTPUT_TOKENS,
          stream: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const elapsed = Date.now() - startedAt;
    console.log("[edgecloud-chat] ← status", res.status, "elapsed", elapsed, "ms");

    const json = (await res.json().catch(() => null)) as
      | {
          status?: string;
          message?: string;
          body?: {
            infer_requests?: Array<{
              state?: string;
              output?: { message?: string };
              error_message?: string | null;
            }>;
          };
        }
      | null;

    if (!res.ok) {
      const remoteMsg = json?.message ?? "";
      console.log("[edgecloud-chat] upstream error", res.status, remoteMsg);

      // Out-of-credit signals come back in a few different shapes — explicit
      // 402, generic 403/429 with billing-flavoured wording, or a 200 wrapper
      // around a balance-related message. Surface a friendly, single-message
      // response so users land on RapidAPI instead of being told to "try a
      // different model" when no model can possibly help.
      const creditPattern =
        /balance|insufficient|credit|billing|quota.*exceeded|out of (funds|credit)/i;
      if (res.status === 402 || creditPattern.test(remoteMsg)) {
        void recordEdgecloudChat(ip, modelKey, "error");
        return NextResponse.json(
          {
            error:
              "Demo credits depleted — please try again later, or use the API directly via RapidAPI.",
          },
          { status: 402 }
        );
      }

      if (res.status === 409 || /no instances/i.test(remoteMsg)) {
        void recordEdgecloudChat(ip, modelKey, "no_instances");
        return NextResponse.json(
          { error: "No instances available — try again in a moment" },
          { status: 503 }
        );
      }
      void recordEdgecloudChat(ip, modelKey, "error");
      return NextResponse.json(
        { error: "Something went wrong — try a different model" },
        { status: 502 }
      );
    }

    const reqState = json?.body?.infer_requests?.[0];
    if (!reqState || reqState.state !== "success") {
      void recordEdgecloudChat(ip, modelKey, "error");
      return NextResponse.json(
        {
          error:
            reqState?.error_message ||
            "Inference failed — try a different model",
        },
        { status: 502 }
      );
    }

    const raw =
      typeof reqState.output?.message === "string"
        ? reqState.output.message
        : "";

    // Count this as one "question" for admin analytics. Fire-and-forget;
    // the helper swallows DB errors internally so we never fail a
    // successful inference because of a logging hiccup.
    void recordEdgecloudChat(ip, modelKey, "success");

    return NextResponse.json({ response: stripThinkTags(raw) });
  } catch (e) {
    clearTimeout(timer);
    const elapsed = Date.now() - startedAt;
    if (e instanceof Error && e.name === "AbortError") {
      console.log("[edgecloud-chat] aborted after", elapsed, "ms");
      void recordEdgecloudChat(ip, modelKey, "timeout");
      return NextResponse.json(
        { error: "Request timed out — EdgeCloud may be busy" },
        { status: 504 }
      );
    }
    console.log("[edgecloud-chat] fetch threw after", elapsed, "ms:", e);
    void recordEdgecloudChat(ip, modelKey, "error");
    return NextResponse.json(
      { error: "Something went wrong — try a different model" },
      { status: 500 }
    );
  }
}
