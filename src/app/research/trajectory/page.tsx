"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface TrajectoryResponse {
  windowDays: number;
  shortWindow: number;
  longWindow: number;
  trendThresholdPct: number;
  metrics: MetricResult[];
  summary: {
    trendingUp: number;
    trendingDown: number;
    trendingFlat: number;
    insufficient: number;
    ratable: number;
    total: number;
    verdict:
      | "spiral_up"
      | "growing"
      | "mixed"
      | "stagnant"
      | "declining"
      | "insufficient";
    verdictMessage: string;
  };
  generatedAt: string;
}

const DIRECTION_COLOR: Record<TrendDirection, string> = {
  up: "#10B981",
  down: "#EF4444",
  flat: "#F59E0B",
  insufficient: "#7D8694",
};

const DIRECTION_LABEL: Record<TrendDirection, string> = {
  up: "Uppåt",
  down: "Nedåt",
  flat: "Sidledes",
  insufficient: "Otillräcklig data",
};

const VERDICT_COLOR: Record<TrajectoryResponse["summary"]["verdict"], string> = {
  spiral_up: "#10B981",
  growing: "#10B981",
  mixed: "#F59E0B",
  stagnant: "#F59E0B",
  declining: "#EF4444",
  insufficient: "#7D8694",
};

function formatNumber(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit.startsWith("%")) return `${v.toFixed(1)}%`;
  if (Math.abs(v) >= 1000) return v.toLocaleString("sv-SE", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

function DirectionArrow({ direction }: { direction: TrendDirection }) {
  if (direction === "up") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M7 14l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "down") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "flat") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({ metric }: { metric: MetricResult }) {
  const color = DIRECTION_COLOR[metric.direction];
  const sparkData = metric.series.map((p) => ({
    date: p.date,
    value: p.value,
  }));
  const hasAnyData = metric.series.some((p) => p.value != null);

  return (
    <div className="bg-[#0D1117] border border-[#2A3548]/60 rounded-xl p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <p className="text-xs text-[#7D8694] uppercase tracking-wide">{metric.label}</p>
          {metric.subtitle && (
            <p className="text-[11px] text-[#5C6675] mt-0.5">{metric.subtitle}</p>
          )}
        </div>
        <span
          className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ color, background: `${color}1A` }}
        >
          <DirectionArrow direction={metric.direction} />
          {DIRECTION_LABEL[metric.direction]}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-semibold text-white tabular-nums">
          {formatNumber(metric.latest, metric.unit)}
        </span>
        <span className="text-xs text-[#7D8694]">{metric.unit}</span>
      </div>

      <div className="text-xs text-[#B0B8C4] mt-2 mb-3">
        30d-snitt:{" "}
        <span className="text-white tabular-nums">{formatNumber(metric.shortAvg, metric.unit)}</span>
        {metric.changePct != null && (
          <>
            {" · "}
            <span style={{ color }} className="tabular-nums font-medium">
              {metric.changePct > 0 ? "+" : ""}
              {metric.changePct.toFixed(1)}%
            </span>
            <span className="text-[#7D8694]"> vs 90d</span>
          </>
        )}
      </div>

      <div className="h-16 -mx-1">
        {hasAnyData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "#1B2436",
                  border: "1px solid #2A3548",
                  borderRadius: "6px",
                  color: "#eaecf0",
                  fontSize: "11px",
                  padding: "6px 8px",
                }}
                labelFormatter={(label) => label}
                formatter={(v) => [formatNumber(typeof v === "number" ? v : null, metric.unit), metric.label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${metric.key})`}
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[#7D8694]">
            Ingen data i fönstret
          </div>
        )}
      </div>

      {metric.note && (
        <p className="text-[11px] text-[#7D8694] mt-3 leading-relaxed border-t border-[#2A3548]/40 pt-2">
          {metric.note}
        </p>
      )}
    </div>
  );
}

export default function TrajectoryPage() {
  const [data, setData] = useState<TrajectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [needsKey, setNeedsKey] = useState(false);

  async function load(secret: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/trajectory?key=${encodeURIComponent(secret)}`);
      if (res.status === 401) {
        setNeedsKey(true);
        localStorage.removeItem("theta-research-key");
        return;
      }
      if (!res.ok) {
        setError("Kunde inte hämta trajectory-data");
        return;
      }
      const json = (await res.json()) as TrajectoryResponse;
      setData(json);
      localStorage.setItem("theta-research-key", secret);
      setNeedsKey(false);
    } catch {
      setError("Anslutningsfel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("theta-research-key");
    if (stored) {
      load(stored);
    } else {
      setNeedsKey(true);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (needsKey) {
    return (
      <div className="min-h-screen bg-[#0A0F1B] text-white flex items-center justify-center px-4">
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6 w-full max-w-sm">
          <h1 className="text-lg font-semibold mb-2">Theta Trajectory</h1>
          <p className="text-sm text-[#B0B8C4] mb-4">
            Kräver research-nyckel.
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && keyInput) load(keyInput);
            }}
            placeholder="Nyckel"
            className="w-full px-3 py-2 bg-[#0D1117] border border-[#2A3548] rounded-lg text-sm text-white focus:outline-none focus:border-[#2AB8E6]"
          />
          <button
            onClick={() => load(keyInput)}
            disabled={!keyInput || loading}
            className="w-full mt-3 px-4 py-2 bg-[#2AB8E6] hover:bg-[#2AB8E6]/90 disabled:opacity-50 text-[#0A0F1B] font-medium rounded-lg text-sm transition-colors"
          >
            {loading ? "Laddar…" : "Lås upp"}
          </button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0A0F1B] text-white flex items-center justify-center">
        <p className="text-sm text-[#7D8694]">Laddar trajectory…</p>
      </div>
    );
  }

  const { metrics, summary } = data;
  const verdictColor = VERDICT_COLOR[summary.verdict];

  return (
    <div className="min-h-screen bg-[#0A0F1B] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 text-xs text-[#2AB8E6] hover:text-[#2AB8E6]/80 transition-colors mb-6"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tillbaka till Research
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">Theta Trajectory</h1>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2AB8E6]/10 text-[#2AB8E6] border border-[#2AB8E6]/30">
              Beta
            </span>
          </div>
          <p className="text-sm text-[#B0B8C4] max-w-2xl">
            Tar Theta sig ur slumpen? Fyra demand-side-mått över {data.windowDays} dagar.
            Varje mått räknas som &ldquo;trendar uppåt&rdquo; när {data.shortWindow}-dagars
            medelvärde ligger minst {data.trendThresholdPct}% över {data.longWindow}-dagars
            medelvärde.
          </p>
        </header>

        <div
          className="rounded-xl p-6 mb-6 border"
          style={{
            background: `linear-gradient(135deg, ${verdictColor}10, transparent)`,
            borderColor: `${verdictColor}40`,
          }}
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-semibold tabular-nums" style={{ color: verdictColor }}>
              {summary.trendingUp}
            </span>
            <span className="text-xl text-[#B0B8C4]">av {summary.total} trendar uppåt</span>
          </div>
          <p className="text-sm text-[#B0B8C4]">{summary.verdictMessage}</p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <span className="text-[#10B981]">↗ {summary.trendingUp} upp</span>
            <span className="text-[#F59E0B]">→ {summary.trendingFlat} sidledes</span>
            <span className="text-[#EF4444]">↘ {summary.trendingDown} ner</span>
            {summary.insufficient > 0 && (
              <span className="text-[#7D8694]">○ {summary.insufficient} otillräcklig data</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {metrics.map((m) => (
            <MetricCard key={m.key} metric={m} />
          ))}
        </div>

        <div className="bg-[#151D2E]/60 border border-[#2A3548]/50 rounded-xl p-5 text-xs text-[#B0B8C4] leading-relaxed">
          <p className="text-white text-sm font-medium mb-2">Om mätningen</p>
          <p className="mb-2">
            Vi mäter <strong>demand-side</strong>-aktivitet — sådant som speglar faktiska
            användare och kunder. Supply-side-mått (antal edge nodes, validators, staking
            ratio) är medvetet uteslutna eftersom de drivs av TFUEL-belöningar snarare än
            av efterfrågan på EdgeCloud.
          </p>
          <p className="mb-2">
            <strong>Wallet activity rate</strong> mäter andelen block som innehåller
            riktiga användartransaktioner (inte bara systembokföring).
            <strong> TPulse subchain</strong> loggar EdgeCloud-jobb specifikt — ny modell-
            inferens, GPU-anrop, AI-jobb.
            <strong> TFUEL absorption</strong> är vår bästa proxy för burn från real
            användning.
          </p>
          <p className="text-[#7D8694]">
            Senast uppdaterad: {new Date(data.generatedAt).toLocaleString("sv-SE")}
          </p>
        </div>
      </div>
    </div>
  );
}
