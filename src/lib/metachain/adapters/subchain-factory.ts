import type { ChainAdapter, ChainMetrics } from "../types";

/**
 * Factory for Theta subchain adapters.
 *
 * All Theta subchains follow the same explorer API pattern:
 *   https://tsub{ID}-explorer-api.thetatoken.org/api/...
 *
 * This factory creates an adapter from a simple config object.
 * To add a new subchain, just call createSubchainAdapter() with
 * its ID, name, and baselines.
 */

interface SubchainConfig {
  /** Subchain ID, e.g., "360890" for Lavita. */
  subchainId: string;
  /** Human-readable name. */
  name: string;
  /** What this chain does. */
  description: string;
  /** Relative weight in composite score. */
  weight: number;
  /** If set, marks chain as inactive since this date. */
  inactiveSince?: string;
  /** Baseline daily tx count for score normalization. */
  baselineTxPerDay: number;
}

const BLOCK_TIME_SECONDS = 2; // ~2s per block on most subchains
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS);

export function createSubchainAdapter(config: SubchainConfig): ChainAdapter {
  const baseUrl = `https://tsub${config.subchainId}-explorer-api.thetatoken.org/api`;

  return {
    id: `tsub${config.subchainId}`,
    name: config.name,
    description: config.description,
    weight: config.weight,
    inactiveSince: config.inactiveSince,

    async fetchMetrics(): Promise<ChainMetrics> {
      // Fetch tx count and recent blocks in parallel
      const [txRes, blocksRes] = await Promise.all([
        fetch(`${baseUrl}/transactions/number`, { next: { revalidate: 60 } }),
        fetch(`${baseUrl}/blocks/top_blocks?pageNumber=1&limit=100`, {
          next: { revalidate: 60 },
        }),
      ]);

      const txJson = await txRes.json();
      const totalTxs: number = txJson?.body?.total_num_tx ?? 0;

      const blocksJson = await blocksRes.json();
      const blocks: { num_txs: number; timestamp: string }[] =
        blocksJson?.body ?? [];

      // Estimate 24h tx count from recent block rate
      // Timestamps are Unix seconds (string), not ISO dates
      let estimatedDailyTxs = 0;
      if (blocks.length >= 2) {
        const newestTs = Number(blocks[0].timestamp);
        const oldestTs = Number(blocks[blocks.length - 1].timestamp);
        const timespanSec = Math.abs(newestTs - oldestTs);

        if (timespanSec > 0) {
          const txsInSpan = blocks.reduce((sum, b) => sum + (b.num_txs ?? 0), 0);
          estimatedDailyTxs = Math.round((txsInSpan / timespanSec) * 86400);
        }
      }

      // Count blocks with user transactions (more than just the block proposal)
      const blocksWithUserTx = blocks.filter((b) => b.num_txs > 1).length;
      const walletActivityPct =
        blocks.length > 0
          ? (blocksWithUserTx / blocks.length) * 100
          : 0;

      // Check if chain is active (latest block within last 24h)
      const latestTs = blocks.length > 0 ? Number(blocks[0].timestamp) : 0;
      const nowSec = Math.floor(Date.now() / 1000);
      const isActive = latestTs > 0 && nowSec - latestTs < 86400;

      return {
        chainId: `tsub${config.subchainId}`,
        chainName: config.name,
        timestamp: new Date().toISOString(),
        txCount24h: estimatedDailyTxs,
        blockCount24h: isActive ? BLOCKS_PER_DAY : 0,
        custom: {
          totalTxs,
          walletActivityPct,
          blocksWithUserTx,
          blocksSampled: blocks.length,
          isActive: isActive ? 1 : 0,
          lastBlockAge: nowSec - latestTs,
        },
      };
    },

    normalize(metrics: ChainMetrics): number {
      return (metrics.txCount24h / config.baselineTxPerDay) * 100;
    },
  };
}
