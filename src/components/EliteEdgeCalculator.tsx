"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TFUEL_REWARD_PER_BLOCK = 38;
const BLOCKS_PER_YEAR = 5_256_000;

// Booster base APY at 100% EdgeCloud utilization, 3-month lock.
// Multiplied by lock multiplier and utilization fraction.
const BOOSTER_BASE_APY = 0.20;
const LOCK_OPTIONS = [
  { months: 3, label: "3 months", multiplier: 1.0 },
  { months: 6, label: "6 months", multiplier: 1.25 },
  { months: 12, label: "12 months", multiplier: 1.5 },
] as const;
const UTIL_OPTIONS = [
  { label: "Low", pct: 0.4, description: "40% — conservative estimate" },
  { label: "Medium", pct: 0.7, description: "70% — moderate load" },
  { label: "High", pct: 0.9, description: "90% — near capacity" },
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
  const [utilIdx, setUtilIdx] = useState(1);

  const stakedAmt = parseFloat(staked) || 0;
  const lockedAmt = parseFloat(locked) || 0;
  const belowMin = stakedAmt > 0 && stakedAmt < 500_000;
  const lockedCapped = Math.min(lockedAmt, stakedAmt);
  const hasBooster = lockedCapped > 0;
  const showResults = stakedAmt >= 500_000;

  // Base staking rewards (protocol-fixed)
  const userShare = tfuelStaked > 0 ? stakedAmt / tfuelStaked : 0;
  const baseYearly = userShare * TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR;
  const baseMonthly = baseYearly / 12;
  const baseApy = tfuelStaked > 0
    ? ((TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR) / tfuelStaked) * 100
    : 0;

  // Booster rewards (variable)
  const lock = LOCK_OPTIONS[lockIdx];
  const util = UTIL_OPTIONS[utilIdx];
  const boosterApy = BOOSTER_BASE_APY * lock.multiplier * util.pct * 100;
  const boosterYearly = lockedCapped * (boosterApy / 100);
  const boosterMonthly = boosterYearly / 12;

  // Combined
  const totalMonthly = baseMonthly + boosterMonthly;
  const totalYearly = baseYearly + boosterYearly;

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
                {/* TFUEL staked */}
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

                {/* TFUEL locked */}
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

              {/* Lock period + utilization — only shown if booster active */}
              {hasBooster && showResults && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Lock period */}
                  <div>
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
                      Longer lock = higher multiplier (6mo +25%, 12mo +50% vs 3mo)
                    </p>
                  </div>

                  {/* EdgeCloud utilization */}
                  <div>
                    <p className="text-xs text-theta-muted mb-2">EdgeCloud utilization</p>
                    <div className="flex gap-2">
                      {UTIL_OPTIONS.map((opt, i) => (
                        <button
                          key={opt.label}
                          onClick={() => setUtilIdx(i)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                            utilIdx === i
                              ? "bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]"
                              : "bg-theta-dark border-theta-border text-[#7D8694] hover:text-[#B0B8C4]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#7D8694] mt-1.5">
                      How busy EdgeCloud GPUs are. Affects Booster rewards only.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Results ────────────────────────────────── */}
              {showResults && (
                <div className={`grid gap-4 ${hasBooster ? "sm:grid-cols-3" : "sm:grid-cols-1 max-w-sm"}`}>
                  {/* Card 1 — Base staking */}
                  <div className="bg-[#0D1117] rounded-xl p-4 border border-theta-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <p className="text-xs font-medium text-[#10B981]">Base staking</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-theta-muted">Monthly</span>
                        <span className="text-xs text-white">{fmtTfuel(baseMonthly)} TFUEL</span>
                      </div>
                      <div className="flex justify-between border-t border-theta-border pt-2">
                        <span className="text-xs text-theta-muted">Annual</span>
                        <span className="text-xs font-semibold text-[#10B981]">{fmtTfuel(baseYearly)} TFUEL</span>
                      </div>
                    </div>
                    <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                      <p className="text-lg font-semibold text-white tabular-nums">{baseApy.toFixed(1)}% <span className="text-xs font-normal text-[#7D8694]">APY</span></p>
                    </div>
                    <p className="text-[10px] text-[#7D8694] mt-2">Guaranteed by protocol</p>
                  </div>

                  {/* Card 2 — Booster rewards (only if locked > 0) */}
                  {hasBooster && (
                    <div className="bg-[#0D1117] rounded-xl p-4 border border-theta-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                        <p className="text-xs font-medium text-[#8B5CF6]">Booster rewards</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-theta-muted">Monthly</span>
                          <span className="text-xs text-white">{fmtTfuel(boosterMonthly)} TFUEL</span>
                        </div>
                        <div className="flex justify-between border-t border-theta-border pt-2">
                          <span className="text-xs text-theta-muted">Annual</span>
                          <span className="text-xs font-semibold text-[#8B5CF6]">{fmtTfuel(boosterYearly)} TFUEL</span>
                        </div>
                      </div>
                      <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                        <p className="text-lg font-semibold text-white tabular-nums">{boosterApy.toFixed(1)}% <span className="text-xs font-normal text-[#7D8694]">APY</span></p>
                      </div>
                      <p className="text-[10px] text-[#7D8694] mt-2">
                        {lock.label} lock · {util.label} utilization ({(util.pct * 100).toFixed(0)}%)
                      </p>
                    </div>
                  )}

                  {/* Card 3 — Combined total (only if booster active) */}
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
                            <span className="text-xs text-white">{fmtTfuel(totalMonthly)} TFUEL</span>
                            <span className="text-[10px] text-[#7D8694] ml-1.5">{fmtUsd(totalMonthly * tfuelPrice)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-theta-border pt-2">
                          <span className="text-xs text-theta-muted">Annual</span>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-[#2AB8E6]">{fmtTfuel(totalYearly)} TFUEL</span>
                            <span className="text-[10px] text-[#7D8694] ml-1.5">{fmtUsd(totalYearly * tfuelPrice)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#0A0F1C] rounded-lg p-2 mt-3">
                        <p className="text-lg font-semibold text-white tabular-nums">
                          {(baseApy + boosterApy).toFixed(1)}% <span className="text-xs font-normal text-[#7D8694]">combined APY</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7D8694] mt-2">
                        {fmtUsd(totalYearly * tfuelPrice)}/yr at current TFUEL price
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              {showResults && (
                <p className="text-[10px] text-[#5C6675] leading-relaxed">
                  Base staking rewards (~{baseApy.toFixed(0)}% APY) are fixed by the Theta
                  protocol. Booster rewards depend on actual EdgeCloud utilization and job
                  availability — the figures above assume your Edge Node is online 24/7 and
                  EdgeCloud operates at your selected utilization level. Not financial advice.
                  Verify current rates at{" "}
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
