"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { computeTfuelEconomics, DAILY_ISSUANCE } from "@/lib/tfuel-economics";

// ── Types ───────────────────────────────────────────────────────────────────

interface HistoryRow {
  date: string;
  score: number;
  sampleCount: number;
  metrics: {
    dailyTxs: number | null;
    tfuelVolume: number | null;
    walletActivity: number | null;
    stakingNodes: number | null;
    thetaStakingRatio: number | null;
    tfuelStakingRatio: number | null;
    thetaPrice: number | null;
    tfuelPrice: number | null;
    thetaMarketCap: number | null;
    tfuelCirculatingSupply: number | null;
    dailyBlocks: number | null;
    validatorGuardianNodes: number | null;
    edgeNodes: number | null;
  };
}

// ── Stats helpers ───────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function movingAverage(arr: number[], window: number): (number | null)[] {
  return arr.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += arr[j];
    return sum / window;
  });
}

function pctChange(arr: number[]): number[] {
  return arr.slice(1).map((v, i) => (arr[i] === 0 ? 0 : ((v - arr[i]) / arr[i]) * 100));
}

function correlationLabel(r: number): { text: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.7) return { text: "Stark", color: "#10B981" };
  if (abs >= 0.4) return { text: "Medel", color: "#F59E0B" };
  return { text: "Svag", color: "#EF4444" };
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

// ── Shared UI ───────────────────────────────────────────────────────────────

function Explainer({
  whatIsThis,
  howToRead,
  useCase,
}: {
  whatIsThis: string;
  howToRead: string;
  useCase: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-[#2AB8E6] hover:text-[#2AB8E6]/80 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Dölj förklaring" : "Vad betyder detta?"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 p-4 bg-[#0D1117] rounded-lg border border-[#2A3548]/50 text-sm text-[#B0B8C4] leading-relaxed">
          <div>
            <p className="text-white font-medium text-xs uppercase tracking-wide mb-1">Vad är detta?</p>
            <p>{whatIsThis}</p>
          </div>
          <div>
            <p className="text-white font-medium text-xs uppercase tracking-wide mb-1">Hur tolkar jag det?</p>
            <p>{howToRead}</p>
          </div>
          <div>
            <p className="text-white font-medium text-xs uppercase tracking-wide mb-1">Vad kan jag använda det till?</p>
            <p>{useCase}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-xs text-[#7D8694] mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  background: "#2A3548",
  border: "1px solid #445064",
  borderRadius: "8px",
  color: "#eaecf0",
  fontSize: "12px",
};

// ── Main page ───────────────────────────────────────────────────────────────

type TimeRange = "30d" | "90d" | "6m" | "1y" | "all";

const TIME_RANGES: { key: TimeRange; label: string; days: number | null }[] = [
  { key: "30d", label: "30 dagar", days: 30 },
  { key: "90d", label: "90 dagar", days: 90 },
  { key: "6m", label: "6 månader", days: 180 },
  { key: "1y", label: "1 år", days: 365 },
  { key: "all", label: "Allt", days: null },
];

function aggregateToWeekly(rows: HistoryRow[]): HistoryRow[] {
  const weeks: Map<string, HistoryRow[]> = new Map();
  for (const row of rows) {
    const d = new Date(row.date + "T00:00:00");
    // Use Monday of the week as key
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const weekKey = monday.toISOString().slice(0, 10);
    if (!weeks.has(weekKey)) weeks.set(weekKey, []);
    weeks.get(weekKey)!.push(row);
  }

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekRows]) => {
      const avg = (fn: (r: HistoryRow) => number | null): number | null => {
        const vals = weekRows.map(fn).filter((v): v is number => v != null);
        return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      };
      return {
        date: weekStart,
        score: Math.round(weekRows.reduce((s, r) => s + r.score, 0) / weekRows.length),
        sampleCount: weekRows.reduce((s, r) => s + r.sampleCount, 0),
        metrics: {
          dailyTxs: avg((r) => r.metrics.dailyTxs),
          tfuelVolume: avg((r) => r.metrics.tfuelVolume),
          walletActivity: avg((r) => r.metrics.walletActivity),
          stakingNodes: avg((r) => r.metrics.stakingNodes),
          thetaStakingRatio: avg((r) => r.metrics.thetaStakingRatio),
          tfuelStakingRatio: avg((r) => r.metrics.tfuelStakingRatio),
          thetaPrice: avg((r) => r.metrics.thetaPrice),
          tfuelPrice: avg((r) => r.metrics.tfuelPrice),
          thetaMarketCap: avg((r) => r.metrics.thetaMarketCap),
          tfuelCirculatingSupply: avg((r) => r.metrics.tfuelCirculatingSupply),
          dailyBlocks: avg((r) => r.metrics.dailyBlocks),
          validatorGuardianNodes: avg((r) => r.metrics.validatorGuardianNodes),
          edgeNodes: avg((r) => r.metrics.edgeNodes),
        },
      };
    });
}

export default function ResearchPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoryRow[]>([]);
  const [mcData, setMcData] = useState<{ date: string; compositeScore: number; chainsAvailable?: number; coveragePct?: number }[]>([]);
  const [mcChainHistory, setMcChainHistory] = useState<Record<string, { date: string; score: number; txCount24h?: number }[]>>({});
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [edgeImpact, setEdgeImpact] = useState<{
    tpulseDelta: number;
    absorptionDelta: number;
    impact: string;
    message: string;
    tpulseTrend: { date: string; txs: number }[];
    absorptionTrend: { date: string; rate: number; artifact: boolean }[];
    baselineTxAvg: number;
    postTxAvg: number;
    baselineAbsAvg: number;
    postAbsAvg: number;
    baselineEnd: string;
    trackingStart: string;
    daysTracked: number;
  } | null>(null);
  const [edgeImpactOpen, setEdgeImpactOpen] = useState(false);

  // Auth check — reuse STATS_SECRET via /api/stats
  async function authenticate(secret: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats?key=${encodeURIComponent(secret)}`);
      if (!res.ok) {
        setError("Fel nyckel");
        return;
      }
      localStorage.setItem("theta-research-key", secret);
      setAuthed(true);
      // Fetch activity data + metachain data in parallel
      const [histRes, mcRes] = await Promise.all([
        fetch("/api/activity-history"),
        fetch("/api/metachain"),
      ]);
      if (histRes.ok) setData(await histRes.json());
      // EdgeCloud impact (non-blocking)
      fetch(`/api/edgecloud-impact?key=${encodeURIComponent(secret)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setEdgeImpact(d); })
        .catch(() => {});
      if (mcRes.ok) {
        const mc = await mcRes.json();
        setMcData(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mc.history ?? []).map((h: any) => ({
            date: typeof h.date === "string" && h.date.length > 10 ? h.date.slice(0, 10) : h.date,
            compositeScore: h.compositeScore,
            chainsAvailable: h.chainsAvailable ?? null,
            coveragePct: h.coveragePct ?? null,
          }))
        );
        // Per-chain history for correlation analysis
        if (mc.chainHistory) {
          const normalized: Record<string, { date: string; score: number; txCount24h?: number }[]> = {};
          for (const [chainId, entries] of Object.entries(mc.chainHistory)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            normalized[chainId] = (entries as any[]).map((e) => ({
              date: typeof e.date === "string" && e.date.length > 10 ? e.date.slice(0, 10) : e.date,
              score: e.score,
              txCount24h: e.txCount24h ?? undefined,
            }));
          }
          setMcChainHistory(normalized);
        }
      }
    } catch {
      setError("Kunde inte ansluta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("theta-research-key");
    if (stored) {
      setKey(stored);
      authenticate(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter rows by time range ────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const valid = data.filter((r) => r.metrics.thetaPrice != null && r.score > 0);
    const rangeDef = TIME_RANGES.find((t) => t.key === timeRange);
    if (!rangeDef?.days) return valid;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDef.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return valid.filter((r) => r.date >= cutoffStr);
  }, [data, timeRange]);

  // Auto-aggregate to weekly averages when showing > 120 data points
  const rows = useMemo(() => {
    if (filteredRows.length <= 120) return filteredRows;
    return aggregateToWeekly(filteredRows);
  }, [filteredRows]);

  const isAggregated = rows !== filteredRows;

  // ── Derived arrays ───────────────────────────────────────────────────────
  const scores = useMemo(() => rows.map((r) => r.score), [rows]);
  const thetaPrices = useMemo(
    () => rows.map((r) => r.metrics.thetaPrice!),
    [rows]
  );
  const tfuelPrices = useMemo(
    () => rows.map((r) => r.metrics.tfuelPrice!),
    [rows]
  );
  const dates = useMemo(() => rows.map((r) => r.date), [rows]);

  // ── Correlations ─────────────────────────────────────────────────────────
  const corrIndexTheta = useMemo(
    () => pearson(scores, thetaPrices),
    [scores, thetaPrices]
  );
  const corrIndexTfuel = useMemo(
    () => pearson(scores, tfuelPrices),
    [scores, tfuelPrices]
  );

  // Per-row absorption rate (handles weekly aggregation via day-gap scaling)
  const rowAbsorption = useMemo(() => {
    return rows.map((r, i) => {
      if (i === 0) return null;
      const prev = rows[i - 1];
      const curSup = r.metrics.tfuelCirculatingSupply;
      const prevSup = prev.metrics.tfuelCirculatingSupply;
      if (curSup == null || prevSup == null) return null;
      const days =
        (new Date(r.date + "T00:00:00").getTime() -
          new Date(prev.date + "T00:00:00").getTime()) /
        86400000;
      if (days <= 0) return null;
      const expected = DAILY_ISSUANCE * days;
      const abs = Math.max(0, expected - (curSup - prevSup));
      return abs / expected;
    });
  }, [rows]);

  // Component correlations vs THETA price
  const componentCorrelations = useMemo(() => {
    const components: {
      name: string;
      key: keyof HistoryRow["metrics"];
      color: string;
    }[] = [
      { name: "Transaktioner", key: "dailyTxs", color: "#2AB8E6" },
      { name: "TFUEL-volym", key: "tfuelVolume", color: "#10B981" },
      { name: "Wallet-aktivitet", key: "walletActivity", color: "#F59E0B" },
      { name: "Noder", key: "stakingNodes", color: "#8B5CF6" },
      { name: "THETA Staking %", key: "thetaStakingRatio", color: "#EC4899" },
      { name: "TFUEL Staking %", key: "tfuelStakingRatio", color: "#06B6D4" },
      { name: "Dagliga block", key: "dailyBlocks", color: "#F97316" },
    ];
    const base = components.map((c) => {
      const vals = rows
        .filter((r) => r.metrics[c.key] != null)
        .map((r) => r.metrics[c.key] as number);
      const prices = rows
        .filter((r) => r.metrics[c.key] != null)
        .map((r) => r.metrics.thetaPrice!);
      return {
        ...c,
        r: pearson(vals, prices),
        n: vals.length,
      };
    });
    // Net absorption (TFUEL burn proxy) as a synthetic component
    const absVals: number[] = [];
    const absPrices: number[] = [];
    rows.forEach((r, i) => {
      const a = rowAbsorption[i];
      if (a != null && r.metrics.thetaPrice != null) {
        absVals.push(a);
        absPrices.push(r.metrics.thetaPrice);
      }
    });
    if (absVals.length >= 3) {
      base.push({
        name: "Net absorption",
        key: "tfuelCirculatingSupply",
        color: "#DC2626",
        r: pearson(absVals, absPrices),
        n: absVals.length,
      });
    }
    return base;
  }, [rows, rowAbsorption]);

  // ── Lead/lag analysis ────────────────────────────────────────────────────
  const leadLag = useMemo(() => {
    if (scores.length < 10) return [];
    const scoreChanges = pctChange(scores);
    const priceChanges = pctChange(thetaPrices);
    const results: { lag: number; r: number }[] = [];
    for (let lag = -7; lag <= 7; lag++) {
      const n = Math.min(scoreChanges.length, priceChanges.length) - Math.abs(lag);
      if (n < 5) continue;
      const x: number[] = [];
      const y: number[] = [];
      for (let i = 0; i < n; i++) {
        const si = lag >= 0 ? i : i - lag;
        const pi = lag >= 0 ? i + lag : i;
        if (si < scoreChanges.length && pi < priceChanges.length) {
          x.push(scoreChanges[si]);
          y.push(priceChanges[pi]);
        }
      }
      results.push({ lag, r: pearson(x, y) });
    }
    return results;
  }, [scores, thetaPrices]);

  // ── Moving averages for trend chart ──────────────────────────────────────
  const trendData = useMemo(() => {
    const ma7 = movingAverage(scores, 7);
    const ma14 = movingAverage(scores, 14);
    const priceNorm = thetaPrices.length
      ? thetaPrices.map(
          (p) =>
            ((p - Math.min(...thetaPrices)) /
              (Math.max(...thetaPrices) - Math.min(...thetaPrices) || 1)) *
            100
        )
      : [];
    return rows.map((r, i) => ({
      date: formatDate(r.date),
      fullDate: r.date,
      score: r.score,
      ma7: ma7[i],
      ma14: ma14[i],
      thetaPrice: r.metrics.thetaPrice,
      priceNorm: priceNorm[i] ?? null,
    }));
  }, [rows, scores, thetaPrices]);

  // ── Data sufficiency ─────────────────────────────────────────────────────
  const dataDays = useMemo(() => {
    if (rows.length === 0) return 0;
    const earliest = new Date(rows[0].date + "T00:00:00");
    const latest = new Date(rows[rows.length - 1].date + "T00:00:00");
    return Math.round((latest.getTime() - earliest.getTime()) / 86400000) + 1;
  }, [rows]);

  const dataReadyDate = useMemo(() => {
    if (rows.length === 0 || dataDays >= 30) return null;
    const earliest = new Date(rows[0].date + "T00:00:00");
    earliest.setDate(earliest.getDate() + 30);
    return earliest.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  }, [rows, dataDays]);

  // ── Metachain combined data ──────────────────────────────────────────────
  const mcByDate = useMemo(() => {
    const map = new Map<string, { score: number; chainsAvailable?: number; coveragePct?: number }>();
    for (const m of mcData) map.set(m.date, { score: m.compositeScore, chainsAvailable: m.chainsAvailable, coveragePct: m.coveragePct });
    return map;
  }, [mcData]);

  const dualIndexData = useMemo(() => {
    return rows
      .filter((r) => mcByDate.has(r.date))
      .map((r) => ({
        date: formatDate(r.date),
        fullDate: r.date,
        mainChain: r.score,
        metachain: mcByDate.get(r.date)!.score,
        thetaPrice: r.metrics.thetaPrice,
      }));
  }, [rows, mcByDate]);

  const mcScores = useMemo(
    () => dualIndexData.map((d) => d.metachain),
    [dualIndexData]
  );
  const mcPrices = useMemo(
    () => dualIndexData.map((d) => d.thetaPrice!),
    [dualIndexData]
  );
  const mcMainScores = useMemo(
    () => dualIndexData.map((d) => d.mainChain),
    [dualIndexData]
  );

  const corrMetachainPrice = useMemo(
    () => (mcScores.length >= 3 ? pearson(mcScores, mcPrices) : 0),
    [mcScores, mcPrices]
  );
  const corrMainVsMeta = useMemo(
    () => (mcScores.length >= 3 ? pearson(mcMainScores, mcScores) : 0),
    [mcMainScores, mcScores]
  );

  // ── Per-chain correlations with THETA price ──────────────────────────────
  const CHAIN_NAMES: Record<string, string> = {
    "main-chain": "Main Chain",
    tsub360890: "Lavita AI",
    tsub68967: "TPulse",
    tsub7734: "Passaways",
    tsub47683: "Grove",
    tsub9065: "POGS",
    "proxy-indicators": "Ecosystem Growth",
  };
  const CHAIN_COLORS_RESEARCH: Record<string, string> = {
    "main-chain": "#2AB8E6",
    tsub360890: "#10B981",
    tsub68967: "#8B5CF6",
    tsub7734: "#F59E0B",
    tsub47683: "#EF4444",
    tsub9065: "#7D8694",
    "proxy-indicators": "#E879F9",
  };

  const chainCorrelations = useMemo(() => {
    const results: { name: string; chainId: string; r: number; n: number; color: string }[] = [];
    for (const [chainId, entries] of Object.entries(mcChainHistory)) {
      const byDate = new Map(entries.map((e) => [e.date, e.score]));
      const paired = rows.filter((r) => byDate.has(r.date) && r.metrics.thetaPrice != null);
      if (paired.length < 3) continue;
      const chainScoresArr = paired.map((r) => byDate.get(r.date)!);
      const pricesArr = paired.map((r) => r.metrics.thetaPrice!);
      results.push({
        name: CHAIN_NAMES[chainId] ?? chainId,
        chainId,
        r: pearson(chainScoresArr, pricesArr),
        n: paired.length,
        color: CHAIN_COLORS_RESEARCH[chainId] ?? "#7D8694",
      });
    }
    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [mcChainHistory, rows]);

  // ── Metachain lead/lag analysis ─────────────────────────────────────────
  const mcLeadLag = useMemo(() => {
    if (mcScores.length < 10) return [];
    const mcChanges = pctChange(mcScores);
    const priceChanges = pctChange(mcPrices);
    const results: { lag: number; r: number }[] = [];
    for (let lag = -7; lag <= 7; lag++) {
      const n = Math.min(mcChanges.length, priceChanges.length) - Math.abs(lag);
      if (n < 5) continue;
      const x: number[] = [];
      const y: number[] = [];
      for (let i = 0; i < n; i++) {
        const si = lag >= 0 ? i : i - lag;
        const pi = lag >= 0 ? i + lag : i;
        if (si < mcChanges.length && pi < priceChanges.length) {
          x.push(mcChanges[si]);
          y.push(priceChanges[pi]);
        }
      }
      results.push({ lag, r: pearson(x, y) });
    }
    return results;
  }, [mcScores, mcPrices]);

  // ── Scatter data ─────────────────────────────────────────────────────────
  const scatterData = useMemo(
    () =>
      rows.map((r) => ({
        index: r.score,
        price: r.metrics.thetaPrice!,
        date: r.date,
      })),
    [rows]
  );

  // ── Daily changes chart ──────────────────────────────────────────────────
  const dailyChanges = useMemo(() => {
    if (rows.length < 2) return [];
    return rows.slice(1).map((r, i) => {
      const prevScore = rows[i].score;
      const prevPrice = rows[i].metrics.thetaPrice!;
      return {
        date: formatDate(r.date),
        indexChange: prevScore === 0 ? 0 : ((r.score - prevScore) / prevScore) * 100,
        priceChange:
          prevPrice === 0
            ? 0
            : ((r.metrics.thetaPrice! - prevPrice) / prevPrice) * 100,
      };
    });
  }, [rows]);

  // ── TFUEL economics (net absorption) ─────────────────────────────────────
  const tfuelSupplyHistory = useMemo(
    () =>
      filteredRows
        .filter((r) => r.metrics.tfuelCirculatingSupply != null)
        .map((r) => ({ date: r.date, supply: r.metrics.tfuelCirculatingSupply! })),
    [filteredRows]
  );

  const tfuelEconomics = useMemo(
    () => computeTfuelEconomics(tfuelSupplyHistory),
    [tfuelSupplyHistory]
  );

  // Correlate daily absorption rate with THETA/TFUEL price (daily data only)
  const absorptionStats = useMemo(() => {
    const entries = tfuelEconomics.dailyEntries;
    const thetaByDate = new Map(
      filteredRows.map((r) => [r.date, r.metrics.thetaPrice])
    );
    const tfuelByDate = new Map(
      filteredRows.map((r) => [r.date, r.metrics.tfuelPrice])
    );
    const pairs = entries.filter(
      (e) => thetaByDate.get(e.date) != null && tfuelByDate.get(e.date) != null
    );
    const absArr = pairs.map((p) => p.absorptionRate);
    const thetaArr = pairs.map((p) => thetaByDate.get(p.date)!);
    const tfuelArr = pairs.map((p) => tfuelByDate.get(p.date)!);
    return {
      corrTheta: pairs.length >= 3 ? pearson(absArr, thetaArr) : 0,
      corrTfuel: pairs.length >= 3 ? pearson(absArr, tfuelArr) : 0,
      n: pairs.length,
      artifactDays: entries.filter((e) => e.isDataArtifact).length,
      totalDays: entries.length,
    };
  }, [tfuelEconomics, filteredRows]);

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            authenticate(key);
          }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold text-white">Research Lab</h1>
          <p className="text-sm text-[#B0B8C4]">
            Intern analyserings-sida. Ange nyckel.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Nyckel"
            className="w-64 bg-[#0D1117] border border-[#2A3548] rounded-lg px-4 py-2.5 text-white placeholder:text-[#5C6675] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40"
          />
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#2AB8E6] text-white font-medium rounded-lg hover:bg-[#2AB8E6]/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Laddar..." : "Öppna"}
            </button>
          </div>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        </form>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Lab</h1>
          <p className="text-sm text-[#B0B8C4]">
            Intern analys av nätverksdata &middot; {rows.length} datapunkter
            {isAggregated && (
              <span className="text-[#F59E0B]"> &middot; Veckosnitt (auto-aggregerat)</span>
            )}
          </p>
        </div>
        <div className="flex gap-1.5 bg-[#0D1117] p-1 rounded-lg border border-[#2A3548]">
          {TIME_RANGES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeRange(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === t.key
                  ? "bg-[#2AB8E6] text-white"
                  : "text-[#7D8694] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Trajectory entry point (sandbox before promoting to main nav) ── */}
      <Link
        href="/research/trajectory"
        className="block group bg-gradient-to-br from-[#2AB8E6]/10 via-[#151D2E] to-[#151D2E] border border-[#2AB8E6]/30 hover:border-[#2AB8E6]/60 rounded-xl p-5 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2AB8E6]/15 text-[#2AB8E6] border border-[#2AB8E6]/30">
                Nytt
              </span>
              <h2 className="text-lg font-semibold text-white">Theta Trajectory</h2>
            </div>
            <p className="text-sm text-[#B0B8C4]">
              Tar Theta sig ur slumpen? Fyra demand-side-mått som mäter faktisk adoption —
              utan brus från supply-side-kapacitet, tokenomics eller spekulation.
            </p>
          </div>
          <span className="text-[#2AB8E6] group-hover:translate-x-1 transition-transform shrink-0 mt-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>

      {/* ── Data insufficiency warning ──────────────────────────────── */}
      {dataDays < 30 && dataDays > 0 && !warningDismissed && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-[#F59E0B] text-lg mt-0.5 shrink-0">⚠</span>
          <div className="flex-1">
            <p className="text-sm text-[#D1D5DB]">
              <strong className="text-[#F59E0B]">Statistiken är preliminär</strong> — endast {dataDays} dagars data tillgänglig.
              Korrelationer och lead/lag-analys kräver minst 30 dagar för att vara tillförlitliga.
              {dataReadyDate && <> Återkom <strong className="text-white">{dataReadyDate}</strong>.</>}
            </p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-[#7D8694] hover:text-white transition-colors text-lg leading-none shrink-0"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <Explainer
        whatIsThis="De fyra korten visar en snabb överblick av den viktigaste statistiken. Korrelationsvärdena (de två första korten) mäter hur starkt vårt Activity Index hänger ihop med THETA- respektive TFUEL-priset. De två sista korten visar genomsnittet av indexet och priset under hela den period vi har data för."
        howToRead={`Korrelationsvärdet (r) går från -1 till +1. Ett värde nära +1 betyder att index och pris tenderar att röra sig i samma riktning — när indexet går upp, går priset också upp. Ett värde nära -1 betyder att de rör sig i motsatta riktningar. Ett värde nära 0 betyder att det inte finns något tydligt samband. Vi färgkodar det: grönt = starkt samband (|r| > 0.7), gult = medel (0.4–0.7), rött = svagt (< 0.4).`}
        useCase="Ger en snabb känsla för om nätverksaktivitet och pris hänger ihop överhuvudtaget. Om korrelationen är stark kan det tyda på att vårt index fångar något meningsfullt. Om den är svag kanske priset mest drivs av bredare marknadssentiment snarare än Theta-specifik aktivitet."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] mb-1">Index &harr; THETA-pris</p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: correlationLabel(corrIndexTheta).color }}
          >
            {corrIndexTheta.toFixed(3)}
          </p>
          <p className="text-xs mt-1" style={{ color: correlationLabel(corrIndexTheta).color }}>
            {correlationLabel(corrIndexTheta).text} korrelation
          </p>
          <p className="text-[10px] text-[#5C6675] mt-0.5">n={scores.length} dagar</p>
        </div>
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] mb-1">Index &harr; TFUEL-pris</p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: correlationLabel(corrIndexTfuel).color }}
          >
            {corrIndexTfuel.toFixed(3)}
          </p>
          <p className="text-xs mt-1" style={{ color: correlationLabel(corrIndexTfuel).color }}>
            {correlationLabel(corrIndexTfuel).text} korrelation
          </p>
          <p className="text-[10px] text-[#5C6675] mt-0.5">n={scores.length} dagar</p>
        </div>
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] mb-1">Snitt Index</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {scores.length ? mean(scores).toFixed(1) : "–"}
          </p>
          <p className="text-xs text-[#7D8694] mt-1">av 100</p>
        </div>
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] mb-1">Snitt THETA-pris</p>
          <p className="text-2xl font-bold text-[#2AB8E6] tabular-nums">
            ${thetaPrices.length ? mean(thetaPrices).toFixed(3) : "–"}
          </p>
          <p className="text-xs text-[#7D8694] mt-1">
            {dates.length ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}` : ""}
          </p>
        </div>
      </div>

      {/* ── TFUEL burn/absorption KPIs ─────────────────────────────── */}
      {tfuelEconomics.avgAbsorptionRate7d != null && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
            <p className="text-xs text-[#7D8694] mb-1">7d Net absorption</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {(tfuelEconomics.avgAbsorptionRate7d * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-[#7D8694] mt-1">av block-issuance</p>
          </div>
          <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
            <p className="text-xs text-[#7D8694] mb-1">7d Absorption (TFUEL)</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {tfuelEconomics.avgAbsorption7d != null
                ? Math.round(tfuelEconomics.avgAbsorption7d).toLocaleString("sv-SE")
                : "–"}
            </p>
            <p className="text-xs text-[#7D8694] mt-1">genomsnitt/dag</p>
          </div>
          <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
            <p className="text-xs text-[#7D8694] mb-1">Artefaktdagar</p>
            <p className="text-2xl font-bold text-[#7D8694] tabular-nums">
              {absorptionStats.artifactDays}
              <span className="text-sm text-[#7D8694] font-normal">
                /{absorptionStats.totalDays}
              </span>
            </p>
            <p className="text-xs text-[#7D8694] mt-1">snapshot-drift / unlock</p>
          </div>
          <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-5">
            <p className="text-xs text-[#7D8694] mb-1">Absorption &harr; THETA</p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: correlationLabel(absorptionStats.corrTheta).color }}
            >
              {absorptionStats.corrTheta.toFixed(3)}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: correlationLabel(absorptionStats.corrTheta).color }}
            >
              {correlationLabel(absorptionStats.corrTheta).text} (n={absorptionStats.n})
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Trend: Index + Price (normalized) ─────────────────────── */}
      <Section
        title="Trendanalys: Index vs Pris"
        subtitle="Activity index med 7- och 14-dagars glidande medelvärde. Priset normaliserat till 0–100-skala för jämförelse."
      >
        <Explainer
          whatIsThis="Det här diagrammet visar hur vårt Activity Index och THETA-priset har rört sig över tid, plottade ovanpå varandra. Eftersom index (0–100) och pris (t.ex. $0.80) har helt olika skalor, har vi normaliserat priset till samma 0–100-skala. Det betyder att prisets lägsta punkt under perioden blir 0 och högsta blir 100, så du kan jämföra rörelsemönstren visuellt. De blå linjerna representerar indexet: den tunna, ljusa linjen är det dagliga råvärdet (kan vara brusigt), MA-7 är ett glidande medelvärde över 7 dagar (jämnar ut veckosvängningar), och MA-14 (streckad lila) jämnar ut över 14 dagar. Den gula linjen är det normaliserade priset."
          howToRead="Titta efter om den gula linjen (pris) och de blå linjerna (index) rör sig i samma riktning och vid samma tidpunkter. Om kurvorna följer varandra nära, finns ett samband. Om de går åt olika håll eller den ena rör sig utan att den andra reagerar, är sambandet svagt. MA-7 är bra för att se kortsiktiga trender (veckovis), medan MA-14 visar mer övergripande riktning. När MA-7 korsar över MA-14 uppåt kan det indikera en uppåtgående trend, och tvärtom."
          useCase="Hjälper dig visuellt avgöra om index och pris hänger ihop över tid. Om de rör sig synkroniserat kan indexet vara en nyttig indikator. Du kan också se om det finns perioder där indexet rörde sig först och priset följde efter — det syns som en tidsfördröjning mellan kurvorna."
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(trendData.length / 10))}
              />
              <YAxis
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#B0B8C4" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Index (dagligt)"
                stroke="#2AB8E6"
                strokeWidth={1}
                dot={false}
                strokeOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="ma7"
                name="Index MA-7"
                stroke="#2AB8E6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ma14"
                name="Index MA-14"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 3"
              />
              <Line
                type="monotone"
                dataKey="priceNorm"
                name="THETA-pris (norm.)"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 2. Scatter: Index vs Price ───────────────────────────────── */}
      <Section
        title="Korrelation: Index vs THETA-pris"
        subtitle={`Varje punkt = en dag. Pearson r = ${corrIndexTheta.toFixed(3)}`}
      >
        <Explainer
          whatIsThis={`Ett scatter-diagram (spridningsdiagram) där varje prick representerar en enskild dag. X-axeln visar Activity Index den dagen och Y-axeln visar THETA-priset samma dag. Pearson-korrelationen (r = ${corrIndexTheta.toFixed(3)}) är det matematiska måttet på hur väl punkterna bildar en rak linje.`}
          howToRead="Om punkterna bildar ett tydligt mönster som lutar uppåt från vänster till höger, betyder det att dagar med högre index också hade högre pris (positiv korrelation). Om de bildar ett moln utan tydlig riktning finns inget samband. Om de lutar nedåt, är sambandet negativt (högt index = lågt pris). Ju tätare punkterna ligger längs en tänkt linje, desto starkare korrelation."
          useCase="Scatter-plottet ger en ärligare bild av sambandet än trendlinjer. Du kan se om korrelationen drivs av hela datasetet eller bara ett par extremdagar. Om du ser punkter som ligger långt ifrån resten (outliers), kan de snedvrida korrelationsvärdet. Det hjälper dig bedöma hur pålitlig korrelationssiffran egentligen är."
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
              <XAxis
                dataKey="index"
                name="Activity Index"
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Activity Index",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: "#7D8694", fontSize: 11 },
                }}
              />
              <YAxis
                dataKey="price"
                name="THETA Price"
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={50}
                label={{
                  value: "THETA ($)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#7D8694", fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [
                  typeof value === "number" ? `${value.toFixed(4)}` : value,
                ]}
                labelFormatter={() => ""}
              />
              <Scatter data={scatterData} fill="#2AB8E6" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 3. Component correlations ────────────────────────────────── */}
      <Section
        title="Komponent-korrelationer vs THETA-pris"
        subtitle="Vilka nätverksmetriker korrelerar starkast med priset?"
      >
        <Explainer
          whatIsThis="Vårt Activity Index är byggt av flera komponenter: antal transaktioner, TFUEL-handelsvolym, andel aktiva wallets, antal noder, staking-ratios och antal block. Här bryter vi ut varje komponent separat och mäter hur starkt just den komponenten korrelerar med THETA-priset. Staplarna sorteras efter styrka, från starkast till svagast."
          howToRead="Varje rad visar en komponent med dess korrelationsvärde (r). Längre stapel = starkare samband. Positivt r (t.ex. +0.65) betyder att komponenten rör sig i samma riktning som priset. Negativt r (t.ex. -0.30) betyder att de rör sig i motsatt riktning. Färgkoden till höger sammanfattar: grönt = starkt, gult = medel, rött = svagt."
          useCase="Avslöjar vilka delar av nätverket som har starkast koppling till priset. Om t.ex. transaktioner har stark korrelation men noder har svag, antyder det att marknaden reagerar mer på transaktionsaktivitet. Det kan hjälpa dig förstå vilka metriker som är mest intressanta att bevaka och eventuellt vikta tyngre i indexet."
        />
        <div className="space-y-3">
          {componentCorrelations
            .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
            .map((c) => {
              const label = correlationLabel(c.r);
              const barWidth = Math.abs(c.r) * 100;
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-sm text-[#B0B8C4] w-36 shrink-0">
                    {c.name}
                  </span>
                  <div className="flex-1 h-6 bg-[#0D1117] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: c.color,
                        opacity: 0.7,
                      }}
                    />
                    <span className="absolute right-2 top-0 h-full flex items-center text-xs text-white font-mono">
                      {c.r.toFixed(3)}
                    </span>
                  </div>
                  <span
                    className="text-xs w-12 text-right font-medium"
                    style={{ color: label.color }}
                  >
                    {label.text}
                  </span>
                </div>
              );
            })}
        </div>
        <p className="text-[10px] text-[#5C6675] mt-3">
          Pearson-korrelation beräknad med {rows.length} datapunkter. Positiv = rör sig i samma
          riktning. Negativ = rör sig i motsatt riktning.
        </p>
      </Section>

      {/* ── 3b. TFUEL absorption / burn analysis ─────────────────────── */}
      {tfuelEconomics.daysAvailable >= 2 && (
        <Section
          title="TFUEL net absorption &amp; burn-dynamik"
          subtitle="Hur mycket av den dagliga block-issuance absorberas av burns och avgifter — och hänger det ihop med priset?"
        >
          <Explainer
            whatIsThis="Varje dag skapas 1 238 400 TFUEL som block-rewards — det är den enda källan till nya TFUEL. Samtidigt bränns TFUEL via gas-avgifter och 25% av Edge Network-betalningar. Vi mäter 'net absorption' = block-issuance − supply-tillväxt, vilket approximerar hur mycket av dagens issuance som offsetade av burns."
            howToRead="Korrelationsvärdet mäter om dagar med hög absorption (mycket burn) sammanfaller med dagar med högt pris. Positiv korrelation antyder att nätverksanvändning (som driver burn) också driver pris. Artefaktdagar är dagar då supply växte snabbare än block-issuance — troligen snapshot-drift eller token-unlocks, inte riktigt negativ burn. De utesluts från 7-dagars-snittet."
            useCase="Ger oss en unik vinkel: vi kan säga något om TFUEL-tokenomin som ingen annan publikt analyserar. Om absorption korrelerar starkt med pris, är burn-narrativet validerat i data."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0D1117] rounded-xl p-4">
              <p className="text-xs text-[#7D8694] mb-1">Absorption &harr; TFUEL-pris</p>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: correlationLabel(absorptionStats.corrTfuel).color }}
              >
                {absorptionStats.corrTfuel.toFixed(3)}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: correlationLabel(absorptionStats.corrTfuel).color }}
              >
                {correlationLabel(absorptionStats.corrTfuel).text} korrelation
              </p>
              <p className="text-[10px] text-[#5C6675] mt-0.5">
                n={absorptionStats.n} dagar
              </p>
            </div>
            <div className="bg-[#0D1117] rounded-xl p-4">
              <p className="text-xs text-[#7D8694] mb-1">Artefaktandel</p>
              <p className="text-2xl font-bold text-[#7D8694] tabular-nums">
                {absorptionStats.totalDays > 0
                  ? (
                      (absorptionStats.artifactDays / absorptionStats.totalDays) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </p>
              <p className="text-xs text-[#7D8694] mt-1">
                snapshot-drift / unlock (utesluts ur snittet)
              </p>
            </div>
          </div>

          <div className="bg-[#0D1117] rounded-lg p-4 mb-4">
            <p className="text-sm text-white font-medium mb-2">Tolkning</p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              {(() => {
                const absCorr = absorptionStats.corrTheta;
                const artifactPct =
                  absorptionStats.totalDays > 0
                    ? (absorptionStats.artifactDays / absorptionStats.totalDays) * 100
                    : 0;
                const absStrength = correlationLabel(absCorr).text.toLowerCase();
                const dir = absCorr >= 0 ? "samma riktning" : "motsatt riktning";
                return `Absorption och THETA-pris rör sig i ${dir} med ${absStrength} korrelation (r=${absCorr.toFixed(3)}). ${
                  artifactPct > 25
                    ? `Hög andel artefaktdagar (${artifactPct.toFixed(0)}%) — oftast snapshot-timingen som driftar. Fixa cron-timingen och siffran bör sjunka.`
                    : `Låg andel artefaktdagar (${artifactPct.toFixed(0)}%) — snapshot-datan är konsekvent och 7d-snittet är trovärdigt.`
                }`;
              })()}
            </p>
          </div>

          <div className="bg-[#1E3A5F]/30 border border-[#1E3A5F] rounded-lg p-4">
            <p className="text-xs text-white font-medium mb-1">Viktigt att veta</p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Block rewards är den enda källan till nya TFUEL — Edge Network-jobb
              skapar inte nya tokens. Dagar där supply växt snabbare än 1,238,400
              är <span className="text-white">dataartefakter</span>, oftast
              från snapshot-timingdrift. De clampas till 0% absorption och
              utesluts ur 7d-snittet. Detaljer:{" "}
              <a href="/methodology#tfuel-economics" className="text-[#2AB8E6] hover:underline">
                Methodology &sect; 3
              </a>
              .
            </p>
          </div>
        </Section>
      )}

      {/* ── 3c. EdgeCloud Inference Monitor (TPulse) ─────────────────── */}
      {(() => {
        const tpulse = mcChainHistory["tsub68967"];
        if (!tpulse || tpulse.length < 3) return null;

        const sorted = [...tpulse]
          .sort((a, b) => a.date.localeCompare(b.date))
          .filter((d) => d.txCount24h != null && d.txCount24h > 0);
        if (sorted.length < 3) return null;

        const chartData = sorted.map((d) => ({
          date: formatDate(d.date),
          fullDate: d.date,
          txs: d.txCount24h!,
          txsK: Math.round(d.txCount24h! / 1000),
        }));

        // 7d averages for current and previous week
        const recent7 = sorted.slice(-7);
        const prev7 = sorted.slice(-14, -7);
        const avgRecent = recent7.length > 0
          ? Math.round(recent7.reduce((s, d) => s + d.txCount24h!, 0) / recent7.length)
          : 0;
        const avgPrev = prev7.length > 0
          ? Math.round(prev7.reduce((s, d) => s + d.txCount24h!, 0) / prev7.length)
          : 0;
        const wowChange = avgPrev > 0
          ? ((avgRecent - avgPrev) / avgPrev * 100).toFixed(1)
          : "—";
        const peak = sorted.reduce((max, d) => d.txCount24h! > max.txCount24h! ? d : max);
        const latest = sorted[sorted.length - 1];

        // Correlate TPulse txs with TFUEL absorption
        const absEntries = tfuelEconomics.dailyEntries;
        const absByDate = new Map(absEntries.map((e) => [e.date, e.absorptionRate]));
        const pairs = sorted
          .filter((d) => absByDate.has(d.date))
          .map((d) => ({ txs: d.txCount24h!, abs: absByDate.get(d.date)! }));
        const corrTPulseAbs = pairs.length >= 5
          ? pearson(pairs.map((p) => p.txs), pairs.map((p) => p.abs))
          : null;

        return (
          <Section
            title="EdgeCloud Inference Monitor"
            subtitle="TPulse (tsub68967) loggar alla EdgeCloud-jobb — AI-inferens, GPU-compute, modellanrop. Spårar om nya modelldeployments (t.ex. Qwen3) driver reell trafik."
          >
            <Explainer
              whatIsThis="TPulse-subchainens transaktioner är en direkt proxy för EdgeCloud-användning. Varje AI-inferens, GPU-jobb och modellanrop loggas som en transaktion. Fler transaktioner = fler betalda jobb = mer TFUEL-betalningar (varav 25% bränns)."
              howToRead="Titta på trenden: om dagliga transaktioner ökar efter en ny modelldeployment (t.ex. Qwen3 32B) ser vi bevis på att EdgeCloud faktiskt levererar reell trafik, inte bara testkörningar."
              useCase="Det starkaste beviset vi kan ge att Theta EdgeCloud har verkliga användare. Om vi kan visa en tydlig trafikspike efter en känd deployment är det en kraftig signal till investerare och communityt."
            />

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0D1117] rounded-xl p-4">
                <p className="text-xs text-[#7D8694] mb-1">Senaste (txs/dag)</p>
                <p className="text-2xl font-bold text-[#8B5CF6] tabular-nums">
                  {latest.txCount24h!.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-0.5">{latest.date}</p>
              </div>
              <div className="bg-[#0D1117] rounded-xl p-4">
                <p className="text-xs text-[#7D8694] mb-1">7d snitt</p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {avgRecent.toLocaleString()}
                </p>
                <p className={`text-[10px] mt-0.5 ${Number(wowChange) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {typeof wowChange === "string" && wowChange !== "—" ? (Number(wowChange) >= 0 ? "+" : "") : ""}{wowChange}% vecka-över-vecka
                </p>
              </div>
              <div className="bg-[#0D1117] rounded-xl p-4">
                <p className="text-xs text-[#7D8694] mb-1">Peak</p>
                <p className="text-2xl font-bold text-[#F59E0B] tabular-nums">
                  {peak.txCount24h!.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-0.5">{peak.date}</p>
              </div>
              <div className="bg-[#0D1117] rounded-xl p-4">
                <p className="text-xs text-[#7D8694] mb-1">TPulse ↔ Absorption</p>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: corrTPulseAbs != null ? correlationLabel(corrTPulseAbs).color : "#7D8694" }}
                >
                  {corrTPulseAbs != null ? corrTPulseAbs.toFixed(3) : "—"}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-0.5">
                  {corrTPulseAbs != null ? correlationLabel(corrTPulseAbs).text : "för lite data"} korrelation
                </p>
              </div>
            </div>

            {/* Trend chart */}
            <div className="h-60 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#7D8694", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                  <YAxis tick={{ fill: "#7D8694", fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [Number(v).toLocaleString() + " txs", "EdgeCloud jobb"]} labelFormatter={(l) => `${l}`} />
                  <Bar dataKey="txs" fill="#8B5CF6" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Known events timeline */}
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-xs text-white font-medium mb-2">Kända EdgeCloud-händelser</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  <p className="text-xs text-[#B0B8C4]">
                    <span className="text-white">Apr 20, 2026:</span> Qwen3 32B (Alibaba) live på EdgeCloud — decentraliserad inferens över community-GPU-noder
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                  <p className="text-xs text-[#B0B8C4]">
                    <span className="text-white">Apr 14–20:</span> EdgeCloud listad på GetDeploying.com (25K+ utvecklare)
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#5C6675] mt-3">
                Håll koll på dagliga transaktioner efter dessa datum — en ihållande ökning bekräftar att deployment driver reell trafik, inte bara engångstester.
              </p>
            </div>
          </Section>
        );
      })()}

      {/* ── 4. Lead/Lag analysis ─────────────────────────────────────── */}
      <Section
        title="Lead/Lag-analys"
        subtitle="Korrelerar dagliga indexförändringar med prisförändringar vid olika tidsfördröjningar. Negativt lag = index leder priset."
      >
        <Explainer
          whatIsThis="Lead/lag-analysen undersöker en central fråga: kommer förändringar i nätverksaktivitet före, efter, eller samtidigt som prisförändringar? Vi gör detta genom att skjuta dataserierna mot varandra i tid (från -7 till +7 dagar) och mäta korrelationen vid varje förskjutning. Dag 0 = samma dag. Negativa dagar (t.ex. -3) = vi jämför indexförändringen idag med prisförändringen 3 dagar senare. Positiva dagar (t.ex. +2) = vi jämför indexförändringen idag med prisförändringen 2 dagar innan."
          howToRead={`Varje stapel representerar en tidsförskjutning. Den högsta stapeln (oavsett riktning) visar vid vilken förskjutning sambandet är starkast. Om den högsta stapeln ligger på negativa dagar (t.ex. -2), betyder det att indexförändringar tenderar att komma FÖRE prisförändringar med 2 dagar — indexet "leder" priset. Om den ligger på positiva dagar, är det tvärtom — priset rör sig först. Om den högsta stapeln ligger på dag 0, rör sig index och pris ungefär samtidigt. Gröna staplar = positiv korrelation (rör sig samma håll), röda = negativ korrelation (rör sig motsatt håll), gul = dag 0.`}
          useCase="Det här är kanske den mest intressanta analysen. Om indexet konsekvent leder priset med t.ex. 1-3 dagar, betyder det att nätverksaktivitet kan vara en tidig signal för prisrörelser. Det skulle ge indexet prediktivt värde. OBS: Med begränsad data (kort tidsperiod) ska man vara försiktig med att dra starka slutsatser — mönstret kan vara slumpmässigt. Ju mer data vi samlar, desto mer tillförlitlig blir analysen."
        />
        {leadLag.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadLag}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
                  <XAxis
                    dataKey="lag"
                    tick={{ fill: "#B0B8C4", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Dagar (negativ = index leder)",
                      position: "insideBottom",
                      offset: -5,
                      style: { fill: "#7D8694", fontSize: 11 },
                    }}
                  />
                  <YAxis
                    tick={{ fill: "#B0B8C4", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={[-1, 1]}
                    label={{
                      value: "r",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#7D8694", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [
                      typeof value === "number" ? value.toFixed(3) : value,
                      "Korrelation",
                    ]}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={(lag: any) => {
                      const n = Number(lag);
                      return n === 0
                        ? "Samma dag"
                        : n < 0
                          ? `Index leder ${Math.abs(n)} dag(ar)`
                          : `Pris leder ${n} dag(ar)`;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#445064" />
                  <Bar dataKey="r" radius={[4, 4, 0, 0]}>
                    {leadLag.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.lag === 0 ? "#F59E0B" : entry.r >= 0 ? "#10B981" : "#EF4444"}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-3 bg-[#0D1117] rounded-lg">
              <p className="text-xs text-[#B0B8C4]">
                <span className="text-white font-medium">Tolkning:</span>{" "}
                {(() => {
                  const best = leadLag.reduce((a, b) =>
                    Math.abs(b.r) > Math.abs(a.r) ? b : a
                  );
                  if (best.lag < 0)
                    return `Starkast korrelation vid lag ${best.lag} (r=${best.r.toFixed(3)}): indexförändringar tenderar att föregå prisförändringar med ${Math.abs(best.lag)} dag(ar).`;
                  if (best.lag > 0)
                    return `Starkast korrelation vid lag +${best.lag} (r=${best.r.toFixed(3)}): prisförändringar tenderar att föregå indexförändringar med ${best.lag} dag(ar).`;
                  return `Starkast korrelation vid lag 0 (r=${best.r.toFixed(3)}): förändringarna sker simultant.`;
                })()}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#7D8694]">
            Inte tillräckligt med data för lead/lag-analys (minst 10 datapunkter krävs).
          </p>
        )}
      </Section>

      {/* ── 5. Daily changes comparison ──────────────────────────────── */}
      <Section
        title="Dagliga förändringar: Index vs Pris"
        subtitle="Procentuell daglig förändring jämförd sida vid sida"
      >
        <Explainer
          whatIsThis="Det här diagrammet visar den procentuella förändringen från dag till dag — både för Activity Index (blå) och THETA-priset (gul). Istället för att titta på absoluta värden (t.ex. index = 45, pris = $0.82) tittar vi på hur mycket de förändrades jämfört med dagen innan. En punkt på +5% betyder att värdet ökade med 5% jämfört med föregående dag. Nolllinjen i mitten markerar ingen förändring."
          howToRead="Om de blå och gula linjerna ofta peakar och dippar vid samma tidpunkter, reagerar index och pris på samma saker. Om den blå linjen (index) gör stora hopp utan att den gula (pris) reagerar, eller tvärtom, finns det ingen stark daglig koppling. Stora spikar indikerar ovanligt volatila dagar. Om du ser att den blå linjen konsekvent peakar en dag före den gula, kan det tyda på att indexet leder priset (detta undersöks mer noggrant i lead/lag-analysen ovan)."
          useCase="Hjälper dig identifiera specifika dagar med ovanliga rörelser. Om du ser en stor spike i index utan motsvarande prisrörelse, kan du gå tillbaka och undersöka vad som hände den dagen i nätverket. Det är också användbart för att visuellt upptäcka mönster som de statistiska analyserna kanske missar — t.ex. att sambandet bara gäller vid stora rörelser men inte vid små."
        />
        {dailyChanges.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(dailyChanges.length / 10))}
                />
                <YAxis
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    typeof value === "number" ? `${value.toFixed(2)}%` : value,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#B0B8C4" }} />
                <ReferenceLine y={0} stroke="#445064" />
                <Line
                  type="monotone"
                  dataKey="indexChange"
                  name="Index-förändring"
                  stroke="#2AB8E6"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="priceChange"
                  name="Pris-förändring"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[#7D8694]">Inte tillräckligt med data.</p>
        )}
      </Section>

      {/* ── 6. Metachain vs Main Chain ─────────────────────────────── */}
      {dualIndexData.length >= 2 && (
        <Section
          title="Metachain vs Main Chain"
          subtitle="Ekosystemanvändning jämfört med settlement layer-aktivitet"
        >
          <Explainer
            whatIsThis="Det här diagrammet visar båda indexen sida vid sida. Den gröna linjen (Metachain) mäter faktisk applikationsanvändning — gaming, AI, health data. Den blå linjen (Main Chain) mäter settlement layer-aktivitet — tokenhandel, staking, cross-chain."
            howToRead="Om linjerna rör sig oberoende av varandra, drivs de av olika saker (bra — det visar att ekosystemet har eget liv). Om de rör sig ihop, kan det betyda att allt drivs av samma marknadskrafter. Om metachain stiger medan main chain är platt = appar växer oberoende av marknaden."
            useCase="Hjälper dig förstå om Theta-ekosystemet skapar eget värde eller bara följer kryptomarknaden. En divergens där metachain stiger och main chain är platt är den starkaste bullish-signalen för nätverkets utility."
          />
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0D1117] rounded-xl p-4">
              <p className="text-xs text-[#7D8694] mb-1">Main Chain ↔ Metachain</p>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: correlationLabel(corrMainVsMeta).color }}
              >
                {corrMainVsMeta.toFixed(3)}
              </p>
              <p className="text-xs mt-1" style={{ color: correlationLabel(corrMainVsMeta).color }}>
                {correlationLabel(corrMainVsMeta).text} korrelation
              </p>
              <p className="text-[10px] text-[#5C6675] mt-0.5">n={dualIndexData.length} dagar</p>
            </div>
            <div className="bg-[#0D1117] rounded-xl p-4">
              <p className="text-xs text-[#7D8694] mb-1">Metachain ↔ THETA-pris</p>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: correlationLabel(corrMetachainPrice).color }}
              >
                {corrMetachainPrice.toFixed(3)}
              </p>
              <p className="text-xs mt-1" style={{ color: correlationLabel(corrMetachainPrice).color }}>
                {correlationLabel(corrMetachainPrice).text} korrelation
              </p>
              <p className="text-[10px] text-[#5C6675] mt-0.5">n={dualIndexData.length} dagar</p>
            </div>
            <div className="bg-[#0D1117] rounded-xl p-4">
              <p className="text-xs text-[#7D8694] mb-1">Datapunkter</p>
              <p className="text-2xl font-bold tabular-nums text-white">
                {dualIndexData.length}
              </p>
              <p className="text-xs text-[#7D8694] mt-1">
                dagar med båda index
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dualIndexData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(dualIndexData.length / 10))}
              />
              <YAxis
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend />
              <Line
                type="monotone"
                dataKey="mainChain"
                name="Main Chain"
                stroke="#2AB8E6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="metachain"
                name="Metachain"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── 6b. EdgeCloud Impact Tracker ─────────────────────────── */}
      {edgeImpact && (
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl overflow-hidden">
          <button
            onClick={() => setEdgeImpactOpen(!edgeImpactOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#0D1117]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">EdgeCloud Impact Tracker</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium">NEW</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7D8694]">
                {edgeImpact.daysTracked} dag{edgeImpact.daysTracked !== 1 ? "ar" : ""} sedan Qwen3
              </span>
              <svg
                className={`w-5 h-5 text-[#7D8694] transition-transform duration-200 ${edgeImpactOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {edgeImpactOpen && (
            <div className="px-6 pb-6 space-y-6">
              <p className="text-xs text-[#7D8694]">
                Mäter reell nätverkseffekt av Qwen3 32B och EdgeCloud-deployments från {edgeImpact.trackingStart}. Jämför med 7-dagars baseline ({edgeImpact.baselineEnd} och bakåt).
              </p>

              {/* Signal cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#0D1117] rounded-xl p-5 border border-theta-border">
                  <p className="text-xs text-[#7D8694] mb-2">TPulse-signal</p>
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: edgeImpact.tpulseDelta > 10 ? "#10B981" : edgeImpact.tpulseDelta > 0 ? "#F59E0B" : "#EF4444" }}
                  >
                    {edgeImpact.tpulseDelta > 0 ? "+" : ""}{edgeImpact.tpulseDelta.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#7D8694] mt-2">
                    vs 7d pre-launch baseline ({edgeImpact.baselineTxAvg.toLocaleString()} → {edgeImpact.postTxAvg.toLocaleString()} txs/dag)
                  </p>
                </div>
                <div className="bg-[#0D1117] rounded-xl p-5 border border-theta-border">
                  <p className="text-xs text-[#7D8694] mb-2">TFUEL absorption-signal</p>
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: edgeImpact.absorptionDelta > 3 ? "#10B981" : edgeImpact.absorptionDelta > 0 ? "#F59E0B" : "#EF4444" }}
                  >
                    {edgeImpact.absorptionDelta > 0 ? "+" : ""}{edgeImpact.absorptionDelta.toFixed(1)} pp
                  </p>
                  <p className="text-xs text-[#7D8694] mt-2">
                    procentenheter vs baseline ({edgeImpact.baselineAbsAvg.toFixed(1)}% → {edgeImpact.postAbsAvg.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Impact verdict */}
              <div
                className="rounded-xl p-5 border"
                style={{
                  backgroundColor:
                    edgeImpact.impact === "CONFIRMED" ? "#10B98110" :
                    edgeImpact.impact === "PARTIAL" ? "#F59E0B10" :
                    edgeImpact.impact === "NONE" ? "#EF444410" : "#7D869410",
                  borderColor:
                    edgeImpact.impact === "CONFIRMED" ? "#10B98140" :
                    edgeImpact.impact === "PARTIAL" ? "#F59E0B40" :
                    edgeImpact.impact === "NONE" ? "#EF444440" : "#7D869440",
                }}
              >
                <p
                  className="text-2xl font-bold tracking-wide"
                  style={{
                    color:
                      edgeImpact.impact === "CONFIRMED" ? "#10B981" :
                      edgeImpact.impact === "PARTIAL" ? "#F59E0B" :
                      edgeImpact.impact === "NONE" ? "#EF4444" : "#7D8694",
                  }}
                >
                  {edgeImpact.impact}
                </p>
                <p className="text-sm text-[#B0B8C4] mt-1">{edgeImpact.message}</p>
              </div>

              {/* Dual-axis chart */}
              {(() => {
                const LAUNCH = "2026-04-20";
                const merged = edgeImpact.tpulseTrend.map((t) => {
                  const abs = edgeImpact.absorptionTrend.find((a) => a.date === t.date);
                  return {
                    date: formatDate(t.date),
                    fullDate: t.date,
                    txs: t.txs,
                    txsK: Math.round(t.txs / 1000),
                    absorption: abs && !abs.artifact ? abs.rate : null,
                    isPostLaunch: t.date >= LAUNCH,
                  };
                });
                const launchIdx = merged.findIndex((d) => d.fullDate >= LAUNCH);

                return (
                  <div>
                    <p className="text-xs text-[#7D8694] mb-2">TPulse txs (lila) vs TFUEL absorption % (teal) — streckad linje = Qwen3 launch</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={merged}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: "#7D8694", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(merged.length / 7))} />
                          <YAxis yAxisId="txs" tick={{ fill: "#7D8694", fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                          <YAxis yAxisId="abs" orientation="right" tick={{ fill: "#7D8694", fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${v}%`} domain={[0, "auto"]} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                          {launchIdx >= 0 && (
                            <ReferenceLine x={merged[launchIdx]?.date} yAxisId="txs" stroke="#8B5CF6" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Qwen3", fill: "#8B5CF6", fontSize: 10, position: "top" }} />
                          )}
                          <Line yAxisId="txs" type="monotone" dataKey="txs" stroke="#8B5CF6" strokeWidth={2} dot={false} name="TPulse txs" />
                          <Line yAxisId="abs" type="monotone" dataKey="absorption" stroke="#00d4aa" strokeWidth={2} dot={false} name="Absorption %" connectNulls />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}

              {/* Explainer */}
              <Explainer
                whatIsThis="Denna tracker mäter om EdgeCloud AI-deployments som Qwen3 32B genererar mätbar on-chain-aktivitet via två oberoende signaler: TPulse-transaktioner (EdgeCloud loggar AI-interaktioner on-chain) och TFUEL-absorption (nodoperatörer tjänar TFUEL för inferens-jobb, varav 25% bränns)."
                howToRead="Grönt = stark signal (TPulse +10% eller absorption +3pp). Gult = tidig signal. Grått = ännu ingen mätbar effekt. Om bara absorption stiger pågår inferens men loggas kanske inte per-request till TPulse. Båda stigande = starkaste bekräftelsen."
                useCase="Det starkaste beviset vi kan leverera att EdgeCloud inte bara är en demo — att Qwen3 och andra modeller faktiskt driver reella betalda GPU-jobb. En ihållande ökning i båda signalerna efter launch-datum är exakt den datan investerare och communityt frågar efter."
              />
            </div>
          )}
        </div>
      )}

      {/* ── 7. Per-chain correlations with THETA price ────────────── */}
      {chainCorrelations.length >= 2 && (
        <Section
          title="Kedje-korrelationer med THETA-pris"
          subtitle="Vilka subchains korrelerar starkast med priset?"
        >
          <Explainer
            whatIsThis="Varje stapel visar hur starkt en enskild kedjas aktivitetsscore korrelerar med THETA-priset. Till skillnad från komponentkorrelationerna (sektion 4) som bryter ner main chain-indexet, visar detta hur varje kedja i hela Metachain-ekosystemet hänger ihop med priset — inklusive subchains som Lavita, TPulse, och gaming-kedjor."
            howToRead="Längre stapel = starkare samband. Positiv korrelation (+) betyder att kedjans aktivitet och priset rör sig i samma riktning. En subchain med svag korrelation kan röra sig oberoende av marknaden — det är ofta ett tecken på att den drivs av riktig applikationsanvändning snarare än spekulativt intresse."
            useCase="Avslöjar vilka kedjor som mest påverkas av kryptomarknaden och vilka som lever sitt eget liv. En gaming-kedja med låg priskorrelation men hög aktivitet är ett starkt tecken på reell utility. En kedja som bara rör sig med priset kanske mest reflekterar sentiment."
          />
          <ResponsiveContainer width="100%" height={Math.max(120, chainCorrelations.length * 50)}>
            <BarChart data={chainCorrelations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" horizontal={false} />
              <XAxis
                type="number"
                domain={[-1, 1]}
                tick={{ fill: "#B0B8C4", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#B0B8C4", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <ReferenceLine x={0} stroke="#2A3548" />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [Number(v).toFixed(3), "r"]}
              />
              <Bar dataKey="r" radius={[0, 6, 6, 0]} barSize={20}>
                {chainCorrelations.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-[#B0B8C4]">
            {chainCorrelations.map((c) => (
              <span key={c.chainId}>
                <span style={{ color: c.color }}>{c.name}</span>: r={c.r.toFixed(3)} ({c.n} dagar)
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── 8. Metachain lead/lag analysis ──────────────────────────── */}
      {mcLeadLag.length > 0 && (() => {
        const peakLag = mcLeadLag.reduce((best, curr) =>
          Math.abs(curr.r) > Math.abs(best.r) ? curr : best
        );
        return (
          <Section
            title="Metachain Lead/Lag-analys"
            subtitle={`Leder eller följer ekosystemaktiviteten priset? Starkast: lag ${peakLag.lag} (r = ${peakLag.r.toFixed(3)})`}
          >
            <Explainer
              whatIsThis="Samma metod som lead/lag-analysen för main chain (sektion 5), men här testar vi om Metachain Utilization Index — det vill säga den samlade aktiviteten över alla subchains — leder eller följer THETA-priset. Vi beräknar korrelation mellan daglig procentuell förändring i metachain-indexet och priset, med offset -7 till +7 dagar."
              howToRead="Negativa lag-värden (t.ex. -3) betyder att ekosystemaktiviteten rörde sig 3 dagar FÖRE priset. Om den starkaste korrelationen ligger på ett negativt lag, kan det tyda på att ekosystemanvändning leder prisrörelser — en potentiellt starkare signal än main chain som ofta drivs av handel. Positiva lag-värden betyder att priset rörde sig först."
              useCase="Om metachain-indexet leder priset är det en starkare indikator än main chain (som till stor del mäter handelssentiment). Det skulle betyda att riktiga applikationsmetriker — gaming, AI, health data — föregår prisrörelser. Det är den typ av ledande indikator som är mest intressant för fundamental analys."
            />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mcLeadLag}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" />
                <XAxis
                  dataKey="lag"
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "← Metachain leder | Priset leder →",
                    position: "insideBottom",
                    offset: -5,
                    style: { fill: "#7D8694", fontSize: 10 },
                  }}
                />
                <YAxis
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  domain={[-1, 1]}
                />
                <ReferenceLine y={0} stroke="#2A3548" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [Number(v).toFixed(3), "r"]}
                  labelFormatter={(l) => `Lag: ${l} dagar`}
                />
                <Bar dataKey="r" radius={[4, 4, 0, 0]}>
                  {mcLeadLag.map((entry) => (
                    <Cell
                      key={entry.lag}
                      fill={entry.lag === peakLag.lag ? "#10B981" : "#2AB8E6"}
                      opacity={entry.lag === peakLag.lag ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        );
      })()}

      {/* ── 9. Raw data table ────────────────────────────────────────── */}
      <Section title="Rådata" subtitle={isAggregated ? `${rows.length} veckosnitt` : `Senaste ${rows.length} dagarna`}>
        <Explainer
          whatIsThis="Rådata-tabellen visar de faktiska siffror som alla grafer och beräkningar ovan bygger på. Varje rad är en dag. Kolumnerna visar: Main Chain Activity Index, Metachain Utilization Index (grön), THETA- och TFUEL-pris, transaktioner, wallet-aktivitet, staking-noder, antal aktiva kedjor och coverage-procent."
          howToRead="Tabellen sorteras med nyaste datum överst. Du kan använda den för att dubbelkolla specifika datapunkter som sticker ut i graferna. Om en graf visar en ovanlig spike, kan du hitta det exakta datumet här och se alla metriker för just den dagen. Streck (–) betyder att data saknas för den dagen."
          useCase="Ger full transparens — du kan se exakt vilken data som matats in och granska den manuellt. Användbart för att identifiera dataproblem (saknade värden, orimliga siffror) och för att korskontrollera mot externa källor."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[#7D8694] border-b border-[#2A3548]">
                <th className="py-2 pr-3">Datum</th>
                <th className="py-2 pr-3 text-right">Main Chain</th>
                <th className="py-2 pr-3 text-right">Metachain</th>
                <th className="py-2 pr-3 text-right">THETA ($)</th>
                <th className="py-2 pr-3 text-right">TFUEL ($)</th>
                <th className="py-2 pr-3 text-right">Txs</th>
                <th className="py-2 pr-3 text-right">Wallet %</th>
                <th className="py-2 pr-3 text-right">Noder</th>
                <th className="py-2 pr-3 text-right">Kedjor</th>
                <th className="py-2 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .reverse()
                .slice(0, 50)
                .map((r) => (
                  <tr
                    key={r.date}
                    className="border-b border-[#1A2332] text-[#B0B8C4] hover:bg-[#1A2332]/50"
                  >
                    <td className="py-1.5 pr-3 text-white">{formatDate(r.date)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.score.toFixed(1)}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-[#10B981]">
                      {mcByDate.has(r.date) ? mcByDate.get(r.date)!.score.toFixed(1) : "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.thetaPrice != null
                        ? `$${r.metrics.thetaPrice.toFixed(4)}`
                        : "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.tfuelPrice != null
                        ? `$${r.metrics.tfuelPrice.toFixed(5)}`
                        : "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.dailyTxs?.toLocaleString() ?? "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.walletActivity != null
                        ? `${r.metrics.walletActivity.toFixed(1)}%`
                        : "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.stakingNodes?.toLocaleString() ?? "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {mcByDate.has(r.date) && mcByDate.get(r.date)!.chainsAvailable != null
                        ? mcByDate.get(r.date)!.chainsAvailable
                        : "–"}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {mcByDate.has(r.date) && mcByDate.get(r.date)!.coveragePct != null
                        ? `${mcByDate.get(r.date)!.coveragePct}%`
                        : "–"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="text-[10px] text-[#5C6675] text-center pb-8">
        Intern forskningssida &middot; Data uppdateras dagligen via cron &middot; Alla
        beräkningar sker lokalt i webbläsaren
      </p>
    </div>
  );
}
