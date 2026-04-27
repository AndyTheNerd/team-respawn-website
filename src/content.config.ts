import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Optional MD/MDX posts under `src/content/blog/`.
 * The live catalog remains [`src/data/blogPosts.js`](src/data/blogPosts.js) until entries set `canonicalPath` and are wired to routes.
 */
const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    dateIso: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    youtubeId: z.string().optional(),
    ogImage: z.string().optional(),
    /** When set on a non-draft post, merged into [`src/pages/sitemap.xml.ts`](src/pages/sitemap.xml.ts). */
    canonicalPath: z.string().optional(),
  }),
});

export const collections = { blog };
