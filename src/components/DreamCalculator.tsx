"use client";

import { useState } from "react";

const THETA_REWARD_PER_BLOCK = 48 * 0.529;
const TFUEL_REWARD_PER_BLOCK = 38;
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
    color: "#B0B8C4",
  },
  {
    name: "TFUEL at $0.05",
    tfuelPrice: 0.05,
    description: "Hypothetical scenario",
    color: "#F59E0B",
  },
  {
    name: "TFUEL at $0.15",
    tfuelPrice: 0.15,
    description: "Hypothetical scenario",
    color: "#2AB8E6",
  },
  {
    name: "TFUEL at $0.50",
    tfuelPrice: 0.50,
    description: "Hypothetical scenario — TFUEL has traded above this level before",
    color: "#10B981",
  },
  {
    name: "TFUEL at $1.00",
    tfuelPrice: 1.00,
    description: "Hypothetical scenario",
    color: "#8B5CF6",
  },
];

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DreamCalculator({ stakingData }: { stakingData: StakingData }) {
  const [investmentStr, setInvestmentStr] = useState("");
  const [type, setType] = useState<"theta" | "tfuel">("theta");

  const investmentUsd = parseFloat(investmentStr) || 0;
  const tokenPrice = type === "theta" ? stakingData.thetaPrice : stakingData.tfuelPrice;
  const tokensYouGet = tokenPrice > 0 ? investmentUsd / tokenPrice : 0;
  const minStake = type === "theta" ? 1_000 : 10_000;
  const minInvestment = minStake * tokenPrice;
  const belowMin = investmentUsd > 0 && tokensYouGet < minStake;

  const milestones = MILESTONES.map((m, i) =>
    i === 0 ? { ...m, tfuelPrice: stakingData.tfuelPrice } : m
  );

  // Yearly TFUEL reward
  const rewardPerBlock = type === "theta" ? THETA_REWARD_PER_BLOCK : TFUEL_REWARD_PER_BLOCK;
  const totalStaked = type === "theta" ? stakingData.thetaStaked : stakingData.tfuelStaked;
  const userShare = totalStaked > 0 ? tokensYouGet / totalStaked : 0;
  const yearlyTfuel = userShare * rewardPerBlock * BLOCKS_PER_YEAR;
  const monthlyTfuel = yearlyTfuel / 12;

  const canShow = investmentUsd > 0 && tokensYouGet >= minStake;

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          What if?
        </h3>
        <p className="text-sm text-[#B0B8C4]">
          Nobody knows the future. But you can explore what different outcomes
          would mean — if you were already positioned.
        </p>
      </div>

      {/* Dollar input */}
      <div className="mb-4">
        <label className="block text-sm text-[#B0B8C4] mb-1">
          How much would you invest? (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7D8694]">$</span>
          <input
            type="number"
            min="0"
            value={investmentStr}
            onChange={(e) => setInvestmentStr(e.target.value)}
            placeholder="1000"
            className="w-full bg-[#0D1117] border border-[#2A3548] rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-[#5C6675] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40"
          />
        </div>
      </div>

      {/* Type selector */}
      <div className="mb-4">
        <label className="block text-sm text-[#B0B8C4] mb-1">
          What would you stake?
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setType("theta")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === "theta"
                ? "bg-[#2AB8E6]/15 text-[#2AB8E6] border border-[#2AB8E6]/30"
                : "bg-[#2A3548] text-[#B0B8C4] border border-[#2A3548] hover:border-[#445064]"
            }`}
          >
            THETA
          </button>
          <button
            onClick={() => setType("tfuel")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === "tfuel"
                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                : "bg-[#2A3548] text-[#B0B8C4] border border-[#2A3548] hover:border-[#445064]"
            }`}
          >
            TFUEL
          </button>
        </div>
      </div>

      {/* What you get */}
      {investmentUsd > 0 && (
        <div className="bg-[#0D1117] rounded-xl p-4 mb-6">
          <p className="text-xs text-[#B0B8C4] mb-1">
            At today&apos;s price (${tokenPrice.toFixed(4)}) you would get
          </p>
          <p className="text-2xl font-semibold text-white">
            {fmtTokens(tokensYouGet)} {type.toUpperCase()}
          </p>
          {belowMin && (
            <p className="text-xs text-[#F59E0B] mt-2">
              Minimum stake is {minStake.toLocaleString()} {type.toUpperCase()} (~{fmtUsd(minInvestment)}).
              {type === "theta" ? " Required for a Guardian Node." : " Required for an Elite Edge Node."}
            </p>
          )}
          {canShow && (
            <p className="text-xs text-[#B0B8C4] mt-1">
              All staked — earning {yearlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 0 })} TFUEL/year at current rates
            </p>
          )}
        </div>
      )}

      {/* Milestone scenarios */}
      {canShow && (
        <>
          <p className="text-xs text-[#B0B8C4] mb-3 uppercase tracking-wide font-medium">
            Your yearly passive income if the network reaches...
          </p>

          <div className="space-y-3">
            {milestones.map((m, i) => {
              const yearlyUsd = yearlyTfuel * m.tfuelPrice;
              const monthlyUsd = monthlyTfuel * m.tfuelPrice;
              const isToday = i === 0;

              return (
                <div
                  key={m.name}
                  className={`rounded-xl p-4 ${
                    isToday
                      ? "bg-[#0D1117] border border-[#2A3548]"
                      : "bg-[#0D1117]/60 border border-[#2A3548]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
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
                    <span className="text-xs text-[#7D8694]">
                      TFUEL @ ${m.tfuelPrice.toFixed(m.tfuelPrice < 0.01 ? 4 : 2)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A3548] text-[#B0B8C4] ml-auto">
                        now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#B0B8C4] mb-3">{m.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#7D8694] uppercase">Monthly income</p>
                      <p className="text-lg font-semibold text-white">
                        {fmtUsd(monthlyUsd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7D8694] uppercase">Yearly income</p>
                      <p className="text-lg font-semibold text-white">
                        {fmtUsd(yearlyUsd)}
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
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              Every day you stake, you accumulate TFUEL. If the network grows and
              TFUEL becomes more valuable, all the tokens you earned along the way
              grow in value too — not just today&apos;s rewards, but every reward you
              ever received. Positioning early means accumulating at low prices.
            </p>
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-[#2A3548]">
        <p className="text-[10px] text-[#7D8694] leading-relaxed">
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
