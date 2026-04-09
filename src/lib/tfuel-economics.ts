/**
 * TFUEL economics — burn rate vs issuance tracker.
 *
 * DAILY ISSUANCE (known protocol constant):
 *   Block time = 6 seconds → 14,400 blocks/day
 *   Rewards per block = 86 TFUEL (38 TFUEL staking + 48 THETA staking)
 *   Daily issuance = 14,400 × 86 = 1,238,400 TFUEL / day
 *   Source: Theta protocol spec.
 *
 * DAILY BURN (estimated from chain data):
 *   Per-chain approach — much more accurate than whole-metachain sampling.
 *
 *   For each chain we know its daily tx count (from /transactions/history,
 *   same source as Theta's official explorer chart). To convert txs into
 *   burned TFUEL we need an average fee per transaction on that chain.
 *
 *   We sample recent transactions via /transactions/range across multiple
 *   pages (pagination is required — the endpoint caps results at ~10 txs
 *   per request). For each sampled tx we compute:
 *     fee = receipt.GasUsed × data.gas_price    (in TFuelWei)
 *   and then:
 *     avgFeePerTx_chain = sum(fees) / count(txs)
 *     dailyBurn_chain   = avgFeePerTx_chain × dailyTxs_chain
 *
 *   Total daily burn = sum of per-chain daily burns.
 *
 *   LIMITATIONS:
 *   - Sample is small (~200 txs per chain)
 *   - Sample reflects current activity mix, not a full 24h average
 *   - Does not include non-gas fees (currently none on Theta)
 *   - Main chain has mostly type-0 proposer txs with zero fee, so its
 *     avg fee is near zero — main chain burn is essentially negligible
 *     and dominated by subchain smart-contract activity
 *
 * NET = dailyBurn − dailyIssuance
 *   Positive = deflationary (more burned than created)
 *   Negative = inflationary (more created than burned — current state)
 */

const BLOCK_TIME_SECONDS = 6;
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS); // 14,400
const TFUEL_PER_BLOCK = 86;
export const DAILY_ISSUANCE = BLOCKS_PER_DAY * TFUEL_PER_BLOCK; // 1,238,400

const WEI_PER_TFUEL = 1e18;

/** Number of /transactions/range pages to sample per chain. Each page
 *  returns up to 10 txs, so 50 pages ≈ 500 txs per chain. Larger samples
 *  reduce volatility caused by bursts of high- or low-fee activity. */
const PAGES_TO_SAMPLE = 50;

const BURN_CHAINS: { id: string; baseUrl: string }[] = [
  {
    id: "main-chain",
    baseUrl: "https://explorer-api.thetatoken.org/api",
  },
  {
    id: "tsub68967",
    baseUrl: "https://tsub68967-explorer-api.thetatoken.org/api",
  },
  {
    id: "tsub360890",
    baseUrl: "https://tsub360890-explorer-api.thetatoken.org/api",
  },
  {
    id: "tsub7734",
    baseUrl: "https://tsub7734-explorer-api.thetatoken.org/api",
  },
  {
    id: "tsub47683",
    baseUrl: "https://tsub47683-explorer-api.thetatoken.org/api",
  },
];

interface TxShape {
  type?: number;
  data?: {
    gas_price?: string | number;
  };
  receipt?: {
    GasUsed?: number | string;
  } | null;
}

function computeTxFeeWei(tx: TxShape): number {
  const gp = Number(tx?.data?.gas_price ?? 0);
  const gu = Number(tx?.receipt?.GasUsed ?? 0);
  if (!Number.isFinite(gp) || !Number.isFinite(gu)) return 0;
  return gu * gp;
}

interface ChainSample {
  sumFeeWei: number;
  sampledTxs: number;
  txsWithFee: number;
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

async function sampleChainFees(baseUrl: string): Promise<ChainSample | null> {
  // Fetch the first N pages in parallel
  const pages = await Promise.all(
    Array.from({ length: PAGES_TO_SAMPLE }, (_, i) =>
      fetchPage(baseUrl, i + 1)
    )
  );

  let sumFeeWei = 0;
  let sampledTxs = 0;
  let txsWithFee = 0;

  for (const page of pages) {
    if (!page) continue;
    for (const tx of page) {
      sampledTxs += 1;
      const fee = computeTxFeeWei(tx);
      if (fee > 0) {
        sumFeeWei += fee;
        txsWithFee += 1;
      }
    }
  }

  if (sampledTxs === 0) return null;
  return { sumFeeWei, sampledTxs, txsWithFee };
}

export interface TfuelEconomics {
  dailyIssuance: number;
  dailyBurn: number | null;
  netInflation: number | null;
  avgFeePerTxTfuel: number | null;
  breakEvenTxs: number | null;
  totalDailyTxs: number | null;
  perChain?: Record<
    string,
    {
      dailyTxs: number;
      sampledTxs: number;
      txsWithFee: number;
      avgFeePerTxTfuel: number;
      dailyBurnTfuel: number;
    }
  >;
}

/**
 * Compute daily burn using per-chain tx counts and per-chain fee sampling.
 *
 * @param totalDailyTxs total daily txs across metachain (for net calc)
 * @param perChainDailyTxs per-chain daily tx counts from /transactions/history
 */
export async function fetchTfuelEconomics(
  totalDailyTxs: number | null,
  perChainDailyTxs?: Record<string, number>
): Promise<TfuelEconomics> {
  const base: TfuelEconomics = {
    dailyIssuance: DAILY_ISSUANCE,
    dailyBurn: null,
    netInflation: null,
    avgFeePerTxTfuel: null,
    breakEvenTxs: null,
    totalDailyTxs,
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

  const perChain: TfuelEconomics["perChain"] = {};
  let totalDailyBurn = 0;
  let totalSumFeeWei = 0;
  let totalSampledTxs = 0;

  for (const { id, sample } of samples) {
    const dailyTxs = perChainDailyTxs[id] ?? 0;
    if (!sample || sample.sampledTxs === 0 || dailyTxs === 0) continue;

    const avgFeePerTxWei = sample.sumFeeWei / sample.sampledTxs;
    const avgFeePerTxTfuel = avgFeePerTxWei / WEI_PER_TFUEL;
    const dailyBurnTfuel = avgFeePerTxTfuel * dailyTxs;

    perChain[id] = {
      dailyTxs,
      sampledTxs: sample.sampledTxs,
      txsWithFee: sample.txsWithFee,
      avgFeePerTxTfuel,
      dailyBurnTfuel,
    };

    totalDailyBurn += dailyBurnTfuel;
    totalSumFeeWei += sample.sumFeeWei;
    totalSampledTxs += sample.sampledTxs;
  }

  if (totalSampledTxs === 0) return base;

  const avgFeePerTxTfuel =
    totalSumFeeWei / totalSampledTxs / WEI_PER_TFUEL;
  const netInflation = totalDailyBurn - DAILY_ISSUANCE;
  const breakEvenTxs =
    avgFeePerTxTfuel > 0
      ? Math.round(DAILY_ISSUANCE / avgFeePerTxTfuel)
      : null;

  console.log(
    `[tfuel-economics] per-chain burn:`,
    Object.entries(perChain).map(
      ([id, c]) =>
        `${id}: ${c.sampledTxs}txs sampled, ${c.txsWithFee} w/ fee, ` +
        `avg=${c.avgFeePerTxTfuel.toExponential(3)} TFUEL, ` +
        `burn=${c.dailyBurnTfuel.toFixed(2)} TFUEL/day`
    )
  );
  console.log(
    `[tfuel-economics] TOTAL dailyBurn=${totalDailyBurn.toFixed(
      2
    )} issuance=${DAILY_ISSUANCE} net=${netInflation.toFixed(
      2
    )} breakEven=${breakEvenTxs}`
  );

  return {
    dailyIssuance: DAILY_ISSUANCE,
    dailyBurn: totalDailyBurn,
    netInflation,
    avgFeePerTxTfuel,
    breakEvenTxs,
    totalDailyTxs,
    perChain,
  };
}
