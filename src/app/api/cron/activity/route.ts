import { NextResponse } from "next/server";
import { fetchNetworkStats, fetchActivitySnapshot } from "../../../../lib/theta-api";
import { getPool } from "../../../../lib/db";

function computeIndex(snap: {
  estimatedDailyTxs: number;
  tfuelVolume24h: number;
  userTxRate: number;
  totalNodes: number;
}): number {
  const txScore = (snap.estimatedDailyTxs / 30_000) * 100;
  const volumeScore = (snap.tfuelVolume24h / 10_000_000) * 100;
  const walletScore = (snap.userTxRate / 30) * 100;
  const nodeScore = (snap.totalNodes / 15_000) * 100;

  return Math.round(
    txScore * 0.3 + volumeScore * 0.3 + walletScore * 0.2 + nodeScore * 0.2
  );
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await fetchNetworkStats();
    const snapshot = await fetchActivitySnapshot(stats);
    const score = computeIndex(snapshot);

    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO theta_activity_history (date, samples, total_score, average, daily_txs, tfuel_volume, wallet_activity, staking_nodes, theta_staking_ratio, tfuel_staking_ratio)
       VALUES ($1, 1, $2, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (date) DO UPDATE SET
         samples = theta_activity_history.samples + 1,
         total_score = theta_activity_history.total_score + $2,
         average = (theta_activity_history.total_score + $2) / (theta_activity_history.samples + 1),
         daily_txs = $3,
         tfuel_volume = $4,
         wallet_activity = $5,
         staking_nodes = $6,
         theta_staking_ratio = $7,
         tfuel_staking_ratio = $8`,
      [
        today,
        score,
        snapshot.estimatedDailyTxs,
        snapshot.tfuelVolume24h,
        snapshot.userTxRate,
        snapshot.totalNodes,
        snapshot.thetaStakingRatio,
        snapshot.tfuelStakingRatio,
      ]
    );

    return NextResponse.json({ ok: true, date: today, score });
  } catch (error) {
    console.error("Cron activity fetch failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
