import { getCollection } from 'astro:content';
import blogPosts from '../data/blogPosts.js';

type SitemapPage = {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

export async function GET({ site }: { site?: { origin: string } }) {
  const siteUrl = site?.origin || 'https://www.teamrespawn.net';
  
  // Static pages
  const staticPages = [
    {
      url: '',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      url: '/blog',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/halo-wars-guides',
      lastmod: '2026-01-27',
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/age-of-empires-guides',
      lastmod: '2026-01-27',
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/age-of-mythology-guides',
      lastmod: '2026-01-27',
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/storehaus',
      lastmod: '2026-01-27',
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/videos',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/halo-wars-stats',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/halo-wars-de-player-count',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '0.8'
    },
    {
      url: '/about',
      lastmod: '2026-01-27',
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/support',
      lastmod: '2026-01-27',
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/partner',
      lastmod: '2026-01-27',
      changefreq: 'monthly',
      priority: '0.7'
    }
  ];

  const legacyBlogPages: SitemapPage[] = blogPosts.map((post) => ({
    url: post.href,
    lastmod: post.dateIso || new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.7',
  }));

  let contentBlogPages: SitemapPage[] = [];
  try {
    const entries = await getCollection(
      'blog',
      (e) => !e.data.draft && Boolean(e.data.canonicalPath)
    );
    contentBlogPages = entries.map((e) => ({
      url: e.data.canonicalPath!,
      lastmod: e.data.dateIso || new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.7',
    }));
  } catch {
    // tolerate environments where content collections are unavailable
  }

  const seen = new Set<string>();
  const blogPostPages = [...legacyBlogPages, ...contentBlogPages].filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  // Combine all pages
  const allPages: SitemapPage[] = [...staticPages, ...blogPostPages];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => `    <url>
        <loc>${siteUrl}${page.url}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
