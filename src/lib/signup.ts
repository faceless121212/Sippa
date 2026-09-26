/** Every landing-page CTA goes to sign-up, then on to `next` after the account is confirmed. */
export function signupHref(next = "/app"): string {
  return `/signup?next=${encodeURIComponent(next)}`;
}
