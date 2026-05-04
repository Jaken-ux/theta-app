import Card from "./Card";
import SimplifyThis from "./SimplifyThis";
import type { TdropData } from "../lib/tdrop";

function formatUsd(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function formatUsdCompact(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatChange(pct: number | null): { text: string; color: string } {
  if (pct === null) return { text: "—", color: "text-theta-muted" };
  const sign = pct >= 0 ? "+" : "";
  const color = pct >= 0 ? "text-emerald-400" : "text-red-400";
  return { text: `${sign}${pct.toFixed(2)}% 24h`, color };
}

function formatCount(n: number | null): string {
  if (n === null) return "—";
  return Math.round(n).toLocaleString();
}

export default function TdropSection({ data }: { data: TdropData | null }) {
  const change = formatChange(data?.change24h ?? null);

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-2">TDROP</h2>
      <p className="text-sm text-theta-muted mb-4 max-w-2xl">
        As of April 2026, every dollar spent on Theta EdgeCloud GPU compute
        earns 5% back in TDROP automatically. TDROP is also accepted as direct
        payment for EdgeCloud services, and holders can stake TDROP to earn
        rewards through 2030.
      </p>

      {data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <p className="text-sm text-theta-muted mb-1">TDROP Price</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {formatUsd(data.priceUsd)}
            </p>
            <p className={`text-xs mt-1 ${change.color}`}>{change.text}</p>
          </Card>

          <Card>
            <p className="text-sm text-theta-muted mb-1">Market Cap</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {formatUsdCompact(data.marketCapUsd)}
            </p>
            <p className="text-xs text-theta-muted mt-1">
              Per CoinGecko · circulating-based
            </p>
          </Card>

          <Card>
            <p className="text-sm text-theta-muted mb-1">Total Supply</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {formatCount(data.totalSupply)}
            </p>
            <p className="text-xs text-theta-muted mt-1">TDROP minted on-chain</p>
          </Card>

          <Card>
            <p className="text-sm text-theta-muted mb-1">
              24h Transfer Activity
            </p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {formatCount(data.transferCount24h)}
            </p>
            <p className="text-xs text-theta-muted mt-1">
              on-chain transactions
            </p>
          </Card>

          <Card>
            <p className="text-sm text-theta-muted mb-1">Staking APY</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              ~{data.stakingApy.apyPct.toFixed(1)}%
            </p>
            <p className="text-xs text-amber-400/80 mt-1">
              Manually updated · as of {data.stakingApy.asOf}
            </p>
          </Card>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-theta-muted">
            TDROP data is temporarily unavailable.
          </p>
        </Card>
      )}

      <p className="text-xs text-theta-muted mt-4 max-w-2xl">
        Price, supply, and transfer counts come straight from on-chain sources.
        EdgeCloud rebate distributions and spend volumes are not publicly
        available.
      </p>

      <SimplifyThis>
        TDROP is a separate token from THETA and TFUEL. It started as the
        rewards token for ThetaDrop (Theta&apos;s NFT marketplace) but now does
        double duty: it powers Theta&apos;s AI agent economy, and as of April
        2026 you also earn 5% back in TDROP on every dollar you spend on
        Theta EdgeCloud GPU compute. You can stake TDROP to earn more TDROP,
        similar to how you stake THETA to earn TFUEL — staking rewards are
        scheduled to continue through 2030. Because there is no public API for
        the TDROP staking pool yet, the APY shown above is maintained by hand
        — check{" "}
        <a
          href="https://www.thetadrop.com/stake"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2AB8E6] hover:underline"
        >
          thetadrop.com/stake
        </a>{" "}
        for the live number.
      </SimplifyThis>
    </section>
  );
}
