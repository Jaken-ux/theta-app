/**
 * TFUEL economics — burn rate vs issuance tracker.
 *
 * DAILY ISSUANCE (protocol constant):
 *   14,400 blocks/day × 86 TFUEL/block = 1,238,400 TFUEL/day
 *
 * DAILY BURN (estimated range):
 *   We separate two independent measurements:
 *     1. Average fee per type-7 (smart contract) tx — stable, since
 *        gas_price is constant (100M wei) and GasUsed varies only by
 *        contract complexity.
 *     2. Type-7 ratio — what fraction of daily txs are fee-bearing
 *        smart contract calls vs fee-free proposer blocks.
 *
 *   burnEstimate = avgFeePerType7Tx × type7Ratio × dailyTxs
 *
 *   We report a RANGE by applying ±50% on the type-7 ratio (the
 *   noisiest component). The avgFee is stable once we have enough
 *   type-7 samples.
 *
 * NOTE: At current activity levels (April 2026), total daily burn is
 * likely under 5 TFUEL — negligible compared to 1.24M issuance.
 */

const BLOCK_TIME_SECONDS = 6;
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

const WEI_PER_TFUEL = 1e18;

const PAGES_TO_SAMPLE = 50;

const BURN_CHAINS: { id: string; baseUrl: string }[] = [
  { id: "main-chain", baseUrl: "https://explorer-api.thetatoken.org/api" },
  { id: "tsub68967", baseUrl: "https://tsub68967-explorer-api.thetatoken.org/api" },
  { id: "tsub360890", baseUrl: "https://tsub360890-explorer-api.thetatoken.org/api" },
  { id: "tsub7734", baseUrl: "https://tsub7734-explorer-api.thetatoken.org/api" },
  { id: "tsub47683", baseUrl: "https://tsub47683-explorer-api.thetatoken.org/api" },
];

interface TxShape {
  type?: number;
  data?: { gas_price?: string | number };
  receipt?: { GasUsed?: number | string } | null;
}

function computeTxFeeWei(tx: TxShape): number {
  const gp = Number(tx?.data?.gas_price ?? 0);
  const gu = Number(tx?.receipt?.GasUsed ?? 0);
  if (!Number.isFinite(gp) || !Number.isFinite(gu)) return 0;
  return gu * gp;
}

async function fetchPage(
  baseUrl: string,
  page: number
): Promise<TxShape[] | null> {
  try {
    const res = await fetch(
      `${baseUrl}/transactions/range?pageNumber=${page}&limitNumber=100`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.body ?? []) as TxShape[];
  } catch {
    return null;
  }
}

interface ChainFeeSample {
  totalTxs: number;
  type7Txs: number;
  type7Fees: number[]; // individual fee values in TFUEL
  type7Ratio: number;
  avgFeePerType7: number; // TFUEL
}

async function sampleChainFees(baseUrl: string): Promise<ChainFeeSample | null> {
  const pages = await Promise.all(
    Array.from({ length: PAGES_TO_SAMPLE }, (_, i) =>
      fetchPage(baseUrl, i + 1)
    )
  );

  let totalTxs = 0;
  let type7Txs = 0;
  const type7Fees: number[] = [];

  for (const page of pages) {
    if (!page) continue;
    for (const tx of page) {
      totalTxs += 1;
      if (tx.type === 7) {
        type7Txs += 1;
        const feeWei = computeTxFeeWei(tx);
        if (feeWei > 0) {
          type7Fees.push(feeWei / WEI_PER_TFUEL);
        }
      }
    }
  }

  if (totalTxs === 0) return null;

  const type7Ratio = totalTxs > 0 ? type7Txs / totalTxs : 0;
  const avgFeePerType7 =
    type7Fees.length > 0
      ? type7Fees.reduce((s, f) => s + f, 0) / type7Fees.length
      : 0;

  return {
    totalTxs,
    type7Txs,
    type7Fees,
    type7Ratio,
    avgFeePerType7,
  };
}

export interface TfuelEconomics {
  dailyIssuance: number;
  burnLow: number | null;
  burnHigh: number | null;
  burnMid: number | null;
  netInflation: number | null;
  breakEvenTxs: number | null;
  totalDailyTxs: number | null;
  type7Ratio: number | null;
  avgFeePerType7Tfuel: number | null;
  type7SamplesTotal: number | null;
}

export async function fetchTfuelEconomics(
  totalDailyTxs: number | null,
  perChainDailyTxs?: Record<string, number>
): Promise<TfuelEconomics> {
  const base: TfuelEconomics = {
    dailyIssuance: DAILY_ISSUANCE,
    burnLow: null,
    burnHigh: null,
    burnMid: null,
    netInflation: null,
    breakEvenTxs: null,
    totalDailyTxs,
    type7Ratio: null,
    avgFeePerType7Tfuel: null,
    type7SamplesTotal: null,
  };

  if (!perChainDailyTxs || Object.keys(perChainDailyTxs).length === 0) {
    return base;
  }

  const samples = await Promise.all(
    BURN_CHAINS.map(async (c) => ({
      id: c.id,
      sample: await sampleChainFees(c.baseUrl),
    }))
  );

  // Aggregate per-chain burn using each chain's own type-7 ratio
  // and fee average, weighted by that chain's daily tx count.
  let totalBurnMid = 0;
  let totalBurnLow = 0;
  let totalBurnHigh = 0;
  let totalType7Samples = 0;
  let allType7Fees: number[] = [];
  let weightedType7Ratio = 0;
  let totalDailyTxsUsed = 0;

  for (const { id, sample } of samples) {
    const dailyTxs = perChainDailyTxs[id] ?? 0;
    if (!sample || sample.totalTxs === 0 || dailyTxs === 0) continue;

    const ratio = sample.type7Ratio;
    const avgFee = sample.avgFeePerType7;

    // Mid estimate: sampled ratio × avgFee × dailyTxs
    const chainBurnMid = ratio * avgFee * dailyTxs;
    // Low: ratio × 0.5 (conservative — fewer type-7 than sampled)
    const chainBurnLow = ratio * 0.5 * avgFee * dailyTxs;
    // High: ratio × 1.5 (more type-7 than sampled)
    const chainBurnHigh = Math.min(ratio * 1.5, 1) * avgFee * dailyTxs;

    totalBurnMid += chainBurnMid;
    totalBurnLow += chainBurnLow;
    totalBurnHigh += chainBurnHigh;
    totalType7Samples += sample.type7Txs;
    allType7Fees = allType7Fees.concat(sample.type7Fees);
    weightedType7Ratio += ratio * dailyTxs;
    totalDailyTxsUsed += dailyTxs;

    console.log(
      `[tfuel-economics] ${id}: ${sample.totalTxs} sampled, ` +
        `${sample.type7Txs} type-7 (${(ratio * 100).toFixed(1)}%), ` +
        `avgFee=${avgFee.toExponential(3)} TFUEL, ` +
        `burn=${chainBurnLow.toFixed(4)}–${chainBurnHigh.toFixed(4)} TFUEL/day`
    );
  }

  if (totalDailyTxsUsed === 0 || allType7Fees.length === 0) return base;

  const globalType7Ratio = weightedType7Ratio / totalDailyTxsUsed;
  const globalAvgFee =
    allType7Fees.reduce((s, f) => s + f, 0) / allType7Fees.length;

  const netInflation = totalBurnMid - DAILY_ISSUANCE;
  const breakEvenTxs =
    globalAvgFee > 0 && globalType7Ratio > 0
      ? Math.round(DAILY_ISSUANCE / (globalAvgFee * globalType7Ratio))
      : null;

  console.log(
    `[tfuel-economics] TOTAL burn range: ${totalBurnLow.toFixed(
      2
    )}–${totalBurnHigh.toFixed(2)} TFUEL/day (mid: ${totalBurnMid.toFixed(
      2
    )}), type7ratio=${(globalType7Ratio * 100).toFixed(
      1
    )}%, ${totalType7Samples} type-7 sampled, breakEven=${breakEvenTxs}`
  );

  return {
    dailyIssuance: DAILY_ISSUANCE,
    burnLow: totalBurnLow,
    burnHigh: totalBurnHigh,
    burnMid: totalBurnMid,
    netInflation,
    breakEvenTxs,
    totalDailyTxs,
    type7Ratio: globalType7Ratio,
    avgFeePerType7Tfuel: globalAvgFee,
    type7SamplesTotal: totalType7Samples,
  };
}
