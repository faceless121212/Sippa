# Sippa

AI character chat — _Brew your perfect companion._

Plan and decisions: [`docs/PLAN.md`](docs/PLAN.md), [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Status

| Phase | What                                                           | State   |
| ----- | -------------------------------------------------------------- | ------- |
| 1     | Landing page, waitlist, SEO, PWA manifest                      | ✅ Done |
| 2     | App shell: auth + age gate, explore, character page, seed data | Next    |
| 3     | Chat (streaming, memory, limits, safety)                       | —       |
| 4     | AI Character Creator                                           | —       |
| 5     | Monetization (Stripe test mode, Plus, Beans, ads)              | —       |
| 6     | Admin, moderation, legal, polish                               | —       |

## Run it

Requires Node 22+.

```bash
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev                  # http://localhost:3000
```

| Command            | What it does                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `npm run dev`      | Dev server                                                                 |
| `npm run build`    | Production build                                                           |
| `npm start`        | Serve the production build                                                 |
| `npm run lint`     | ESLint                                                                     |
| `npm test`         | Unit tests (Vitest)                                                        |
| `npm run test:e2e` | Browser tests at 360 / 768 / 1440 px (Playwright; builds and serves :3100) |
| `npm run format`   | Prettier                                                                   |

First time running e2e tests: `npx playwright install chromium`.

## Environment variables

See [`.env.example`](.env.example). Nothing is required for Phase 1.

| Variable                                                | Needed for                | Without it                                          |
| ------------------------------------------------------- | ------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                  | Sitemap, Open Graph URLs  | Falls back to `http://localhost:3000`               |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storing the waitlist      | Dev: saved to `.data/waitlist.json`. On Vercel: 503 |
| `WAITLIST_RATE_LIMIT_PER_MIN`                           | Waitlist abuse protection | 5 sign-ups per IP per minute                        |

## Where to change things

- **Tagline, prices, free limits, social links** → `src/config/site.ts`
- **Categories and tags** → `src/config/categories.ts`
- **Landing sample characters, FAQ, creator demo results** → `src/data/landing.ts`
- **Colours (dark + light)** → tokens at the top of `src/app/globals.css`
- **Legal placeholder copy** → `src/app/legal/[slug]/content.ts` (needs a lawyer)

## Accounts checklist

You have: Vercel, Anthropic, fal.ai. Still needed:

1. **Supabase** — create a project (EU region), then run `supabase/migrations/*.sql` in the SQL editor. Copy the project URL and service-role key into Vercel env vars. (Phase 1: waitlist. Phase 2: auth, DB.)
2. **Stripe** — account in test mode. (Phase 5.)
3. **Upstash Redis** — free database for rate limits. (Phase 3.)
4. **Domain** — when chosen, set `NEXT_PUBLIC_SITE_URL`.

## Deploy (Vercel)

Import the GitHub repo in Vercel, keep the Next.js defaults, add the Supabase env vars above, deploy.
