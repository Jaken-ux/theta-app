import type { ChainAdapter, ChainMetrics } from "../types";

/**
 * POGS subchain — digital collectibles and gaming.
 * Chain ID: tsub9065 — ~24.4M total txs.
 *
 * POGS has been inactive since March 2026. This adapter fetches its
 * latest block and, if the most recent block is older than 30 days,
 * marks the chain as offline and flags it for exclusion from the
 * composite score.
 */

const SUBCHAIN_ID = "9065";
const BASE_URL = `https://tsub${SUBCHAIN_ID}-explorer-api.thetatoken.org/api`;
const BASELINE_TX_PER_DAY = 100_000;
const INACTIVITY_THRESHOLD_DAYS = 30;
const BLOCK_TIME_SECONDS = 2;
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS);

export const pogsAdapter: ChainAdapter = {
  id: `tsub${SUBCHAIN_ID}`,
  name: "POGS",
  description: "Digital entertainment and gaming collectibles.",
  weight: 0.3,
  inactiveSince: "March 2026",

  async fetchMetrics(): Promise<ChainMetrics> {
    const [txRes, blocksRes] = await Promise.all([
      fetch(`${BASE_URL}/transactions/number`, { next: { revalidate: 60 } }),
      fetch(`${BASE_URL}/blocks/top_blocks?pageNumber=1&limit=100`, {
        next: { revalidate: 60 },
      }),
    ]);

    const txJson = await txRes.json();
    const totalTxs: number = txJson?.body?.total_num_tx ?? 0;

    const blocksJson = await blocksRes.json();
    const blocks: { num_txs: number; timestamp: string }[] =
      blocksJson?.body ?? [];

    // Estimate 24h tx count from recent block rate
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

    const blocksWithUserTx = blocks.filter((b) => b.num_txs > 1).length;
    const walletActivityPct =
      blocks.length > 0 ? (blocksWithUserTx / blocks.length) * 100 : 0;

    // Check whether the most recent block is older than 30 days
    const latestTs = blocks.length > 0 ? Number(blocks[0].timestamp) : 0;
    const nowSec = Math.floor(Date.now() / 1000);
    const ageDays = latestTs > 0 ? (nowSec - latestTs) / 86400 : Infinity;
    const isOffline = ageDays > INACTIVITY_THRESHOLD_DAYS;
    const isActive = latestTs > 0 && nowSec - latestTs < 86400;

    return {
      chainId: `tsub${SUBCHAIN_ID}`,
      chainName: "POGS",
      timestamp: new Date().toISOString(),
      txCount24h: estimatedDailyTxs,
      blockCount24h: isActive ? BLOCKS_PER_DAY : 0,
      custom: {
        totalTxs,
        walletActivityPct,
        blocksWithUserTx,
        blocksSampled: blocks.length,
        isActive: isActive ? 1 : 0,
        isOffline: isOffline ? 1 : 0,
        lastBlockTs: latestTs,
        lastBlockAgeDays: Math.round(ageDays * 10) / 10,
      },
    };
  },

  normalize(metrics: ChainMetrics): number {
    return (metrics.txCount24h / BASELINE_TX_PER_DAY) * 100;
  },
};
