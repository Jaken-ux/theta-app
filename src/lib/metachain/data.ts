import { fetchAllChains, getRegisteredChains } from "./registry";
import { fetchTotalMetachainTxs } from "./total-txs";
import { fetchTfuelEconomics } from "../tfuel-economics";
import { getPool } from "../db";
import type { Pool } from "pg";

/**
 * Metachain time-series schema:
 *
 *   metachain_chains       — registered chain metadata (slowly changing)
 *   metachain_metrics      — per-chain daily metrics (time series)
 *   metachain_daily_scores — aggregated composite score per day
 *
 * Coverage confidence = (available chain weight / total weight) * 100
 * This allows partial ecosystem coverage — if a chain goes offline,
 * the composite still works with reduced confidence.
 */

let schemaInitialized = false;

async function ensureSchema(pool: Pool) {
  if (schemaInitialized) return;

  // Chain registry — tracks known chains and when they were first/last seen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_chains (
      chain_id TEXT PRIMARY KEY,
      chain_name TEXT NOT NULL,
      description TEXT,
      weight DOUBLE PRECISION NOT NULL DEFAULT 1,
      first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
      last_seen DATE NOT NULL DEFAULT CURRENT_DATE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);

  // Per-chain daily metrics — one row per chain per day
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_metrics (
      chain_id TEXT NOT NULL,
      date DATE NOT NULL,
      score DOUBLE PRECISION NOT NULL DEFAULT 0,
      tx_count_24h INTEGER DEFAULT 0,
      volume_24h DOUBLE PRECISION,
      active_wallets INTEGER,
      custom_metrics JSONB DEFAULT '{}',
      available BOOLEAN NOT NULL DEFAULT TRUE,
      samples INTEGER NOT NULL DEFAULT 1,
      total_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      PRIMARY KEY (chain_id, date)
    )
  `);

  // Daily aggregated composite score
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_daily_scores (
      date DATE PRIMARY KEY,
      composite_score DOUBLE PRECISION NOT NULL,
      chain_count INTEGER NOT NULL DEFAULT 0,
      chains_available INTEGER NOT NULL DEFAULT 0,
      coverage_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
      samples INTEGER NOT NULL DEFAULT 1,
      total_score DOUBLE PRECISION NOT NULL DEFAULT 0
    )
  `);

  // TFUEL economics columns (legacy — kept for back-compat, no longer used)
  await pool
    .query(
      `ALTER TABLE metachain_daily_scores
       ADD COLUMN IF NOT EXISTS daily_burn DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS daily_issuance DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS net_inflation DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS burn_samples INTEGER DEFAULT 0,
       ADD COLUMN IF NOT EXISTS total_burn DOUBLE PRECISION DEFAULT 0`
    )
    .catch(() => {});

  // TFUEL economics — locked-in yesterday values (one row per UTC day).
  // We compute once when a new day is first observed and never update,
  // so the displayed numbers stay stable across the entire day.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metachain_burn_daily (
      date DATE PRIMARY KEY,
      daily_burn DOUBLE PRECISION NOT NULL,
      daily_issuance DOUBLE PRECISION NOT NULL,
      net_inflation DOUBLE PRECISION NOT NULL,
      total_daily_txs INTEGER,
      avg_fee_per_tx DOUBLE PRECISION,
      break_even_txs BIGINT,
      computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Migrate old metachain_history data if it exists
  try {
    const { rows } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'metachain_history'
      )
    `);
    if (rows[0].exists) {
      await pool.query(`
        INSERT INTO metachain_daily_scores (date, composite_score, chain_count, chains_available, coverage_pct, samples, total_score)
        SELECT date, composite_score, chain_count, chain_count, 100, samples, total_score
        FROM metachain_history
        ON CONFLICT (date) DO NOTHING
      `);
    }
  } catch {
    // Migration failed silently — old table may not exist
  }

  schemaInitialized = true;
}

/**
 * Fetch live data from all chain adapters, save to DB, return with history.
 * Used by both the API route and the server-side page prefetch.
 */
export async function fetchMetachainData() {
  const pool = await getPool();
  await ensureSchema(pool);

  // Fetch live data from all adapters
  const result = await fetchAllChains();
  const today = new Date().toISOString().slice(0, 10);

  // Compute coverage confidence
  const totalWeight = result.chains.reduce((s, c) => s + c.weight, 0);
  const availableWeight = result.chains
    .filter((c) => c.available)
    .reduce((s, c) => s + c.weight, 0);
  const coveragePct =
    totalWeight > 0 ? Math.round((availableWeight / totalWeight) * 100) : 0;

  // Save chain registry (upsert)
  for (const chain of result.chains) {
    await pool.query(
      `INSERT INTO metachain_chains (chain_id, chain_name, description, weight, first_seen, last_seen, is_active)
       VALUES ($1, $2, $3, $4, $5, $5, $6)
       ON CONFLICT (chain_id) DO UPDATE SET
         chain_name = $2,
         weight = $4,
         last_seen = $5,
         is_active = $6`,
      [chain.chainId, chain.chainName, "", chain.weight, today, chain.available]
    );
  }

  // Save per-chain daily metrics (running average per chain per day)
  for (const chain of result.chains) {
    await pool.query(
      `INSERT INTO metachain_metrics
         (chain_id, date, score, tx_count_24h, volume_24h, active_wallets, custom_metrics, available, samples, total_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $3)
       ON CONFLICT (chain_id, date) DO UPDATE SET
         samples = metachain_metrics.samples + 1,
         total_score = metachain_metrics.total_score + $3,
         score = (metachain_metrics.total_score + $3) / (metachain_metrics.samples + 1),
         tx_count_24h = $4,
         volume_24h = $5,
         active_wallets = $6,
         custom_metrics = $7,
         available = $8`,
      [
        chain.chainId,
        today,
        chain.score,
        chain.metrics.txCount24h,
        chain.metrics.volume24h ?? null,
        chain.metrics.activeWallets ?? null,
        JSON.stringify(chain.metrics.custom ?? {}),
        chain.available,
      ]
    );
  }

  // Calculate 7-day momentum for proxy-indicators
  const proxyChain = result.chains.find((c) => c.chainId === "proxy-indicators");
  if (proxyChain?.available && proxyChain.metrics.custom) {
    try {
      const { rows: prevRows } = await pool.query(
        `SELECT custom_metrics FROM metachain_metrics
         WHERE chain_id = 'proxy-indicators'
           AND date <= CURRENT_DATE - INTERVAL '6 days'
         ORDER BY date DESC LIMIT 1`
      );
      if (prevRows.length > 0) {
        const prev = prevRows[0].custom_metrics;
        const cur = proxyChain.metrics.custom;
        proxyChain.metrics.custom.subchainDelta =
          (cur.subchainCount ?? 0) - (prev.subchainCount ?? 0);
        proxyChain.metrics.custom.crossChainDelta =
          (cur.crossChainTxs ?? 0) - (prev.crossChainTxs ?? 0);
        proxyChain.metrics.custom.collateralDelta =
          (cur.collateralActivity ?? 0) - (prev.collateralActivity ?? 0);
        proxyChain.metrics.custom.hasMomentum = 1;
      }
    } catch {
      // No historical data yet — deltas unavailable
    }
  }

  // Fetch total metachain txs from official explorer (needed for TFUEL
  // economics below as well as the coverage widget).
  const totalMetachain = await fetchTotalMetachainTxs();

  // TFUEL economics — locked-in approach.
  //
  // Yesterday's burn is computed ONCE (the first time anyone loads the
  // page on a new UTC day) and stored in metachain_burn_daily. Every
  // subsequent request returns the stored value, so the number is
  // perfectly stable across the entire day.
  //
  // Yesterday's tx counts come from /transactions/history (which is
  // the final number for that day). Yesterday's fee comes from a
  // current sample taken at lock-in time — accurate enough since
  // Theta gas prices are stable.
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  let tfuelEconomics: Awaited<ReturnType<typeof fetchTfuelEconomics>>;
  try {
    const cached = await pool.query(
      `SELECT daily_burn, daily_issuance, net_inflation, total_daily_txs,
              avg_fee_per_tx, break_even_txs
       FROM metachain_burn_daily WHERE date = $1`,
      [yesterday]
    );
    if (cached.rows.length > 0) {
      const row = cached.rows[0];
      tfuelEconomics = {
        dailyIssuance: Number(row.daily_issuance),
        dailyBurn: Number(row.daily_burn),
        netInflation: Number(row.net_inflation),
        avgFeePerTxTfuel:
          row.avg_fee_per_tx != null ? Number(row.avg_fee_per_tx) : null,
        breakEvenTxs:
          row.break_even_txs != null ? Number(row.break_even_txs) : null,
        totalDailyTxs:
          row.total_daily_txs != null ? Number(row.total_daily_txs) : null,
      };
    } else {
      // First load on a new UTC day — compute and lock in.
      tfuelEconomics = await fetchTfuelEconomics(
        totalMetachain.totalDailyTxs,
        totalMetachain.perChain
      );
      if (tfuelEconomics.dailyBurn != null) {
        await pool.query(
          `INSERT INTO metachain_burn_daily
             (date, daily_burn, daily_issuance, net_inflation,
              total_daily_txs, avg_fee_per_tx, break_even_txs)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (date) DO NOTHING`,
          [
            yesterday,
            tfuelEconomics.dailyBurn,
            tfuelEconomics.dailyIssuance,
            tfuelEconomics.netInflation,
            tfuelEconomics.totalDailyTxs,
            tfuelEconomics.avgFeePerTxTfuel,
            tfuelEconomics.breakEvenTxs,
          ]
        );
      }
    }
  } catch (e) {
    // If the cache table is unavailable, fall back to a fresh compute
    console.error("[burn-cache] read/write failed, falling back:", e);
    tfuelEconomics = await fetchTfuelEconomics(
      totalMetachain.totalDailyTxs,
      totalMetachain.perChain
    );
  }

  // Save daily composite score (running average). Burn is stored
  // separately in metachain_burn_daily (locked-in once per day).
  await pool.query(
    `INSERT INTO metachain_daily_scores
       (date, composite_score, chain_count, chains_available, coverage_pct, samples, total_score)
     VALUES ($1, $2, $3, $4, $5, 1, $2)
     ON CONFLICT (date) DO UPDATE SET
       samples = metachain_daily_scores.samples + 1,
       total_score = metachain_daily_scores.total_score + $2,
       composite_score = (metachain_daily_scores.total_score + $2) / (metachain_daily_scores.samples + 1),
       chain_count = $3,
       chains_available = $4,
       coverage_pct = $5`,
    [
      today,
      result.compositeScore,
      result.chainCount,
      result.chains.filter((c) => c.available).length,
      coveragePct,
    ]
  );

  // Fetch composite history (last 90 days)
  const { rows: history } = await pool.query(
    `SELECT date, composite_score, chain_count, chains_available, coverage_pct
     FROM metachain_daily_scores
     ORDER BY date DESC
     LIMIT 90`
  );

  // Fetch per-chain history (last 30 days, all chains)
  const { rows: chainHistory } = await pool.query(
    `SELECT chain_id, date, score, tx_count_24h, available
     FROM metachain_metrics
     WHERE date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY date DESC`
  );

  // Group chain history by chain_id
  const chainHistoryMap: Record<
    string,
    { date: string; score: number; txCount24h: number; available: boolean }[]
  > = {};
  for (const row of chainHistory) {
    if (!chainHistoryMap[row.chain_id]) chainHistoryMap[row.chain_id] = [];
    chainHistoryMap[row.chain_id].push({
      date: row.date,
      score: row.score,
      txCount24h: row.tx_count_24h,
      available: row.available,
    });
  }

  // Use the same official source for "we track" — sum of the four
  // tracked subchains from the explorer's history API. This makes
  // both numbers directly comparable (same source, same day).
  // totalMetachain was fetched earlier for TFUEL economics.
  const SUBCHAIN_IDS = ["tsub360890", "tsub68967", "tsub7734", "tsub47683"];
  let trackedSubchainTxs = 0;
  let trackedSubchainCount = 0;
  if (totalMetachain.perChain) {
    for (const id of SUBCHAIN_IDS) {
      const n = totalMetachain.perChain[id];
      if (typeof n === "number" && n > 0) {
        trackedSubchainTxs += n;
        trackedSubchainCount += 1;
      }
    }
  } else {
    // Fallback to adapter-estimated numbers if official history fails
    trackedSubchainTxs = result.chains
      .filter(
        (c) =>
          SUBCHAIN_IDS.includes(c.chainId) &&
          c.available &&
          !c.excludeFromComposite
      )
      .reduce((sum, c) => sum + (c.metrics.txCount24h ?? 0), 0);
    trackedSubchainCount = result.chains.filter(
      (c) =>
        SUBCHAIN_IDS.includes(c.chainId) &&
        c.available &&
        !c.excludeFromComposite
    ).length;
  }

  return {
    current: result,
    registeredChains: getRegisteredChains(),
    coveragePct,
    trackedSubchainTxs,
    trackedSubchainCount,
    totalMetachainTxs: totalMetachain.totalDailyTxs,
    totalMetachainSource: totalMetachain.source,
    tfuelEconomics,
    tfuelEconomicsDate: yesterday,
    history: history.map(
      (r: {
        date: string;
        composite_score: number;
        chain_count: number;
        chains_available: number;
        coverage_pct: number;
      }) => ({
        date: r.date,
        compositeScore: r.composite_score,
        chainCount: r.chain_count,
        chainsAvailable: r.chains_available,
        coveragePct: r.coverage_pct,
      })
    ),
    chainHistory: chainHistoryMap,
  };
}
