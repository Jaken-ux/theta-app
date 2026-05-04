"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LearnMore({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 mt-3 text-xs text-[#B0B8C4] hover:text-white transition-colors py-1"
      >
        <span>{open ? "Show less" : "Learn more"}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
