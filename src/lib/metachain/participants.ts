/**
 * Participants runner — fetches bridge/registrar txs from Theta and
 * stores them in metachain_bridge_tx_log. Called once per day from
 * the /api/cron/activity route.
 *
 * Two phases per contract:
 *   TOP-UP: fetch page 1 forward until we hit a tx_hash we already
 *     have (or 30d cutoff, or the top-up safety cap). Nearly always
 *     <1s in steady state.
 *   BACKFILL: if metachain_bridge_backfill.is_backfilled is FALSE,
 *     walk deeper from next_page by CHUNK_PAGES pages. Marks the
 *     contract as backfilled when it hits the 30d cutoff or the
 *     start of the contract's history.
 *
 * The runner is interrupt-safe: all writes use ON CONFLICT DO
 * NOTHING, and next_page only advances after inserts complete for
 * the corresponding batch. If a cron run times out mid-chunk, the
 * next run resumes at the same next_page.
 */
import type { Pool } from "pg";
import {
  ALL_BRIDGE_CONTRACTS,
  ensureBridgeLogSchema,
  V2,
  windowCutoffTs,
} from "./bridge-log";

const EXPLORER_API = "https://explorer-api.thetatoken.org/api";

/** Max pages per contract per backfill chunk. Tuned for the Hobby
 * 10s hard cap: at 10 concurrent × ~150ms per batch = ~1.5s fetch,
 * plus one single-shot INSERT per contract at ~100ms = ~1.7s per
 * contract. Contracts run in parallel, so wall clock is dominated
 * by the slowest ≈ TFuelTokenBank ≈ 1.7s. Combined with existing
 * cron work (~3-8s) stays inside 10s.
 *
 * Backfill duration for TFuelTokenBank at this rate:
 *   ~3,600 pages / 100 per run = ~36 daily runs.
 * Score is correct from Day 1 regardless (bot txs revert → 0
 * successful participants) so slow backfill is acceptable. */
const CHUNK_PAGES = 100;

/** Max pages for a single top-up scan. New activity is bounded to a
 * few pages/day even under active bot conditions. */
const TOP_UP_MAX_PAGES = 20;

/** Concurrency per contract when fetching pages. Total concurrent
 * requests across all 5 contracts ≤ this × 5 = 50. */
const PER_CONTRACT_CONCURRENCY = 10;

interface RawTx {
  txHash: string;
  sender: string;
  tsSeconds: number;
  success: boolean;
}

async function fetchPage(
  contractAddr: string,
  pageNumber: number
): Promise<RawTx[] | null> {
  const url = `${EXPLORER_API}/accounttx/${contractAddr}?type=-1&pageNumber=${pageNumber}&limit=100&isEqualType=false`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { body?: Array<Record<string, unknown>> };
    const body = j?.body ?? [];
    // Explorer returns array items where receipt has EvmErr and Logs.
    // Success = EvmErr empty OR any log emitted (belt-and-braces).
    return body.map((tx) => {
      const data = tx.data as { from?: { address?: string } } | undefined;
      const receipt = tx.receipt as
        | { EvmErr?: string; Logs?: unknown[] }
        | undefined;
      const evmErr = receipt?.EvmErr ?? "";
      const logCount = receipt?.Logs?.length ?? 0;
      return {
        txHash: String(tx._id ?? tx.hash ?? "").toLowerCase(),
        sender: String(data?.from?.address ?? "").toLowerCase(),
        tsSeconds: Number(tx.timestamp ?? 0),
        success: evmErr === "" || logCount > 0,
      };
    });
  } catch {
    return null;
  }
}

async function fetchPagesParallel(
  contractAddr: string,
  startPage: number,
  count: number
): Promise<Array<RawTx[] | null>> {
  const results: Array<RawTx[] | null> = new Array(count);
  for (let i = 0; i < count; i += PER_CONTRACT_CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(PER_CONTRACT_CONCURRENCY, count - i) },
      (_, k) => fetchPage(contractAddr, startPage + i + k)
    );
    const batchResults = await Promise.all(batch);
    for (let k = 0; k < batchResults.length; k++) {
      results[i + k] = batchResults[k];
    }
  }
  return results;
}

/** Insert a batch of txs. Returns count of newly-inserted rows. */
async function insertBatch(
  pool: Pool,
  contractAddr: string,
  txs: RawTx[]
): Promise<number> {
  if (txs.length === 0) return 0;
  // Filter out malformed rows (missing hash or sender)
  const valid = txs.filter((t) => t.txHash && t.sender);
  if (valid.length === 0) return 0;

  // Build a single multi-row INSERT for efficiency
  const values: unknown[] = [];
  const placeholders: string[] = [];
  valid.forEach((t, i) => {
    const base = i * 5;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
    );
    values.push(
      contractAddr,
      t.txHash,
      t.sender,
      t.tsSeconds,
      t.success
    );
  });

  const result = await pool.query(
    `INSERT INTO metachain_bridge_tx_log
       (contract_addr, tx_hash, sender, ts_seconds, success)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (contract_addr, tx_hash) DO NOTHING`,
    values
  );
  return result.rowCount ?? 0;
}

/** Top-up phase: walk from page 1 until we hit a stored hash or 30d cutoff. */
async function topUpContract(
  pool: Pool,
  contractAddr: string,
  cutoffTs: number
): Promise<{ pagesScanned: number; inserted: number }> {
  let totalInserted = 0;
  let pagesScanned = 0;

  for (let page = 1; page <= TOP_UP_MAX_PAGES; page++) {
    const rows = await fetchPage(contractAddr, page);
    if (rows === null || rows.length === 0) break;
    pagesScanned++;

    // Check which of these hashes we already have (page-level dedup check)
    const hashes = rows.map((r) => r.txHash).filter(Boolean);
    if (hashes.length === 0) break;

    const { rows: existing } = await pool.query<{ tx_hash: string }>(
      `SELECT tx_hash FROM metachain_bridge_tx_log
        WHERE contract_addr = $1 AND tx_hash = ANY($2::text[])`,
      [contractAddr, hashes]
    );
    const existingSet = new Set(existing.map((r) => r.tx_hash));

    const newRows = rows.filter((r) => !existingSet.has(r.txHash));
    const inserted = await insertBatch(pool, contractAddr, newRows);
    totalInserted += inserted;

    // If entire page is already stored, we're caught up
    if (newRows.length === 0) break;
    // If we've walked past the window, stop
    if (rows.some((r) => r.tsSeconds < cutoffTs)) break;
  }

  return { pagesScanned, inserted: totalInserted };
}

/**
 * Backfill phase: walk deeper into history from next_page.
 * Returns whether the contract is now fully backfilled.
 *
 * Design note: we accumulate all rows from the chunk into a single
 * array and issue ONE parameterized multi-row INSERT at the end.
 * The previous version called insertBatch per-page (up to 200 DB
 * round-trips per chunk) which blew the Hobby 10s cap. Single-shot
 * insert with ~1000 rows fits comfortably under the Postgres
 * parameter limit (5000 vs 65535 cap).
 */
async function backfillContract(
  pool: Pool,
  contractAddr: string,
  cutoffTs: number
): Promise<{
  pagesScanned: number;
  inserted: number;
  isBackfilled: boolean;
  newNextPage: number;
  newOldestTs: number | null;
}> {
  const { rows: stateRows } = await pool.query<{ next_page: number }>(
    `SELECT next_page FROM metachain_bridge_backfill WHERE contract_addr = $1`,
    [contractAddr]
  );
  const startPage = stateRows[0]?.next_page ?? 1;

  const pageResults = await fetchPagesParallel(
    contractAddr,
    startPage,
    CHUNK_PAGES
  );

  let pagesActuallyFetched = 0;
  let hitCutoff = false;
  let hitEndOfHistory = false;
  let oldestTs: number | null = null;
  const allRows: RawTx[] = [];

  for (let i = 0; i < pageResults.length; i++) {
    const rows = pageResults[i];
    if (rows === null) {
      // Failed page — don't advance past it. Break so next run retries.
      break;
    }
    pagesActuallyFetched++;

    if (rows.length === 0) {
      // End of contract history
      hitEndOfHistory = true;
      break;
    }

    allRows.push(...rows);

    const pageOldest = Math.min(...rows.map((r) => r.tsSeconds));
    if (oldestTs === null || pageOldest < oldestTs) oldestTs = pageOldest;

    if (rows.some((r) => r.tsSeconds < cutoffTs)) {
      hitCutoff = true;
      break;
    }
  }

  // Single-shot multi-row INSERT for the whole chunk.
  const inserted = await insertBatch(pool, contractAddr, allRows);

  const isBackfilled = hitCutoff || hitEndOfHistory;
  const newNextPage = startPage + pagesActuallyFetched;

  return {
    pagesScanned: pagesActuallyFetched,
    inserted,
    isBackfilled,
    newNextPage,
    newOldestTs: oldestTs,
  };
}

async function runForContract(pool: Pool, contractAddr: string): Promise<void> {
  const cutoffTs = windowCutoffTs();

  // Always do the top-up (catches new activity since last run)
  const topUp = await topUpContract(pool, contractAddr, cutoffTs);

  // Check backfill state
  const { rows } = await pool.query<{ is_backfilled: boolean }>(
    `SELECT is_backfilled FROM metachain_bridge_backfill WHERE contract_addr = $1`,
    [contractAddr]
  );
  const isBackfilled = rows[0]?.is_backfilled ?? false;

  let backfillResult = {
    pagesScanned: 0,
    inserted: 0,
    isBackfilled: true,
    newNextPage: 0,
    newOldestTs: null as number | null,
  };

  if (!isBackfilled) {
    backfillResult = await backfillContract(pool, contractAddr, cutoffTs);
  }

  // Update backfill state
  await pool.query(
    `UPDATE metachain_bridge_backfill SET
        next_page = CASE WHEN $2 THEN next_page ELSE $3 END,
        is_backfilled = is_backfilled OR $2,
        oldest_ts_seen = COALESCE(LEAST(oldest_ts_seen, $4), $4, oldest_ts_seen),
        last_run_at = NOW(),
        last_run_pages_scanned = $5,
        last_run_txs_inserted = $6
      WHERE contract_addr = $1`,
    [
      contractAddr,
      backfillResult.isBackfilled,
      backfillResult.newNextPage || 1,
      backfillResult.newOldestTs,
      topUp.pagesScanned + backfillResult.pagesScanned,
      topUp.inserted + backfillResult.inserted,
    ]
  );

  // Cleanup rows older than 30d
  await pool.query(
    `DELETE FROM metachain_bridge_tx_log
       WHERE contract_addr = $1 AND ts_seconds < $2`,
    [contractAddr, cutoffTs]
  );
}

/**
 * Run participant tally maintenance across all bridge contracts.
 * Contracts run in parallel — total wall time ≈ max(per-contract time).
 * Errors on one contract don't halt the others.
 */
export async function runParticipantsMaintenance(pool: Pool): Promise<void> {
  await ensureBridgeLogSchema(pool);
  await Promise.allSettled(
    ALL_BRIDGE_CONTRACTS.map((addr) => runForContract(pool, addr))
  );
}
