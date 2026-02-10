# Cloudflare Pages + D1 Setup

This repo uses Cloudflare Pages Functions (`functions/api/hw2/*`), not a standalone Worker API.

The `wrangler.toml` in this directory is for:
- local Pages/D1 development
- running D1 migrations

## 1) Install and authenticate Wrangler

```powershell
npm i -D wrangler
npx wrangler login
```

## 2) Run D1 migrations (remote)

Run from this `workers/` directory:

```powershell
npx wrangler d1 execute team-respawn-hw2 --file ../migrations/0001_init.sql --remote
npx wrangler d1 execute team-respawn-hw2 --file ../migrations/0002_match_events.sql --remote
```

## 3) Create/Configure Cloudflare Pages project

In Cloudflare Dashboard:
- Workers & Pages -> Pages -> Create project -> connect this GitHub repo
- Build command: `npm run build`
- Build output directory: `dist`

## 4) Add D1 binding to the Pages project

In Pages project settings:
- Functions -> D1 bindings
- Variable name: `DB`
- Database: `team-respawn-hw2`

## 5) Add environment variables to Pages project

Add these in both Preview and Production environments:
- `HW2_API_KEY_1`
- `HW2_API_KEY_2`
- `HW2_API_KEY_3`
- `STORE_RAW_MATCHES` (`0` or `1`)
- `STORE_RAW_EVENTS` (`0` or `1`)

## 6) Custom domain

Attach `teamrespawn.net` to the Pages project in:
- Pages -> Custom domains

Because DNS is already on Cloudflare, this is usually a quick setup.

## 7) Quick validation

After deploy:
- `https://teamrespawn.net/api/hw2/matches`
- `https://teamrespawn.net/api/hw2/match?matchId=<id>`
- `https://teamrespawn.net/api/hw2/events?matchId=<id>`

Events endpoint should now also persist event summaries into D1.
