import { Search, Sparkles, Star } from "lucide-react";
import { showUsageStats } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";
import { CharacterGrid } from "@/components/app/CharacterGrid";
import { buttonClass } from "@/components/ui/button";
import { categories, categoryStyles, genreTags } from "@/config/categories";
import { getViewer, viewerIsAdult } from "@/lib/auth";
import { listCharacters, PAGE_SIZE } from "@/lib/characters";
import { exploreHref, parseExploreParams, type ExploreParams } from "@/lib/explore-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Explore" };

const GENDERS = [
  { id: undefined, label: "Any" },
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Non-binary" },
] as const;

const SORTS = showUsageStats
  ? ([
      { id: "popular", label: "Popular" },
      { id: "trending", label: "Trending" },
      { id: "new", label: "New" },
    ] as const)
  : ([
      { id: "popular", label: "Featured" },
      { id: "new", label: "New" },
    ] as const);

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseExploreParams(await searchParams);
  const viewer = await getViewer();
  const adult = viewerIsAdult(viewer);
  const loverLocked = params.category === "lover" && !adult;

  const items = loverLocked ? [] : await listCharacters({ ...params, offset: 0, limit: PAGE_SIZE }, adult);
  const visibleCategories = categories.filter((c) => adult || !c.adultsOnly);
  const tags = params.category ? categories.find((c) => c.id === params.category)!.subTags : genreTags;
  const query = exploreHref(params).split("?")[1] ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
      <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Explore</h1>

      {/* search */}
      <form action="/app/explore" role="search" className="relative mt-5">
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <label htmlFor="explore-q" className="sr-only">
          Search characters
        </label>
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="explore-q"
          name="q"
          type="search"
          defaultValue={params.q}
          maxLength={60}
          placeholder="Search names, vibes, tags…"
          className="border-border bg-surface focus:border-text h-11 w-full rounded-lg border pr-4 pl-10 text-sm focus:outline-none"
        />
      </form>

      {/* category tabs */}
      <nav aria-label="Categories" className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4">
        <ul className="flex gap-2">
          <FilterLink
            href={exploreHref(params, { category: undefined, tag: undefined })}
            active={!params.category}
          >
            All
          </FilterLink>
          <FilterLink
            href={exploreHref(params, { badge: params.badge === "pick" ? undefined : "pick" })}
            active={params.badge === "pick"}
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            Staff picks
          </FilterLink>
          <FilterLink
            href={exploreHref(params, { badge: params.badge === "new" ? undefined : "new" })}
            active={params.badge === "new"}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            New
          </FilterLink>
          {visibleCategories.map((c) => (
            <FilterLink
              key={c.id}
              href={exploreHref(params, { category: c.id, tag: undefined })}
              active={params.category === c.id}
            >
              <span className={cn("h-2 w-2 rounded-full", categoryStyles[c.id].fill)} aria-hidden="true" />
              {c.label}
              {c.adultsOnly && <span className="text-muted text-[10px]">18+</span>}
            </FilterLink>
          ))}
        </ul>
      </nav>

      {/* tags */}
      <nav aria-label="Tags" className="no-scrollbar -mx-4 mt-3 overflow-x-auto px-4">
        <ul className="flex gap-1.5">
          {tags.map((t) => (
            <li key={t} className="shrink-0">
              <Link
                href={exploreHref(params, { tag: params.tag === t ? undefined : t })}
                aria-current={params.tag === t ? "true" : undefined}
                className={cn(
                  "block rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  params.tag === t
                    ? "border-text bg-text text-bg"
                    : "border-border text-muted hover:text-text hover:bg-surface",
                )}
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* gender + sort */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Gender"
          options={GENDERS}
          current={params.gender}
          build={(id) => exploreHref(params, { gender: id })}
        />
        <Segmented
          label="Sort"
          options={SORTS}
          current={params.sort}
          build={(id) => exploreHref(params, { sort: id as ExploreParams["sort"] })}
        />
      </div>

      <div className="mt-6">
        {loverLocked ? (
          <div className="border-border bg-surface mx-auto max-w-md rounded-xl border p-8 text-center">
            <p className="text-lg font-bold">Lover is 18+</p>
            <p className="text-muted mt-2 text-sm">
              {viewer
                ? "Confirm your age to see romance characters."
                : "Log in and confirm your age to see romance characters."}
            </p>
            <Link
              href={`/login?next=${encodeURIComponent("/app/explore?category=lover")}`}
              className={buttonClass({ className: "mt-5" })}
            >
              {viewer ? "Confirm age" : "Log in"}
            </Link>
          </div>
        ) : (
          <CharacterGrid
            key={query}
            initial={items}
            initialNextOffset={items.length === PAGE_SIZE ? PAGE_SIZE : null}
            query={query}
          />
        )}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors",
          active ? "border-text bg-text text-bg" : "border-border hover:bg-surface",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

function Segmented<T extends string | undefined>({
  label,
  options,
  current,
  build,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  current: T | undefined;
  build: (id: T) => string;
}) {
  return (
    <nav aria-label={label}>
      <ul className="bg-surface-2 flex rounded-lg p-0.5">
        {options.map((o) => {
          const active = o.id === current;
          return (
            <li key={o.label}>
              <Link
                href={build(o.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "block rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  active ? "bg-bg text-text shadow-sm" : "text-muted hover:text-text",
                )}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
