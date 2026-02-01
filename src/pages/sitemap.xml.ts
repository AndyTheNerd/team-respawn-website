import blogPosts from '../data/blogPosts.js';

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
      url: '/storehaus-info',
      lastmod: '2026-01-27',
      changefreq: 'monthly',
      priority: '0.7'
    }
  ];

  // Generate blog post URLs from blogPosts data
  const blogPostPages = blogPosts.map(post => ({
    url: post.href,
    lastmod: post.dateIso || new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.7'
  }));

  // Combine all pages
  const allPages = [...staticPages, ...blogPostPages];

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
