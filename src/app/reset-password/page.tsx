import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "New password", robots: { index: false } };

/** Reached from the reset email (the callback signed the user in). */
export default async function ResetPasswordPage() {
  if (!supabaseConfigured) redirect("/login");
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/forgot-password");
  return (
    <AuthShell title="Choose a new password" subtitle={`For ${user.email}`}>
      <ResetForm />
    </AuthShell>
  );
}
