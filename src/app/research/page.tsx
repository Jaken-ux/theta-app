"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "recharts";

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

export default function ResearchPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoryRow[]>([]);

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
      // Fetch activity data
      const histRes = await fetch("/api/activity-history");
      if (histRes.ok) setData(await histRes.json());
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

  // ── Filter rows with price data ──────────────────────────────────────────
  const rows = useMemo(
    () => data.filter((r) => r.metrics.thetaPrice != null && r.score > 0),
    [data]
  );

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
    return components.map((c) => {
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
  }, [rows]);

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
      <div>
        <h1 className="text-2xl font-bold text-white">Research Lab</h1>
        <p className="text-sm text-[#B0B8C4]">
          Intern analys av nätverksdata &middot; {rows.length} datapunkter
        </p>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
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

      {/* ── 1. Trend: Index + Price (normalized) ─────────────────────── */}
      <Section
        title="Trendanalys: Index vs Pris"
        subtitle="Activity index med 7- och 14-dagars glidande medelvärde. Priset normaliserat till 0–100-skala för jämförelse."
      >
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

      {/* ── 4. Lead/Lag analysis ─────────────────────────────────────── */}
      <Section
        title="Lead/Lag-analys"
        subtitle="Korrelerar dagliga indexförändringar med prisförändringar vid olika tidsfördröjningar. Negativt lag = index leder priset."
      >
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

      {/* ── 6. Raw data table ────────────────────────────────────────── */}
      <Section title="Rådata" subtitle="Senaste 30 dagarna">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[#7D8694] border-b border-[#2A3548]">
                <th className="py-2 pr-3">Datum</th>
                <th className="py-2 pr-3 text-right">Index</th>
                <th className="py-2 pr-3 text-right">THETA ($)</th>
                <th className="py-2 pr-3 text-right">TFUEL ($)</th>
                <th className="py-2 pr-3 text-right">Txs</th>
                <th className="py-2 pr-3 text-right">TFUEL Vol</th>
                <th className="py-2 pr-3 text-right">Wallet %</th>
                <th className="py-2 text-right">Noder</th>
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .reverse()
                .slice(0, 30)
                .map((r) => (
                  <tr
                    key={r.date}
                    className="border-b border-[#1A2332] text-[#B0B8C4] hover:bg-[#1A2332]/50"
                  >
                    <td className="py-1.5 pr-3 text-white">{formatDate(r.date)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.score.toFixed(1)}
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
                      {r.metrics.tfuelVolume != null
                        ? `${(r.metrics.tfuelVolume / 1e6).toFixed(1)}M`
                        : "–"}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.metrics.walletActivity != null
                        ? `${r.metrics.walletActivity.toFixed(1)}%`
                        : "–"}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {r.metrics.stakingNodes?.toLocaleString() ?? "–"}
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
