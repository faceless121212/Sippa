"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGE_BLOCK_COOKIE, ageOn } from "@/lib/age";
import { siteConfig } from "@/config/site";
import { safeNext } from "@/lib/safe-next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

/**
 * Age gate (spec §6.2). Saves the date of birth with the service role so users
 * can't flip `is_adult` themselves. Under-18s can't register: their brand-new
 * account is deleted immediately and a block cookie discourages instant retries.
 */
export async function submitDob(_prev: OnboardingState, form: FormData): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dob = String(form.get("dob") ?? "");
  const age = ageOn(dob);
  if (age === null) return { error: "Please enter a valid date of birth." };

  const displayName =
    String(form.get("display_name") ?? "")
      .trim()
      .slice(0, 40) || null;
  const admin = createAdminClient();

  if (age < siteConfig.minimumAge) {
    await admin.auth.admin.deleteUser(user.id);
    await supabase.auth.signOut();
    (await cookies()).set(AGE_BLOCK_COOKIE, "1", {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/onboarding/blocked");
  }

  const { error } = await admin
    .from("profiles")
    .update({ dob, is_adult: true, display_name: displayName })
    .eq("id", user.id);
  if (error) {
    console.error("onboarding:", error.message);
    return { error: "Something went wrong. Please try again." };
  }
  redirect(safeNext(String(form.get("next") ?? "")));
}
