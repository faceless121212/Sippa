import { NextResponse } from "next/server";
import { completeOnboardingFromMetadata } from "@/lib/onboarding";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/** Magic-link and Google OAuth land here with a one-time code. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("dob")
        .eq("id", data.user.id)
        .maybeSingle();
      const ready = Boolean(profile?.dob) || (await completeOnboardingFromMetadata(data.user));
      const dest = ready ? next : `/onboarding?next=${encodeURIComponent(next)}`;
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
