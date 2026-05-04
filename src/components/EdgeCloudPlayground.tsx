"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ModelOption {
  id: string;
  label: string;
  subtitle: string;
  beta: boolean;
}

// Order matters: the first available model wins the auto-select on
// page load, so put the most reliable model first. gpt-oss-120b
// follows the system prompt consistently; MiniMax-M2.5 is faster
// but sometimes refuses to consult the live-data context we inject.
const MODELS: ModelOption[] = [
  {
    id: "gpt-oss",
    label: "gpt-oss-120b",
    subtitle: "OpenAI open-source, strong reasoning — recommended",
    beta: false,
  },
  {
    id: "minimax",
    label: "MiniMax-M2.5",
    subtitle: "Fast, great for general questions",
    beta: false,
  },
  {
    id: "llama",
    label: "Llama 3 8B",
    subtitle: "Meta's model, reliable and versatile",
    beta: false,
  },
  {
    id: "qwen3",
    label: "Qwen3 32B Parallax (BETA)",
    subtitle: "Alibaba's flagship — slower, decentralized pipeline",
    beta: true,
  },
];

const MAX_CHARS = 500;

// ReactMarkdown component overrides so the assistant's output
// renders to match the dark theme of the rest of the app. Defined at
// module scope so the object identity is stable across renders.
//
// Tables in particular need GFM (remark-gfm) to parse — without it
// the model's pipe-syntax tables would render as plain pipe text.
//
// `pre`'s arbitrary child variants flatten the inline-code styling
// so block code (always wrapped in <pre>) doesn't inherit the pill
// background that we use for inline `code`.
const markdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-base font-semibold text-theta-teal mt-4 mb-2 first:mt-0"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-base font-semibold text-theta-teal mt-4 mb-2 first:mt-0"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-sm font-semibold text-theta-teal mt-3 mb-1.5 first:mt-0"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5
      className="text-sm font-semibold text-theta-teal mt-3 mb-1.5 first:mt-0"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-white font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-white/80" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc list-outside pl-5 mb-3 space-y-1 last:mb-0"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal list-outside pl-5 mb-3 space-y-1 last:mb-0"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-white/90 leading-relaxed" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-theta-teal hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-theta-card px-1.5 py-0.5 rounded text-xs font-mono text-theta-teal"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-theta-card border border-theta-border rounded-lg p-3 text-xs font-mono text-white/90 overflow-x-auto my-3 last:mb-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:text-white/90"
      {...props}
    />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-theta-teal/40 pl-3 my-3 last:mb-0 text-theta-muted italic"
      {...props}
    />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-3 last:mb-0 rounded-lg border border-theta-border">
      <table className="w-full text-xs" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-theta-teal/15 text-theta-teal" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="text-left px-3 py-2 font-semibold border-b border-theta-border whitespace-nowrap"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-3 py-2 border-t border-theta-border/40 text-white/85 align-top"
      {...props}
    />
  ),
  hr: () => <hr className="border-theta-border my-4" />,
};
const markdownPlugins = [remarkGfm];

type Status = "available" | "slow" | "unavailable" | "checking";

interface StatusVisual {
  dotClass: string;
  label: string;
}

const STATUS_VISUALS: Record<Status, StatusVisual> = {
  available: { dotClass: "bg-emerald-400", label: "Available" },
  slow: { dotClass: "bg-amber-400", label: "Slow" },
  unavailable: { dotClass: "bg-red-400", label: "Unavailable" },
  checking: { dotClass: "bg-theta-muted/40 animate-pulse", label: "Checking…" },
};

export default function EdgeCloudPlayground({
  compact = false,
}: {
  /**
   * When true, render only the inner card (model picker, input, response)
   * without the section heading, intro paragraph, or bottom disclaimer.
   * Use this when embedding the chat in a floating panel or other host
   * that already provides its own framing chrome. Default false = full
   * page version used on /use-edgecloud.
   */
  compact?: boolean;
} = {}) {
  const [model, setModel] = useState<string>("gpt-oss");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Status>>({
    minimax: "checking",
    "gpt-oss": "checking",
    llama: "checking",
    qwen3: "checking",
  });
  const [creditsLow, setCreditsLow] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch availability once on mount. The endpoint caches results for
  // 5 minutes server-side, so multiple page loads in a row are cheap.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/edgecloud-health")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setStatuses({
          minimax: j.minimax ?? "unavailable",
          "gpt-oss": j["gpt-oss"] ?? "unavailable",
          llama: j.llama ?? "unavailable",
          qwen3: j.qwen3 ?? "unavailable",
        });
        setCreditsLow(j.creditsLow === true);
      })
      .catch(() => {
        if (cancelled) return;
        setStatuses({
          minimax: "unavailable",
          "gpt-oss": "unavailable",
          llama: "unavailable",
          qwen3: "unavailable",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-select the first available model — but only once, and only if
  // the user hasn't already touched the dropdown. If the default model
  // turns out to be unavailable when health resolves, switch them to
  // something working.
  useEffect(() => {
    if (autoSelected) return;
    if (Object.values(statuses).every((s) => s === "checking")) return;
    const currentStatus = statuses[model];
    if (currentStatus === "available" || currentStatus === "slow") {
      setAutoSelected(true);
      return;
    }
    const firstAvailable = MODELS.find(
      (m) => statuses[m.id] === "available"
    )?.id;
    if (firstAvailable && firstAvailable !== model) {
      setModel(firstAvailable);
    }
    setAutoSelected(true);
  }, [statuses, model, autoSelected]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!dropdownOpen) return;
    function onClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  const isQwen3 = model === "qwen3";
  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;
  const empty = input.trim().length === 0;
  const selected = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const selectedStatus = statuses[model] ?? "checking";

  async function send() {
    if (empty || overLimit || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setCopied(false);
    try {
      const res = await fetch("/api/edgecloud-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), model }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong — try a different model");
      } else {
        setResponse(json.response ?? "");
      }
    } catch {
      setError("Something went wrong — try a different model");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  const loadingText = isQwen3
    ? "Routing through decentralized GPU nodes... this may take 1-3 minutes"
    : "Sending to Theta EdgeCloud...";

  // Always render the same <section> root so the DOM hierarchy is
  // stable across renders. Earlier this used an inline `Wrapper`
  // component that was re-created on every render, causing React to
  // remount the whole subtree on each keystroke — and the textarea
  // lost focus after one character. Section as a root is harmless
  // even when nested inside the floating chat panel.
  return (
    <section>
      {!compact && (
        <>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Try Theta EdgeCloud AI — right now
          </h2>
          <p className="text-sm text-theta-muted mb-5 max-w-2xl">
            Ask anything about Theta Network. Powered by live on-chain data and
            Theta EdgeCloud&apos;s decentralized GPU network. No account needed.
          </p>
        </>
      )}

      <div
        className={
          compact
            ? "space-y-4"
            : "bg-theta-card border border-theta-border rounded-xl p-5 sm:p-6 space-y-4"
        }
      >
        {/* Model dropdown — custom so we can color the status dots */}
        <div ref={dropdownRef}>
          <label className="block text-xs uppercase tracking-widest text-theta-muted font-semibold mb-2">
            Choose a model
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              disabled={loading}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              className="w-full flex items-center justify-between gap-3 bg-[#0A0F1C] border border-theta-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-theta-teal/60 hover:border-theta-teal/40 transition-colors disabled:opacity-60"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_VISUALS[selectedStatus].dotClass}`}
                  aria-hidden
                />
                <span className="truncate">
                  <span className="font-semibold">{selected.label}</span>
                  <span className="text-theta-muted ml-2 hidden sm:inline">
                    — {selected.subtitle}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-theta-muted hidden sm:inline">
                  {STATUS_VISUALS[selectedStatus].label}
                </span>
                <svg
                  className={`w-4 h-4 text-theta-muted transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  role="listbox"
                  className="absolute z-20 left-0 right-0 mt-1.5 bg-[#0A0F1C] border border-theta-border rounded-lg overflow-hidden shadow-2xl"
                >
                  {MODELS.map((m) => {
                    const s = statuses[m.id] ?? "checking";
                    const isSelected = m.id === model;
                    return (
                      <li key={m.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => {
                            setModel(m.id);
                            setDropdownOpen(false);
                            setError(null);
                          }}
                          className={`w-full flex items-start gap-3 px-3.5 py-3 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-theta-teal/10"
                              : "hover:bg-theta-teal/5"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_VISUALS[s].dotClass}`}
                            aria-hidden
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-white font-semibold">
                              {m.label}
                            </span>
                            <span className="block text-xs text-theta-muted mt-0.5">
                              {m.subtitle}
                            </span>
                          </span>
                          <span className="text-xs text-theta-muted/80 mt-0.5 flex-shrink-0">
                            {STATUS_VISUALS[s].label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Demo credits running low — server-side check against the EdgeCloud
            billing API. The exact balance is intentionally not exposed; we
            just surface a soft warning so visitors aren't blindsided when
            the playground stops responding. */}
        {creditsLow && (
          <div className="flex items-start gap-2.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3v.008m9.75-.879a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Demo credits running low — playground may stop responding soon.
              For sustained use, hit the API directly via RapidAPI.
            </span>
          </div>
        )}

        {/* Qwen3 amber warning */}
        {isQwen3 && (
          <div className="flex items-start gap-2.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3v.008m9.75-.879a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Qwen3 uses decentralized pipeline parallelism — expect 1–3 minute
              response time. Other models respond in seconds.
            </span>
          </div>
        )}

        {/* Input */}
        <div>
          <label
            htmlFor="ec-input"
            className="block text-xs uppercase tracking-widest text-theta-muted font-semibold mb-2"
          >
            Your message
          </label>
          <textarea
            id="ec-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about Theta Network — staking rewards, EdgeCloud pricing, what the indexes mean, how to get started..."
            rows={4}
            maxLength={MAX_CHARS + 50}
            className="w-full bg-[#0A0F1C] border border-theta-border rounded-lg px-3.5 py-3 text-sm text-white placeholder-theta-muted/50 resize-y focus:outline-none focus:border-theta-teal/60 transition-colors disabled:opacity-60 leading-relaxed font-sans"
          />
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className={overLimit ? "text-red-400" : "text-theta-muted/60"}>
              {charCount}/{MAX_CHARS}
            </span>
            <span className="text-theta-muted/50">
              Selected: {selected.label}
            </span>
          </div>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={send}
          disabled={empty || overLimit || loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-theta-teal text-[#0A0F1C] font-semibold text-sm hover:bg-[#3DC9F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                <path
                  d="M12 2a10 10 0 019.95 9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span>{loadingText}</span>
            </>
          ) : (
            <span>Send to Theta EdgeCloud →</span>
          )}
        </button>

        {/* Response */}
        <AnimatePresence>
          {response !== null && (
            <motion.div
              key="resp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-theta-muted font-semibold">
                  Response
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="text-xs px-2.5 py-1 rounded-md bg-theta-card border border-theta-border text-theta-muted hover:text-white hover:border-theta-teal/40 transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="bg-[#0A0F1C] border border-theta-border rounded-lg px-4 py-3.5 text-sm text-white/90 leading-relaxed break-words">
                {response ? (
                  <ReactMarkdown
                    remarkPlugins={markdownPlugins}
                    components={markdownComponents}
                  >
                    {response}
                  </ReactMarkdown>
                ) : (
                  <span className="text-theta-muted">(empty response)</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-red-400/10 border border-red-400/30 text-red-300 rounded-lg px-3.5 py-2.5 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!compact && (
        <p className="text-xs text-theta-muted mt-3 max-w-2xl leading-relaxed">
          Powered by Theta EdgeCloud. Responses cost fractions of a cent. Rate
          limited to 10 requests per hour.
        </p>
      )}
    </section>
  );
}
