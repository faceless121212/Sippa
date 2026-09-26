import { Flame } from "lucide-react";
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
            Rankings
          </p>
          <h2
            id="hot-title"
            className="font-display flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            <Flame className="text-lover-ink h-7 w-7" aria-hidden="true" />
            Hot this week
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
          <li key={c.id} className="relative w-40 shrink-0 snap-start sm:w-auto">
            <span className="bg-primary font-display text-on-primary absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold">
              <span className="sr-only">Rank </span>
              {i + 1}
            </span>
            <CharacterCard character={c} className="h-full [&>div:first-of-type]:pl-9" />
          </li>
        ))}
      </ol>
    </section>
  );
}
