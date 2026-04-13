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

interface ActivityRow {
  date: string;
  average: number | null;
  daily_txs: number | null;
  theta_price: number | null;
  tfuel_price: number | null;
  staking_nodes: number | null;
}

interface MetachainRow {
  date: string;
  composite_score: number | null;
}

function seriesOf<T>(rows: T[], key: keyof T): (number | null)[] {
  return rows.map((r) => {
    const v = r[key];
    return typeof v === "number" ? v : v == null ? null : Number(v);
  });
}

export async function GET() {
  try {
    const pool = await getPool();

    // Fetch the last 7 days of main-chain history in chronological order
    const { rows: activityRows } = await pool.query(`
      SELECT date, average, daily_txs, theta_price, tfuel_price, staking_nodes
      FROM theta_activity_history
      ORDER BY date DESC
      LIMIT 7
    `);

    if (activityRows.length === 0) {
      return NextResponse.json({ available: false });
    }

    // Oldest → newest for sparkline rendering
    const activity: ActivityRow[] = (activityRows as ActivityRow[]).slice().reverse();
    const latest = activity[activity.length - 1];
    const earliest = activity[0];

    // Metachain composite history over the same window
    let metachain: MetachainRow[] = [];
    try {
      const { rows: mcRows } = await pool.query(`
        SELECT date, composite_score
        FROM metachain_daily_scores
        ORDER BY date DESC
        LIMIT 7
      `);
      metachain = (mcRows as MetachainRow[]).slice().reverse();
    } catch {
      // table may not exist yet
    }

    const metachainCurrent =
      metachain.length > 0 ? metachain[metachain.length - 1].composite_score : null;
    const metachainPrev =
      metachain.length > 0 ? metachain[0].composite_score : null;

    return NextResponse.json({
      available: true,
      periodStart: earliest.date,
      periodEnd: latest.date,
      metrics: {
        activityIndex: {
          current: latest.average,
          change:
            latest.average != null && earliest.average != null
              ? absDiff(latest.average, earliest.average)
              : null,
          series: seriesOf(activity, "average"),
        },
        thetaPrice: {
          current: latest.theta_price,
          changePct:
            latest.theta_price != null && earliest.theta_price != null
              ? pctChange(latest.theta_price, earliest.theta_price)
              : null,
          series: seriesOf(activity, "theta_price"),
        },
        tfuelPrice: {
          current: latest.tfuel_price,
          changePct:
            latest.tfuel_price != null && earliest.tfuel_price != null
              ? pctChange(latest.tfuel_price, earliest.tfuel_price)
              : null,
          series: seriesOf(activity, "tfuel_price"),
        },
        metachainIndex: {
          current: metachainCurrent,
          change:
            metachainCurrent != null && metachainPrev != null
              ? absDiff(metachainCurrent, metachainPrev)
              : null,
          series: seriesOf(metachain, "composite_score"),
        },
        dailyTxs: {
          current: latest.daily_txs,
          changePct:
            latest.daily_txs != null && earliest.daily_txs != null
              ? pctChange(latest.daily_txs, earliest.daily_txs)
              : null,
          series: seriesOf(activity, "daily_txs"),
        },
        stakingNodes: {
          current: latest.staking_nodes,
          change:
            latest.staking_nodes != null && earliest.staking_nodes != null
              ? absDiff(latest.staking_nodes, earliest.staking_nodes)
              : null,
          series: seriesOf(activity, "staking_nodes"),
        },
      },
    });
  } catch (error) {
    console.error("Weekly summary failed:", error);
    return NextResponse.json({ available: false });
  }
}
