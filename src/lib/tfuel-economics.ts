/**
 * TFUEL economics — net absorption method.
 *
 * TFUEL is minted at a fixed rate: 14,400 blocks/day × 86 TFUEL/block
 * = 1,238,400 TFUEL/day. Nothing else mints new TFUEL — Edge Network
 * payouts and EdgeCloud jobs move existing supply, they do not create new.
 *
 * "Absorption" = block_issuance − supply_growth. It approximates how much
 * of each day's fresh issuance is offset by burns (gas, 25% of Edge
 * payments, etc.).
 *
 * Some days appear to have negative absorption (supply grew faster than
 * block issuance). That is not a real phenomenon — block rewards are the
 * only source of new TFUEL. These days are snapshot-timing artifacts
 * (jittery cron, API rounding, or occasional token unlocks moving tokens
 * into the circulating supply figure). We flag them as `isDataArtifact`,
 * clamp the value to 0, render them in neutral styling, and exclude them
 * from the 7-day averages so they do not contaminate the trend signal.
 */

const BLOCKS_PER_DAY = Math.floor(86400 / 6); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

export interface DailyEntry {
  date: string;
  supplyChange: number;
  rawAbsorption: number; // can be negative — indicates a data artifact
  absorption: number; // clamped to >= 0
  absorptionRate: number; // as fraction 0–1, clamped to >= 0
  isDataArtifact: boolean; // true when rawAbsorption < 0 (snapshot drift / unlock)
}

export interface TfuelEconomics {
  dailyIssuance: number;
  avgSupplyGrowth7d: number | null;
  avgAbsorption7d: number | null; // over last 7 non-artifact days
  avgAbsorptionRate7d: number | null;
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
    if (entryDate >= todayUtc) continue;
    const supplyChange = sorted[i].supply - sorted[i - 1].supply;
    const rawAbsorption = DAILY_ISSUANCE - supplyChange;
    const isDataArtifact = rawAbsorption < 0;
    const absorption = Math.max(0, rawAbsorption);
    const absorptionRate = absorption / DAILY_ISSUANCE;

    entries.push({
      date: entryDate,
      supplyChange,
      rawAbsorption,
      absorption,
      absorptionRate,
      isDataArtifact,
    });
  }

  if (entries.length === 0) return base;

  // 7-day averages — only over clean (non-artifact) days so timing glitches
  // or rare unlocks do not drag the trend line toward zero.
  const clean = entries.filter((e) => !e.isDataArtifact);
  const recent7 = clean.slice(-7);
  const avgSupplyGrowth7d =
    recent7.length > 0
      ? recent7.reduce((s, e) => s + e.supplyChange, 0) / recent7.length
      : null;
  const avgAbsorption7d =
    recent7.length > 0
      ? recent7.reduce((s, e) => s + e.absorption, 0) / recent7.length
      : null;
  const avgAbsorptionRate7d =
    recent7.length > 0
      ? recent7.reduce((s, e) => s + e.absorptionRate, 0) / recent7.length
      : null;

  return {
    dailyIssuance: DAILY_ISSUANCE,
    avgSupplyGrowth7d,
    avgAbsorption7d,
    avgAbsorptionRate7d,
    dailyEntries: entries,
    daysAvailable: entries.length,
  };
}
