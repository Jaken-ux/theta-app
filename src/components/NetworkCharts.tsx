"use client";

import type { NetworkStats } from "../lib/theta-api";
import Card from "./Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function ProgressBar({
  label,
  value,
  max,
  suffix = "",
  color = "#2AB8E6",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#B0B8C4]">{label}</span>
        <span className="text-white font-medium">
          {value.toLocaleString("en-US", { maximumFractionDigits: 1 })}
          {suffix}
        </span>
      </div>
      <div className="h-2.5 bg-[#2A3548] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function NetworkCharts({ stats }: { stats: NetworkStats }) {
  const nodeData = [
    { name: "Validators & Guardians", value: stats.thetaStake.totalNodes, color: "#2AB8E6" },
    { name: "Elite Edge Nodes", value: stats.tfuelStake.totalNodes, color: "#10B981" },
  ];

  const tfuelStakedM = stats.tfuelStake.totalAmount / 1_000_000;
  const tfuelFreeM =
    (stats.tfuelSupply.circulatingSupply - stats.tfuelStake.totalAmount) / 1_000_000;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Staking ratios as progress bars */}
      <Card>
        <p className="text-sm text-[#B0B8C4] mb-5">Staking Ratios</p>
        <div className="space-y-5">
          <ProgressBar
            label="THETA staked"
            value={stats.thetaStakingRatio}
            max={100}
            suffix="%"
            color="#2AB8E6"
          />
          <ProgressBar
            label="TFUEL staked"
            value={stats.tfuelStakingRatio}
            max={100}
            suffix="%"
            color="#10B981"
          />
        </div>
      </Card>

      {/* Node distribution as bar chart */}
      <Card>
        <p className="text-sm text-[#B0B8C4] mb-4">Node Distribution</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nodeData} layout="vertical" barSize={28}>
              <XAxis
                type="number"
                tick={{ fill: "#B0B8C4", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
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
                contentStyle={{
                  background: "#2A3548",
                  border: "1px solid #445064",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [Number(v).toLocaleString(), "Nodes"]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {nodeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* TFUEL supply breakdown */}
      <Card className="lg:col-span-2">
        <p className="text-sm text-[#B0B8C4] mb-5">TFUEL Supply Breakdown</p>
        <div className="space-y-5">
          <ProgressBar
            label="Staked"
            value={tfuelStakedM}
            max={stats.tfuelSupply.circulatingSupply / 1_000_000}
            suffix="M"
            color="#2AB8E6"
          />
          <ProgressBar
            label="Free / Circulating"
            value={tfuelFreeM}
            max={stats.tfuelSupply.circulatingSupply / 1_000_000}
            suffix="M"
            color="#7D8694"
          />
        </div>
      </Card>
    </div>
  );
}
