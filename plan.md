# Halo Wars 2 Stats Page - Implementation Plan

## Overview
Add a new `/halo-wars-stats/` page to the TR website that lets users search for a gamertag and view their Halo Wars 2 stats. Uses **build-time data fetching** (Option B) with client-side search powered by the Halo API through a 3-key fallback chain.

> **Note on Option B + client-side hybrid:** Since we need a gamertag search bar (user-driven, not known at build time), the page will be a **hybrid**: static shell built at build time (layout, data mappings, Storehaus promo) with **client-side JavaScript** that fetches player stats on demand. The API keys will be injected at build time via `import.meta.env` into the client bundle — this is acceptable for subscription keys with rate limits but worth noting.

---

## Step 1: Data Mapping Files

Create `src/data/haloWars2/` directory with static game reference data adapted from the HaloWars repo:

| File | Content | Source |
|------|---------|--------|
| `csr.ts` | CSR rank definitions (Unranked through Champion) with tier names and CDN image URLs | HaloWars `src/data/csr.ts` |
| `leaders.ts` | All 10 leaders (6 UNSC, 4 Banished) with faction, name, image URLs | HaloWars `src/data/leaders.ts` |
| `maps.ts` | 16 multiplayer maps with names and image URLs | HaloWars `src/data/maps.ts` |
| `playlists.ts` | Playlist configs for 1v1, 2v2, 3v3 ranked | HaloWars `src/data/playlists.ts` |
| `seasons.ts` | Seasons 4-15 metadata with date ranges | HaloWars `src/data/seasons.ts` |
| `playlistMappings.ts` | UUID constants for playlist types | HaloWars `src/data/mappings.ts` |

Each file will be simplified to only include the fields we actually render (no unused metadata). TypeScript interfaces will be defined inline or in a shared `types.ts` file in the same directory.

---

## Step 2: Environment Variables

Add 3 placeholder API keys to `.env.example` and `.env`:

```
# Halo Wars 2 API Keys (Ocp-Apim-Subscription-Key)
HW2_API_KEY_1=your-primary-halo-api-key
HW2_API_KEY_2=your-secondary-halo-api-key
HW2_API_KEY_3=your-tertiary-halo-api-key
```

These must be prefixed with `PUBLIC_` in Astro to be available client-side:
```
PUBLIC_HW2_API_KEY_1=...
PUBLIC_HW2_API_KEY_2=...
PUBLIC_HW2_API_KEY_3=...
```

---

## Step 3: API Utility Module

Create `src/utils/haloApi.ts` — a lightweight fetch wrapper with:

- **3-key fallback chain**: Try key 1 → on failure, retry with key 2 → on failure, retry with key 3
- **Base URL**: `https://www.haloapi.com/stats/hw2/`
- **Endpoints**:
  - `GET /players/{gamertag}/stats` → Player stat summary
  - `GET /players/{gamertag}/matches?start=0&count=10` → Recent match history
- **Error handling**: Returns typed error objects with user-friendly messages
  - 401/403 → "API key issue — stats may be temporarily unavailable"
  - 404 → "Gamertag not found. Check spelling and try again."
  - 429 → "Rate limit reached. Please wait a moment and try again."
  - Network error → "Unable to connect to Halo servers. Check your connection."

No external dependencies (no axios) — uses native `fetch()`.

---

## Step 4: Page & Component Architecture

### Page: `src/pages/halo-wars-stats/index.astro`

Uses `BaseLayout` with SEO metadata (title, description, OG tags, JSON-LD for WebPage). Static shell with all interactive behavior in a `<script>` tag.

### Page Layout (top to bottom):

```
┌──────────────────────────────────────────────┐
│  Header (existing component)                 │
├──────────────────────────────────────────────┤
│  Hero Banner                                 │
│  "Halo Wars 2 Stats" title + subtitle        │
│  Halo Wars 2 themed gradient background      │
├──────────────────────────────────────────────┤
│  Gamertag Search Bar                         │
│  Input + "Search" button + recent searches   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Player Overview Card ──────────────────┐ │
│  │ Gamertag + Overall W/L + Time Played    │ │
│  │ Matches played / completed              │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─ Ranked Stats Grid (1v1/2v2/3v3) ──────┐ │
│  │ ┌──────┐ ┌──────┐ ┌──────┐             │ │
│  │ │ 1v1  │ │ 2v2  │ │ 3v3  │             │ │
│  │ │ CSR  │ │ CSR  │ │ CSR  │             │ │
│  │ │ Rank │ │ Rank │ │ Rank │             │ │
│  │ │ W/L  │ │ W/L  │ │ W/L  │             │ │
│  │ └──────┘ └──────┘ └──────┘             │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─ Leader Usage Breakdown ────────────────┐ │
│  │ Visual bars showing most-played leaders │ │
│  │ Faction icon + leader name + play count │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─ Recent Matches ───────────────────────┐  │
│  │ List of last 10 matches                │  │
│  │ Map thumbnail | Result | Leader | Date │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│  Error Message Area (shown when needed)      │
│  Contextual icon + message + retry button    │
├──────────────────────────────────────────────┤
│  Storehaus Promo Section                     │
│  (extracted as reusable component)           │
├──────────────────────────────────────────────┤
│  Footer (existing component)                 │
└──────────────────────────────────────────────┘
```

---

## Step 5: Design Approach — "Something More Unique"

### Theme: Military Command Console
Instead of the HaloWars repo's standard dark cards, we'll go with a **command terminal / war room** aesthetic that fits the Halo Wars universe:

- **Color palette**: Deep navy (`#0a1628`) base, with cyan/teal accents (`#06b6d4`, `#22d3ee`) for UNSC feel, and red-orange (`#ef4444`, `#f97316`) for Banished elements
- **Gradient hero**: A wide gradient banner reminiscent of UNSC HUD overlays — `from-slate-900 via-cyan-950 to-slate-900` with subtle scan-line effect via CSS
- **Cards**: Glass-morphism style (`bg-slate-800/40 backdrop-blur border border-cyan-500/20`) instead of flat dark cards
- **CSR rank display**: Large centered rank emblem with a subtle glow/pulse animation using CSS `box-shadow` + `animation`
- **Stats numbers**: Monospace font (`font-mono`) for stats to give that tactical readout feel
- **Leader usage bars**: Horizontal progress bars color-coded by faction (cyan for UNSC, red for Banished) rather than a pie chart
- **Match history rows**: Alternating subtle stripe pattern, win/loss indicated by left border color (green = win, red = loss)
- **Responsive grid**: The 1v1/2v2/3v3 ranked cards use a `grid-cols-1 md:grid-cols-3` layout

### Skeleton Loading States
When data is loading or unavailable:
- Animated shimmer/pulse placeholders using Tailwind's `animate-pulse` on `bg-slate-700/50 rounded` blocks
- Skeleton shapes match the final content layout (stat numbers = short rectangles, avatars = circles, text = varied-width bars)
- Skeleton is shown in all data sections immediately when a search is triggered
- Replaced with real data or error message once the API responds

### Error Messaging
- Displayed inline where the data would appear (not a modal/toast)
- Uses a styled alert box: icon + message + optional retry button
- Color-coded: amber for warnings (rate limit), red for errors (not found), blue for info (API down)
- Each section (overview, ranked, matches) can independently show errors if partial data loads

---

## Step 6: Storehaus Promo Component Extraction

Create `src/components/StorehausPromo.astro` by extracting the promo section from `index.astro` (lines 93-133) into a reusable component. Then:
- Import and use it on the homepage (replace the 3 inline copies)
- Import and use it at the bottom of the HW2 stats page

This is a refactor that reduces duplication across the site.

---

## Step 7: Navigation Update

Add a link to the new page in the site header/navigation so users can find it. This means updating `src/components/Header.astro` to include a "HW2 Stats" nav item.

---

## File Summary

### New files:
| File | Purpose |
|------|---------|
| `src/data/haloWars2/csr.ts` | CSR rank data |
| `src/data/haloWars2/leaders.ts` | Leader data |
| `src/data/haloWars2/maps.ts` | Map data |
| `src/data/haloWars2/playlists.ts` | Playlist configs |
| `src/data/haloWars2/seasons.ts` | Season metadata |
| `src/data/haloWars2/playlistMappings.ts` | Playlist UUID constants |
| `src/data/haloWars2/types.ts` | Shared TypeScript interfaces |
| `src/utils/haloApi.ts` | API fetch wrapper with 3-key fallback |
| `src/pages/halo-wars-stats/index.astro` | The stats page |
| `src/components/StorehausPromo.astro` | Extracted reusable promo component |

### Modified files:
| File | Change |
|------|--------|
| `.env` | Add 3 `PUBLIC_HW2_API_KEY_*` placeholders |
| `.env.example` | Add 3 `PUBLIC_HW2_API_KEY_*` placeholders |
| `src/pages/index.astro` | Replace 3 inline Storehaus promos with `<StorehausPromo />` |
| `src/components/Header.astro` | Add "HW2 Stats" nav link |

---

## Implementation Order

1. **Data files** (`src/data/haloWars2/*`) — foundational, no dependencies
2. **Env variables** (`.env`, `.env.example`) — needed by API util
3. **API utility** (`src/utils/haloApi.ts`) — depends on env vars
4. **StorehausPromo component** extraction — independent, can parallel with above
5. **Stats page** (`src/pages/halo-wars-stats/index.astro`) — depends on all above
6. **Homepage refactor** (replace inline promos with component) — depends on step 4
7. **Header nav update** — depends on page existing
8. **Test** — verify dev server builds, page renders, skeleton states work, error messages display
