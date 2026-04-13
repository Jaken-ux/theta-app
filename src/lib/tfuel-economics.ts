/**
 * TFUEL economics — net absorption method.
 *
 * Total TFUEL issuance has two components:
 *   1. Block rewards: fixed at 14,400 × 86 = 1,238,400 TFUEL/day
 *   2. Edge Network rewards: variable, depends on compute/video activity
 *
 * We cannot separate these from supply data alone. We therefore show
 * "net absorption" — how much of block issuance is offset by all burn
 * sources combined (gas fees, Edge payment burns, etc.).
 *
 * Days where supply grows faster than block issuance indicate
 * higher-than-usual Edge Network payouts, not negative burn.
 * These are clamped to 0 and labeled "Edge spike".
 */

const BLOCKS_PER_DAY = Math.floor(86400 / 6); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

export interface DailyEntry {
  date: string;
  supplyChange: number;
  rawAbsorption: number; // can be negative (Edge spike)
  absorption: number; // clamped to >= 0
  absorptionRate: number; // as fraction 0–1, clamped to >= 0
  isEdgeSpike: boolean; // true when rawAbsorption < 0
}

export interface TfuelEconomics {
  dailyIssuance: number;
  avgSupplyGrowth7d: number | null;
  avgAbsorption7d: number | null; // clamped avg
  avgAbsorptionRate7d: number | null; // as fraction 0–1
  dailyEntries: DailyEntry[];
  daysAvailable: number;
}

export function computeTfuelEconomics(
  supplyHistory: { date: string; supply: number }[]
): TfuelEconomics {
  const base: TfuelEconomics = {
    dailyIssuance: DAILY_ISSUANCE,
    avgSupplyGrowth7d: null,
    avgAbsorption7d: null,
    avgAbsorptionRate7d: null,
    dailyEntries: [],
    daysAvailable: 0,
  };

  if (supplyHistory.length < 2) return base;

  const sorted = [...supplyHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Today's UTC date — entries dated today are excluded because their delta
  // has no confirmed next-day snapshot yet and is still changing.
  const todayUtc = new Date().toISOString().slice(0, 10);

  const entries: DailyEntry[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const entryDate = sorted[i].date;
    if (entryDate >= todayUtc) continue; // incomplete — skip today (and any future-dated row)
    const supplyChange = sorted[i].supply - sorted[i - 1].supply;
    const rawAbsorption = DAILY_ISSUANCE - supplyChange;
    const isEdgeSpike = rawAbsorption < 0;
    const absorption = Math.max(0, rawAbsorption);
    const absorptionRate = absorption / DAILY_ISSUANCE;

    entries.push({
      date: entryDate,
      supplyChange,
      rawAbsorption,
      absorption,
      absorptionRate,
      isEdgeSpike,
    });
  }

  if (entries.length === 0) return base;

  // 7-day averages for the summary cards
  const recent7 = entries.slice(-7);
  const avgSupplyGrowth7d =
    recent7.reduce((s, e) => s + e.supplyChange, 0) / recent7.length;
  const avgAbsorption7d =
    recent7.reduce((s, e) => s + e.absorption, 0) / recent7.length;
  const avgAbsorptionRate7d =
    recent7.reduce((s, e) => s + e.absorptionRate, 0) / recent7.length;

  return {
    dailyIssuance: DAILY_ISSUANCE,
    avgSupplyGrowth7d,
    avgAbsorption7d,
    avgAbsorptionRate7d,
    dailyEntries: entries, // all available history for chart
    daysAvailable: entries.length,
  };
}
