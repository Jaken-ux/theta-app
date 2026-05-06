import type { Metadata } from "next";

// page.tsx in this directory is a client component and cannot export
// metadata, so the canonical + robots tags live here instead. Without
// this file, the page would inherit the homepage canonical from the
// root layout — which Google flagged as "Duplicate, Google chose
// different canonical than user".
export const metadata: Metadata = {
  alternates: { canonical: "https://thetasimplified.com/research" },
  robots: { index: false, follow: false },
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
