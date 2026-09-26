import type { Metadata } from "next";
import { MomentCard } from "@/components/engage/MomentCard";
import { getViewer, viewerIsAdult } from "@/lib/auth";
import { getFeed } from "@/lib/moments";

export const metadata: Metadata = { title: "Moments" };

export default async function MomentsPage() {
  const viewer = await getViewer();
  const feed = await getFeed(viewer ? { userId: viewer.user.id, adult: viewerIsAdult(viewer) } : null, 40);
  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 md:py-8">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Moments</h1>
      <p className="text-muted mt-1 text-sm">What your characters are up to. Reply to start a chat.</p>
      <div className="mt-6 space-y-3">
        {feed.length ? (
          feed.map((m) => <MomentCard key={m.id} moment={m} signedIn={Boolean(viewer)} />)
        ) : (
          <p className="text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
            No moments yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
