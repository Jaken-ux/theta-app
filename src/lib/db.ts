import { Pool } from "pg";

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
    for (const col of cols) {
      const name = col.split(' ')[0];
      await pool.query(`ALTER TABLE theta_activity_history ADD COLUMN IF NOT EXISTS ${name} ${col.split(' ').slice(1).join(' ')}`).catch(() => {});
    }

    initialized = true;
  }
  return pool;
}
