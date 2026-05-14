import { NextResponse } from "next/server";
import { pollDonations } from "../../../../lib/donations";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollDonations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/donations] failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
