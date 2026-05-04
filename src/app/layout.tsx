import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import Nav from "../components/Nav";
import PageTracker from "../components/PageTracker";
import FloatingChatButton from "../components/FloatingChatButton";
import { Analytics } from "@vercel/analytics/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thetasimplified.com"),
  alternates: {
    canonical: "https://thetasimplified.com",
  },
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
    url: "https://thetasimplified.com",
    siteName: "Theta Simplified",
    title: "Theta Simplified — Understand Theta Network",
    description:
      "Live indexes tracking Theta Network ecosystem health — Main Chain Activity, Metachain Utilization, and TFUEL economics.",
    images: [
      {
        url: "https://thetasimplified.com/preview",
        width: 1200,
        height: 630,
        alt: "Theta Simplified — Live Theta Network indexes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Theta Simplified",
    description:
      "Live indexes tracking Theta Network ecosystem health — Main Chain Activity, Metachain Utilization, and TFUEL economics.",
    images: ["https://thetasimplified.com/preview"],
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
              url: "https://thetasimplified.com",
              description:
                "Plain-language explanations, live network stats, and honest analysis of the Theta Network.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://thetasimplified.com/network",
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
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-8 text-center">
          <Link
            href="/methodology"
            className="text-[13px] text-[#7D8694] hover:text-[#B0B8C4] transition-colors"
          >
            How we calculate this &rarr;
          </Link>
        </footer>
        <FloatingChatButton />
        <Analytics />
      </body>
    </html>
  );
}
