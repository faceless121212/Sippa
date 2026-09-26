import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false } };

// Every app page depends on who is signed in.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  // Signed in but hasn't passed the age gate yet → finish onboarding first.
  if (viewer && !viewer.profile?.dob) redirect("/onboarding");
  if (viewer?.profile && !viewer.profile.is_adult) redirect("/onboarding/blocked");

  return (
    <AppShell
      viewer={{
        signedIn: Boolean(viewer),
        name: viewer?.profile?.display_name ?? viewer?.user.email ?? null,
        plan: viewer?.profile?.plan,
        isAdmin: viewer?.profile?.is_admin ?? false,
        nudges: viewer?.profile?.nudges_enabled ?? false,
      }}
    >
      {children}
    </AppShell>
  );
}
