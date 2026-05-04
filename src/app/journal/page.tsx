import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Builder Journal",
  description:
    "Experiments, working setups, and the actual process behind Thetasimplified.",
  alternates: { canonical: "https://thetasimplified.com/journal" },
  openGraph: {
    type: "website",
    title: "Builder Journal — Thetasimplified",
    description:
      "Experiments, working setups, and the actual process behind Thetasimplified.",
    url: "https://thetasimplified.com/journal",
  },
  twitter: {
    card: "summary",
    title: "Builder Journal — Thetasimplified",
    description:
      "Experiments, working setups, and the actual process behind Thetasimplified.",
  },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function JournalIndex() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Builder Journal
        </h1>
        <p className="text-theta-muted text-sm sm:text-base leading-relaxed">
          Experiments, working setups, and the actual process behind
          Thetasimplified.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-theta-muted">No entries yet.</p>
      ) : (
        <ul className="space-y-6 sm:space-y-8">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/journal/${p.slug}`}
                className="block group rounded-xl border border-theta-border bg-theta-card/40 hover:bg-theta-card hover:border-theta-teal/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-theta-teal/60"
              >
                {p.featuredImage ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-theta-card">
                    <Image
                      src={p.featuredImage}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theta-muted/80 tabular-nums mb-3">
                    <time>{formatDate(p.date)}</time>
                    {p.readTime ? (
                      <>
                        <span aria-hidden className="text-theta-muted/40">
                          ·
                        </span>
                        <span>{p.readTime} read</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-white group-hover:text-theta-teal transition-colors leading-snug">
                    {p.title}
                  </h2>

                  {p.excerpt ? (
                    <p className="text-sm sm:text-[15px] text-theta-muted mt-2 leading-relaxed line-clamp-3">
                      {p.excerpt}
                    </p>
                  ) : null}

                  {p.tags && p.tags.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5 mt-4">
                      {p.tags.map((tag) => (
                        <li
                          key={tag}
                          className="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide rounded-full border border-theta-border bg-theta-dark/60 text-theta-muted"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
