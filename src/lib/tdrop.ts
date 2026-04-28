/**
 * Unified TDROP data fetcher used by /earn.
 *
 * Four signals, parallelised with Promise.allSettled so any single
 * source going down still renders partial data:
 *   1. Price + 24h change — CoinGecko free API
 *   2. Total supply — Theta ETH-RPC totalSupply() on the TNT20 contract.
 *      This is total minted, not circulating; CoinGecko reports a lower
 *      circulating figure that excludes locked/treasury holdings.
 *   3. 24h transfer activity — Theta explorer accounttx pagination
 *   4. Staking APY — manually maintained constant (no public API yet)
 */

const TDROP_CONTRACT = "0x1336739B05C7Ab8a526D40DCC0d04a826b5f8B03";
const ETH_RPC = "https://eth-rpc-api.thetatoken.org/rpc";
const EXPLORER_API = "https://explorer-api.thetatoken.org/api";
const TDROP_DECIMALS = 18;
const TOTAL_SUPPLY_SELECTOR = "0x18160ddd";

// Explorer returns ~10 items per page regardless of `limit`. A typical
// 24h window has well under 100 transactions on this contract, so cap
// the loop at 20 pages (~200 tx) as a safety guard.
const MAX_EXPLORER_PAGES = 20;

const STAKING_APY_PCT = 5.0;
const STAKING_APY_AS_OF = "April 2026";

export interface TdropData {
  priceUsd: number | null;
  change24h: number | null;
  /** CoinGecko market cap (uses CoinGecko's circulating supply, not on-chain totalSupply). */
  marketCapUsd: number | null;
  totalSupply: number | null;
  transferCount24h: number | null;
  stakingApy: {
    apyPct: number;
    asOf: string;
    note: string;
  };
  fetchedAt: string;
}

async function fetchPriceAndChange(): Promise<{
  price: number | null;
  change: number | null;
  marketCap: number | null;
}> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=thetadrop&vs_currencies=usd&include_24hr_change=true&include_market_cap=true",
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  const data = await res.json();
  const t = data?.thetadrop ?? {};
  return {
    price: typeof t.usd === "number" ? t.usd : null,
    change: typeof t.usd_24h_change === "number" ? t.usd_24h_change : null,
    marketCap: typeof t.usd_market_cap === "number" ? t.usd_market_cap : null,
  };
}

async function fetchTotalSupply(): Promise<number | null> {
  const res = await fetch(ETH_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: TDROP_CONTRACT, data: TOTAL_SUPPLY_SELECTOR }, "latest"],
      id: 1,
    }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`ETH RPC returned ${res.status}`);
  const json = await res.json();
  if (typeof json.result !== "string" || json.result === "0x") return null;

  // Divide by 10^(decimals - 6) as BigInt to keep precision, then
  // convert to JS number and finish the divide. Values up to ~9e15
  // tokens fit safely in Number.
  const wei = BigInt(json.result);
  const SCALE = BigInt("1" + "0".repeat(TDROP_DECIMALS - 6));
  return Number(wei / SCALE) / 1e6;
}

async function fetchTransfers24h(): Promise<number | null> {
  const cutoffSec = Math.floor(Date.now() / 1000) - 86_400;
  let count = 0;

  for (let page = 1; page <= MAX_EXPLORER_PAGES; page++) {
    const res = await fetch(
      `${EXPLORER_API}/accounttx/${TDROP_CONTRACT}?type=-1&pageNumber=${page}&limit=100&isEqualType=false`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`Explorer returned ${res.status}`);
    const json = await res.json();
    const items: { timestamp?: string }[] = json?.body ?? [];
    if (items.length === 0) break;

    let pageHasOld = false;
    for (const item of items) {
      const ts = item.timestamp ? parseInt(item.timestamp, 10) : NaN;
      if (!Number.isFinite(ts)) continue;
      if (ts >= cutoffSec) count++;
      else pageHasOld = true;
    }

    if (pageHasOld) break;
    if (typeof json.totalPageNumber === "number" && page >= json.totalPageNumber) break;
  }

  return count;
}

export async function fetchTdropData(): Promise<TdropData> {
  const [priceRes, supplyRes, transferRes] = await Promise.allSettled([
    fetchPriceAndChange(),
    fetchTotalSupply(),
    fetchTransfers24h(),
  ]);

  return {
    priceUsd: priceRes.status === "fulfilled" ? priceRes.value.price : null,
    change24h: priceRes.status === "fulfilled" ? priceRes.value.change : null,
    marketCapUsd:
      priceRes.status === "fulfilled" ? priceRes.value.marketCap : null,
    totalSupply:
      supplyRes.status === "fulfilled" ? supplyRes.value : null,
    transferCount24h:
      transferRes.status === "fulfilled" ? transferRes.value : null,
    stakingApy: {
      apyPct: STAKING_APY_PCT,
      asOf: STAKING_APY_AS_OF,
      note: "Manually updated. No public API for TDROP 2.0 staking APY.",
    },
    fetchedAt: new Date().toISOString(),
  };
}
