import { Flame, Sparkles } from "lucide-react";
import { showUsageStats } from "@/config/site";
import Link from "next/link";
import { signupHref } from "@/lib/signup";
import { hotThisWeek } from "@/data/landing";
import { CharacterCard } from "../CharacterCard";

export function HotThisWeek() {
  return (
    <section id="hot" aria-labelledby="hot-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-muted mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
            <span className="bg-primary h-1.5 w-1.5 rounded-full ring-1 ring-black/20" aria-hidden="true" />
            {showUsageStats ? "Rankings" : "Characters"}
          </p>
          <h2
            id="hot-title"
            className="font-display flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            {showUsageStats ? (
              <Flame className="text-lover-ink h-7 w-7" aria-hidden="true" />
            ) : (
              <Sparkles className="text-lover-ink h-7 w-7" aria-hidden="true" />
            )}
            {showUsageStats ? "Hot this week" : "Staff picks"}
          </h2>
        </div>
        <Link
          href={signupHref("/app/explore")}
          className="text-primary-ink shrink-0 text-sm font-medium hover:underline"
        >
          View all
        </Link>
      </div>
      <ol className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pt-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {hotThisWeek.map((c, i) => (
          <li key={c.id} className="w-40 shrink-0 snap-start sm:w-auto">
            <CharacterCard character={c} className="h-full" rank={showUsageStats ? i + 1 : undefined} />
          </li>
        ))}
      </ol>
    </section>
  );
}
