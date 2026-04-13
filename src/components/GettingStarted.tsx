"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Section({
  title,
  step,
  color,
  children,
}: {
  title: string;
  step: number;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#2A3548] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#0D1117] transition-colors"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {step}
        </span>
        <span className="text-base font-medium text-white flex-1">{title}</span>
        <Chevron open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GettingStarted() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Getting Started
        </h2>
        <p className="text-base text-[#B0B8C4]">
          From zero to staking — step by step. This is general guidance, not financial advice.
        </p>
      </div>

      <div className="space-y-3">
        {/* Step 1: Buy */}
        <Section title="Buy THETA or TFUEL" step={1} color="#2AB8E6">
          <p className="text-sm text-[#B0B8C4] leading-relaxed">
            THETA and TFUEL are available on several cryptocurrency exchanges. Availability varies by region.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Major exchanges</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li><span className="text-white">Binance</span> — largest THETA/TFUEL liquidity (not available in the US)</li>
                <li><span className="text-white">KuCoin</span> — lists both THETA and TFUEL</li>
                <li><span className="text-white">Gate.io</span> — lists both tokens</li>
                <li><span className="text-white">Crypto.com</span> — lists THETA</li>
              </ul>
            </div>
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Good to know</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li>TFUEL has fewer exchange listings than THETA</li>
                <li>Coinbase and Kraken do <span className="text-white">not</span> list THETA or TFUEL</li>
                <li>US availability is limited — check your exchange&apos;s supported regions</li>
                <li><span className="text-white">ThetaSwap</span> (Theta&apos;s own DEX) lets you swap between THETA and TFUEL directly</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Step 2: Wallet */}
        <Section title="Set up a wallet" step={2} color="#10B981">
          <p className="text-sm text-[#B0B8C4] leading-relaxed">
            After buying, you need a wallet to hold your tokens and stake them. Do not leave tokens on an exchange long-term.
          </p>

          <div className="space-y-3">
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Official Theta Wallet</p>
              <p className="text-sm text-[#B0B8C4] leading-relaxed">
                Available as a <span className="text-white">web wallet</span> at wallet.thetatoken.org and as a <span className="text-white">mobile app</span> (iOS &amp; Android).
                You can store, send, receive, and stake THETA and TFUEL directly from it.
                The wallet generates a keystore file or mnemonic seed phrase — Theta does not store your keys.
              </p>
            </div>

            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Hardware wallet (cold storage)</p>
              <p className="text-sm text-[#B0B8C4] leading-relaxed">
                <span className="text-white">Ledger</span> (Nano S / Nano X) supports THETA and TFUEL. Install the Theta app on your Ledger, then connect it to the Theta web wallet.
                You can <span className="text-white">stake directly from Ledger</span> — tokens stay at your address, and the private key never leaves the device.
                Trezor does not currently support THETA natively.
              </p>
            </div>
          </div>
        </Section>

        {/* Step 3: Stake */}
        <Section title="Stake and earn" step={3} color="#F59E0B">
          <p className="text-sm text-[#B0B8C4] leading-relaxed">
            Staking locks your tokens to help secure the network. In return, you earn TFUEL rewards.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-[#2AB8E6] mb-2">THETA → Guardian Node</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li>Minimum: <span className="text-white">1,000 THETA</span></li>
                <li>You <span className="text-white">don&apos;t need to run a node</span> — you can delegate to an existing Guardian Node</li>
                <li>Open the Theta Wallet → Stakes → Deposit Stake → enter a Guardian Node address</li>
                <li>Rewards paid in TFUEL</li>
                <li>Unstaking takes ~48 hours</li>
              </ul>
            </div>
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-[#10B981] mb-2">TFUEL → Elite Edge Node</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li>Minimum: <span className="text-white">10,000 TFUEL</span></li>
                <li>Requires running the <span className="text-white">Theta Edge Node</span> software on your computer</li>
                <li>The node contributes compute resources (video, AI workloads)</li>
                <li>Rewards paid in TFUEL</li>
                <li>Unstaking takes ~60 hours</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-[#B0B8C4] leading-relaxed">
            Staking is <span className="text-white">non-custodial</span> — your tokens stay at your wallet address, locked but never transferred to someone else.
            Always keep a small TFUEL balance for transaction fees (gas).
          </p>
        </Section>

        {/* Step 4: Security */}
        <Section title="Stay safe" step={4} color="#EF4444">
          <div className="space-y-3">
            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Protect your keys</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li><span className="text-white">Write down your seed phrase on paper</span> — never store it digitally (no photos, no cloud, no email)</li>
                <li>Use a strong, unique password for your keystore file</li>
                <li>Consider a hardware wallet (Ledger) for larger amounts</li>
                <li>No one from Theta will ever ask for your private key or seed phrase</li>
              </ul>
            </div>

            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-[#EF4444] mb-2">Common scams to avoid</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li><span className="text-white">Fake wallet sites</span> — always verify you are on wallet.thetatoken.org. Bookmark it.</li>
                <li><span className="text-white">Fake mobile apps</span> — only download from links on the official Theta website</li>
                <li><span className="text-white">Social media scams</span> — Telegram/Discord accounts offering &quot;staking promotions&quot; or asking you to &quot;validate your wallet&quot; are always scams</li>
                <li><span className="text-white">Wrong network</span> — THETA is on its own blockchain, not Ethereum. Sending to an ETH address = lost funds</li>
              </ul>
            </div>

            <div className="bg-[#0D1117] rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-2">Tips</p>
              <ul className="space-y-1.5 text-sm text-[#B0B8C4]">
                <li>Always keep some TFUEL in your wallet for gas fees — without it, you can&apos;t move your tokens</li>
                <li>Send a small test transaction first before moving large amounts</li>
                <li>After unstaking, there is a ~48-60 hour lock before tokens are available</li>
                <li>Check exchange withdrawal availability before trading — some exchanges occasionally pause THETA/TFUEL withdrawals</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* Official links */}
      <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-4">
        <p className="text-sm font-medium text-white mb-2">Official resources</p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-[#B0B8C4]">
          <p>Theta Wallet — wallet.thetatoken.org</p>
          <p>Theta Blockchain Explorer — explorer.thetatoken.org</p>
          <p>Theta Docs — docs.thetatoken.org</p>
          <p>Theta GitHub — github.com/thetatoken</p>
        </div>
      </div>

      <p className="text-xs text-[#7D8694]">
        This is general information, not financial advice. Always do your own research. Exchange availability, staking terms, and wallet compatibility can change — verify on official sources before acting.
      </p>
    </div>
  );
}
