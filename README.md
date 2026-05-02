# Team Respawn Website

A gaming content website for the [Team Respawn YouTube channel](https://www.youtube.com/@TeamRespawn), focused on strategy RTS games — primarily Halo Wars 2, Age of Empires, and Age of Mythology.

**Live site:** https://www.teamrespawn.net — hosted on Cloudflare Pages.

## Features

- Blog posts: guides, walkthroughs, and reviews — client-side search, filters, and pagination on `/blog`; optional Astro Content Collection under `src/content/blog/` (see `src/content.config.ts`) for future MD/MDX entries with `canonicalPath` merged into the sitemap when not `draft`
- Video database with MCC-style filter/search composer (`/videos`)
- Halo Wars 2 live stats lookup — player profiles, match history, match details, AI summaries (`/halo-wars-stats`)
- Halo Wars: Definitive Edition Steam player count — live concurrency, observed daily high, and 30-day trend chart (`/halo-wars-de-player-count`)
- Halo Wars 1 unit reference table — filterable/sortable DPS, cost, and upgrade data (`/halo-wars-de-player-count`)
- **HW2 Tournaments** (`/tournaments`) — community single/double elimination brackets: open or join-password sign-ups, organizer **admin password** for all writes (no magic manage links), **optional public rules + scheduled start** and **organizer notes** in the page sidebar, **HW2 match lookup** from the stats cache (suggest + link), **match reset** for corrections, **Beta** label on the live bracket page. **Rate limiting:** after five wrong admin passwords per tournament and client bucket, lockout for 24 hours; set **`TOURNAMENT_RATE_LIMIT_PEPPER`** in Pages so D1 stores only a peppered hash (never raw IPs). See [HW2 Tournaments](#hw2-tournaments) below for routes, API layout, and migrations.
- Serverless API functions (Cloudflare Pages Functions) with Cloudflare D1 caching
- Side panel navigation with keyboard support
- Responsive Tailwind-based styling via WebcoreUI
- SEO meta tags and OpenGraph support; **apex → `www` 301** via `functions/_middleware.ts` so `teamrespawn.net` redirects to `https://www.teamrespawn.net` with path and query preserved

## Navigation Notes

- The desktop header `Halo Wars 2` Franchise Hub dropdown is intentionally hidden for now.
- Its content remains in `src/components/Header.astro` behind `showHaloWars2HeaderDropdown` so it can be re-enabled quickly later.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro v6 |
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
├── functions/
│   ├── _middleware.ts     # 301 apex → www (canonical host) for all routes
│   └── api/               # Cloudflare Pages Functions (serverless API)
│       ├── hw2/               # Halo Wars 2 stats endpoints
│       ├── hwde/              # Halo Wars: Definitive Edition endpoints
│       ├── tournaments/       # HW2 tournament organizer API (see HW2 Tournaments section)
│       │   ├── _shared.ts       # IDs, password hashing, bracket JSON parse, admin rate-limit helpers
│       │   ├── _storage.ts      # In-memory adapter for brackets-manager
│       │   ├── index.ts         # GET list (filters), POST create tournament
│       │   └── [id]/
│       │       ├── index.ts              # GET one tournament (+ participants, matches)
│       │       ├── join.ts               # POST join (optional join password)
│       │       ├── link-hw2.ts           # POST resolve HW2 cached match vs bracket pair
│       │       ├── notes.ts              # POST organizer notes (admin password)
│       │       ├── sidebar.ts            # POST rules + scheduled start (admin password)
│       │       ├── start.ts              # POST seed bracket, go active (admin password)
│       │       ├── verify-admin.ts       # POST verify admin password (rate limited)
│       │       ├── participants/
│       │       │   └── [gamertag].ts     # POST add / DELETE remove (admin, registration only)
│       │       └── matches/[matchId]/
│       │           ├── index.ts          # PATCH record result (admin password)
│       │           ├── override.ts       # POST force winner (admin password)
│       │           ├── reset.ts          # POST reopen match + dependents (admin password)
│       │           └── suggest-hw2.ts    # GET recent cached 1v1s between bracket players
│       └── youtube/           # YouTube latest videos endpoint
├── migrations/            # Cloudflare D1 SQL migrations (numbered)
│                          # Tournament-related: 0011 (tables), 0012 (admin_password_hash),
│                          # 0013 (seeding), 0014 (notes), 0015 (gamertag nocase unique),
│                          # 0016 (rules, starts_at), 0017 (admin rate limits),
│                          # 0018 (clear legacy rate-limit rows)
├── public/                # Static assets (served as-is)
│   └── css/
│       └── tournament-brackets.css  # Bracket shell + match card styling for tournaments
├── scripts/               # Node utility scripts (add-video.mjs)
├── src/
│   ├── content/           # Optional Content Collection (blog MD/MDX); catalog remains blogPosts.js
│   ├── content.config.ts  # `blog` collection schema (Zod) + glob loader
│   ├── blocks/            # Reusable content blocks (Author, Socials)
│   ├── components/        # Astro components (Header, Footer, SidePanel)
│   ├── data/              # Site data as TS modules
│   │   ├── haloWars2/     # HW2 static data (leaders, maps, CSR, etc.)
│   │   ├── haloWars1.ts   # HW1 unit reference data
│   │   └── videos-YYYY.ts # Video entries by year
│   ├── layouts/           # Page layouts
│   ├── lib/hw2/           # HW2 match rendering logic
│   ├── pages/             # File-based routes (blog, videos, hw2 stats, …)
│   │   └── tournaments/   # HW2 tournament UI (see HW2 Tournaments)
│   │       ├── index.astro      # /tournaments — browse + filters
│   │       ├── create.astro     # /tournaments/create
│   │       ├── tournament.astro # /tournaments/tournament?id=trn_… — bracket + admin + sidebar
│   │       ├── manage.astro     # organizer-focused entry (links into flow)
│   │       └── view.astro       # legacy ?id= redirect to tournament.astro
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

Copy `.env.example` to `.env` and fill in the required keys (Cloudinary, HW2 API keys, Cloudflare Analytics). For **`npm run dev:cf`**, optional **`TOURNAMENT_RATE_LIMIT_PEPPER`** in `workers/.dev.vars` (or root `.dev.vars`) enables tournament admin rate limiting locally; without it, limits are skipped. In production, set the same variable in Cloudflare Pages (secret or var).

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
npm run cf:d1:migrate:14    # Run tournament notes column migration (0014)
npm run cf:d1:migrate:15    # Run tournament gamertag case-insensitive index migration (0015)
npm run cf:d1:migrate:16    # Run tournament rules + scheduled start columns migration (0016)
npm run cf:d1:migrate:17    # Run tournament admin password rate-limit table migration (0017)
npm run cf:d1:migrate:18    # Clear legacy rate-limit rows before peppered bucket keys (0018)
```

## HW2 Tournaments

| URL | Purpose |
|-----|---------|
| `/tournaments` | List tournaments (status tabs + search) |
| `/tournaments/create` | Create flow (name, organizer, format, caps, optional rules/start, optional join password) |
| `/tournaments/tournament?id=trn_…` | Single page: public bracket + join (registration), organizer **Admin** unlock for start, results, overrides, reopen, notes, rules/schedule |

**Behavior highlights**

- **IDs:** `trn_` + 12 hex chars; validated on every API route.
- **Privacy:** Join password and admin password are stored hashed; admin attempts are rate-limited using **peppered bucket keys** in D1 when `TOURNAMENT_RATE_LIMIT_PEPPER` is set.
- **HW2 integration:** `suggest-hw2` and `link-hw2` read the existing HW2 stats cache in D1; they do not call Halo APIs directly for bracket fill-in.

**D1 tables (tournament-related)** — created/altered across migrations `0011`–`0018`: `tournaments`, `tournament_participants`, `tournament_matches`, `tournament_admin_rate_limits`.

## Links

- YouTube: https://www.youtube.com/@TeamRespawn
- Twitch: https://www.twitch.tv/TeamRespawnTV
- Discord: https://discord.gg/TeamRespawn
- Shop: https://www.teamrespawn.shop
