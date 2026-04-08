import type { ChainAdapter, ChainMetrics } from "../types";
import {
  fetchNetworkStats,
  fetchActivitySnapshot,
} from "../../theta-api";

/**
 * Main Chain adapter — Theta's settlement layer.
 *
 * Reuses the existing theta-api.ts functions to fetch transactions,
 * wallet activity, staking nodes, and TFUEL volume.
 *
 * Baselines (= score of 100):
 *   Transactions:    42,000 / day
 *   TFUEL volume:    $12M / 24h
 *   Wallet activity: 100% blocks with user txs
 *   Staking nodes:   22,000 participants
 */
const BASELINES = {
  txCount: 42_000,
  volume: 12_000_000,
  walletActivity: 100,
  stakingNodes: 22_000,
};

const WEIGHTS = {
  txCount: 0.4,
  volume: 0.15,
  walletActivity: 0.35,
  stakingNodes: 0.1,
};

export const mainChainAdapter: ChainAdapter = {
  id: "main-chain",
  name: "Main Chain",
  description:
    "Theta's settlement layer — staking, governance, cross-chain transfers, and native token movement.",
  weight: 1,

  async fetchMetrics(): Promise<ChainMetrics> {
    const stats = await fetchNetworkStats();
    const snapshot = await fetchActivitySnapshot(stats);

    return {
      chainId: "main-chain",
      chainName: "Main Chain",
      timestamp: new Date().toISOString(),
      txCount24h: snapshot.estimatedDailyTxs,
      activeWallets: Math.round(snapshot.userTxRate),
      volume24h: snapshot.tfuelVolume24h,
      custom: {
        walletActivityPct: snapshot.userTxRate,
        stakingNodes: snapshot.totalNodes,
        thetaPrice: snapshot.thetaPrice,
        tfuelPrice: snapshot.tfuelPrice,
      },
    };
  },

  normalize(metrics: ChainMetrics): number {
    const walletPct = metrics.custom?.walletActivityPct ?? 0;
    const nodes = metrics.custom?.stakingNodes ?? 0;

    const txScore = (metrics.txCount24h / BASELINES.txCount) * 100;
    const volumeScore = ((metrics.volume24h ?? 0) / BASELINES.volume) * 100;
    const walletScore = (walletPct / BASELINES.walletActivity) * 100;
    const nodeScore = (nodes / BASELINES.stakingNodes) * 100;

    return (
      txScore * WEIGHTS.txCount +
      volumeScore * WEIGHTS.volume +
      walletScore * WEIGHTS.walletActivity +
      nodeScore * WEIGHTS.stakingNodes
    );
  },
};
