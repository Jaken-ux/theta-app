"use client";

import { motion } from "framer-motion";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function SizeVsUsage({
  totalNodes,
  utilizationScore,
}: {
  totalNodes: number;
  utilizationScore: number;
}) {
  const score = Math.round(utilizationScore);

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
      <h3 className="text-base font-semibold text-white mb-1">
        Size vs. Usage
      </h3>
      <p className="text-xs text-[#6B7280] mb-8">
        A network is only valuable if it&apos;s both big enough and actually
        being used. These two metrics together tell the full story.
      </p>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Size */}
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3">
            Network Size
          </p>
          <p className="text-[40px] leading-none font-semibold text-white tabular-nums mb-1">
            {fmt(totalNodes)}
          </p>
          <p className="text-sm text-[#9CA3AF] mb-4">active nodes</p>

          <div className="h-2.5 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#2AB8E6]"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min((totalNodes / 15_000) * 100, 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-[#4B5563] mt-1.5">
            Capacity in nodes — grows as more people join
          </p>
        </div>

        {/* Usage */}
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3">
            Network Usage
          </p>
          <p className="text-[40px] leading-none font-semibold text-white tabular-nums mb-1">
            {score}<span className="text-[#6B7280] text-lg">/100</span>
          </p>
          <p className="text-sm text-[#9CA3AF] mb-4">utilization score</p>

          <div className="h-2.5 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#10B981]"
              initial={{ width: 0 }}
              whileInView={{ width: `${score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-[#4B5563] mt-1.5">
            How actively the network is being used right now
          </p>
        </div>
      </div>

      {/* Insight box */}
      <div className="mt-8 p-4 bg-[#0A0F1C] rounded-xl">
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          <span className="text-white font-medium">Why both matter: </span>
          If utilization stays at {score}/100 but the network doubles in size,
          that means <span className="text-white">twice as much real activity</span> is
          happening — even though the score looks the same. This is why we
          track size and usage side by side.
        </p>
      </div>
    </div>
  );
}
