"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Metric {
  current: number | null;
  change?: number | null;
  changePct?: number | null;
}

interface WeeklyData {
  available: boolean;
  periodStart?: string;
  periodEnd?: string;
  metrics?: {
    activityIndex: Metric;
    thetaPrice: Metric;
    tfuelPrice: Metric;
    dailyTxs: Metric;
    stakingNodes: Metric;
    tfuelVolume: Metric;
  };
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${n.toFixed(4)}`;
}

function ChangeIndicator({ value, suffix = "%" }: { value: number | null | undefined; suffix?: string }) {
  if (value == null) return <span className="text-[#7D8694] text-sm">—</span>;

  const isPositive = value > 0;
  const isZero = Math.abs(value) < 0.01;

  if (isZero) {
    return <span className="text-[#7D8694] text-sm">0{suffix}</span>;
  }

  return (
    <span className={`text-sm font-medium ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
      {isPositive ? "+" : ""}
      {value.toFixed(1)}{suffix}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  change,
  changeSuffix,
  icon,
  color,
  delay,
}: {
  label: string;
  value: string;
  change: number | null | undefined;
  changeSuffix?: string;
  icon: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="relative bg-[#151D2E]/80 backdrop-blur-sm border border-[#2A3548] rounded-xl p-5 hover:border-opacity-60 transition-all duration-500 group"
      style={{ "--card-color": color } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <ChangeIndicator value={change} suffix={changeSuffix} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-[#7D8694] mt-1">{label}</p>
    </motion.div>
  );
}

export default function WeeklySummary() {
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    fetch("/api/weekly-summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ available: false }));
  }, []);

  if (!data || !data.available || !data.metrics) return null;

  const m = data.metrics;

  const periodLabel = data.periodStart && data.periodEnd
    ? `${new Date(data.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${new Date(data.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "Last 7 days";

  return (
    <motion.section
      className="py-16 sm:py-24 px-4 sm:px-6 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2AB8E6]/20 bg-[#2AB8E6]/5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AB8E6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2AB8E6]" />
            </span>
            <span className="text-[#2AB8E6] text-xs font-medium tracking-wide uppercase">{periodLabel}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            This week in Theta
          </h2>
          <p className="text-[#B0B8C4] mt-3 max-w-lg mx-auto text-sm sm:text-base">
            Automated snapshot — how the network moved over the past 7 days.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <SummaryCard
            label="Activity Index"
            value={m.activityIndex.current != null ? `${m.activityIndex.current}` : "—"}
            change={m.activityIndex.change}
            changeSuffix=" pts"
            icon="◈"
            color="#2AB8E6"
            delay={0}
          />
          <SummaryCard
            label="THETA Price"
            value={m.thetaPrice.current != null ? `$${m.thetaPrice.current.toFixed(3)}` : "—"}
            change={m.thetaPrice.changePct}
            icon="Θ"
            color="#2AB8E6"
            delay={0.05}
          />
          <SummaryCard
            label="TFUEL Price"
            value={formatPrice(m.tfuelPrice.current)}
            change={m.tfuelPrice.changePct}
            icon="⚡"
            color="#10B981"
            delay={0.1}
          />
          <SummaryCard
            label="Daily Transactions"
            value={formatNumber(m.dailyTxs.current)}
            change={m.dailyTxs.changePct}
            icon="↗"
            color="#F59E0B"
            delay={0.15}
          />
          <SummaryCard
            label="Staking Nodes"
            value={formatNumber(m.stakingNodes.current)}
            change={m.stakingNodes.change}
            changeSuffix=""
            icon="⬡"
            color="#8B5CF6"
            delay={0.2}
          />
          <SummaryCard
            label="TFUEL Volume (24h)"
            value={formatNumber(m.tfuelVolume.current)}
            change={m.tfuelVolume.changePct}
            icon="◎"
            color="#10B981"
            delay={0.25}
          />
        </div>
      </div>
    </motion.section>
  );
}
