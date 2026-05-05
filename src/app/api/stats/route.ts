import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getMonitoredSubchains } from "../../../lib/metachain/monitor";

export const dynamic = "force-dynamic"; // never cache stats

export async function GET(request: Request) {
  // Secret key to protect stats
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = await getPool();

    const [
      edgecloudTotals,
      edgecloudToday,
      edgecloudTopUsers,
      edgecloudLast14,
      edgecloudByModel,
      edgecloudByTopic,
    ] = await Promise.all([
      // EdgeCloud playground — all-time totals + outcome breakdown
      pool.query(
        `SELECT COUNT(DISTINCT ip_hash) AS users,
                COALESCE(SUM(question_count), 0) AS questions,
                COALESCE(SUM(success_count), 0) AS successes,
                COALESCE(SUM(timeout_count), 0) AS timeouts,
                COALESCE(SUM(no_instances_count), 0) AS no_instances,
                COALESCE(SUM(error_count), 0) AS errors
         FROM edgecloud_chat_usage`
      ),
      // EdgeCloud playground — today + outcome breakdown
      pool.query(
        `SELECT COUNT(DISTINCT ip_hash) AS users,
                COALESCE(SUM(question_count), 0) AS questions,
                COALESCE(SUM(success_count), 0) AS successes,
                COALESCE(SUM(timeout_count), 0) AS timeouts,
                COALESCE(SUM(no_instances_count), 0) AS no_instances,
                COALESCE(SUM(error_count), 0) AS errors
         FROM edgecloud_chat_usage
         WHERE date = CURRENT_DATE`
      ),
      // EdgeCloud playground — top users (sum across all dates)
      pool.query(
        `SELECT ip_hash,
                SUM(question_count) AS total_questions,
                SUM(success_count) AS successes,
                SUM(timeout_count) AS timeouts,
                SUM(no_instances_count) AS no_instances,
                SUM(error_count) AS errors,
                MAX(last_seen) AS last_seen,
                MAX(last_model) AS last_model,
                MAX(last_outcome) AS last_outcome
         FROM edgecloud_chat_usage
         GROUP BY ip_hash
         ORDER BY total_questions DESC
         LIMIT 10`
      ),
      // EdgeCloud playground — last 14 days trend
      pool.query(
        `SELECT date,
                COUNT(DISTINCT ip_hash) AS users,
                SUM(question_count) AS questions,
                SUM(success_count) AS successes
         FROM edgecloud_chat_usage
         WHERE date > CURRENT_DATE - INTERVAL '14 days'
         GROUP BY date
         ORDER BY date`
      ),
      // EdgeCloud playground — per-model totals (all-time)
      pool.query(
        `SELECT model,
                SUM(success_count) AS successes,
                SUM(timeout_count) AS timeouts,
                SUM(no_instances_count) AS no_instances,
                SUM(error_count) AS errors,
                SUM(success_count + timeout_count + no_instances_count + error_count) AS attempts
         FROM edgecloud_model_usage
         GROUP BY model
         ORDER BY attempts DESC`
      ),
      // EdgeCloud playground — top question topics (last 30 days)
      pool.query(
        `SELECT topic, SUM(count)::int AS count
         FROM edgecloud_topic_usage
         WHERE date > CURRENT_DATE - INTERVAL '30 days'
         GROUP BY topic
         ORDER BY count DESC`
      ),
    ]);

    return NextResponse.json({
      monitoredSubchains: await getMonitoredSubchains().catch(() => []),
      edgecloud: {
        allTime: {
          users: parseInt(edgecloudTotals.rows[0].users),
          questions: parseInt(edgecloudTotals.rows[0].questions),
          successes: parseInt(edgecloudTotals.rows[0].successes),
          timeouts: parseInt(edgecloudTotals.rows[0].timeouts),
          noInstances: parseInt(edgecloudTotals.rows[0].no_instances),
          errors: parseInt(edgecloudTotals.rows[0].errors),
        },
        today: {
          users: parseInt(edgecloudToday.rows[0].users),
          questions: parseInt(edgecloudToday.rows[0].questions),
          successes: parseInt(edgecloudToday.rows[0].successes),
          timeouts: parseInt(edgecloudToday.rows[0].timeouts),
          noInstances: parseInt(edgecloudToday.rows[0].no_instances),
          errors: parseInt(edgecloudToday.rows[0].errors),
        },
        topUsers: edgecloudTopUsers.rows.map((r) => ({
          ipHash: r.ip_hash,
          totalQuestions: parseInt(r.total_questions),
          successes: parseInt(r.successes ?? 0),
          timeouts: parseInt(r.timeouts ?? 0),
          noInstances: parseInt(r.no_instances ?? 0),
          errors: parseInt(r.errors ?? 0),
          lastSeen: r.last_seen.toISOString(),
          lastModel: r.last_model ?? null,
          lastOutcome: r.last_outcome ?? null,
        })),
        last14Days: edgecloudLast14.rows.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          users: parseInt(r.users),
          questions: parseInt(r.questions),
          successes: parseInt(r.successes ?? 0),
        })),
        byModel: edgecloudByModel.rows.map((r) => ({
          model: r.model,
          attempts: parseInt(r.attempts ?? 0),
          successes: parseInt(r.successes ?? 0),
          timeouts: parseInt(r.timeouts ?? 0),
          noInstances: parseInt(r.no_instances ?? 0),
          errors: parseInt(r.errors ?? 0),
        })),
        topTopics30d: edgecloudByTopic.rows.map((r) => ({
          topic: r.topic,
          count: parseInt(r.count ?? 0),
        })),
      },
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
