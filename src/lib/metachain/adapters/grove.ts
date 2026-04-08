import { createSubchainAdapter } from "./subchain-factory";

/**
 * Grove subchain — GroveWars Web3 gaming ecosystem.
 * Chain ID: tsub47683 — ~20.6M total txs.
 */
export const groveAdapter = createSubchainAdapter({
  subchainId: "47683",
  name: "Grove",
  description: "GroveWars Web3 gaming ecosystem.",
  weight: 0.4,
  baselineTxPerDay: 100_000,
});
