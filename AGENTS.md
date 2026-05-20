# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Single Astro v6 project (not a monorepo) deployed to Cloudflare Pages. Co-located serverless API in `functions/`, backed by Cloudflare D1 (local SQLite during dev). See `README.md` for full details.

### Running the dev environment

Two modes:

| Command | What it does | When to use |
|---------|-------------|-------------|
| `npm run dev` | Astro dev server on `:4321` | UI/content work only |
| `npm run dev:cf` | Wrangler Pages proxy on `:8788` (needs Astro on `:4321`) | Testing API functions or D1 |

For full-stack testing, run **both** `npm run dev` (in one terminal) and `npm run dev:cf` (in another). The Wrangler proxy on `:8788` forwards page requests to Astro `:4321` and additionally handles `functions/` routes with local D1.

### Local D1 migrations

Before API endpoints work, apply all migrations to the local D1 database:

```bash
npx wrangler d1 migrations apply team-respawn-hw2 --config wrangler.toml --local
```

This creates/updates the local SQLite DB used by Wrangler. Only needed once (or when new migration files are added).

### Type checking / linting

- `npx astro check` — runs TypeScript diagnostics. There are ~14 pre-existing type errors that do not block the build.
- No separate ESLint or linting config exists in this repo.

### Build

`npm run build` — runs blog post generation then Astro build. Output goes to `dist/`.

### Environment variables

Copy `.env.example` → `.env` for local dev. All external API keys (Cloudinary, HW2, YouTube, Groq, Cerebras, Cloudflare Analytics) are optional — the site runs without them in degraded mode.

### Key gotchas

- Node.js >= 22.12.0 is required (Astro 6 requirement).
- The `dev:cf` command warns about deprecation of `--proxy` mode but still works correctly.
- `videos.json` ENOENT during build is a non-fatal warning (search bar prerender); the build still succeeds.
- Blog catalog (`src/data/blogPosts.js`) is auto-generated — never edit it manually; run `npm run generate:blog-posts` or it runs automatically as part of `npm run build`.
