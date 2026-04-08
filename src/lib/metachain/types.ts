/**
 * Metachain Utilization Index — extensible adapter system.
 *
 * Each chain (main chain, subchains, future chains) implements the
 * ChainAdapter interface. The registry collects all adapters and
 * computes a composite score. Adding a new chain = one new file +
 * one line in the registry. No refactoring needed.
 */

/** Raw metrics fetched from a single chain. */
export interface ChainMetrics {
  chainId: string;
  chainName: string;
  timestamp: string; // ISO 8601
  txCount24h: number;
  activeWallets?: number;
  volume24h?: number;
  blockCount24h?: number;
  /** Arbitrary chain-specific metrics (e.g., AI jobs, video relays). */
  custom?: Record<string, number>;
}

/** Normalized score (0–100+) for a single chain. */
export interface ChainScore {
  chainId: string;
  chainName: string;
  score: number;
  weight: number;
  metrics: ChainMetrics;
  available: boolean;
  error?: string;
}

/** Composite result across all chains. */
export interface CompositeResult {
  timestamp: string;
  compositeScore: number;
  chains: ChainScore[];
  chainCount: number;
}

/**
 * Every chain adapter must implement this interface.
 * To add a new chain:
 *   1. Create a file in adapters/
 *   2. Export a ChainAdapter
 *   3. Register it in registry.ts
 */
export interface ChainAdapter {
  /** Unique identifier (e.g., "main-chain", "tpulse", "lavita"). */
  id: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** Short description of what this chain does. */
  description: string;
  /** Relative weight in composite score (0–1). */
  weight: number;

  /** Fetch current metrics from external APIs. */
  fetchMetrics(): Promise<ChainMetrics>;

  /**
   * Normalize raw metrics to a 0–100 score (can exceed 100).
   * Each adapter defines its own baselines.
   */
  normalize(metrics: ChainMetrics): number;
}
