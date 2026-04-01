"use client";

import Card from "./Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ChartCard({
  title,
  data,
  dataKey,
}: {
  title: string;
  data: { name: string; value: number }[];
  dataKey?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-theta-muted mb-4">{title}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2AB8E6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2AB8E6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey ?? "value"}
              stroke="#2AB8E6"
              strokeWidth={2}
              fill={`url(#grad-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
