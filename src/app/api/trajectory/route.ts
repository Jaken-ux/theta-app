/**
 * Trajectory API — demand-side adoption signals over 90 days.
 *
 * Returns the 4 metrics that genuinely measure customer-driven activity
 * (as opposed to supply-side capacity, tokenomics, or speculation):
 *
 *   1. Total ecosystem txs (main + all subchains) — full network demand
 *   2. Wallet activity rate (% blocks with txs)   — real users vs. bookkeeping
 *   3. TPulse subchain txs                        — EdgeCloud-specific demand
 *   4. TFUEL absorption rate                      — burn from real usage
 *
 * For each metric we return a 30-day sparkline plus a "trending" verdict
 * based on the 7-day average versus the 30-day average. A metric counts
 * as trending up only when the short window is at least 3 % above the long
 * window — strict enough to filter ordinary noise, loose enough to fire
 * when something real is happening.
 *
 * Window sizes are intentionally short for now so the dashboard becomes
 * useful as soon as a few weeks of data exist. We can widen later (e.g.
 * 30/90) once enough history accumulates for a more conservative signal.
 *
 * TFUEL absorption data before 2026-04-25 is unreliable due to a snapshot-
 * timing bug fixed in commit 9f0c2aa. We surface a "samlar data" status
 * for that card until enough clean days exist.
 */

import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { computeTfuelEconomics } from "../../../lib/tfuel-economics";
import { fetchTotalMetachainTxsHistory } from "../../../lib/metachain/total-txs";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;
const SHORT_WINDOW = 7;
const LONG_WINDOW = 30;
const TREND_THRESHOLD_PCT = 3;
const ABSORPTION_CLEAN_FROM = "2026-04-25";
const ABSORPTION_MIN_CLEAN_DAYS = 7;

type TrendDirection = "up" | "down" | "flat" | "insufficient";

interface MetricResult {
  key: string;
  label: string;
  subtitle?: string;
  unit: string;
  latest: number | null;
  shortAvg: number | null;
  longAvg: number | null;
  changePct: number | null;
  direction: TrendDirection;
  series: { date: string; value: number | null }[];
  note?: string;
}

function avgOf(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => v != null);
  if (clean.length === 0) return null;
  return clean.reduce((s, v) => s + v, 0) / clean.length;
}

function classifyTrend(
  shortAvg: number | null,
  longAvg: number | null,
  cleanDays: number
): { direction: TrendDirection; changePct: number | null } {
  if (shortAvg == null || longAvg == null || longAvg === 0) {
    return { direction: "insufficient", changePct: null };
  }
  if (cleanDays < SHORT_WINDOW) {
    const changePct = ((shortAvg - longAvg) / longAvg) * 100;
    return { direction: "insufficient", changePct };
  }
  const changePct = ((shortAvg - longAvg) / longAvg) * 100;
  if (changePct >= TREND_THRESHOLD_PCT) return { direction: "up", changePct };
  if (changePct <= -TREND_THRESHOLD_PCT) return { direction: "down", changePct };
  return { direction: "flat", changePct };
}

function buildMetric(
  key: string,
  label: string,
  unit: string,
  series: { date: string; value: number | null }[],
  opts?: { note?: string; subtitle?: string }
): MetricResult {
  const values = series.map((p) => p.value);
  const cleanValues = values.filter((v): v is number => v != null);
  const cleanDays = cleanValues.length;
  const latest = cleanValues.length > 0 ? cleanValues[cleanValues.length - 1] : null;
  const shortAvg = avgOf(values.slice(-SHORT_WINDOW));
  const longAvg = avgOf(values.slice(-LONG_WINDOW));
  const { direction, changePct } = classifyTrend(shortAvg, longAvg, cleanDays);
  return {
    key,
    label,
    subtitle: opts?.subtitle,
    unit,
    latest,
    shortAvg,
    longAvg,
    changePct,
    direction,
    series,
    note: opts?.note,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = await getPool();

    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const supplyCutoff = new Date(cutoff);
    supplyCutoff.setDate(supplyCutoff.getDate() - 2);
    const supplyCutoffStr = supplyCutoff.toISOString().slice(0, 10);

    const [activityRes, tpulseRes, supplyRes, ecosystemHistory] = await Promise.all([
      pool.query(
        `SELECT date, wallet_activity
         FROM theta_activity_history
         WHERE date >= $1
         ORDER BY date ASC`,
        [cutoffStr]
      ),
      pool.query(
        `SELECT date, tx_count_24h
         FROM metachain_metrics
         WHERE chain_id = 'tsub68967'
           AND date >= $1
         ORDER BY date ASC`,
        [cutoffStr]
      ),
      pool.query(
        `SELECT date, tfuel_circulating_supply
         FROM theta_activity_history
         WHERE tfuel_circulating_supply IS NOT NULL
           AND date >= $1
         ORDER BY date ASC`,
        [supplyCutoffStr]
      ),
      fetchTotalMetachainTxsHistory(WINDOW_DAYS),
    ]);

    const dateRange: string[] = [];
    for (let d = new Date(cutoff); d < today; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().slice(0, 10));
    }

    const walletActivityByDate = new Map<string, number>();
    for (const row of activityRes.rows) {
      const date = row.date.toISOString().slice(0, 10);
      if (row.wallet_activity != null) {
        walletActivityByDate.set(date, Number(row.wallet_activity));
      }
    }

    const tpulseByDate = new Map<string, number>();
    for (const row of tpulseRes.rows) {
      const date = row.date.toISOString().slice(0, 10);
      tpulseByDate.set(date, Number(row.tx_count_24h));
    }

    const ecosystemByDate = new Map<string, number>();
    for (const row of ecosystemHistory) {
      if (row.total != null) ecosystemByDate.set(row.date, row.total);
    }

    const economics = computeTfuelEconomics(
      supplyRes.rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        supply: Number(r.tfuel_circulating_supply),
      }))
    );
    const absorptionByDate = new Map<string, number>();
    for (const entry of economics.dailyEntries) {
      if (entry.date >= ABSORPTION_CLEAN_FROM && !entry.isDataArtifact) {
        absorptionByDate.set(entry.date, entry.absorptionRate * 100);
      }
    }

    const ecosystemSeries = dateRange.map((date) => ({
      date,
      value: ecosystemByDate.get(date) ?? null,
    }));
    const walletActivitySeries = dateRange.map((date) => ({
      date,
      value: walletActivityByDate.get(date) ?? null,
    }));
    const tpulseSeries = dateRange.map((date) => ({
      date,
      value: tpulseByDate.get(date) ?? null,
    }));
    const absorptionSeries = dateRange.map((date) => ({
      date,
      value: absorptionByDate.get(date) ?? null,
    }));

    const absorptionCleanDays = absorptionSeries.filter((p) => p.value != null).length;
    const absorptionNote =
      absorptionCleanDays < ABSORPTION_MIN_CLEAN_DAYS
        ? `Samlar data — pålitligt resultat när 7 rena dagar finns (~1 maj). ${absorptionCleanDays}/${ABSORPTION_MIN_CLEAN_DAYS} dagar insamlade.`
        : undefined;

    const metrics: MetricResult[] = [
      buildMetric("ecosystemTxs", "Total Ecosystem Transactions", "txs/dag", ecosystemSeries, {
        subtitle: "Main chain + alla aktiva subchains",
      }),
      buildMetric("walletActivity", "Wallet activity rate", "% av block", walletActivitySeries),
      buildMetric("tpulseTxs", "TPulse subchain txs", "txs/dag", tpulseSeries, {
        note: "EdgeCloud-specifik aktivitet (Qwen3, GPU-jobb, modellanrop).",
      }),
      buildMetric("tfuelAbsorption", "TFUEL absorption rate", "% av issuance", absorptionSeries, {
        note: absorptionNote,
      }),
    ];

    const trendingUp = metrics.filter((m) => m.direction === "up").length;
    const trendingDown = metrics.filter((m) => m.direction === "down").length;
    const trendingFlat = metrics.filter((m) => m.direction === "flat").length;
    const insufficient = metrics.filter((m) => m.direction === "insufficient").length;
    const ratable = metrics.length - insufficient;

    let verdict: "spiral_up" | "growing" | "mixed" | "stagnant" | "declining" | "insufficient";
    let verdictMessage: string;

    if (ratable === 0) {
      verdict = "insufficient";
      verdictMessage = "Otillräcklig data — väntar på fler dagar i fönstret.";
    } else if (trendingUp >= 3) {
      verdict = "spiral_up";
      verdictMessage = "Flera oberoende mått pekar uppåt — adoption växer på riktigt.";
    } else if (trendingUp >= 2) {
      verdict = "growing";
      verdictMessage = "Adoption rör sig i rätt riktning — fler signaler behövs för bekräftelse.";
    } else if (trendingDown >= 2) {
      verdict = "declining";
      verdictMessage = "Demand-side krymper — nätverket tappar aktivitet.";
    } else if (trendingFlat >= 2) {
      verdict = "stagnant";
      verdictMessage = "Sidledes — ingen tydlig regimförändring.";
    } else {
      verdict = "mixed";
      verdictMessage = "Blandad signal — olika mått rör sig åt olika håll.";
    }

    return NextResponse.json({
      windowDays: WINDOW_DAYS,
      shortWindow: SHORT_WINDOW,
      longWindow: LONG_WINDOW,
      trendThresholdPct: TREND_THRESHOLD_PCT,
      metrics,
      summary: {
        trendingUp,
        trendingDown,
        trendingFlat,
        insufficient,
        ratable,
        total: metrics.length,
        verdict,
        verdictMessage,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trajectory fetch failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
