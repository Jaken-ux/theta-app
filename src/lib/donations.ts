import { getPool } from "./db";

// Public donation addresses (mirrored from src/components/DonationAddresses.tsx).
// One on the Theta mainnet (THETA + TFUEL), one on Ethereum (ETH + ERC-20).
const THETA_ADDRESS = "0x6F467D4f1315dFA388A7CB7DECD2eE7B1c6Ca826".toLowerCase();
const ETH_ADDRESS = "0x3C1EE15BE75C5933d0b2f7431567424603C9763b".toLowerCase();

// Theta mainnet uses 18-decimal "wei" too, same convention as Ethereum.
const THETA_DECIMALS = 18;
const ETH_DECIMALS = 18;

// ERC-20 tokens we care about on Ethereum mainnet. Decimals matter:
// USDC/USDT are 6, not 18 like ETH. Wrong decimals = wrong amount.
const ERC20_TOKENS: Record<string, { symbol: string; decimals: number; coingeckoId: string }> = {
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    symbol: "USDC",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": {
    symbol: "USDT",
    decimals: 6,
    coingeckoId: "tether",
  },
};

// CoinGecko IDs for the native coins we'll see incoming.
const COINGECKO_NATIVE: Record<string, string> = {
  THETA: "theta-token",
  TFUEL: "theta-fuel",
  ETH: "ethereum",
};

interface DonationEvent {
  chain: "theta" | "ethereum";
  txHash: string;
  fromAddress: string;
  tokenSymbol: string;
  amountDisplay: number;
  amountRaw: string;
  blockNumber: number;
  occurredAt: Date;
}

/**
 * Convert a wei-style integer string to a human-readable number using
 * the token's decimal count. e.g. ("1000000000000000000", 18) → 1.0.
 * Returns a number; precision loss above ~1e15 isn't a concern for the
 * donation-tracking use case where amounts are small.
 */
function fromWei(rawAmount: string, decimals: number): number {
  if (!rawAmount || rawAmount === "0") return 0;
  // BigInt math, then divide by 10^decimals as a number. This keeps
  // integer precision in the wei → human conversion. Iterative
  // multiplication instead of `**` because the project's TS target
  // is below es2016 and bigint exponentiation isn't allowed there.
  const raw = BigInt(rawAmount);
  let divisor = BigInt(1);
  for (let i = 0; i < decimals; i++) divisor = divisor * BigInt(10);
  const whole = Number(raw / divisor);
  const fractional = Number(raw % divisor) / Number(divisor);
  return whole + fractional;
}

/**
 * Fetch current USD price for a token from CoinGecko. Returns null if
 * the price can't be retrieved — we still log the donation, just
 * without a USD value attached. No retries; the cron will catch the
 * next pricing window 30 min later.
 */
async function fetchUsdPrice(coingeckoId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[coingeckoId]?.usd ?? null;
  } catch {
    return null;
  }
}

/**
 * Poll the Theta mainnet explorer API for transactions where the
 * donation address is the recipient. The explorer endpoint shape
 * isn't formally documented — we go through accounttx with type=2
 * (regular transactions). Errors are swallowed so a Theta-side
 * outage doesn't break the whole cron run.
 */
async function fetchThetaIncoming(): Promise<DonationEvent[]> {
  try {
    // Pull last 50 transactions touching the address. We don't paginate
    // because the cron runs every 30 min — anything older than 50 tx
    // ago is older than several days for a low-volume address.
    const res = await fetch(
      `https://explorer-api.thetatoken.org/api/accounttx/${THETA_ADDRESS}?type=2&pageNumber=1&limitNumber=50&isEqualType=true`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const body = data?.body;
    if (!Array.isArray(body)) return [];

    const events: DonationEvent[] = [];
    for (const tx of body) {
      // We only care about transfers where the donation address is the
      // RECEIVER. Theta transactions can be type=2 (Send) or type=0
      // (Coinbase). Send type has an `outputs` array.
      if (tx?.type !== 2) continue;
      const txData = tx?.data;
      const outputs = txData?.outputs;
      if (!Array.isArray(outputs)) continue;

      for (const out of outputs) {
        const recipient = (out?.address ?? "").toLowerCase();
        if (recipient !== THETA_ADDRESS) continue;

        // Coins object: { thetawei, tfuelwei } — both as string-numbers.
        const thetaWei = out?.coins?.thetawei ?? "0";
        const tfuelWei = out?.coins?.tfuelwei ?? "0";

        if (thetaWei !== "0") {
          events.push({
            chain: "theta",
            txHash: tx.hash,
            fromAddress: txData?.inputs?.[0]?.address ?? "unknown",
            tokenSymbol: "THETA",
            amountDisplay: fromWei(thetaWei, THETA_DECIMALS),
            amountRaw: thetaWei,
            blockNumber: parseInt(tx.block_height ?? "0", 10),
            occurredAt: new Date(Number(tx.timestamp) * 1000),
          });
        }
        if (tfuelWei !== "0") {
          events.push({
            chain: "theta",
            txHash: tx.hash,
            fromAddress: txData?.inputs?.[0]?.address ?? "unknown",
            tokenSymbol: "TFUEL",
            amountDisplay: fromWei(tfuelWei, THETA_DECIMALS),
            amountRaw: tfuelWei,
            blockNumber: parseInt(tx.block_height ?? "0", 10),
            occurredAt: new Date(Number(tx.timestamp) * 1000),
          });
        }
      }
    }
    return events;
  } catch (err) {
    console.error("[donations] Theta poll failed:", err);
    return [];
  }
}

/**
 * Poll Etherscan for native ETH transfers + ERC-20 transfers (USDC, USDT)
 * to the donation address. Requires ETHERSCAN_API_KEY env var; if
 * missing we log a warning and return empty so the cron run can
 * still log Theta-side donations.
 */
async function fetchEthereumIncoming(): Promise<DonationEvent[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.warn(
      "[donations] ETHERSCAN_API_KEY not set — skipping Ethereum poll"
    );
    return [];
  }

  const events: DonationEvent[] = [];

  // 1. Native ETH transfers.
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${ETH_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data?.status === "1" && Array.isArray(data.result)) {
      for (const tx of data.result) {
        // Only incoming + non-zero value + not a contract failure.
        if ((tx.to ?? "").toLowerCase() !== ETH_ADDRESS) continue;
        if (tx.value === "0" || !tx.value) continue;
        if (tx.isError === "1") continue;

        events.push({
          chain: "ethereum",
          txHash: tx.hash,
          fromAddress: tx.from,
          tokenSymbol: "ETH",
          amountDisplay: fromWei(tx.value, ETH_DECIMALS),
          amountRaw: tx.value,
          blockNumber: parseInt(tx.blockNumber, 10),
          occurredAt: new Date(parseInt(tx.timeStamp, 10) * 1000),
        });
      }
    }
  } catch (err) {
    console.error("[donations] Etherscan native poll failed:", err);
  }

  // 2. ERC-20 transfers (USDC, USDT). One Etherscan call returns all
  // ERC-20 transfers in or out — we filter to incoming + known tokens.
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokentx&address=${ETH_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data?.status === "1" && Array.isArray(data.result)) {
      for (const tx of data.result) {
        if ((tx.to ?? "").toLowerCase() !== ETH_ADDRESS) continue;
        const contractAddr = (tx.contractAddress ?? "").toLowerCase();
        const tokenInfo = ERC20_TOKENS[contractAddr];
        if (!tokenInfo) continue; // unknown token; skip

        events.push({
          chain: "ethereum",
          txHash: tx.hash,
          fromAddress: tx.from,
          tokenSymbol: tokenInfo.symbol,
          amountDisplay: fromWei(tx.value, tokenInfo.decimals),
          amountRaw: tx.value,
          blockNumber: parseInt(tx.blockNumber, 10),
          occurredAt: new Date(parseInt(tx.timeStamp, 10) * 1000),
        });
      }
    }
  } catch (err) {
    console.error("[donations] Etherscan token poll failed:", err);
  }

  return events;
}

/**
 * Look up USD prices for the symbols in this batch — one CoinGecko call
 * per unique symbol, cached in-memory for the duration of the cron run.
 * For stablecoins (USDC, USDT) we hardcode 1.0 to avoid a network call.
 */
async function priceLookup(symbols: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  for (const sym of symbols) {
    if (sym === "USDC" || sym === "USDT") {
      result.set(sym, 1.0);
      continue;
    }
    const id = COINGECKO_NATIVE[sym];
    if (!id) continue;
    const price = await fetchUsdPrice(id);
    if (price !== null) result.set(sym, price);
  }
  return result;
}

/**
 * Public entry point. Polls both chains, inserts any new tx rows into
 * the donations table, returns counts so the cron route can log how
 * many were caught this run. UNIQUE (chain, tx_hash) means re-runs are
 * safe — duplicates fall through ON CONFLICT DO NOTHING.
 *
 * On the very first run after deploy, the donations table is empty —
 * to avoid back-filling all historical tx as if they were "new
 * donations today," we mark the address's recent history as already
 * seen on first invocation. See FIRST_RUN_CUTOFF logic below.
 */
export async function pollDonations(): Promise<{
  thetaFound: number;
  ethereumFound: number;
  newRows: number;
}> {
  const pool = await getPool();

  // First-run check: if the donations table is empty AND we already
  // see some historical tx on either chain, assume this is the first
  // poll after deploy and skip persisting the historical batch. Only
  // tx that arrive AFTER this first run get tracked. Avoids the
  // "every old tx looks brand new" problem on cold deploy.
  const existing = await pool.query(`SELECT COUNT(*)::int AS n FROM theta_donations`);
  const isFirstRun = existing.rows[0].n === 0;

  const [thetaEvents, ethereumEvents] = await Promise.all([
    fetchThetaIncoming(),
    fetchEthereumIncoming(),
  ]);

  if (isFirstRun && (thetaEvents.length > 0 || ethereumEvents.length > 0)) {
    // Mark all current tx as seen by inserting them with a synthetic
    // marker (seen_at = now, occurred_at = original). Future cron runs
    // will only insert genuinely new tx.
    const markerSet = await persistEvents(
      [...thetaEvents, ...ethereumEvents],
      new Map()
    );
    console.log(
      `[donations] First-run cold-start: marked ${markerSet} historical tx as seen, no notification`
    );
    return {
      thetaFound: thetaEvents.length,
      ethereumFound: ethereumEvents.length,
      newRows: 0, // we don't count cold-start as "new"
    };
  }

  // Normal run — fetch USD prices for the symbols we see.
  const uniqueSymbols = Array.from(
    new Set([...thetaEvents, ...ethereumEvents].map((e) => e.tokenSymbol))
  );
  const prices = await priceLookup(uniqueSymbols);

  const newRows = await persistEvents([...thetaEvents, ...ethereumEvents], prices);

  return {
    thetaFound: thetaEvents.length,
    ethereumFound: ethereumEvents.length,
    newRows,
  };
}

/**
 * Insert events to the table, skipping duplicates. Returns count of
 * rows actually inserted (i.e. genuinely new transactions).
 */
async function persistEvents(
  events: DonationEvent[],
  prices: Map<string, number>
): Promise<number> {
  if (events.length === 0) return 0;
  const pool = await getPool();
  let inserted = 0;

  for (const event of events) {
    const usdPrice = prices.get(event.tokenSymbol);
    const usdValue =
      usdPrice !== undefined ? event.amountDisplay * usdPrice : null;

    const result = await pool.query(
      `INSERT INTO theta_donations
         (chain, tx_hash, from_address, token_symbol, amount_display,
          amount_raw, usd_value_at_time, block_number, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (chain, tx_hash) DO NOTHING`,
      [
        event.chain,
        event.txHash,
        event.fromAddress,
        event.tokenSymbol,
        event.amountDisplay,
        event.amountRaw,
        usdValue,
        event.blockNumber,
        event.occurredAt,
      ]
    );
    if ((result.rowCount ?? 0) > 0) inserted++;
  }

  return inserted;
}

/**
 * Read recent donations for the admin dashboard. Returns the N most
 * recent, with chain + amount + USD value + tx_hash for the explorer
 * link in the UI.
 */
export interface AdminDonation {
  chain: "theta" | "ethereum";
  txHash: string;
  fromAddress: string;
  tokenSymbol: string;
  amountDisplay: number;
  usdValueAtTime: number | null;
  occurredAt: string;
}

export async function getRecentDonations(limit = 20): Promise<{
  recent: AdminDonation[];
  totalCount: number;
  totalUsdLifetime: number;
}> {
  const pool = await getPool();

  const [recentRes, totalsRes] = await Promise.all([
    pool.query(
      `SELECT chain, tx_hash, from_address, token_symbol, amount_display,
              usd_value_at_time, occurred_at
       FROM theta_donations
       ORDER BY occurred_at DESC
       LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(usd_value_at_time), 0)::float AS total_usd
       FROM theta_donations`
    ),
  ]);

  return {
    recent: recentRes.rows.map((r) => ({
      chain: r.chain,
      txHash: r.tx_hash,
      fromAddress: r.from_address,
      tokenSymbol: r.token_symbol,
      amountDisplay: Number(r.amount_display),
      usdValueAtTime: r.usd_value_at_time !== null ? Number(r.usd_value_at_time) : null,
      occurredAt: r.occurred_at.toISOString(),
    })),
    totalCount: totalsRes.rows[0].count,
    totalUsdLifetime: totalsRes.rows[0].total_usd,
  };
}
