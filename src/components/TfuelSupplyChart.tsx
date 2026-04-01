"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SupplyEntry {
  date: string;
  supply: number | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function formatSupply(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return n.toLocaleString();
}

export default function TfuelSupplyChart() {
  const [data, setData] = useState<SupplyEntry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/activity-history");
        if (!res.ok) return;
        const history = await res.json();
        const entries: SupplyEntry[] = history
          .filter((e: { metrics?: { tfuelCirculatingSupply?: number } }) => e.metrics?.tfuelCirculatingSupply)
          .map((e: { date: string; metrics: { tfuelCirculatingSupply: number } }) => ({
            date: e.date,
            supply: e.metrics.tfuelCirculatingSupply,
          }));
        setData(entries);
      } catch {
        // Failed to load
      }
    }
    load();
  }, []);

  if (data.length < 2) {
    const currentSupply = data.length === 1 ? data[0].supply : null;
    return (
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-1">
          TFUEL Supply Over Time
        </h3>
        <p className="text-xs text-[#B0B8C4] mb-4">
          Net result of inflation + burn. A downward trend = burn &gt; inflation.
        </p>
        <div className="py-10 text-center">
          <p className="text-sm text-[#B0B8C4] mb-2">Collecting data...</p>
          {currentSupply && (
            <p className="text-xs text-[#B0B8C4]">
              Current supply: {formatSupply(currentSupply)}
            </p>
          )}
          <p className="text-xs text-[#B0B8C4] mt-2">
            The trend line will appear after a few days of data collection.
          </p>
        </div>
      </div>
    );
  }

  const chartData = data.map((e) => ({
    name: formatDate(e.date),
    supply: e.supply,
  }));

  const firstSupply = data[0].supply!;
  const lastSupply = data[data.length - 1].supply!;
  const diff = lastSupply - firstSupply;
  const increasing = diff >= 0;

  const supplies = data.map((e) => e.supply!);
  const minSupply = Math.min(...supplies);
  const maxSupply = Math.max(...supplies);
  const padding = (maxSupply - minSupply) * 0.2 || maxSupply * 0.001;

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-semibold text-white">
          TFUEL Supply Over Time
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#2A3548] text-[#B0B8C4]">
          {data.length} days tracked
        </span>
      </div>
      <p className="text-xs text-[#B0B8C4] mb-1">
        Net result of inflation + burn. A downward trend = burn &gt; inflation.
      </p>
      <p
        className="text-xs font-medium mb-4"
        style={{ color: increasing ? "#F59E0B" : "#10B981" }}
      >
        {increasing ? "+" : ""}
        {formatSupply(Math.abs(diff))} since tracking started
        {!increasing && " — supply is shrinking!"}
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="supply-grad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={increasing ? "#F59E0B" : "#10B981"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={increasing ? "#F59E0B" : "#10B981"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: "#B0B8C4", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minSupply - padding, maxSupply + padding]}
              tick={{ fill: "#B0B8C4", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(v) => formatSupply(v)}
            />
            <Tooltip
              contentStyle={{
                background: "#2A3548",
                border: "1px solid #445064",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [formatSupply(Number(v)), "TFUEL Supply"]}
            />
            <ReferenceLine
              y={firstSupply}
              stroke="#5C6675"
              strokeDasharray="4 4"
              label={{
                value: "Start",
                fill: "#7D8694",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Area
              type="monotone"
              dataKey="supply"
              stroke={increasing ? "#F59E0B" : "#10B981"}
              strokeWidth={2}
              fill="url(#supply-grad)"
              dot={chartData.length <= 30}
              activeDot={{ r: 4, fill: increasing ? "#F59E0B" : "#10B981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-[#7D8694] mt-3">
        TFUEL has built-in inflation (new tokens minted per block) and burn (5% of every transaction fee is burned). This chart shows the net effect over time.
      </p>
    </div>
  );
}
