"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/network", label: "Network" },
  { href: "/metachain", label: "Metachain" },
  { href: "/earn", label: "Earn" },
  { href: "/get-started", label: "Get Started" },
  { href: "/theta-explained", label: "Deep Dive" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);

  // Close menu when navigation completes (pathname changes)
  useEffect(() => {
    setOpen(false);
    setNavigating(null);
  }, [pathname]);

  // Warm the metachain data cache in the background so that when the user
  // navigates to /metachain it renders instantly. Skip when already on that
  // page (the page itself fetches the data).
  useEffect(() => {
    if (pathname === "/metachain") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/metachain", { signal: controller.signal }).catch(() => {});
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pathname]);

  function handleLinkClick(href: string) {
    if (href === pathname) {
      // Already on this page, just close
      setOpen(false);
      return;
    }
    // Show loading state, keep menu open
    setNavigating(href);
  }

  return (
    <nav className="border-b border-theta-border bg-[#0A0F1C] sticky top-0 z-[1000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="text-lg font-semibold text-white">
          Θ Theta Simplified
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === link.href
                  ? "bg-theta-teal/10 text-theta-teal"
                  : "text-theta-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-theta-muted hover:text-white transition-colors"
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 top-14 bg-[#0A0F1C] z-[999] md:hidden overflow-hidden">
          <div className="px-4 py-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const isLoading = navigating === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg text-base transition-colors ${
                    isActive
                      ? "bg-theta-teal/10 text-theta-teal"
                      : isLoading
                      ? "bg-[#151D2E] text-white"
                      : "text-theta-muted hover:text-white hover:bg-[#151D2E]"
                  }`}
                >
                  <span>{link.label}</span>
                  {isLoading && (
                    <svg className="w-4 h-4 animate-spin text-theta-teal" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
