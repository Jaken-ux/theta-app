import { fetchNetworkStats, fetchActivitySnapshot } from "../../lib/theta-api";
import MetricCard from "../../components/MetricCard";
import NetworkCharts from "../../components/NetworkCharts";
import NetworkActivityIndex from "../../components/network-activity/NetworkActivityIndex";

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export const revalidate = 60; // revalidate every 60s

export default async function NetworkPage() {
  const stats = await fetchNetworkStats();
  const activity = await fetchActivitySnapshot(stats);

  return (
    <div className="space-y-16">
      {/* Network Activity Index — real usage overview */}
      <NetworkActivityIndex snapshot={activity} />

      {/* Divider */}
      <hr className="border-[#1F2937]" />

      {/* Existing Dashboard */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Network Dashboard</h1>
        <p className="text-theta-muted">
          Live data from the Theta blockchain. Updates every 60 seconds.
        </p>
      </div>

      {/* Price row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="THETA Price"
          value={`$${stats.thetaPrice.price.toFixed(4)}`}
          change={`MCap ${fmtUsd(stats.thetaPrice.marketCap)}`}
        />
        <MetricCard
          label="TFUEL Price"
          value={`$${stats.tfuelPrice.price.toFixed(6)}`}
          change={`24h Vol ${fmtUsd(stats.tfuelPrice.volume24h)}`}
        />
        <MetricCard
          label="TFUEL 24h Volume"
          value={fmtUsd(stats.tfuelPrice.volume24h)}
          change={`MCap ${fmtUsd(stats.tfuelPrice.marketCap)}`}
        />
        <MetricCard
          label="TFUEL Supply"
          value={fmt(stats.tfuelSupply.circulatingSupply)}
          change={`Total: ${fmt(stats.tfuelSupply.totalSupply)}`}
        />
      </div>

      {/* Staking row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="THETA Staked"
          value={`${fmt(stats.thetaStake.totalAmount / 1_000_000, 1)}M`}
          change={`${stats.thetaStakingRatio.toFixed(1)}% of supply`}
        />
        <MetricCard
          label="TFUEL Staked"
          value={`${fmt(stats.tfuelStake.totalAmount / 1_000_000, 1)}M`}
          change={`${stats.tfuelStakingRatio.toFixed(1)}% of supply`}
        />
        <MetricCard
          label="THETA Staking Participants"
          value={fmt(stats.thetaStake.totalNodes)}
          change="Wallets staking — not all nodes online"
        />
        <MetricCard
          label="TFUEL Staking Participants"
          value={fmt(stats.tfuelStake.totalNodes)}
          change="Wallets staking — ~7,200 nodes online"
        />
      </div>

      {/* Charts — client component for Recharts */}
      <NetworkCharts stats={stats} />

      {/* Data source note */}
      <p className="text-xs text-theta-muted/50 text-center pt-4">
        Data from explorer-api.thetatoken.org — same source as the official Theta Explorer.
      </p>
    </div>
  );
}
