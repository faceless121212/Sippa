import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AGE_BLOCK_COOKIE } from "@/lib/age";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

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
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Sippa home">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.03em]">Start sipping</h1>
        <p className="text-muted mt-2 text-sm">Log in or create an account. No password needed.</p>
        {error && errors[error] && (
          <p role="alert" className="border-border bg-surface mt-4 rounded-lg border p-3 text-sm">
            {errors[error]}
          </p>
        )}
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
        <p className="text-muted mt-6 text-xs leading-relaxed">
          Sippa is for adults 18+. By continuing you agree to the{" "}
          <Link href="/legal/terms" className="text-text underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-text underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
