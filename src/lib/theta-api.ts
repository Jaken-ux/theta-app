const EXPLORER_API = "https://explorer-api.thetatoken.org/api";

export interface PriceData {
  id: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
}

export interface StakeData {
  totalAmount: number; // in whole tokens (not wei)
  totalNodes: number;
  type: "theta" | "tfuel";
}

export interface SupplyData {
  totalSupply: number;
  circulatingSupply: number;
}

export interface NetworkStats {
  thetaPrice: PriceData;
  tfuelPrice: PriceData;
  thetaStake: StakeData;
  tfuelStake: StakeData;
  tfuelSupply: SupplyData;
  tfuelStakingRatio: number;
  thetaStakingRatio: number;
}

// Convert wei (18 decimals) to whole tokens
function weiToToken(wei: string): number {
  // Take first digits to avoid BigInt issues, divide by 1e18
  const num = BigInt(wei);
  return Number(num / BigInt(1e12)) / 1e6;
}

export async function fetchPrices(): Promise<PriceData[]> {
  const res = await fetch(`${EXPLORER_API}/price/all`, { next: { revalidate: 60 } });
  const json = await res.json();
  return json.body.map((item: Record<string, unknown>) => ({
    id: item._id as string,
    price: item.price as number,
    marketCap: item.market_cap as number,
    volume24h: item.volume_24h as number,
    circulatingSupply: item.circulating_supply as number,
  }));
}

export async function fetchStake(type: "theta" | "tfuel"): Promise<StakeData> {
  const url = type === "tfuel"
    ? `${EXPLORER_API}/stake/totalAmount?type=tfuel`
    : `${EXPLORER_API}/stake/totalAmount`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const json = await res.json();
  return {
    totalAmount: weiToToken(json.body.totalAmount),
    totalNodes: json.body.totalNodes,
    type,
  };
}

export async function fetchTfuelSupply(): Promise<SupplyData> {
  const res = await fetch(`${EXPLORER_API}/supply/tfuel`, { next: { revalidate: 60 } });
  const json = await res.json();
  return {
    totalSupply: json.total_supply,
    circulatingSupply: json.circulation_supply,
  };
}

export interface ActivitySnapshot {
  estimatedDailyTxs: number;
  userTxRate: number; // % of blocks with user txs
  totalNodes: number;
  tfuelVolume24h: number;
  thetaStakingRatio: number;
  tfuelStakingRatio: number;
  thetaPrice: number;
  tfuelPrice: number;
  thetaMarketCap: number;
  tfuelCirculatingSupply: number;
  dailyBlocks: number;
  validatorGuardianNodes: number;
  edgeNodes: number;
}

/**
 * Fetch real transaction counts from the explorer API and sample
 * recent blocks for wallet-activity ratio.
 *
 * Uses /transactions/number/24 for accurate 24h tx count (main chain).
 * Uses /blocks/top_blocks for wallet activity % (blocks with user txs).
 */
export async function fetchActivitySnapshot(
  stats: NetworkStats
): Promise<ActivitySnapshot> {
  const [txCountRes, blocksRes, blockCountRes] = await Promise.all([
    fetch(`${EXPLORER_API}/transactions/number/24`, { next: { revalidate: 60 } }),
    fetch(`${EXPLORER_API}/blocks/top_blocks?pageNumber=1&limit=1000`, { next: { revalidate: 60 } }),
    fetch(`${EXPLORER_API}/blocks/number/24`, { next: { revalidate: 60 } }),
  ]);

  const txCountJson = await txCountRes.json();
  const dailyTxs = txCountJson?.body?.total_num_tx ?? 0;

  const blocksJson = await blocksRes.json();
  const blocks: { num_txs: number }[] = blocksJson.body ?? [];
  const total = blocks.length || 1;
  const withUserTx = blocks.filter((b) => b.num_txs > 1).length;
  const userTxRate = (withUserTx / total) * 100;

  const blockCountJson = await blockCountRes.json();
  const dailyBlocks = blockCountJson?.body?.total_num_block ?? 0;

  return {
    estimatedDailyTxs: dailyTxs,
    userTxRate,
    totalNodes: stats.thetaStake.totalNodes + stats.tfuelStake.totalNodes,
    tfuelVolume24h: stats.tfuelPrice.volume24h,
    thetaStakingRatio: stats.thetaStakingRatio,
    tfuelStakingRatio: stats.tfuelStakingRatio,
    thetaPrice: stats.thetaPrice.price,
    tfuelPrice: stats.tfuelPrice.price,
    thetaMarketCap: stats.thetaPrice.marketCap,
    tfuelCirculatingSupply: stats.tfuelSupply.circulatingSupply,
    dailyBlocks,
    validatorGuardianNodes: stats.thetaStake.totalNodes,
    edgeNodes: stats.tfuelStake.totalNodes,
  };
}

export async function fetchEurRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    const data = await res.json();
    return data.rates?.EUR ?? 0.92;
  } catch {
    return 0.92; // fallback
  }
}

export async function fetchNetworkStats(): Promise<NetworkStats> {
  const [prices, thetaStake, tfuelStake, tfuelSupply] = await Promise.all([
    fetchPrices(),
    fetchStake("theta"),
    fetchStake("tfuel"),
    fetchTfuelSupply(),
  ]);

  const thetaPrice = prices.find((p) => p.id === "THETA")!;
  const tfuelPrice = prices.find((p) => p.id === "TFUEL")!;

  const thetaStakingRatio = (thetaStake.totalAmount / 1_000_000_000) * 100;
  const tfuelStakingRatio = (tfuelStake.totalAmount / tfuelSupply.circulatingSupply) * 100;

  return {
    thetaPrice,
    tfuelPrice,
    thetaStake,
    tfuelStake,
    tfuelSupply,
    thetaStakingRatio,
    tfuelStakingRatio,
  };
}
