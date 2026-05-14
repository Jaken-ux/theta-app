"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TFUEL_REWARD_PER_BLOCK = 38;
const BLOCKS_PER_YEAR = 5_256_000;

// Theta Labs verified figures (Source: Theta Labs Q&A, April 2024)
// Booster APY on locked TFUEL is a fixed 14–28% range — low end at
// low EdgeCloud utilization, high end at full utilization. The lock
// period influences WHERE in that range you land, but we don't know
// the exact formula Theta Labs uses internally. So we always show
// the full 14–28% range and let the helper text communicate the
// lock-period tendency in words ("likely toward the lower end" /
// "typically mid-range" / "likely toward the upper end"). +3% APY
// applies separately on the base 500K staked TFUEL for any Booster
// node, regardless of how much is locked or for how long.
const BOOSTER_LOW_APY = 0.14;
const BOOSTER_HIGH_APY = 0.28;
const BOOSTER_BASE_BONUS_APY = 0.03;

const LOCK_OPTIONS = [
  {
    months: 3,
    label: "3 months",
    helperText:
      "Shorter lock — yield likely toward the lower end of the 14–28% range.",
  },
  {
    months: 6,
    label: "6 months",
    helperText: "Mid-length lock — yield typically mid-range.",
  },
  {
    months: 12,
    label: "12 months",
    helperText:
      "Maximum lock — yield typically toward the upper end of the 14–28% range.",
  },
] as const;

interface Props {
  tfuelPrice: number;
  tfuelStaked: number;
}

function fmtTfuel(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function fmtUsd(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function EliteEdgeCalculator({ tfuelPrice, tfuelStaked }: Props) {
  const [open, setOpen] = useState(false);
  const [staked, setStaked] = useState("");
  const [locked, setLocked] = useState("");
  const [lockIdx, setLockIdx] = useState(0);

  const stakedAmt = parseFloat(staked) || 0;
  const lockedAmt = parseFloat(locked) || 0;
  const belowMin = stakedAmt > 0 && stakedAmt < 500_000;
  const lockedCapped = Math.min(lockedAmt, stakedAmt);
  const hasBooster = lockedCapped > 0;
  const showResults = stakedAmt >= 500_000;

  // ── Base staking rewards (protocol-fixed) ─────────────────────────
  const userShare = tfuelStaked > 0 ? stakedAmt / tfuelStaked : 0;
  const baseYearly = userShare * TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR;
  const baseMonthly = baseYearly / 12;
  const baseApy = tfuelStaked > 0
    ? ((TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR) / tfuelStaked) * 100
    : 0;

  // ── Booster base bonus: +3% APY on the 500K staked TFUEL ─────────
  const boosterBonusYearly = 500_000 * BOOSTER_BASE_BONUS_APY;
  const boosterBonusMonthly = boosterBonusYearly / 12;

  // ── Booster rewards on locked TFUEL (shown as range) ──────────────
  // Always the full published 14–28% range. Lock period influences
  // where in the range the actual yield lands, but that's described
  // in words (lock.helperText) — not by narrowing the displayed range.
  const lock = LOCK_OPTIONS[lockIdx];
  const lowApy = BOOSTER_LOW_APY * 100;
  const highApy = BOOSTER_HIGH_APY * 100;

  const boosterLowYearly = lockedCapped * BOOSTER_LOW_APY;
  const boosterHighYearly = lockedCapped * BOOSTER_HIGH_APY;
  const boosterLowMonthly = boosterLowYearly / 12;
  const boosterHighMonthly = boosterHighYearly / 12;

  // ── Combined totals ───────────────────────────────────────────────
  const totalBase = baseYearly + (hasBooster ? boosterBonusYearly : 0);
  const totalBaseMonthly = baseMonthly + (hasBooster ? boosterBonusMonthly : 0);
  const totalLowYearly = totalBase + boosterLowYearly;
  const totalHighYearly = totalBase + boosterHighYearly;
  const totalLowMonthly = totalBaseMonthly + boosterLowMonthly;
  const totalHighMonthly = totalBaseMonthly + boosterHighMonthly;

  // ── Effective combined APY on total capital ──────────────────────
  // Base staking APY is computed on the 500K base; booster APY is
  // computed on the locked amount only. Adding the two percentages
  // directly is wrong — they apply to different capital bases. The
  // honest number is the blended yield on the user's total capital:
  //   blended = (base_rewards + booster_rewards) / (base + locked)
  const totalCapital = stakedAmt + lockedCapped;
  const combinedApyLow =
    totalCapital > 0 ? (totalLowYearly / totalCapital) * 100 : 0;
  const combinedApyHigh =
    totalCapital > 0 ? (totalHighYearly / totalCapital) * 100 : 0;

  return (
    <section className="bg-theta-card border border-theta-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#0D1117]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">
            Elite Edge Node &amp; Booster Calculator
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
            Advanced
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-[#7D8694] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* ── Inputs ─────────────────────────────────── */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-theta-muted mb-1">
                    TFUEL staked (min 500,000)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={staked}
                    onChange={(e) => setStaked(e.target.value)}
                    placeholder="500,000"
                    className="w-full bg-theta-dark border border-theta-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-theta-muted/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/40"
                  />
                  <p className="text-[10px] text-[#7D8694] mt-1">
                    Required to run an Elite Edge Node
                  </p>
                  {belowMin && (
                    <p className="text-[10px] text-[#F59E0B] mt-1">
                      Minimum 500,000 TFUEL
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-theta-muted mb-1">
                    Additional TFUEL locked
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={stakedAmt}
                    value={locked}
                    onChange={(e) => setLocked(e.target.value)}
                    placeholder="0"
                    disabled={stakedAmt < 500_000}
                    className="w-full bg-theta-dark border border-theta-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-theta-muted/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 disabled:opacity-40"
                  />
                  <p className="text-[10px] text-[#7D8694] mt-1">
                    Optional — lock for higher rewards. Max equals your staked amount.
                  </p>
                  {lockedAmt > stakedAmt && stakedAmt > 0 && (
                    <p className="text-[10px] text-[#F59E0B] mt-1">
                      Capped to {fmtTfuel(stakedAmt)} TFUEL (your staked amount)
                    </p>
                  )}
                </div>
              </div>

              {/* Lock period — only shown if booster active */}
              {hasBooster && showResults && (
                <div className="max-w-sm">
                  <p className="text-xs text-theta-muted mb-2">Lock period</p>
                  <div className="flex gap-2">
                    {LOCK_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.months}
                        onClick={() => setLockIdx(i)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                          lockIdx === i
                            ? "bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]"
                            : "bg-theta-dark border-theta-border text-[#7D8694] hover:text-[#B0B8C4]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#7D8694] mt-1.5">
                    Lock period influences where in the 14–28% range your
                    actual yield lands. See note under Booster rewards.
                  </p>
                </div>
              )}

              {/* ── Results ────────────────────────────────── */}
              {showResults && (
                <div className={`grid gap-4 ${hasBooster ? "sm:grid-cols-3" : "sm:grid-cols-1 max-w-sm"}`}>
                  {/* Card 1 — Base staking + Booster bonus */}
                  <div className="bg-[#0D1117] rounded-xl p-4 border border-theta-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <p className="text-xs font-medium text-[#10B981]">Base staking</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-theta-muted">Monthly</span>
                        <div className="text-right">
                          <span className="text-xs text-white">
                            {fmtTfuel(hasBooster ? totalBaseMonthly : baseMonthly)} TFUEL
                          </span>
                          <span className="text-[10px] text-[#7D8694] ml-1.5">
                            {fmtUsd((hasBooster ? totalBaseMonthly : baseMonthly) * tfuelPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-theta-border pt-2">
                        <span className="text-xs text-theta-muted">Annual</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-[#10B981]">
                            {fmtTfuel(hasBooster ? totalBase : baseYearly)} TFUEL
                          </span>
                          <span className="text-[10px] text-[#7D8694] ml-1.5">
                            {fmtUsd((hasBooster ? totalBase : baseYearly) * tfuelPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                      <p className="text-lg font-semibold text-white tabular-nums">
                        {baseApy.toFixed(1)}%
                        {hasBooster && (
                          <span className="text-[#10B981] text-sm ml-1">+3%</span>
                        )}
                        <span className="text-xs font-normal text-[#7D8694] ml-1">APY</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-[#7D8694] mt-2">
                      {hasBooster
                        ? "Protocol rewards + Booster bonus on 500K stake"
                        : "Guaranteed by protocol"}
                    </p>
                  </div>

                  {/* Card 2 — Booster rewards on locked TFUEL (range) */}
                  {hasBooster && (
                    <div className="bg-[#0D1117] rounded-xl p-4 border border-theta-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                        <p className="text-xs font-medium text-[#8B5CF6]">Booster rewards</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-theta-muted">Monthly</span>
                          <div className="text-right">
                            <span className="text-xs text-white">
                              {fmtTfuel(boosterLowMonthly)} – {fmtTfuel(boosterHighMonthly)} TFUEL
                            </span>
                            <span className="text-[10px] text-[#7D8694] ml-1.5">
                              {fmtUsd(boosterLowMonthly * tfuelPrice)} – {fmtUsd(boosterHighMonthly * tfuelPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-theta-border pt-2">
                          <span className="text-xs text-theta-muted">Annual</span>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-[#8B5CF6]">
                              {fmtTfuel(boosterLowYearly)} – {fmtTfuel(boosterHighYearly)} TFUEL
                            </span>
                            <span className="text-[10px] text-[#7D8694] ml-1.5">
                              {fmtUsd(boosterLowYearly * tfuelPrice)} – {fmtUsd(boosterHighYearly * tfuelPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                        <p className="text-lg font-semibold text-white tabular-nums">
                          {lowApy.toFixed(0)}–{highApy.toFixed(0)}%
                          <span className="text-xs font-normal text-[#7D8694] ml-1">APY</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7D8694] mt-2 leading-relaxed">
                        {lock.helperText}
                      </p>
                    </div>
                  )}

                  {/* Card 3 — Combined total (range) */}
                  {hasBooster && (
                    <div className="bg-[#0D1117] rounded-xl p-4 border border-[#2AB8E6]/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#2AB8E6]" />
                        <p className="text-xs font-medium text-[#2AB8E6]">Combined total</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-theta-muted">Monthly</span>
                          <div className="text-right">
                            <span className="text-xs text-white">
                              {fmtTfuel(totalLowMonthly)} – {fmtTfuel(totalHighMonthly)}
                            </span>
                            <span className="text-[10px] text-[#7D8694] ml-1">TFUEL</span>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-theta-border pt-2">
                          <span className="text-xs text-theta-muted">Annual</span>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-[#2AB8E6]">
                              {fmtTfuel(totalLowYearly)} – {fmtTfuel(totalHighYearly)}
                            </span>
                            <span className="text-[10px] text-[#7D8694] ml-1">TFUEL</span>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-theta-border pt-2">
                          <span className="text-xs text-theta-muted">In USD</span>
                          <span className="text-xs text-white">
                            {fmtUsd(totalLowYearly * tfuelPrice)} – {fmtUsd(totalHighYearly * tfuelPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                        <p className="text-lg font-semibold text-white tabular-nums">
                          {combinedApyLow.toFixed(1)}–{combinedApyHigh.toFixed(1)}%
                          <span className="text-xs font-normal text-[#7D8694] ml-1">
                            effective combined APY
                          </span>
                        </p>
                        <p className="text-[10px] text-[#7D8694] mt-1">
                          on your total capital ({fmtTfuel(totalCapital)} TFUEL)
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7D8694] mt-2 leading-relaxed">
                        Base staking APY applies to your 500K staked. Booster APY
                        applies only to locked TFUEL beyond the 500K base. Combined
                        APY blends both against your total capital.
                      </p>
                      <p className="text-[10px] text-[#7D8694] mt-2">
                        {fmtUsd(totalLowYearly * tfuelPrice)} – {fmtUsd(totalHighYearly * tfuelPrice)}/yr at current TFUEL price
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              {showResults && (
                <p className="text-[10px] text-[#5C6675] leading-relaxed">
                  Base staking rewards (~{baseApy.toFixed(0)}% APY) are fixed by the Theta
                  protocol. Booster APY is a 14–28% range published by Theta Labs. Lock
                  period influences where in that range your yield lands, but not the
                  range itself. The +3% bonus on staked TFUEL applies to Booster nodes
                  only. Actual rewards may vary from published ranges based on EdgeCloud
                  utilization, total locked TFUEL across all Booster nodes, and other
                  network conditions set by Theta Labs. Figures shown are Theta Labs&apos;
                  stated range, not a guarantee. Not financial advice. Source: Theta
                  Labs Q&amp;A, April 2024. Verify current rates at{" "}
                  <a
                    href="https://www.thetatoken.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2AB8E6] hover:underline"
                  >
                    thetatoken.org
                  </a>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
