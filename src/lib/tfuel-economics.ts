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
 * Raw single-day values are noisy because daily snapshots are not taken
 * at exactly 24h intervals — cron timing drifts by a few hours from
 * day to day. That drift splits one day's real issuance across two
 * reported deltas, producing paired "too low" and "too high" days
 * (including apparent supply growth > 1,238,400, which is physically
 * impossible).
 *
 * We correct for this with a 3-day centered rolling average:
 *   smoothed[N] = (raw[N-1] + raw[N] + raw[N+1]) / 3
 *
 * Snapshot drift creates paired errors (one day too small, the next
 * too large). A centered 3-day window has both neighbours of each
 * drift pair so both halves get corrected to the same plausible value.
 * A 2-day trailing window only corrected the second half of each pair,
 * leaving the first half biased. The tradeoff is a slightly larger
 * smoothing window — real daily variation is blurred across ~3 days
 * instead of ~2 — but in exchange the day-to-day wobble from imperfect
 * snapshot timing is largely gone.
 *
 * The first and last day of the series have no pair to center on, so
 * we fall back to 2-day trailing for those edges.
 *
 * `isDataArtifact` now only flags days where the smoothed value is
 * still negative — extremely rare, indicates either 2+ consecutive
 * drift days or a genuine on-chain event (e.g. a large token unlock).
 */

const BLOCKS_PER_DAY = Math.floor(86400 / 6); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

export interface DailyEntry {
  date: string;
  supplyChange: number;
  /** Single-day raw absorption (no smoothing). Negative on drift days. */
  rawAbsorption: number;
  /** 3-day centered smoothed absorption (2-day trailing at edges), clamped to >= 0. */
  absorption: number;
  /** Smoothed rate as fraction 0–1. */
  absorptionRate: number;
  /** True only if smoothed absorption is still negative (rare). */
  isDataArtifact: boolean;
}

export interface TfuelEconomics {
  dailyIssuance: number;
  avgSupplyGrowth7d: number | null;
  avgAbsorption7d: number | null;
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

  // Today's UTC date. The loop pairs consecutive snapshots, so the
  // last raw entry is automatically limited to the second-to-last
  // snapshot — which represents yesterday's completed activity.
  const todayUtc = new Date().toISOString().slice(0, 10);

  // First pass: compute raw per-day values.
  //
  // IMPORTANT: the delta (supply[N+1] − supply[N]) represents activity
  // that happened DURING day N (between the snapshot taken at start of
  // day N and the one taken at start of day N+1). We therefore label
  // each entry with the START date of the interval, not the end date.
  // Previously we labelled with sorted[i].date which was off-by-one.
  const raw: { date: string; supplyChange: number; rawAbsorption: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const entryDate = sorted[i].date;
    if (entryDate >= todayUtc) continue;
    const supplyChange = sorted[i + 1].supply - sorted[i].supply;
    const rawAbsorption = DAILY_ISSUANCE - supplyChange;
    raw.push({ date: entryDate, supplyChange, rawAbsorption });
  }

  if (raw.length === 0) return base;

  // Second pass: 3-day centered rolling average.
  // Interior days: smoothed[N] = (raw[N-1] + raw[N] + raw[N+1]) / 3
  // Edges (first/last day, no pair) fall back to 2-day trailing/leading.
  const entries: DailyEntry[] = raw.map((r, i) => {
    let smoothedRaw: number;
    if (raw.length === 1) {
      smoothedRaw = r.rawAbsorption;
    } else if (i === 0) {
      // First day — 2-day leading
      smoothedRaw = (r.rawAbsorption + raw[1].rawAbsorption) / 2;
    } else if (i === raw.length - 1) {
      // Last day — 2-day trailing
      smoothedRaw = (raw[i - 1].rawAbsorption + r.rawAbsorption) / 2;
    } else {
      // Interior — 3-day centered
      smoothedRaw =
        (raw[i - 1].rawAbsorption + r.rawAbsorption + raw[i + 1].rawAbsorption) / 3;
    }
    const absorption = Math.max(0, smoothedRaw);
    const absorptionRate = absorption / DAILY_ISSUANCE;
    return {
      date: r.date,
      supplyChange: r.supplyChange,
      rawAbsorption: r.rawAbsorption,
      absorption,
      absorptionRate,
      isDataArtifact: smoothedRaw < 0,
    };
  });

  // 7-day averages — drift is already corrected by smoothing, so any
  // remaining artifact days are excluded to keep the trend trustworthy.
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
