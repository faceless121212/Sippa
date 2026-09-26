import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { AGE_BLOCK_COOKIE } from "@/lib/age";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if ((await cookies()).get(AGE_BLOCK_COOKIE)) redirect("/onboarding/blocked");
  if (await getViewer()) redirect(next);
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const maxDob = d.toISOString().slice(0, 10);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. 30 messages a day and 3 characters to brew."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-text font-semibold underline underline-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton next={next} label="Sign up with Google" />
        <OrDivider />
        <SignupForm next={next} maxDob={maxDob} />
      </div>
    </AuthShell>
  );
}
