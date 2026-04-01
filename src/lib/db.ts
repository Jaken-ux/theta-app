import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let initialized = false;

export async function getPool(): Promise<Pool> {
  if (!initialized) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS theta_activity_history (
        date DATE NOT NULL,
        samples INTEGER NOT NULL DEFAULT 1,
        total_score INTEGER NOT NULL DEFAULT 0,
        average INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date)
      )
    `);
    initialized = true;
  }
  return pool;
}
