"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SimplifyThis from "../SimplifyThis";
import LearnMore from "../LearnMore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────── */

interface ChainScore {
  chainId: string;
  chainName: string;
  score: number;
  weight: number;
  available: boolean;
  error?: string;
  metrics: {
    txCount24h: number;
    volume24h?: number;
    custom?: Record<string, number>;
  };
}

interface HistoryEntry {
  date: string;
  compositeScore: number;
  chainCount: number;
  chainsAvailable?: number;
  coveragePct?: number;
}

interface RegisteredChain {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface MetachainData {
  current: {
    compositeScore: number;
    chains: ChainScore[];
    chainCount: number;
    timestamp: string;
  };
  registeredChains: RegisteredChain[];
  coveragePct?: number;
  history: HistoryEntry[];
  chainHistory?: Record<string, { date: string; score: number; txCount24h: number; available: boolean }[]>;
}

/* ── Helpers ───────────────────────────────────────────────── */

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

const CHAIN_COLORS: Record<string, string> = {
  "main-chain": "#2AB8E6",
  tsub360890: "#10B981",  // Lavita
  tsub68967: "#8B5CF6",   // TPulse
  tsub7734: "#F59E0B",    // Passaways
  tsub47683: "#EF4444",   // Grove
  tsub9065: "#7D8694",    // POGS
  "proxy-indicators": "#E879F9", // Ecosystem Growth
};

function getChainColor(id: string): string {
  return CHAIN_COLORS[id] ?? "#7D8694";
}

/* ── Tooltip ───────────────────────────────────────────────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#7D8694] mb-1">{label}</p>
      <p className="text-white font-medium">{payload[0].value.toFixed(1)}</p>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function MetachainDashboard({
  serverData,
}: {
  serverData?: MetachainData | null;
}) {
  const [data, setData] = useState<MetachainData | null>(serverData ?? null);
  const [loading, setLoading] = useState(!serverData);
  const [error, setError] = useState<string | null>(null);

  // Only fetch client-side if no server data was provided
  useEffect(() => {
    if (serverData) return;
    fetch("/api/metachain")
      .then((r) => {
        if (!r.ok) throw new Error("API failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [serverData]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-8 animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#151D2E] border border-[#EF4444]/30 rounded-2xl p-8 text-center">
        <p className="text-[#EF4444] font-medium mb-2">Failed to load data</p>
        <p className="text-sm text-[#B0B8C4]">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const { current, history, registeredChains, coveragePct } = data;
  const coverage = coveragePct ?? 100;
  const chainsAvailable = current.chains.filter((c) => c.available).length;
  const chartData = [...history].reverse().map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: h.compositeScore,
    coverage: h.coveragePct ?? 100,
  }));

  const barData = current.chains.map((c) => ({
    name: c.chainName,
    score: Math.round(c.score * 10) / 10,
    weight: Math.round(c.weight * 100),
    color: getChainColor(c.chainId),
    available: c.available,
  }));

  return (
    <div className="space-y-6">
      {/* ── Composite Score Hero ──────────────────────────── */}
      <motion.div
        className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Score */}
          <div>
            <p className="text-xs text-[#B0B8C4] uppercase tracking-wide mb-1">
              Metachain Utilization Index
            </p>
            <div className="flex items-end gap-3">
              <span className="text-[64px] sm:text-[80px] leading-none font-semibold tabular-nums text-white">
                {Math.round(current.compositeScore)}
              </span>
              <span className="text-2xl text-[#B0B8C4] mb-3">/100</span>
            </div>
            <p className="text-sm text-[#B0B8C4] mt-2">
              Weighted average across {current.chainCount} chain
              {current.chainCount !== 1 ? "s" : ""}. A score of 100 means
              all chains are hitting their activity baselines.
            </p>
            <SimplifyThis>
              <p className="mb-2">Think of this number as a &quot;how busy is Theta?&quot; score.</p>
              <p className="mb-2">We check each chain in the Theta ecosystem — are games being played? Are AI jobs running? Are tokens being moved? Each chain gets its own score, and we combine them into this one number.</p>
              <p>A higher number means more real activity is happening across the ecosystem. A lower number means things are quieter. Unlike the <strong className="text-white">Main Chain Activity Index</strong> on the Network page, this is not about trading or market hype — it is about whether applications are actually being used.</p>
            </SimplifyThis>

            {/* Chain pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {registeredChains.map((chain) => {
                const live = current.chains.find(
                  (c) => c.chainId === chain.id
                );
                return (
                  <div
                    key={chain.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
                    style={{
                      borderColor: `${getChainColor(chain.id)}40`,
                      backgroundColor: `${getChainColor(chain.id)}10`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getChainColor(chain.id) }}
                    />
                    <span style={{ color: getChainColor(chain.id) }}>
                      {chain.name}
                    </span>
                    {live && (
                      <span className="text-[#7D8694] ml-1">
                        {Math.round(live.score)}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Placeholder for future chains */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[#2A3548] text-xs text-[#5C6675]">
                + more chains coming
              </div>
            </div>
          </div>

          {/* Right: Trend chart */}
          <div className="border-t lg:border-t-0 lg:border-l border-[#2A3548] pt-6 lg:pt-0 lg:pl-8">
            <p className="text-xs text-[#B0B8C4] uppercase tracking-wide mb-3">
              Trend ({chartData.length} days)
            </p>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="metachainGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#2AB8E6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#2AB8E6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A3548"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#7D8694", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#7D8694", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2AB8E6"
                    strokeWidth={2}
                    fill="url(#metachainGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-[#5C6675]">
                Trend data will appear after multiple days of collection.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Coverage Confidence ─────────────────────────── */}
      <motion.div
        className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-semibold text-white">
            Coverage Confidence
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              coverage >= 80
                ? "bg-[#10B981]/15 text-[#10B981]"
                : coverage >= 50
                ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                : "bg-[#EF4444]/15 text-[#EF4444]"
            }`}
          >
            {coverage}%
          </span>
        </div>
        <p className="text-sm text-[#B0B8C4] mb-4">
          {chainsAvailable} of {current.chainCount} data sources responded.
          {coverage < 100
            ? " The composite score is based on partial data — some chains may be offline."
            : " All registered chains are reporting data."}
        </p>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-[#7D8694] mb-1.5">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="h-2.5 bg-[#2A3548] rounded-full overflow-hidden relative">
            <div className="h-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#10B981] opacity-30 w-full" />
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                background:
                  coverage >= 80
                    ? "#10B981"
                    : coverage >= 50
                    ? "#F59E0B"
                    : "#EF4444",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${coverage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Per-chain status pills */}
        <div className="flex flex-wrap gap-2">
          {current.chains.map((chain) => (
            <div
              key={chain.chainId}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]"
              style={{
                backgroundColor: chain.available
                  ? `${getChainColor(chain.chainId)}10`
                  : "#2A354820",
                border: `1px solid ${
                  chain.available
                    ? `${getChainColor(chain.chainId)}30`
                    : "#2A354850"
                }`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: chain.available
                    ? getChainColor(chain.chainId)
                    : "#5C6675",
                }}
              />
              <span
                style={{
                  color: chain.available
                    ? getChainColor(chain.chainId)
                    : "#5C6675",
                }}
              >
                {chain.chainName}
              </span>
              <span className={chain.available ? "text-[#7D8694]" : "text-[#5C6675]"}>
                {chain.available ? "ok" : "offline"}
              </span>
            </div>
          ))}
        </div>

        <SimplifyThis>
          <p className="mb-2">Coverage confidence tells you how complete the picture is. If all chains respond with data, confidence is 100%. If some chains are offline or unreachable, confidence drops — and the composite score is based only on what we could reach.</p>
          <p>Think of it like a survey — if you ask 7 departments and 7 answer, you have full coverage. If only 5 answer, your results are still useful but less complete.</p>
        </SimplifyThis>
      </motion.div>

      {/* ── Per-Chain Breakdown ───────────────────────────── */}
      <motion.div
        className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-base font-semibold text-white mb-1">
          Chain Breakdown
        </h3>
        <p className="text-sm text-[#B0B8C4] mb-2">
          Each chain is scored independently. The bar chart shows how they
          compare — the composite score above is their weighted average.
        </p>
        <SimplifyThis>
          <p className="mb-2">Each bar represents one chain in the Theta ecosystem. Longer bar = more activity on that chain.</p>
          <p className="mb-2">The <strong className="text-white">Main Chain</strong> is where staking and token transfers happen. The other chains are &quot;subchains&quot; — think of them as specialized departments: Lavita handles health AI, TPulse tracks EdgeCloud jobs, Passaways and Grove are gaming platforms.</p>
          <p>A chain scoring above 100 means it is exceeding its expected baseline of activity. A chain scoring 0 may be temporarily inactive or just very quiet.</p>
        </SimplifyThis>
        <div className="mb-6" />

        {barData.length > 0 && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={Math.max(120, barData.length * 60)}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2A3548"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#7D8694", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#B0B8C4", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#151D2E] border border-[#2A3548] rounded-lg px-3 py-2 text-xs shadow-xl">
                        <p className="text-white font-medium mb-1">
                          {d.name}
                        </p>
                        <p className="text-[#B0B8C4]">
                          Score: {d.score} — Weight: {d.weight}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.available ? entry.color : "#2A3548"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chain detail cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {current.chains.map((chain) => (
            <div
              key={chain.chainId}
              className="bg-[#0D1117] rounded-xl p-4 border-l-2"
              style={{
                borderLeftColor: chain.available
                  ? getChainColor(chain.chainId)
                  : "#2A3548",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-sm font-medium"
                  style={{ color: getChainColor(chain.chainId) }}
                >
                  {chain.chainName}
                </p>
                {chain.available ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981]">
                    live
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444]">
                    error
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {Math.round(chain.score)}
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#B0B8C4]">
                {chain.chainId === "proxy-indicators" ? (
                  <>
                    <p>Subchains: {chain.metrics.custom?.subchainCount ?? "—"}</p>
                    <p>Cross-chain txs: {fmtNum(chain.metrics.custom?.crossChainTxs ?? 0)}</p>
                    <p>Registrar txs: {fmtNum(chain.metrics.custom?.collateralActivity ?? 0)}</p>
                  </>
                ) : (
                  <>
                    <p>Txs/24h: {fmtNum(chain.metrics.txCount24h)}</p>
                    {chain.metrics.volume24h != null && (
                      <p>Volume: {fmtUsd(chain.metrics.volume24h)}</p>
                    )}
                  </>
                )}
                <p>Weight: {Math.round(chain.weight * 100)}%</p>
              </div>
              {chain.error && (
                <p className="text-[10px] text-[#EF4444] mt-2 truncate">
                  {chain.error}
                </p>
              )}
            </div>
          ))}

          {/* Coming soon placeholder */}
          <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-dashed border-[#2A3548] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-[#5C6675] mb-1">More chains coming</p>
            <p className="text-xs text-[#3D4654]">
              When subchain APIs become available, they will appear here
              automatically.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── How It Works ─────────────────────────────────── */}
      <motion.div
        className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-base font-semibold text-white mb-2">
          How this index works
        </h3>
        <p className="text-sm text-[#B0B8C4]">
          We fetch live data from each chain, normalize it to a comparable
          scale, and combine everything into a single score.
        </p>
        <LearnMore>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-[#2AB8E6]/15 border border-[#2AB8E6]/30 flex items-center justify-center text-sm text-[#2AB8E6] mb-3">
              1
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Fetch per-chain data
            </p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Each chain has its own adapter that calls its explorer API to get
              transaction count, block data, and wallet activity.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-sm text-[#10B981] mb-3">
              2
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Normalize to 0–100
            </p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Each chain has its own baseline. A score of 100 means it hit
              its expected daily activity. Scores can exceed 100.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-sm text-[#8B5CF6] mb-3">
              3
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Weighted composite
            </p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Scores are combined using each chain&apos;s weight. The main chain
              and Lavita weigh most. Adding a chain automatically adjusts the
              composite.
            </p>
          </div>
        </div>
        </LearnMore>

        <h3 className="text-base font-semibold text-white mt-6 mb-2">
          What this index does NOT capture
        </h3>
        <p className="text-sm text-[#B0B8C4]">
          Even with 6 chains, this index is still incomplete. Some Theta activity is invisible to any blockchain index.
        </p>
        <LearnMore>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Off-chain activity</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Video delivery via Theta CDN and EdgeCloud GPU compute jobs happen
              off-chain. These represent real utility but produce no blockchain
              transactions we can measure.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Transaction quality</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              We count transactions but cannot distinguish a real user action
              from an automated bot. High tx count does not always mean high
              human usage.
            </p>
          </div>
        </div>
        </LearnMore>
      </motion.div>
    </div>
  );
}
