# Sippa

AI character chat — _Brew your perfect companion._

Plan and decisions: [`docs/PLAN.md`](docs/PLAN.md), [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Status

| Phase | What                                                           | State   |
| ----- | -------------------------------------------------------------- | ------- |
| 1     | Landing page, waitlist, SEO, PWA manifest                      | ✅ Done |
| 2     | App shell: auth + age gate, explore, character page, seed data | ✅ Done |
| 3     | Chat (streaming, memory, limits, safety)                       | ✅ Done |
| 4     | AI Character Creator                                           | ✅ Done |
| 5     | Monetization (Stripe test mode, Plus, Flowers, ads)            | ✅ Done |
| 6     | Admin, moderation, legal, polish                               | ✅ Done |

## Run it

Requires Node 22+.

```bash
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev                  # http://localhost:3000
```

| Command            | What it does                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`      | Dev server                                                                        |
| `npm run build`    | Production build                                                                  |
| `npm start`        | Serve the production build                                                        |
| `npm run lint`     | ESLint                                                                            |
| `npm test`         | Unit tests (Vitest)                                                               |
| `npm run test:e2e` | Browser tests at 360 / 768 / 1440 px (Playwright; builds and serves :3100)        |
| `npm run format`   | Prettier                                                                          |
| `npm run avatars`  | Generate character portraits with fal.ai (needs `FAL_KEY`; `--force` to redo all) |

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

## Database (Supabase)

1. Put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` in `.env.local`.
2. In Supabase → Authentication → URL Configuration: Site URL `http://localhost:3000`, redirect URL `http://localhost:3000/auth/callback`.
3. Run:

```bash
npm run db:migrate   # applies supabase/migrations/*.sql once each
npm run db:seed      # loads the 24 official characters
npm run db:check     # verifies the database security rules (nothing is kept)
```

## Chat (Claude)

Add `ANTHROPIC_API_KEY` to `.env.local`. Models default to `claude-sonnet-5` (chat) and `claude-haiku-4-5` (summaries); override with `LLM_CHAT_MODEL` / `LLM_FAST_MODEL`. Without a key, development uses a labelled demo reply; production refuses.

```bash
npm run chat:smoke     # live test: in-character reply + honest "are you human?" answer (a few cents)
npm run creator:smoke  # live test: generate, rules, moderation, celebrity refusal, 4 portraits, storage (~$0.15)
```

Without Supabase keys the app still runs: Explore and character pages read the local seed data, and sign-in shows "not set up yet".

**Google sign-in** (optional): create an OAuth client in Google Cloud Console, then enable the Google provider in Supabase → Authentication → Providers with its client ID and secret.

## Moderation & admin

- Make someone admin: `npm run admin:grant -- you@example.com` (`--revoke` to remove).
- Admins see **Moderation** in the sidebar (`/app/admin`): reports (with the automatic verdict), public characters waiting for approval, hidden characters, users (ban/unban) and the audit log.
- Reports are reviewed automatically first: clear violations and characters with 3+ open reports are hidden until an admin decides.

## Characters message you

Every 3–4 minutes a character from your chats sends a short in-character message as a popup (Haiku-written, safety rules applied, never guilt-trippy). Reply opens the chat. Users can switch it off in Settings. `npm run nudge:smoke` tests it live.

## Payments

**Demo mode (default in development):** with no Stripe key, "Buy" opens a simulated checkout that grants Plus or Flowers instantly — no card, no money. Force it on a deployed preview with `PAYMENTS_MODE=demo`; disable with `PAYMENTS_MODE=off`.

**Stripe (test mode):**

1. Add `STRIPE_SECRET_KEY=sk_test_...` to `.env.local`.
2. `npm run stripe:setup` — creates Sippa Plus (monthly/yearly), 3 Bean packs and the customer portal (safe to re-run).
3. Buy from `/app/plus` with test card `4242 4242 4242 4242`, any future date, any CVC.

Locally, purchases are confirmed when you return from Checkout (the server re-checks the session with Stripe). In production also add a webhook endpoint `https://<domain>/api/billing/webhook` for `checkout.session.completed`, `invoice.paid` and `customer.subscription.*`, and set `STRIPE_WEBHOOK_SECRET`.

## Accounts

- `/signup` (email + password + date of birth, confirmation email), `/login` (password, magic link or Google), `/forgot-password` → `/reset-password`.
- Supabase → Authentication → URL Configuration must allow `http://localhost:3000/auth/callback` (and your production URL later).
- Supabase's default email sender is limited to a few emails per hour; add custom SMTP before launch.

## Google sign-in

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web). Authorized origin `http://localhost:3000`; redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Sign In / Providers → Google: paste client ID + secret, enable.

## Accounts checklist

You have: Vercel, Anthropic, fal.ai. Still needed:

1. **Supabase** — create a project (EU region), then run `supabase/migrations/*.sql` in the SQL editor. Copy the project URL and service-role key into Vercel env vars. (Phase 1: waitlist. Phase 2: auth, DB.)
2. **Stripe** — account in test mode. (Phase 5.)
3. **Upstash Redis** — free database for rate limits. (Phase 3.)
4. **Domain** — when chosen, set `NEXT_PUBLIC_SITE_URL`.

## Deploy (Vercel)

Import the GitHub repo in Vercel, keep the Next.js defaults, add the Supabase env vars above, deploy.
