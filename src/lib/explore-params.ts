import { categories, genreTags, type CategoryId } from "@/config/categories";
import type { Gender } from "@/data/characters";

export type ExploreParams = {
  category?: CategoryId;
  tag?: string;
  gender?: Gender;
  q?: string;
  sort: "popular" | "trending" | "new";
  offset: number;
};

const CATEGORY_IDS = categories.map((c) => c.id) as string[];
const ALL_TAGS = new Set([...categories.flatMap((c) => c.subTags), ...genreTags]);
const GENDERS = ["male", "female", "nonbinary"];
const SORTS = ["popular", "trending", "new"];

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function get(raw: Raw, key: string): string | undefined {
  const v = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s ?? undefined;
}

/** Parses and whitelists explore filters from a URL. Unknown values are dropped. */
export function parseExploreParams(raw: Raw): ExploreParams {
  const category = get(raw, "category");
  const tag = get(raw, "tag");
  const gender = get(raw, "gender");
  const sort = get(raw, "sort");
  const q = get(raw, "q")?.trim().slice(0, 60);
  const offset = Math.max(0, Math.min(10_000, Number.parseInt(get(raw, "offset") ?? "0", 10) || 0));
  return {
    category: category && CATEGORY_IDS.includes(category) ? (category as CategoryId) : undefined,
    tag: tag && ALL_TAGS.has(tag) ? tag : undefined,
    gender: gender && GENDERS.includes(gender) ? (gender as Gender) : undefined,
    q: q || undefined,
    sort: sort && SORTS.includes(sort) ? (sort as ExploreParams["sort"]) : "popular",
    offset,
  };
}

/** Builds an explore URL, dropping empty values. `patch` overrides `base`. */
export function exploreHref(base: Partial<ExploreParams>, patch: Partial<ExploreParams> = {}): string {
  const merged = { ...base, ...patch };
  const sp = new URLSearchParams();
  for (const key of ["category", "tag", "gender", "q", "sort"] as const) {
    const v = merged[key];
    if (v && !(key === "sort" && v === "popular")) sp.set(key, String(v));
  }
  const s = sp.toString();
  return `/app/explore${s ? `?${s}` : ""}`;
}
