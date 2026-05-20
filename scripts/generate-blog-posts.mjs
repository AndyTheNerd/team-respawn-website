#!/usr/bin/env node
/**
 * Generates src/data/blogPosts.js from blog post .astro files + optional overrides.
 *
 * Source of truth for post content: src/pages/blog/posts/*.astro (BlogPostLayout props).
 * Optional catalog tweaks: src/data/blogCatalogOverrides.json (excerpt, featured, readingTimeMinutes, img).
 *
 * Usage:
 *   node scripts/generate-blog-posts.mjs
 *   node scripts/generate-blog-posts.mjs --bootstrap-overrides   # one-time: create overrides from current blogPosts.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'src/pages/blog/posts');
const overridesPath = path.join(root, 'src/data/blogCatalogOverrides.json');
const outputPath = path.join(root, 'src/data/blogPosts.js');

const bootstrapOverrides = process.argv.includes('--bootstrap-overrides');

function unescapeString(value) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n');
}

function parseStringLiteral(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeString(trimmed.slice(1, -1));
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return unescapeString(trimmed.slice(1, -1));
  }
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return unescapeString(trimmed.slice(1, -1));
  }
  return null;
}

function parseTagsArray(raw) {
  const inner = raw.trim().replace(/^\[|\]$/g, '');
  if (!inner.trim()) return [];
  const tags = [];
  const re = /['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(inner))) {
    tags.push(match[1]);
  }
  return tags;
}

function extractFrontmatterConsts(source) {
  const consts = {};
  const frontmatterEnd = source.indexOf('<BlogPostLayout');
  const header = frontmatterEnd > 0 ? source.slice(0, frontmatterEnd) : source;

  const stringConstRe = /^const\s+(\w+)\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)\s*;?\s*$/gm;
  let match;
  while ((match = stringConstRe.exec(header))) {
    consts[match[1]] = parseStringLiteral(match[2]);
  }

  const tagsConstRe = /^const\s+(\w+)\s*=\s*(\[[^\]]*\])\s*;?\s*$/gm;
  while ((match = tagsConstRe.exec(header))) {
    consts[match[1]] = parseTagsArray(match[2]);
  }

  return consts;
}

function resolvePropValue(raw, consts) {
  const trimmed = raw.trim();
  const literal = parseStringLiteral(trimmed);
  if (literal !== null) return literal;
  if (/^\{[^}]+\}$/.test(trimmed)) {
    const name = trimmed.slice(1, -1).trim();
    return consts[name] ?? null;
  }
  return null;
}

function parseBlogPostLayoutProps(source, consts) {
  const layoutStart = source.indexOf('<BlogPostLayout');
  if (layoutStart < 0) return {};

  const layoutSlice = source.slice(layoutStart);
  const propsEnd = layoutSlice.indexOf('>');
  const propsBlock = layoutSlice.slice(0, propsEnd);

  const props = {};
  const propRe = /(\w+)=\{?("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\[[^\]]*\]|\{[^}]+\})\}?/g;
  let match;
  while ((match = propRe.exec(propsBlock))) {
    const key = match[1];
    const raw = match[2];
    if (raw.startsWith('[')) {
      props[key] = parseTagsArray(raw);
    } else {
      props[key] = resolvePropValue(raw, consts);
    }
  }

  return props;
}

function parseAstroPost(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.astro');
  const consts = extractFrontmatterConsts(source);
  const props = parseBlogPostLayoutProps(source, consts);

  const title = props.title ?? consts.title;
  const description = props.description ?? consts.description;
  const category = props.category ?? consts.category;
  const dateIso = props.dateIso ?? consts.dateIso;
  const tags = props.tags ?? consts.tags ?? [];
  const ogImage = props.ogImage ?? consts.ogImage;
  const youtubeId = props.youtubeId ?? consts.youtubeId;

  if (!title || !dateIso || !category) {
    throw new Error(`${slug}: missing required title, dateIso, or category`);
  }

  return {
    slug,
    title,
    description: description ?? '',
    category,
    dateIso,
    tags: Array.isArray(tags) ? tags : [],
    ogImage: ogImage ?? null,
    youtubeId: youtubeId ?? null,
    href: `/blog/posts/${slug}`,
  };
}

function buildCardImage(post, overrideImg) {
  if (overrideImg) return overrideImg;

  const src =
    post.ogImage ||
    (post.youtubeId ? `https://img.youtube.com/vi/${post.youtubeId}/maxresdefault.jpg` : null);

  if (!src) return null;

  return {
    src,
    alt: post.title,
    width: 400,
    height: 225,
    lazy: true,
  };
}

function loadOverrides() {
  if (!fs.existsSync(overridesPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
}

function serializePost(post) {
  const lines = ['  {'];
  lines.push(`    title: ${JSON.stringify(post.title)},`);
  lines.push(`    dateIso: ${JSON.stringify(post.dateIso)},`);
  lines.push(`    category: ${JSON.stringify(post.category)},`);
  if (post.tags?.length) {
    lines.push(`    tags: ${JSON.stringify(post.tags)},`);
  }
  if (typeof post.readingTimeMinutes === 'number') {
    lines.push(`    readingTimeMinutes: ${post.readingTimeMinutes},`);
  }
  if (post.featured === true) {
    lines.push(`    featured: true,`);
  } else if (post.featured === false) {
    lines.push(`    featured: false,`);
  }
  lines.push(`    excerpt: ${JSON.stringify(post.excerpt)},`);
  lines.push(`    href: ${JSON.stringify(post.href)},`);
  if (post.img) {
    lines.push(`    img: {`);
    lines.push(`      src: ${JSON.stringify(post.img.src)},`);
    if (post.img.cloudinaryId) {
      lines.push(`      cloudinaryId: ${JSON.stringify(post.img.cloudinaryId)},`);
    }
    lines.push(`      alt: ${JSON.stringify(post.img.alt)},`);
    lines.push(`      width: ${post.img.width},`);
    lines.push(`      height: ${post.img.height},`);
    lines.push(`      lazy: ${post.img.lazy}`);
    lines.push(`    }`);
  }
  lines.push('  }');
  return lines.join('\n');
}

async function bootstrapOverridesFromExisting() {
  const existingUrl = pathToFileURL(outputPath).href;
  const { default: existing } = await import(existingUrl);
  const astroFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith('.astro'));
  const parsedByHref = new Map();

  for (const file of astroFiles) {
    const post = parseAstroPost(path.join(postsDir, file));
    parsedByHref.set(post.href, post);
  }

  const overrides = {};

  for (const row of existing) {
    const slug = row.href.split('/').pop();
    const parsed = parsedByHref.get(row.href);
    if (!parsed) {
      console.warn(`bootstrap: catalog entry without .astro file: ${row.href}`);
      continue;
    }

    const entry = {};
    const normalizedDescription = (parsed.description ?? '').trim();
    const normalizedExcerpt = (row.excerpt ?? '').trim();

    if (normalizedExcerpt && normalizedExcerpt !== normalizedDescription) {
      entry.excerpt = row.excerpt;
    }
    if (row.featured === true || row.featured === false) {
      entry.featured = row.featured;
    }
    if (typeof row.readingTimeMinutes === 'number' && row.readingTimeMinutes > 0) {
      entry.readingTimeMinutes = row.readingTimeMinutes;
    }
    if (row.img?.src) {
      const generated = buildCardImage(parsed);
      if (
        !generated ||
        generated.src !== row.img.src ||
        generated.alt !== row.img.alt
      ) {
        entry.img = row.img;
      }
    }

    if (Object.keys(entry).length > 0) {
      overrides[slug] = entry;
    }
  }

  fs.writeFileSync(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${Object.keys(overrides).length} override(s) to ${overridesPath}`);
}

function generateBlogPosts() {
  const overrides = loadOverrides();
  const astroFiles = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.astro'))
    .sort();

  const posts = [];
  const errors = [];

  for (const file of astroFiles) {
    try {
      const parsed = parseAstroPost(path.join(postsDir, file));
      const override = overrides[parsed.slug] ?? {};

      const catalogPost = {
        title: parsed.title,
        dateIso: parsed.dateIso,
        category: parsed.category,
        tags: override.tags ?? parsed.tags,
        href: parsed.href,
        excerpt: override.excerpt ?? parsed.description,
        featured: override.featured,
        readingTimeMinutes: override.readingTimeMinutes,
        img: buildCardImage(parsed, override.img),
      };

      posts.push(catalogPost);
    } catch (err) {
      errors.push(String(err));
    }
  }

  if (errors.length) {
    console.error('Failed to parse blog posts:\n' + errors.join('\n'));
    process.exit(1);
  }

  posts.sort((a, b) => {
    const aDate = Date.parse(a.dateIso) || 0;
    const bDate = Date.parse(b.dateIso) || 0;
    return bDate - aDate;
  });

  const header = `// AUTO-GENERATED by scripts/generate-blog-posts.mjs — do not edit by hand.
// Catalog metadata is sourced from src/pages/blog/posts/*.astro (BlogPostLayout props).
// Optional overrides: src/data/blogCatalogOverrides.json

`;

  const body = `const blogPosts = [\n${posts.map(serializePost).join(',\n')}\n];\n\nexport default blogPosts;\n`;
  fs.writeFileSync(outputPath, header + body, 'utf-8');
  console.log(`Generated ${posts.length} post(s) → ${outputPath}`);
}

if (bootstrapOverrides) {
  await bootstrapOverridesFromExisting();
} else {
  generateBlogPosts();
}
