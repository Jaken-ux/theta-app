import { NextResponse } from "next/server";
import { resetDonations } from "../../../../lib/donations";

// One-shot reset for the donations table. Deletes everything currently
// stored and stamps a cutoff at "now" so future polls can't re-insert
// the historical wallet activity. Auth'd by the admin stats secret —
// same gate as /api/stats and /api/admin/poll-donations.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetDonations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[admin/reset-donations] failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
