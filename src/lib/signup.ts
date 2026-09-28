import { appUrl } from "./paths";

/** Every landing-page CTA goes to sign-up, then on to `next` after the account is confirmed. */
export function signupHref(next = "/app"): string {
  return appUrl(`/signup?next=${encodeURIComponent(next)}`);
}
