import type { Metadata } from "next";
import { fetchNetworkStats, fetchActivitySnapshot } from "../../lib/theta-api";

export const metadata: Metadata = {
  title: "Network Explorer",
  description: "Live Theta Network activity index, staking metrics, transaction data, and TFUEL supply tracking. Updated every 60 seconds.",
};
import { getPool } from "../../lib/db";
import MetricCard from "../../components/MetricCard";
import NetworkCharts from "../../components/NetworkCharts";
import NetworkActivityIndex from "../../components/network-activity/NetworkActivityIndex";
import TfuelSupplyChart from "../../components/TfuelSupplyChart";

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

export const revalidate = 60;

function computeIndex(snap: { estimatedDailyTxs: number; tfuelVolume24h: number; userTxRate: number; totalNodes: number }) {
  const txScore = (snap.estimatedDailyTxs / 42_000) * 100;
  const volumeScore = (snap.tfuelVolume24h / 12_000_000) * 100;
  const walletScore = (snap.userTxRate / 100) * 100;
  const nodeScore = (snap.totalNodes / 22_000) * 100;
  return Math.round(txScore * 0.3 + volumeScore * 0.3 + walletScore * 0.3 + nodeScore * 0.1);
}

async function saveSnapshot(snapshot: Awaited<ReturnType<typeof fetchActivitySnapshot>>) {
  try {
    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);
    const score = computeIndex(snapshot);

    await pool.query(
      `INSERT INTO theta_activity_history (
        date, samples, total_score, average,
        daily_txs, tfuel_volume, wallet_activity, staking_nodes,
        theta_staking_ratio, tfuel_staking_ratio,
        theta_price, tfuel_price, theta_market_cap,
        tfuel_circulating_supply, daily_blocks,
        validator_guardian_nodes, edge_nodes
      ) VALUES ($1, 1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (date) DO UPDATE SET
         samples = theta_activity_history.samples + 1,
         total_score = theta_activity_history.total_score + $2,
         average = (theta_activity_history.total_score + $2) / (theta_activity_history.samples + 1),
         daily_txs = $3, tfuel_volume = $4, wallet_activity = $5, staking_nodes = $6,
         theta_staking_ratio = $7, tfuel_staking_ratio = $8,
         theta_price = $9, tfuel_price = $10, theta_market_cap = $11,
         tfuel_circulating_supply = $12, daily_blocks = $13,
         validator_guardian_nodes = $14, edge_nodes = $15`,
      [
        today, score,
        snapshot.estimatedDailyTxs, snapshot.tfuelVolume24h,
        snapshot.userTxRate, snapshot.totalNodes,
        snapshot.thetaStakingRatio, snapshot.tfuelStakingRatio,
        snapshot.thetaPrice, snapshot.tfuelPrice, snapshot.thetaMarketCap,
        snapshot.tfuelCirculatingSupply, snapshot.dailyBlocks,
        snapshot.validatorGuardianNodes, snapshot.edgeNodes,
      ]
    );
  } catch (e) {
    console.error("Failed to save snapshot from page:", e);
  }
}

export default async function NetworkPage() {
  const stats = await fetchNetworkStats();
  const activity = await fetchActivitySnapshot(stats);

  // Save metrics to DB and fetch today's average — all server-side
  await saveSnapshot(activity);

  let dailyAvg: number | null = null;
  try {
    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);
    const result = await pool.query(
      `SELECT average, samples FROM theta_activity_history WHERE date = $1`,
      [today]
    );
    if (result.rows.length > 0) {
      dailyAvg = result.rows[0].average;
    }
  } catch {
    // Fall back to raw score
  }

  return (
    <div className="space-y-16">
      {/* Network Activity Index — real usage overview */}
      <NetworkActivityIndex snapshot={activity} serverScore={dailyAvg} />

      {/* Divider */}
      <hr className="border-[#2A3548]" />

      {/* Existing Dashboard */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Network Explorer</h1>
        <p className="text-theta-muted">
          Live data from the Theta blockchain. Updates every 60 seconds.
        </p>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* TFUEL Supply over time — tracks inflation vs burn */}
      <TfuelSupplyChart />

      {/* Data source note */}
      <p className="text-xs text-theta-muted/50 text-center pt-4">
        Data from explorer-api.thetatoken.org — same source as the official Theta blockchain explorer.
      </p>

      {/* Next steps */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Keep exploring</h3>
        <p className="text-sm text-[#B0B8C4] mb-6 max-w-lg mx-auto">
          Now that you have seen the network data, here are some next steps.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/earn"
            className="px-6 py-3 bg-[#2AB8E6] text-white font-medium rounded-full hover:bg-[#2AB8E6]/90 transition-all text-sm hover:scale-105"
          >
            Understand staking rewards
          </a>
          <a
            href="/theta-explained"
            className="px-6 py-3 border border-[#2A3548] text-[#B0B8C4] font-medium rounded-full hover:text-white hover:border-[#2AB8E6]/40 transition-all text-sm"
          >
            Deep dive into the technology
          </a>
          <a
            href="/get-started"
            className="px-6 py-3 border border-[#2A3548] text-[#B0B8C4] font-medium rounded-full hover:text-white hover:border-[#10B981]/40 transition-all text-sm"
          >
            Learn how to get started
          </a>
        </div>
      </div>
    </div>
  );
}
