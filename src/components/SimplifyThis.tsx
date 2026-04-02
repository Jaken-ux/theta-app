"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SimplifyThis({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2AB8E6]/70 hover:text-[#2AB8E6] transition-colors group"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-45" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>{open ? "Got it" : "Simplify this"}</span>
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
            <div className="mt-3 bg-[#2AB8E6]/5 border border-[#2AB8E6]/15 rounded-xl p-4 text-sm text-[#D1D5DB] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
