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

        {/* Daily burn — supply-delta method */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Daily burn — supply-delta method
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-4">
            <p>
              Instead of sampling individual transaction fees, we derive
              total burn from the{" "}
              <span className="text-white">
                actual change in TFUEL circulating supply
              </span>
              . This captures{" "}
              <span className="text-white">all burn sources</span>{" "}
              automatically — on-chain gas, Edge Network payments (25% burn),
              and any other mechanism — without sampling individual
              transactions.
            </p>

            {/* Formula */}
            <div className="font-mono text-xs bg-[#0A0F1C] rounded-lg p-3 text-[#D1D5DB] space-y-1">
              <p>supplyChange = supply_today − supply_yesterday</p>
              <p className="text-white mt-1">
                impliedBurn = dailyIssuance − supplyChange
              </p>
              <p className="mt-2 text-[#7D8694]">
                {/* eslint-disable-next-line */}{'// Shown as 7-day rolling average to smooth timing artifacts'}
              </p>
              <p>
                avgBurn7d = Σ impliedBurn (last 7 days) / 7
              </p>
              <p>
                burnRate = avgBurn7d / dailyIssuance
              </p>
            </div>

            {/* Why this works */}
            <div className="bg-[#0A0F1C] border border-[#2A3548] rounded-lg p-4 space-y-2">
              <p className="text-xs text-white font-medium">
                Why supply-delta instead of transaction sampling
              </p>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                TFUEL is burned through multiple mechanisms: on-chain gas fees,
                Edge Network payment burns (at least 25% of edge payments are
                burned), and potentially other protocol-level burns. Sampling
                on-chain transactions only captures gas burns (~0.5 TFUEL/day),
                missing the dominant burn source entirely. The supply-delta
                method sidesteps this by measuring the end result: if we know
                how much was created (fixed at 1,238,400 TFUEL/day) and we
                can see the actual supply change, the difference must be burn.
              </p>
            </div>

            <p className="text-xs text-[#B0B8C4]">
              Supply data comes from Theta&apos;s{" "}
              <span className="font-mono">/api/supply/tfuel</span>{" "}
              endpoint, stored daily in our database. Daily issuance is a
              protocol constant (14,400 blocks × 86 TFUEL). The 7-day
              rolling average smooths timing artifacts from the supply
              endpoint not updating at exact midnight UTC.
            </p>
          </div>
        </div>

        {/* Net flow */}
        <div>
          <p className="text-sm text-white font-medium mb-3">
            Net supply flow
          </p>
          <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4 text-sm space-y-2">
            <div className="font-mono text-xs bg-[#0A0F1C] rounded-lg p-3 text-[#D1D5DB]">
              <p>netGrowth = dailyIssuance − impliedBurn</p>
              <p>= supplyChange (directly observable)</p>
            </div>
            <ul className="text-xs text-[#B0B8C4] space-y-1 list-disc list-inside mt-2">
              <li>
                <span className="text-[#10B981]">Deflationary</span> —
                burn exceeds issuance, supply shrinks (not yet observed)
              </li>
              <li>
                <span className="text-[#B0B8C4]">Inflationary</span> —
                issuance exceeds burn, supply grows (current state — normal
                and by design)
              </li>
              <li>
                <span className="text-white">Burn rate</span> shows what
                percentage of daily issuance is offset by burns. Higher
                burn rate = closer to deflation.
              </li>
            </ul>
          </div>
        </div>

        {/* Known limitations */}
        <div className="bg-[#0A0F1C] border border-[#1E3A5F] rounded-xl p-4">
          <p className="text-sm text-white font-medium mb-2">
            Known limitations
          </p>
          <ul className="space-y-1.5 text-xs text-[#D1D5DB] list-disc list-inside">
            <li>
              <span className="text-white">
                Supply endpoint timing.
              </span>{" "}
              Theta&apos;s circulating supply endpoint does not update at
              exact midnight UTC. Single-day values can fluctuate depending
              on when the snapshot was taken. The 7-day rolling average
              mitigates this.
            </li>
            <li>
              <span className="text-white">
                Issuance assumes block reward only.
              </span>{" "}
              Our daily issuance figure (1,238,400 TFUEL) covers block
              rewards only. Edge Node operators earn additional TFUEL for
              video delivery and compute — this variable issuance is not
              included. The implied burn therefore understates total burn
              by the same amount that Edge issuance is understated.
            </li>
            <li>
              <span className="text-white">
                Direction is robust, magnitude is approximate.
              </span>{" "}
              Even if Edge issuance adds 10-20% to total daily issuance,
              the implied burn would increase proportionally. The burn rate
              (as a percentage of issuance) would shift but the
              inflationary/deflationary direction would remain the same.
            </li>
            <li>
              <span className="text-white">
                Requires accumulated history.
              </span>{" "}
              The calculation needs at least 2 days of stored supply data.
              The 7-day average needs 8 days. New deployments will show
              limited data initially.
            </li>
          </ul>
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
