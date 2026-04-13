import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const pool = await getPool();
  await pool.query(
    `ALTER TABLE theta_page_views
       ADD COLUMN IF NOT EXISTS referrer TEXT,
       ADD COLUMN IF NOT EXISTS utm_source TEXT,
       ADD COLUMN IF NOT EXISTS utm_medium TEXT,
       ADD COLUMN IF NOT EXISTS utm_campaign TEXT`
  );
  schemaReady = true;
}

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim().slice(0, 100);
  return trimmed || null;
}

export async function POST(request: Request) {
  try {
    const { visitorId, page, referrer, utm } = await request.json();

    if (!visitorId || typeof visitorId !== "string" || !page) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const pool = await getPool();
    await ensureSchema();

    await pool.query(
      `INSERT INTO theta_visitors (visitor_id, first_seen, last_seen, visit_count)
       VALUES ($1, NOW(), NOW(), 1)
       ON CONFLICT (visitor_id) DO UPDATE SET
         last_seen = NOW(),
         visit_count = theta_visitors.visit_count + 1`,
      [visitorId]
    );

    await pool.query(
      `INSERT INTO theta_page_views
         (visitor_id, page, viewed_at, referrer, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
      [
        visitorId,
        page,
        clean(referrer),
        clean(utm?.utm_source),
        clean(utm?.utm_medium),
        clean(utm?.utm_campaign),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tracking failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
