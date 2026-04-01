"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  saveScore,
  getTodaySampleCount,
  getDaysSinceFirstEntry,
  type HistoryEntry,
} from "../../lib/activity-history";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function ActivityTrendChart({
  currentScore,
  embedded = false,
}: {
  currentScore: number;
  embedded?: boolean;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [daysSinceStart, setDaysSinceStart] = useState(0);
  const [todaySamples, setTodaySamples] = useState(0);

  useEffect(() => {
    const updated = saveScore(currentScore);
    setHistory(updated);
    setDaysSinceStart(getDaysSinceFirstEntry());
    setTodaySamples(getTodaySampleCount());
  }, [currentScore]);

  const hasEnoughData = history.length >= 2;

  const chartData = history.map((e) => ({
    name: formatDate(e.date),
    value: e.score,
    samples: e.sampleCount,
  }));

  const trend =
    history.length >= 2
      ? history[history.length - 1].score - history[0].score
      : null;

  const content = (
    <>
      {!embedded && (
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">
            Trend
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1F2937] text-[#9CA3AF]">
            {hasEnoughData ? "daily averages" : "collecting data"}
          </span>
        </div>
      )}

      {!hasEnoughData ? (
        <div className={embedded ? "py-6 text-center" : "py-10 text-center"}>
          <p className="text-sm text-[#9CA3AF] mb-2">
            Tracking started
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Come back tomorrow to see your first trend line.
            Today&apos;s score is based on {todaySamples} sample{todaySamples !== 1 ? "s" : ""}.
          </p>
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i <= daysSinceStart ? "bg-[#2AB8E6]" : "bg-[#1F2937]"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Day {daysSinceStart + 1} / 14
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#9CA3AF] mb-1">
            {daysSinceStart} day{daysSinceStart !== 1 ? "s" : ""} tracked
          </p>
          {trend !== null && (
            <p
              className="text-xs font-medium mb-3"
              style={{
                color:
                  Math.abs(trend) < 2
                    ? "#9CA3AF"
                    : trend > 0
                    ? "#10B981"
                    : "#EF4444",
              }}
            >
              {Math.abs(trend) < 2
                ? `Stable (${trend >= 0 ? "+" : ""}${trend} pts)`
                : trend > 0
                ? `+${trend} pts since start`
                : `${trend} pts since start`}
            </p>
          )}

          <div className={embedded ? "h-40" : "h-52"}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="activity-grad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2AB8E6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2AB8E6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, "auto"]}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                    fontSize: "12px",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, _: any, entry: any) => {
                    const samples = entry?.payload?.samples;
                    const label = samples
                      ? `${v} / 100 (avg of ${samples} sample${samples !== 1 ? "s" : ""})`
                      : `${v} / 100`;
                    return [label, "Index"];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2AB8E6"
                  strokeWidth={2}
                  fill="url(#activity-grad)"
                  dot={chartData.length <= 30}
                  activeDot={{ r: 4, fill: "#2AB8E6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <p className="text-[10px] text-[#6B7280] mt-2">
        Each day = average of all samples. ~1,000 blocks sampled per visit.
      </p>
    </>
  );

  if (embedded) return content;

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
      {content}
    </div>
  );
}
