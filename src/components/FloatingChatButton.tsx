"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EdgeCloudPlayground from "./EdgeCloudPlayground";

/**
 * Site-wide floating chat button.
 *
 * Renders a small teal circle anchored to the bottom-right of the
 * viewport. When clicked, opens a chat panel containing the same
 * EdgeCloudPlayground widget that lives on /use-edgecloud — same
 * models, same rate limiting, same admin tracking. The page-level
 * playground stays available; the floating button is just a second
 * entry point.
 *
 * Mobile note: the panel becomes near-fullscreen on narrow viewports
 * so the dropdown, textarea, and response area still have room.
 * The button itself uses bottom-4 right-4 on mobile (vs bottom-6
 * right-6 on desktop) to stay clear of OS gesture areas.
 */
export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when panel is open on mobile so background
  // doesn't scroll under the chat. Harmless on desktop.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close panel on Escape — standard dialog convention.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* The floating circle. z-[1001] sits just above the sticky nav (1000). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Theta AI chat" : "Open Theta AI chat"}
        aria-expanded={open}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1001] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-theta-teal text-[#0A0F1C] shadow-lg hover:bg-[#3DC9F5] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="sparkles"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M11 3l1.5 4 4 1.5-4 1.5L11 14l-1.5-4-4-1.5 4-1.5L11 3zm8 9l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* The chat panel. AnimatePresence fades in/out, framer-motion slides
          up from the bottom-right on desktop and from the bottom on mobile. */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile-only backdrop dims the page behind the panel. */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[1001] bg-black/50 sm:hidden"
              aria-hidden
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-label="Theta AI chat"
              className="fixed z-[1002] bg-theta-card border border-theta-border shadow-2xl flex flex-col
                         inset-x-2 bottom-2 top-16 rounded-xl
                         sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:left-auto
                         sm:w-[420px] sm:max-h-[min(720px,calc(100vh-7rem))] sm:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-theta-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-theta-teal"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M11 3l1.5 4 4 1.5-4 1.5L11 14l-1.5-4-4-1.5 4-1.5L11 3zm8 9l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    Ask Theta AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="text-theta-muted hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body — scrolls if content exceeds height */}
              <div className="flex-1 overflow-y-auto p-4">
                <EdgeCloudPlayground compact />
              </div>

              {/* Footer note */}
              <div className="px-5 py-2.5 border-t border-theta-border flex-shrink-0 text-[10px] text-theta-muted text-center">
                Powered by Theta EdgeCloud · 10 requests/hour
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
