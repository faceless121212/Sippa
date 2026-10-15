import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { characterById } from "@/data/characters";
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
  // Coming from a quiz match? Say what the account keeps.
  const match = quizMatch(next);
  const first = match?.name.split(" ")[0];

  return (
    <AuthShell
      title={match ? `Save your chat with ${first}` : "Create your account"}
      subtitle={
        match ? "A free account keeps your match safe." : "Free forever. 30 messages a day and 3 characters to brew."
      }
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
      {match && (
        <div className="border-border bg-surface mb-5 flex gap-3 rounded-2xl border p-3">
          <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl">
            <CharacterAvatar id={match.id} name={match.name} sizes="48px" priority />
          </span>
          <ul className="space-y-1 text-sm">
            {[`${first} and your first message`, `Everything ${first} remembers about you`, "Pick up on any device"].map(
              (t) => (
                <li key={t} className="flex gap-1.5">
                  <Check className="text-primary-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      <div className="space-y-4">
        <GoogleButton next={next} label="Sign up with Google" />
        <OrDivider />
        <SignupForm next={next} maxDob={maxDob} />
      </div>
    </AuthShell>
  );
}

/** The character a sign-up from the quiz result is for (`next` = /app/welcome?c=…). */
function quizMatch(next: string) {
  const url = new URL(next, "https://sippa.local");
  const c = url.pathname === "/app/welcome" ? url.searchParams.get("c") : null;
  return c ? characterById(c) : undefined;
}
