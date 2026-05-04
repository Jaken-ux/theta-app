/**
 * EdgeCloud vs hyperscaler pricing comparison data.
 *
 * Why this is a hand-curated constants file rather than a live fetch:
 *
 *   - Theta EdgeCloud does not expose a public pricing API. The
 *     frontend at thetaedgecloud.com fetches pricing via an
 *     auth-gated endpoint (api.thetaedgecloud.com returns 303 to
 *     login on every probe). Reading it would require running an
 *     authenticated session — overkill for a number that changes
 *     every few months.
 *
 *   - AWS / Azure / Google Cloud do not publish a single
 *     "representative inference price" — pricing is per-SKU across
 *     dozens of models on Bedrock / Azure OpenAI / Vertex AI. The
 *     ranges below are hand-picked to compare similar-class models;
 *     auto-fetching specific SKUs would make the table more precise
 *     but less honest as a comparison.
 *
 * Maintenance: review quarterly, bump `lastVerified` per row when
 * confirmed against the source URL. The /api/admin/verify-pricing-sources
 * route can be hit by a cron job to confirm the source URLs still resolve
 * (it does NOT auto-update the numbers).
 */

export interface PricingRow {
  label: string;
  theta: string;
  aws: string;
  azure: string;
  gcp: string;
  /** ISO date (YYYY-MM-DD) when the values in this row were last verified by hand. */
  lastVerified: string;
}

export interface PricingSource {
  name: string;
  url: string;
}

export const PRICING_ROWS: PricingRow[] = [
  {
    label: "LLM inference",
    theta: "$0.20–0.40 / M tokens",
    aws: "~$1–3 / M",
    azure: "~$1–3 / M",
    gcp: "~$1–2 / M",
    lastVerified: "2026-04-28",
  },
  {
    label: "GPU hourly",
    theta: "Set by operators",
    aws: "$2–8 / hr",
    azure: "$2–6 / hr",
    gcp: "$1–5 / hr",
    lastVerified: "2026-04-28",
  },
  {
    label: "Cashback",
    theta: "5% in TDROP",
    aws: "None",
    azure: "None",
    gcp: "None",
    lastVerified: "2026-04-28",
  },
  {
    label: "Min commit",
    theta: "Pay as you go",
    aws: "Pay as you go",
    azure: "Pay as you go",
    gcp: "Pay as you go",
    lastVerified: "2026-04-28",
  },
];

export const PRICING_SOURCES: PricingSource[] = [
  { name: "Theta Labs", url: "https://www.thetaedgecloud.com/pricing" },
  { name: "AWS Bedrock", url: "https://aws.amazon.com/bedrock/pricing/" },
  {
    name: "Azure AI Foundry",
    url: "https://azure.microsoft.com/en-us/pricing/details/ai-foundry/",
  },
  {
    name: "Google Vertex AI",
    url: "https://cloud.google.com/vertex-ai/generative-ai/pricing",
  },
];

/** Newest verification date across all rows. */
export function lastVerifiedDate(): string {
  const dates = PRICING_ROWS.map((r) => r.lastVerified).sort();
  return dates[dates.length - 1];
}
