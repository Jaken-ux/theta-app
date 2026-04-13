"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Placeholder trend data — replace with real historical data when available
const placeholderData = [
  { name: "W1", value: 38 },
  { name: "W2", value: 41 },
  { name: "W3", value: 39 },
  { name: "W4", value: 44 },
  { name: "W5", value: 42 },
  { name: "W6", value: 46 },
  { name: "W7", value: 43 },
  { name: "W8", value: 48 },
];

export default function UtilizationChart({ currentScore }: { currentScore: number }) {
  // Append current live score as the latest point
  const data = [
    ...placeholderData,
    { name: "Now", value: currentScore },
  ];

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-semibold text-white">
          Utilization Trend
        </h3>
        <span className="text-xs text-[#5C6675]">placeholder history + live current</span>
      </div>
      <p className="text-xs text-[#7D8694] mb-6">
        Weekly composite score. Historical data is illustrative — real
        tracking begins once we start recording snapshots.
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="util-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2AB8E6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2AB8E6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: "#7D8694", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#7D8694", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "#2A3548",
                border: "1px solid #445064",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "13px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v} / 100`, "Score"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2AB8E6"
              strokeWidth={2}
              fill="url(#util-grad)"
              dot={false}
              activeDot={{ r: 4, fill: "#2AB8E6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
