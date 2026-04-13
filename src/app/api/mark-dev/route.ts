import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key !== process.env.STATS_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visitorId, isDev } = await request.json();
    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ error: "Invalid visitor id" }, { status: 400 });
    }

    const pool = await getPool();
    await pool.query(
      `UPDATE theta_visitors SET is_dev = $1 WHERE visitor_id = $2`,
      [Boolean(isDev), visitorId]
    );

    const result = await pool.query(
      `SELECT is_dev FROM theta_visitors WHERE visitor_id = $1`,
      [visitorId]
    );

    return NextResponse.json({
      ok: true,
      isDev: result.rows[0]?.is_dev ?? false,
    });
  } catch (error) {
    console.error("Mark-dev failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const visitorId = searchParams.get("visitorId");
    if (key !== process.env.STATS_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!visitorId) {
      return NextResponse.json({ error: "Missing visitorId" }, { status: 400 });
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT is_dev FROM theta_visitors WHERE visitor_id = $1`,
      [visitorId]
    );

    return NextResponse.json({
      isDev: result.rows[0]?.is_dev ?? false,
      exists: result.rows.length > 0,
    });
  } catch (error) {
    console.error("Get-dev failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
