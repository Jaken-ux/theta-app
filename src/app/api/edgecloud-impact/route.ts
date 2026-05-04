import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { computeTfuelEconomics } from "../../../lib/tfuel-economics";

export const dynamic = "force-dynamic";

const BASELINE_START = "2026-04-13";
const BASELINE_END = "2026-04-19";
const LAUNCH_DATE = "2026-04-20";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = await getPool();

    // TPulse daily txs from metachain_metrics
    const { rows: tpulseRows } = await pool.query(
      `SELECT date, tx_count_24h
       FROM metachain_metrics
       WHERE chain_id = 'tsub68967'
         AND date >= $1
         AND tx_count_24h > 0
       ORDER BY date ASC`,
      [BASELINE_START]
    );

    // TFUEL supply for absorption calculation
    const { rows: supplyRows } = await pool.query(
      `SELECT date, tfuel_circulating_supply
       FROM theta_activity_history
       WHERE tfuel_circulating_supply IS NOT NULL
         AND date >= ($1::date - INTERVAL '2 days')
       ORDER BY date ASC`,
      [BASELINE_START]
    );

    // Build TPulse trend
    const tpulseTrend = tpulseRows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      txs: r.tx_count_24h as number,
    }));

    // Reuse the same 2-day-smoothed absorption logic that the dashboard uses,
    // so the impact tracker shows the same numbers as the main chart.
    const economics = computeTfuelEconomics(
      supplyRows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        supply: Number(r.tfuel_circulating_supply),
      }))
    );
    const absorptionTrend = economics.dailyEntries
      .filter((e) => e.date >= BASELINE_START)
      .map((e) => ({
        date: e.date,
        rate: Math.round(e.absorptionRate * 1000) / 10,
        artifact: e.isDataArtifact,
      }));

    // Split into baseline and post-launch
    const tpulseBaseline = tpulseTrend.filter(
      (d) => d.date >= BASELINE_START && d.date <= BASELINE_END
    );
    const tpulsePost = tpulseTrend.filter((d) => d.date >= LAUNCH_DATE);

    const absBaseline = absorptionTrend.filter(
      (d) => d.date >= BASELINE_START && d.date <= BASELINE_END && !d.artifact
    );
    const absPost = absorptionTrend.filter(
      (d) => d.date >= LAUNCH_DATE && !d.artifact
    );

    const baselineTxAvg =
      tpulseBaseline.length > 0
        ? tpulseBaseline.reduce((s, d) => s + d.txs, 0) / tpulseBaseline.length
        : 0;
    const postTxAvg =
      tpulsePost.length > 0
        ? tpulsePost.reduce((s, d) => s + d.txs, 0) / tpulsePost.length
        : 0;
    const tpulseDelta =
      baselineTxAvg > 0 ? ((postTxAvg - baselineTxAvg) / baselineTxAvg) * 100 : 0;

    const baselineAbsAvg =
      absBaseline.length > 0
        ? absBaseline.reduce((s, d) => s + d.rate, 0) / absBaseline.length
        : 0;
    const postAbsAvg =
      absPost.length > 0
        ? absPost.reduce((s, d) => s + d.rate, 0) / absPost.length
        : 0;
    const absorptionDelta = postAbsAvg - baselineAbsAvg;

    let impact: string;
    let message: string;
    if (tpulseDelta > 10 && absorptionDelta > 3) {
      impact = "CONFIRMED";
      message = "Both signals rising — EdgeCloud generating real activity";
    } else if (tpulseDelta > 10) {
      impact = "PARTIAL";
      message = "TPulse rising — inference may be logging on-chain";
    } else if (absorptionDelta > 3) {
      impact = "PARTIAL";
      message =
        "TFUEL absorption rising — node payments increasing even if TPulse unchanged";
    } else if (tpulseDelta < -5 && absorptionDelta < -1) {
      impact = "NONE";
      message = "No signal yet — too early or volume too small to measure";
    } else {
      impact = "MONITORING";
      message = "Watching for signal — check back in a few days";
    }

    return NextResponse.json({
      tpulseDelta: Math.round(tpulseDelta * 10) / 10,
      absorptionDelta: Math.round(absorptionDelta * 10) / 10,
      impact,
      message,
      tpulseTrend,
      absorptionTrend,
      baselineTxAvg: Math.round(baselineTxAvg),
      postTxAvg: Math.round(postTxAvg),
      baselineAbsAvg: Math.round(baselineAbsAvg * 10) / 10,
      postAbsAvg: Math.round(postAbsAvg * 10) / 10,
      baselineEnd: BASELINE_END,
      trackingStart: LAUNCH_DATE,
      daysTracked: tpulsePost.length,
    });
  } catch (error) {
    console.error("EdgeCloud impact fetch failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
