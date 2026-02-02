import blogPosts from '../data/blogPosts.js';
import { SITE_URL } from '../config.js';

const siteUrl = SITE_URL || 'https://www.teamrespawn.net';

// Get the 20 most recent posts
const recentPosts = blogPosts.slice(0, 20);

// Function to format date for RSS
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toUTCString();
}

// Function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Generate RSS items
const rssItems = recentPosts.map(post => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <description>${escapeXml(post.excerpt)}</description>
    <link>${siteUrl}${post.href}</link>
    <guid>${siteUrl}${post.href}</guid>
    <pubDate>${formatDate(post.dateIso)}</pubDate>
    <category>${escapeXml(post.category)}</category>
    ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n    ')}
  </item>`).join('\n');

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

export function GET() {
  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
