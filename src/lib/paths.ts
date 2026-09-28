/**
 * Paths for the two places the site runs:
 * - the full app (Vercel / local): base path "", app links are relative;
 * - the static landing on GitHub Pages: served under /Sippa, and links into the app
 *   go to the deployed app at NEXT_PUBLIC_APP_URL.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
/** True in the GitHub Pages build (no server: sign-up, sign-in and the app live elsewhere). */
export const isStaticLanding = process.env.NEXT_PUBLIC_STATIC_LANDING === "1";
/** Static landing with no app deployed yet: app buttons jump to a "coming soon" note. */
export const appComingSoon = isStaticLanding && !appOrigin;
export const COMING_SOON_ANCHOR = "#coming-soon";

/** Prefixes public files (/characters/x.jpg) with the base path. Leaves full URLs alone. */
export function withBase(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? basePath + path : path;
}

/** A link into the app: relative in the app itself, absolute from the static landing. */
export function appUrl(path: string): string {
  if (!isStaticLanding) return path;
  return appComingSoon ? COMING_SOON_ANCHOR : appOrigin + path;
}
