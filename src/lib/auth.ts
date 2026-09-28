import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
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
  nudges_enabled: boolean;
};

/** The signed-in user as read from their verified session token. */
export type ViewerUser = { id: string; email: string | null; user_metadata: Record<string, unknown> };
export type Viewer = { user: ViewerUser; profile: Profile | null } | null;

/**
 * The signed-in user and their profile, or null. Never throws when Supabase is unconfigured.
 * Cached per request so the layout and the page share one auth round-trip.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  // getClaims verifies the session JWT locally (ES256 signing keys), saving a round-trip
  // to the auth server on every page. API routes that change data still use getUser().
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) return null;
  const user: ViewerUser = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    user_metadata: (claims.user_metadata as Record<string, unknown> | undefined) ?? {},
  };
  const { data } = await supabase
    .from("profiles")
    .select("id,email,display_name,dob,is_adult,plan,beans,is_admin,banned_at,nudges_enabled")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile: (data as Profile | null) ?? null };
});

export const viewerIsAdult = (v: Viewer) => Boolean(v?.profile?.is_adult && !v.profile.banned_at);

/** For pages that need a signed-in, age-confirmed user. */
export async function requireAdult(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!viewer.profile?.dob) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  if (!viewer.profile.is_adult) redirect("/onboarding/blocked");
  return viewer;
}

/** For admin pages and actions. Non-admins get a 404 so the area isn't discoverable. */
export async function requireAdmin() {
  const viewer = await requireAdult("/app/admin");
  if (!viewer.profile?.is_admin) notFound();
  return viewer;
}
