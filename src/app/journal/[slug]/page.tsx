import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAllSlugs, getPostBySlug } from "@/lib/journal";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return {
      title: "Journal entry",
      robots: { index: false, follow: false },
    };
  }
  const ogImage = post.featuredImage
    ? `https://thetasimplified.com${post.featuredImage}`
    : undefined;
  return {
    title: post.title,
    description: post.excerpt,
    robots: { index: false, follow: false },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

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

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-2xl sm:text-3xl font-bold text-white mt-12 mb-4 leading-tight"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-xl sm:text-2xl font-semibold text-white mt-10 mb-3 leading-snug"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-[17px] leading-[1.7] text-theta-muted my-5"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal transition-colors"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc pl-6 my-5 text-[17px] leading-[1.7] text-theta-muted space-y-2 marker:text-theta-teal/60"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal pl-6 my-5 text-[17px] leading-[1.7] text-theta-muted space-y-2 marker:text-theta-teal/60"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-theta-teal/60 pl-5 my-7 italic text-[17px] leading-[1.7] text-white/80"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="px-1.5 py-0.5 rounded bg-theta-card border border-theta-border text-[0.92em] text-theta-teal font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-6 p-4 rounded-lg bg-theta-card border border-theta-border overflow-x-auto text-sm leading-relaxed text-white/90 font-mono [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:text-inherit"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-theta-border" />,
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-7 overflow-x-auto rounded-lg border border-theta-border">
      <table
        className="w-full text-[15px] leading-[1.55] border-collapse"
        {...props}
      />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-theta-card/70 text-white" {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="text-theta-muted" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-theta-border/60 last:border-b-0" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-2.5 text-left font-semibold text-white"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2.5 align-top" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-white font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="text-white/90 italic" {...props} />
  ),
  img: ({
    src,
    alt,
  }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    if (typeof src !== "string") return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className="my-7 w-full rounded-lg border border-theta-border"
      />
    );
  },
};

export default async function JournalEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-2xl mx-auto px-1 sm:px-0">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-sm text-theta-muted hover:text-theta-teal transition-colors mb-8"
      >
        <span aria-hidden>&larr;</span>
        Back to Journal
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-theta-muted/80 tabular-nums mt-4">
          <time>{formatDate(post.date)}</time>
          {post.readTime ? (
            <>
              <span aria-hidden className="text-theta-muted/40">
                ·
              </span>
              <span>{post.readTime} read</span>
            </>
          ) : null}
          {post.author ? (
            <>
              <span aria-hidden className="text-theta-muted/40">
                ·
              </span>
              <span>{post.author}</span>
            </>
          ) : null}
        </div>
        {post.tags && post.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 mt-4">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide rounded-full border border-theta-border bg-theta-dark/60 text-theta-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {post.featuredImage ? (
        <div className="relative aspect-[16/9] mb-10 overflow-hidden rounded-lg border border-theta-border bg-theta-card">
          <Image
            src={post.featuredImage}
            alt=""
            fill
            sizes="(min-width: 768px) 700px, 100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="text-theta-muted">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{
            mdxOptions: { remarkPlugins: [remarkGfm] },
          }}
        />
      </div>

      <div className="mt-16 pt-8 border-t border-theta-border">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-sm text-theta-muted hover:text-theta-teal transition-colors"
        >
          <span aria-hidden>&larr;</span>
          Back to Journal
        </Link>
      </div>
    </article>
  );
}
