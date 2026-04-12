import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Main Chain Activity Index and Metachain Utilization Index are calculated.",
};

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-12 text-[#D1D5DB] leading-relaxed">
      <header>
        <Link
          href="/"
          className="text-xs text-[#7D8694] hover:text-[#B0B8C4] transition-colors"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Methodology</h1>
        <p className="text-sm text-[#B0B8C4] mt-2">
          How we calculate the indices shown on Theta Simplified. This page
          explains every formula, weight, baseline, and data source — nothing is
          hidden.
        </p>
      </header>

      {/* ── SECTION 1: Main Chain Activity Index ── */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">
          1. Main Chain Activity Index
        </h2>

        <p className="text-sm">
          The Main Chain Activity Index measures observable on-chain activity on
          Theta&apos;s settlement layer. It combines four metrics into a single
          score. The index is uncapped — when the network exceeds its baselines,
          the score goes above 100.
        </p>

        {/* Formula */}
        <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] font-medium mb-3">FORMULA</p>
          <p className="font-mono text-sm text-white">
            index = txScore &times; 0.40 + volumeScore &times; 0.15 +
            walletScore &times; 0.35 + nodeScore &times; 0.10
          </p>
          <p className="text-xs text-[#B0B8C4] mt-3">
            Each component score = (observed value / baseline) &times; 100
          </p>
        </div>

        {/* Components table */}
        <div>
          <p className="text-sm text-white font-medium mb-3">Components</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#2A3548] rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-[#0D1117] text-left text-[#B0B8C4]">
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  <th className="px-4 py-2.5 font-medium">Weight</th>
                  <th className="px-4 py-2.5 font-medium">Baseline (=100)</th>
                  <th className="px-4 py-2.5 font-medium">What it measures</th>
                  <th className="px-4 py-2.5 font-medium">Why this weight</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-white">Daily transactions</td>
                  <td className="px-4 py-2.5 font-mono">40%</td>
                  <td className="px-4 py-2.5 font-mono">42,000</td>
                  <td className="px-4 py-2.5">Main-chain txs in 24h</td>
                  <td className="px-4 py-2.5 text-[#B0B8C4]">
                    Most direct signal of on-chain usage
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-white">TFUEL 24h volume</td>
                  <td className="px-4 py-2.5 font-mono">15%</td>
                  <td className="px-4 py-2.5 font-mono">$12,000,000</td>
                  <td className="px-4 py-2.5">
                    Dollar volume of TFUEL traded in 24h
                  </td>
                  <td className="px-4 py-2.5 text-[#B0B8C4]">
                    Market interest signal; volatile, so lower weight
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-white">Wallet activity</td>
                  <td className="px-4 py-2.5 font-mono">35%</td>
                  <td className="px-4 py-2.5 font-mono">100%</td>
                  <td className="px-4 py-2.5">
                    % of recent blocks containing user transactions
                  </td>
                  <td className="px-4 py-2.5 text-[#B0B8C4]">
                    Shows whether real users are transacting, not just validators
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-white">Staking participants</td>
                  <td className="px-4 py-2.5 font-mono">10%</td>
                  <td className="px-4 py-2.5 font-mono">22,000</td>
                  <td className="px-4 py-2.5">
                    Number of active staking nodes
                  </td>
                  <td className="px-4 py-2.5 text-[#B0B8C4]">
                    Stable metric; changes slowly so lower weight
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier system */}
        <div>
          <p className="text-sm text-white font-medium mb-3">Tier system</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#F59E0B] w-20">0 — 50</span>
              <span className="text-sm text-[#F59E0B] font-medium w-20">Quiet</span>
              <span className="text-xs text-[#B0B8C4]">
                Baseline settlement layer activity — governance, staking, routine transfers
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#2AB8E6] w-20">50 — 100</span>
              <span className="text-sm text-[#2AB8E6] font-medium w-20">Active</span>
              <span className="text-xs text-[#B0B8C4]">
                Increased cross-chain transfers, new subchain registrations, higher TFUEL trading
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#10B981] w-20">100 — 300</span>
              <span className="text-sm text-[#10B981] font-medium w-20">Elevated</span>
              <span className="text-xs text-[#B0B8C4]">
                Sustained high activity — ecosystem growth, heavy bridging, broad staking
              </span>
            </div>
          </div>
        </div>

        {/* Data sources */}
        <div>
          <p className="text-sm text-white font-medium mb-3">Data sources</p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-xs text-[#B0B8C4] font-mono space-y-1">
            <p>Transactions &rarr; explorer-api.thetatoken.org/api/transactions/number/24</p>
            <p>TFUEL volume &rarr; explorer-api.thetatoken.org/api/price/all (volume_24h)</p>
            <p>
              Wallet activity &rarr; explorer-api.thetatoken.org/api/blocks/top_blocks
              (1000 blocks sampled)
            </p>
            <p>Staking nodes &rarr; explorer-api.thetatoken.org/api/stake/totalAmount</p>
          </div>
        </div>

        {/* Known limitations */}
        <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
          <p className="text-sm text-white font-medium mb-2">Known limitations</p>
          <ul className="space-y-1.5 text-xs text-[#D1D5DB] list-disc list-inside">
            <li>
              Baselines are calibrated against April 2026 data and will be
              recalibrated after 30 days of collection.
            </li>
            <li>
              Does not capture subchain activity, video delivery, or AI compute.
            </li>
            <li>
              TFUEL volume is exchange-reported and can be volatile.
            </li>
            <li>
              Wallet activity is sampled from the most recent 1,000 blocks, not
              the full 24h window.
            </li>
          </ul>
        </div>
      </section>

      {/* ── SECTION 2: Metachain Utilization Index ── */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">
          2. Metachain Utilization Index
        </h2>

        <p className="text-sm">
          The Metachain Utilization Index measures real application activity
          across the entire Theta ecosystem — not just the main chain. It
          combines data from 7 sources into one weighted composite score.
        </p>

        {/* Formula */}
        <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-5">
          <p className="text-xs text-[#7D8694] font-medium mb-3">FORMULA</p>
          <p className="font-mono text-sm text-white">
            compositeScore = &Sigma; (chainScore<sub>i</sub> &times; normalizedWeight<sub>i</sub>)
          </p>
          <p className="text-xs text-[#B0B8C4] mt-3">
            Weights are normalized so they always sum to 1. If a chain is
            unavailable, its weight is redistributed among available chains.
          </p>
        </div>

        {/* Chains table */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Chain components
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#2A3548] rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-[#0D1117] text-left text-[#B0B8C4]">
                  <th className="px-4 py-2.5 font-medium">Chain</th>
                  <th className="px-4 py-2.5 font-medium">Weight</th>
                  <th className="px-4 py-2.5 font-medium">Baseline (=100)</th>
                  <th className="px-4 py-2.5 font-medium">What it measures</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-white">Main Chain</td>
                  <td className="px-4 py-2.5 font-mono">1.0</td>
                  <td className="px-4 py-2.5 font-mono">42,000 txs/day</td>
                  <td className="px-4 py-2.5">
                    Settlement layer — staking, governance, cross-chain transfers
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#10B981]">Lavita AI</td>
                  <td className="px-4 py-2.5 font-mono">0.7</td>
                  <td className="px-4 py-2.5 font-mono">100,000 txs/day</td>
                  <td className="px-4 py-2.5">
                    Health AI research and genomics data marketplace
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#8B5CF6]">TPulse</td>
                  <td className="px-4 py-2.5 font-mono">0.7</td>
                  <td className="px-4 py-2.5 font-mono">100,000 txs/day</td>
                  <td className="px-4 py-2.5">
                    EdgeCloud transparency — AI compute job logs and node activity
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#F59E0B]">Passaways</td>
                  <td className="px-4 py-2.5 font-mono">0.5</td>
                  <td className="px-4 py-2.5 font-mono">100,000 txs/day</td>
                  <td className="px-4 py-2.5">
                    PLASM gaming and digital entertainment
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#EF4444]">Grove</td>
                  <td className="px-4 py-2.5 font-mono">0.5</td>
                  <td className="px-4 py-2.5 font-mono">100,000 txs/day</td>
                  <td className="px-4 py-2.5">
                    GroveWars Web3 gaming ecosystem
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548] opacity-60">
                  <td className="px-4 py-2.5 text-[#7D8694]">
                    <span className="line-through">POGS</span>
                    <span className="block text-[10px] text-[#5C6675] mt-0.5 not-italic">
                      excluded — offline since March 2026
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#5C6675]">—</td>
                  <td className="px-4 py-2.5 font-mono text-[#5C6675]">—</td>
                  <td className="px-4 py-2.5 text-[#7D8694]">
                    Digital entertainment and gaming collectibles
                  </td>
                </tr>
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#E879F9]">Ecosystem Growth</td>
                  <td className="px-4 py-2.5 font-mono">0.5</td>
                  <td className="px-4 py-2.5 font-mono">—</td>
                  <td className="px-4 py-2.5">
                    Proxy signals: subchain registrations, cross-chain transfers, collateral activity
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#7D8694] mt-2">
            Raw weights are shown above. At runtime, all weights are normalized
            to sum to 1 (e.g., Main Chain 1.0 / 4.2 total ≈ 23.8%).
          </p>
          <div className="mt-3 bg-[#0D1117] border border-[#2A3548] rounded-lg p-3">
            <p className="text-xs text-[#B0B8C4] leading-relaxed">
              <span className="text-white font-medium">Inactivity exclusion:</span>{" "}
              When a subchain&apos;s most recent block is older than{" "}
              <span className="text-white">30 days</span>, it is flagged as
              offline and removed from the composite score. Its weight is
              redistributed proportionally among the remaining active chains.
              If activity resumes, the chain automatically rejoins the
              composite. POGS is currently excluded under this rule.
            </p>
          </div>
        </div>

        {/* Subchain score calculation */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            How subchain scores are calculated
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 space-y-3 text-sm">
            <p>
              For each subchain, we fetch the 100 most recent blocks and count
              the transactions in them. We then extrapolate to a 24-hour
              estimate:
            </p>
            <div className="font-mono text-xs text-white bg-[#0A0F1C] rounded-lg p-3">
              estimatedDailyTxs = (txsInSample / sampleTimeSpan) &times; 86,400
            </div>
            <p>
              The score is then: (estimatedDailyTxs / 100,000) &times; 100.
              A subchain processing 100K txs/day scores exactly 100.
            </p>
          </div>
        </div>

        {/* Ecosystem Growth proxy */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Ecosystem Growth proxy explained
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 space-y-3 text-sm">
            <p>
              The Ecosystem Growth component uses on-chain proxy signals from
              main-chain contracts to measure multi-chain expansion:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#D1D5DB]">
              <li>
                <span className="text-white">Subchains registered</span> — count
                from ChainRegistrar.getAllSubchainIDs() (baseline: 15, weight: 35%)
              </li>
              <li>
                <span className="text-white">Cross-chain transfers</span> — total
                interactions across 4 Token Bank contracts (baseline: 1,000, weight: 35%)
              </li>
              <li>
                <span className="text-white">ChainRegistrar activity</span> — total
                smart contract interactions on the registrar (baseline: 30,000, weight: 30%)
              </li>
            </ul>
            <p className="text-xs text-[#B0B8C4]">
              These are cumulative counts, not daily. They grow monotonically as
              the ecosystem expands.
            </p>
          </div>
        </div>

        {/* Tier system */}
        <div>
          <p className="text-sm text-white font-medium mb-3">Tier system</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#F59E0B] w-24">0 — 50</span>
              <span className="text-sm text-[#F59E0B] font-medium w-20">Early</span>
              <span className="text-xs text-[#B0B8C4]">
                A handful of subchains active alongside the main chain — foundation in place
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#2AB8E6] w-24">50 — 100</span>
              <span className="text-sm text-[#2AB8E6] font-medium w-20">Growing</span>
              <span className="text-xs text-[#B0B8C4]">
                Multiple subchains consistently active across gaming, AI, and health data
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#10B981] w-24">100 — 250</span>
              <span className="text-sm text-[#10B981] font-medium w-20">Thriving</span>
              <span className="text-xs text-[#B0B8C4]">
                Most subchains exceed baselines, high cross-chain activity, diverse use cases
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#0D1117] rounded-lg px-4 py-2.5">
              <span className="text-xs font-mono text-[#8B5CF6] w-24">250 — 500</span>
              <span className="text-sm text-[#8B5CF6] font-medium w-20">Mature</span>
              <span className="text-xs text-[#B0B8C4]">
                Full-scale multi-chain network — dozens of active subchains, heavy bridging
              </span>
            </div>
          </div>
        </div>

        {/* Known limitations */}
        <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
          <p className="text-sm text-white font-medium mb-2">Known limitations</p>
          <ul className="space-y-1.5 text-xs text-[#D1D5DB] list-disc list-inside">
            <li>
              Cannot distinguish bot transactions from real user activity —
              transaction quality is unknown.
            </li>
            <li>
              POGS has been inactive since March 2026 and is currently excluded
              from the composite score under the 30-day inactivity rule. Its
              weight is redistributed to the remaining active chains.
            </li>
            <li>
              Ecosystem Growth proxy metrics (subchain count, cross-chain
              transfers, ChainRegistrar activity) are cumulative — they only go
              up, never down.
            </li>
            <li>
              Off-chain activity (video delivery via Theta CDN, EdgeCloud GPU
              compute) is not captured.
            </li>
            <li>
              Subchains without public explorer APIs cannot be included.
            </li>
            <li>
              Subchain daily tx estimates are extrapolated from the 100 most
              recent blocks, which may not be representative during low-activity
              periods.
            </li>
          </ul>
        </div>

        {/* Coverage verification */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Coverage verification
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm">
            <p>
              We independently verified our coverage by comparing tracked
              transactions against Theta Explorer&apos;s official transaction
              history endpoint (<span className="font-mono text-xs text-[#B0B8C4]">/transactions/history</span>),
              the same data source used by the official Theta Explorer graphs.
              As of April 2026, our four tracked subchains (Lavita, TPulse,
              Passaways, Grove) represent approximately{" "}
              <span className="text-white font-medium">94%</span> of all
              subchain activity. The remaining ~6% consists of inactive chains
              (POGS) and minor developer/testnet activity. Main chain activity
              is excluded from this comparison as it is tracked separately via
              the Main Chain Activity Index.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TFUEL Economics ── */}
      <section className="space-y-6">
        <h2 id="tfuel-economics" className="text-xl font-semibold text-white">
          3. TFUEL Economics (burn vs issuance)
        </h2>

        <p className="text-sm">
          The TFUEL Economics widget shows whether the network is creating
          more TFUEL than it burns on a given day. It is derived from two
          parts: a protocol constant (daily issuance) and an empirical
          estimate (daily burn).
        </p>

        {/* Daily issuance */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Daily issuance — protocol constant
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-3">
            <p>
              TFUEL is created as block rewards at a fixed rate defined by
              the Theta protocol. This number is a hard constant and does
              not change unless Theta upgrades its protocol.
            </p>
            <div className="font-mono text-xs bg-[#0A0F1C] rounded-lg p-3 text-[#D1D5DB]">
              blocksPerDay = 86,400s / 6s = 14,400
              <br />
              tfuelPerBlock = 86 (38 TFUEL staking + 48 THETA staking)
              <br />
              <span className="text-white">
                dailyIssuance = 14,400 × 86 = 1,238,400 TFUEL / day
              </span>
            </div>
            <p className="text-xs text-[#B0B8C4]">
              Source: Theta protocol block reward specification.
            </p>
          </div>
        </div>

        {/* Daily burn */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Daily burn — range estimate
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-4">
            <p>
              Every transaction on Theta consumes gas, and gas fees are{" "}
              <span className="text-white">permanently burned</span>. We
              estimate daily burn by sampling recent transactions on each
              tracked chain, but critically we{" "}
              <span className="text-white">
                separate fee-bearing transactions (type-7) from fee-free
                transactions (type-0)
              </span>{" "}
              before computing averages.
            </p>

            {/* Why type separation matters */}
            <div className="bg-[#0A0F1C] border border-[#2A3548] rounded-lg p-4 space-y-2">
              <p className="text-xs text-white font-medium">
                Why we separate type-7 from type-0
              </p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                Theta subchains produce two fundamentally different transaction
                types. <span className="text-white">Type-0</span> are block
                proposer transactions — every block has one, they carry no
                user activity and pay no gas fee. They exist purely as part
                of consensus. <span className="text-white">Type-7</span> are
                smart contract interactions — real user activity like gaming
                actions, AI data submissions, or token transfers. These pay
                gas that gets permanently burned.
              </p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                On most subchains, 85–95% of all transactions are type-0
                (fee = 0). If you average fees across all transaction types,
                you get a number dominated by zeros — and that average swings
                wildly depending on how many type-7 happen to land in your
                sample. By measuring the two components separately — the{" "}
                <span className="text-white">average fee per type-7 tx</span>{" "}
                (stable, since gas_price is protocol-fixed at 10⁸ wei) and
                the <span className="text-white">type-7 ratio</span> (what
                fraction of daily txs are fee-bearing) — we get a much more
                reliable estimate.
              </p>
            </div>

            {/* Formula */}
            <div className="font-mono text-xs bg-[#0A0F1C] rounded-lg p-3 text-[#D1D5DB] space-y-1">
              <p className="text-[#7D8694]">
                {/* eslint-disable-next-line */}{'// Step 1: Measure independently per chain'}
              </p>
              <p>
                avgFeePerType7 = Σ(GasUsed × gas_price) / count(type-7 txs)
              </p>
              <p>type7Ratio = count(type-7) / count(all sampled txs)</p>
              <p className="text-[#7D8694] mt-2">
                {/* eslint-disable-next-line */}{'// Step 2: Estimate burn with uncertainty band'}
              </p>
              <p>burnMid = type7Ratio × avgFeePerType7 × chain.dailyTxs</p>
              <p>burnLow = type7Ratio × 0.5 × avgFeePerType7 × chain.dailyTxs</p>
              <p>burnHigh = min(type7Ratio × 1.5, 1) × avgFeePerType7 × chain.dailyTxs</p>
              <p className="text-white mt-2">
                dailyBurn = Σ chainBurn across all tracked chains (low–mid–high)
              </p>
            </div>

            <p className="text-xs text-[#B0B8C4]">
              We sample up to 50 pages (~500 transactions) per chain via
              the <span className="font-mono">/transactions/range</span>{" "}
              endpoint in parallel. Per-chain daily transaction counts come
              from Theta Explorer&apos;s{" "}
              <span className="font-mono">/transactions/history</span>{" "}
              endpoint (the same source as the official explorer graph).
              The ±50% band on type-7 ratio accounts for temporal variation
              (sampling happens once per UTC day) and provides approximately
              75% confidence that the true burn falls within the displayed
              range.
            </p>
          </div>
        </div>

        {/* Net and break-even */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Net flow and break-even
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-2">
            <div className="font-mono text-xs bg-[#0A0F1C] rounded-lg p-3 text-[#D1D5DB]">
              <p>net = dailyBurn − dailyIssuance</p>
              <p>breakEvenTxs = dailyIssuance / (avgFeePerType7 × type7Ratio)</p>
            </div>
            <ul className="text-xs text-[#B0B8C4] space-y-1 list-disc list-inside mt-2">
              <li>
                <span className="text-[#10B981]">Deflationary</span> —
                burns exceed new issuance (not yet achieved)
              </li>
              <li>
                <span className="text-[#B0B8C4]">Inflationary</span> —
                issuance exceeds burns (current state — this is normal and
                by design)
              </li>
              <li>
                <span className="text-white">breakEvenTxs</span> is the
                daily tx count required to burn exactly as much TFUEL as
                is issued, assuming the current type-7 ratio and fee level
                remain constant
              </li>
            </ul>
          </div>
        </div>

        {/* Known limitations */}
        <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
          <p className="text-sm text-white font-medium mb-2">
            Known limitations — burn is an estimate, not a measurement
          </p>
          <ul className="space-y-1.5 text-xs text-[#D1D5DB] list-disc list-inside">
            <li>
              <span className="text-white">Sample size.</span> We sample
              ~500 recent transactions per chain (~2,500 total across 5
              chains). The type-7 fee average is very stable (gas_price is
              protocol-fixed). The main noise source is the type-7
              ratio — how many of the sampled txs are fee-bearing. The
              ±50% band on this ratio yields ~75% confidence.
            </li>
            <li>
              <span className="text-white">
                Locked once per UTC day.
              </span>{" "}
              The estimate is computed once (first page load after midnight
              UTC) and stored. It does not re-sample during the day, so the
              displayed range is perfectly stable but may not reflect
              intra-day changes in activity mix.
            </li>
            <li>
              <span className="text-white">
                Main chain burn is negligible.
              </span>{" "}
              Main chain traffic is almost entirely type-0 proposer
              transactions (zero gas). Meaningful burn comes from subchain
              type-7 smart contract activity — gaming, AI, token transfers.
            </li>
            <li>
              <span className="text-white">Per-chain isolation.</span> Each
              chain&apos;s type-7 ratio and average fee are computed
              independently, then weighted by that chain&apos;s official
              daily transaction count. This prevents high-activity chains
              from distorting the fee average of low-activity chains.
            </li>
            <li>
              <span className="text-white">Issuance is exact.</span> Daily
              issuance is a protocol constant (1,238,400 TFUEL/day). The
              net-flow direction is therefore more robust than its magnitude:
              even if our burn estimate is off by 10×, the conclusion that
              Theta is currently deeply inflationary (burn &lt; issuance by
              orders of magnitude) is unchanged.
            </li>
            <li>
              <span className="text-white">
                Edge Network flows are not captured.
              </span>{" "}
              Edge Node operators earn additional TFUEL for video delivery
              and compute work — this issuance is not fixed per block and
              is not included in our daily issuance figure. Additionally,
              at least 25% of all Edge Network payments are burned. Both
              streams are unknown without access to off-chain EdgeCloud
              payment data. Our net flow calculation therefore understates
              both total issuance and total burn. The directional
              conclusion (deeply inflationary at current levels) remains
              valid, but the exact magnitude is unknown.
            </li>
          </ul>
        </div>

        {/* Error margin estimate */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Estimated error margin
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-3">
            <p>
              The daily burn number carries a{" "}
              <span className="text-white font-medium">
                realistic error margin of roughly ±25%
              </span>{" "}
              and a{" "}
              <span className="text-white">conservative bound of ±40%</span>.
              The main contributors:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#B0B8C4] text-left border-b border-[#2A3548]">
                    <th className="py-1.5 pr-3 font-medium">Source</th>
                    <th className="py-1.5 pr-3 font-medium">Estimated impact</th>
                  </tr>
                </thead>
                <tbody className="text-[#D1D5DB]">
                  <tr className="border-b border-[#2A3548]/50">
                    <td className="py-1.5 pr-3">
                      Sample size (~200 txs/chain)
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[#B0B8C4]">
                      ±7%
                    </td>
                  </tr>
                  <tr className="border-b border-[#2A3548]/50">
                    <td className="py-1.5 pr-3">
                      Temporal variation (current fee × yesterday&apos;s
                      txs)
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[#B0B8C4]">
                      ±15–25%
                    </td>
                  </tr>
                  <tr className="border-b border-[#2A3548]/50">
                    <td className="py-1.5 pr-3">
                      Per-chain fee mix uncertainty
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[#B0B8C4]">
                      ±10–15%
                    </td>
                  </tr>
                  <tr className="border-b border-[#2A3548]/50">
                    <td className="py-1.5 pr-3">
                      Main chain approximation (≈ 0 burn)
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[#B0B8C4]">
                      &lt;3%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-3 text-white">
                      Combined (quadrature sum)
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-white">
                      ≈ ±25%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#B0B8C4]">
              A reported burn of e.g. 200 TFUEL/day means the real value
              most likely sits between ~150 and ~250 TFUEL/day. Even at
              10× the upper bound, the network would still be deeply
              inflationary — the direction of net flow is robust even
              when the magnitude is uncertain.
            </p>
          </div>
        </div>
      </section>

      {/* Last updated */}
      <p className="text-xs text-[#7D8694] border-t border-[#2A3548] pt-6">
        Last updated: April 2026. Baselines will be recalibrated after 30
        days of data collection.
      </p>

      {/* Disclaimer */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl p-4 flex gap-3">
        <span className="text-[#F59E0B] text-base leading-none shrink-0">&#9888;</span>
        <p className="text-xs text-[#F59E0B]/90 leading-relaxed">
          These indices are transparent, best-effort tools — not financial
          indicators. We show exactly what we measure, how we measure it, and
          what we cannot see. Use them to follow trends, not to make investment
          decisions.
        </p>
      </div>
    </article>
  );
}
