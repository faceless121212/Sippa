/** Every landing-page CTA goes to sign-up (magic link creates the account), then on to `next`. */
export function signupHref(next = "/app"): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
