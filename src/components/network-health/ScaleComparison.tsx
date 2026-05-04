"use client";

import { motion } from "framer-motion";

interface ScaleEntry {
  name: string;
  value: number;
  label: string;
  color: string;
  note?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ScaleComparison({ totalNodes }: { totalNodes: number }) {
  const entries: ScaleEntry[] = [
    {
      name: "Theta Network",
      value: totalNodes,
      label: `${fmt(totalNodes)} nodes`,
      color: "#2AB8E6",
      note: "distributed across homes & offices",
    },
    {
      name: "Akamai CDN",
      value: 365_000,
      label: "365K+ servers",
      color: "#7D8694",
      note: "largest traditional CDN",
    },
    {
      name: "AWS",
      value: 1_500_000,
      label: "1.5M+ servers (est.)",
      color: "#7D8694",
      note: "100+ data centers worldwide",
    },
  ];

  // Log scale for visual — raw values are too skewed
  const maxLog = Math.log10(entries[entries.length - 1].value);

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
      <h3 className="text-base font-semibold text-white mb-1">
        How big is the network?
      </h3>
      <p className="text-xs text-[#7D8694] mb-8">
        Theta is a young, distributed network. Unlike cloud giants with massive
        data centers, Theta relies on thousands of individual computers. The
        growth rate matters more than the current size.
      </p>

      <div className="space-y-5">
        {entries.map((entry, i) => {
          const pct = (Math.log10(Math.max(entry.value, 1)) / maxLog) * 100;
          return (
            <div key={entry.name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {entry.name}
                  </span>
                  {i === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2AB8E6]/10 text-[#2AB8E6] font-medium">
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#B0B8C4] tabular-nums">
                  {entry.label}
                </span>
              </div>
              <div className="h-3 bg-[#2A3548] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: entry.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                />
              </div>
              {entry.note && (
                <p className="text-[11px] text-[#5C6675] mt-1">{entry.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-[#0A0F1C] rounded-xl">
        <p className="text-sm text-[#B0B8C4] leading-relaxed">
          <span className="text-white font-medium">Important context: </span>
          These are different types of infrastructure. AWS runs enormous
          centralized data centers. Theta is a mesh of small, independent
          machines. A fairer question than &ldquo;how big?&rdquo; is
          &ldquo;how fast is it growing?&rdquo; — and that&apos;s what we&apos;ll
          track over time.
        </p>
      </div>
    </div>
  );
}
