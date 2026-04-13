"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Stats {
  totalUniqueVisitors: number;
  totalPageViews: number;
  today: {
    newVisitors: number;
    returningVisitors: number;
    pageViews: number;
  };
  topPages: { page: string; views: number }[];
  last14Days: { date: string; uniqueVisitors: number; pageViews: number }[];
  topReferrers: { referrer: string; visitors: number; views: number }[];
  topCampaigns: {
    source: string;
    campaign: string | null;
    visitors: number;
    views: number;
  }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function StatCard({
  label,
  value,
  sub,
  color = "#2AB8E6",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
      <p className="text-sm text-[#B0B8C4] mb-1">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-[#7D8694] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDev, setIsDev] = useState<boolean | null>(null);
  const [devToggling, setDevToggling] = useState(false);

  async function loadStats(secret: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats?key=${encodeURIComponent(secret)}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Wrong key" : "Failed to load stats");
        setStats(null);
        return;
      }
      setStats(await res.json());
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  async function checkDevStatus(secret: string) {
    const visitorId = localStorage.getItem("theta-visitor-id");
    if (!visitorId) {
      setIsDev(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/mark-dev?key=${encodeURIComponent(secret)}&visitorId=${encodeURIComponent(visitorId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setIsDev(data.isDev);
      }
    } catch {
      // ignore
    }
  }

  async function toggleDev() {
    const visitorId = localStorage.getItem("theta-visitor-id");
    if (!visitorId || isDev === null) return;
    setDevToggling(true);
    try {
      const res = await fetch(`/api/mark-dev?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, isDev: !isDev }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsDev(data.isDev);
        // Reload stats to reflect change
        loadStats(key);
      }
    } catch {
      // ignore
    } finally {
      setDevToggling(false);
    }
  }

  // Check if key is stored
  useEffect(() => {
    const stored = localStorage.getItem("theta-admin-key");
    if (stored) {
      setKey(stored);
      loadStats(stored);
      checkDevStatus(stored);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("theta-admin-key", key);
    loadStats(key);
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <form onSubmit={handleSubmit} className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-sm text-[#B0B8C4]">Enter your stats key to continue</p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Stats key"
            className="w-64 bg-[#0D1117] border border-[#2A3548] rounded-lg px-4 py-2.5 text-white placeholder:text-[#5C6675] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40"
          />
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#2AB8E6] text-white font-medium rounded-lg hover:bg-[#2AB8E6]/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "View Stats"}
            </button>
          </div>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        </form>
      </div>
    );
  }

  const chartData = [...stats.last14Days].reverse().map((d) => ({
    name: formatDate(d.date),
    visitors: d.uniqueVisitors,
    views: d.pageViews,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Visitor Stats</h1>
          <p className="text-sm text-[#B0B8C4]">
            Private visitor statistics
            {isDev && (
              <span className="text-[#F59E0B]"> · This device excluded from stats</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isDev !== null && (
            <button
              onClick={toggleDev}
              disabled={devToggling}
              className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                isDev
                  ? "bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/30"
                  : "bg-[#151D2E] border border-[#2A3548] text-[#B0B8C4] hover:text-white"
              }`}
            >
              {devToggling
                ? "..."
                : isDev
                  ? "Include this device"
                  : "Exclude this device"}
            </button>
          )}
          <button
            onClick={() => loadStats(key)}
            className="px-4 py-2 text-sm bg-[#151D2E] border border-[#2A3548] rounded-lg text-[#B0B8C4] hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Unique Visitors"
          value={stats.totalUniqueVisitors}
          color="#2AB8E6"
        />
        <StatCard
          label="Total Page Views"
          value={stats.totalPageViews}
          color="#10B981"
        />
        <StatCard
          label="New Today"
          value={stats.today.newVisitors}
          sub="first-time visitors"
          color="#F59E0B"
        />
        <StatCard
          label="Returning Today"
          value={stats.today.returningVisitors}
          sub="came back"
          color="#8B5CF6"
        />
        <StatCard
          label="Views Today"
          value={stats.today.pageViews}
          sub="page loads"
          color="#2AB8E6"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Unique visitors trend */}
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
          <p className="text-sm font-medium text-white mb-4">Unique Visitors (14 days)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vis-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2AB8E6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2AB8E6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#2A3548",
                    border: "1px solid #445064",
                    borderRadius: "8px",
                    color: "#eaecf0",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#2AB8E6"
                  strokeWidth={2}
                  fill="url(#vis-grad)"
                  dot
                  activeDot={{ r: 4, fill: "#2AB8E6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Page views trend */}
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
          <p className="text-sm font-medium text-white mb-4">Page Views (14 days)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#B0B8C4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#2A3548",
                    border: "1px solid #445064",
                    borderRadius: "8px",
                    color: "#eaecf0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="views" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
        <p className="text-sm font-medium text-white mb-4">Top Pages</p>
        <div className="space-y-2">
          {stats.topPages.map((p, i) => {
            const maxViews = stats.topPages[0]?.views || 1;
            const pct = (p.views / maxViews) * 100;
            return (
              <div key={p.page} className="flex items-center gap-4">
                <span className="text-xs text-[#7D8694] w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-mono">{p.page}</span>
                    <span className="text-sm text-[#B0B8C4] tabular-nums">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2AB8E6]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traffic sources */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
          <p className="text-sm font-medium text-white mb-1">Top Referrers</p>
          <p className="text-xs text-[#7D8694] mb-4">Last 30 days · by unique visitors</p>
          {stats.topReferrers.length === 0 ? (
            <p className="text-xs text-[#7D8694]">No referrer data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topReferrers.map((r, i) => {
                const max = stats.topReferrers[0]?.visitors || 1;
                const pct = (r.visitors / max) * 100;
                return (
                  <div key={r.referrer} className="flex items-center gap-4">
                    <span className="text-xs text-[#7D8694] w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono truncate">{r.referrer}</span>
                        <span className="text-sm text-[#B0B8C4] tabular-nums">{r.visitors.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#151D2E] border border-[#2A3548] rounded-xl p-6">
          <p className="text-sm font-medium text-white mb-1">UTM Campaigns</p>
          <p className="text-xs text-[#7D8694] mb-4">Last 30 days · tagged traffic only</p>
          {stats.topCampaigns.length === 0 ? (
            <p className="text-xs text-[#7D8694]">
              Tag your links with <span className="font-mono">?utm_source=x&amp;utm_campaign=name</span> to track them here.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.topCampaigns.map((c, i) => {
                const max = stats.topCampaigns[0]?.visitors || 1;
                const pct = (c.visitors / max) * 100;
                const label = c.campaign ? `${c.source} · ${c.campaign}` : c.source;
                return (
                  <div key={`${c.source}-${c.campaign ?? ""}-${i}`} className="flex items-center gap-4">
                    <span className="text-xs text-[#7D8694] w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono truncate">{label}</span>
                        <span className="text-sm text-[#B0B8C4] tabular-nums">{c.visitors.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#7D8694] text-center">
        All data is anonymous. No personal information is collected or stored.
      </p>
    </div>
  );
}
