"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelOption {
  id: string;
  label: string;
  subtitle: string;
  beta: boolean;
}

const MODELS: ModelOption[] = [
  {
    id: "minimax",
    label: "MiniMax-M2.5",
    subtitle: "Fast, great for general questions",
    beta: false,
  },
  {
    id: "gpt-oss",
    label: "gpt-oss-120b",
    subtitle: "OpenAI open-source, strong reasoning",
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

export default function EdgeCloudPlayground() {
  const [model, setModel] = useState<string>("minimax");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isQwen3 = model === "qwen3";
  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;
  const empty = input.trim().length === 0;
  const selected = MODELS.find((m) => m.id === model) ?? MODELS[0];

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

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
        Try Theta EdgeCloud AI — right now
      </h2>
      <p className="text-sm text-theta-muted mb-5 max-w-2xl">
        Real AI inference running on Theta&apos;s decentralized GPU network.
        No account needed.
      </p>

      <div className="bg-theta-card border border-theta-border rounded-xl p-5 sm:p-6 space-y-4">
        {/* Model selector */}
        <div>
          <label
            htmlFor="ec-model"
            className="block text-xs uppercase tracking-widest text-theta-muted font-semibold mb-2"
          >
            Choose a model
          </label>
          <select
            id="ec-model"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className="w-full bg-[#0A0F1C] border border-theta-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-theta-teal/60 transition-colors disabled:opacity-60"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.subtitle}
              </option>
            ))}
          </select>
        </div>

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
            placeholder="Ask anything — try 'Explain blockchain in one sentence' or 'What is Theta EdgeCloud?'"
            rows={4}
            maxLength={MAX_CHARS + 50}
            className="w-full bg-[#0A0F1C] border border-theta-border rounded-lg px-3.5 py-3 text-sm text-white placeholder-theta-muted/50 resize-y focus:outline-none focus:border-theta-teal/60 transition-colors disabled:opacity-60 leading-relaxed font-sans"
          />
          <div className="flex justify-between items-center mt-2 text-xs">
            <span
              className={
                overLimit ? "text-red-400" : "text-theta-muted/60"
              }
            >
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
              <div className="bg-[#0A0F1C] border border-theta-border rounded-lg px-4 py-3.5 text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                {response || "(empty response)"}
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

      <p className="text-xs text-theta-muted mt-3 max-w-2xl leading-relaxed">
        Powered by Theta EdgeCloud. Responses cost fractions of a cent. Rate
        limited to 10 requests per hour.
      </p>
    </section>
  );
}
