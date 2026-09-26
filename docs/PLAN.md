# Sippa — Plan

See `DECISIONS.md` for the choices this plan is based on.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · CSS animations (Framer Motion only if a later phase needs it) · lucide-react · Supabase (Postgres, Auth, Storage, RLS) via `@supabase/supabase-js` + `@supabase/ssr` · Anthropic SDK · fal.ai client · Stripe · Upstash Redis (rate limits) · Zod · Vitest · Playwright · ESLint + Prettier. Deploy: Vercel.

## Pages

**Marketing**

- `/` landing (header, hero + animated creator mock, pick your vibe, creator showcase, why Sippa, hot this week, pricing, FAQ, waitlist, footer)
- `/pricing`, `/legal/privacy`, `/legal/terms`, `/legal/guidelines`, `/legal/cookies`

**App** (`/app/...`, auth required except explore + character pages)

- `/login`, `/onboarding` (DOB age gate)
- `/app` home (banner, Hot / Trending rankings, collections)
- `/app/explore?category=&tag=&gender=&q=` (grid, infinite scroll)
- `/app/c/[id]` character page
- `/app/chats`, `/app/chats/[chatId]` (3-pane on desktop)
- `/app/create` (6-step creator)
- `/app/profile` (my characters, favourites, history, settings, export, delete)
- `/app/plus` (paywall / Beans)
- `/admin` (reports queue, characters, users, audit log)

**API routes** (server only): `/api/waitlist`, `/api/chat` (stream), `/api/chat/regenerate`, `/api/creator/generate`, `/api/creator/avatar`, `/api/creator/field`, `/api/report`, `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`, `/api/account/export`, `/api/account/delete`.

## Data model (Supabase / Postgres, RLS on every table)

- `profiles(id → auth.users, email, dob, is_adult, plan[free|plus], beans, free_creations_used, is_admin, banned_at, created_at)`
- `characters(id, creator_id, name, category[lover|friend|famous], famous_type[historical|inspired|verified_creator|null], gender[male|female|nonbinary], age, hook, description, personality jsonb {traits[], warmth, humor, flirtiness, talkativeness}, speaking_style, backstory, first_message, example_dialogues jsonb, tags text[], avatar_url, avatar_style, visibility[private|unlisted|public], status[draft|pending|approved|hidden], message_count, created_at, updated_at)`
- `chats(id, user_id, character_id, summary, summarized_upto, created_at, updated_at)`
- `messages(id, chat_id, role[user|assistant|system], content, rating smallint, flagged, created_at)`
- `memories(id, chat_id, text, created_at)`
- `favorites(user_id, character_id)` PK both
- `reports(id, reporter_id, target_type[character|message|user], target_id, reason, details, status[open|auto_hidden|resolved|dismissed], created_at)`
- `waitlist(email unique, consent, source, created_at)`
- `transactions(id, user_id, type[subscription|beans_pack|spend], amount, stripe_id, created_at)`
- `audit_log(id, actor_id, action, target_type, target_id, meta jsonb, created_at)`
- `daily_usage` → Upstash Redis key `usage:{user}:{yyyy-mm-dd}` (not a table)

## Safety architecture (spec §6)

- `lib/safety/` — `ageRules.ts` (Lover ≥ 21, minor/school wording regex), `blocklist.ts` (living public figures list + fuzzy match), `crisis.ts` (self-harm detection → resources by country), `moderate.ts` (LLM moderation with Haiku, returns strict JSON).
- System prompt order: **safety rules → AI disclosure → character sheet → style → examples → memories → summary → last N messages.** Character text is wrapped in delimiters and can't override the safety block.
- Every safety rule has a Vitest unit test; Playwright covers the acceptance scenarios in spec §12.

## Build order

1. **Phase 1 — Landing page.** Next.js scaffold, theme tokens (dark default + light), fonts, logo SVG, all 10 landing sections with static JSON, animated creator mock, waitlist form → `/api/waitlist` (Supabase if configured, otherwise local JSON file in dev), cookie banner, SEO (metadata, OG image, sitemap, robots), PWA manifest. Tests: Vitest for waitlist validation, Playwright smoke at 360/768/1440. Target Lighthouse ≥ 90.
2. **Phase 2 — App shell.** Supabase schema + RLS migrations, magic link + Google auth, DOB onboarding, sidebar / bottom nav, explore with filters + infinite scroll, rankings, character page, 24 original seed characters (8 Lover, 8 Friend, 8 Famous-historical) with illustrated SVG placeholder avatars.
3. **Phase 3 — Chat.** Streaming via Anthropic, history, regenerate, edit last, ratings, memories + rolling summary every ~30 messages, 30/day limit via Upstash, crisis detection, AI disclosure.
4. **Phase 4 — AI Character Creator.** 6 steps, Zod-validated JSON generation, fal.ai avatars (4 options), sliders, per-field regenerate, test chat, publish with moderation, 3 free creations.
5. **Phase 5 — Monetization.** Stripe test mode: Plus monthly/yearly, Bean packs, portal, webhooks, paywall UI, ad slots on free tier (placeholders until network is chosen).
6. **Phase 6 — Admin & polish.** Reports queue, hide/ban, audit log, public publishing on, legal pages, account export/delete, final accessibility + Lighthouse pass.

## Dependencies (Phase 1)

`next`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`, `next-themes` (theme toggle), `server-only`. Dev: `vitest`, `@playwright/test`, `prettier`, `prettier-plugin-tailwindcss`, `eslint-config-next`.

> Phase 1 note: `framer-motion` was tried and removed — the hero animation is plain CSS, which took mobile Lighthouse performance from 77 to 95+. shadcn/ui components get added in Phase 2 when the app needs dialogs, menus and forms.

Later phases add: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `@fal-ai/client`, `stripe`, `@upstash/redis`, `@upstash/ratelimit`.
