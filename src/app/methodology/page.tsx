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
                <tr className="border-t border-[#2A3548]">
                  <td className="px-4 py-2.5 text-[#7D8694]">
                    POGS <span className="text-[10px] text-[#7D8694]">(inactive since March 2026)</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">0.3</td>
                  <td className="px-4 py-2.5 font-mono">100,000 txs/day</td>
                  <td className="px-4 py-2.5">
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
              POGS has been inactive since March 2026. It still contributes to
              the composite with its last known data and lower weight.
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
