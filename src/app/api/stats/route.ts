import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function GET(request: Request) {
  // Secret key to protect stats
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== process.env.STATS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = await getPool();

    const [totalVisitors, totalPageViews, newToday, returningToday, todayViews, topPages, recentDays] =
      await Promise.all([
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
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
