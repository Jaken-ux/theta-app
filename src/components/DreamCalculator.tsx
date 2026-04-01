"use client";

import { useState } from "react";

// Same effective constants as the real calculator
const THETA_REWARD_PER_BLOCK = 48 * 0.529;
const TFUEL_REWARD_PER_BLOCK = 38 * 0.529;
const BLOCKS_PER_YEAR = 5_256_000;

interface StakingData {
  thetaStaked: number;
  tfuelStaked: number;
  tfuelPrice: number;
  thetaPrice: number;
}

interface Milestone {
  name: string;
  tfuelPrice: number;
  description: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  {
    name: "Today",
    tfuelPrice: 0, // filled dynamically
    description: "Current network state",
    color: "#9CA3AF",
  },
  {
    name: "Early traction",
    tfuelPrice: 0.05,
    description: "Consistent dApp usage begins, TFUEL burn becomes noticeable",
    color: "#F59E0B",
  },
  {
    name: "Growing ecosystem",
    tfuelPrice: 0.15,
    description: "Multiple applications live, EdgeCloud adoption rising",
    color: "#2AB8E6",
  },
  {
    name: "Mass adoption",
    tfuelPrice: 0.50,
    description: "TFUEL burn exceeds inflation, supply shrinking",
    color: "#10B981",
  },
  {
    name: "Major infrastructure",
    tfuelPrice: 1.00,
    description: "Theta is a top-tier network for video + AI compute",
    color: "#8B5CF6",
  },
];

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

export default function DreamCalculator({ stakingData }: { stakingData: StakingData }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"theta" | "tfuel">("theta");

  const staked = parseFloat(amount) || 0;
  const minStake = type === "theta" ? 1_000 : 10_000;

  // Calculate investment cost at current prices
  const currentTokenPrice = type === "theta" ? stakingData.thetaPrice : stakingData.tfuelPrice;
  const investmentUsd = staked * currentTokenPrice;

  // Set "Today" milestone price dynamically
  const milestones = MILESTONES.map((m, i) =>
    i === 0 ? { ...m, tfuelPrice: stakingData.tfuelPrice } : m
  );

  // Calculate yearly TFUEL reward
  const rewardPerBlock = type === "theta" ? THETA_REWARD_PER_BLOCK : TFUEL_REWARD_PER_BLOCK;
  const totalStaked = type === "theta" ? stakingData.thetaStaked : stakingData.tfuelStaked;
  const userShare = totalStaked > 0 ? staked / totalStaked : 0;
  const yearlyTfuel = userShare * rewardPerBlock * BLOCKS_PER_YEAR;
  const monthlyTfuel = yearlyTfuel / 12;

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          What if?
        </h3>
        <p className="text-sm text-[#9CA3AF]">
          Nobody knows the future. But you can explore what different outcomes
          would mean for you — if you were already positioned.
        </p>
      </div>

      {/* Type selector + input */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setType("theta"); setAmount(""); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            type === "theta"
              ? "bg-[#2AB8E6]/15 text-[#2AB8E6] border border-[#2AB8E6]/30"
              : "bg-[#1F2937] text-[#9CA3AF] border border-[#1F2937] hover:border-[#374151]"
          }`}
        >
          THETA
        </button>
        <button
          onClick={() => { setType("tfuel"); setAmount(""); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            type === "tfuel"
              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
              : "bg-[#1F2937] text-[#9CA3AF] border border-[#1F2937] hover:border-[#374151]"
          }`}
        >
          TFUEL
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-[#9CA3AF] mb-1">
          How much {type.toUpperCase()} would you stake?
        </label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`min ${minStake.toLocaleString()}`}
          className="w-full bg-[#0D1117] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white placeholder:text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40"
        />
        {staked > 0 && (
          <p className="text-xs text-[#9CA3AF] mt-1">
            That costs ~{fmtUsd(investmentUsd)} at today&apos;s price (${currentTokenPrice.toFixed(4)})
          </p>
        )}
      </div>

      {/* Milestone table */}
      {staked >= minStake && (
        <>
          <div className="space-y-3">
            {milestones.map((m, i) => {
              const yearlyUsd = yearlyTfuel * m.tfuelPrice;
              const monthlyUsd = monthlyTfuel * m.tfuelPrice;

              // Portfolio value: TFUEL rewards value + staked token value
              // For THETA stakers, token value doesn't change with TFUEL price
              // so we just show the passive income angle
              const isToday = i === 0;

              return (
                <div
                  key={m.name}
                  className={`rounded-xl p-4 ${
                    isToday
                      ? "bg-[#0D1117] border border-[#1F2937]"
                      : "bg-[#0D1117]/60 border border-[#1F2937]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: m.color }}
                    >
                      {m.name}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      TFUEL @ ${m.tfuelPrice.toFixed(m.tfuelPrice < 0.01 ? 4 : 2)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F2937] text-[#9CA3AF] ml-auto">
                        now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-3">{m.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6B7280] uppercase">Monthly passive income</p>
                      <p className="text-base font-semibold text-white">
                        {fmtUsd(monthlyUsd)}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">
                        {monthlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 0 })} TFUEL
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] uppercase">Yearly passive income</p>
                      <p className="text-base font-semibold text-white">
                        {fmtUsd(yearlyUsd)}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">
                        {yearlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 0 })} TFUEL
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The point */}
          <div className="mt-6 bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
            <p className="text-sm text-[#2AB8E6] font-medium mb-2">
              The TFUEL you earn today doesn&apos;t disappear
            </p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Every day you stake, you accumulate TFUEL. If the network grows and
              TFUEL becomes more valuable, all the tokens you earned along the way
              grow in value too — not just today&apos;s rewards, but every reward you
              ever received. Positioning early means accumulating at low prices.
            </p>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-[#1F2937]">
        <p className="text-[10px] text-[#6B7280] leading-relaxed">
          These scenarios are entirely hypothetical. Nothing here is financial
          advice, a promise, or a prediction. Token prices can go to zero.
          Past performance of any asset does not predict future results.
          The milestone prices above are fictional illustrations — they are not
          targets, forecasts, or expectations. Always do your own research and
          never invest more than you can afford to lose.
        </p>
      </div>
    </div>
  );
}
