import type { ChainAdapter, ChainMetrics } from "../types";
import { getPool } from "../../db";
import {
  countParticipants,
  countReverted,
  CROSSCHAIN_CONTRACTS,
  COLLATERAL_CONTRACT,
  ensureBridgeLogSchema,
  readBackfillStatus,
  V2,
} from "../bridge-log";
import { ECOSYSTEM_GROWTH_V2_START as V2_START } from "../v2-config";

/**
 * Proxy Indicators adapter — signals of subchain ecosystem growth
 * visible on the main chain.
 *
 * ── v2 change (2026-08-31) ────────────────────────────────────────
 * The two on-chain-counter inputs (crossChainTxs, collateralActivity)
 * were replaced with rolling-30-day unique-participant counts. The
 * cumulative counters they replaced were pumpable by a single
 * spamming address, and — because the counter never decreased —
 * inflation stayed locked in after the spammer stopped. v2 counts
 * only unique addresses that made >= 5 SUCCESSFUL txs in the last
 * 30 days, so a single spammer contributes 1 (or 0 if all reverted),
 * and old activity ages out of the window.
 *
 * The raw tx data comes from a local Postgres cache
 * (metachain_bridge_tx_log) populated incrementally by the daily
 * cron. See participants.ts for the runner and bridge-log.ts for
 * the schema + tally SQL.
 *
 * subchainCount is unchanged — it's a live RPC read of registered
 * chain count from ChainRegistrar, not a pumpable counter.
 *
 * TIER-3 TODO (separate ticket): the main-chain and subchain
 * adapters use block-level num_txs from windowed rate estimates.
 * These are revert-blind (block num_txs includes reverted txs) and
 * concentration-pumpable. Same failure mode as v1 EG, but
 * auto-decaying. Not urgent — but note that main-chain's
 * walletActivityPct already produced a proven transient spike on
 * 2026-07-15, so this is real risk, not just structural. Design a
 * shared per-tx revert filter + unique-sender helper there and
 * reuse participants.ts.
 */

const ETH_RPC = "https://eth-rpc-api.thetatoken.org/rpc";
const CHAIN_REGISTRAR = COLLATERAL_CONTRACT;

/**
 * Deploy date of the v2 metric. Re-exported from v2-config.ts so
 * both server and client can reach it (see comment in v2-config.ts
 * about why the constant lives in a leaf file).
 */
export const ECOSYSTEM_GROWTH_V2_START = V2_START;

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
    next: { revalidate: 300 },
  });
  const json = await res.json();
  return json.result ?? "0x";
}

export const proxyIndicatorsAdapter: ChainAdapter = {
  id: "proxy-indicators",
  name: "Ecosystem Growth",
  description:
    "v2: subchain registrations + unique 30-day cross-chain and collateral participants (successful txs only, ≥5 per participant).",
  weight: 0.5,

  async fetchMetrics(): Promise<ChainMetrics> {
    // 1. Live: registered subchain count (state read, not a counter — safe)
    let subchainCount = 0;
    try {
      const result = await ethCall(CHAIN_REGISTRAR, "0x13b38499");
      if (result.length >= 130) {
        subchainCount = parseInt(result.slice(66, 130), 16);
      }
    } catch {
      // fall through with 0
    }

    // 2 + 3. Participants from local incremental cache
    const pool = await getPool();
    await ensureBridgeLogSchema(pool);

    const [
      crossChainParticipants,
      crossChainReverted,
      collateralParticipants,
      collateralReverted,
      backfillStatus,
    ] = await Promise.all([
      countParticipants(pool, CROSSCHAIN_CONTRACTS),
      countReverted(pool, CROSSCHAIN_CONTRACTS),
      countParticipants(pool, [COLLATERAL_CONTRACT]),
      countReverted(pool, [COLLATERAL_CONTRACT]),
      readBackfillStatus(pool),
    ]);

    return {
      chainId: "proxy-indicators",
      chainName: "Ecosystem Growth",
      timestamp: new Date().toISOString(),
      // txCount24h historically counted crossChainTxs (cumulative). We
      // now use it for the reverted-tx footnote total across all
      // tracked bridge contracts — informational only, not scored.
      txCount24h: crossChainReverted + collateralReverted,
      custom: {
        subchainCount,
        crossChainParticipants,
        crossChainReverted,
        collateralParticipants,
        collateralReverted,
        // Numeric version marker: 2 = v2. The dated boundary label
        // lives in the exported ECOSYSTEM_GROWTH_V2_START constant so
        // both the chart and info modal can reference it.
        metricVersion: 2,
        backfillComplete: backfillStatus.complete ? 1 : 0,
        backfillDaysCovered: backfillStatus.daysCovered,
      },
    };
  },

  normalize(metrics: ChainMetrics): number {
    const sc = Number(metrics.custom?.subchainCount ?? 0);
    const ccp = Number(metrics.custom?.crossChainParticipants ?? 0);
    const cop = Number(metrics.custom?.collateralParticipants ?? 0);

    const subchainScore =
      (sc / V2.BASELINE_SUBCHAIN_COUNT) * 100 * V2.WEIGHT_SUBCHAIN_COUNT;
    const crossChainScore =
      (ccp / V2.BASELINE_CROSSCHAIN_PARTICIPANTS) *
      100 *
      V2.WEIGHT_CROSSCHAIN;
    const collateralScore =
      (cop / V2.BASELINE_COLLATERAL_PARTICIPANTS) *
      100 *
      V2.WEIGHT_COLLATERAL;

    return subchainScore + crossChainScore + collateralScore;
  },
};
