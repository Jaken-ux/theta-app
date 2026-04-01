"use client";

import Section from "../components/explained/Section";
import Container from "../components/explained/Container";
import Heading from "../components/explained/Heading";
import Paragraph from "../components/explained/Paragraph";
import ThetaVsTfuel from "../components/explained/diagrams/ThetaVsTfuel";
import CentralizedVsDecentralized from "../components/explained/diagrams/CentralizedVsDecentralized";
import NetworkFlow from "../components/explained/diagrams/NetworkFlow";
import EdgeNodeConcept from "../components/explained/diagrams/EdgeNodeConcept";
import DemandGrowth from "../components/explained/diagrams/DemandGrowth";

/* ───────────────────── Use cases data ───────────────────── */
const useCases = [
  {
    title: "Video Streaming",
    description: "Deliver live and on-demand video without massive CDN costs.",
    icon: "📹",
  },
  {
    title: "AI & Compute",
    description: "Distribute GPU workloads across idle machines worldwide.",
    icon: "🧠",
  },
  {
    title: "Gaming",
    description: "Low-latency game streaming powered by edge nodes near players.",
    icon: "🎮",
  },
  {
    title: "NFT & Media",
    description: "Decentralized storage and delivery for digital collectibles.",
    icon: "🖼",
  },
  {
    title: "Live Events",
    description: "Scale to millions of concurrent viewers without infrastructure limits.",
    icon: "🎙",
  },
  {
    title: "Enterprise CDN",
    description: "Cost-effective content delivery for businesses of any size.",
    icon: "🏢",
  },
];

/* ───────────────────── How it works steps ───────────────────── */
const steps = [
  { num: "01", title: "Stake", description: "Lock tokens to secure the network." },
  { num: "02", title: "Share", description: "Edge nodes contribute bandwidth and compute." },
  { num: "03", title: "Deliver", description: "Content streams from the nearest node." },
  { num: "04", title: "Earn", description: "Node operators receive TFUEL rewards." },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─── */}
      <Section className="pt-40 pb-32">
        <Container narrow className="text-center">
          <Heading as="h1" size="hero">
            The internet was built to connect.
            <br />
            <span className="text-[#2AB8E6]">Theta makes it deliver.</span>
          </Heading>
          <Paragraph className="mt-6 max-w-[640px] mx-auto">
            A decentralized network where everyday people power video streaming,
            AI, and cloud computing — and get rewarded for it.
          </Paragraph>
        </Container>
      </Section>

      {/* ─── Problem ─── */}
      <Section>
        <Container narrow>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Heading size="section">
                Streaming is broken.
              </Heading>
              <Paragraph className="mt-4">
                Today, video travels from a handful of data centers to billions of
                viewers. That&apos;s expensive, slow, and fragile.
              </Paragraph>
              <Paragraph className="mt-4">
                What if the viewers themselves could help deliver it?
              </Paragraph>
            </div>
            <div className="flex justify-center">
              <CentralizedVsDecentralized />
            </div>
          </div>
        </Container>
      </Section>

      {/* ─── Insight ─── */}
      <Section>
        <Container narrow className="text-center">
          <Heading size="section">
            Your computer has power to spare.
          </Heading>
          <Paragraph className="mt-4 max-w-[540px] mx-auto">
            Most PCs sit idle 80% of the time. Theta turns that wasted capacity
            into a global resource — bandwidth, storage, and compute — shared
            across the network.
          </Paragraph>
          <div className="mt-12 flex justify-center">
            <EdgeNodeConcept />
          </div>
        </Container>
      </Section>

      {/* ─── What is Theta ─── */}
      <Section>
        <Container narrow className="text-center">
          <Heading size="section">
            So what is Theta, exactly?
          </Heading>
          <Paragraph className="mt-4 max-w-[600px] mx-auto">
            Theta is a blockchain-powered network that coordinates thousands of
            edge nodes to deliver content faster, cheaper, and more reliably
            than traditional cloud infrastructure.
          </Paragraph>
          <div className="mt-12 flex justify-center">
            <NetworkFlow />
          </div>
        </Container>
      </Section>

      {/* ─── THETA vs TFUEL ─── */}
      <Section>
        <Container narrow className="text-center">
          <Heading size="section">
            Two tokens. Two jobs.
          </Heading>
          <Paragraph className="mt-4 max-w-[540px] mx-auto">
            THETA secures the network. TFUEL powers the day-to-day operations.
            Think of THETA as equity and TFUEL as the currency.
          </Paragraph>
          <div className="mt-12 flex justify-center">
            <ThetaVsTfuel />
          </div>
        </Container>
      </Section>

      {/* ─── How it works ─── */}
      <Section>
        <Container>
          <div className="text-center mb-16">
            <Heading size="section">How it works</Heading>
            <Paragraph className="mt-4">Four steps. No jargon.</Paragraph>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8"
              >
                <span className="text-[#2AB8E6] text-sm font-mono font-semibold">
                  {step.num}
                </span>
                <h3 className="text-white text-xl font-semibold mt-3">
                  {step.title}
                </h3>
                <p className="text-[#9CA3AF] text-[15px] mt-2 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─── Use Cases ─── */}
      <Section>
        <Container>
          <div className="text-center mb-16">
            <Heading size="section">Built for real use cases</Heading>
            <Paragraph className="mt-4">
              From live sports to AI inference — Theta&apos;s network handles it.
            </Paragraph>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 hover:border-[#2AB8E6]/30 transition-colors"
              >
                <span className="text-3xl">{uc.icon}</span>
                <h3 className="text-white text-lg font-semibold mt-4">
                  {uc.title}
                </h3>
                <p className="text-[#9CA3AF] text-[15px] mt-2 leading-relaxed">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─── Vision / Demand ─── */}
      <Section>
        <Container narrow className="text-center">
          <Heading size="hero">
            Compute demand is exploding.
            <br />
            <span className="text-[#2AB8E6]">Theta is the answer.</span>
          </Heading>
          <Paragraph className="mt-6 max-w-[540px] mx-auto">
            AI, 4K streaming, and cloud gaming are pushing infrastructure to its
            limits. Theta unlocks millions of idle machines to meet that demand.
          </Paragraph>
          <div className="mt-12 flex justify-center">
            <DemandGrowth />
          </div>
        </Container>
      </Section>

      {/* ─── CTA Footer ─── */}
      <Section className="pb-40">
        <Container narrow className="text-center">
          <Heading size="section">Ready to explore?</Heading>
          <Paragraph className="mt-4 max-w-[480px] mx-auto">
            Run an edge node, stake your tokens, or dive deeper into how
            Theta is reshaping the internet.
          </Paragraph>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/earn"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#2AB8E6] text-white font-medium rounded-full hover:bg-[#2AB8E6]/90 transition-colors text-[15px]"
            >
              Start Earning
            </a>
            <a
              href="/theta-explained"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-[#1F2937] text-white font-medium rounded-full hover:border-[#2AB8E6]/40 transition-colors text-[15px]"
            >
              Deep Dive
            </a>
          </div>
        </Container>
      </Section>
    </div>
  );
}
