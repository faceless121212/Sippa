"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AGE_BLOCK_COOKIE } from "@/lib/age";
import {
  emailOnlySchema,
  firstError,
  passwordSchema,
  signInSchema,
  signUpAgeOk,
  signUpSchema,
} from "@/lib/auth-validation";
import { completeOnboardingFromMetadata } from "@/lib/onboarding";
import { createRateLimiter } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

/**
 * Where email links (confirm, magic link, password reset) send people back to.
 * An empty NEXT_PUBLIC_SITE_URL counts as unset: then the address this request came in
 * on is used (e.g. https://sippa-kappa.vercel.app). Supabase only honours addresses in
 * its Redirect URLs allow-list; anything else falls back to its Site URL.
 */
async function origin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
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

// ───────────── email + password (owner decision 2026-09-26) ─────────────

export type AuthState = {
  status: "idle" | "error" | "check-email" | "done";
  message?: string;
  email?: string;
  unconfirmed?: boolean;
  /** Sign-up with an email that already has an account (owner decision 2026-09-28). */
  exists?: "confirmed" | "unconfirmed";
};

/**
 * Is there already an account for this email? Emails are stored lowercased in
 * profiles (one row per auth user); confirmation state comes from the auth user.
 */
async function existingAccount(email: string): Promise<"confirmed" | "unconfirmed" | null> {
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!p) return null;
  const { data } = await admin.auth.admin.getUserById(p.id);
  if (!data.user) return null;
  return data.user.email_confirmed_at ? "confirmed" : "unconfirmed";
}

const attempts = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/**
 * Sign up: validates, refuses under-18s BEFORE creating anything, then asks
 * Supabase to create the account and email a confirmation link. The DOB and
 * name ride along in user metadata so onboarding completes automatically.
 */
export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { status: "error", message: "Sign-up isn't set up yet." };
  if (!attempts(`signup:${await clientKey()}`))
    return { status: "error", message: "Too many attempts. Try again in a few minutes." };
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const { email, password, dob, displayName } = parsed.data;

  if (!signUpAgeOk(dob)) {
    (await cookies()).set(AGE_BLOCK_COOKIE, "1", {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/onboarding/blocked");
  }

  // Tell people plainly when the email is taken, and don't create or email anything.
  const exists = await existingAccount(email);
  if (exists === "confirmed")
    return { status: "error", exists, email, message: "This email is already registered." };
  if (exists === "unconfirmed")
    return {
      status: "error",
      exists,
      email,
      message: "This email is already registered but hasn't been confirmed yet.",
    };

  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
      data: { dob, display_name: displayName || null },
    },
  });
  if (error) {
    console.error("sign up:", error.message);
    if (/password/i.test(error.message)) return { status: "error", message: error.message };
    if (/rate limit/i.test(error.message))
      return { status: "error", message: "Too many emails sent. Try again in a little while." };
    return { status: "error", message: "We couldn't create your account. Try again." };
  }
  // Backup signal: Supabase returns a user with no identities for an existing email.
  if (data.user && data.user.identities?.length === 0)
    return { status: "error", exists: "confirmed", email, message: "This email is already registered." };
  return { status: "check-email", email };
}

/** Sign in with email + password. */
export async function signInWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { status: "error", message: "Sign-in isn't set up yet." };
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  const { email, password } = parsed.data;
  if (!attempts(`signin:${await clientKey()}:${email}`)) {
    return { status: "error", message: "Too many attempts. Try again in a few minutes.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return { status: "error", message: "Please confirm your email first.", email, unconfirmed: true };
    }
    return { status: "error", message: "Wrong email or password.", email };
  }
  const next = safeNext(String(form.get("next") ?? ""));
  const { data: profile } = await supabase
    .from("profiles")
    .select("dob")
    .eq("id", data.user.id)
    .maybeSingle();
  const ready = Boolean(profile?.dob) || (await completeOnboardingFromMetadata(data.user));
  redirect(ready ? next : `/onboarding?next=${encodeURIComponent(next)}`);
}

/** Resend the sign-up confirmation email. */
export async function resendConfirmation(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  if (!attempts(`resend:${parsed.data.email}`))
    return { status: "error", message: "Please wait a few minutes before trying again." };
  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) console.error("resend:", error.message);
  return { status: "check-email", email: parsed.data.email };
}

/** Forgot password: always answers the same (no account enumeration). */
export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  if (!attempts(`reset:${parsed.data.email}`))
    return { status: "error", message: "Please wait a few minutes before trying again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error) console.error("reset:", error.message);
  return { status: "check-email", email: parsed.data.email };
}

/** Set a new password (the reset link signed the user in). */
export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(String(form.get("password") ?? ""));
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };
  if (form.get("password") !== form.get("confirm"))
    return { status: "error", message: "The passwords don't match." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Your reset link expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { status: "error", message: error.message };
  redirect("/app?password=updated");
}
