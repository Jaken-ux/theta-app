"use client";

import { useState } from "react";

/**
 * Dark monospace code block with a copy button.
 *
 * `raw` is the canonical text that gets copied — keep it in sync with
 * what's rendered in `children`. Children get rendered inside a <pre><code>
 * so authors can wrap tokens in <span className="..."> for hand-tuned
 * syntax highlighting without pulling in a Prism/Shiki dependency.
 */
export default function CodeBlock({
  raw,
  children,
  language,
}: {
  raw: string;
  children: React.ReactNode;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in non-secure contexts; silent failure is fine.
    }
  }

  return (
    <div className="relative">
      {language && (
        <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest text-theta-muted/50 font-semibold pointer-events-none select-none">
          {language}
        </div>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-theta-card/80 backdrop-blur border border-theta-border text-theta-muted hover:text-white hover:border-theta-teal/40 transition-colors"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-xl border border-theta-border bg-[#0A0F1C] px-5 pt-10 pb-5 text-sm leading-relaxed font-mono text-theta-muted">
        <code>{children}</code>
      </pre>
    </div>
  );
}
