export interface TdropData {
  priceUsd: number | null;
  marketCapUsd: number | null;
  change24h: number | null;
  stakingApy: {
    apyPct: number;
    asOf: string;
    note: string;
  };
  source: string;
  fetchedAt: string;
}

// Kept in sync with /api/tdrop/route.ts — the page calls the fetcher directly
// during SSR so we don't pay for an extra self-request.
const STAKING_APY_PCT = 5.0;
const STAKING_APY_AS_OF = "April 2026";

export async function fetchTdropData(): Promise<TdropData> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=thetadrop&vs_currencies=usd&include_24hr_change=true&include_market_cap=true",
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  const data = await res.json();
  const tdrop = data?.thetadrop ?? {};

  return {
    priceUsd: tdrop.usd ?? null,
    marketCapUsd: tdrop.usd_market_cap ?? null,
    change24h: tdrop.usd_24h_change ?? null,
    stakingApy: {
      apyPct: STAKING_APY_PCT,
      asOf: STAKING_APY_AS_OF,
      note: "Manually updated. No public API for TDROP 2.0 staking APY.",
    },
    source: "CoinGecko",
    fetchedAt: new Date().toISOString(),
  };
}
