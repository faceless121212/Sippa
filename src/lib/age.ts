import { siteConfig } from "@/config/site";

/** Set after an under-18 sign-up attempt; the login page refuses while it exists. */
export const AGE_BLOCK_COOKIE = "sippa_age_block";

/** Whole years between `dob` (YYYY-MM-DD) and `today`. Returns null for invalid dates. */
export function ageOn(dob: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== mo - 1 || birth.getUTCDate() !== d) return null;
  if (birth > today || y < 1900) return null;
  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() < mo - 1 || (today.getUTCMonth() === mo - 1 && today.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age;
}

export function isAdult(dob: string, today: Date = new Date()): boolean {
  const age = ageOn(dob, today);
  return age !== null && age >= siteConfig.minimumAge;
}
