# Deploying Sippa

Sippa is published in two places:

| What | Where | How |
|---|---|---|
| **The app** (sign-up, chat, creator, payments…) | Vercel | Connected to this GitHub repo; every push to `main` deploys |
| **The landing page** (plus legal pages) | GitHub Pages, `https://faceless121212.github.io/Sippa/` | `.github/workflows/pages.yml` rebuilds it on every push to `main` |

GitHub Pages only serves static files, so it can't run the app. That's why the app is on Vercel.

## 1. The app on Vercel (one-time setup)

1. **Import the repo.** In vercel.com, go to **Add New → Project** and import `faceless121212/Sippa`. Keep the Next.js defaults. `vercel.json` already puts the server in Stockholm (`arn1`), next to the Supabase database.
2. **Add the environment variables** (Settings → Environment Variables → Production). Copy the values from your `.env.local`:

   | Variable | Notes |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret: server only |
   | `ANTHROPIC_API_KEY` | Secret |
   | `FAL_KEY` | Secret |
   | `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://sippa.vercel.app` |
   | `PAYMENTS_MODE` | `demo`, so checkout stays simulated until Stripe is set up |
   | `NEXT_PUBLIC_GOOGLE_AUTH` | `1` only after Google is enabled in Supabase |

   You don't need `SUPABASE_DB_URL` or `RESEND_API_KEY` on Vercel. Migrations run from your machine, and email goes through Supabase's SMTP settings.
3. **Deploy.**
4. **Allow the new address to sign people in.** In Supabase → Authentication → URL Configuration:
   - Set **Site URL** to the Vercel URL.
   - Under **Redirect URLs**, add `https://<vercel-url>/auth/callback` and keep `http://localhost:3000/auth/callback`.
5. **Point the landing page at the app.** In GitHub, go to Settings → Secrets and variables → Actions → **Variables** and add `APP_URL` = your Vercel URL. Then re-run the "Landing → GitHub Pages" workflow (Actions tab), or push anything.

## 2. The landing on GitHub Pages

- It's already set up: the workflow builds the site with `NEXT_PUBLIC_STATIC_LANDING=1` under the `/Sippa` base path. `scripts/export-landing.ts` then saves the rendered pages, JS/CSS and images, and checks that nothing referenced is missing.
- **Without `APP_URL`,** the sign-up and sign-in buttons scroll to an "Opening soon" note. **With it,** they open the app on Vercel.
- **Preview locally:**
  ```bash
  NEXT_DIST_DIR=.next-pages NEXT_PUBLIC_STATIC_LANDING=1 NEXT_PUBLIC_BASE_PATH=/Sippa npx next build
  NEXT_DIST_DIR=.next-pages NEXT_PUBLIC_STATIC_LANDING=1 NEXT_PUBLIC_BASE_PATH=/Sippa npx next start -p 3300 &
  npx tsx scripts/export-landing.ts   # writes out-pages/
  ```

## Before a public launch

- **Rotate every key** that was ever pasted into a chat: Supabase service role, Anthropic, fal, Resend, and the database password.
- **Custom domain:** point it at Vercel, then update `NEXT_PUBLIC_SITE_URL`, the Supabase URLs and `APP_URL`.
- **Real payments:** `STRIPE_SECRET_KEY`, the webhook and `STRIPE_WEBHOOK_SECRET`, then remove `PAYMENTS_MODE=demo`. Live keys stay blocked until `ALLOW_LIVE_PAYMENTS=1`.
- **Legal review** of `/legal/*`.
