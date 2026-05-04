import type { NetworkStats } from "../../lib/theta-api";
import UtilizationScoreCard from "./UtilizationScoreCard";
import HealthMetricCard from "./HealthMetricCard";
import InterpretationPanel from "./InterpretationPanel";
import UtilizationChart from "./UtilizationChart";
import ScaleComparison from "./ScaleComparison";
import SizeVsUsage from "./SizeVsUsage";

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Placeholder utilization score.
 *
 * Weights:
 *   TFUEL volume trend   — 40%
 *   Staking ratio         — 30%
 *   Node count             — 30%
 *
 * Each sub-score is normalized to 0–100 using simple reference points.
 * These reference points are rough estimates and should be refined
 * once we have historical data to calibrate against.
 */
function computeUtilizationScore(stats: NetworkStats): number {
  // TFUEL 24h volume — normalize against $10M as a "high activity" reference
  const volumeScore = Math.min((stats.tfuelPrice.volume24h / 10_000_000) * 100, 100);

  // Combined staking ratio — average of THETA and TFUEL staking %
  const avgStakingPct = (stats.thetaStakingRatio + stats.tfuelStakingRatio) / 2;
  const stakingScore = Math.min((avgStakingPct / 60) * 100, 100); // 60% staking = max score

  // Node count — normalize against 15,000 total nodes as reference
  const totalNodes = stats.thetaStake.totalNodes + stats.tfuelStake.totalNodes;
  const nodeScore = Math.min((totalNodes / 15_000) * 100, 100);

  return volumeScore * 0.4 + stakingScore * 0.3 + nodeScore * 0.3;
}

export default function NetworkHealthSection({ stats }: { stats: NetworkStats }) {
  const score = computeUtilizationScore(stats);
  const totalNodes = stats.thetaStake.totalNodes + stats.tfuelStake.totalNodes;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Network Health</h2>
        <p className="text-[#B0B8C4]">
          A simplified overview of how actively the Theta network is being used.
        </p>
      </div>

      {/* Hero score + 3 metric cards */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <UtilizationScoreCard score={score} />

        <div className="grid gap-4">
          <HealthMetricCard
            title="TFUEL Activity"
            description="TFUEL is used to pay for network transactions and compute jobs."
            metrics={[
              { label: "24h trading volume", value: fmtUsd(stats.tfuelPrice.volume24h) },
              { label: "Market cap", value: fmtUsd(stats.tfuelPrice.marketCap) },
            ]}
            explanation="Higher activity may indicate more usage of the network."
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <HealthMetricCard
          title="Staking Participation"
          description="Tokens locked in staking help secure the network."
          metrics={[
            { label: "THETA staked", value: `${stats.thetaStakingRatio.toFixed(1)}%` },
            { label: "TFUEL staked", value: `${stats.tfuelStakingRatio.toFixed(1)}%` },
          ]}
          explanation="Higher staking can indicate long-term confidence in the network."
        />
        <HealthMetricCard
          title="Node Growth"
          description="Nodes provide compute and delivery capacity."
          metrics={[
            { label: "Validators & Guardians", value: fmt(stats.thetaStake.totalNodes) },
            { label: "Elite Edge Nodes", value: fmt(stats.tfuelStake.totalNodes) },
            { label: "Total", value: fmt(totalNodes) },
          ]}
          explanation="More nodes increase network capacity and resilience."
        />
      </div>

      {/* Scale context — how big is the network? */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ScaleComparison totalNodes={totalNodes} />
        <SizeVsUsage
          totalNodes={totalNodes}
          utilizationScore={score}
        />
      </div>

      {/* Trend chart */}
      <UtilizationChart currentScore={Math.round(score)} />

      {/* Interpretation */}
      <InterpretationPanel />
    </div>
  );
}
