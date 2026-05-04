import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface JournalPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  featuredImage?: string;
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
    content,
  };
}

export function getAllPosts(): JournalPostMeta[] {
  return readAllFiles()
    .map(parseFile)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(
      (post): JournalPostMeta => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
      })
    );
}

export function getPostBySlug(slug: string): JournalPost | null {
  const filename = `${slug}.mdx`;
  if (!readAllFiles().includes(filename)) return null;
  return parseFile(filename);
}

export function getAllSlugs(): string[] {
  return readAllFiles().map((f) => f.replace(/\.mdx$/, ""));
}
