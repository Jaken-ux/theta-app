import type { ChainAdapter, ChainMetrics } from "../types";

/**
 * Proxy Indicators adapter — signals of subchain ecosystem growth
 * visible on the main chain.
 *
 * These metrics don't measure a single chain — they measure how much
 * the multi-chain ecosystem is expanding. All data comes from main
 * chain contracts:
 *
 *   1. Registered subchain count (ChainRegistrar contract)
 *   2. Cross-chain transfer activity (Token Bank contracts)
 *   3. Subchain collateral activity (wTHETA + ChainRegistrar txs)
 *
 * Baselines (= score of 100):
 *   Subchain count:      15 registered chains
 *   Cross-chain txs:     1,000 total Token Bank interactions
 *   Collateral activity: 30,000 ChainRegistrar interactions
 */

const ETH_RPC = "https://eth-rpc-api.thetatoken.org/rpc";
const EXPLORER_API = "https://explorer-api.thetatoken.org/api";

// Contract addresses (mainnet)
const CHAIN_REGISTRAR = "0xb164c26fd7970746639151a8C118cce282F272A7";
const TOKEN_BANKS = [
  "0xf83239088B8766a27cD1f46772a2E1f88e916322", // TFuelTokenBank
  "0xB3d93735de018Ad48122bf7394734A7d18007e1b", // TNT20TokenBank
  "0xFe2d1bE6bD9d342cfa59e75290F9b0B42cdBCDAF", // TNT721TokenBank
  "0xA31168d669112937B0826b1Bf15f0eb12e6B1542", // TNT1155TokenBank
];

const BASELINES = {
  subchainCount: 15,
  crossChainTxs: 1_000,
  collateralActivity: 30_000,
};

const WEIGHTS = {
  subchainCount: 0.35,
  crossChainTxs: 0.35,
  collateralActivity: 0.30,
};

/** Call a read-only smart contract method via ETH RPC. */
async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(ETH_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to, data }, "latest"],
      id: 1,
    }),
    next: { revalidate: 300 }, // cache 5 min — these change slowly
  });
  const json = await res.json();
  return json.result ?? "0x";
}

/** Get txs_counter (type-7 smart contract interactions) for an account. */
async function getTxCount(address: string): Promise<number> {
  const res = await fetch(`${EXPLORER_API}/account/${address}`, {
    next: { revalidate: 300 },
  });
  const json = await res.json();
  // txs_counter is an object with tx types as keys
  const counter = json?.body?.txs_counter;
  if (!counter) return 0;
  // Type 7 = smart contract interactions
  return counter["7"] ?? 0;
}

export const proxyIndicatorsAdapter: ChainAdapter = {
  id: "proxy-indicators",
  name: "Ecosystem Growth",
  description:
    "Proxy signals for multi-chain expansion: subchain registrations, cross-chain transfers, and validator collateral activity.",
  weight: 0.5,

  async fetchMetrics(): Promise<ChainMetrics> {
    // 1. Count registered subchains via ChainRegistrar.getAllSubchainIDs()
    //    Function selector: 0x13b38499
    let subchainCount = 0;
    try {
      const result = await ethCall(CHAIN_REGISTRAR, "0x13b38499");
      // ABI-encoded dynamic array: skip first 64 hex chars (offset),
      // next 64 hex chars = array length
      if (result.length >= 130) {
        subchainCount = parseInt(result.slice(66, 130), 16);
      }
    } catch {
      // Contract call failed — use 0
    }

    // 2. Cross-chain transfer count from Token Bank contracts
    //    Fetch txs_counter for each bank in parallel (with small delays to avoid rate limit)
    let crossChainTxs = 0;
    try {
      const counts = await Promise.all(
        TOKEN_BANKS.map((addr) => getTxCount(addr).catch(() => 0))
      );
      crossChainTxs = counts.reduce((sum, c) => sum + c, 0);
    } catch {
      // Failed — use 0
    }

    // 3. ChainRegistrar interaction count (proxy for staking/collateral changes)
    let collateralActivity = 0;
    try {
      collateralActivity = await getTxCount(CHAIN_REGISTRAR);
    } catch {
      // Failed — use 0
    }

    return {
      chainId: "proxy-indicators",
      chainName: "Ecosystem Growth",
      timestamp: new Date().toISOString(),
      txCount24h: crossChainTxs, // cumulative, not daily — normalized differently
      custom: {
        subchainCount,
        crossChainTxs,
        collateralActivity,
      },
    };
  },

  normalize(metrics: ChainMetrics): number {
    const sc = metrics.custom?.subchainCount ?? 0;
    const cct = metrics.custom?.crossChainTxs ?? 0;
    const ca = metrics.custom?.collateralActivity ?? 0;

    const subchainScore = (sc / BASELINES.subchainCount) * 100;
    const crossChainScore = (cct / BASELINES.crossChainTxs) * 100;
    const collateralScore = (ca / BASELINES.collateralActivity) * 100;

    return (
      subchainScore * WEIGHTS.subchainCount +
      crossChainScore * WEIGHTS.crossChainTxs +
      collateralScore * WEIGHTS.collateralActivity
    );
  },
};
