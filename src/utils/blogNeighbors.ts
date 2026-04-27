import blogPosts from '../data/blogPosts.js';

type BlogPostRow = (typeof blogPosts)[number];

function sortLikeBlogIndex(posts: typeof blogPosts): BlogPostRow[] {
  return [...posts].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    const aD = a.dateIso ? Date.parse(a.dateIso) : 0;
    const bD = b.dateIso ? Date.parse(b.dateIso) : 0;
    return bD - aD;
  });
}

const READING_WPM = 200;

/**
 * When `readingTimeMinutes` is omitted in `blogPosts.js`, estimate from catalog text.
 * Short excerpts (especially walkthrough blurbs) are not proportional to long articles — we
 * scale aggressively and use title/category hints. Override with `readingTimeMinutes` for exact values.
 */
export function estimateReadingMinutesForPost(post: BlogPostRow): number {
  const explicit = (post as { readingTimeMinutes?: number }).readingTimeMinutes;
  if (typeof explicit === 'number' && explicit > 0) return explicit;

  const excerpt = (post.excerpt ?? '').trim();
  const title = (post.title ?? '').trim();
  const excerptWords = excerpt.split(/\s+/).filter(Boolean).length;
  const blob = `${title} ${excerpt}`.toLowerCase();
  const category = post.category ?? '';

  // Base: catalog blurbs are much shorter than the rendered article.
  let inferredWords = excerptWords * 40;

  if (category === 'Walkthroughs') {
    inferredWords = Math.max(inferredWords, excerptWords * 52);
    if (
      /full campaign|co-op legendary|mission by mission|mission-by-mission|operation spearbreaker|complete run/.test(
        blob
      )
    ) {
      inferredWords = Math.max(inferredWords, 2400);
    } else if (/walkthrough|campaign/.test(blob)) {
      inferredWords = Math.max(inferredWords, 1200);
    }
  } else if (category === 'Guides') {
    inferredWords = Math.max(inferredWords, excerptWords * 36);
    if (/^\d+\s+tips?\b/i.test(title) || /tips for/.test(blob)) {
      inferredWords = Math.max(inferredWords, 950);
    } else if (/how to play as|beginner|ranking every|advanced |super turtle|air spam/.test(blob)) {
      inferredWords = Math.max(inferredWords, 1100);
    }
  } else if (category === 'Reviews') {
    inferredWords = Math.max(inferredWords, excerptWords * 32, 480);
  } else {
    inferredWords = Math.max(inferredWords, excerptWords * 30, 350);
  }

  const minutesUncapped = Math.ceil(inferredWords / READING_WPM);

  const floorByCategory: Record<string, number> = {
    Walkthroughs: 8,
    Guides: 4,
    Reviews: 4,
    Spotlight: 3,
  };
  const capByCategory: Record<string, number> = {
    Walkthroughs: 60,
    Guides: 45,
    Reviews: 28,
    Spotlight: 18,
  };

  const floor = floorByCategory[category] ?? 3;
  const cap = capByCategory[category] ?? 40;

  return Math.min(cap, Math.max(floor, minutesUncapped));
}

/**
 * Neighbors in chronological reading order: `prev` = older post, `next` = newer post
 * (catalog is sorted newest-first like `/blog`).
 */
export function getBlogNeighborsForPathname(pathname: string): {
  prev: BlogPostRow | null;
  next: BlogPostRow | null;
  readingMinutes: number | null;
} {
  const href = pathname.replace(/\/$/, '') || pathname;
  const sorted = sortLikeBlogIndex(blogPosts);
  const idx = sorted.findIndex((p) => p.href === href);
  if (idx === -1) {
    return { prev: null, next: null, readingMinutes: null };
  }
  const post = sorted[idx];
  return {
    prev: sorted[idx + 1] ?? null,
    next: sorted[idx - 1] ?? null,
    readingMinutes: estimateReadingMinutesForPost(post),
  };
}
