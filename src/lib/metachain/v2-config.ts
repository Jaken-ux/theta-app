/**
 * v2 config — pure constants, no runtime imports.
 *
 * Kept in its own file so client components (MetachainDashboard,
 * MetachainInfoModal) can import ECOSYSTEM_GROWTH_V2_START without
 * transitively pulling in `pg` via the adapter's server-only
 * dependencies. Server code re-imports from here where needed.
 */

/** Deploy date of the v2 metric (UTC). Chart renders a boundary
 * line on this date; info modal references it in the methodology
 * note. Update this one line and redeploy if the actual deploy
 * lands on a different day. */
export const ECOSYSTEM_GROWTH_V2_START = "2026-08-31";
