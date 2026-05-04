import { NextResponse } from "next/server";

/**
 * Health check for the four playground models. Pings each in parallel
 * with max_tokens: 1 — cheapest possible call that still proves the
 * worker pipeline is up — and reports back per-model status.
 *
 * Result is cached in module memory for 5 minutes so frequent reloads
 * of /use-edgecloud don't repeatedly hammer the inference API. Cold
 * starts will refresh, multiple Vercel instances each keep their own
 * copy — both fine; the goal is "frequently fresh", not "perfectly
 * synchronized".
 */

export const maxDuration = 30;

type Status = "available" | "slow" | "unavailable";

interface HealthSnapshot {
  minimax: Status;
  "gpt-oss": Status;
  llama: Status;
  qwen3: Status;
  /** True when the demo account balance has dipped below the warning
   *  threshold. The actual amount is intentionally not exposed so a
   *  public visitor can't read off our remaining credit. */
  creditsLow: boolean;
  checkedAt: string;
}

const ENDPOINTS = {
  minimax: "minimax_m2_5",
  "gpt-oss": "gpt_oss_120b",
  llama: "llama_3_8b",
  qwen3: "qwen3",
} as const;

const BASE_URL = "https://ondemand.thetaedgecloud.com/infer_request";

// Hard-coded org_id since the demo account's organisation is fixed.
// Override via env if we ever rotate accounts. Public-safe — it's an
// identifier, not a credential.
const ORG_ID =
  process.env.EDGECLOUD_ORG_ID ?? "org_zxhz06am948ndtkatpzcyhharh8f";
const BALANCE_URL = `https://api.thetaedgecloud.com/balance?orgID=${ORG_ID}`;

// The /balance endpoint reports the value in cents (smallest currency
// unit), not USD — verified against the dashboard which renders $2.00
// while the API returns 199.7819. Convert before comparing.
const CENTS_PER_USD = 100;
const CREDITS_LOW_THRESHOLD_USD = 1;

// Thresholds for classifying a model. The 8s timeout is short enough
// that the health endpoint stays well under our 30s maxDuration even
// when all four checks run in parallel and the slowest one stalls.
const SOFT_THRESHOLD_MS = 5_000;
const HARD_TIMEOUT_MS = 8_000;

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { snapshot: HealthSnapshot; expiresAt: number } | null = null;

async function fetchBalance(apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(BALANCE_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as
      | { body?: { balances?: Array<{ balance?: number }> } }
      | null;
    const b = json?.body?.balances?.[0]?.balance;
    return typeof b === "number" ? b : null;
  } catch {
    return null;
  }
}

async function pingModel(slug: string, apiKey: string): Promise<Status> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/${slug}/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: {
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          stream: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const elapsed = Date.now() - startedAt;

    if (!res.ok) return "unavailable";
    return elapsed > SOFT_THRESHOLD_MS ? "slow" : "available";
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === "AbortError") return "slow";
    return "unavailable";
  }
}

export async function GET() {
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return NextResponse.json(cached.snapshot);
  }

  const apiKey = process.env.EDGECLOUD_API_KEY;
  if (!apiKey) {
    console.error("[edgecloud-health] EDGECLOUD_API_KEY is not set");
    const fallback: HealthSnapshot = {
      minimax: "unavailable",
      "gpt-oss": "unavailable",
      llama: "unavailable",
      qwen3: "unavailable",
      creditsLow: false,
      checkedAt: new Date().toISOString(),
    };
    return NextResponse.json(fallback, { status: 500 });
  }

  const entries = Object.entries(ENDPOINTS) as [
    keyof typeof ENDPOINTS,
    string,
  ][];

  // Balance fetch runs alongside the per-model pings — same cache window,
  // one extra HTTP call per refresh. Failure to read balance returns null
  // and is treated as "not low" so a transient billing-API outage doesn't
  // produce a misleading scary banner.
  const [balance, results] = await Promise.all([
    fetchBalance(apiKey),
    Promise.all(
      entries.map(
        async ([key, slug]) =>
          [key, await pingModel(slug, apiKey)] as const
      )
    ),
  ]);

  const balanceUsd = balance !== null ? balance / CENTS_PER_USD : null;

  const snapshot: HealthSnapshot = {
    minimax: "unavailable",
    "gpt-oss": "unavailable",
    llama: "unavailable",
    qwen3: "unavailable",
    creditsLow:
      balanceUsd !== null && balanceUsd < CREDITS_LOW_THRESHOLD_USD,
    checkedAt: new Date().toISOString(),
  };
  for (const [key, status] of results) {
    snapshot[key] = status;
  }

  console.log("[edgecloud-health]", {
    minimax: snapshot.minimax,
    "gpt-oss": snapshot["gpt-oss"],
    llama: snapshot.llama,
    qwen3: snapshot.qwen3,
    creditsLow: snapshot.creditsLow,
    // Logged to runtime logs only — never sent to the client.
    balanceCents: balance,
    balanceUsd: balanceUsd,
  });

  cached = { snapshot, expiresAt: now + CACHE_TTL_MS };
  return NextResponse.json(snapshot);
}
