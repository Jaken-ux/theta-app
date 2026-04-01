import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT date, samples, average, daily_txs, tfuel_volume, wallet_activity, staking_nodes,
              theta_staking_ratio, tfuel_staking_ratio, theta_price, tfuel_price,
              theta_market_cap, tfuel_circulating_supply, daily_blocks,
              validator_guardian_nodes, edge_nodes
       FROM theta_activity_history
       ORDER BY date ASC
       LIMIT 90`
    );

    const history = result.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      score: row.average,
      sampleCount: row.samples,
      metrics: {
        dailyTxs: row.daily_txs,
        tfuelVolume: row.tfuel_volume,
        walletActivity: row.wallet_activity,
        stakingNodes: row.staking_nodes,
        thetaStakingRatio: row.theta_staking_ratio,
        tfuelStakingRatio: row.tfuel_staking_ratio,
        thetaPrice: row.theta_price,
        tfuelPrice: row.tfuel_price,
        thetaMarketCap: row.theta_market_cap,
        tfuelCirculatingSupply: row.tfuel_circulating_supply,
        dailyBlocks: row.daily_blocks,
        validatorGuardianNodes: row.validator_guardian_nodes,
        edgeNodes: row.edge_nodes,
      },
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch activity history:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { score, metrics } = await request.json();

    if (typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);

    const dailyTxs = metrics?.dailyTxs ?? null;
    const tfuelVolume = metrics?.tfuelVolume ?? null;
    const walletActivity = metrics?.walletActivity ?? null;
    const stakingNodes = metrics?.stakingNodes ?? null;
    const thetaStakingRatio = metrics?.thetaStakingRatio ?? null;
    const tfuelStakingRatio = metrics?.tfuelStakingRatio ?? null;

    await pool.query(
      `INSERT INTO theta_activity_history (date, samples, total_score, average, daily_txs, tfuel_volume, wallet_activity, staking_nodes, theta_staking_ratio, tfuel_staking_ratio)
       VALUES ($1, 1, $2, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (date) DO UPDATE SET
         samples = theta_activity_history.samples + 1,
         total_score = theta_activity_history.total_score + $2,
         average = (theta_activity_history.total_score + $2) / (theta_activity_history.samples + 1),
         daily_txs = COALESCE($3, theta_activity_history.daily_txs),
         tfuel_volume = COALESCE($4, theta_activity_history.tfuel_volume),
         wallet_activity = COALESCE($5, theta_activity_history.wallet_activity),
         staking_nodes = COALESCE($6, theta_activity_history.staking_nodes),
         theta_staking_ratio = COALESCE($7, theta_activity_history.theta_staking_ratio),
         tfuel_staking_ratio = COALESCE($8, theta_activity_history.tfuel_staking_ratio)`,
      [today, score, dailyTxs, tfuelVolume, walletActivity, stakingNodes, thetaStakingRatio, tfuelStakingRatio]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save activity score:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
