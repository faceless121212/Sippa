import { ChevronRight, Flame, Sparkles, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { CharacterCard } from "@/components/CharacterCard";
import { CheckInCard } from "@/components/engage/CheckInCard";
import { MomentCard } from "@/components/engage/MomentCard";
import { getFeed } from "@/lib/moments";
import { createAdminClient } from "@/lib/supabase/admin";
import { HouseAd } from "@/components/billing/HouseAd";
import { BrandIcon } from "@/components/BrandIcon";
import { buttonClass } from "@/components/ui/button";
import { getViewer, viewerIsAdult } from "@/lib/auth";
import { listCharacters, type CharacterSummary, type ExploreQuery } from "@/lib/characters";
import { exploreHref } from "@/lib/explore-params";
import { cn, formatCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

type Collection = { title: string; subtitle: string; query: ExploreQuery; adultsOnly?: boolean };

const COLLECTIONS: Collection[] = [
  { title: "⭐ Staff picks", subtitle: "Our favourites this week.", query: { badge: "pick" } },
  { title: "✨ Just added", subtitle: "Fresh from the café.", query: { badge: "new" } },
  {
    title: "Slow burns",
    subtitle: "Take your time.",
    query: { category: "lover", tag: "Slow Burn" },
    adultsOnly: true,
  },
  {
    title: "K-drama nights",
    subtitle: "Fake dates and real feelings.",
    query: { tag: "K-drama style" },
    adultsOnly: true,
  },
  { title: "Comfort corner", subtitle: "For the 2am feelings.", query: { tag: "Comfort" } },
  {
    title: "Rulers & royals",
    subtitle: "Emperors, queens and strategists.",
    query: { tag: "Rulers & Royals" },
  },
  {
    title: "Writers & composers",
    subtitle: "Austen, Wilde, Chopin, Mozart.",
    query: { category: "famous", tag: "Writers" },
  },
  { title: "Great minds", subtitle: "History, on call.", query: { category: "famous", tag: "Scientists" } },
  {
    title: "Get things done",
    subtitle: "Study, train, level up.",
    query: { category: "friend", tag: "Motivator" },
  },
];

export default async function HomePage() {
  const viewer = await getViewer();
  const adult = viewerIsAdult(viewer);

  const [hot, trending, ...rows] = await Promise.all([
    listCharacters({ sort: "popular", limit: 3 }, adult),
    listCharacters({ sort: "trending", limit: 3 }, adult),
    ...COLLECTIONS.filter((c) => adult || !c.adultsOnly).map((c) =>
      listCharacters({ ...c.query, limit: 8 }, adult).then((items) => ({ ...c, items })),
    ),
  ]);
  const collections = rows as (Collection & { items: CharacterSummary[] })[];

  // Engagement: daily check-in, moments strip, top creators.
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const [checkins, moments, creators] = await Promise.all([
    viewer
      ? admin
          .from("checkins")
          .select("day,streak")
          .eq("user_id", viewer.user.id)
          .in("day", [today, yesterday])
      : Promise.resolve({ data: null }),
    getFeed(viewer ? { userId: viewer.user.id, adult } : null, 4),
    admin
      .from("top_creators")
      .select("creator_id,name,characters,likes,messages")
      .order("likes", { ascending: false })
      .limit(5),
  ]);
  const todayRow = checkins.data?.find((r) => r.day === today);
  const streak = todayRow?.streak ?? checkins.data?.find((r) => r.day === yesterday)?.streak ?? 0;
  const name = viewer?.profile?.display_name;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 md:py-8">
      {viewer?.profile && (
        <div className="-mb-6 flex justify-end">
          <Link
            href="/app/plus"
            className="border-border bg-surface hover:bg-surface-2 flex items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-sm transition-colors"
          >
            <BrandIcon name="flowers" size={28} />
            <strong className="text-base">{viewer.profile.beans}</strong> Flowers
            <span className="text-muted text-xs">· Get more</span>
          </Link>
        </div>
      )}

      {/* banner */}
      <section className="relative overflow-hidden rounded-2xl bg-black p-6 text-white ring-1 ring-white/10 sm:p-8">
        <div className="relative z-10 max-w-md">
          <p className="text-primary text-xs font-bold tracking-[0.08em] uppercase">
            {name ? `Welcome back, ${name}` : "Welcome to Sippa"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Brew someone new.</h1>
          <p className="mt-2 text-sm text-white/70">Describe them in one line. Chat in seconds.</p>
          <Link href="/app/create" className={buttonClass({ className: "mt-5" })}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Create a character
          </Link>
        </div>
        <div aria-hidden="true" className="absolute top-0 right-0 hidden h-full w-1/2 sm:flex">
          {hot.slice(0, 3).map((c, i) => (
            <div
              key={c.id}
              className={cn(
                "h-full flex-1 overflow-hidden opacity-80",
                i === 0 && "[mask-image:linear-gradient(to_right,transparent,black_60%)]",
              )}
            >
              <CharacterAvatar id={c.id} name={c.name} src={c.avatarUrl} sizes="200px" />
            </div>
          ))}
        </div>
      </section>

      {viewer && <CheckInCard streak={streak} claimedToday={Boolean(todayRow)} />}

      {/* rankings */}
      <section aria-labelledby="rankings-title">
        <h2 id="rankings-title" className="sr-only">
          Character rankings
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Ranking
            title="Hot"
            icon={<Flame className="text-lover-ink h-4 w-4" />}
            items={hot}
            href={exploreHref({ sort: "popular" })}
          />
          <Ranking
            title="Trending"
            icon={<TrendingUp className="text-friend-ink h-4 w-4" />}
            items={trending}
            href={exploreHref({ sort: "trending" })}
          />
        </div>
      </section>

      {viewer?.profile?.plan !== "plus" && <HouseAd />}

      {moments.length > 0 && (
        <section aria-labelledby="moments-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="moments-title" className="text-xl font-extrabold tracking-[-0.02em]">
                Moments
              </h2>
              <p className="text-muted text-sm">What your characters are up to.</p>
            </div>
            <Link
              href="/app/moments"
              className="text-muted hover:text-text flex items-center text-sm font-semibold"
            >
              See all <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {moments.map((m) => (
              <MomentCard key={m.id} moment={m} signedIn={Boolean(viewer)} />
            ))}
          </div>
        </section>
      )}

      {/* collections */}
      {collections.map((c) =>
        c.items.length ? (
          <section key={c.title} aria-labelledby={`col-${c.title}`}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id={`col-${c.title}`} className="text-xl font-extrabold tracking-[-0.02em]">
                  {c.title}
                </h2>
                <p className="text-muted text-sm">{c.subtitle}</p>
              </div>
              <Link
                href={exploreHref(c.query)}
                className="text-muted hover:text-text flex items-center text-sm font-semibold"
              >
                View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {c.items.map((ch) => (
                <li key={ch.id} className="w-40 shrink-0 snap-start sm:w-48">
                  <Link href={`/app/c/${ch.id}`} className="block rounded-xl">
                    <CharacterCard character={ch} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      {(creators.data?.length ?? 0) > 0 && (
        <section aria-labelledby="creators-title" className="border-border bg-surface rounded-2xl border p-4">
          <h2 id="creators-title" className="font-extrabold">
            🏆 Top creators
          </h2>
          <ol className="mt-3 space-y-1">
            {creators.data!.map((c, i) => (
              <li key={c.creator_id} className="flex items-center gap-3 rounded-lg p-2 text-sm">
                <span className="w-4 text-center font-extrabold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                <span className="text-muted text-xs">
                  {c.characters} character{c.characters === 1 ? "" : "s"} · ❤️ {c.likes} ·{" "}
                  {formatCount(Number(c.messages))} msgs
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Ranking({
  title,
  icon,
  items,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  items: CharacterSummary[];
  href: string;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-extrabold">
          {icon}
          {title}
        </h3>
        <Link href={href} className="text-muted hover:text-text text-xs font-semibold">
          View all
        </Link>
      </div>
      <ol className="mt-3 space-y-1">
        {items.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/app/c/${c.id}`}
              className="hover:bg-surface-2 flex items-center gap-3 rounded-lg p-2"
            >
              <span
                className={cn("w-4 text-center text-sm font-extrabold", i === 0 ? "text-text" : "text-muted")}
              >
                {i + 1}
              </span>
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                <CharacterAvatar id={c.id} name={c.name} src={c.avatarUrl} sizes="44px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{c.name}</span>
                <span className="text-muted block truncate text-xs">{c.hook}</span>
              </span>
              <span className="text-muted shrink-0 text-xs font-semibold">{formatCount(c.messages)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
