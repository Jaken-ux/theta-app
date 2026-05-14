"use client";

import { useState } from "react";

// Two crypto address blocks with one-click copy. Client component
// because we need the clipboard API plus state for the "Copied!"
// flash. Visually distinct cards so the addresses are easy to find
// when scanning. Mono font on the address itself so users can read
// it character by character.
const ADDRESSES = [
  {
    id: "theta",
    label: "Theta network",
    tokens: "THETA, TFUEL",
    address: "0x6F467D4f1315dFA388A7CB7DECD2eE7B1c6Ca826",
  },
  {
    id: "eth",
    label: "Ethereum network",
    tokens: "ETH, USDC, USDT",
    address: "0x3C1EE15BE75C5933d0b2f7431567424603C9763b",
  },
] as const;

export default function DonationAddresses() {
  // Tracks which address block just had its "Copied!" flash. null
  // when no flash is active. We reset to null on a 2s timer so the
  // confirmation fades without lingering.
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => {
        // Only clear if no newer click has overwritten the state.
        setCopied((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      // Some browsers (insecure context, old Safari) reject the
      // clipboard call. Fall through silently — the address is
      // still visible and selectable.
    }
  }

  return (
    <div className="space-y-4">
      {ADDRESSES.map((entry) => {
        const justCopied = copied === entry.id;
        return (
          <div
            key={entry.id}
            className="bg-theta-card border border-theta-border rounded-xl p-5"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-white">
                {entry.label}
              </p>
              <p className="text-xs text-theta-muted">{entry.tokens}</p>
            </div>

            <div className="flex items-stretch gap-2">
              <div className="flex-1 min-w-0 bg-theta-dark border border-theta-border rounded-md px-3 py-2.5 font-mono text-[13px] sm:text-sm text-theta-muted break-all overflow-x-auto">
                {entry.address}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(entry.id, entry.address)}
                aria-live="polite"
                aria-label={`Copy ${entry.label} address`}
                className="flex-shrink-0 px-3 sm:px-4 text-xs font-medium rounded-md border border-theta-border bg-theta-dark text-theta-muted hover:text-white hover:border-theta-teal/40 transition-colors"
              >
                {justCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-theta-muted/70 leading-relaxed pt-2">
        Send only assets on the matching network. ETH-network tokens sent
        to the Theta address (or vice versa) will be lost. If you&rsquo;re
        using an exchange, double-check the withdrawal network before sending.
      </p>
    </div>
  );
}
