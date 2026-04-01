import Card from "../../components/Card";

const topics = [
  {
    id: "tokens",
    title: "THETA & TFUEL",
    subtitle: "The two-token system",
    sections: [
      {
        heading: "THETA — The governance token",
        body: "THETA is used to stake and secure the network. Validators and Guardian Nodes must stake THETA to participate in block production. There is a fixed supply of 1 billion THETA — no more will ever be created. Think of it as equity in the network itself.",
      },
      {
        heading: "TFUEL — The utility token",
        body: "TFUEL is the operational currency of the Theta network. It pays for transactions, rewards edge node operators, and fuels smart contracts. Unlike THETA, new TFUEL is generated as staking rewards — similar to how interest works in traditional finance.",
      },
      {
        heading: "Why two tokens?",
        body: "Separating governance from operations keeps the network stable. THETA holders make long-term decisions about the protocol, while TFUEL flows freely as everyday fuel. This prevents governance power from being diluted by daily transactions.",
      },
    ],
  },
  {
    id: "nodes",
    title: "Node Types",
    subtitle: "Who keeps the network running",
    sections: [
      {
        heading: "Validator Nodes",
        body: "The backbone of the network. Validator nodes process transactions and produce new blocks. Theta uses a small set of enterprise validators (like Google, Samsung, and Sony) for speed, combined with thousands of community Guardian Nodes for decentralization.",
      },
      {
        heading: "Guardian Nodes",
        body: "Community-run nodes that finalize blocks produced by validators. Anyone with 1,000+ THETA can run a Guardian Node. They act as a check on validators — ensuring no single entity can manipulate the chain.",
      },
      {
        heading: "Edge Nodes",
        body: "The most accessible entry point. Edge nodes share spare bandwidth, storage, and compute power. They don&apos;t need THETA to run — they earn TFUEL by relaying video streams, caching content, and completing compute jobs. Anyone with a regular computer can run one.",
      },
    ],
  },
  {
    id: "consensus",
    title: "Consensus",
    subtitle: "How Theta agrees on truth",
    sections: [
      {
        heading: "Multi-BFT Consensus",
        body: "Theta uses a modified Byzantine Fault Tolerant (BFT) protocol. In simple terms: a small group of fast validators proposes blocks, then thousands of Guardian Nodes independently verify and finalize them. This gives you the speed of centralized validation with the security of decentralized verification.",
      },
      {
        heading: "Why it matters",
        body: "Traditional blockchains trade speed for decentralization. Theta&apos;s two-layer approach means transactions finalize in seconds while still being validated by thousands of independent nodes around the world.",
      },
    ],
  },
  {
    id: "edge-computing",
    title: "Edge Computing",
    subtitle: "Beyond video delivery",
    sections: [
      {
        heading: "Theta EdgeCloud",
        body: "EdgeCloud extends the network beyond video. It creates a distributed cloud computing platform where edge nodes contribute GPU power for AI training, rendering, and other compute-heavy tasks. Think of it as a decentralized AWS — powered by everyday hardware.",
      },
      {
        heading: "Why decentralized compute?",
        body: "GPU demand is skyrocketing thanks to AI, but cloud providers are expensive and capacity-constrained. Theta taps into the millions of idle GPUs sitting in homes and offices worldwide, creating an elastic compute layer at a fraction of the cost.",
      },
    ],
  },
  {
    id: "ecosystem",
    title: "Ecosystem",
    subtitle: "Who uses Theta today",
    sections: [
      {
        heading: "Enterprise partners",
        body: "Google, Samsung, Sony, and CAA are among Theta&apos;s enterprise validators and partners. These companies use Theta&apos;s network for content delivery, NFT platforms, and streaming infrastructure.",
      },
      {
        heading: "Theta Video API",
        body: "Developers can integrate decentralized video delivery into any application through Theta&apos;s Video API. It works like a traditional video CDN, but content is served from the nearest edge node — reducing costs and improving performance.",
      },
      {
        heading: "ThetaDrop & NFTs",
        body: "ThetaDrop is Theta&apos;s NFT marketplace focused on entertainment and media. Digital collectibles from sports, film, and music are minted and stored on the Theta blockchain with decentralized content delivery built in.",
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
          Theta Deep Dive
        </h1>
        <p className="text-lg text-theta-muted max-w-2xl">
          Go beyond the basics. Explore how the network, tokens, nodes, and
          consensus mechanism actually work — explained without the jargon.
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
    </div>
  );
}
