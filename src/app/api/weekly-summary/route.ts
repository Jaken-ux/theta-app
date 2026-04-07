import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const revalidate = 3600; // cache 1 hour

function pctChange(current: number, prev: number): number | null {
  if (!prev || !current) return null;
  return ((current - prev) / prev) * 100;
}

function absDiff(current: number, prev: number): number | null {
  if (current == null || prev == null) return null;
  return current - prev;
}

export async function GET() {
  try {
    const pool = await getPool();

    // Get the most recent entry and the entry ~7 days before it
    const { rows } = await pool.query(`
      WITH recent AS (
        SELECT * FROM theta_activity_history ORDER BY date DESC LIMIT 1
      ),
      week_ago AS (
        SELECT * FROM theta_activity_history
        WHERE date <= (SELECT date - INTERVAL '6 days' FROM recent)
        ORDER BY date DESC LIMIT 1
      )
      SELECT
        r.date AS current_date_val,
        r.average AS current_score,
        r.daily_txs AS current_txs,
        r.theta_price AS current_theta_price,
        r.tfuel_price AS current_tfuel_price,
        r.staking_nodes AS current_nodes,
        r.tfuel_volume AS current_volume,
        r.theta_staking_ratio AS current_theta_staking,
        r.tfuel_staking_ratio AS current_tfuel_staking,
        w.date AS prev_date_val,
        w.average AS prev_score,
        w.daily_txs AS prev_txs,
        w.theta_price AS prev_theta_price,
        w.tfuel_price AS prev_tfuel_price,
        w.staking_nodes AS prev_nodes,
        w.tfuel_volume AS prev_volume,
        w.theta_staking_ratio AS prev_theta_staking,
        w.tfuel_staking_ratio AS prev_tfuel_staking
      FROM recent r, week_ago w
    `);

    if (rows.length === 0) {
      return NextResponse.json({ available: false });
    }

    const r = rows[0];

    return NextResponse.json({
      available: true,
      periodStart: r.prev_date_val,
      periodEnd: r.current_date_val,
      metrics: {
        activityIndex: {
          current: r.current_score,
          change: absDiff(r.current_score, r.prev_score),
        },
        thetaPrice: {
          current: r.current_theta_price,
          changePct: pctChange(r.current_theta_price, r.prev_theta_price),
        },
        tfuelPrice: {
          current: r.current_tfuel_price,
          changePct: pctChange(r.current_tfuel_price, r.prev_tfuel_price),
        },
        dailyTxs: {
          current: r.current_txs,
          changePct: pctChange(r.current_txs, r.prev_txs),
        },
        stakingNodes: {
          current: r.current_nodes,
          change: absDiff(r.current_nodes, r.prev_nodes),
        },
        tfuelVolume: {
          current: r.current_volume,
          changePct: pctChange(r.current_volume, r.prev_volume),
        },
      },
    });
  } catch (error) {
    console.error("Weekly summary failed:", error);
    return NextResponse.json({ available: false });
  }
}
