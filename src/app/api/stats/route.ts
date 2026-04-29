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
      totalVisitors,
      totalPageViews,
      newToday,
      returningToday,
      todayViews,
      topPages,
      recentDays,
      topReferrers,
      topCampaigns,
      edgecloudTotals,
      edgecloudToday,
      edgecloudTopUsers,
      edgecloudLast14,
      edgecloudByModel,
    ] = await Promise.all([
        // Total unique visitors (excluding devs)
        pool.query(
          `SELECT COUNT(*) as count FROM theta_visitors WHERE is_dev IS NOT TRUE`
        ),
        // Total page views (excluding devs)
        pool.query(
          `SELECT COUNT(*) as count FROM theta_page_views pv
           WHERE NOT EXISTS (
             SELECT 1 FROM theta_visitors v
             WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
           )`
        ),
        // New visitors today (excluding devs)
        pool.query(
          `SELECT COUNT(*) as count FROM theta_visitors
           WHERE first_seen::date = CURRENT_DATE AND is_dev IS NOT TRUE`
        ),
        // Returning visitors today (excluding devs)
        pool.query(
          `SELECT COUNT(*) as count FROM theta_visitors
           WHERE first_seen::date < CURRENT_DATE
           AND last_seen::date = CURRENT_DATE
           AND is_dev IS NOT TRUE`
        ),
        // Page views today (excluding devs)
        pool.query(
          `SELECT COUNT(*) as count FROM theta_page_views pv
           WHERE pv.viewed_at::date = CURRENT_DATE
           AND NOT EXISTS (
             SELECT 1 FROM theta_visitors v
             WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
           )`
        ),
        // Top pages (all time, excluding devs)
        pool.query(
          `SELECT page, COUNT(*) as views FROM theta_page_views pv
           WHERE NOT EXISTS (
             SELECT 1 FROM theta_visitors v
             WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
           )
           GROUP BY page ORDER BY views DESC LIMIT 10`
        ),
        // Daily unique visitors last 14 days (excluding devs)
        pool.query(
          `SELECT viewed_at::date as date, COUNT(DISTINCT pv.visitor_id) as unique_visitors, COUNT(*) as page_views
           FROM theta_page_views pv
           WHERE viewed_at > NOW() - INTERVAL '14 days'
           AND NOT EXISTS (
             SELECT 1 FROM theta_visitors v
             WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
           )
           GROUP BY viewed_at::date
           ORDER BY date DESC`
        ),
        // Top referrers (30 days, excluding devs) — null = direct traffic
        pool.query(
          `SELECT COALESCE(referrer, '(direct)') as referrer,
                  COUNT(DISTINCT pv.visitor_id) as visitors,
                  COUNT(*) as views
           FROM theta_page_views pv
           WHERE viewed_at > NOW() - INTERVAL '30 days'
             AND NOT EXISTS (
               SELECT 1 FROM theta_visitors v
               WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
             )
           GROUP BY COALESCE(referrer, '(direct)')
           ORDER BY visitors DESC LIMIT 10`
        ),
        // Top UTM campaigns (30 days, excluding devs)
        pool.query(
          `SELECT utm_source, utm_campaign,
                  COUNT(DISTINCT pv.visitor_id) as visitors,
                  COUNT(*) as views
           FROM theta_page_views pv
           WHERE viewed_at > NOW() - INTERVAL '30 days'
             AND utm_source IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM theta_visitors v
               WHERE v.visitor_id = pv.visitor_id AND v.is_dev IS TRUE
             )
           GROUP BY utm_source, utm_campaign
           ORDER BY visitors DESC LIMIT 10`
        ),
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
      ]);

    return NextResponse.json({
      totalUniqueVisitors: parseInt(totalVisitors.rows[0].count),
      totalPageViews: parseInt(totalPageViews.rows[0].count),
      today: {
        newVisitors: parseInt(newToday.rows[0].count),
        returningVisitors: parseInt(returningToday.rows[0].count),
        pageViews: parseInt(todayViews.rows[0].count),
      },
      topPages: topPages.rows.map((r) => ({ page: r.page, views: parseInt(r.views) })),
      last14Days: recentDays.rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        uniqueVisitors: parseInt(r.unique_visitors),
        pageViews: parseInt(r.page_views),
      })),
      topReferrers: topReferrers.rows.map((r) => ({
        referrer: r.referrer,
        visitors: parseInt(r.visitors),
        views: parseInt(r.views),
      })),
      topCampaigns: topCampaigns.rows.map((r) => ({
        source: r.utm_source,
        campaign: r.utm_campaign,
        visitors: parseInt(r.visitors),
        views: parseInt(r.views),
      })),
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
      },
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
