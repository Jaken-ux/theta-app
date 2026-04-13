/**
 * Fetches total daily Metachain transaction count by replicating the
 * exact logic used by Theta's official explorer "Theta Metachain
 * Transaction History" chart.
 *
 * The official chart sums /api/transactions/history across:
 *   - main chain (explorer-api.thetatoken.org)
 *   - each registered subchain's explorer API
 *
 * Source: decompiled explorer.thetatoken.org app.js, getTransactionHistory()
 * in the "tfuel" dashboard component. It iterates L.chainInfo.subchains and
 * adds each subchain's daily tx count to the main chain's daily tx count.
 *
 * We use the same endpoints — so "Total Metachain activity" matches what
 * users see on the official explorer.
 */

interface TotalMetachainResult {
  totalDailyTxs: number | null;
  source: string | null;
  perChain?: Record<string, number>;
}

// Same subchain list used by the official explorer's chart.
const SUBCHAIN_APIS = [
  { id: "tsub68967", name: "TPulse" },
  { id: "tsub360890", name: "Lavita" },
  { id: "tsub7734", name: "Passaways" },
  { id: "tsub47683", name: "Grove" },
];

const MAIN_CHAIN_API = "https://explorer-api.thetatoken.org/api";
const HISTORY_PATH = "/transactions/history?limitNumber=3";

async function fetchLatestTxCount(baseUrl: string): Promise<number | null> {
  try {
    const res = await fetch(`${baseUrl}${HISTORY_PATH}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json: {
      body?: {
        data?: { number: number; timestamp: string }[];
      };
    } = await res.json();
    const rows = json?.body?.data ?? [];
    if (rows.length === 0) return null;
    // /transactions/history returns entries keyed by day-start UTC
    // timestamps, newest first. Row 0 is the most recent full day.
    const sorted = [...rows].sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );
    return sorted[0]?.number ?? null;
  } catch {
    return null;
  }
}

async function fetchDailyTxSeries(
  baseUrl: string,
  days: number
): Promise<Map<string, number>> {
  try {
    const res = await fetch(
      `${baseUrl}/transactions/history?limitNumber=${days + 1}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return new Map();
    const json: {
      body?: { data?: { number: number; timestamp: string }[] };
    } = await res.json();
    const rows = json?.body?.data ?? [];
    const map = new Map<string, number>();
    for (const r of rows) {
      const day = new Date(Number(r.timestamp) * 1000)
        .toISOString()
        .slice(0, 10);
      map.set(day, r.number);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Last-N-days series of total Metachain daily txs (main chain + subchains),
 * aggregated from the same /transactions/history endpoints as the coverage
 * widget. Oldest → newest; null for days where no source returned data.
 */
export async function fetchTotalMetachainTxsHistory(
  days = 7
): Promise<{ date: string; total: number | null }[]> {
  const allUrls = [
    MAIN_CHAIN_API,
    ...SUBCHAIN_APIS.map(
      (sc) => `https://${sc.id}-explorer-api.thetatoken.org/api`
    ),
  ];
  const maps = await Promise.all(
    allUrls.map((u) => fetchDailyTxSeries(u, days))
  );

  const allDays = new Set<string>();
  for (const m of maps) for (const d of m.keys()) allDays.add(d);
  const sortedDays = [...allDays].sort().slice(-days);

  return sortedDays.map((date) => {
    let sum = 0;
    let anyPresent = false;
    for (const m of maps) {
      const v = m.get(date);
      if (typeof v === "number") {
        sum += v;
        anyPresent = true;
      }
    }
    return { date, total: anyPresent ? sum : null };
  });
}

export async function fetchTotalMetachainTxs(): Promise<TotalMetachainResult> {
  const perChain: Record<string, number> = {};

  // Main chain
  const mainCount = await fetchLatestTxCount(MAIN_CHAIN_API);
  if (mainCount !== null) perChain["main-chain"] = mainCount;

  // Each subchain — in parallel
  const subchainResults = await Promise.all(
    SUBCHAIN_APIS.map(async (sc) => {
      const url = `https://${sc.id}-explorer-api.thetatoken.org/api`;
      const n = await fetchLatestTxCount(url);
      return { id: sc.id, count: n };
    })
  );
  for (const { id, count } of subchainResults) {
    if (count !== null) perChain[id] = count;
  }

  const total = Object.values(perChain).reduce((s, n) => s + n, 0);

  if (total === 0) {
    console.log("[metachain-total] All endpoints returned 0 or failed");
    return { totalDailyTxs: null, source: null };
  }

  console.log(
    `[metachain-total] Official /transactions/history sum = ${total}`,
    perChain
  );

  return {
    totalDailyTxs: total,
    source: "explorer-api.thetatoken.org/api/transactions/history (aggregated)",
    perChain,
  };
}
