import { getPool } from "../db";

const ETH_RPC = "https://eth-rpc-api.thetatoken.org/rpc";
const CHAIN_REGISTRAR = "0xb164c26fd7970746639151a8C118cce282F272A7";

// Subchain IDs we already have full adapters for — no need to monitor.
const TRACKED_IDS = new Set([
  "tsub360890", // Lavita
  "tsub68967",  // TPulse
  "tsub7734",   // Passaways
  "tsub47683",  // Grove
  "tsub9065",   // POGS
]);

export interface MonitoredSubchain {
  subchainId: string;
  firstSeen: string;
  explorerActive: boolean;
  explorerFirstActive: string | null;
  lastChecked: string;
  dailyTxs: number;
  totalTxs: number;
}

async function ethCall(data: string): Promise<string> {
  const res = await fetch(ETH_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: CHAIN_REGISTRAR, data }, "latest"],
      id: 1,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json();
  return json.result ?? "0x";
}

async function getRegisteredSubchainIds(): Promise<string[]> {
  // getAllSubchainIDs() selector: 0x13b38499
  const result = await ethCall("0x13b38499");
  if (result.length < 130) return [];

  const hex = result.slice(2); // strip 0x
  const count = parseInt(hex.slice(64, 128), 16);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const start = 128 + i * 64;
    const val = parseInt(hex.slice(start, start + 64), 16);
    ids.push(`tsub${val}`);
  }
  return ids;
}

async function probeExplorer(
  subchainId: string
): Promise<{ active: boolean; dailyTxs: number; totalTxs: number }> {
  const id = subchainId.replace("tsub", "");
  const baseUrl = `https://tsub${id}-explorer-api.thetatoken.org/api`;

  try {
    const [txRes, blocksRes] = await Promise.all([
      fetch(`${baseUrl}/transactions/number`, {
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${baseUrl}/blocks/top_blocks?pageNumber=1&limit=10`, {
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (!txRes.ok || !blocksRes.ok) return { active: false, dailyTxs: 0, totalTxs: 0 };

    const txJson = await txRes.json();
    const totalTxs: number = txJson?.body?.total_num_tx ?? 0;

    const blocksJson = await blocksRes.json();
    const blocks: { num_txs: number; timestamp: string }[] = blocksJson?.body ?? [];

    if (blocks.length < 2) return { active: false, dailyTxs: 0, totalTxs: 0 };

    const newestTs = Number(blocks[0].timestamp);
    const oldestTs = Number(blocks[blocks.length - 1].timestamp);
    const span = Math.abs(newestTs - oldestTs);
    const nowSec = Math.floor(Date.now() / 1000);
    const isRecent = nowSec - newestTs < 86400;

    if (!isRecent || span === 0) return { active: false, dailyTxs: 0, totalTxs: totalTxs };

    const txsInSpan = blocks.reduce((s, b) => s + (b.num_txs ?? 0), 0);
    const dailyTxs = Math.round((txsInSpan / span) * 86400);

    return { active: true, dailyTxs, totalTxs };
  } catch {
    return { active: false, dailyTxs: 0, totalTxs: 0 };
  }
}

let monitorSchemaReady = false;

async function ensureMonitorSchema() {
  if (monitorSchemaReady) return;
  const pool = await getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS theta_subchain_monitor (
      subchain_id TEXT PRIMARY KEY,
      first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
      explorer_active BOOLEAN NOT NULL DEFAULT FALSE,
      explorer_first_active DATE,
      last_checked DATE NOT NULL DEFAULT CURRENT_DATE,
      daily_txs INTEGER DEFAULT 0,
      total_txs BIGINT DEFAULT 0
    )
  `);
  monitorSchemaReady = true;
}

/**
 * Check the ChainRegistrar for all subchain IDs, probe their explorer APIs,
 * and persist the results. Returns newly-active subchains (explorer came
 * online since last check).
 */
export async function checkForNewSubchains(): Promise<MonitoredSubchain[]> {
  await ensureMonitorSchema();
  const pool = await getPool();
  const today = new Date().toISOString().slice(0, 10);

  let registeredIds: string[];
  try {
    registeredIds = await getRegisteredSubchainIds();
  } catch {
    return [];
  }

  const untracked = registeredIds.filter((id) => !TRACKED_IDS.has(id));
  const newlyActive: MonitoredSubchain[] = [];

  for (const subchainId of untracked) {
    const probe = await probeExplorer(subchainId);

    // Check if this was previously inactive
    const { rows: existing } = await pool.query(
      `SELECT explorer_active FROM theta_subchain_monitor WHERE subchain_id = $1`,
      [subchainId]
    );
    const wasActive = existing.length > 0 && existing[0].explorer_active;

    await pool.query(
      `INSERT INTO theta_subchain_monitor
         (subchain_id, first_seen, explorer_active, explorer_first_active, last_checked, daily_txs, total_txs)
       VALUES ($1, $2, $3, $4, $2, $5, $6)
       ON CONFLICT (subchain_id) DO UPDATE SET
         explorer_active = $3,
         explorer_first_active = CASE
           WHEN theta_subchain_monitor.explorer_first_active IS NULL AND $3 = TRUE THEN $2
           ELSE theta_subchain_monitor.explorer_first_active
         END,
         last_checked = $2,
         daily_txs = $5,
         total_txs = $6`,
      [
        subchainId,
        today,
        probe.active,
        probe.active ? today : null,
        probe.dailyTxs,
        probe.totalTxs,
      ]
    );

    if (probe.active && !wasActive) {
      newlyActive.push({
        subchainId,
        firstSeen: today,
        explorerActive: true,
        explorerFirstActive: today,
        lastChecked: today,
        dailyTxs: probe.dailyTxs,
        totalTxs: probe.totalTxs,
      });
    }
  }

  return newlyActive;
}

/** Fetch all monitored (untracked) subchains from DB. */
export async function getMonitoredSubchains(): Promise<MonitoredSubchain[]> {
  await ensureMonitorSchema();
  const pool = await getPool();
  const { rows } = await pool.query(
    `SELECT subchain_id, first_seen, explorer_active, explorer_first_active,
            last_checked, daily_txs, total_txs
     FROM theta_subchain_monitor
     ORDER BY explorer_active DESC, total_txs DESC`
  );
  return rows.map((r) => ({
    subchainId: r.subchain_id,
    firstSeen: r.first_seen?.toISOString?.()?.slice(0, 10) ?? r.first_seen,
    explorerActive: r.explorer_active,
    explorerFirstActive: r.explorer_first_active
      ? r.explorer_first_active?.toISOString?.()?.slice(0, 10) ?? r.explorer_first_active
      : null,
    lastChecked: r.last_checked?.toISOString?.()?.slice(0, 10) ?? r.last_checked,
    dailyTxs: r.daily_txs ?? 0,
    totalTxs: Number(r.total_txs ?? 0),
  }));
}
