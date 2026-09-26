import { Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * Free-plan ad slot (DECISIONS #14: light ads, never inside chats). Until an
 * ad network is chosen it promotes Sippa Plus — no third-party tracking.
 */
export function HouseAd() {
  return (
    <aside
      aria-label="Advertisement"
      className="border-border bg-surface flex items-center gap-4 rounded-xl border p-4"
    >
      <span className="text-muted text-[10px] font-bold tracking-[0.08em] uppercase">Ad</span>
      <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">
        <strong>Sippa Plus</strong> — unlimited chats, 300 Beans a month and no ads.
      </p>
      <Link
        href="/app/plus"
        className="bg-primary shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-black"
      >
        Try Plus
      </Link>
    </aside>
  );
}
