import type { Metadata } from "next";
import Link from "next/link";
import MetachainDashboard from "../../components/metachain/MetachainDashboard";
import { fetchMetachainData } from "../../lib/metachain/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Metachain Utilization Index",
  description:
    "Composite utilization index across Theta's main chain and subchains. Measures real application usage — gaming, AI, health data — not just token trading.",
  alternates: { canonical: "/metachain" },
};

export default async function MetachainPage() {
  const serverData = await fetchMetachainData().catch(() => null);
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
          Metachain Utilization Index
        </h1>
        <p className="text-[#B0B8C4] max-w-2xl">
          Is Theta actually being used? This index answers that question by
          measuring real application activity across the entire ecosystem —
          gaming, AI, health data, and more.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-[#10B981]">
            Coverage: 6 chains + ecosystem growth proxy
          </span>
        </div>
      </div>

      {/* ── What is this? (always visible) ────────────────── */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-3">
          What does this index measure?
        </h3>
        <p className="text-sm text-[#B0B8C4] leading-relaxed">
          Theta is not one blockchain — it is a network of chains. The main
          chain handles staking and token transfers. But the real work happens on{" "}
          <strong className="text-white">subchains</strong> — separate
          blockchains built for specific applications like AI compute, gaming,
          and health data. This index combines activity from all of them into one
          number.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#2AB8E6] mb-1">
              This page — Metachain
            </p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              &quot;Is Theta being used?&quot; — Measures real application
              activity across all chains. Gaming transactions, AI job logs,
              health data processing. Goes up when apps and users are active.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-xl p-4">
            <p className="text-sm font-medium text-[#F59E0B] mb-1">
              <Link href="/network" className="hover:underline">
                Network page — Main Chain
              </Link>
            </p>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              &quot;Are people interested in Theta?&quot; — Measures settlement
              layer activity. Token transfers, TFUEL trading, staking. Goes up
              when the market is active.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <MetachainDashboard serverData={serverData} />

      {/* ── Chain coverage ────────────────────────────────── */}
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-semibold text-white mb-4">
          Chain coverage
        </h3>
        <div className="space-y-3">
          {[
            {
              name: "Main Chain",
              status: "live",
              desc: "Settlement layer — staking, governance, token transfers (~14K txs/day)",
              color: "#2AB8E6",
            },
            {
              name: "Lavita AI (tsub360890)",
              status: "live",
              desc: "Health AI and genomics data marketplace (~57.8M total txs)",
              color: "#10B981",
            },
            {
              name: "TPulse (tsub68967)",
              status: "live",
              desc: "EdgeCloud transparency — AI compute job tracking (~10.7M total txs)",
              color: "#8B5CF6",
            },
            {
              name: "Passaways (tsub7734)",
              status: "live",
              desc: "PLASM gaming ecosystem (~61.6M total txs — highest subchain)",
              color: "#F59E0B",
            },
            {
              name: "Grove (tsub47683)",
              status: "live",
              desc: "GroveWars Web3 gaming ecosystem (~20.6M total txs)",
              color: "#EF4444",
            },
            {
              name: "POGS (tsub9065)",
              status: "live",
              desc: "Digital entertainment and collectibles (~24.4M txs — inactive since March 2026)",
              color: "#7D8694",
            },
            {
              name: "Ecosystem Growth (proxy)",
              status: "live",
              desc: "Cross-chain signals: subchain registrations, Token Bank transfers, validator collateral changes",
              color: "#E879F9",
            },
          ].map((chain) => (
            <div
              key={chain.name}
              className="flex items-center gap-4 bg-[#0D1117] rounded-xl p-4"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    chain.status === "live" ? chain.color : "#2A3548",
                  border:
                    chain.status !== "live"
                      ? `1px dashed ${chain.color}40`
                      : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color:
                        chain.status === "live" ? chain.color : "#7D8694",
                    }}
                  >
                    {chain.name}
                  </p>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        chain.status === "live"
                          ? `${chain.color}15`
                          : "#2A3548",
                      color:
                        chain.status === "live" ? chain.color : "#5C6675",
                    }}
                  >
                    {chain.status}
                  </span>
                </div>
                <p className="text-xs text-[#7D8694] mt-0.5">{chain.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#5C6675] mt-4">
          We monitor for new Theta subchains and integrate them as their
          explorer APIs become available.
        </p>
      </div>
    </div>
  );
}
