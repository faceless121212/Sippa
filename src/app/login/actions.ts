"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/safe-next";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

async function origin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!supabaseConfigured)
    return { status: "error", message: "Sign-in isn't set up yet (Supabase keys missing)." };
  const email = z.email().safeParse(
    String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!email.success) return { status: "error", message: "Please enter a valid email." };
  const next = safeNext(String(form.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("magic link:", error.message);
    return { status: "error", message: "We couldn't send the link. Try again in a minute." };
  }
  return { status: "sent", message: email.data };
}

export async function signInWithGoogle(form: FormData) {
  if (!supabaseConfigured) redirect("/login?error=config");
  const next = safeNext(String(form.get("next") ?? ""));
  if (!(await googleEnabled())) redirect("/login?error=google-off");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

/** Is the Google provider switched on in Supabase? (Cached for a minute.) */
async function googleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      next: { revalidate: 60 },
    });
    const data = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(data.external?.google);
  } catch {
    return true; // let Supabase report the real problem
  }
}
