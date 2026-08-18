/**
 * MetricCaveat — display-only notice for the Ecosystem Growth
 * inflation issue.
 *
 * Since 2026-08-08, a single address has been running automated
 * bridge transactions to TPulse, pushing the Ecosystem Growth
 * score (and therefore the composite Metachain Utilization Index)
 * far above its normal range. This component surfaces that caveat
 * to viewers of the dashboard, weekly summary, and info modal
 * until the underlying metric can be redesigned to be
 * concentration-resistant.
 *
 * Display-only — does NOT change any scores, formulas, or tier
 * logic. Copy is fixed and reused across all placements.
 */

const SHORT_TEXT =
  "⚠️ Metric note: The Ecosystem Growth component is currently inflated by concentrated bridge activity from a single address (since Aug 8). Broader ecosystem activity remains near its historical baseline. We're revising this metric — read the score with this caveat in mind.";

const LONG_PARAGRAPHS = [
  "Since August 8, 2026, a single address has been running automated bridge transactions to the TPulse subchain at a steady cadence. Because the current Ecosystem Growth formula counts total cross-chain transaction volume, this one actor pushes the score far above its normal range — even though it represents one participant, not broad adoption.",
  "The rest of the ecosystem is largely unchanged: still 7 active subchains, no new chain registrations since April, and per-chain usage (including TPulse's own transactions) flat to slightly down. If you removed this single address, the index would look essentially as it did in July.",
  "We're updating the metric to measure unique participants rather than raw transaction volume, so that concentrated activity from one source can no longer distort the picture. Until that ships, the Metachain Utilization Index and its current tier reflect this inflation and should be read with this note in mind.",
];

const BASE_CLASSES =
  "rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5";

export function MetricCaveat({ variant }: { variant: "short" | "long" }) {
  if (variant === "short") {
    return (
      <div
        className={`${BASE_CLASSES} px-4 py-3 text-[12px] text-[#D1D5DB] leading-relaxed`}
        role="note"
      >
        {SHORT_TEXT}
      </div>
    );
  }
  return (
    <div
      className={`${BASE_CLASSES} px-4 py-4 text-[12px] text-[#D1D5DB] leading-relaxed`}
      role="note"
    >
      <p className="text-[#F59E0B] font-semibold text-[13px] mb-2 flex items-center gap-2">
        <span aria-hidden>&#9888;</span>
        <span>Metric note — Ecosystem Growth component is currently inflated</span>
      </p>
      <div className="space-y-2.5">
        {LONG_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
