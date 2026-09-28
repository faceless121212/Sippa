# Sippa — testing strategy

How Sippa is tested, what each layer is for, and where the gaps are.
Run everything with `npm run test:all`.

## The pyramid

| Layer | Tool | Count | Runs in | Catches |
|---|---|---|---|---|
| Unit | Vitest (`src/**/*.test.ts`) | ~100 tests | ~3 s | Business rules, safety filters, prompt building, **round-trip budgets** |
| Live database | `npm run db:check` | 36 checks | ~20 s | Row-level security, grants, 18+ gating, protected functions (rolled back, nothing kept) |
| Browser, signed out | Playwright (`e2e/*.spec.ts`) × 3 widths | ~120 runs | ~1 min | Pages, links, sign-up flow, API refusals, page-load budget |
| Browser, signed in | Playwright (`e2e/signed-in/`) | 18 tests | ~1 min | Chat, gifts, purchases, profile, **speed budgets** |
| Live AI smoke | `chat:smoke`, `creator:smoke`, `nudge:smoke` | 3 scripts | ~1 min, a few cents | Real Claude / fal.ai behaviour (run by hand before releases) |

The browser tests run on a production build with `SIPPA_OFFLINE_AI=1` (free, predictable demo replies) and `PAYMENTS_MODE=demo`.

## What each area needs

| Area | Risk | Unit | DB | Browser | Status |
|---|---|---|---|---|---|
| Safety (crisis, minors, living people, AI disclosure) | 🔴 legal/safety | ✅ regexes, blocklist, prompt rules | ✅ Lover hidden from non-adults | ✅ 18+ gate, AI disclosure | Covered |
| Auth & age gate | 🔴 | ✅ validation | ✅ | ✅ sign-up, under-18 refusal, open-redirect | Covered |
| Private data (chats, memories, export, delete) | 🔴 | — | ✅ RLS on every table | ✅ API sweep refuses anonymous calls; other user's chat shows not-found | Covered |
| Chat (stream, limits, regenerate, memory) | 🟡 | ✅ prompts, limits | ✅ | ⏳ signed-in | **Needs test account** |
| Payments (demo, Stripe) | 🔴 money | ✅ payments mode | ✅ ledger | ⏳ signed-in demo purchase | **Needs test account** |
| Engagement (gifts, bonds, check-in, moments, scenes) | 🟡 | ✅ XP, levels, rewards | ✅ | ⏳ signed-in | **Needs test account** |
| Creator | 🟡 | ✅ rules, schema | ✅ | ⏳ signed-in (up to describe step) | Generation only in `creator:smoke` |
| Moderation & admin | 🟡 | ✅ auto-review: threshold, AI verdict, official characters never auto-hidden (`moderation.test.ts`) | ✅ | ✅ admin hidden (404) | Covered |
| **Speed** | 🔴 user-visible | ✅ round-trip budgets (`src/lib/speed.test.ts`, `chat/deliver.test.ts`) | — | ✅ signed-out page budget · ⏳ signed-in section + chat-switch budgets | **Needs test account** |

## Speed testing (why the app felt slow)

The slowness came from two things, neither a data bug:

1. **Queries waiting for each other.** The Home page made about 10 database round-trips one after another, and the Moments feed made 6. Every click also verified the login with Supabase twice.
2. **The dev compiler.** The first visit to each section took 5–57 s to compile. Turbopack cuts this to about 1 s.

Guards against it coming back:

- **Round-trip budgets (unit).** A fake database adds 25 ms to every query. Each test asserts how many *sequential* rounds a loader needs: Moments feed ≤ 4, the signed-in check ≤ 1 with no auth-server call, chat counts ≤ 1. Put back the old waterfall code and these fail (checked: the old feed took 6 rounds).
- **Browser budgets (signed in).** Every sidebar section must open in under 2.5 s, and switching chats must take under 1.5 s without re-rendering the chat list.
- **Signed-out page budget.** Key public pages must load in under 5 s.

**Rule for new pages:** start independent queries together (`Promise.all`), and add the loader to `speed.test.ts` with its round budget.

## Gaps, in priority order

1. **No test account yet**, so the 18 signed-in tests (chat, payments, speed budgets) are skipped. Create one (see README → Testing) and add `E2E_EMAIL` / `E2E_PASSWORD` to `.env.local`. This is the single biggest gap.
2. **Stripe webhook fulfilment** has no test (only "refuses unsigned events"). Next: unit-test `fulfilCheckout` idempotency with a stubbed Stripe client.
3. **Account deletion** is tested only up to the confirmation step. Next: a separate throwaway account, deleted at the end of the test.
4. **No CI yet.** When the repo gets CI: run unit + signed-out browser tests on every push, and signed-in + `db:check` nightly.

## Coverage targets

- Safety, auth, payments, private data: every rule has at least one test that fails if the rule is removed.
- Each page loader: a round-trip budget.
- Each user-facing flow: one happy-path browser test, plus the most likely failure (limit reached, not allowed, not found).
- Don't chase line coverage for UI markup or one-off scripts.
