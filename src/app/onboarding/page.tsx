import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.profile?.dob) redirect(viewer.profile.is_adult ? next : "/onboarding/blocked");

  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.03em]">One quick thing</h1>
        <p className="text-muted mt-2 text-sm">Confirm your age to start chatting.</p>
        <div className="mt-6">
          <OnboardingForm next={next} maxDate={today} />
        </div>
      </div>
    </main>
  );
}
