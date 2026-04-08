"use client";

import { motion, AnimatePresence } from "framer-motion";

export function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="How this index works"
      className="w-5 h-5 rounded-full border border-[#7D8694] text-[#B0B8C4] hover:text-white hover:border-[#B0B8C4] transition-colors flex items-center justify-center text-[11px] font-medium leading-none"
    >
      i
    </button>
  );
}

export default function MetachainInfoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  How the Metachain Utilization Index works
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#7D8694] hover:text-white transition-colors text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-sm text-[#D1D5DB] leading-relaxed">
                <p>
                  This index measures <span className="text-white">real application activity</span> across
                  the entire Theta ecosystem — not just the main chain. It combines data from
                  7 sources into one composite score.
                </p>

                {/* What it measures */}
                <div>
                  <p className="text-white font-medium mb-2">What it measures:</p>
                  <ul className="space-y-1.5 list-disc list-inside text-[#D1D5DB]">
                    <li>Transaction volume on each chain (daily estimate)</li>
                    <li>Block activity and wallet participation per subchain</li>
                    <li>TFUEL trading volume (main chain)</li>
                    <li>Ecosystem growth signals (subchain registrations, cross-chain transfers)</li>
                  </ul>
                </div>

                {/* How it differs */}
                <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
                  <p className="text-white font-medium mb-2">
                    How is this different from the Main Chain Activity Index?
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-3">
                      <span className="text-[#F59E0B] shrink-0">Main Chain</span>
                      <span>Answers &quot;Are people interested in Theta?&quot; — measures settlement layer activity, token trading, staking.</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#10B981] shrink-0">Metachain</span>
                      <span>Answers &quot;Is Theta being used?&quot; — measures real application activity across gaming, AI, health data, and more.</span>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <p className="text-white font-medium mb-3">
                    Ecosystem milestones:
                  </p>
                  <div className="space-y-3">
                    {/* Early Ecosystem */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#F59E0B]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#F59E0B]">0 — 50</span>
                        <span className="text-xs text-[#F59E0B] font-medium">Early Ecosystem</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B]">current</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        A handful of subchains are active alongside the main chain.
                        Real applications exist but usage is still building. The
                        foundation of the multi-chain ecosystem is in place.
                      </p>
                    </div>

                    {/* Growing Ecosystem */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#2AB8E6]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#2AB8E6]">50 — 100</span>
                        <span className="text-xs text-[#2AB8E6] font-medium">Growing Ecosystem</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Multiple subchains consistently active. Applications across
                        gaming, AI, and health data generate sustained volume.
                        The ecosystem is delivering real utility.
                      </p>
                    </div>

                    {/* Thriving Ecosystem */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#10B981]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#10B981]">100 — 250</span>
                        <span className="text-xs text-[#10B981] font-medium">Thriving Ecosystem</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Most subchains exceed their baselines. New chains register
                        regularly. High cross-chain activity shows an interconnected
                        ecosystem with diverse use cases.
                      </p>
                    </div>

                    {/* Mature Ecosystem */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#8B5CF6]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#8B5CF6]">250 — 500</span>
                        <span className="text-xs text-[#8B5CF6] font-medium">Mature Ecosystem</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Full-scale multi-chain network — dozens of active subchains,
                        heavy cross-chain bridging, and off-chain metrics (video, AI
                        compute) becoming measurable.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#B0B8C4] mt-3">
                    These milestones describe ecosystem-wide growth — not just one chain.
                    They are based on the weighted composite of all data sources.
                  </p>
                </div>

                {/* Data sources */}
                <div>
                  <p className="text-white font-medium mb-2">Data sources:</p>
                  <div className="bg-[#0D1117] rounded-lg p-3 space-y-1.5 text-xs text-[#B0B8C4]">
                    <p><span className="text-[#2AB8E6]">Main Chain</span> — explorer-api.thetatoken.org (txs, volume, staking)</p>
                    <p><span className="text-[#10B981]">Lavita AI</span> — tsub360890-explorer-api (health AI transactions)</p>
                    <p><span className="text-[#8B5CF6]">TPulse</span> — tsub68967-explorer-api (EdgeCloud job logs)</p>
                    <p><span className="text-[#F59E0B]">Passaways</span> — tsub7734-explorer-api (gaming txs)</p>
                    <p><span className="text-[#EF4444]">Grove</span> — tsub47683-explorer-api (gaming txs)</p>
                    <p><span className="text-[#7D8694]">POGS</span> — tsub9065-explorer-api (collectibles)</p>
                    <p><span className="text-[#E879F9]">Ecosystem Growth</span> — ChainRegistrar + Token Bank contracts</p>
                  </div>
                </div>

                {/* What it does NOT measure */}
                <div className="bg-[#0A0F1C] border border-[#2A3548] rounded-xl p-4">
                  <p className="text-white font-medium mb-2">
                    What it does NOT measure:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#D1D5DB]">
                    <li>Off-chain activity: video delivery via Theta CDN</li>
                    <li>EdgeCloud GPU compute jobs (only the logs on TPulse)</li>
                    <li>Transaction quality — cannot distinguish bots from real users</li>
                    <li>Subchains without public explorer APIs</li>
                    <li>Inactive chains (e.g. POGS, inactive since March 2026) still contribute to the composite with their last known data and lower weight — they are not excluded</li>
                  </ul>
                </div>

                <p className="text-xs text-[#B0B8C4] pt-2 border-t border-[#2A3548]">
                  This index is a transparent, best-effort measure of ecosystem
                  utilization. We show exactly what we measure, from which sources,
                  and what we cannot see. Use it to track whether Theta is being
                  used — not to predict prices.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
