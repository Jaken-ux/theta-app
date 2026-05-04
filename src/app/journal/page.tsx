import type { Metadata } from "next";

/**
 * Hidden journal index — not linked from the nav, not indexed by
 * search engines (see robots.ts), not advertised anywhere yet.
 * Renders an empty list when posts is empty so visiting the page
 * directly returns nothing meaningful, by design.
 *
 * To start publishing: replace `posts` with the actual post source
 * (file-based MDX, DB, etc.) and add a link in the nav.
 */
export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: false },
};

interface JournalEntry {
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
}

const posts: JournalEntry[] = [];

export default function JournalIndex() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Journal</h1>
        <p className="text-theta-muted text-sm">
          Notes from the work behind Theta Simplified.
        </p>
      </header>

      {posts.length === 0 ? null : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="border-b border-theta-border pb-6 last:border-b-0"
            >
              <a href={`/journal/${p.slug}`} className="block group">
                <p className="text-xs text-theta-muted/70 tabular-nums mb-1">
                  {p.publishedAt}
                </p>
                <h2 className="text-lg font-semibold text-white group-hover:text-theta-teal transition-colors">
                  {p.title}
                </h2>
                <p className="text-sm text-theta-muted mt-1 leading-relaxed">
                  {p.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
