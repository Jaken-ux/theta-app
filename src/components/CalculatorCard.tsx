"use client";

import { useState } from "react";

const THETA_REWARD_PER_BLOCK = 48 * 0.529;
const TFUEL_REWARD_PER_BLOCK = 38;
const BLOCKS_PER_YEAR = 5_256_000;

type Currency = "usd" | "eur";

interface StakingData {
  thetaStaked: number;
  tfuelStaked: number;
  tfuelPrice: number;
  thetaPrice: number;
}

function calculateRewards(
  type: "theta" | "tfuel",
  staked: number,
  data: StakingData
) {
  const rewardPerBlock = type === "theta" ? THETA_REWARD_PER_BLOCK : TFUEL_REWARD_PER_BLOCK;
  const totalStaked = type === "theta" ? data.thetaStaked : data.tfuelStaked;
  const userShare = totalStaked > 0 ? staked / totalStaked : 0;

  const yearlyTfuel = userShare * rewardPerBlock * BLOCKS_PER_YEAR;
  const monthlyTfuel = yearlyTfuel / 12;
  const dailyTfuel = yearlyTfuel / 365;

  let apy: number;
  if (type === "theta") {
    const yearlyRewards = THETA_REWARD_PER_BLOCK * BLOCKS_PER_YEAR;
    const tfuelPerTheta = yearlyRewards / data.thetaStaked;
    apy = ((tfuelPerTheta * data.tfuelPrice) / data.thetaPrice) * 100;
  } else {
    apy = ((TFUEL_REWARD_PER_BLOCK * BLOCKS_PER_YEAR) / data.tfuelStaked) * 100;
  }

  return { apy, yearlyTfuel, monthlyTfuel, dailyTfuel };
}

function fmtCurrency(value: number, currency: Currency, eurRate: number): string {
  const symbol = currency === "eur" ? "€" : "$";
  const converted = currency === "eur" ? value * eurRate : value;
  return `${symbol}${converted.toFixed(2)}`;
}

function SingleCalculator({
  type,
  stakingData,
  currency,
  eurRate,
}: {
  type: "theta" | "tfuel";
  stakingData: StakingData;
  currency: Currency;
  eurRate: number;
}) {
  const [amount, setAmount] = useState("");
  const staked = parseFloat(amount) || 0;
  const minStake = type === "theta" ? 1_000 : 10_000;
  const belowMin = staked > 0 && staked < minStake;
  const { apy, yearlyTfuel, monthlyTfuel, dailyTfuel } = calculateRewards(type, staked, stakingData);

  const yearlyUsd = yearlyTfuel * stakingData.tfuelPrice;
  const monthlyUsd = monthlyTfuel * stakingData.tfuelPrice;
  const dailyUsd = dailyTfuel * stakingData.tfuelPrice;

  const color = type === "theta" ? "#2AB8E6" : "#10B981";
  const label = type === "theta" ? "THETA" : "TFUEL";
  const nodeType = type === "theta" ? "Guardian Node" : "Elite Edge Node";
  const totalStakedFmt = type === "theta"
    ? `${(stakingData.thetaStaked / 1_000_000).toFixed(1)}M`
    : `${(stakingData.tfuelStaked / 1_000_000).toFixed(0)}M`;

  return (
    <div className="bg-theta-card border border-theta-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-sm font-medium" style={{ color }}>{nodeType}</p>
      </div>

      <label className="block text-xs text-theta-muted mb-1">
        {label} Amount
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`min ${minStake.toLocaleString()}`}
        className="w-full bg-theta-dark border border-theta-border rounded-lg px-3 py-2 text-white text-sm placeholder:text-theta-muted/50 focus:outline-none focus:ring-2 mb-2"
        style={{ "--tw-ring-color": `${color}40` } as React.CSSProperties}
      />
      {belowMin && (
        <p className="text-[10px] text-[#F59E0B] mb-3">
          Minimum {minStake.toLocaleString()} {label}
        </p>
      )}
      {!belowMin && <div className="mb-3" />}

      <div className="bg-[#0D1117] rounded-lg p-3 mb-4">
        <p className="text-[10px] text-[#B0B8C4]">Estimated APY</p>
        <p className="text-xl font-semibold text-white">{apy.toFixed(2)}%</p>
        <p className="text-[10px] text-[#7D8694]">
          {totalStakedFmt} {label} staked network-wide
        </p>
      </div>

      {staked >= minStake && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-theta-muted">Daily</span>
            <div className="text-right">
              <span className="text-xs text-white">
                {dailyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-[10px] text-[#7D8694] ml-1.5">
                {fmtCurrency(dailyUsd, currency, eurRate)}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-theta-muted">Monthly</span>
            <div className="text-right">
              <span className="text-xs text-white">
                {monthlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-[10px] text-[#7D8694] ml-1.5">
                {fmtCurrency(monthlyUsd, currency, eurRate)}
              </span>
            </div>
          </div>
          <div className="flex justify-between border-t border-theta-border pt-2">
            <span className="text-xs text-theta-muted">Yearly</span>
            <div className="text-right">
              <span className="text-xs font-semibold" style={{ color }}>
                {yearlyTfuel.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
              </span>
              <span className="text-[10px] text-[#7D8694] ml-1.5">
                {fmtCurrency(yearlyUsd, currency, eurRate)}
              </span>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-theta-muted/50 mt-3 leading-relaxed">
        {type === "theta"
          ? "Shares 48 TFUEL/block (~6 sec). Rewards paid in TFUEL."
          : "Shares 38 TFUEL/block (~6 sec). Rewards paid in TFUEL."}
      </p>
    </div>
  );
}

export default function CalculatorCard({
  stakingData,
  eurRate,
}: {
  stakingData: StakingData;
  eurRate: number;
}) {
  const [currency, setCurrency] = useState<Currency>("usd");

  return (
    <div>
      {/* Currency toggle */}
      <div className="flex justify-end mb-3">
        <div className="flex bg-[#0D1117] rounded-lg p-0.5 border border-theta-border">
          <button
            onClick={() => setCurrency("usd")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              currency === "usd"
                ? "bg-theta-card text-white"
                : "text-[#7D8694] hover:text-[#B0B8C4]"
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setCurrency("eur")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              currency === "eur"
                ? "bg-theta-card text-white"
                : "text-[#7D8694] hover:text-[#B0B8C4]"
            }`}
          >
            EUR
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <SingleCalculator type="theta" stakingData={stakingData} currency={currency} eurRate={eurRate} />
        <SingleCalculator type="tfuel" stakingData={stakingData} currency={currency} eurRate={eurRate} />
      </div>
    </div>
  );
}
