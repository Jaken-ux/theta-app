"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { ActivitySnapshot } from "../../lib/theta-api";
import { getTodaySampleCount, getHistory, type HistoryEntry } from "../../lib/activity-history";
import ActivityMetric, { type MetricHistoryPoint } from "./ActivityMetric";
import ActivityTrendChart from "./ActivityTrendChart";
import InfoModal, { InfoButton } from "./InfoModal";
import SimplifyThis from "../SimplifyThis";
import LearnMore from "../LearnMore";

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Main Chain Activity Index — uncapped composite score.
 *
 * Measures activity on Theta's main chain (settlement layer): token
 * transfers, TFUEL volume, wallet participation, and staking. Subchain
 * activity, video delivery, and EdgeCloud compute are NOT included —
 * those APIs are not yet publicly available.
 *
 * Each metric is scored as (value / baseline) * 100 with NO cap.
 *
 *   Transactions:    42,000 / day  (main chain)  — 30%
 *   TFUEL volume:    $12M / 24h                  — 30%
 *   Wallet activity: 100% of blocks with user txs — 30%
 *   Staking:         22,000 participants           — 10%
 */
function computeIndex(snap: ActivitySnapshot): number {
  const txScore = (snap.estimatedDailyTxs / 42_000) * 100;
  const volumeScore = (snap.tfuelVolume24h / 12_000_000) * 100;
  const walletScore = (snap.userTxRate / 100) * 100;
  const nodeScore = (snap.totalNodes / 22_000) * 100;

  return txScore * 0.3 + volumeScore * 0.3 + walletScore * 0.3 + nodeScore * 0.1;
}

/**
 * Tier system — milestones based on main-chain activity metrics.
 * Each tier has a ceiling. When the score exceeds it, the next tier
 * becomes the new target and the display updates accordingly.
 */
interface Tier {
  name: string;
  ceiling: number;
  color: string;
  label: string;
  description: string;
}

const TIERS: Tier[] = [
  {
    name: "Foundation",
    ceiling: 100,
    color: "#F59E0B",
    label: "Building the base",
    description: "The main chain is functional with active stakers and regular transactions. Reaching 100 would mean roughly doubling current on-chain activity across all metrics.",
  },
  {
    name: "Growth",
    ceiling: 500,
    color: "#2AB8E6",
    label: "Ecosystem expanding",
    description: "Main-chain activity has surpassed its initial baselines. Transaction volume, staking participation, and TFUEL usage are all significantly above today's levels.",
  },
  {
    name: "Scale",
    ceiling: 2500,
    color: "#10B981",
    label: "Sustained high usage",
    description: "The main chain consistently shows high on-chain activity. Usage reflects sustained demand — though subchain and off-chain activity are not captured here.",
  },
  {
    name: "Dominance",
    ceiling: 10000,
    color: "#8B5CF6",
    label: "Major infrastructure",
    description: "Main-chain activity is comparable to established high-traffic networks. All metrics are many multiples above current levels.",
  },
];

function getCurrentTier(score: number): { tier: Tier; progress: number; tierIndex: number } {
  for (let i = 0; i < TIERS.length; i++) {
    if (score < TIERS[i].ceiling) {
      const floor = i === 0 ? 0 : TIERS[i - 1].ceiling;
      const range = TIERS[i].ceiling - floor;
      const progress = ((score - floor) / range) * 100;
      return { tier: TIERS[i], progress: Math.min(progress, 100), tierIndex: i };
    }
  }
  // Beyond all tiers
  const last = TIERS[TIERS.length - 1];
  return { tier: last, progress: 100, tierIndex: TIERS.length - 1 };
}

export default function NetworkActivityIndex({
  snapshot,
  serverScore,
}: {
  snapshot: ActivitySnapshot;
  serverScore?: number | null;
}) {
  const rawScore = Math.round(computeIndex(snapshot));
  const [infoOpen, setInfoOpen] = useState(false);
  const [todaySamples, setTodaySamples] = useState(0);
  // Use server-provided score immediately — no loading delay
  const [dailyAvg, setDailyAvg] = useState<number | null>(serverScore ?? null);
  const [txHistory, setTxHistory] = useState<MetricHistoryPoint[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<MetricHistoryPoint[]>([]);
  const [walletHistory, setWalletHistory] = useState<MetricHistoryPoint[]>([]);
  const [stakingHistory, setStakingHistory] = useState<MetricHistoryPoint[]>([]);

  useEffect(() => {
    async function load() {
      setTodaySamples(await getTodaySampleCount());

      // Only fetch from API if we didn't get a server score
      if (serverScore == null) {
        const history: HistoryEntry[] = await getHistory();
        const today = new Date().toISOString().slice(0, 10);
        const todayEntry = history.find((e) => e.date === today);
        setDailyAvg(todayEntry ? todayEntry.score : rawScore);
      }

      // Fetch per-metric histories for sparklines (non-blocking)
      try {
        const res = await fetch("/api/activity-history");
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any[] = await res.json();
          setTxHistory(data.filter((d) => d.metrics?.dailyTxs).map((d) => ({ date: d.date, value: d.metrics.dailyTxs })));
          setVolumeHistory(data.filter((d) => d.metrics?.tfuelVolume).map((d) => ({ date: d.date, value: d.metrics.tfuelVolume })));
          setWalletHistory(data.filter((d) => d.metrics?.walletActivity).map((d) => ({ date: d.date, value: d.metrics.walletActivity })));
          setStakingHistory(data.filter((d) => d.metrics?.stakingNodes).map((d) => ({ date: d.date, value: d.metrics.stakingNodes })));
        }
      } catch {
        // History fetch failed — sparklines just won't show
      }
    }
    load();
  }, [rawScore]);

  const score = dailyAvg ?? rawScore;
  const scoreReady = dailyAvg !== null;
  const { tier, progress, tierIndex } = getCurrentTier(score);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Main Chain Activity
        </h2>
        <p className="text-[#B0B8C4]">
          Observable activity on Theta&apos;s settlement layer.
        </p>
        <p className="text-xs text-[#B0B8C4] mt-1">
          This index tracks main-chain transactions, TFUEL trading volume, wallet participation, and staking. It does <strong className="text-white">not</strong> include subchain activity, video delivery, or EdgeCloud compute — those APIs are not yet publicly available. When they are, we will expand this index.
        </p>
        <SimplifyThis>
          This measures how busy Theta&apos;s main blockchain is — the foundation layer where staking, token transfers, and cross-chain operations happen. The score goes up when more transactions occur and more people interact with the chain. But it does <strong className="text-white">not</strong> capture everything Theta does. Video streaming, AI compute, and subchain transactions (which make up the majority of Theta&apos;s actual usage) happen elsewhere. A low score here does not mean Theta is failing — it means the main chain is quiet.
        </SimplifyThis>
      </div>

      {/* Box 1: Activity Index score + trend chart side by side */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Score */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-[#B0B8C4] uppercase tracking-wide">
                Main Chain Activity Index
              </p>
              <InfoButton onClick={() => setInfoOpen(true)} />
            </div>

            <div className="flex items-end gap-3">
              <span
                className={`text-[64px] sm:text-[80px] leading-none font-semibold tabular-nums cursor-help transition-opacity duration-300 ${scoreReady ? "text-white opacity-100" : "text-white/0"}`}
                title="Composite proxy based on observable on-chain metrics only"
              >
                {score}
              </span>
              <span className={`text-2xl text-[#B0B8C4] mb-3 transition-opacity duration-300 ${scoreReady ? "opacity-100" : "opacity-0"}`}>/{tier.ceiling.toLocaleString()}</span>
            </div>

            <p className="text-xs text-[#B0B8C4] mt-1 mb-1">
              {todaySamples > 1
                ? `Today\u2019s average (${todaySamples} samples)`
                : tier.label}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: tier.color }}
              >
                {tier.name}
              </span>
            </div>

            {/* Progress toward next milestone */}
            <div className="mt-4">
              <div className="h-3 bg-[#2A3548] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: tier.color }}
                  initial={{ width: 0 }}
                  animate={{ width: scoreReady ? `${progress}%` : "0%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-[#7D8694]">
                  {tierIndex === 0 ? "0" : TIERS[tierIndex - 1].ceiling.toLocaleString()}
                </span>
                <span className="text-[10px] font-medium" style={{ color: tier.color }}>
                  {tier.ceiling.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#B0B8C4] mt-3 leading-relaxed">
              {tier.description}
            </p>

            {/* Tier roadmap */}
            <div className="mt-4 flex gap-1.5">
              {TIERS.map((t, i) => (
                <div
                  key={t.name}
                  className="flex-1 group relative"
                  title={i <= tierIndex ? `${t.name} — unlocked` : `${t.name} — locked (reach ${t.ceiling.toLocaleString()})`}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor: i < tierIndex ? t.color : i === tierIndex ? t.color : "#2A3548",
                      opacity: i <= tierIndex ? 1 : 0.3,
                    }}
                  />
                  <p
                    className="text-[9px] mt-1 text-center"
                    style={{
                      color: i <= tierIndex ? t.color : "#5C6675",
                    }}
                  >
                    {i <= tierIndex ? t.name : "?"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Trend chart (embedded) */}
          <div className="border-t lg:border-t-0 lg:border-l border-[#2A3548] pt-6 lg:pt-0 lg:pl-8">
            <ActivityTrendChart currentScore={score} embedded />
          </div>
        </div>
      </div>

      {/* Box 2: Confidence level with bar + explanations */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-semibold text-white">
            Confidence Level
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-medium">
            Medium
          </span>
        </div>
        <p className="text-sm text-[#B0B8C4] mb-4">
          Confidence level describes how much of the total network activity this index can observe. It only measures main-chain data — subchain and off-chain activity are not included yet.
        </p>

        {/* Confidence bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] text-[#B0B8C4] mb-1.5">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <div className="h-2.5 bg-[#2A3548] rounded-full overflow-hidden relative">
            <div className="h-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#10B981] opacity-30 w-full" />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#F59E0B] rounded-full border-2 border-[#151D2E] shadow-lg"
              initial={{ left: "0%" }}
              animate={{ left: "50%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ marginLeft: "-8px" }}
            />
          </div>
        </div>

        <LearnMore>
        {/* Three confidence levels */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <p className="text-sm font-medium text-[#10B981]">High</p>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              We can measure most meaningful activity directly. Example: a public blockchain with most usage on-chain.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4 border border-[#F59E0B]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <p className="text-sm font-medium text-[#F59E0B]">Medium</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B]">current</span>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              We can measure reliable real activity, but significant parts of the ecosystem happen off-chain or on subchains without public APIs.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <p className="text-sm font-medium text-[#EF4444]">Low</p>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              We only see weak proxies or indirect signals. Not the case here.
            </p>
          </div>
        </div>

        {/* Current estimate */}
        <div className="bg-[#0D1117] rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-white mb-2">Current estimate</p>
          <p className="text-xs text-[#D1D5DB] leading-relaxed mb-3">
            This index measures main-chain activity only. It is <strong className="text-white">not a proxy for total network usage</strong> — subchain activity (250K+ txs/day) and off-chain services operate independently.
          </p>
          <p className="text-xs text-[#B0B8C4] font-medium mb-1.5">Why can&apos;t this index tell the full story?</p>
          <p className="text-xs text-[#D1D5DB] leading-relaxed mb-2">
            The main chain is Theta&apos;s settlement layer — it handles staking, governance, cross-chain transfers, and native token movement. But most application activity happens elsewhere:
          </p>
          <ul className="space-y-1 text-xs text-[#D1D5DB] leading-relaxed ml-3">
            <li>• Subchains process ~300K+ txs/day — no public API available yet</li>
            <li>• Video delivery and AI compute happen off-chain</li>
            <li>• Enterprise integrations may not produce visible on-chain transactions</li>
            <li>• When subchain APIs become available, we will add them to this index</li>
          </ul>
        </div>

        <div className="bg-[#0A0F1C] border border-[#2A3548] rounded-xl p-4">
          <p className="text-xs text-white font-medium mb-1">Important</p>
          <p className="text-xs text-[#D1D5DB] leading-relaxed">
            The data we measure is real — but it only covers the main chain. The index can show &quot;low&quot; while Theta&apos;s actual utility (video, AI, subchains) is growing, and vice versa.
          </p>
        </div>

        <SimplifyThis>
          <p className="mb-2">Imagine a large company with many departments. We only have detailed reports from one department — the main blockchain (settlement layer).</p>
          <p className="mb-2">But Theta&apos;s ecosystem also includes video delivery, AI compute, and subchains where detailed public data is not yet available.</p>
          <p className="mb-2">So we measure what we can — main-chain transactions, staking, wallet activity, and TFUEL volume. This is real, reliable data from Theta&apos;s foundation layer.</p>
          <p>Treat the score as a <strong className="text-white">directional signal for main-chain activity</strong>. When subchain data becomes available, we will expand it into a full network index.</p>
        </SimplifyThis>
        </LearnMore>
      </div>

      {/* What we CAN measure */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white">
          What we CAN measure reliably
        </h3>
        <LearnMore>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Main-chain transactions</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Payments, smart contract interactions and token transfers recorded publicly on the blockchain.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Wallet activity</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              How many addresses actively interact with the network over time.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">TFUEL usage on-chain</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              How often the network&apos;s utility token is used in measurable transactions.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Staking participation</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              How many participants help secure the network by locking tokens.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Exchange activity</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              How actively TFUEL is traded on public markets.
            </p>
          </div>
        </div>
        </LearnMore>
      </div>

      {/* What we CANNOT measure */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white">
          What we currently cannot measure precisely
        </h3>
        <LearnMore>
        <p className="text-xs text-[#B0B8C4] mb-4">
          These are real parts of the Theta ecosystem that do not appear fully in our data.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Subchain activity</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Theta uses additional chains that do not expose full public metrics.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Video delivery usage</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              When content is delivered via edge nodes, this activity does not always appear as blockchain transactions.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">AI and GPU compute jobs</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              EdgeCloud workloads may generate value without always producing high visible on-chain transaction counts.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Enterprise integrations</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Partners may use Theta infrastructure internally without publishing detailed activity data.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">Off-chain coordination</p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Some operations happen outside the public blockchain layer.
            </p>
          </div>
        </div>
        <div className="bg-[#0A0F1C] border border-[#2A3548] rounded-xl p-4">
          <p className="text-xs text-white font-medium mb-1">Important implication</p>
          <p className="text-xs text-[#D1D5DB] leading-relaxed">
            Transaction count alone does not represent total network usage.
          </p>
        </div>
        </LearnMore>
      </div>

      {/* Why still useful */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-2">
          Why this index is still useful
        </h3>
        <p className="text-sm text-[#B0B8C4]">
          The main chain is Theta&apos;s settlement layer — where staking, governance, cross-chain transfers, and native token movement happen. Even partial data can show real trends. When observable activity increases consistently, it signals growing usage of Theta&apos;s foundation layer.
        </p>
        <LearnMore>
        <p className="text-xs text-[#D1D5DB] leading-relaxed mb-5">
          Think of it like measuring traffic on a highway. You may not see every building in the city, but rising traffic still signals growth. And some things <em>only</em> happen on this highway — staking, subchain registration, cross-chain bridging.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#10B981] mb-2">Most useful for</p>
            <ul className="space-y-1.5 text-xs text-[#D1D5DB] leading-relaxed">
              <li>• Detecting growth trends on the settlement layer</li>
              <li>• Tracking staking and validator participation</li>
              <li>• Comparing main-chain activity over time</li>
              <li>• Spotting structural changes in on-chain usage</li>
            </ul>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-2">Less useful for</p>
            <ul className="space-y-1.5 text-xs text-[#D1D5DB] leading-relaxed">
              <li>• Measuring total network utility (video, AI, compute)</li>
              <li>• Capturing subchain activity (not yet available)</li>
              <li>• Predicting price</li>
              <li>• Estimating total revenue of the network</li>
            </ul>
          </div>
        </div>
        </LearnMore>
      </div>

      {/* How to interpret trends */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white">
          How to interpret trend changes
        </h3>
        <LearnMore>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex gap-3 bg-[#0D1117] rounded-xl p-4">
            <span className="text-[#10B981] text-lg mt-0.5">↑</span>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Increases steadily over months</p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">Likely increasing ecosystem activity on the settlement layer</p>
            </div>
          </div>
          <div className="flex gap-3 bg-[#0D1117] rounded-xl p-4">
            <span className="text-[#2AB8E6] text-lg mt-0.5">↑</span>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Increases suddenly</p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">Possible new application, partner launch, or usage spike</p>
            </div>
          </div>
          <div className="flex gap-3 bg-[#0D1117] rounded-xl p-4">
            <span className="text-[#F59E0B] text-lg mt-0.5">→</span>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Remains stable</p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">Steady baseline usage on the main chain</p>
            </div>
          </div>
          <div className="flex gap-3 bg-[#0D1117] rounded-xl p-4">
            <span className="text-[#EF4444] text-lg mt-0.5">↓</span>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Declines gradually</p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">Reduced visible on-chain activity — does not mean the network is less useful</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-4 pt-4 border-t border-[#2A3548]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#10B981]">↑</span>
            <span className="text-[10px] text-[#B0B8C4]">Improving signal confidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#F59E0B]">→</span>
            <span className="text-[10px] text-[#B0B8C4]">Stable signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#EF4444]">↓</span>
            <span className="text-[10px] text-[#B0B8C4]">Weakening signal</span>
          </div>
        </div>
        </LearnMore>
      </div>

      {/* Why this matters */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-3">
          Why this index matters
        </h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
            <span className="text-[#2AB8E6] mt-0.5 shrink-0">1.</span>
            <span>It tracks activity on Theta&apos;s <strong className="text-white">settlement layer</strong> — the foundation where staking, governance, cross-chain transfers, and native token movement happen.</span>
          </li>
          <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
            <span className="text-[#2AB8E6] mt-0.5 shrink-0">2.</span>
            <span>It gives you a baseline to compare against. When something changes — a new partnership, a product launch, a market shift — you can see if it shows up in on-chain activity.</span>
          </li>
          <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
            <span className="text-[#2AB8E6] mt-0.5 shrink-0">3.</span>
            <span>Theta&apos;s full ecosystem includes subchains (250K+ txs/day) and off-chain services not captured here. <strong className="text-white">When subchain APIs become publicly available, we will expand this into a full network index.</strong></span>
          </li>
        </ul>
      </div>

      {/* Four metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ActivityMetric
          title="Transaction Activity"
          value={fmt(snapshot.estimatedDailyTxs)}
          subValue="main-chain txs in last 24h"
          description="On-chain transactions on Theta's main chain in the last 24 hours. The full Metachain (including subchains) processes significantly more — but subchain data is not available via public API."
          weight="30%"
          tooltip="Theta's Metachain processes ~300K+ txs/day across all subchains. This metric only captures the main chain (~14K/day)."
          history={txHistory}
          historyColor="#2AB8E6"
          historyUnit="txs"
        />
        <ActivityMetric
          title="TFUEL Market Activity"
          value={fmtUsd(snapshot.tfuelVolume24h)}
          subValue="24h trading volume"
          description="Total TFUEL trading volume across major exchanges and on-chain transfers. Market activity may indicate interest in the network but does not necessarily reflect real application usage."
          weight="30%"
          tooltip="Market activity can signal ecosystem attention, liquidity and participation, but should be interpreted together with on-chain metrics."
          history={volumeHistory}
          historyColor="#10B981"
          historyUnit="USD"
        />
        <ActivityMetric
          title="Wallet Activity"
          value={`${snapshot.userTxRate.toFixed(1)}%`}
          subValue="of blocks contain user txs"
          description="Percentage of blocks that include at least one real user transaction beyond the block proposal. Higher values suggest more independent wallets interacting with the network rather than only validators producing blocks. A healthy network typically shows consistent participation from multiple wallets or applications."
          weight="30%"
          tooltip="Proxy for how often real users or apps interact with the chain."
          history={walletHistory}
          historyColor="#F59E0B"
          historyUnit="%"
        />
        <ActivityMetric
          title="Staking Participants"
          value={fmt(snapshot.totalNodes)}
          subValue="wallets with staked tokens"
          secondaryValue="~8,100 nodes estimated online"
          secondaryNote="Based on the official Theta node monitor. No public API available for active node count."
          description="Number of wallets participating in staking (validators, guardians, and edge node operators). Staking shows commitment and network security, but does not directly measure usage. A network can have high staking with low activity."
          weight="10%"
          tooltip="Staking participants ≠ active nodes. The official node monitor shows ~7,200 edge nodes, ~900 guardians, and ~23 validators actively online."
          history={stakingHistory}
          historyColor="#8B5CF6"
          historyUnit="nodes"
        />
      </div>

      {/* Why low ≠ dead */}
      <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-[#2AB8E6] mb-1">
          Why a low Main Chain Activity Index does not mean the network is inactive
        </h3>
        <p className="text-xs text-[#B0B8C4]">
          This index only captures main-chain signals. Much of Theta&apos;s real-world usage happens on subchains and off-chain.
        </p>
        <LearnMore>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#151D2E] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Video Delivery</p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Theta&apos;s CDN relays video streams peer-to-peer. These transfers happen off-chain and produce no blockchain transactions — but they represent real bandwidth served.
            </p>
          </div>
          <div className="bg-[#151D2E] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">EdgeCloud Compute</p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              AI and GPU workloads run on edge nodes. Job scheduling and results may settle on-chain only periodically, making daily utilization invisible in block data.
            </p>
          </div>
          <div className="bg-[#151D2E] rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">Infrastructure Phase</p>
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Networks like Theta build infrastructure first. High staking participation ({fmt(snapshot.totalNodes)} participants) shows strong commitment even before mass on-chain activity arrives.
            </p>
          </div>
        </div>

        <div className="bg-[#151D2E] rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-2">Think of it like a highway</p>
          <p className="text-xs text-[#B0B8C4] leading-relaxed">
            A newly built highway may have low traffic today — but the road is there, the on-ramps work, and tollbooths are staffed. Low traffic now doesn&apos;t mean the highway was a bad investment. It means the city is still growing around it. Theta&apos;s {fmt(snapshot.totalNodes)} staking participants are the infrastructure waiting for traffic to arrive.
          </p>
        </div>
        </LearnMore>
      </div>

      {/* How to read this */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-4">
          What does this tell you?
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-sm font-medium text-[#10B981]">
                If the index rises over time
              </span>
            </div>
            <ul className="space-y-1.5 text-sm text-[#B0B8C4] leading-relaxed">
              <li>More transactions are happening on the main chain</li>
              <li>More wallets may be interacting with the network</li>
              <li>Demand for TFUEL may be increasing</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#7D8694]" />
              <span className="text-sm font-medium text-[#7D8694]">
                If the index stays flat or falls
              </span>
            </div>
            <ul className="space-y-1.5 text-sm text-[#B0B8C4] leading-relaxed">
              <li>On-chain activity may not be growing visibly</li>
              <li>Usage could be happening on subchains or off-chain (video, EdgeCloud)</li>
              <li>This index only measures what&apos;s visible on the main chain</li>
              <li>A flat index with stable staking = healthy infrastructure waiting for adoption</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-[#B0B8C4] mt-6">
          This index captures main-chain activity only. Subchain transactions,
          video delivery, and AI compute are not reflected here — yet.
        </p>
      </div>

      {/* Info modal */}
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
