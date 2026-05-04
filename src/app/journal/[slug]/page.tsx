import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Individual journal post template — also hidden from search engines.
 *
 * Looks up the slug against a (currently empty) post source. Until
 * actual posts exist, every slug returns 404 via notFound(). When
 * posts are added later, replace `lookupPost` with a real loader
 * (filesystem, DB, MDX bundler, etc.) and the page chrome below
 * will render the title, date, and content body.
 */

export const metadata: Metadata = {
  title: "Journal entry",
  robots: { index: false, follow: false },
};

interface JournalPost {
  slug: string;
  title: string;
  publishedAt: string;
  body: string;
}

function lookupPost(_slug: string): JournalPost | null {
  return null;
}

export default async function JournalPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = lookupPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl mx-auto space-y-6">
      <header>
        <p className="text-xs text-theta-muted tabular-nums">
          {post.publishedAt}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {post.title}
        </h1>
      </header>
      <div className="prose prose-invert max-w-none text-theta-muted leading-relaxed">
        {post.body}
      </div>
    </article>
  );
}
