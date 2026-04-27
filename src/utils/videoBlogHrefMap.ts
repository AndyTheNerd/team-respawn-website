import fs from 'node:fs';
import path from 'node:path';

/** Minimal blog catalog shape: [`src/data/blogPosts.js`](src/data/blogPosts.js). */
export type BlogPostForVideoMap = {
  href: string;
  img?: { src?: string };
  /** Optional explicit ID when the hero image is not a YouTube thumbnail URL. */
  youtubeId?: string;
};

const YOUTUBE_VI_IN_URL = /(?:img\.youtube\.com|i\.ytimg\.com)\/vi\/([^/?#]+)\//;

export function extractYoutubeIdFromBlogImgSrc(src: string | undefined): string | null {
  if (!src) return null;
  const match = src.match(YOUTUBE_VI_IN_URL);
  return match?.[1] ?? null;
}

function register(
  map: Map<string, string>,
  videoId: string | undefined | null,
  href: string,
): void {
  const id = String(videoId || '').trim();
  if (!id || !href) return;
  if (map.has(id)) return;
  map.set(id, href);
}

/**
 * Maps YouTube video IDs to on-site blog URLs. Sources (in order):
 * 1. `youtubeId="…"` in each `src/pages/blog/posts/*.astro` file (canonical href from filename).
 * 2. [`blogPosts.js`](src/data/blogPosts.js): optional `youtubeId`, else YouTube thumbnail URLs in `img.src`.
 */
export function buildVideoIdToBlogHrefMap(posts: readonly BlogPostForVideoMap[]): Map<string, string> {
  const map = new Map<string, string>();
  const postsDir = path.join(process.cwd(), 'src/pages/blog/posts');

  if (fs.existsSync(postsDir)) {
    for (const file of fs.readdirSync(postsDir)) {
      if (!file.endsWith('.astro')) continue;
      const fullPath = path.join(postsDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(/youtubeId\s*=\s*["']([^"']+)["']/);
      if (!match?.[1]) continue;
      const slug = file.slice(0, -'.astro'.length);
      register(map, match[1], `/blog/posts/${slug}`);
    }
  }

  for (const post of posts) {
    const explicit = typeof post.youtubeId === 'string' ? post.youtubeId.trim() : '';
    const fromImg = extractYoutubeIdFromBlogImgSrc(post.img?.src);
    const id = explicit || fromImg;
    if (id) register(map, id, post.href);
  }

  return map;
}
