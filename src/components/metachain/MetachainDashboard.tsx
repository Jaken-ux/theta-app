"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SimplifyThis from "../SimplifyThis";
import LearnMore from "../LearnMore";
import MetachainInfoModal, { InfoButton } from "./MetachainInfoModal";
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
  ComposedChart,
  Line,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────── */

interface ChainScore {
  chainId: string;
  chainName: string;
  score: number;
  weight: number;
  available: boolean;
  error?: string;
  inactiveSince?: string;
  excludeFromComposite?: boolean;
  status?: "active" | "offline";
  lastActiveDate?: string;
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

interface DailyEntry {
  date: string;
  absorption: number;
  absorptionRate: number;
  isEdgeSpike: boolean;
}

interface TfuelEconomicsData {
  dailyIssuance: number;
  avgSupplyGrowth7d: number | null;
  avgAbsorption7d: number | null;
  avgAbsorptionRate7d: number | null;
  dailyEntries: DailyEntry[];
  daysAvailable: number;
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
  trackedSubchainTxs?: number;
  trackedSubchainCount?: number;
  totalMetachainTxs?: number | null;
  totalMetachainSource?: string | null;
  tfuelEconomics?: TfuelEconomicsData;
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

/* ── Metachain Milestones ──────────────────────────────────── */

interface MetachainTier {
  name: string;
  ceiling: number;
  color: string;
  label: string;
  description: string;
}

const METACHAIN_TIERS: MetachainTier[] = [
  {
    name: "Early Ecosystem",
    ceiling: 50,
    color: "#F59E0B",
    label: "First chains online",
    description:
      "A handful of subchains are active alongside the main chain. Real applications exist but usage is still building. The foundation of the multi-chain ecosystem is in place.",
  },
  {
    name: "Growing Ecosystem",
    ceiling: 100,
    color: "#2AB8E6",
    label: "Chains hitting their baselines",
    description:
      "Multiple subchains are consistently active. Applications across gaming, AI, and health data are generating sustained transaction volume. The ecosystem is delivering real utility.",
  },
  {
    name: "Thriving Ecosystem",
    ceiling: 250,
    color: "#10B981",
    label: "Broad adoption across chains",
    description:
      "Most subchains exceed their baselines. New chains are registering regularly. Cross-chain activity is high, showing an interconnected ecosystem with diverse use cases.",
  },
  {
    name: "Mature Ecosystem",
    ceiling: 500,
    color: "#8B5CF6",
    label: "Full-scale multi-chain network",
    description:
      "The Theta Metachain operates at scale — dozens of active subchains, high cross-chain bridging, and off-chain metrics (video, AI compute) becoming measurable.",
  },
];

function getMetachainTier(score: number) {
  for (let i = 0; i < METACHAIN_TIERS.length; i++) {
    if (score < METACHAIN_TIERS[i].ceiling) {
      const floor = i === 0 ? 0 : METACHAIN_TIERS[i - 1].ceiling;
      const range = METACHAIN_TIERS[i].ceiling - floor;
      const progress = ((score - floor) / range) * 100;
      return {
        tier: METACHAIN_TIERS[i],
        progress: Math.min(progress, 100),
        tierIndex: i,
      };
    }
  }
  const last = METACHAIN_TIERS[METACHAIN_TIERS.length - 1];
  return { tier: last, progress: 100, tierIndex: METACHAIN_TIERS.length - 1 };
}

/* ── Momentum Row ──────────────────────────────────────────── */

function MomentumRow({ label, delta, suffix = "" }: { label: string; delta: number; suffix?: string }) {
  const isPositive = delta > 0;
  const isZero = delta === 0;
  return (
    <p className="text-[10px] flex items-center gap-1.5">
      <span className="text-[#7D8694] w-16">{label}</span>
      <span
        className={`font-medium ${
          isZero ? "text-[#7D8694]" : isPositive ? "text-[#10B981]" : "text-[#EF4444]"
        }`}
      >
        {isZero ? "—" : `${isPositive ? "+" : ""}${delta.toLocaleString()}${suffix}`}
      </span>
    </p>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */

function Sparkline({
  data,
  color,
}: {
  data: { value: number }[];
  color: string;
}) {
  if (data.length < 2) return null;
  return (
    <div className="h-8 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeeklyChange({ current, history }: { current: number; history: { score: number }[] }) {
  if (history.length < 2) return null;
  // Compare current to the oldest entry in history (up to 7 days back)
  const oldest = history[history.length - 1];
  const diff = current - oldest.score;
  const isPositive = diff > 0;
  const isZero = Math.abs(diff) < 0.5;

  if (isZero) return null;

  return (
    <span className={`text-[10px] font-medium ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
      {isPositive ? "+" : ""}{diff.toFixed(1)} pts
    </span>
  );
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [absorptionRange, setAbsorptionRange] = useState<"7d" | "30d" | "1y">("7d");

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

  const { current, history, registeredChains, coveragePct, chainHistory } = data;
  const contributingChainsCount = current.chains.filter(
    (c) => !c.excludeFromComposite
  ).length;
  const chainsAvailable = current.chains.filter(
    (c) => c.available && !c.excludeFromComposite
  ).length;
  // Recompute coverage based on contributing chains only
  const contributingWeight = current.chains
    .filter((c) => !c.excludeFromComposite)
    .reduce((s, c) => s + c.weight, 0);
  const availableContributingWeight = current.chains
    .filter((c) => c.available && !c.excludeFromComposite)
    .reduce((s, c) => s + c.weight, 0);
  const coverage = contributingWeight > 0
    ? Math.round((availableContributingWeight / contributingWeight) * 100)
    : coveragePct ?? 100;
  const chartData = [...history].reverse().map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: h.compositeScore,
    coverage: h.coveragePct ?? 100,
  }));

  const activeChains = current.chains.filter((c) => !c.excludeFromComposite);
  const excludedChains = current.chains.filter((c) => c.excludeFromComposite);

  const barData = activeChains.map((c) => ({
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
            {(() => {
              const { tier, progress, tierIndex } = getMetachainTier(current.compositeScore);
              return (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-[#B0B8C4] uppercase tracking-wide">
                      Metachain Utilization Index
                    </p>
                    <InfoButton onClick={() => setInfoOpen(true)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-[64px] sm:text-[80px] leading-none font-semibold tabular-nums text-white">
                      {Math.round(current.compositeScore)}
                    </span>
                    <span className="text-2xl text-[#B0B8C4] mb-3">/{tier.ceiling}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-sm font-medium" style={{ color: tier.color }}>{tier.name}</span>
                    <span className="text-xs text-[#7D8694]">— {tier.label}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="h-2.5 bg-[#2A3548] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tier.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-[#7D8694]">
                        {tierIndex === 0 ? "0" : METACHAIN_TIERS[tierIndex - 1].ceiling}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: tier.color }}>
                        {tier.ceiling}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#B0B8C4] leading-relaxed mb-2">
                    {tier.description}
                  </p>

                  {/* Tier roadmap dots */}
                  <div className="flex gap-1.5 mb-3">
                    {METACHAIN_TIERS.map((t, i) => (
                      <div
                        key={t.name}
                        className="flex-1 group relative"
                        title={i <= tierIndex ? `${t.name} — reached` : `${t.name} — reach ${t.ceiling}`}
                      >
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            backgroundColor: i <= tierIndex ? t.color : "#2A3548",
                            opacity: i <= tierIndex ? 1 : 0.3,
                          }}
                        />
                        <p
                          className="text-[9px] mt-1 text-center"
                          style={{ color: i <= tierIndex ? t.color : "#5C6675" }}
                        >
                          {i <= tierIndex ? t.name : "?"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <SimplifyThis>
                    <p className="mb-2">Think of this number as a &quot;how busy is Theta?&quot; score.</p>
                    <p className="mb-2">We check each chain in the Theta ecosystem — are games being played? Are AI jobs running? Are tokens being moved? Each chain gets its own score, and we combine them into this one number.</p>
                    <p className="mb-2">The milestones (&quot;Early Ecosystem&quot; → &quot;Mature Ecosystem&quot;) reflect real ecosystem growth — more active chains, more applications, more cross-chain activity. Unlike the main chain index, these milestones are about <strong className="text-white">whether Theta is being used</strong>, not whether the market is excited.</p>
                    <p>A higher number means more real activity is happening. A lower number means things are quieter.</p>
                  </SimplifyThis>
                </>
              );
            })()}

            {/* Chain pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {registeredChains
                .filter((chain) => {
                  const live = current.chains.find((c) => c.chainId === chain.id);
                  return !live?.excludeFromComposite;
                })
                .map((chain) => {
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
                + we monitor for new chains
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

      {/* ── Transaction Coverage ────────────────────────── */}
      <motion.div
        className="bg-[#151D2E]/80 border border-[#2A3548]/80 rounded-2xl p-5 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.03 }}
      >
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <p className="text-xs text-[#B0B8C4] uppercase tracking-wide mb-1">
              Transaction Coverage
            </p>
            <p className="text-[11px] text-[#7D8694] leading-relaxed max-w-lg">
              Coverage shows what percentage of total Metachain activity our
              tracked subchains represent.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Metachain activity */}
          <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
            <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
              Total Metachain activity
            </p>
            {data.totalMetachainTxs != null ? (
              <>
                <p className="text-xl font-semibold text-[#B0B8C4] tabular-nums">
                  {fmtNum(data.totalMetachainTxs)}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">txs / 24h</p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#5C6675] italic">unavailable</p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  official API not publicly available
                </p>
              </>
            )}
          </div>

          {/* We track */}
          <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
            <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
              We track
            </p>
            <p className="text-xl font-semibold text-white tabular-nums">
              {fmtNum(data.trackedSubchainTxs ?? 0)}
            </p>
            <p className="text-[10px] text-[#5C6675] mt-1">
              txs / 24h across {data.trackedSubchainCount ?? 0} subchains
            </p>
          </div>

          {/* Coverage % */}
          <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
            <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
              Coverage
            </p>
            {data.totalMetachainTxs != null && data.totalMetachainTxs > 0 ? (
              <>
                <p className="text-xl font-semibold text-[#2AB8E6] tabular-nums">
                  {Math.round(
                    ((data.trackedSubchainTxs ?? 0) / data.totalMetachainTxs) *
                      100
                  )}
                  %
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  of total Metachain
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#5C6675] italic">Unknown</p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  official API not publicly available
                </p>
              </>
            )}
          </div>
        </div>

        {data.totalMetachainTxs != null ? (
          <p className="text-[11px] text-[#7D8694] mt-3 leading-relaxed">
            Both numbers come from the same source as Theta&apos;s official
            explorer: /transactions/history summed across the main chain
            and each registered subchain. Updated daily.
          </p>
        ) : (
          <p className="text-[11px] text-[#7D8694] mt-3 leading-relaxed">
            We are tracking {data.trackedSubchainCount ?? 0} subchains. If
            you know of active subchains we&apos;re missing,{" "}
            <a
              href="/contact"
              className="text-[#B0B8C4] underline hover:text-white"
            >
              contact us
            </a>
            .
          </p>
        )}
      </motion.div>

      {/* ── TFUEL Economics ─────────────────────────────── */}
      {data.tfuelEconomics && data.tfuelEconomics.avgAbsorption7d != null && (() => {
        const eco = data.tfuelEconomics!;
        const rate = eco.avgAbsorptionRate7d ?? 0;
        const supplyGrowth = eco.avgSupplyGrowth7d ?? eco.dailyIssuance;

        const fmtTfuel = (n: number) =>
          n.toLocaleString("en-US", { maximumFractionDigits: 0 });

        const rateColor = rate >= 0.5 ? "#10B981" : rate >= 0.2 ? "#F59E0B" : "#B0B8C4";

        // Chart data — clamp to 0, mark edge spikes
        const trendData = eco.dailyEntries.map((e) => ({
          fullDate: e.date,
          date: new Date(e.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          rate: Math.round(e.absorptionRate * 1000) / 10,
          isEdgeSpike: e.isEdgeSpike,
        }));

        return (
          <motion.div
            className="bg-[#151D2E]/80 border border-[#2A3548]/80 rounded-2xl p-5 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04 }}
          >
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <p className="text-xs text-[#B0B8C4] uppercase tracking-wide mb-1">
                  TFUEL Economics
                </p>
                <p className="text-[11px] text-[#7D8694] leading-relaxed max-w-lg">
                  How much of daily block issuance is absorbed by burns and
                  fees? Based on {eco.daysAvailable}-day supply history.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Block issuance */}
              <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
                <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
                  Block issuance
                </p>
                <p className="text-lg font-semibold text-[#B0B8C4] tabular-nums">
                  {fmtTfuel(eco.dailyIssuance)}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  Protocol constant — block rewards only
                </p>
              </div>

              {/* Supply growth (7d avg) */}
              <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
                <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
                  Supply growth (7d avg)
                </p>
                <p className="text-lg font-semibold text-[#B0B8C4] tabular-nums">
                  +{fmtTfuel(supplyGrowth)}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  From Theta&apos;s official supply API
                </p>
              </div>

              {/* Net absorption (7d avg) */}
              <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
                <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
                  Net absorption (7d avg)
                </p>
                <p className="text-lg font-semibold text-[#B0B8C4] tabular-nums">
                  {fmtTfuel(eco.avgAbsorption7d!)}
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">
                  Block issuance absorbed by burns &amp; fees
                </p>
              </div>

              {/* Absorption rate */}
              <div className="bg-[#0D1117]/60 rounded-xl p-4 border border-[#2A3548]/50">
                <p className="text-[10px] text-[#7D8694] uppercase tracking-wide mb-1.5">
                  Absorption rate
                </p>
                <p
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: rateColor }}
                >
                  {(rate * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-[#5C6675] mt-1">Of block issuance</p>
              </div>
            </div>

            {/* Absorption trend with range selector */}
            {trendData.length >= 2 && (() => {
              const rangeDays = absorptionRange === "7d" ? 7 : absorptionRange === "30d" ? 30 : 365;
              const filtered = trendData.slice(-rangeDays);
              const hasEnough = filtered.length >= 2;
              const dateFormat: Intl.DateTimeFormatOptions =
                absorptionRange === "1y"
                  ? { month: "short" }
                  : { month: "short", day: "numeric" };

              const chartData = filtered.map((e) => ({
                ...e,
                date: new Date(e.fullDate).toLocaleDateString("en-US", dateFormat),
              }));

              return (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[#7D8694] uppercase tracking-wide">
                      Daily absorption rate
                    </p>
                    <div className="flex gap-1">
                      {(["7d", "30d", "1y"] as const).map((r) => {
                        const available = trendData.length >= (r === "7d" ? 2 : r === "30d" ? 8 : 30);
                        return (
                          <button
                            key={r}
                            onClick={() => available && setAbsorptionRange(r)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              absorptionRange === r
                                ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                                : available
                                ? "text-[#7D8694] hover:text-[#B0B8C4]"
                                : "text-[#3D4654] cursor-default"
                            }`}
                            disabled={!available}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {hasEnough ? (() => {
                    // Compute rolling 7d average for each data point
                    const withAvg = chartData.map((d, i) => {
                      const windowStart = Math.max(0, i - 6);
                      const window = chartData.slice(windowStart, i + 1);
                      const avg7d = window.reduce((s, w) => s + w.rate, 0) / window.length;
                      return { ...d, avg7d: Math.round(avg7d * 10) / 10 };
                    });

                    return (
                      <ResponsiveContainer width="100%" height={140}>
                        <ComposedChart data={withAvg} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3548" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#7D8694", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={absorptionRange === "1y" ? 30 : absorptionRange === "30d" ? 4 : 0}
                          />
                          <YAxis
                            tick={{ fill: "#7D8694", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, "auto"]}
                            tickFormatter={(v: number) => `${v}%`}
                            width={40}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(42,53,72,0.2)" }}
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0D1117] border border-[#2A3548] rounded-lg px-3 py-2 text-xs shadow-xl">
                                  <p className="text-[#7D8694] mb-1">{label}</p>
                                  {d.isEdgeSpike ? (
                                    <p className="text-[#EF4444]/80 font-medium">
                                      Edge Network spike — supply grew faster
                                      than block issuance this day
                                    </p>
                                  ) : (
                                    <p className="text-[#F59E0B] font-medium">
                                      {d.rate}% absorbed
                                    </p>
                                  )}
                                  <p className="text-[#B0B8C4] mt-1">
                                    7d trend: {d.avg7d}%
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                            {withAvg.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.isEdgeSpike ? "#EF4444" : "#F59E0B"}
                                fillOpacity={entry.isEdgeSpike ? 0.12 : 0.15}
                              />
                            ))}
                          </Bar>
                          <Line
                            type="monotone"
                            dataKey="avg7d"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 4, fill: "#F59E0B" }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    );
                  })() : (
                    <div className="h-[120px] flex items-center justify-center text-sm text-[#5C6675]">
                      Building history… {trendData.length} of {rangeDays} days collected.
                    </div>
                  )}
                  <p className="text-[10px] text-[#5C6675] mt-2">
                    Values finalize at midnight UTC — showing completed days only
                  </p>
                </div>
              );
            })()}

            {/* Context line */}
            <p className="text-[11px] text-[#7D8694] mt-3 leading-relaxed">
              {rate >= 1
                ? "Burns currently exceed block issuance — supply is shrinking."
                : `Bars show daily values (noisy). Line shows the 7-day moving average — follow this for the real trend.`}
            </p>

            {/* Explainer */}
            <SimplifyThis>
              <p className="mb-2">
                <strong className="text-white">What is this?</strong>
              </p>
              <p className="mb-3">
                Every day, 1,238,400 new TFUEL are created as block rewards.
                But TFUEL is also burned — through transaction fees (gas)
                and because at least 25% of all Edge Network payments are
                permanently destroyed. We can&apos;t know{" "}
                <em>exactly</em> how much is burned, but we can see the
                result: how much supply actually grew. If supply grew by
                1.1M and we know 1.24M was created, then ~140K was absorbed
                by burns.
              </p>
              <p className="mb-2">
                <strong className="text-white">How do I read this?</strong>
              </p>
              <p className="mb-3">
                Think of the absorption rate as &quot;how much of inflation
                is eaten up by network activity.&quot; The higher the
                percentage, the more TFUEL is burned relative to what&apos;s
                created. At 100%, the network reaches deflation — supply
                shrinks. Currently the network sits around 10%, meaning ~90%
                of new TFUEL is added to the supply.
              </p>
              <p className="mb-2">
                <strong className="text-white">
                  Why do some days show 0%?
                </strong>
              </p>
              <p className="mb-3">
                Theta has two sources of new TFUEL: block rewards (fixed)
                and Edge Network rewards (variable). On some days the Edge
                Network pays out more than usual — supply then grows faster
                than block rewards alone, making it look like &quot;0%
                absorption.&quot; That doesn&apos;t mean nothing was burned
                that day — just that Edge payouts overshadowed the burns.
              </p>
              <p className="mb-2">
                <strong className="text-white">
                  What can I use this for?
                </strong>
              </p>
              <p>
                Follow the trend over time. If the absorption rate steadily
                climbs, it means the network is burning an increasing share
                of new TFUEL — a strong fundamental signal. If the trend
                ever reaches 100%, Theta has achieved deflation, and total
                TFUEL supply starts shrinking.
              </p>
            </SimplifyThis>

            <Link
              href="/methodology#tfuel-economics"
              className="inline-block text-[11px] text-[#7D8694] hover:text-[#B0B8C4] transition-colors mt-3"
            >
              How is this calculated? &rarr;
            </Link>
          </motion.div>
        );
      })()}

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
          {chainsAvailable} of {contributingChainsCount} data sources responded.
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
          {activeChains.map((chain) => (
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
                  cursor={{ fill: "rgba(42,53,72,0.3)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl px-4 py-3 shadow-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <p className="text-sm font-medium text-white">
                            {d.name}
                          </p>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-lg font-bold tabular-nums" style={{ color: d.color }}>
                            {d.score}
                          </span>
                          <span className="text-[10px] text-[#7D8694]">
                            {d.weight}% weight
                          </span>
                        </div>
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
          {activeChains.map((chain) => {
            const hist = chainHistory?.[chain.chainId] ?? [];
            const sparkData = [...hist]
              .reverse()
              .map((h) => ({ value: h.score }));
            const color = getChainColor(chain.chainId);

            return (
              <div
                key={chain.chainId}
                className="bg-[#0D1117] rounded-xl p-4 border-l-2"
                style={{
                  borderLeftColor: chain.available ? color : "#2A3548",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p
                    className="text-sm font-medium"
                    style={{ color }}
                  >
                    {chain.chainName}
                  </p>
                  <div className="flex items-center gap-2">
                    <WeeklyChange current={chain.score} history={hist} />
                    {chain.inactiveSince ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7D8694]/10 text-[#5C6675]">
                        inactive since {chain.inactiveSince}
                      </span>
                    ) : chain.available ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981]">
                        live
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444]">
                        error
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {Math.round(chain.score)}
                </p>

                {/* Sparkline */}
                <Sparkline data={sparkData} color={color} />

                <div className="mt-2 space-y-1 text-xs text-[#B0B8C4]">
                  {chain.chainId === "proxy-indicators" ? (
                    <>
                      <p>Subchains: {chain.metrics.custom?.subchainCount ?? "—"}</p>
                      <p>Cross-chain txs: {fmtNum(chain.metrics.custom?.crossChainTxs ?? 0)}</p>
                      <p>Registrar txs: {fmtNum(chain.metrics.custom?.collateralActivity ?? 0)}</p>
                      {chain.metrics.custom?.hasMomentum === 1 && (
                        <div className="mt-2 pt-2 border-t border-[#2A3548]">
                          <p className="text-[10px] text-[#7D8694] mb-1">7-day momentum</p>
                          <div className="space-y-0.5">
                            <MomentumRow label="Subchains" delta={chain.metrics.custom.subchainDelta ?? 0} />
                            <MomentumRow label="Cross-chain" delta={chain.metrics.custom.crossChainDelta ?? 0} suffix=" txs" />
                            <MomentumRow label="Registrar" delta={chain.metrics.custom.collateralDelta ?? 0} suffix=" txs" />
                          </div>
                        </div>
                      )}
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
            );
          })}

          {/* Coming soon placeholder */}
          <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-dashed border-[#2A3548] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-[#5C6675] mb-1">More chains coming</p>
            <p className="text-xs text-[#3D4654]">
              We monitor for new subchain APIs and integrate them as they
              become available.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Previously Tracked Chains ─────────────────────── */}
      {excludedChains.length > 0 && (
        <motion.div
          className="bg-[#151D2E]/60 border border-[#2A3548]/60 rounded-2xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h3 className="text-sm font-semibold text-[#B0B8C4] mb-1">
            Previously tracked chains
          </h3>
          <p className="text-xs text-[#7D8694] mb-4">
            Chains that have been inactive for more than 30 days are excluded
            from the composite score. Their weight is redistributed among
            active chains.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {excludedChains.map((chain) => {
              const lastHist = chainHistory?.[chain.chainId]?.find(
                (h) => h.score > 0
              );
              const lastKnownScore = lastHist?.score;
              const offlineDate = chain.lastActiveDate
                ? new Date(chain.lastActiveDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : chain.inactiveSince ?? "unknown";

              return (
                <div
                  key={chain.chainId}
                  className="bg-[#0D1117]/60 rounded-xl p-3 border-l-2 border-[#2A3548] opacity-75"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-[#7D8694]">
                      {chain.chainName}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7D8694]/10 text-[#5C6675] uppercase tracking-wide">
                      offline since {offlineDate}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5C6675] leading-relaxed mb-2">
                    Digital entertainment and gaming collectibles.
                  </p>
                  {lastKnownScore !== undefined && (
                    <p className="text-[10px] text-[#7D8694]">
                      Last known score:{" "}
                      <span className="text-[#B0B8C4] font-mono">
                        {Math.round(lastKnownScore)}
                      </span>
                    </p>
                  )}
                  <p className="text-[10px] text-[#5C6675] mt-2 italic">
                    Excluded from composite score until activity resumes.
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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
              and Lavita weigh most. When we add a new chain, weights
              re-normalize so the composite adjusts.
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

      {/* Info modal */}
      <MetachainInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
