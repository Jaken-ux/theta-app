import { NextResponse } from "next/server";
import { pollDonations } from "../../../../lib/donations";

// Manual trigger for the donations poll, auth'd by the same admin
// stats secret used elsewhere on /admin. Lets the admin page show a
// "Polla nu" button instead of waiting up to 30 min for the next
// scheduled cron tick. Behavior is otherwise identical to the cron
// route — same poll, same DB writes, same cold-start logic.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollDonations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[admin/poll-donations] failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
