import { createSubchainAdapter } from "./subchain-factory";

/**
 * TPulse subchain — EdgeCloud transparency and AI compute metrics.
 * Chain ID: tsub68967 — ~10.7M total txs.
 */
export const tpulseAdapter = createSubchainAdapter({
  subchainId: "68967",
  name: "TPulse",
  description: "EdgeCloud transparency — tracks AI compute jobs and node activity.",
  weight: 0.6,
  baselineTxPerDay: 50_000,
});
