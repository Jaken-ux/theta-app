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

/**
 * Increment today's count for the given visitor. Safe to call
 * concurrently — the upsert resolves race conditions atomically.
 * Errors are not thrown so a DB hiccup never breaks the chat flow.
 */
export async function recordEdgecloudChat(
  ip: string,
  model: string
): Promise<void> {
  try {
    const p = await getPool();
    const ipHash = hashIp(ip);
    await p.query(
      `INSERT INTO edgecloud_chat_usage (ip_hash, date, question_count, last_seen, last_model)
       VALUES ($1, CURRENT_DATE, 1, NOW(), $2)
       ON CONFLICT (ip_hash, date) DO UPDATE
       SET question_count = edgecloud_chat_usage.question_count + 1,
           last_seen = NOW(),
           last_model = EXCLUDED.last_model`,
      [ipHash, model]
    );
  } catch (e) {
    console.error("[recordEdgecloudChat] failed:", e);
  }
}
