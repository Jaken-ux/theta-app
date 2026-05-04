import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: false },
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
          Journal
        </h1>
        <p className="text-theta-muted text-sm sm:text-base leading-relaxed">
          Notes from the work behind Theta Simplified — tests, debugging,
          ecosystem analysis, and the occasional late-night rabbit hole.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-theta-muted">No entries yet.</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="border-b border-theta-border pb-8 last:border-b-0"
            >
              <Link
                href={`/journal/${p.slug}`}
                className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-theta-teal/60 rounded-lg"
              >
                {p.featuredImage ? (
                  <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg border border-theta-border bg-theta-card">
                    <Image
                      src={p.featuredImage}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}
                <p className="text-xs text-theta-muted/70 tabular-nums mb-2">
                  {formatDate(p.date)}
                </p>
                <h2 className="text-xl sm:text-2xl font-semibold text-white group-hover:text-theta-teal transition-colors">
                  {p.title}
                </h2>
                {p.excerpt ? (
                  <p className="text-sm sm:text-base text-theta-muted mt-2 leading-relaxed">
                    {p.excerpt}
                  </p>
                ) : null}
                <span className="inline-block mt-3 text-sm text-theta-teal group-hover:underline">
                  Read more &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
