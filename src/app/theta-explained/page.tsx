import Card from "../../components/Card";

const topics = [
  {
    id: "architecture",
    title: "Technical Architecture",
    subtitle: "How the network actually works under the hood",
    sections: [
      {
        heading: "Two-layer consensus",
        body: "Theta uses a modified BFT (Byzantine Fault Tolerant) consensus split into two layers. A small committee of ~12-15 Validator Nodes proposes and signs blocks in round-robin fashion. Then thousands of Guardian Nodes vote on checkpoints every 100 blocks (~10 minutes). Once 2/3+ of guardian stake signs a checkpoint, those blocks become irreversible. Validators provide speed. Guardians provide decentralized finality.",
      },
      {
        heading: "Block time and finality",
        body: "Blocks are produced every ~6 seconds. Optimistic finality (trusting the validator set) is ~6 seconds. Absolute BFT-guaranteed finality requires the next guardian checkpoint — approximately 10 minutes. For most use cases, single-block confirmation is sufficient.",
      },
      {
        heading: "Throughput",
        body: "Theta Labs claims the main chain can handle 1,000+ transactions per second. With subchains, aggregate capacity scales further. In practice, observed main-chain throughput is far below capacity — typically single-digit TPS — reflecting low demand, not a technical limitation.",
      },
    ],
  },
  {
    id: "tokenomics",
    title: "TFUEL Tokenomics",
    subtitle: "Supply, inflation, and the burn mechanism",
    sections: [
      {
        heading: "Supply and inflation",
        body: "TFUEL started with 5 billion tokens at genesis (2019). Since Mainnet 3.0 (June 2021), new TFUEL is minted as staking rewards at a target rate of ~4% of the original 5B supply per year — roughly 200 million new TFUEL annually. This inflation is split between Validator/Guardian stakers and Elite Edge Node stakers.",
      },
      {
        heading: "The burn mechanism",
        body: "25% of every TFUEL transaction fee is permanently destroyed (burned). The remaining 75% goes to the block proposer. This means net inflation depends on network usage — more transactions = more burn = lower net inflation. If transaction volume grew high enough, TFUEL could become deflationary.",
      },
      {
        heading: "Current state: inflationary",
        body: "With main-chain transaction fees being very small (~0.3 TFUEL per transaction) and daily transaction count in the 10,000-20,000 range, the burn rate is far below the ~200M/year inflation. Current estimated circulating supply is approximately 5.8-5.9 billion TFUEL. For TFUEL to become net deflationary, transaction volume would need to increase by orders of magnitude.",
      },
      {
        heading: "THETA supply",
        body: "THETA has a fixed supply of 1 billion tokens. No new THETA can ever be created — it is hardcoded into the protocol. This makes THETA purely scarcity-driven: if demand increases, supply cannot adjust. This is fundamentally different from TFUEL's inflationary model.",
      },
    ],
  },
  {
    id: "metachain",
    title: "Metachain & Subchains",
    subtitle: "Theta's scaling architecture",
    sections: [
      {
        heading: "What are subchains?",
        body: "Subchains are independent EVM-compatible blockchains running in parallel to the Theta main chain. Each has its own block production, gas parameters, and even custom gas tokens. They periodically checkpoint to the main chain for security, inheriting the validator/guardian security model.",
      },
      {
        heading: "Why subchains exist",
        body: "The main chain handles THETA/TFUEL transfers and governance. Subchains handle application-specific workloads — DeFi, NFTs, AI compute, gaming — without congesting the main chain. This is horizontal scaling: instead of making one chain faster, you add more chains.",
      },
      {
        heading: "Creating a subchain",
        body: "The subchain SDK is publicly available. Running a subchain requires staking a minimum of 100,000 TFUEL as collateral and attracting validators to run the subchain's nodes. It is permissionless in design but has practical barriers.",
      },
      {
        heading: "Transparency gap",
        body: "Subchain transaction data is not well-exposed through public APIs. Theta Labs has stated that subchains handle the bulk of application-level transactions (~300K+/day), but independent verification is limited. The main-chain explorer at explorer.thetatoken.org only shows main-chain activity.",
      },
    ],
  },
  {
    id: "staking",
    title: "Staking Mechanics",
    subtitle: "How rewards are earned and distributed",
    sections: [
      {
        heading: "Validator Nodes",
        body: "The validator set is fixed and permissioned — ~12-15 nodes run by Theta Labs and enterprise partners (Google, Samsung, Sony, Binance, CAA). You cannot permissionlessly become a validator. Minimum stake: 200,000 THETA. Validators propose blocks in round-robin and earn 75% of transaction fees.",
      },
      {
        heading: "Guardian Nodes",
        body: "Anyone staking 1,000+ THETA can run a Guardian Node or delegate to an existing one. Guardians finalize checkpoints every 100 blocks. Rewards (TFUEL) are distributed proportionally to stake weight among all active guardians. Not all guardians participate in every checkpoint — which is why the effective reward rate is lower than the nominal per-block rate.",
      },
      {
        heading: "Elite Edge Nodes",
        body: "Require staking 10,000+ TFUEL. Edge nodes contribute bandwidth, compute, and storage. Rewards are proportional to uptime and staked amount. The Elite Booster program (introduced 2024) allows edge stakers to increase their reward multiplier by staking additional TFUEL and committing to longer lock periods.",
      },
      {
        heading: "Unstaking",
        body: "Both THETA and TFUEL have a ~48-hour unstaking cooldown (~28,800 blocks). During this period your tokens are locked and not earning rewards. This prevents rapid stake manipulation attacks.",
      },
      {
        heading: "Reward math",
        body: "Per-block rewards: ~48 TFUEL to Validator/Guardian stakers + ~38 TFUEL to Edge Node stakers. At ~5.26M blocks/year, that is ~252M TFUEL to guardians and ~200M to edge nodes annually. Your individual reward depends on your share of the total staked pool.",
      },
    ],
  },
  {
    id: "competitors",
    title: "Theta vs Competitors",
    subtitle: "How Theta compares to other decentralized infrastructure projects",
    sections: [
      {
        heading: "Livepeer — Video transcoding",
        body: "Livepeer focuses specifically on video transcoding (converting video formats). It runs on Arbitrum (Ethereum L2) with its own token LPT. Livepeer does not handle video delivery or storage — only processing. Theta covers both transcoding and delivery via its edge network, but Livepeer has more demonstrated transcoding volume.",
      },
      {
        heading: "Filecoin — Decentralized storage",
        body: "Filecoin is the dominant decentralized storage network with 3,800+ storage providers. It uses Proof of Spacetime to verify storage. Theta has some storage capabilities via edge nodes but does not compete seriously with Filecoin's storage capacity. Different focus areas.",
      },
      {
        heading: "Render Network — GPU compute",
        body: "Render focuses on GPU rendering for 3D, AI, and creative workloads with ~5,000+ GPU providers. It does not have its own blockchain (uses Solana/Polygon for payments). Theta's EdgeCloud competes in this space but with less demonstrated GPU compute adoption. Render has stronger creative industry partnerships.",
      },
      {
        heading: "Akash Network — Cloud compute",
        body: "Akash is a decentralized cloud marketplace built on Cosmos. It offers general-purpose compute (CPU + GPU) with ~200+ providers. Theta's EdgeCloud has more nodes but Akash has a more focused developer experience for deploying containerized workloads.",
      },
      {
        heading: "Theta's positioning",
        body: "Theta's uniqueness is the integrated stack — combining CDN, video transcoding, storage, AND GPU compute in one network with a dual-token model. The breadth is also a weakness: Theta competes on multiple fronts without clear dominance in any single one. The enterprise validator model (Google, Samsung, Sony) provides credibility but limits decentralization.",
      },
    ],
  },
  {
    id: "risks",
    title: "Risks & Uncertainties",
    subtitle: "An honest look at what could go wrong",
    sections: [
      {
        heading: "Low visible transaction volume",
        body: "Theta's main chain processes 10,000-20,000 transactions/day. This is 1-2 orders of magnitude below comparably-valued L1 blockchains. The explanation that activity moved to subchains and off-chain compute is plausible — but not independently verifiable.",
      },
      {
        heading: "Centralized validator set",
        body: "12-15 validators, all selected by Theta Labs. There is no permissionless path to becoming a validator. This means Theta Labs and a few partners could theoretically collude to censor transactions. The guardian layer mitigates this — guardians can refuse to finalize malicious checkpoints — but it remains a structural centralization point.",
      },
      {
        heading: "Dependence on Theta Labs",
        body: "Virtually all protocol development, SDKs, the explorer, wallet software, and subchain tooling come from Theta Labs. There is no significant independent developer ecosystem comparable to Ethereum or Cosmos. If Theta Labs ceased operations, active development would likely stall.",
      },
      {
        heading: "Competition from cloud giants",
        body: "AWS, Google Cloud, Cloudflare, and Akamai offer video CDN and GPU compute at massive scale with enterprise SLAs. Theta's decentralized edge must compete primarily on cost, and it is unclear whether the savings are sufficient to drive enterprise adoption at scale.",
      },
      {
        heading: "Regulatory uncertainty",
        body: "TFUEL functions as a utility token (gas, payments), but tokens with staking yields exist in a regulatory gray area. The ~4% annual inflation distributed as staking rewards could be characterized as a security-like return in some jurisdictions.",
      },
      {
        heading: "Off-chain metrics are unverifiable",
        body: "Theta Labs cites edge compute hours, video relay bandwidth, and AI inference tasks — but these are tracked by their own infrastructure. Independent auditing of these claims is not possible with current public tools. This is a meaningful transparency gap.",
      },
    ],
  },
  {
    id: "nodes",
    title: "Node Types",
    subtitle: "The three roles that keep the network running",
    sections: [
      {
        heading: "Validator Nodes — The proposers",
        body: "A small, fixed committee (~12-15 nodes) run by enterprise partners. They propose blocks in round-robin fashion every ~6 seconds. Requires 200,000 THETA minimum stake. Not open to the public. These are the fast engine of the network.",
      },
      {
        heading: "Guardian Nodes — The verifiers",
        body: "Thousands of community-run nodes that finalize blocks through checkpoint voting every 100 blocks. Anyone with 1,000+ THETA can participate. They act as a decentralized check on validators — no single entity can manipulate the chain without guardian consensus.",
      },
      {
        heading: "Edge Nodes — The workers",
        body: "The most accessible entry point. Edge nodes share bandwidth, storage, and GPU power. Anyone can run one. Elite Edge Nodes (10,000+ TFUEL staked) earn additional staking rewards. Edge nodes relay video, cache content, and process AI/compute workloads — they are the delivery layer of the network.",
      },
    ],
  },
  {
    id: "ecosystem",
    title: "Ecosystem",
    subtitle: "Partners, applications, and integrations",
    sections: [
      {
        heading: "Enterprise validators",
        body: "Google, Samsung, Sony, Binance, Creative Artists Agency (CAA), and others operate Validator Nodes. Their participation signals institutional confidence, but it also means the validator set is curated rather than permissionless.",
      },
      {
        heading: "Theta EdgeCloud",
        body: "Launched in 2024, EdgeCloud extends Theta beyond video into general GPU compute. It creates a distributed cloud platform where edge nodes contribute processing power for AI training, inference, and rendering. Competes with Render Network and Akash in the decentralized compute space.",
      },
      {
        heading: "Theta Video API",
        body: "Developers can integrate decentralized video delivery into applications through the Video API. It functions like a traditional video CDN but content is served from nearby edge nodes. Used for live streaming, on-demand video, and DRM-protected content.",
      },
      {
        heading: "ThetaDrop & NFTs",
        body: "ThetaDrop is Theta's NFT marketplace for entertainment and media collectibles. Digital assets from sports, film, and music are minted on the Theta blockchain with decentralized content delivery built in. Activity has decreased significantly from 2021-2022 peak.",
      },
    ],
  },
];

export default function ExplainedPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Deep Dive
        </h1>
        <p className="text-lg text-theta-muted max-w-2xl">
          A thorough, honest look at Theta&apos;s technology, economics, competitive
          landscape, and risks. No hype — just facts and context.
        </p>
      </section>

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="px-4 py-2 text-sm bg-theta-card border border-theta-border rounded-lg text-theta-muted hover:text-white hover:border-theta-teal/30 transition-colors"
          >
            {topic.title}
          </a>
        ))}
      </nav>

      {/* Topics */}
      {topics.map((topic) => (
        <section key={topic.id} id={topic.id} className="scroll-mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
            <p className="text-theta-muted mt-1">{topic.subtitle}</p>
          </div>
          <div className="grid gap-4">
            {topic.sections.map((section) => (
              <Card key={section.heading}>
                <h3 className="text-base font-semibold text-theta-teal mb-2">
                  {section.heading}
                </h3>
                <p className="text-[15px] text-theta-muted leading-relaxed">
                  {section.body}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* Disclaimer */}
      <div className="bg-[#0D1117] border border-[#2A3548] rounded-xl p-6">
        <p className="text-xs text-[#7D8694] leading-relaxed">
          This page is for educational purposes only. Information is based on publicly
          available documentation, whitepapers, and observable data. Some operational
          metrics cited by Theta Labs cannot be independently verified. Nothing here
          constitutes financial advice. Always verify claims against official sources
          (docs.thetatoken.org, explorer.thetatoken.org) before making decisions.
        </p>
      </div>
    </div>
  );
}
