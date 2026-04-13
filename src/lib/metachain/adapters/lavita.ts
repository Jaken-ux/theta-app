import { createSubchainAdapter } from "./subchain-factory";

/**
 * Lavita AI subchain — health/genomics AI data marketplace.
 * Chain ID: tsub360890 — ~57.8M total txs, very active.
 */
export const lavitaAdapter = createSubchainAdapter({
  subchainId: "360890",
  name: "Lavita AI",
  description: "Health AI research and genomics data marketplace.",
  weight: 0.7,
  baselineTxPerDay: 100_000,
});
