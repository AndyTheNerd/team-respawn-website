# Team Respawn Website

A gaming content website for the [Team Respawn YouTube channel](https://www.youtube.com/@TeamRespawn), focused on strategy RTS games — primarily Halo Wars 2, Age of Empires, and Age of Mythology.

**Live site:** https://www.teamrespawn.net — hosted on Cloudflare Pages.

## Features

- Blog posts: guides, walkthroughs, and reviews with pagination
- Video database with MCC-style filter/search composer (`/videos`)
- Halo Wars 2 live stats lookup — player profiles, match history, match details, AI summaries (`/halo-wars-stats`)
- Halo Wars: Definitive Edition Steam player count — live concurrency, observed daily high, and 30-day trend chart (`/halo-wars-de-player-count`)
- Halo Wars 1 unit reference table — filterable/sortable DPS, cost, and upgrade data (`/halo-wars-de-player-count`)
- HW2 Tournaments — community-run single/double elimination bracket organizer (`/tournaments`): password-only admin auth (no manage URLs to save), unified public+admin page at `/tournaments/[id]`, open/private sign-ups, remove participants, admin overrides, HW2 match auto-suggest from stats cache, and in-place bracket updates without page reloads
- Serverless API functions (Cloudflare Pages Functions) with Cloudflare D1 caching
- Side panel navigation with keyboard support
- Responsive Tailwind-based styling via WebcoreUI
- SEO meta tags and OpenGraph support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro v5 |
| UI library | WebcoreUI v1.3 (Tailwind CSS) |
| Styling | SCSS via `sass` |
| Language | TypeScript + ES modules |
| Hosting | Cloudflare Pages |
| Serverless functions | Cloudflare Pages Functions (`functions/` dir) |
| Database | Cloudflare D1 (SQLite — API response caching) |
| Images | Cloudinary |

## Project Structure

```
team-respawn-website/
├── functions/api/         # Cloudflare Pages Functions (serverless API)
│   ├── hw2/               # Halo Wars 2 stats endpoints
│   ├── hwde/              # Halo Wars: Definitive Edition endpoints
│   ├── tournaments/       # Tournament organizer endpoints
│   └── youtube/           # YouTube latest videos endpoint
├── migrations/            # Cloudflare D1 SQL migrations (numbered)
├── public/                # Static assets (served as-is)
├── scripts/               # Node utility scripts (add-video.mjs)
├── src/
│   ├── blocks/            # Reusable content blocks (Author, Socials)
│   ├── components/        # Astro components (Header, Footer, SidePanel)
│   ├── data/              # Site data as TS modules
│   │   ├── haloWars2/     # HW2 static data (leaders, maps, CSR, etc.)
│   │   ├── haloWars1.ts   # HW1 unit reference data
│   │   └── videos-YYYY.ts # Video entries by year
│   ├── layouts/           # Page layouts
│   ├── lib/hw2/           # HW2 match rendering logic
│   ├── pages/             # File-based routes
│   ├── styles/            # Global SCSS
│   └── config.js          # SITE_URL, SITE_NAME constants
├── workers/
│   └── wrangler.toml      # Cloudflare Pages Functions config + D1 binding
├── astro.config.mjs
└── wrangler.toml          # Root Cloudflare config
```

## Setup & Running Locally

### Prerequisites

- Node.js v18+
- npm

### Installation

```bash
git clone <repository-url>
cd team-respawn-website
npm install
```

Copy `.env.example` to `.env` and fill in the required keys (Cloudinary, HW2 API keys, Cloudflare Analytics).

### Development

```bash
npm run dev       # Astro dev server → http://localhost:4321 (no CF functions)
npm run dev:cf    # Wrangler proxy — use this when testing API functions or D1
```

Use `npm run dev` for UI/content work. Use `npm run dev:cf` when testing anything under `functions/`.

### Build & Preview

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

### Other Scripts

```bash
npm run add-video           # Interactive script to add a new video entry
npm run cf:d1:migrate        # Run all D1 migrations on the remote database
npm run cf:d1:migrate:11    # Run tournament tables migration (0011)
npm run cf:d1:migrate:12    # Run tournament admin password migration (0012)
npm run cf:d1:migrate:13    # Run tournament seeding column migration (0013)
```

## Links

- YouTube: https://www.youtube.com/@TeamRespawn
- Twitch: https://www.twitch.tv/TeamRespawnTV
- Discord: https://discord.gg/TeamRespawn
- Shop: https://www.teamrespawn.shop
