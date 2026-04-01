"use client";

import { useState } from "react";
import Card from "./Card";

// Protocol constants — set at Theta Mainnet 3.0 level
// Raw rewards are 48/38 TFUEL per block, but only ~53% of stakers
// participate in each checkpoint vote. Effective rate matches
// observed payouts (cross-checked with Thetaboard).
const THETA_REWARD_PER_BLOCK = 48 * 0.529; // ~25.4 effective TFUEL/block
const TFUEL_REWARD_PER_BLOCK = 38 * 0.529; // ~20.1 effective TFUEL/block
const BLOCKS_PER_YEAR = 5_256_000; // ~6 second block time

interface StakingData {
  thetaStaked: number;
  tfuelStaked: number;
  tfuelPrice: number;
  thetaPrice: number;
}

function calculateApy(
  type: "theta" | "tfuel",
  data: StakingData
): number {
  if (type === "theta") {
    const yearlyRewards = THETA_REWARD_PER_BLOCK * BLOCKS_PER_YEAR;
    // APY in TFUEL terms relative to THETA staked, converted via price ratio
    const tfuelPerTheta = yearlyRewards / data.thetaStaked;
    const apyInTheta = (tfuelPerTheta * data.tfuelPrice) / data.thetaPrice;
    return apyInTheta * 100;
  } else {
    const yearlyRewards = TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR;
    return (yearlyRewards / data.tfuelStaked) * 100;
  }
}

export default function CalculatorCard({ stakingData }: { stakingData: StakingData }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"theta" | "tfuel">("tfuel");

  const staked = parseFloat(amount) || 0;
  const apy = calculateApy(type, stakingData);

  const minStake = type === "theta" ? 1_000 : 10_000;
  const belowMin = staked > 0 && staked < minStake;

  // Rewards are always in TFUEL
  const rewardPerBlock = type === "theta" ? THETA_REWARD_PER_BLOCK : TFUEL_REWARD_PER_BLOCK;
  const totalStaked = type === "theta" ? stakingData.thetaStaked : stakingData.tfuelStaked;

  // User's share of the pool
  let userShare = 0;
  if (type === "tfuel" && totalStaked > 0) {
    userShare = staked / totalStaked;
  } else if (type === "theta" && totalStaked > 0) {
    userShare = staked / totalStaked;
  }

  const yearlyTfuel = userShare * rewardPerBlock * BLOCKS_PER_YEAR;
  const monthlyTfuel = yearlyTfuel / 12;
  const dailyTfuel = yearlyTfuel / 365;

  const yearlyUsd = yearlyTfuel * stakingData.tfuelPrice;
  const monthlyUsd = monthlyTfuel * stakingData.tfuelPrice;
  const dailyUsd = dailyTfuel * stakingData.tfuelPrice;

  return (
    <Card className="max-w-lg">
      <p className="text-sm text-theta-muted mb-4">Staking Reward Calculator</p>

      {/* Token type selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setType("tfuel"); setAmount(""); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            type === "tfuel"
              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
              : "bg-[#2A3548] text-[#B0B8C4] border border-[#2A3548] hover:border-[#445064]"
          }`}
        >
          TFUEL Staking
        </button>
        <button
          onClick={() => { setType("theta"); setAmount(""); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            type === "theta"
              ? "bg-[#2AB8E6]/15 text-[#2AB8E6] border border-[#2AB8E6]/30"
              : "bg-[#2A3548] text-[#B0B8C4] border border-[#2A3548] hover:border-[#445064]"
          }`}
        >
          THETA Staking
        </button>
      </div>

      {/* Amount input */}
      <label className="block text-sm text-theta-muted mb-1">
        {type === "theta" ? "THETA" : "TFUEL"} Amount
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`min ${minStake.toLocaleString()}`}
        className="w-full bg-theta-dark border border-theta-border rounded-lg px-4 py-2.5 text-white placeholder:text-theta-muted/50 focus:outline-none focus:ring-2 focus:ring-theta-teal/40 mb-2"
      />
      {belowMin && (
        <p className="text-xs text-[#F59E0B] mb-4">
          Minimum stake is {minStake.toLocaleString()} {type.toUpperCase()}
          {type === "theta" ? " (Guardian Node)" : " (Elite Edge Node)"}
        </p>
      )}
      {!belowMin && <div className="mb-4" />}

      {/* Live APY */}
      <div className="bg-[#0D1117] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-[#B0B8C4]">Current Estimated APY</p>
            <p className="text-2xl font-semibold text-white">{apy.toFixed(2)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#B0B8C4]">Based on live network data</p>
            <p className="text-[10px] text-[#B0B8C4]">
              {type === "theta"
                ? `${(stakingData.thetaStaked / 1_000_000).toFixed(1)}M THETA staked`
                : `${(stakingData.tfuelStaked / 1_000_000).toFixed(0)}M TFUEL staked`}
            </p>
          </div>
        </div>
      </div>

      {/* Reward estimates */}
      {staked >= minStake && (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-theta-muted">Est. daily reward</span>
            <div className="text-right">
              <span className="text-sm text-white">
                {dailyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-xs text-[#B0B8C4] ml-2">
                (${dailyUsd.toFixed(2)})
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-theta-muted">Est. monthly reward</span>
            <div className="text-right">
              <span className="text-sm text-white">
                {monthlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-xs text-[#B0B8C4] ml-2">
                (${monthlyUsd.toFixed(2)})
              </span>
            </div>
          </div>
          <div className="flex justify-between border-t border-theta-border pt-3">
            <span className="text-sm text-theta-muted">Est. yearly reward</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-theta-teal">
                {yearlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-xs text-[#B0B8C4] ml-2">
                (${yearlyUsd.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-4 pt-4 border-t border-theta-border">
        <p className="text-xs text-theta-muted/60 leading-relaxed">
          {type === "theta"
            ? "THETA stakers (Guardian Nodes) share 48 TFUEL per block (~every 6 sec). Rewards are paid in TFUEL, proportional to your share of total THETA staked."
            : "TFUEL stakers (Elite Edge Nodes) share 38 TFUEL per block (~every 6 sec). Rewards are proportional to your share of total TFUEL staked."}
        </p>
        <p className="text-xs text-theta-muted/60 mt-1">
          APY changes as total staked amounts change. Current values from explorer-api.thetatoken.org.
        </p>
      </div>
    </Card>
  );
}
