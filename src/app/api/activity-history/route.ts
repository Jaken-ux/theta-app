import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT date, samples, average
       FROM theta_activity_history
       ORDER BY date ASC
       LIMIT 90`
    );

    const history = result.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      score: row.average,
      sampleCount: row.samples,
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch activity history:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { score } = await request.json();

    if (typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const pool = await getPool();
    const today = new Date().toISOString().slice(0, 10);

    // Upsert: if today exists, add sample; otherwise create new row
    await pool.query(
      `INSERT INTO theta_activity_history (date, samples, total_score, average)
       VALUES ($1, 1, $2, $2)
       ON CONFLICT (date) DO UPDATE SET
         samples = theta_activity_history.samples + 1,
         total_score = theta_activity_history.total_score + $2,
         average = (theta_activity_history.total_score + $2) / (theta_activity_history.samples + 1)`,
      [today, score]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save activity score:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
