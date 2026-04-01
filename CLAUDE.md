# Team Respawn Website — AI Agent Context

This file provides context for AI agents working on this codebase. Read it before making changes.

## Agent Rules

- **Update `README.md` when adding a major feature.** Major features include new pages, new API endpoints, new database tables/migrations, and new integrations. Keep the Features section and Scripts section in sync with what actually exists.

---

## Project Overview

**Team Respawn** is a gaming content website for Andy's YouTube channel, focused on strategy RTS games — primarily Halo Wars 2, Age of Empires, and Age of Mythology. The site hosts blog posts (guides, walkthroughs, reviews), a video database, Halo Wars 2 live stats lookup, a Halo Wars: Definitive Edition Steam player count tracker, and info on related projects (Storehaus Bot, Halo Quotes, AOE2 API).

- **Live site:** https://www.teamrespawn.net
- **YouTube:** https://www.youtube.com/@TeamRespawn
- **Hosted on:** Cloudflare Pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro v5 (file-based routing, `.astro` components) |
| UI library | WebcoreUI v1.3 (Tailwind CSS utilities) |
| Styling | SCSS via `sass` (modern-compiler API) |
| Language | TypeScript + ES modules |
| Hosting | Cloudflare Pages |
| Serverless functions | Cloudflare Pages Functions (`functions/` dir) |
| Database | Cloudflare D1 (SQLite, used for API response caching) |
| Images | Cloudinary (optimization + delivery) |
| Build tool | Vite (configured inside Astro) |

---

## Key Commands

```bash
npm run dev          # Astro dev server → http://localhost:4321 (no CF functions)
npm run dev:cf       # Cloudflare Pages dev with D1/Functions via wrangler proxy
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run add-video    # Interactive script to add a new video entry
```

**DB migrations (remote Cloudflare D1):**
```bash
npm run cf:d1:migrate   # Run all migrations 1–5
npm run cf:d1:migrate:8 # Run migration 8 (match summaries) — run separately
```

> Use `npm run dev` for UI/content work. Use `npm run dev:cf` when testing API functions or D1 queries — it proxies Astro through wrangler so Pages Functions are live.

---

## Project Structure

```
team-respawn-website/
├── functions/api/         # Cloudflare Pages Functions (serverless API)
│   ├── hw2/               # Halo Wars 2 API endpoints
│   └── youtube/           # YouTube latest videos endpoint
├── migrations/            # Cloudflare D1 SQL migrations (numbered 0001–0008)
├── public/                # Static assets (served as-is, no processing)
│   ├── data/              # JSON data: videos.json, projects.json, taglines.json
│   └── img/               # Game guide images, walkthrough screenshots
├── scripts/               # Node utility scripts (add-video.mjs)
├── src/
│   ├── blocks/            # Reusable content blocks (Author, Socials)
│   ├── components/        # Astro components (Header, Footer, SidePanel, etc.)
│   ├── data/              # All site data as TS/JS modules
│   │   ├── haloWars2/     # HW2 static data (leaders, maps, CSR, name mappings)
│   │   └── videos-YYYY.ts # Video entries organized by year
│   ├── layouts/           # Page layouts (BaseLayout, BlogPostLayout, SecondaryPageLayout)
│   ├── lib/hw2/           # HW2 match rendering logic (display helpers)
│   ├── pages/             # File-based routes — every .astro file here = a URL
│   ├── styles/            # Global SCSS (webcore.scss, blog-overrides.scss)
│   ├── utils/             # Shared utilities (haloApi.ts)
│   └── config.js          # SITE_URL, SITE_NAME, SITE_DESCRIPTION constants
├── workers/               # Wrangler config for Pages Functions build
│   └── wrangler.toml      # Points build output to ../dist, defines D1 binding
├── astro.config.mjs       # Astro + WebcoreUI integration, SCSS config, path aliases
└── wrangler.toml          # Root Cloudflare config (D1 binding, env vars)
```

---

## Environment Variables

Required in `.env` for local development (see `.env.example`):

```
# Cloudinary image delivery
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Halo Wars 2 API — 3 keys rotated to handle rate limits
PUBLIC_HW2_API_KEY_1
PUBLIC_HW2_API_KEY_2
PUBLIC_HW2_API_KEY_3

# Cloudflare Analytics (used on /partner page at build time)
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID
```

In production these are set as Cloudflare Pages secrets. `wrangler.toml` also defines `STORE_RAW_MATCHES`, `STORE_RAW_EVENTS`, `CLEANUP_SECRET`, `GROQ_API_KEY`, and `CEREBRAS_API_KEY` as vars (currently only the first two are active).

---

## Conventions & Patterns

### Pages / Routing
- Astro's file-based routing: `src/pages/foo.astro` → `/foo`
- Blog posts live in `src/pages/blog/posts/[slug].astro`
- All pages use `BaseLayout.astro` or `BlogPostLayout.astro` for `<head>`, SEO, and nav

### Blog Posts
Each post is an `.astro` file in `src/pages/blog/posts/` **and** has a metadata entry in `src/data/blogPosts.js`. Both must be added together — the data file drives the blog index/pagination, the `.astro` file is the actual page.

`blogPosts.js` entry shape:
```js
{
  title: 'Post Title',
  dateIso: 'YYYY-MM-DD',
  category: 'Guides' | 'Walkthroughs' | 'Reviews',
  tags: ['Halo Wars 2'],
  excerpt: 'One sentence summary.',
  href: '/blog/posts/slug-here',
  img: {
    src: 'https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg',
    alt: 'Alt text',
    width: 400,
    height: 225,
    lazy: true
  }
}
```

### Videos
- Video entries live in `src/data/videos-YYYY.ts` (one file per year)
- `src/data/videos.ts` aggregates all years into a single export
- Use `npm run add-video` to add a new video interactively rather than editing files manually

Video object shape:
```ts
{
  title: string;
  description: string;
  youtubeUrl: string;      // https://youtu.be/VIDEO_ID
  imageSrc: string;
  color: string;           // Tailwind color class e.g. 'orange-400'
  buttonColor: string;
  alt: string;
  releaseDate: string;     // YYYY-MM-DD
  series: string;          // e.g. 'Halo Wars 2'
}
```

### Navigation
All navigation is data-driven from `src/data/navigation.ts`. To add a nav link, add it there — **do not** hardcode links in layout/component files. The side panel and header both consume these exports.

`activeMatch` options: `'exact'` | `'prefix'` | `'videos'` | `'hw2Stats'` | `'never'`

### Components
- Path alias `@blocks` → `src/blocks/` for block imports
- Component-scoped styles go inside the `<style>` tag of the `.astro` file
- Use `CloudinaryImage.astro` for images that go through Cloudinary; use plain `<img>` for static `public/` assets

### Styling
- Primary: WebcoreUI Tailwind utilities (use class names directly)
- Custom overrides: `src/styles/blog-overrides.scss` for blog-specific rules
- Global styles: `src/styles/webcore.scss`
- Do not add a separate stylesheet for a single component — scope styles inside the component

---

## Halo Wars 2 Stats System

The HW2 stats feature (`/halo-wars-stats`) is the most complex part of the site.

**Flow:** Client JS calls `functions/api/hw2/*.ts` endpoints → functions query the Halo API and cache results in D1 → client renders match/player data using `src/lib/hw2/` helpers.

**API architecture:**
- `functions/api/hw2/_shared.ts` — shared types, `fetchWithKeyFallback()`, error parsing, response helpers
- Key rotation: `PUBLIC_HW2_API_KEY_1/2/3` are tried in order; 401/403/429 triggers fallback to next key
- Halo API base URLs:
  - Stats: `https://www.haloapi.com/stats/hw2`
  - Summary/metadata: `https://s3publicapis.azure-api.net/stats/hw2` and `.../metadata/hw2`
- All API responses use `ApiResult<T>` discriminated union: `{ ok: true, data }` or `{ ok: false, error }`

**D1 database (team-respawn-hw2):**
- Binding name in functions: `DB`
- Caches player stats, match history, match events, campaign progress, and match summaries
- Schema managed by numbered migrations in `migrations/`
- Always add a new migration file rather than editing existing ones

**Static HW2 data** (`src/data/haloWars2/`):
- `types.ts` — TypeScript interfaces for API response shapes
- `leaders.ts`, `maps.ts`, `csr.ts`, `playlists.ts`, `seasons.ts` — reference data
- `nameMappings.ts` — maps internal unit/upgrade IDs to display names (expand this when units are missing)
- `confirmedCheaters.ts` — player list flagged in the UI

---

## Deployment

**Auto-deploy via GitHub Actions** (`.github/workflows/deploy.yml`):
- Triggers on push to `main`/`master`
- Builds with `npm run build`, deploys to GitHub Pages

**Cloudflare Pages** is the primary production host:
- Project: `team-respawn-pages`
- Build command: `npm run build`
- Output dir: `dist`
- D1 binding: `DB` → `team-respawn-hw2`
- Custom domain: teamrespawn.net

Secrets must be set in the Cloudflare Pages dashboard (not just `.env`) for production API calls to work.

---

## Other Projects (External)

The site links to but does not contain these repos:

| Project | Purpose |
|---|---|
| Storehaus Bot | Discord bot — HW2/AoE stats, AI strategy |
| Halo Quotes | Website + API + bots for Halo quotes |
| AOE2 API | Self-hosted REST API for Age of Empires II data |

Their nav links in `otherProjectSections` (navigation.ts) point to external URLs.

---

## Common Gotchas

- **API function testing:** `npm run dev` does NOT run Pages Functions. Use `npm run dev:cf` to test anything under `functions/`.
- **D1 is remote-only in dev:** There is no local D1 emulator configured. The `dev:cf` command proxies to the remote D1 instance unless you set up a local D1 with `--local` flag.
- **Missing unit name mappings:** If HW2 stats show raw internal IDs instead of names, add entries to `src/data/haloWars2/nameMappings.ts`.
- **Blog pagination:** `src/pages/blog/[page].astro` handles paginated listing. If you add blog posts but they don't show, ensure the `blogPosts.js` entry exists and is sorted (newest first).
- **Cloudinary images:** The `CloudinaryImage` component expects a public ID string, not a full URL. Check `CLOUDINARY_SETUP.md` for upload conventions.
- **wrangler.toml duality:** There are two `wrangler.toml` files — root (Cloudflare Pages project config) and `workers/wrangler.toml` (used by migration scripts and the Pages Functions build). Migration scripts explicitly pass `--config workers/wrangler.toml`.
