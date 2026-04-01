"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/network", label: "Network" },
  { href: "/earn", label: "Earn" },
  { href: "/get-started", label: "Get Started" },
  { href: "/theta-explained", label: "Deep Dive" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-theta-border bg-theta-dark/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="text-lg font-semibold text-white">
          Θ Theta Explorer
        </Link>
        <div className="flex gap-1">
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
      </div>
    </nav>
  );
}
