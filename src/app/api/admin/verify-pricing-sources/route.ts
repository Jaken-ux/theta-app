import { NextResponse } from "next/server";
import {
  PRICING_SOURCES,
  lastVerifiedDate,
} from "../../../../lib/edgecloud-pricing";

/**
 * Health-check the pricing source URLs used by /use-edgecloud.
 *
 * This does NOT auto-update the comparison numbers — those are intentionally
 * hand-curated (see lib/edgecloud-pricing.ts for the rationale). It only
 * confirms each source page still resolves so the table's citations don't
 * silently rot.
 *
 * Hit this endpoint from any cron runner (Vercel Cron, GitHub Actions, etc.).
 * A non-200 in `results[].ok` means the source URL changed or went down — go
 * verify the corresponding row by hand and bump its `lastVerified` date.
 */
export async function GET() {
  const checkedAt = new Date().toISOString();

  const results = await Promise.all(
    PRICING_SOURCES.map(async (s) => {
      try {
        // HEAD first — falls back to GET because some pricing pages reject HEAD.
        let res = await fetch(s.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
        });
        if (res.status === 405 || res.status === 403) {
          res = await fetch(s.url, {
            method: "GET",
            signal: AbortSignal.timeout(10000),
            redirect: "follow",
          });
        }
        return {
          name: s.name,
          url: s.url,
          status: res.status,
          ok: res.ok,
        };
      } catch (e) {
        return {
          name: s.name,
          url: s.url,
          status: 0,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  const allOk = results.every((r) => r.ok);

  return NextResponse.json(
    {
      checkedAt,
      lastVerified: lastVerifiedDate(),
      allOk,
      results,
    },
    { status: allOk ? 200 : 503 }
  );
}
