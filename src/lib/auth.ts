import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  dob: string | null;
  is_adult: boolean;
  plan: "free" | "plus";
  beans: number;
  is_admin: boolean;
  banned_at: string | null;
};

export type Viewer = { user: User; profile: Profile | null } | null;

/** The signed-in user and their profile, or null. Never throws when Supabase is unconfigured. */
export async function getViewer(): Promise<Viewer> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,email,display_name,dob,is_adult,plan,beans,is_admin,banned_at")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile: (data as Profile | null) ?? null };
}

export const viewerIsAdult = (v: Viewer) => Boolean(v?.profile?.is_adult && !v.profile.banned_at);

/** For pages that need a signed-in, age-confirmed user. */
export async function requireAdult(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!viewer.profile?.dob) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  if (!viewer.profile.is_adult) redirect("/onboarding/blocked");
  return viewer;
}
