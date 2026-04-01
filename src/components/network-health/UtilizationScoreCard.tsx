"use client";

import { motion } from "framer-motion";

export default function UtilizationScoreCard({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  let status: string;
  let statusColor: string;
  if (clamped >= 70) {
    status = "Strong activity";
    statusColor = "#10B981";
  } else if (clamped >= 40) {
    status = "Moderate activity";
    statusColor = "#F59E0B";
  } else {
    status = "Low activity";
    statusColor = "#7D8694";
  }

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-8 sm:p-10">
      <p className="text-sm text-[#B0B8C4] uppercase tracking-wide">
        Network Utilization
      </p>
      <p className="text-xs text-[#7D8694] mt-1 mb-8">
        Proxy indicator of real network usage
      </p>

      {/* Score */}
      <div className="flex items-end gap-3 mb-6">
        <span className="text-[72px] sm:text-[88px] leading-none font-semibold text-white tabular-nums">
          {clamped}
        </span>
        <span className="text-2xl text-[#7D8694] mb-3">/100</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-[#2A3548] rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: statusColor }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {status}
        </span>
      </div>

      <p className="text-sm text-[#7D8694] leading-relaxed">
        Based on TFUEL trading activity, staking participation, and node count.
        This is a simplified composite — not a definitive measure of adoption.
      </p>
    </div>
  );
}
