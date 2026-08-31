/**
 * Bridge tx log — incremental storage for Ecosystem Growth v2.
 *
 * Historically the Ecosystem Growth score used cumulative on-chain
 * counters (`txs_counter['7']` on the 4 Token Banks + ChainRegistrar).
 * That design was pumpable by a single spamming address and — because
 * the counter never decreases — the inflation stayed locked in even
 * after the spammer stopped.
 *
 * v2 replaces the cumulative-counter inputs with a rolling 30-day
 * count of unique addresses that made at least 5 SUCCESSFUL txs. To
 * make that tractable on Vercel Hobby (10s serverless cap, 10 txs
 * per API page × 3,600 pages needed for the 30d window on the most
 * active contract), we cache txs incrementally in Postgres.
 *
 * The daily cron:
 *   1. Top-ups from page 1 until it hits an already-stored hash
 *      (catches new activity — usually 1-3 pages)
 *   2. If backfill state !== "complete", walks deeper into history
 *      by CHUNK_PAGES per run, storing rows with ON CONFLICT DO
 *      NOTHING. Backfill is idempotent and interrupt-safe.
 *   3. Deletes rows older than 30 days.
 *
 * Score computation is then a fast SQL group-by against the log —
 * no live API calls in the adapter's fetchMetrics().
 */
import type { Pool } from "pg";

/** Token Bank contracts + ChainRegistrar we track. Lowercase for consistency. */
export const BRIDGE_CONTRACTS = {
  TFUEL_BANK: "0xf83239088b8766a27cd1f46772a2e1f88e916322",
  TNT20_BANK: "0xb3d93735de018ad48122bf7394734a7d18007e1b",
  TNT721_BANK: "0xfe2d1be6bd9d342cfa59e75290f9b0b42cdbcdaf",
  TNT1155_BANK: "0xa31168d669112937b0826b1bf15f0eb12e6b1542",
  CHAIN_REGISTRAR: "0xb164c26fd7970746639151a8c118cce282f272a7",
} as const;

export const CROSSCHAIN_CONTRACTS = [
  BRIDGE_CONTRACTS.TFUEL_BANK,
  BRIDGE_CONTRACTS.TNT20_BANK,
  BRIDGE_CONTRACTS.TNT721_BANK,
  BRIDGE_CONTRACTS.TNT1155_BANK,
];

export const COLLATERAL_CONTRACT = BRIDGE_CONTRACTS.CHAIN_REGISTRAR;

export const ALL_BRIDGE_CONTRACTS = [
  ...CROSSCHAIN_CONTRACTS,
  COLLATERAL_CONTRACT,
];

/** v2 configuration constants. */
export const V2 = {
  WINDOW_DAYS: 30,
  MIN_TXS_PER_PARTICIPANT: 5,
  BASELINE_CROSSCHAIN_PARTICIPANTS: 15,
  BASELINE_COLLATERAL_PARTICIPANTS: 8,
  WEIGHT_CROSSCHAIN: 0.35,
  WEIGHT_COLLATERAL: 0.30,
  WEIGHT_SUBCHAIN_COUNT: 0.35,
  BASELINE_SUBCHAIN_COUNT: 15,
} as const;

let schemaInitialized = false;

export async function ensureBridgeLogSchema(pool: Pool): Promise<void> {
  if (schemaInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_bridge_tx_log (
      contract_addr TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      sender TEXT NOT NULL,
      ts_seconds BIGINT NOT NULL,
      success BOOLEAN NOT NULL,
      PRIMARY KEY (contract_addr, tx_hash)
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_bridge_tx_ts
       ON metachain_bridge_tx_log (contract_addr, ts_seconds)`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_bridge_tx_sender_success
       ON metachain_bridge_tx_log (sender, ts_seconds)
       WHERE success = TRUE`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_bridge_backfill (
      contract_addr TEXT PRIMARY KEY,
      next_page INTEGER NOT NULL DEFAULT 1,
      oldest_ts_seen BIGINT,
      is_backfilled BOOLEAN NOT NULL DEFAULT FALSE,
      last_run_at TIMESTAMPTZ,
      last_run_pages_scanned INTEGER,
      last_run_txs_inserted INTEGER
    )
  `);

  // Seed backfill state for all known contracts (idempotent).
  for (const addr of ALL_BRIDGE_CONTRACTS) {
    await pool.query(
      `INSERT INTO metachain_bridge_backfill (contract_addr)
       VALUES ($1) ON CONFLICT DO NOTHING`,
      [addr]
    );
  }

  schemaInitialized = true;
}

/** Cutoff timestamp: any tx older than this is outside the 30d window. */
export function windowCutoffTs(): number {
  return Math.floor(Date.now() / 1000) - V2.WINDOW_DAYS * 86400;
}

/**
 * Count unique senders with >= 5 successful txs in the 30d window,
 * deduped across the given contract set. Senders are counted ONCE
 * globally regardless of which contract(s) they interacted with.
 */
export async function countParticipants(
  pool: Pool,
  contractAddrs: string[]
): Promise<number> {
  if (contractAddrs.length === 0) return 0;
  const cutoff = windowCutoffTs();
  const result = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM (
       SELECT sender
       FROM metachain_bridge_tx_log
       WHERE contract_addr = ANY($1::text[])
         AND success = TRUE
         AND ts_seconds >= $2
       GROUP BY sender
       HAVING COUNT(*) >= $3
     ) q`,
    [contractAddrs, cutoff, V2.MIN_TXS_PER_PARTICIPANT]
  );
  return Number(result.rows[0]?.n ?? 0);
}

/** Count reverted txs in the 30d window (footnote number). */
export async function countReverted(
  pool: Pool,
  contractAddrs: string[]
): Promise<number> {
  if (contractAddrs.length === 0) return 0;
  const cutoff = windowCutoffTs();
  const result = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
       FROM metachain_bridge_tx_log
      WHERE contract_addr = ANY($1::text[])
        AND success = FALSE
        AND ts_seconds >= $2`,
    [contractAddrs, cutoff]
  );
  return Number(result.rows[0]?.n ?? 0);
}

export interface BackfillStatus {
  complete: boolean;
  contractsRemaining: string[];
  daysCovered: number;
}

/**
 * Overall backfill status. `daysCovered` is the min "how deep have we
 * walked" across all contracts, capped at WINDOW_DAYS. Once every
 * contract has is_backfilled=TRUE, `complete` is TRUE and daysCovered
 * = WINDOW_DAYS.
 */
export async function readBackfillStatus(pool: Pool): Promise<BackfillStatus> {
  const { rows } = await pool.query<{
    contract_addr: string;
    is_backfilled: boolean;
    oldest_ts_seen: string | null;
  }>(
    `SELECT contract_addr, is_backfilled, oldest_ts_seen
       FROM metachain_bridge_backfill`
  );

  const contractsRemaining = rows
    .filter((r) => !r.is_backfilled)
    .map((r) => r.contract_addr);

  const nowSec = Math.floor(Date.now() / 1000);
  const daysCoveredRaw = Math.min(
    ...rows.map((r) => {
      if (r.is_backfilled) return V2.WINDOW_DAYS;
      if (!r.oldest_ts_seen) return 0;
      return Math.floor((nowSec - Number(r.oldest_ts_seen)) / 86400);
    })
  );
  const daysCovered = Number.isFinite(daysCoveredRaw)
    ? Math.max(0, Math.min(V2.WINDOW_DAYS, daysCoveredRaw))
    : 0;

  return {
    complete: contractsRemaining.length === 0,
    contractsRemaining,
    daysCovered,
  };
}
