# Team Respawn Website

A gaming content website for the [Team Respawn YouTube channel](https://www.youtube.com/@TeamRespawn), focused on strategy RTS games — primarily Halo Wars 2, Age of Empires, and Age of Mythology.

**Live site:** https://www.teamrespawn.net — hosted on Cloudflare Pages.

## Features

- Blog posts: guides, walkthroughs, and reviews with pagination
- Video database with MCC-style filter/search composer (`/videos`)
- Halo Wars 2 live stats lookup — player profiles, match history, match details, AI summaries (`/halo-wars-stats`)
- Halo Wars 2 global meta snapshots — scheduled aggregate playlist summaries, leader meta, and map trends (`/halo-wars-meta`)
- Halo Wars 2 leaderboard snapshots — scheduled ranked ladder views with links back to player profiles (`/halo-wars-leaderboards`)
- Halo Wars 2 public data reference pages — leaders, maps, leader powers, and units/techs (`/halo-wars-data/*`)
- Halo Wars: Definitive Edition Steam player count — live concurrency, observed daily high, and 30-day trend chart (`/halo-wars-de-player-count`)
- Halo Wars 1 unit reference table — filterable/sortable DPS, cost, and upgrade data (`/halo-wars-de-player-count`)
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
| Database | Cloudflare D1 (SQLite — API response caching + scheduled HW2 aggregate snapshots) |
| Images | Cloudinary |

## Project Structure

```
team-respawn-website/
├── functions/api/         # Cloudflare Pages Functions (serverless API)
│   ├── hw2/               # Halo Wars 2 endpoints
│   ├── hwde/              # Halo Wars: Definitive Edition endpoints
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
npm run build-hw2-snapshot-payload -- --aggregate <aggregate.json> [--leaderboards <leaderboards.json>]
npm run check-hw2-xandy92 -- [--base-url http://127.0.0.1:8788]
npm run publish-hw2-snapshot -- <payload.json> [--dry-run]
npm run cf:d1:migrate       # Run all D1 migrations on the remote database
npm run cf:d1:migrate:10    # Run a specific migration (replace 10 with number)
```

### Publishing HW2 snapshots

The scheduled HW2 global snapshot pipeline posts to `POST /api/hw2/global-snapshot` using the `SNAPSHOT_SECRET`.

Build a payload from separate aggregate and leaderboard inputs:

```bash
npm run build-hw2-snapshot-payload -- ^
  --aggregate scripts/examples/hw2-aggregate-input.sample.json ^
  --leaderboards scripts/examples/hw2-leaderboards-input.sample.json ^
  --output scripts/examples/hw2-global-snapshot.generated.json
```

Local dry run:

```bash
npm run publish-hw2-snapshot -- scripts/examples/hw2-global-snapshot.sample.json --dry-run
```

Publish example:

```bash
set HW2_SNAPSHOT_URL=https://www.teamrespawn.net/api/hw2/global-snapshot
set HW2_SNAPSHOT_SECRET=your-secret-here
npm run publish-hw2-snapshot -- scripts/examples/hw2-global-snapshot.sample.json
```

### HW2 regression workflow

For the pinned lookup regression account, start the app with Pages Functions enabled:

```bash
npm run dev:cf
```

Then, in a second terminal, run:

```bash
npm run check-hw2-xandy92
```

The regression script checks:

- `/halo-wars-stats?gamertag=xandy92`
- `/halo-wars-meta`
- `/halo-wars-leaderboards`
- `/halo-wars-data/leaders`
- `/api/hw2/stats`
- `/api/hw2/season-stats`
- `/api/hw2/campaign-progress`
- `/api/hw2/matches`
- first returned match through `/api/hw2/match` and `/api/hw2/events`
- `/api/hw2/global-snapshot`
- `/api/hw2/recent-searches`

Interpretation notes:

- `Global snapshot API responds - No snapshot published yet` means the route is live and healthy, but no aggregate snapshot has been posted yet.
- `route returned HTML` on an API path usually means the route is not deployed on that environment yet or is being rewritten to the site shell instead of returning JSON.
- `Events API returned 500` or `route returned HTML error page (500)` means the worker threw before it could return cached or upstream event data.

Manual follow-up checks still worth doing in the browser:

- open the profile share modal on `/halo-wars-stats`
- expand at least one recent match detail panel
- confirm stale banner behavior when cached data is served
- confirm the new Meta, Leaderboards, and Data links navigate cleanly from the stats page

## Links

- YouTube: https://www.youtube.com/@TeamRespawn
- Twitch: https://www.twitch.tv/TeamRespawnTV
- Discord: https://discord.gg/TeamRespawn
- Shop: https://www.teamrespawn.shop
