/**
 * TFUEL economics — supply-delta method.
 *
 * Instead of sampling gas fees from individual transactions, we derive
 * total burn from the change in circulating supply:
 *
 *   impliedBurn = dailyIssuance − (supply_today − supply_yesterday)
 *
 * This captures ALL burn sources automatically — on-chain gas, Edge
 * Network payments (25% burn), and any other mechanism — without
 * needing to sample or estimate anything.
 *
 * We show a 7-day rolling average to smooth out timing artifacts
 * (the supply endpoint doesn't update at exact midnight UTC).
 *
 * DAILY ISSUANCE (protocol constant):
 *   14,400 blocks/day × 86 TFUEL/block = 1,238,400 TFUEL/day
 */

const BLOCKS_PER_DAY = Math.floor(86400 / 6); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

export interface DailyBurnEntry {
  date: string;
  supplyChange: number;
  impliedBurn: number;
  burnRate: number; // as fraction of issuance (0–1)
}

export interface TfuelEconomics {
  dailyIssuance: number;
  avgBurn7d: number | null;
  avgBurnRate7d: number | null; // as fraction (0.106 = 10.6%)
  avgNetSupplyGrowth7d: number | null;
  dailyEntries: DailyBurnEntry[];
  daysAvailable: number;
}

/**
 * Compute TFUEL economics from stored supply history.
 * Requires at least 2 days of tfuel_circulating_supply in
 * theta_activity_history to produce results.
 */
export function computeTfuelEconomics(
  supplyHistory: { date: string; supply: number }[]
): TfuelEconomics {
  const base: TfuelEconomics = {
    dailyIssuance: DAILY_ISSUANCE,
    avgBurn7d: null,
    avgBurnRate7d: null,
    avgNetSupplyGrowth7d: null,
    dailyEntries: [],
    daysAvailable: 0,
  };

  if (supplyHistory.length < 2) return base;

  // Sort oldest → newest
  const sorted = [...supplyHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const entries: DailyBurnEntry[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const supplyChange = sorted[i].supply - sorted[i - 1].supply;
    const impliedBurn = DAILY_ISSUANCE - supplyChange;
    const burnRate = impliedBurn / DAILY_ISSUANCE;
    entries.push({
      date: sorted[i].date,
      supplyChange,
      impliedBurn,
      burnRate,
    });
  }

  // Use up to last 7 entries for the rolling average
  const recent = entries.slice(-7);

  if (recent.length === 0) return base;

  const avgBurn7d =
    recent.reduce((s, e) => s + e.impliedBurn, 0) / recent.length;
  const avgBurnRate7d =
    recent.reduce((s, e) => s + e.burnRate, 0) / recent.length;
  const avgNetSupplyGrowth7d =
    recent.reduce((s, e) => s + e.supplyChange, 0) / recent.length;

  return {
    dailyIssuance: DAILY_ISSUANCE,
    avgBurn7d,
    avgBurnRate7d,
    avgNetSupplyGrowth7d,
    dailyEntries: entries.slice(-7),
    daysAvailable: entries.length,
  };
}
