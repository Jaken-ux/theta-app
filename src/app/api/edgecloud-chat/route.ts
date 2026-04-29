import { NextResponse } from "next/server";

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

interface ModelConfig {
  slug: string;
  /** Per-request abort timeout. Qwen3 Parallax goes through a slower
   *  pipeline-parallel route across community GPUs, so it gets a much
   *  larger budget than the centrally-hosted models. */
  timeoutMs: number;
}

const MODELS: Record<string, ModelConfig> = {
  minimax: { slug: "minimax_m2_5", timeoutMs: 30_000 },
  "gpt-oss": { slug: "gpt_oss_120b", timeoutMs: 30_000 },
  llama: { slug: "llama_3_8b", timeoutMs: 30_000 },
  qwen3: { slug: "qwen3", timeoutMs: 180_000 },
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
    return NextResponse.json(
      { error: "Server is missing EDGECLOUD_API_KEY" },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}/${cfg.slug}/completions`, {
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
      if (res.status === 409 || /no instances/i.test(remoteMsg)) {
        return NextResponse.json(
          { error: "No instances available — try again in a moment" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Something went wrong — try a different model" },
        { status: 502 }
      );
    }

    const reqState = json?.body?.infer_requests?.[0];
    if (!reqState || reqState.state !== "success") {
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
    return NextResponse.json({ response: stripThinkTags(raw) });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out — EdgeCloud may be busy" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong — try a different model" },
      { status: 500 }
    );
  }
}
