import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function POST(request: Request) {
  try {
    const { visitorId, page } = await request.json();

    if (!visitorId || typeof visitorId !== "string" || !page) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const pool = await getPool();

    // Upsert visitor
    await pool.query(
      `INSERT INTO theta_visitors (visitor_id, first_seen, last_seen, visit_count)
       VALUES ($1, NOW(), NOW(), 1)
       ON CONFLICT (visitor_id) DO UPDATE SET
         last_seen = NOW(),
         visit_count = theta_visitors.visit_count + 1`,
      [visitorId]
    );

    // Log page view
    await pool.query(
      `INSERT INTO theta_page_views (visitor_id, page, viewed_at)
       VALUES ($1, $2, NOW())`,
      [visitorId, page]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tracking failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
