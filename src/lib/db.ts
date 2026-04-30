import { Pool } from "pg";
import { createHash } from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let initialized = false;

export async function getPool(): Promise<Pool> {
  if (!initialized) {
    // Create table with raw metric columns for future recalculation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theta_activity_history (
        date DATE NOT NULL,
        samples INTEGER NOT NULL DEFAULT 1,
        total_score INTEGER NOT NULL DEFAULT 0,
        average INTEGER NOT NULL DEFAULT 0,
        daily_txs INTEGER,
        tfuel_volume DOUBLE PRECISION,
        wallet_activity DOUBLE PRECISION,
        staking_nodes INTEGER,
        theta_staking_ratio DOUBLE PRECISION,
        tfuel_staking_ratio DOUBLE PRECISION,
        PRIMARY KEY (date)
      )
    `);

    // Add columns if table already exists without them
    const cols = [
      'daily_txs INTEGER', 'tfuel_volume DOUBLE PRECISION', 'wallet_activity DOUBLE PRECISION',
      'staking_nodes INTEGER', 'theta_staking_ratio DOUBLE PRECISION', 'tfuel_staking_ratio DOUBLE PRECISION',
      'theta_price DOUBLE PRECISION', 'tfuel_price DOUBLE PRECISION', 'theta_market_cap DOUBLE PRECISION',
      'tfuel_circulating_supply DOUBLE PRECISION', 'daily_blocks INTEGER',
      'validator_guardian_nodes INTEGER', 'edge_nodes INTEGER',
      'subchain_api_available BOOLEAN DEFAULT FALSE',
      'tdrop_price DOUBLE PRECISION', 'tdrop_market_cap DOUBLE PRECISION',
      'tfuel_supply_snapshot_at TIMESTAMPTZ',
    ];

    // Visitor tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theta_visitors (
        visitor_id TEXT PRIMARY KEY,
        first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        visit_count INTEGER NOT NULL DEFAULT 1
      )
    `);
    await pool
      .query(`ALTER TABLE theta_visitors ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE`)
      .catch(() => {});
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theta_page_views (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        page TEXT NOT NULL,
        viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // EdgeCloud playground usage — one row per (hashed-IP, date). The
    // per-day grain lets us draw a 14-day trend; sum question_count
    // across rows for a given ip_hash to get "questions per person".
    // Outcome counters break that total down so the admin view can
    // distinguish "100 asked, 90 succeeded" from "100 asked, 50 timed out".
    await pool.query(`
      CREATE TABLE IF NOT EXISTS edgecloud_chat_usage (
        ip_hash TEXT NOT NULL,
        date DATE NOT NULL,
        question_count INTEGER NOT NULL DEFAULT 0,
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_model TEXT,
        PRIMARY KEY (ip_hash, date)
      )
    `);
    // Migrate older schema: an earlier iteration named the column
    // unavailable_count; spec settled on no_instances_count. Rename if
    // present, swallow if not.
    await pool
      .query(
        `ALTER TABLE edgecloud_chat_usage RENAME COLUMN unavailable_count TO no_instances_count`
      )
      .catch(() => {});

    // Backfill outcome columns onto pre-existing tables.
    for (const col of [
      "success_count INTEGER NOT NULL DEFAULT 0",
      "timeout_count INTEGER NOT NULL DEFAULT 0",
      "no_instances_count INTEGER NOT NULL DEFAULT 0",
      "error_count INTEGER NOT NULL DEFAULT 0",
      "last_outcome TEXT",
      "question_topic VARCHAR(100)",
    ]) {
      const name = col.split(" ")[0];
      const rest = col.split(" ").slice(1).join(" ");
      await pool
        .query(
          `ALTER TABLE edgecloud_chat_usage ADD COLUMN IF NOT EXISTS ${name} ${rest}`
        )
        .catch(() => {});
    }

    // Per-model usage aggregate. Separate from edgecloud_chat_usage
    // because that table's last_model field only tracks each user's
    // most recent model — not accurate for per-model totals when a
    // visitor uses multiple models. This table is keyed on
    // (model, date) and sees every individual call.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS edgecloud_model_usage (
        model TEXT NOT NULL,
        date DATE NOT NULL,
        success_count INTEGER NOT NULL DEFAULT 0,
        timeout_count INTEGER NOT NULL DEFAULT 0,
        no_instances_count INTEGER NOT NULL DEFAULT 0,
        error_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (model, date)
      )
    `);

    // Per-topic usage aggregate. Same pattern as model_usage — the
    // question_topic column on edgecloud_chat_usage only retains the
    // last topic per (user, day), so an aggregate keyed on (topic,
    // date) is required to give correct counts for the admin view.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS edgecloud_topic_usage (
        topic VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (topic, date)
      )
    `);
    for (const col of cols) {
      const name = col.split(' ')[0];
      await pool.query(`ALTER TABLE theta_activity_history ADD COLUMN IF NOT EXISTS ${name} ${col.split(' ').slice(1).join(' ')}`).catch(() => {});
    }

    initialized = true;
  }
  return pool;
}

/**
 * Stable, non-reversible identifier per visitor IP. Salt comes from
 * STATS_SECRET so a stolen DB dump can't be brute-forced back to raw
 * IPs without also having that secret. We keep a 32-char prefix —
 * enough to make collisions astronomically unlikely while staying
 * human-readable in the admin UI.
 */
function hashIp(ip: string): string {
  const salt = process.env.STATS_SECRET ?? "fallback-salt";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export type ChatOutcome =
  | "success"
  | "timeout"
  | "no_instances"
  | "error";

/**
 * Record one playground call. Writes to up to three tables:
 *   - edgecloud_chat_usage  (per-visitor-per-day) for "who's using this"
 *   - edgecloud_model_usage (per-model-per-day)   for "which model is reliable"
 *   - edgecloud_topic_usage (per-topic-per-day)   when a topic is supplied
 *
 * Safe to call concurrently — every upsert resolves races atomically.
 * Errors are swallowed so a DB hiccup never breaks the chat flow.
 *
 * `topic` is intentionally optional: error/timeout exit paths skip
 * topic classification because the question never produced a usable
 * answer, and we only want topic counts for delivered conversations.
 */
export async function recordEdgecloudChat(
  ip: string,
  model: string,
  outcome: ChatOutcome,
  topic?: string
): Promise<void> {
  try {
    const p = await getPool();
    const ipHash = hashIp(ip);
    const successInc = outcome === "success" ? 1 : 0;
    const timeoutInc = outcome === "timeout" ? 1 : 0;
    const noInstancesInc = outcome === "no_instances" ? 1 : 0;
    const errorInc = outcome === "error" ? 1 : 0;
    const topicValue = topic ?? null;

    const queries: Promise<unknown>[] = [
      p.query(
        `INSERT INTO edgecloud_chat_usage (
           ip_hash, date, question_count,
           success_count, timeout_count, no_instances_count, error_count,
           last_seen, last_model, last_outcome, question_topic
         )
         VALUES (
           $1, CURRENT_DATE, 1,
           $3, $4, $5, $6,
           NOW(), $2, $7, $8
         )
         ON CONFLICT (ip_hash, date) DO UPDATE
         SET question_count       = edgecloud_chat_usage.question_count + 1,
             success_count        = edgecloud_chat_usage.success_count + $3,
             timeout_count        = edgecloud_chat_usage.timeout_count + $4,
             no_instances_count   = edgecloud_chat_usage.no_instances_count + $5,
             error_count          = edgecloud_chat_usage.error_count + $6,
             last_seen            = NOW(),
             last_model           = EXCLUDED.last_model,
             last_outcome         = EXCLUDED.last_outcome,
             question_topic       = COALESCE(EXCLUDED.question_topic,
                                             edgecloud_chat_usage.question_topic)`,
        [
          ipHash,
          model,
          successInc,
          timeoutInc,
          noInstancesInc,
          errorInc,
          outcome,
          topicValue,
        ]
      ),
      p.query(
        `INSERT INTO edgecloud_model_usage (
           model, date,
           success_count, timeout_count, no_instances_count, error_count
         )
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
         ON CONFLICT (model, date) DO UPDATE
         SET success_count        = edgecloud_model_usage.success_count + $2,
             timeout_count        = edgecloud_model_usage.timeout_count + $3,
             no_instances_count   = edgecloud_model_usage.no_instances_count + $4,
             error_count          = edgecloud_model_usage.error_count + $5`,
        [model, successInc, timeoutInc, noInstancesInc, errorInc]
      ),
    ];

    if (topicValue) {
      queries.push(
        p.query(
          `INSERT INTO edgecloud_topic_usage (topic, date, count)
           VALUES ($1, CURRENT_DATE, 1)
           ON CONFLICT (topic, date) DO UPDATE
           SET count = edgecloud_topic_usage.count + 1`,
          [topicValue]
        )
      );
    }

    await Promise.all(queries);
  } catch (e) {
    console.error("[recordEdgecloudChat] failed:", e);
  }
}
