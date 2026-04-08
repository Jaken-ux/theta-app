import { createSubchainAdapter } from "./subchain-factory";

/**
 * POGS subchain — digital collectibles and gaming.
 * Chain ID: tsub9065 — ~24.4M total txs.
 * NOTE: Chain appears inactive since March 18, 2026.
 * Adapter is included so it shows up if/when it resumes.
 */
export const pogsAdapter = createSubchainAdapter({
  subchainId: "9065",
  name: "POGS",
  description: "Digital entertainment and gaming collectibles.",
  weight: 0.3,
  inactiveSince: "March 2026",
  baselineTxPerDay: 100_000,
});
