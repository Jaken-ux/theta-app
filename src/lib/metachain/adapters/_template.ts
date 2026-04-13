/**
 * Template: copy this file to create a new subchain adapter.
 *
 * Steps:
 *   1. Copy this file → adapters/your-chain.ts
 *   2. Fill in id, name, description, weight
 *   3. Implement fetchMetrics() to call the chain's API
 *   4. Implement normalize() with your baselines
 *   5. Import and add to ADAPTERS array in registry.ts
 */

import type { ChainAdapter, ChainMetrics } from "../types";

const BASELINE_TX = 100_000; // adjust to chain's expected daily tx volume

export const yourChainAdapter: ChainAdapter = {
  id: "your-chain-id",
  name: "Your Chain Name",
  description: "What this chain does (e.g., AI compute, video delivery).",
  weight: 0.5, // relative weight vs other chains

  async fetchMetrics(): Promise<ChainMetrics> {
    // Fetch from the chain's RPC endpoint or explorer API
    // const res = await fetch("https://your-chain-explorer.example/api/stats");
    // const data = await res.json();

    return {
      chainId: "your-chain-id",
      chainName: "Your Chain Name",
      timestamp: new Date().toISOString(),
      txCount24h: 0, // replace with actual data
      activeWallets: 0,
      custom: {
        // Add chain-specific metrics here
      },
    };
  },

  normalize(metrics: ChainMetrics): number {
    // Simple baseline normalization: score 100 when tx count hits baseline
    return (metrics.txCount24h / BASELINE_TX) * 100;
  },
};
