import { NextResponse } from "next/server";
import { fetchNetworkStats, fetchActivitySnapshot } from "../../../../lib/theta-api";
import { getPool } from "../../../../lib/db";

function computeIndex(snap: {
  estimatedDailyTxs: number;
  tfuelVolume24h: number;
  userTxRate: number;
  totalNodes: number;
}): number {
  const txScore = (snap.estimatedDailyTxs / 42_000) * 100;
  const volumeScore = (snap.tfuelVolume24h / 12_000_000) * 100;
  const walletScore = (snap.userTxRate / 100) * 100;
  const nodeScore = (snap.totalNodes / 22_000) * 100;

  return Math.round(
    txScore * 0.4 + volumeScore * 0.15 + walletScore * 0.35 + nodeScore * 0.1
  );
}

// Known subchain/metachain endpoints to probe for availability
const SUBCHAIN_ENDPOINTS = [
  "https://explorer-api.thetatoken.org/api/subchain/transactions",
  "https://explorer-api.thetatoken.org/api/subchain/list",
  "https://explorer-api.thetatoken.org/api/metachain/transactions",
  "https://explorer-api.thetatoken.org/api/metachain/list",
  "https://explorer-api.thetatoken.org/api/subchain/transactions/number/24",
  "https://explorer-api.thetatoken.org/api/transactions/number/24?include_subchains=true",
];

async function checkSubchainApi(): Promise<boolean> {
  for (const url of SUBCHAIN_ENDPOINTS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        // Check if it returned meaningful data (not just an error message)
        if (data.body && !data.error) {
          return true;
        }
      }
    } catch {
      // Endpoint not available — continue
    }
  }
  return false;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, subchainAvailable] = await Promise.all([
      fetchNetworkStats(),
      checkSubchainApi(),
    ]);
    const snapshot = await fetchActivitySnapshot(stats);
    const score = computeIndex(snapshot);

    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO theta_activity_history (
        date, samples, total_score, average,
        daily_txs, tfuel_volume, wallet_activity, staking_nodes,
        theta_staking_ratio, tfuel_staking_ratio,
        theta_price, tfuel_price, theta_market_cap,
        tfuel_circulating_supply, daily_blocks,
        validator_guardian_nodes, edge_nodes, subchain_api_available
      ) VALUES ($1, 1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (date) DO UPDATE SET
         samples = theta_activity_history.samples + 1,
         total_score = theta_activity_history.total_score + $2,
         average = (theta_activity_history.total_score + $2) / (theta_activity_history.samples + 1),
         daily_txs = $3, tfuel_volume = $4, wallet_activity = $5, staking_nodes = $6,
         theta_staking_ratio = $7, tfuel_staking_ratio = $8,
         theta_price = $9, tfuel_price = $10, theta_market_cap = $11,
         tfuel_circulating_supply = $12, daily_blocks = $13,
         validator_guardian_nodes = $14, edge_nodes = $15,
         subchain_api_available = $16`,
      [
        today, score,
        snapshot.estimatedDailyTxs, snapshot.tfuelVolume24h,
        snapshot.userTxRate, snapshot.totalNodes,
        snapshot.thetaStakingRatio, snapshot.tfuelStakingRatio,
        snapshot.thetaPrice, snapshot.tfuelPrice, snapshot.thetaMarketCap,
        snapshot.tfuelCirculatingSupply, snapshot.dailyBlocks,
        snapshot.validatorGuardianNodes, snapshot.edgeNodes,
        subchainAvailable,
      ]
    );

    return NextResponse.json({
      ok: true,
      date: today,
      score,
      subchainApiAvailable: subchainAvailable,
    });
  } catch (error) {
    console.error("Cron activity fetch failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
