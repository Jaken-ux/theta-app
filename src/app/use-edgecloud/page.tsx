import type { Metadata } from "next";
import Card from "../../components/Card";
import CodeBlock from "../../components/CodeBlock";
import SimplifyThis from "../../components/SimplifyThis";
import {
  PRICING_ROWS,
  lastVerifiedDate,
} from "../../lib/edgecloud-pricing";
import { fetchTdropData } from "../../lib/tdrop";

// Re-render at most every 60s so the cashback example tracks the live
// TDROP price. fetchTdropData itself caches the underlying CoinGecko
// call for 300s — the actual price refreshes on its 5-min cycle.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Run AI on Theta EdgeCloud",
  description:
    "Theta EdgeCloud at 50–70% lower cost than AWS and Azure. Pay-per-call AI APIs via RapidAPI or full GPU deployments via EdgeCloud, with 5% TDROP cashback on every dollar spent.",
  alternates: { canonical: "/use-edgecloud" },
};

// External destinations. The RapidAPI search URL falls back to a Theta keyword
// search if no single canonical listing exists yet — replace if Theta Labs
// publishes a definitive landing page.
const RAPIDAPI_URL = "https://rapidapi.com/search/theta";
const EDGECLOUD_URL = "https://www.thetaedgecloud.com";

const paths = [
  {
    label: "Path A",
    title: "I just want to try an AI model",
    bullets: [
      "No account required",
      "Use via RapidAPI",
      "Pay per API call",
    ],
    bestFor: "testing, prototyping, one-off tasks",
    cta: { text: "Try on RapidAPI →", href: RAPIDAPI_URL },
  },
  {
    label: "Path B",
    title: "I want to run serious workloads",
    bullets: [
      "Create EdgeCloud account",
      "Add credit via Stripe or TDROP",
      "Deploy models, Jupyter notebooks, custom containers",
    ],
    bestFor: "production, training, enterprise",
    cta: { text: "Go to EdgeCloud →", href: EDGECLOUD_URL },
  },
];

const models = [
  {
    title: "Qwen3 32B",
    vendor: "by Alibaba",
    bullets: [
      "32 billion parameter LLM",
      "Decentralized inference via pipeline parallelism",
      "$0.20/M input tokens · $0.40/M output tokens",
      "Best for: text generation, coding, analysis",
    ],
    status: { text: "LIVE — Beta", tone: "amber" as const },
  },
  {
    title: "On-demand AI Models",
    vendor: "20+ models",
    bullets: [
      "Speech-to-text, image generation, and more",
      "Available via RapidAPI",
      "Pay per task",
    ],
    status: { text: "LIVE", tone: "emerald" as const },
  },
  {
    title: "Custom deployments",
    vendor: "Bring your own workload",
    bullets: [
      "Deploy any containerized workload",
      "Jupyter notebooks for prototyping",
      "SSH access for training",
    ],
    status: { text: "LIVE", tone: "emerald" as const },
  },
];

const EXAMPLE_SPEND_USD = 100;
const CASHBACK_RATE = 0.05;

// Canonical text for the quickstart code block — must stay in sync with the
// JSX rendered inside <CodeBlock>. The `\\` line-continuations become a
// literal `\` after template-literal evaluation, so the copied command runs
// as-is when pasted into a shell.
const QUICKSTART_CURL = `curl --request POST \\
  --url https://theta-edge-cloud-ai-inference-api.p.rapidapi.com/v1/chat/completions \\
  --header 'Content-Type: application/json' \\
  --header 'x-rapidapi-host: theta-edge-cloud-ai-inference-api.p.rapidapi.com' \\
  --header 'x-rapidapi-key: YOUR_KEY_HERE' \\
  --data '{
    "model": "Qwen3-32B",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;

export default async function UseEdgeCloudPage() {
  // Pull live TDROP price so the cashback example below never goes
  // stale. Same source as /earn — `.catch` keeps the page rendering
  // if CoinGecko is down.
  const tdrop = await fetchTdropData().catch(() => null);
  const tdropPrice = tdrop?.priceUsd ?? null;

  const cashbackUsd = EXAMPLE_SPEND_USD * CASHBACK_RATE;
  const tdropAmount = tdropPrice ? cashbackUsd / tdropPrice : null;

  const cashbackExampleBody =
    tdropAmount != null && tdropPrice != null
      ? `$${EXAMPLE_SPEND_USD} spend → $${cashbackUsd} cashback → ≈ ${Math.round(
          tdropAmount
        ).toLocaleString()} TDROP at today's price ($${tdropPrice.toFixed(
          6
        )}/TDROP). No opt-in, no claim flow — it shows up in your EdgeCloud balance.`
      : `$${EXAMPLE_SPEND_USD} spend → $${cashbackUsd} cashback in TDROP. Live price temporarily unavailable. No opt-in, no claim flow — it shows up in your EdgeCloud balance.`;

  const cashbackSteps = [
    {
      n: 1,
      title: "You spend $100 on GPU compute",
      body: "Any EdgeCloud usage counts — inference, training, hosted notebooks, custom containers.",
    },
    {
      n: 2,
      title: "You automatically receive 5% back in TDROP",
      body: cashbackExampleBody,
    },
    {
      n: 3,
      title: "Convert to USD credit or withdraw to your wallet",
      body: "Use the credit to pay for more compute, or withdraw the TDROP to use elsewhere.",
    },
  ];

  return (
    <div className="space-y-12">
      {/* 1. HERO */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
          Run AI on Theta EdgeCloud
        </h1>
        <p className="text-theta-muted text-base sm:text-lg max-w-2xl leading-relaxed">
          50–70% cheaper than AWS and Azure. Decentralized GPU compute. 5% back
          in TDROP on every dollar spent.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={RAPIDAPI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-theta-teal text-[#0A0F1C] font-semibold text-sm hover:bg-[#3DC9F5] transition-colors"
          >
            Start on RapidAPI — no account needed →
          </a>
          <a
            href={EDGECLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2.5 rounded-lg border border-theta-border text-white font-semibold text-sm hover:bg-theta-card transition-colors"
          >
            Full EdgeCloud dashboard →
          </a>
        </div>
      </section>

      {/* 2. TWO PATHS */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Two ways in
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {paths.map((p) => (
            <Card key={p.label} className="flex flex-col">
              <p className="text-xs uppercase tracking-widest text-theta-teal font-semibold mb-2">
                {p.label}
              </p>
              <h3 className="text-lg font-semibold text-white mb-3 leading-snug">
                {p.title}
              </h3>
              <ul className="space-y-2 mb-4 flex-1">
                {p.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-theta-muted"
                  >
                    <span className="text-theta-teal mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-theta-muted mb-4">
                <span className="text-white/80">Best for:</span> {p.bestFor}
              </p>
              <a
                href={p.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center self-start px-3.5 py-2 rounded-lg bg-theta-teal/10 text-theta-teal hover:bg-theta-teal/20 font-semibold text-sm transition-colors"
              >
                {p.cta.text}
              </a>
            </Card>
          ))}
        </div>

        <SimplifyThis>
          RapidAPI is like an app store for APIs — you can test Theta&apos;s AI
          models there without creating any accounts. EdgeCloud itself is the
          full platform where you can run bigger workloads and manage your own
          deployments.
        </SimplifyThis>
      </section>

      {/* 2b. QUICKSTART CURL */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          8 lines to get started
        </h2>
        <CodeBlock raw={QUICKSTART_CURL} language="bash">
          <span className="text-theta-teal">curl</span>
          {" "}
          <span className="text-amber-400">--request</span>
          {" "}
          <span className="text-purple-400">POST</span>
          {" "}
          <span className="text-theta-muted/40">\</span>
          {"\n  "}
          <span className="text-amber-400">--url</span>
          {" "}
          <span className="text-emerald-400">
            https://theta-edge-cloud-ai-inference-api.p.rapidapi.com/v1/chat/completions
          </span>
          {" "}
          <span className="text-theta-muted/40">\</span>
          {"\n  "}
          <span className="text-amber-400">--header</span>
          {" "}
          <span className="text-emerald-400">
            &apos;Content-Type: application/json&apos;
          </span>
          {" "}
          <span className="text-theta-muted/40">\</span>
          {"\n  "}
          <span className="text-amber-400">--header</span>
          {" "}
          <span className="text-emerald-400">
            &apos;x-rapidapi-host: theta-edge-cloud-ai-inference-api.p.rapidapi.com&apos;
          </span>
          {" "}
          <span className="text-theta-muted/40">\</span>
          {"\n  "}
          <span className="text-amber-400">--header</span>
          {" "}
          <span className="text-emerald-400">&apos;x-rapidapi-key: </span>
          <span className="text-yellow-300">YOUR_KEY_HERE</span>
          <span className="text-emerald-400">&apos;</span>
          {" "}
          <span className="text-theta-muted/40">\</span>
          {"\n  "}
          <span className="text-amber-400">--data</span>
          {" "}
          <span className="text-emerald-400">&apos;{"{"}</span>
          {"\n    "}
          <span className="text-pink-400">&quot;model&quot;</span>
          <span className="text-white/70">: </span>
          <span className="text-emerald-400">&quot;Qwen3-32B&quot;</span>
          <span className="text-white/70">,</span>
          {"\n    "}
          <span className="text-pink-400">&quot;messages&quot;</span>
          <span className="text-white/70">: [{"{"}</span>
          <span className="text-pink-400">&quot;role&quot;</span>
          <span className="text-white/70">: </span>
          <span className="text-emerald-400">&quot;user&quot;</span>
          <span className="text-white/70">, </span>
          <span className="text-pink-400">&quot;content&quot;</span>
          <span className="text-white/70">: </span>
          <span className="text-emerald-400">&quot;Hello&quot;</span>
          <span className="text-white/70">{"}"}]</span>
          {"\n  "}
          <span className="text-emerald-400">{"}"}&apos;</span>
        </CodeBlock>
        <p className="text-xs text-theta-muted mt-3 max-w-2xl leading-relaxed">
          OpenAI-compatible endpoint — works with any OpenAI SDK by changing
          the base URL.
        </p>
      </section>

      {/* 3. AVAILABLE MODELS */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          What can you run?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => (
            <Card key={m.title} className="flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <h3 className="text-lg font-semibold text-white leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-xs text-theta-muted mt-0.5">{m.vendor}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-semibold tracking-widest whitespace-nowrap ${
                    m.status.tone === "emerald"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {m.status.text}
                </span>
              </div>
              <ul className="space-y-2 mt-3 flex-1">
                {m.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-theta-muted"
                  >
                    <span className="text-theta-teal mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. PRICING COMPARISON */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          How does the cost compare?
        </h2>
        <div className="overflow-x-auto rounded-xl border border-theta-border bg-theta-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theta-border">
                <th className="text-left font-semibold text-theta-muted px-4 py-3"></th>
                <th className="text-left font-semibold text-theta-teal px-4 py-3 whitespace-nowrap">
                  Theta EdgeCloud
                </th>
                <th className="text-left font-semibold text-theta-muted px-4 py-3">
                  AWS
                </th>
                <th className="text-left font-semibold text-theta-muted px-4 py-3">
                  Azure
                </th>
                <th className="text-left font-semibold text-theta-muted px-4 py-3 whitespace-nowrap">
                  Google Cloud
                </th>
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={
                    i < PRICING_ROWS.length - 1
                      ? "border-b border-theta-border/60"
                      : ""
                  }
                >
                  <td className="font-semibold text-white px-4 py-3 whitespace-nowrap">
                    {row.label}
                  </td>
                  <td className="text-white px-4 py-3 tabular-nums">
                    {row.theta}
                  </td>
                  <td className="text-theta-muted px-4 py-3 tabular-nums">
                    {row.aws}
                  </td>
                  <td className="text-theta-muted px-4 py-3 tabular-nums">
                    {row.azure}
                  </td>
                  <td className="text-theta-muted px-4 py-3 tabular-nums">
                    {row.gcp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-theta-muted mt-3 max-w-2xl leading-relaxed">
          Prices approximate. GPU rates on Theta vary by operator and hardware.
          Sources: Theta Labs, AWS Bedrock, Azure AI Foundry, Google Vertex AI
          public pricing pages. Last verified{" "}
          <span className="text-white/80 tabular-nums">
            {lastVerifiedDate()}
          </span>
          .
        </p>

        <SimplifyThis>
          The main advantage is price — Theta&apos;s decentralized model means
          you&apos;re tapping into idle GPU capacity from around the world,
          which is cheaper than building and running a data center. The 5%
          TDROP cashback makes it even cheaper effectively.
        </SimplifyThis>
      </section>

      {/* 5. TDROP CASHBACK */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          What is the 5% TDROP cashback?
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {cashbackSteps.map((s) => (
            <Card key={s.n}>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-theta-teal/10 text-theta-teal font-bold text-sm mb-3 tabular-nums">
                {s.n}
              </div>
              <h3 className="text-base font-semibold text-white leading-snug mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-theta-muted leading-relaxed">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
        <p className="text-xs text-theta-muted mt-4 max-w-2xl leading-relaxed">
          Minimum 1,000 TDROP to convert or withdraw. TDROP price fluctuates —
          the USD value of your cashback varies with the market.
        </p>

        <SimplifyThis>
          Think of it like airline miles — you earn rewards automatically just
          by using the platform. The TDROP you receive can be converted to
          USD credit (which pays for more EdgeCloud compute) or withdrawn to
          your wallet to use elsewhere. There&apos;s no opt-in and no minimum
          spend; every dollar of GPU usage triggers it.
        </SimplifyThis>
      </section>
    </div>
  );
}
