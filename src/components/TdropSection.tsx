import Card from "./Card";
import SimplifyThis from "./SimplifyThis";
import type { TdropData } from "../lib/tdrop";

function formatUsd(n: number | null, digits = 6): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(digits)}`;
}

function formatChange(pct: number | null): { text: string; color: string } {
  if (pct === null) return { text: "—", color: "text-theta-muted" };
  const sign = pct >= 0 ? "+" : "";
  const color = pct >= 0 ? "text-emerald-400" : "text-red-400";
  return { text: `${sign}${pct.toFixed(2)}% 24h`, color };
}

export default function TdropSection({ data }: { data: TdropData | null }) {
  const change = formatChange(data?.change24h ?? null);

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-2">
        TDROP — AI Agent Economy Token
      </h2>
      <p className="text-sm text-theta-muted mb-4 max-w-2xl">
        TDROP powers Theta&apos;s AI agent economy. Holders can stake TDROP to
        earn rewards through 2030 following the TDROP 2.0 governance proposal.
        TDROP is also accepted as payment on Theta EdgeCloud.
      </p>

      {data ? (
        <div className="grid sm:grid-cols-3 gap-4">
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
              {formatUsd(data.marketCapUsd, 2)}
            </p>
            <p className="text-xs text-theta-muted mt-1">
              Circulating supply × price
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

      <SimplifyThis>
        TDROP is a separate token from THETA and TFUEL. It started as the
        rewards token for ThetaDrop (Theta&apos;s NFT marketplace) but has
        grown into the token for Theta&apos;s AI agent economy — think small
        autonomous programs that pay each other in TDROP to get things done.
        You can stake TDROP to earn more TDROP, similar to how you stake THETA
        to earn TFUEL. The staking rewards are scheduled to continue through
        2030. Because there is no public API for the TDROP staking pool yet,
        the APY shown above is maintained by hand — check{" "}
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
