import "server-only";
import type { User } from "@supabase/supabase-js";
import { ageOn } from "./age";
import { siteConfig } from "@/config/site";
import { createAdminClient } from "./supabase/admin";

/**
 * Password sign-ups give their date of birth on the sign-up form (stored in
 * user metadata). On first sign-in we copy it to the profile with the service
 * role, so users skip the separate age step. Returns true if the profile now
 * has a verified adult DOB.
 */
export async function completeOnboardingFromMetadata(user: User): Promise<boolean> {
  const dob = typeof user.user_metadata?.dob === "string" ? user.user_metadata.dob : null;
  const age = dob ? ageOn(dob) : null;
  if (!dob || age === null || age < siteConfig.minimumAge) return false;
  const name =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.slice(0, 40)
      : null;
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ dob, is_adult: true, ...(name ? { display_name: name } : {}) })
    .eq("id", user.id)
    .is("dob", null);
  return !error;
}
