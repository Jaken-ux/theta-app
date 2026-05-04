"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export interface MetricHistoryPoint {
  date: string;
  value: number;
}

function TrendIndicator({ trend }: { trend: number | null }) {
  if (trend === null) {
    return (
      <p className="text-[11px] text-[#B0B8C4] mt-2 italic">
        Trend data available after 14 days of tracking
      </p>
    );
  }

  const abs = Math.abs(trend);
  let symbol: string;
  let color: string;
  let label: string;

  if (abs < 0.5) {
    symbol = "≈";
    color = "#7D8694";
    label = `${abs.toFixed(1)}% flat`;
  } else if (trend > 0) {
    symbol = "▲";
    color = "#10B981";
    label = `+${abs.toFixed(1)}% last 30d`;
  } else {
    symbol = "▼";
    color = "#EF4444";
    label = `-${abs.toFixed(1)}% last 30d`;
  }

  return (
    <p className="text-[11px] mt-2 font-medium" style={{ color }}>
      {symbol} {label}
    </p>
  );
}

function Sparkline({ data, color }: { data: MetricHistoryPoint[]; color: string }) {
  if (data.length < 2) return null;

  const chartData = data.map((d) => ({ v: d.value }));

  return (
    <div className="h-10 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace("#", "")})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function ExpandedChart({
  data,
  color,
  unit,
}: {
  data: MetricHistoryPoint[];
  color: string;
  unit?: string;
}) {
  const chartData = data.map((d) => ({
    name: formatDate(d.date),
    value: d.value,
  }));

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="h-44 mt-3 pt-3 border-t border-[#2A3548]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`expanded-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
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
              tick={{ fill: "#B0B8C4", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                background: "#2A3548",
                border: "1px solid #445064",
                borderRadius: "8px",
                color: "#eaecf0",
                fontSize: "12px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [
                `${Number(v).toLocaleString()}${unit ? ` ${unit}` : ""}`,
                "Value",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#expanded-${color.replace("#", "")})`}
              dot={chartData.length <= 30}
              activeDot={{ r: 3, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default function ActivityMetric({
  title,
  value,
  subValue,
  secondaryValue,
  secondaryNote,
  description,
  weight,
  tooltip,
  trend = null,
  history = [],
  historyColor = "#2AB8E6",
  historyUnit,
}: {
  title: string;
  value: string;
  subValue?: string;
  secondaryValue?: string;
  secondaryNote?: string;
  description: string;
  weight: string;
  tooltip?: string;
  trend?: number | null;
  history?: MetricHistoryPoint[];
  historyColor?: string;
  historyUnit?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasHistory = history.length >= 2;

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {tooltip && (
            <span
              title={tooltip}
              className="w-4 h-4 rounded-full border border-[#7D8694] text-[#B0B8C4] hover:text-white hover:border-[#B0B8C4] transition-colors flex items-center justify-center text-[10px] font-medium leading-none cursor-help shrink-0"
            >
              ?
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#B0B8C4] font-mono">{weight}</span>
      </div>

      <p className="text-2xl font-semibold text-white tabular-nums mt-3">
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-[#B0B8C4] mt-0.5">{subValue}</p>
      )}

      {/* Sparkline */}
      <Sparkline data={history} color={historyColor} />

      <TrendIndicator trend={trend} />

      {secondaryValue && (
        <div className="mt-3 p-2.5 bg-[#0A0F1C] rounded-lg">
          <p className="text-sm font-medium text-[#B0B8C4]">{secondaryValue}</p>
          {secondaryNote && (
            <p className="text-[10px] text-[#B0B8C4] mt-0.5">{secondaryNote}</p>
          )}
        </div>
      )}

      <p className="text-xs text-[#D1D5DB] leading-relaxed mt-4 border-t border-[#2A3548] pt-3">
        {description}
      </p>

      {/* Expand button */}
      {hasHistory && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-[11px] text-[#B0B8C4] hover:text-white transition-colors"
        >
          <span>{expanded ? "Hide" : "Show"} history</span>
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      <AnimatePresence>
        {expanded && hasHistory && (
          <ExpandedChart data={history} color={historyColor} unit={historyUnit} />
        )}
      </AnimatePresence>
    </div>
  );
}
