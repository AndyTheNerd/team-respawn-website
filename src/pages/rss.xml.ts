import type { APIRoute } from 'astro';
import blogPosts from '../data/blogPosts.js';
import { SITE_URL } from '../config.js';

const siteUrl = SITE_URL || 'https://www.teamrespawn.net';

function sortPostsByDateDesc(posts: typeof blogPosts) {
  return [...posts].sort((a, b) => {
    const aD = a.dateIso ? Date.parse(a.dateIso) : 0;
    const bD = b.dateIso ? Date.parse(b.dateIso) : 0;
    return bD - aD;
  });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toUTCString();
}

function escapeXml(unsafe: unknown) {
  const s = unsafe == null ? '' : String(unsafe);
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export const GET: APIRoute = async () => {
  const recentPosts = sortPostsByDateDesc(blogPosts).slice(0, 20);

  const rssItems = recentPosts
    .map(
      (post) => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <description>${escapeXml(post.excerpt ?? '')}</description>
    <link>${siteUrl}${post.href}</link>
    <guid>${siteUrl}${post.href}</guid>
    <pubDate>${formatDate(post.dateIso)}</pubDate>
    <category>${escapeXml(post.category)}</category>
    ${(post.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n    ')}
  </item>`
    )
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml('Team Respawn - Gaming Walkthroughs & Strategy Guides')}</title>
    <description>Team Respawn is a thriving gaming channel led by Andy, dedicated to strategy lovers - especially fans of Halo Wars, Halo FPS, and Age of Empires. Watch full walkthroughs and in-depth strategy guides.</description>
    <link>${siteUrl}</link>
    <language>en-us</language>
    <copyright>Copyright ${new Date().getFullYear()} Team Respawn. All rights reserved.</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Team Respawn RSS Feed</generator>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/content/Team-Respawn-Full.png</url>
      <title>Team Respawn</title>
      <link>${siteUrl}</link>
      <width>144</width>
      <height>40</height>
    </image>
${rssItems}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
