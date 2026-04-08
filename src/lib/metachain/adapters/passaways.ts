import { createSubchainAdapter } from "./subchain-factory";

/**
 * Passaways subchain — PLASM gaming ecosystem.
 * Chain ID: tsub7734 — ~61.6M total txs, highest of all subchains.
 */
export const passawaysAdapter = createSubchainAdapter({
  subchainId: "7734",
  name: "Passaways",
  description: "PLASM gaming and digital entertainment ecosystem.",
  weight: 0.5,
  baselineTxPerDay: 200_000,
});
