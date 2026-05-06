import type { Metadata } from "next";

// page.tsx in this directory is a client component and cannot export
// metadata. Same pattern as the parent /research layout — overrides
// the inherited homepage canonical so Google sees the right URL.
export const metadata: Metadata = {
  alternates: {
    canonical: "https://thetasimplified.com/research/trajectory",
  },
  robots: { index: false, follow: false },
};

export default function ResearchTrajectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
