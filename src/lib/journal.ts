import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface JournalPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  featuredImage?: string;
  readTime?: string;
  tags?: string[];
  author?: string;
  /**
   * Whether the post is publicly listed and indexable. Defaults to
   * false — a post must opt in by setting `published: true` in its
   * frontmatter before it appears on /journal, in the sitemap, or
   * gets pre-rendered at build time. Drafts can still be viewed at
   * their URL by an authenticated admin (cookie-gated server-side).
   */
  published: boolean;
}

export interface JournalPost extends JournalPostMeta {
  content: string;
}

const POSTS_DIR = path.join(process.cwd(), "content", "journal");

function readAllFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
}

function parseFile(filename: string): JournalPost {
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const slug = filename.replace(/\.mdx$/, "");
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    excerpt: String(data.excerpt ?? ""),
    featuredImage:
      typeof data.featuredImage === "string" ? data.featuredImage : undefined,
    readTime: typeof data.readTime === "string" ? data.readTime : undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === "string")
      : undefined,
    author: typeof data.author === "string" ? data.author : undefined,
    // Default false — explicit opt-in via `published: true` to ship.
    published: data.published === true,
    content,
  };
}

function toMeta(post: JournalPost): JournalPostMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    readTime: post.readTime,
    tags: post.tags,
    author: post.author,
    published: post.published,
  };
}

/**
 * Public listing: only published posts, newest first. Used by the
 * /journal index page and the sitemap.
 */
export function getAllPosts(): JournalPostMeta[] {
  return readAllFiles()
    .map(parseFile)
    .filter((post) => post.published)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(toMeta);
}

/**
 * Loads a post by slug regardless of published status. The caller is
 * responsible for deciding whether to render it (e.g. checking the
 * admin cookie when post.published is false).
 */
export function getPostBySlug(slug: string): JournalPost | null {
  const filename = `${slug}.mdx`;
  if (!readAllFiles().includes(filename)) return null;
  return parseFile(filename);
}

/**
 * Slugs to pre-render at build time. Drafts are intentionally
 * excluded — they render on demand and are gated by the admin
 * cookie. This also keeps draft URLs out of the static output.
 */
export function getAllSlugs(): string[] {
  return readAllFiles()
    .map((f) => parseFile(f))
    .filter((post) => post.published)
    .map((post) => post.slug);
}
