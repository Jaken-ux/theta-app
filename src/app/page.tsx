"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import SimplifyThis from "../components/SimplifyThis";

/* ─── Animation helpers ─── */
const fadeUp = {
  initial: { opacity: 0, y: 40 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

/* ─── Glowing orb background ─── */
function GlowOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] opacity-20 pointer-events-none ${className}`}
    />
  );
}

/* ─── Animated node mesh ─── */
function NodeMesh({ count = 6, color = "#2AB8E6" }: { count?: number; color?: string }) {
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = 42;
    return {
      x: 50 + Math.cos(angle) * r,
      y: 50 + Math.sin(angle) * r,
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Lines */}
      {nodes.map((a, i) =>
        nodes.map((b, j) =>
          j > i ? (
            <motion.line
              key={`${i}-${j}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={color} strokeOpacity={0.5} strokeWidth={0.5}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
          ) : null
        )
      )}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={3}
          fill="#0A0F1C" stroke={color} strokeWidth={0.8}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
        />
      ))}
      {/* Center pulse */}
      <motion.circle
        cx={50} cy={50} r={4}
        fill={color} fillOpacity={0.3}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      <motion.circle
        cx={50} cy={50} r={2}
        fill={color}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </svg>
  );
}

/* ─── Stat counter ─── */
function Stat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-sm text-[#B0B8C4] mt-2">{label}</p>
    </motion.div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  title,
  description,
  gradient,
  delay = 0,
}: {
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="relative group rounded-2xl border border-[#2A3548] bg-[#151D2E] p-8 overflow-hidden hover:border-[#2AB8E6]/30 transition-all duration-500"
      {...stagger}
      transition={{ duration: 0.6, delay }}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
      />
      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-[#B0B8C4] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */
export default function Home() {
  return (
    <div className="overflow-hidden -mt-8">
      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6">
        <GlowOrb className="w-[600px] h-[600px] bg-[#2AB8E6] -top-40 left-1/2 -translate-x-1/2" />
        <GlowOrb className="w-[400px] h-[400px] bg-[#8B5CF6] top-20 -right-20" />
        <GlowOrb className="w-[300px] h-[300px] bg-[#10B981] bottom-20 -left-20" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.p
            className="text-[#2AB8E6] text-sm font-medium tracking-widest uppercase mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Decentralized infrastructure for the AI era
          </motion.p>

          <motion.h1
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The world&apos;s bandwidth,
            <br />
            <span className="bg-gradient-to-r from-[#2AB8E6] to-[#8B5CF6] bg-clip-text text-transparent">
              working for you.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-[#B0B8C4] mt-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Theta turns idle computers into a global network for video, AI, and
            cloud computing. Stake your tokens. Earn rewards. Power the next
            generation of the internet.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              href="/network"
              className="px-8 py-4 bg-[#2AB8E6] text-white font-semibold rounded-full hover:bg-[#2AB8E6]/90 transition-all text-base hover:scale-105"
            >
              Explore the Network
            </Link>
            <Link
              href="/earn"
              className="px-8 py-4 border border-[#2A3548] text-white font-semibold rounded-full hover:border-[#2AB8E6]/50 transition-all text-base hover:scale-105"
            >
              Start Earning
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1.5 }, y: { repeat: Infinity, duration: 2 } }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7D8694" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ━━━ SOCIAL PROOF BAR ━━━ */}
      <motion.section
        className="py-20 border-y border-[#2A3548]"
        {...fadeUp}
      >
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Stat value="11,000+" label="Staking participants" delay={0} />
          <Stat value="$300M+" label="Total value staked" delay={0.1} />
          <Stat value="14,000+" label="Daily transactions" delay={0.2} />
          <Stat value="300K+" label="Metachain txs/day" delay={0.3} />
        </div>
      </motion.section>

      {/* ━━━ THE PROBLEM ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div {...fadeUp}>
            <p className="text-[#2AB8E6] text-sm font-medium tracking-widest uppercase mb-4">
              The problem
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Streaming wasn&apos;t built
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>for this scale.
            </h2>
            <p className="text-lg text-[#B0B8C4] mt-6 leading-relaxed">
              Today, video travels from a handful of massive data centers to
              billions of viewers. That&apos;s expensive, slow, and creates
              single points of failure.
            </p>
            <p className="text-lg text-[#B0B8C4] mt-4 leading-relaxed">
              Meanwhile, billions of devices sit idle — with bandwidth, storage,
              and computing power going completely to waste.
            </p>
            <SimplifyThis>
              When you watch a YouTube video, it comes from a huge building full of computers far away. That building costs a fortune to run, and if it goes down — everyone loses their stream. Meanwhile, your own computer is just sitting there doing nothing. What if your computer could help send that video to your neighbor instead? That&apos;s the basic idea behind Theta.
            </SimplifyThis>
          </motion.div>

          {/* Visual: Centralized vs Decentralized */}
          <motion.div
            className="grid grid-cols-2 gap-3 sm:gap-6"
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Centralized */}
            <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-4 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mb-4 sm:mb-6">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#EF4444]" />
              </div>
              <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <div className="w-px h-6 sm:h-10 bg-[#445064]" />
                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[#151D2E] border border-[#445064]" />
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#EF4444]/70">Traditional</p>
              <p className="text-[10px] sm:text-xs text-[#7D8694] mt-1">Single point of failure</p>
            </div>

            {/* Decentralized */}
            <div className="bg-[#151D2E] border border-[#2AB8E6]/20 rounded-2xl p-4 sm:p-8 text-center">
              <div className="w-full aspect-square max-w-[160px] mx-auto mb-4">
                <NodeMesh count={7} />
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#2AB8E6]">Theta Network</p>
              <p className="text-[10px] sm:text-xs text-[#7D8694] mt-1">Distributed &amp; resilient</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative">
        <GlowOrb className="w-[500px] h-[500px] bg-[#2AB8E6] top-0 left-1/4 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeUp}>
            <p className="text-[#2AB8E6] text-sm font-medium tracking-widest uppercase mb-4">
              How it works
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Four steps. Zero jargon.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { num: "01", title: "Stake", desc: "Lock THETA or TFUEL to secure the network and earn rewards.", color: "#2AB8E6" },
              { num: "02", title: "Share", desc: "Edge nodes contribute your spare bandwidth and compute power.", color: "#10B981" },
              { num: "03", title: "Deliver", desc: "Content streams from the nearest node — faster and cheaper.", color: "#F59E0B" },
              { num: "04", title: "Earn", desc: "Node operators receive TFUEL rewards every block (~6 seconds).", color: "#8B5CF6" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="relative bg-[#151D2E] border border-[#2A3548] rounded-2xl p-5 sm:p-8 hover:border-opacity-50 transition-all duration-500"
                style={{ "--hover-color": step.color } as React.CSSProperties}
                {...stagger}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <span
                  className="text-5xl font-bold opacity-10 absolute top-4 right-6"
                  style={{ color: step.color }}
                >
                  {step.num}
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                >
                  <span className="text-lg font-bold" style={{ color: step.color }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[#B0B8C4] leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-8">
            <SimplifyThis>
              <p className="mb-2"><strong className="text-white">Stake</strong> = you put your tokens in a digital lockbox. While they&apos;re locked, you help keep the network safe — like putting a deposit down that says &quot;I&apos;m trustworthy.&quot; In return, you get paid.</p>
              <p className="mb-2"><strong className="text-white">Share</strong> = your computer shares some of its unused internet speed and processing power with the network. You don&apos;t notice it — it runs quietly in the background.</p>
              <p className="mb-2"><strong className="text-white">Deliver</strong> = instead of a video coming from a server far away, it comes from someone nearby who already has it. Faster for everyone.</p>
              <p><strong className="text-white">Earn</strong> = every ~6 seconds, the network pays out TFUEL tokens to people who help. TFUEL has real value — you can sell it, trade it, or save it.</p>
            </SimplifyThis>
          </div>
        </div>
      </section>

      {/* ━━━ TWO TOKENS ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeUp}>
            <p className="text-[#2AB8E6] text-sm font-medium tracking-widest uppercase mb-4">
              Two tokens
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              THETA secures. TFUEL powers.
            </h2>
            <p className="text-lg text-[#B0B8C4] mt-6 max-w-2xl mx-auto">
              Think of THETA as the equity — fixed supply, governance, network security.
              TFUEL is the currency — used for every transaction, earned as rewards.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              className="bg-[#151D2E] border border-[#2AB8E6]/20 rounded-2xl p-5 sm:p-8"
              {...stagger}
              transition={{ duration: 0.6, delay: 0 }}
            >
              <div className="w-12 h-12 rounded-full bg-[#2AB8E6]/10 border border-[#2AB8E6]/30 flex items-center justify-center mb-5">
                <span className="text-lg font-bold text-[#2AB8E6]">&#920;</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">THETA</h3>
              <ul className="space-y-3 text-[#B0B8C4]">
                <li className="flex gap-3">
                  <span className="text-[#2AB8E6] mt-0.5">&#10003;</span>
                  <span>Fixed supply — 1 billion, forever</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2AB8E6] mt-0.5">&#10003;</span>
                  <span>Secures the network via staking</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2AB8E6] mt-0.5">&#10003;</span>
                  <span>Earn TFUEL rewards by staking</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2AB8E6] mt-0.5">&#10003;</span>
                  <span>Validators: Google, Samsung, Sony</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              className="bg-[#151D2E] border border-[#10B981]/20 rounded-2xl p-5 sm:p-8"
              {...stagger}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mb-5">
                <span className="text-lg font-bold text-[#10B981]">&#9889;</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">TFUEL</h3>
              <ul className="space-y-3 text-[#B0B8C4]">
                <li className="flex gap-3">
                  <span className="text-[#10B981] mt-0.5">&#10003;</span>
                  <span>Gas token — powers every transaction</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#10B981] mt-0.5">&#10003;</span>
                  <span>Burn mechanism — usage reduces supply</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#10B981] mt-0.5">&#10003;</span>
                  <span>Higher staking yield than THETA</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#10B981] mt-0.5">&#10003;</span>
                  <span>Lower barrier to entry (10K TFUEL min)</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="max-w-2xl mx-auto mt-8">
            <SimplifyThis>
              <p className="mb-2">Think of it like a country with two types of money:</p>
              <p className="mb-2"><strong className="text-white">THETA</strong> is like owning shares in the country itself. There will only ever be 1 billion of them — no more can be created. If the country grows, your shares become more valuable. You can also &quot;stake&quot; them (lock them up) to earn TFUEL.</p>
              <p><strong className="text-white">TFUEL</strong> is like the cash people use every day. Every time someone watches a video, runs an AI job, or does anything on the network — they pay a tiny bit of TFUEL. Some of it gets destroyed (burned), so if lots of people use the network, there&apos;s less TFUEL available over time. You earn TFUEL as a reward for helping the network.</p>
            </SimplifyThis>
          </div>
        </div>
      </section>

      {/* ━━━ USE CASES ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative">
        <GlowOrb className="w-[400px] h-[400px] bg-[#8B5CF6] bottom-0 right-0" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeUp}>
            <p className="text-[#2AB8E6] text-sm font-medium tracking-widest uppercase mb-4">
              Real applications
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Built for what&apos;s next.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              title="Video Streaming"
              description="Deliver live and on-demand video globally without massive CDN costs. Viewers help relay content to each other."
              gradient="bg-gradient-to-br from-[#2AB8E6]/5 to-transparent"
              delay={0}
            />
            <FeatureCard
              title="AI & GPU Compute"
              description="Distribute AI training and inference workloads across thousands of idle GPUs via EdgeCloud."
              gradient="bg-gradient-to-br from-[#8B5CF6]/5 to-transparent"
              delay={0.1}
            />
            <FeatureCard
              title="Cloud Gaming"
              description="Low-latency game streaming powered by edge nodes located near players — no central server bottleneck."
              gradient="bg-gradient-to-br from-[#10B981]/5 to-transparent"
              delay={0.2}
            />
            <FeatureCard
              title="Enterprise CDN"
              description="Cost-effective content delivery for businesses of any size. Pay with TFUEL, skip the middleman."
              gradient="bg-gradient-to-br from-[#F59E0B]/5 to-transparent"
              delay={0.3}
            />
            <FeatureCard
              title="NFT & Digital Media"
              description="Decentralized storage and delivery for digital collectibles and creative content."
              gradient="bg-gradient-to-br from-[#EF4444]/5 to-transparent"
              delay={0.4}
            />
            <FeatureCard
              title="Live Events"
              description="Scale to millions of concurrent viewers instantly. No infrastructure limits, no buffering."
              gradient="bg-gradient-to-br from-[#2AB8E6]/5 to-transparent"
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ━━━ THE VISION ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 relative">
        <GlowOrb className="w-[600px] h-[600px] bg-[#2AB8E6] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Compute demand is
              <br />
              <span className="bg-gradient-to-r from-[#2AB8E6] via-[#8B5CF6] to-[#10B981] bg-clip-text text-transparent">
                exploding.
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-[#B0B8C4] mt-8 max-w-2xl mx-auto leading-relaxed">
              AI, 4K streaming, and cloud gaming are pushing centralized infrastructure
              to its limits. Theta unlocks millions of idle machines to meet that demand —
              decentralized, efficient, and rewarding for everyone who participates.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="py-16 sm:py-32 px-4 sm:px-6 border-t border-[#2A3548]">
        <motion.div className="max-w-3xl mx-auto text-center" {...fadeUp}>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Ready to explore?
          </h2>
          <p className="text-lg text-[#B0B8C4] mt-6 max-w-xl mx-auto">
            Dive into the network data, calculate your staking rewards,
            or learn how to get started.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/network"
              className="px-8 py-4 bg-[#2AB8E6] text-white font-semibold rounded-full hover:bg-[#2AB8E6]/90 transition-all text-base hover:scale-105"
            >
              View Network Dashboard
            </Link>
            <Link
              href="/earn"
              className="px-8 py-4 border border-[#2A3548] text-white font-semibold rounded-full hover:border-[#2AB8E6]/50 transition-all text-base hover:scale-105"
            >
              Calculate Rewards
            </Link>
            <Link
              href="/get-started"
              className="px-8 py-4 border border-[#2A3548] text-white font-semibold rounded-full hover:border-[#10B981]/50 transition-all text-base hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
