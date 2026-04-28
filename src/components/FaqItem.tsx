"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FAQ item with the same expand/collapse animation as SimplifyThis,
 * but with the question itself as the toggle label.
 *
 * Sized to live inside a bordered container — the parent draws the
 * outer border, this component handles its own bottom-divider.
 */
export default function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-theta-border/60 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-white hover:bg-theta-teal/5 transition-colors"
      >
        <span>{question}</span>
        <svg
          className={`w-4 h-4 mt-1.5 flex-shrink-0 text-theta-teal transition-transform ${
            open ? "rotate-45" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pr-12 text-sm text-theta-muted leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
