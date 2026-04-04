"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AlgorithmDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#2A3548] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0D1117] transition-colors"
      >
        <span className="text-white font-medium text-sm">
          Exact algorithm &amp; formula
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-[#B0B8C4]">
                The index is calculated from four on-chain metrics, each scored
                relative to a baseline and weighted.
              </p>

              {/* Formula */}
              <div className="bg-[#0D1117] rounded-lg p-4 font-mono text-xs text-[#D1D5DB] space-y-2">
                <p className="text-[#B0B8C4]">{/* eslint-disable-next-line */}{'// Step 1: Score each metric'}</p>
                <p>txScore = (dailyTxs / 42,000) &times; 100</p>
                <p>volumeScore = (tfuelVolume24h / $12,000,000) &times; 100</p>
                <p>walletScore = (userTxRate / 100%) &times; 100</p>
                <p>nodeScore = (stakingNodes / 22,000) &times; 100</p>
                <p className="text-[#B0B8C4] pt-2">{'// Step 2: Weighted sum'}</p>
                <p className="text-white">
                  index = txScore &times; 0.30
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ volumeScore &times; 0.30
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ walletScore &times; 0.30
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ nodeScore &times; 0.10
                </p>
              </div>

              {/* Explanation table */}
              <div className="space-y-2">
                <p className="text-xs text-[#B0B8C4]">
                  Baselines represent the value at which each metric contributes
                  exactly 100 points. There is no cap — if a metric exceeds its
                  baseline, it scores above 100.
                </p>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#B0B8C4] text-left">
                      <th className="pb-1.5 font-medium">Metric</th>
                      <th className="pb-1.5 font-medium">Baseline (=100)</th>
                      <th className="pb-1.5 font-medium">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#D1D5DB]">
                    <tr className="border-t border-[#2A3548]">
                      <td className="py-1.5">Daily transactions</td>
                      <td className="py-1.5 font-mono">42,000</td>
                      <td className="py-1.5">30%</td>
                    </tr>
                    <tr className="border-t border-[#2A3548]">
                      <td className="py-1.5">TFUEL 24h volume</td>
                      <td className="py-1.5 font-mono">$12,000,000</td>
                      <td className="py-1.5">30%</td>
                    </tr>
                    <tr className="border-t border-[#2A3548]">
                      <td className="py-1.5">Wallet activity</td>
                      <td className="py-1.5 font-mono">100%</td>
                      <td className="py-1.5">30%</td>
                    </tr>
                    <tr className="border-t border-[#2A3548]">
                      <td className="py-1.5">Staking participants</td>
                      <td className="py-1.5 font-mono">22,000</td>
                      <td className="py-1.5">10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Data sources */}
              <div className="bg-[#0D1117] rounded-lg p-3">
                <p className="text-[10px] text-[#B0B8C4] font-medium mb-1.5">DATA SOURCES</p>
                <div className="text-[10px] text-[#B0B8C4] space-y-0.5 font-mono">
                  <p>Transactions &rarr; /api/transactions/number/24</p>
                  <p>TFUEL volume &rarr; /api/price/all (volume_24h)</p>
                  <p>Wallet activity &rarr; /api/blocks/top_blocks (1000 blocks sampled)</p>
                  <p>Staking nodes &rarr; /api/stake/totalAmount</p>
                  <p className="pt-1 text-[#7D8694]">All from explorer-api.thetatoken.org</p>
                </div>
              </div>

              <p className="text-[10px] text-[#7D8694]">
                The daily score shown is the average of all samples collected
                that day. Each page visit or scheduled cron job adds one sample.
                Raw metrics are stored alongside scores for potential future
                recalculation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

export default function InfoModal({
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
                  How the Main Chain Activity Index works
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#7D8694] hover:text-white transition-colors text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Explanation */}
              <div className="space-y-4 text-sm text-[#D1D5DB] leading-relaxed">
                <p>
                  The Main Chain Activity Index is a relative measure of observable on-chain
                  activity on the Theta main chain. It combines four metrics into
                  a score between 0 and 100.
                </p>

                {/* What it measures */}
                <div>
                  <p className="text-white font-medium mb-2">
                    What it measures:
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-[#D1D5DB]">
                    <li>Main-chain transactions in the last 24h (30% weight)</li>
                    <li>TFUEL 24h trading volume (30% weight)</li>
                    <li>Percentage of blocks with user transactions (30% weight)</li>
                    <li>Number of staking participants (10% weight)</li>
                  </ul>
                </div>

                {/* How to use it */}
                <div>
                  <p className="text-white font-medium mb-2">
                    How to use it:
                  </p>
                  <p>
                    This index is useful for one thing: <span className="text-white">tracking change over time</span>.
                    If it trends upward, more on-chain activity is happening. If it
                    trends downward, less is visible on-chain.
                  </p>
                </div>

                {/* What it does NOT tell you */}
                <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
                  <p className="text-white font-medium mb-2">
                    What it does NOT tell you:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#D1D5DB] leading-relaxed">
                    <li>It does not predict token price or investment value</li>
                    <li>A high score does not mean the project has &quot;succeeded&quot;</li>
                    <li>A low score does not mean the network is dead or failing</li>
                    <li>It does not capture off-chain activity (video delivery, AI compute, subchain transactions)</li>
                  </ul>
                </div>

                {/* How the scale works */}
                <div>
                  <p className="text-white font-medium mb-2">
                    How the scale works:
                  </p>
                  <p>
                    Unlike a fixed 0-100 scale, this index grows with the network.
                    When the score reaches a milestone, the next tier unlocks and
                    the ceiling expands. This means the index never caps out — it
                    keeps scaling as Theta grows.
                  </p>
                  <div className="mt-2 bg-[#0D1117] rounded-lg p-3 text-xs text-[#B0B8C4] space-y-1">
                    <p>Each metric baseline (= score of 100):</p>
                    <p>Transactions: 42,000/day</p>
                    <p>TFUEL volume: $12M/24h</p>
                    <p>Block activity: 100% of blocks with user txs</p>
                    <p>Staking: 22,000 participants</p>
                  </div>
                  <p className="text-xs text-[#B0B8C4] mt-2">
                    When the network exceeds these baselines, the score goes above
                    100 and the next milestone unlocks automatically.
                  </p>
                </div>

                {/* Tier milestones */}
                <div>
                  <p className="text-white font-medium mb-3">
                    Milestones — tiers that unlock as the network grows:
                  </p>
                  <div className="space-y-3">
                    {/* Foundation 0-100 */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#F59E0B]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#F59E0B]">0 — 100</span>
                        <span className="text-xs text-[#F59E0B] font-medium">Foundation</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B]">current tier</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed mb-2">
                        The network is functional with early adopters and stakers. Infrastructure
                        is in place. On-chain activity is growing from a small base.
                      </p>
                      <div className="text-[10px] text-[#B0B8C4] space-y-0.5">
                        <p>Now (~42): ~14K txs/day, ~$2M volume, ~12K stakers</p>
                        <p>At 60: ~18K txs/day, ~$4M volume — TFUEL burn rate doubles</p>
                        <p>At 80: ~25K txs/day, ~$7M volume — consistent demand for blockspace</p>
                        <p>At 100: all metrics at baseline — first milestone reached</p>
                      </div>
                    </div>

                    {/* Growth 100-500 */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#2AB8E6]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#2AB8E6]">100 — 500</span>
                        <span className="text-xs text-[#2AB8E6] font-medium">Growth</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed mb-2">
                        The network surpasses its initial baselines. Main chain processes 30K+ txs/day.
                        TFUEL burn is continuous and supply reduction becomes visible on-chain.
                        Real applications are driving consistent demand.
                      </p>
                      <div className="text-[10px] text-[#B0B8C4] space-y-0.5">
                        <p>At 200: ~60K txs/day, ~$20M volume — 2x all baselines</p>
                        <p>At 300: ~90K txs/day — TFUEL burn is a significant economic force</p>
                        <p>At 500: ~150K txs/day — multiple major applications on-chain daily</p>
                      </div>
                    </div>

                    {/* Scale 500-2500 */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#10B981]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#10B981]">500 — 2,500</span>
                        <span className="text-xs text-[#10B981] font-medium">Scale</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed mb-2">
                        Mass adoption territory. High transaction volume, significant TFUEL burn
                        continuously reducing supply. The network is a daily-use platform for
                        many applications and users.
                      </p>
                      <div className="text-[10px] text-[#B0B8C4] space-y-0.5">
                        <p>At this level, TFUEL burn creates sustained deflationary pressure</p>
                        <p>Fundamental demand for TFUEL is structurally embedded, not speculative</p>
                      </div>
                    </div>

                    {/* Dominance 2500-10000 */}
                    <div className="bg-[#0D1117] rounded-xl p-4 border-l-2 border-[#8B5CF6]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#8B5CF6]">2,500 — 10,000</span>
                        <span className="text-xs text-[#8B5CF6] font-medium">Dominance</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#7D8694]">locked</span>
                      </div>
                      <p className="text-xs text-[#D1D5DB] leading-relaxed">
                        Theta processes volumes comparable to top-tier blockchain networks.
                        TFUEL demand is structurally embedded in a large, active ecosystem.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#B0B8C4] mt-3">
                    These milestones describe what is mechanically happening on the network at each level.
                    They are not predictions or targets — they are what the data would have to look like
                    for the index to reach that score.
                  </p>
                </div>

                {/* Exact algorithm — collapsible */}
                <AlgorithmDropdown />

                {/* Data coverage */}
                <div>
                  <p className="text-white font-medium mb-2">
                    Data coverage:
                  </p>
                  <p>
                    This index only sees main-chain data (~14K txs/day).
                    Theta&apos;s full Metachain processes ~300K+ transactions/day
                    across subchains, but that data is not available via public API.
                    The real picture is significantly bigger than what we can show.
                  </p>
                </div>

                <p className="text-xs text-[#B0B8C4] pt-2 border-t border-[#2A3548]">
                  This index is a transparent, best-effort tool — not a financial
                  indicator. We show exactly what we measure, how we measure it,
                  and what we cannot see. Use it to follow trends, not to make
                  absolute judgments.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
