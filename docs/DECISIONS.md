# Sippa — Decisions

Answers to the kickoff questions (spec §11), recorded 2026-09-26.

| #   | Topic                | Decision                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Repo location        | `~/Sippa-app`, remote `github.com/faceless121212/Sippa.git`. Push only on explicit OK.                                                                                                                                                                                                                                                            |
| 1   | Scope                | Landing page first (Phase 1), then MVP phases 2–6, stopping after each.                                                                                                                                                                                                                                                                           |
| 2   | Markets / languages  | **English only.** No i18n framework for now (strings kept in components/config; easy to extract later).                                                                                                                                                                                                                                           |
| 3   | Brand                | **Changed 2026-09-26:** Limitless-style neutral UI — white/#FAFAFA (light, default) and #121212/black (dark), grey borders, Inter only, 8–12px radii, lime `#C3FF00` buttons with black text. Logo = name-only wordmark "sippa." (lime full stop); app icon = lime "S" on black. Categories: Lover `#ED5023`, Friend `#389A57`, Famous `#0079FF`. |
| 4   | Tagline              | "Brew your perfect companion." (editable in `src/config/site.ts`).                                                                                                                                                                                                                                                                                |
| 5   | Landing creator demo | Pre-made example, no real API call.                                                                                                                                                                                                                                                                                                               |
| 6   | Lover content        | Romance & flirting only. No explicit content. All Lover characters are fictional adults aged ≥ 21.                                                                                                                                                                                                                                                |
| 7   | Famous category      | Historical (died 70+ years ago), "inspired-by" archetypes, verified consenting creators only. No living celebrities; no romance with any real person.                                                                                                                                                                                             |
| 8   | Extra sub-tags       | Section 4 list **+ K-drama style, Gaming, Study buddies** (K-drama = trope tag for fictional characters only; no real idols).                                                                                                                                                                                                                     |
| 9   | Minimum age          | **18 everywhere.** Under-18s cannot register.                                                                                                                                                                                                                                                                                                     |
| 10  | Creator input        | Both free-text prompt and 5-question quiz.                                                                                                                                                                                                                                                                                                        |
| 11  | Avatar style         | **Changed 2026-09-26:** one semi-realistic digital-painting style for all characters (owner chose this over photoreal). Generated with fal.ai (`npm run avatars`). Never photographs; historical figures painted "as imagined"; every prompt states an adult subject; images labelled "AI-generated" in alt text and footer.                      |
| 12  | Free creations       | 3, then Beans or Plus.                                                                                                                                                                                                                                                                                                                            |
| 13  | Publishing           | Private + Unlisted at launch; Public enabled once moderation queue is live (Phase 6).                                                                                                                                                                                                                                                             |
| 14  | Business model       | **Light ads on free tier + Sippa Plus + Beans.** Banner/native ads only — never interstitials, never mid-chat. Plus removes ads. Landing copy: "No chat-interrupting ads" (not "no ads").                                                                                                                                                         |
| 15  | Pricing              | **€7.99/month, €59.99/year, 30 free messages/day** (all in `src/config/site.ts`).                                                                                                                                                                                                                                                                 |
| 16  | Accounts             | Has: Vercel, LLM, image provider. Missing: Supabase, Stripe → mocked until keys exist; setup checklist in README.                                                                                                                                                                                                                                 |
| 16a | LLM                  | Anthropic Claude — Sonnet-class for chat, Haiku for moderation/summaries. Model names in env.                                                                                                                                                                                                                                                     |
| 16b | Images               | fal.ai (stylised models).                                                                                                                                                                                                                                                                                                                         |
| 17  | Company country      | **Not decided yet.** Legal pages are generic EU/GDPR placeholders flagged for a lawyer. Crisis resources are country-aware; Poland (116 123, 112) + international fallback included.                                                                                                                                                              |
| 18  | Domain               | **None yet.** `NEXT_PUBLIC_SITE_URL` env var, defaults to `http://localhost:3000`.                                                                                                                                                                                                                                                                |
| 19  | Analytics / errors   | **Neither for now.** Event call sites go through a no-op `track()` helper so PostHog can be added later.                                                                                                                                                                                                                                          |
| 20  | Moderation           | Automated-first (blocklist + LLM check auto-hides clear violations) + owner reviews queue.                                                                                                                                                                                                                                                        |
| 21  | Data access          | **Supabase client (`@supabase/supabase-js`) with generated TypeScript types — no separate ORM.** Justification: RLS policies are enforced naturally with the user's session; SQL migrations live in `supabase/migrations`; one fewer dependency.                                                                                                  |

## Phase 2 implementation notes

- **Under-18 sign-ups**: the brand-new auth account is deleted immediately after an under-18 date of birth is entered, and a 30-day cookie blocks the login page on that browser. No data is kept.
- **Age data** (`dob`, `is_adult`) and plan/beans/admin fields can only be written by the server (service role). Users can only update their display name (column-level grant + RLS).
- **Lover visibility** is enforced in the database (RLS policy using `current_user_is_adult()`), not just hidden in the UI.
- **Seed characters**: 24 originals in `src/data/characters.ts` (8 Lover 21+, 8 Friend, 8 Famous historical, all died 70+ years ago). Unit tests enforce these rules.
- **Without Supabase keys** the app falls back to reading seed data locally (dev convenience); auth is unavailable until keys exist.

## Phase 3 implementation notes

- **Models**: `claude-sonnet-5` for chat (effort `low` for fast replies), `claude-haiku-4-5` for rolling summaries. Both set in env.
- **Daily limit** (30 free messages, UTC days) is enforced in Postgres (`consume_message`, atomic) instead of Upstash Redis — no extra account needed, and it can't be bypassed from the client. Regenerate and edit also count. Crisis messages don't.
- **Safety order**: crisis check → minor/sexual hard block → allowance → model. Crisis messages never reach the model; the chat shows helplines (Poland: 116 123, 800 70 2222, 112; country-aware) and later replies get a "be gentle" note.
- **Prompt order**: safety rules → AI disclosure → character sheet (cached) → memories → summary → per-turn notes → last 24 messages. Summaries fold older messages every ~30 messages.
- **All message writes are server-only** (service role), so users can't forge assistant replies or reset limits. Verified by `npm run db:check`.

## Phase 4 implementation notes

- **Creator flow**: category → describe (free text) or 5-question quiz → Claude (`claude-sonnet-5`) returns strict JSON (Zod-validated structured output) → tune (edit, per-field regenerate, 4 dials, 4 portraits) → test chat (not saved, uses daily allowance, max 12 messages) → save as Private or Unlisted. Public publishing waits for the Phase 6 moderation queue (decision #13).
- **Safety layers**: (1) generation prompt refuses real living people / minors; (2) code rules — Lover 21+, no minor/school wording, living-person blocklist, historical figures died 70+ years ago, no flirting for Friend/Famous; (3) independent Haiku moderation review at save (fails closed); (4) fal.ai's own image safety checker.
- **Famous in the creator**: "Historical figure" or "Inspired-by archetype". Verified creators remain a placeholder.
- **Portraits** are copied from fal.ai to Supabase Storage (`avatars` bucket, public read, server-only writes). Only fal.ai URLs are accepted on save.
- **3 free creations**, counted on save. After that the API returns a paywall response (Beans/Plus arrive in Phase 5).
- **Private characters** are only visible to and chattable by their creator (RLS + server checks).
- **Seed content**: 40 characters (16 Lover incl. 11 women, 8 Friend, 16 Famous). Famous portraits are painted likenesses of iconic historical portraits; no living people.

## Phase 5 implementation notes (owner decisions 2026-09-26)

- **Beans buy**: extra character creations (50 Beans after the 3 free) and messages past the daily 30 (1 Bean each, only after the user taps "Continue with Beans").
- **Packs**: 200 Beans €1.99 · 600 €4.99 · 1500 €9.99 (config: `src/config/site.ts`).
- **Sippa Plus**: €7.99/month or €59.99/year; unlimited messages and creations, no ads, **300 Beans per month** (3,600 up front on yearly).
- **Demo payments (owner decision: "hardcoded for now")**: without a Stripe key, purchases go through a simulated checkout that grants Plus/Beans with no money. Only in development, or in production with `PAYMENTS_MODE=demo`. Demo Plus lasts one period and doesn't renew. Adding `STRIPE_SECRET_KEY` switches to real Stripe automatically.
- **Stripe Checkout + Customer Portal**, test mode only. Live keys are refused unless `ALLOW_LIVE_PAYMENTS=1`.
- **Fulfilment** is idempotent (ledger keyed by Checkout Session / invoice id), via the webhook and by re-checking the session on the success page. All plan/Beans changes are server-only (verified by `npm run db:check`).
- **Ads**: a single "house ad" slot for free users on Home promoting Plus; no third-party ad network or tracking yet (still flagged below). Never inside chats.

## Phase 6 implementation notes (owner decisions 2026-09-26)

- **Currency renamed to Flowers** (was Beans). Code/database names still say `beans`; only user-facing text and the icon changed.
- **Characters write to you**: a popup every 3–4 minutes (server enforces ≥170 s, max 40/day) from a character in the user's recent chats (or a popular one). Light, no guilt or pressure; stored only if the user taps Reply; switch in Settings.
- **Account deletion deletes everything** (owner choice): profile, chats, messages, memories, favourites, ledger, the user's created characters (and other users' chats with them) and their portraits; Stripe subscription cancelled.
- **Admin**: iladyga98@gmail.com. Automated-first moderation (Haiku review on each report; auto-hide on violation or 3+ open reports; official characters are never auto-hidden), human decisions in `/app/admin`, every action in `audit_log`.
- **Public publishing** is on: public characters pass automated review at save, then wait for admin approval before appearing in Explore. Rejected ones become Unlisted.
- **Google sign-in** is implemented; it needs the Google provider enabled in Supabase (see README). Until then the button explains it's not enabled.
- **Wellbeing**: gentle break reminder after an hour in a chat.

## Sign up & sign in (owner decision 2026-09-26)

- **Email + password** with separate Sign up (`/signup`) and Sign in (`/login`) pages; magic link and Google remain as alternatives.
- **Email confirmation required** before first sign-in (Supabase "Confirm email" on). Resend available; responses never reveal whether an email is registered.
- **Passwords**: 8–72 characters with a letter and a number (checked live and on the server).
- **Age check at sign-up**: date of birth is asked on the form; under-18s are refused before any account is created (30-day block cookie). The DOB is copied to the profile on first sign-in, so there's no extra onboarding step.
- **Forgot password** → emailed link → `/reset-password`.
- Attempt limits per IP/email on sign-up, sign-in, resend and reset (in-memory; Supabase also rate-limits).
- Note: Supabase's built-in email sender allows only a few emails per hour — set up custom SMTP (e.g. Resend) before launch.

## Engagement mechanics (owner picks 2026-09-26)

- **Gift flowers**: 🌷 5 · 💐 20 · 🌸 50 Flowers from the chat composer; the character reacts in voice; +2 bond XP per flower; gifts don't use the daily message allowance.
- **Bond levels** per user × character: 5 levels with category names (e.g. Lover: Stranger → Acquaintance → Crush → Sweetheart → Soulmate). XP: +1 per message, +2 per gifted flower, +3 per scene. The level is passed to the chat prompt so characters grow warmer, and it unlocks scenes.
- **Daily check-in**: 5 Flowers per UTC day; every 7th day in a row +30. Missing a day just restarts the streak — no penalty or guilt messaging.
- **Scene starters**: 4 per category (2 free, 2 unlocked at bond Lv 3/4). The character writes a scene-specific opening line (Haiku); the scene is kept in the chat prompt.
- **Moments feed** (`/app/moments` + Home strip): characters post short in-voice updates (Haiku, ≤ every 8 h per character, generated in the background). ❤️ likes; Reply drops the moment into your chat.
- **Likes & creator stats**: "Save" became ❤️ Like with public counts; creators see characters / likes / messages / chats in Profile; Home shows a Top creators board (display names only, approved public characters).
- All XP, Flowers and counts change only on the server (verified by `npm run db:check`).

## Flagged for later (need owner decision)

- **Real age verification** (beyond DOB self-declaration) — hook `verifyAge()` stubbed; needed before any expansion of Lover features.
- **Legal pages** (privacy, terms, community guidelines, cookie policy) — placeholders, need a lawyer and a company entity/country.
- **Ad network choice** (e.g. Google AdSense vs. a native-ad network) — ad slots are placeholder components until chosen; must respect cookie consent.
- **Creator verification flow** for Famous "verified creators" — placeholder in MVP.
