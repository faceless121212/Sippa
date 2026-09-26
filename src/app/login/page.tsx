import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { AGE_BLOCK_COOKIE } from "@/lib/age";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const errors: Record<string, string> = {
  link: "That sign-in link is invalid or expired. Request a new one.",
  google: "Google sign-in isn't available right now. Use your email instead.",
  config: "Sign-in isn't set up yet.",
  "google-off": "Google sign-in isn't enabled yet — use your email for now.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if ((await cookies()).get(AGE_BLOCK_COOKIE)) redirect("/onboarding/blocked");
  if (await getViewer()) redirect(next);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep chatting."
      footer={
        <>
          New to Sippa?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="text-text font-semibold underline underline-offset-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      {error && errors[error] && (
        <p role="alert" className="border-border bg-surface mb-4 rounded-lg border p-3 text-sm">
          {errors[error]}
        </p>
      )}
      <div className="space-y-4">
        <GoogleButton next={next} />
        <OrDivider />
        <LoginForm next={next} />
      </div>
    </AuthShell>
  );
}
