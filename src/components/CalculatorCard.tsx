"use client";

import { useState } from "react";
import Card from "./Card";

const YEARLY_RATE = 0.05; // 5% placeholder APY

export default function CalculatorCard() {
  const [amount, setAmount] = useState("");

  const tfuel = parseFloat(amount) || 0;
  const yearly = tfuel * YEARLY_RATE;
  const monthly = yearly / 12;

  return (
    <Card className="max-w-md">
      <p className="text-sm text-theta-muted mb-4">Staking Reward Estimator</p>

      <label className="block text-sm text-theta-muted mb-1">
        TFUEL Amount
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 10000"
        className="w-full bg-theta-dark border border-theta-border rounded-lg px-4 py-2.5 text-white placeholder:text-theta-muted/50 focus:outline-none focus:ring-2 focus:ring-theta-teal/40 mb-6"
      />

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-theta-muted">APY (placeholder)</span>
          <span className="text-sm text-white">{(YEARLY_RATE * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-theta-muted">Est. monthly reward</span>
          <span className="text-sm text-white">
            {monthly.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
          </span>
        </div>
        <div className="flex justify-between border-t border-theta-border pt-3">
          <span className="text-sm text-theta-muted">Est. yearly reward</span>
          <span className="text-sm font-semibold text-theta-teal">
            {yearly.toLocaleString(undefined, { maximumFractionDigits: 2 })} TFUEL
          </span>
        </div>
      </div>

      <p className="text-xs text-theta-muted/60 mt-4">
        * This is a simplified estimate. Actual rewards depend on network conditions.
      </p>
    </Card>
  );
}
