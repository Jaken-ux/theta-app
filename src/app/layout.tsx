import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import Nav from "../components/Nav";
import PageTracker from "../components/PageTracker";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Theta Simplified — Understand Theta Network",
    template: "%s | Theta Simplified",
  },
  description:
    "Plain-language explanations, live network stats, staking calculators, and honest analysis of the Theta Network. No jargon.",
  keywords: [
    "Theta Network",
    "THETA",
    "TFUEL",
    "Theta staking",
    "Theta explained",
    "Theta dashboard",
    "TFUEL staking calculator",
    "Theta main chain activity index",
    "crypto staking rewards",
    "decentralized video",
    "Theta edge node",
  ],
  authors: [{ name: "Theta Simplified" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Theta Simplified",
    title: "Theta Simplified — Understand Theta Network",
    description:
      "Plain-language explanations, live network stats, and honest analysis of the Theta Network.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Theta Simplified",
    description:
      "Understand Theta Network — live data, staking calculators, and plain-language explanations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Theta Simplified",
              url: "https://theta-simplified.vercel.app",
              description:
                "Plain-language explanations, live network stats, and honest analysis of the Theta Network.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://theta-simplified.vercel.app/network",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <Nav />
        <PageTracker />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 pt-2">
          <Link
            href="/methodology"
            className="text-[13px] text-[#7D8694] hover:text-[#B0B8C4] transition-colors"
          >
            How we calculate this &rarr;
          </Link>
        </footer>
      </body>
    </html>
  );
}
