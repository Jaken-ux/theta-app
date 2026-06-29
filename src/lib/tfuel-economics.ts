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
 * Snapshot timing is now reliable. The original noise problem came from
 * supply snapshots being taken whenever someone hit the site instead of
 * at a fixed time, which split one real day's issuance across two
 * reported deltas and produced paired "too low" / "too high" days. The
 * cron was moved to a fixed 00:05 UTC tick on 2026-04-25, and no
 * drift-pattern artifacts have appeared since.
 *
 * Daily bars therefore now show the raw single-day absorption with
 * NO rolling smoothing — what you see is what we measured. Two safety
 * rails remain:
 *
 *   1. KNOWN_ARTIFACT_DATES — specific pre-fix dates that are clamped
 *      to 0 and marked as artifacts so historical bars still appear
 *      but in a muted style.
 *   2. Generic clamps — if a raw day is negative (supply growth >
 *      one day's issuance, physically impossible) or above 100%
 *      (more absorbed than issued, suspect of stale supply data),
 *      it is also clamped to 0 and flagged as an artifact.
 *
 * The headline 7-day figure is a trailing average over clean
 * (non-artifact) daily values. That single layer of smoothing is the
 * only one applied — the per-bar 3-day centered average that previously
 * lived here was removed when snapshot drift stopped producing
 * artifacts (see commit history for context).
 */

const BLOCKS_PER_DAY = Math.floor(86400 / 6); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

/**
 * Pre-fix dates whose raw absorption was provably wrong. Listed so the
 * historical chart can mute them rather than hide them. No new entries
 * have been needed since the cron-timing fix on 2026-04-25.
 *
 *   2026-04-21 — pre-fix snapshot timing drift, raw absorption was
 *     -22.9% (physically impossible: supply growth exceeded daily
 *     issuance, meaning consecutive snapshots were >24h apart).
 *
 *   2026-04-24 — bug-fix transition day. Apr 24 snapshot was the last
 *     /network-write before the 21:14 UTC fix in 9f0c2aa; Apr 25 was
 *     the first clean cron at 00:05 UTC. The interval between them
 *     was only a few hours, so a single day's denominator was applied
 *     to a tiny window of supply growth, producing a +78.5% phantom
 *     spike.
 *
 *   2026-04-27 — raw supply delta of 1,306,523 TFUEL exceeded the
 *     fixed daily block issuance of 1,238,400, producing a raw
 *     absorption of -5.5%. Snapshot intervals on either side were
 *     within ~15 min of 24h, so this is not snapshot-timing drift.
 *     No on-chain unlock or treasury distribution has been identified
 *     for this date. Treated as API artifact (suspected stale or
 *     incorrect supply value at one of the snapshots) until a
 *     concrete cause is found.
 */
const KNOWN_ARTIFACT_DATES = new Set<string>([
  "2026-04-21",
  "2026-04-24",
  "2026-04-27",
]);

export interface DailyEntry {
  date: string;
  supplyChange: number;
  /** Single-day raw absorption (issuance − supplyChange). May be negative on artifact days. */
  rawAbsorption: number;
  /** Raw absorption clamped to [0, DAILY_ISSUANCE] — 0 on artifact days. No smoothing. */
  absorption: number;
  /** Rate as fraction 0–1. */
  absorptionRate: number;
  /** True if this day was clamped: pre-flagged artifact date, raw < 0, or raw > issuance. */
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

  // The delta (supply[N+1] − supply[N]) represents activity during day
  // N (between the snapshot at start of day N and the one at start of
  // day N+1). Each entry is labelled with the START date of that
  // interval.
  const entries: DailyEntry[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const entryDate = sorted[i].date;
    if (entryDate >= todayUtc) continue;
    const supplyChange = sorted[i + 1].supply - sorted[i].supply;
    const rawAbsorption = DAILY_ISSUANCE - supplyChange;

    const isKnownArtifact = KNOWN_ARTIFACT_DATES.has(entryDate);
    const outOfRange = rawAbsorption < 0 || rawAbsorption > DAILY_ISSUANCE;
    const isDataArtifact = isKnownArtifact || outOfRange;

    const absorption = isDataArtifact ? 0 : rawAbsorption;
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

  // 7-day trailing average over clean days. This is the only smoothing
  // applied anywhere in the pipeline; daily bars are raw.
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
