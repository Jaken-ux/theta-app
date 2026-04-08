import type { ChainAdapter, ChainScore, CompositeResult } from "./types";
import { mainChainAdapter } from "./adapters/main-chain";
import { lavitaAdapter } from "./adapters/lavita";
import { tpulseAdapter } from "./adapters/tpulse";
import { passawaysAdapter } from "./adapters/passaways";
import { groveAdapter } from "./adapters/grove";
import { pogsAdapter } from "./adapters/pogs";
import { proxyIndicatorsAdapter } from "./adapters/proxy-indicators";

/**
 * Chain registry — the single place where adapters are registered.
 *
 * To add a new subchain:
 *   1. Create an adapter in adapters/your-chain.ts
 *   2. Import and add it to the ADAPTERS array below
 *
 * Weights are automatically re-normalized so they always sum to 1.
 */
const ADAPTERS: ChainAdapter[] = [
  mainChainAdapter,
  lavitaAdapter,
  tpulseAdapter,
  passawaysAdapter,
  groveAdapter,
  pogsAdapter,
  proxyIndicatorsAdapter,
  // ── Add new adapters here ──────────────────────────────────
  // ──────────────────────────────────────────────────────────
];

/** Fetch metrics from all registered adapters in parallel. */
export async function fetchAllChains(): Promise<CompositeResult> {
  const totalWeight = ADAPTERS.reduce((s, a) => s + a.weight, 0);

  const settled = await Promise.allSettled(
    ADAPTERS.map(async (adapter): Promise<ChainScore> => {
      const metrics = await adapter.fetchMetrics();
      const score = adapter.normalize(metrics);
      const normalizedWeight = adapter.weight / totalWeight;
      return {
        chainId: adapter.id,
        chainName: adapter.name,
        score,
        weight: normalizedWeight,
        metrics,
        available: true,
        inactiveSince: adapter.inactiveSince,
      };
    })
  );

  const chains: ChainScore[] = settled.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    // Chain failed — include it with score 0 so UI can show the error
    return {
      chainId: ADAPTERS[i].id,
      chainName: ADAPTERS[i].name,
      score: 0,
      weight: ADAPTERS[i].weight / totalWeight,
      metrics: {
        chainId: ADAPTERS[i].id,
        chainName: ADAPTERS[i].name,
        timestamp: new Date().toISOString(),
        txCount24h: 0,
      },
      available: false,
      error: String(result.reason),
    };
  });

  // Composite = weighted average of available chains only
  const availableChains = chains.filter((c) => c.available);
  const availableWeight = availableChains.reduce((s, c) => s + c.weight, 0);
  const compositeScore =
    availableWeight > 0
      ? availableChains.reduce(
          (sum, c) => sum + c.score * (c.weight / availableWeight),
          0
        )
      : 0;

  return {
    timestamp: new Date().toISOString(),
    compositeScore: Math.round(compositeScore * 10) / 10,
    chains,
    chainCount: ADAPTERS.length,
  };
}

/** Get metadata about all registered adapters (no fetching). */
export function getRegisteredChains() {
  return ADAPTERS.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    weight: a.weight,
  }));
}
