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
    // Main chain data
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
        w.date AS prev_date_val,
        w.average AS prev_score,
        w.daily_txs AS prev_txs,
        w.theta_price AS prev_theta_price,
        w.tfuel_price AS prev_tfuel_price,
        w.staking_nodes AS prev_nodes
      FROM recent r, week_ago w
    `);

    if (rows.length === 0) {
      return NextResponse.json({ available: false });
    }

    // Metachain composite score (current + 7 days ago)
    let metachainCurrent: number | null = null;
    let metachainPrev: number | null = null;
    try {
      const { rows: mcRows } = await pool.query(`
        WITH recent AS (
          SELECT composite_score, date FROM metachain_daily_scores ORDER BY date DESC LIMIT 1
        ),
        week_ago AS (
          SELECT composite_score FROM metachain_daily_scores
          WHERE date <= (SELECT date - INTERVAL '6 days' FROM recent)
          ORDER BY date DESC LIMIT 1
        )
        SELECT r.composite_score AS current_mc, w.composite_score AS prev_mc
        FROM recent r, week_ago w
      `);
      if (mcRows.length > 0) {
        metachainCurrent = mcRows[0].current_mc;
        metachainPrev = mcRows[0].prev_mc;
      }
    } catch {
      // metachain table may not exist yet
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
        metachainIndex: {
          current: metachainCurrent,
          change: metachainCurrent != null && metachainPrev != null
            ? absDiff(metachainCurrent, metachainPrev)
            : null,
        },
        dailyTxs: {
          current: r.current_txs,
          changePct: pctChange(r.current_txs, r.prev_txs),
        },
        stakingNodes: {
          current: r.current_nodes,
          change: absDiff(r.current_nodes, r.prev_nodes),
        },
      },
    });
  } catch (error) {
    console.error("Weekly summary failed:", error);
    return NextResponse.json({ available: false });
  }
}
