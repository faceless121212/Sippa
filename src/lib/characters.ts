import "server-only";
import type { CategoryId } from "@/config/categories";
import { seedCharacters, type Character, type Gender } from "@/data/characters";
import { supabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

/** What cards and lists need. Matches the shape CharacterCard expects. */
export type CharacterSummary = {
  id: string;
  name: string;
  age?: number;
  gender: Gender;
  category: CategoryId;
  famousType?: "historical" | "inspired" | "verified_creator";
  hook: string;
  tags: string[];
  messages: number;
};

export type CharacterDetail = CharacterSummary & {
  description: string;
  traits: string[];
  speakingStyle: string;
  firstMessage: string;
  creatorName: string;
};

export type Sort = "popular" | "trending" | "new";

export type ExploreQuery = {
  category?: CategoryId;
  tag?: string;
  gender?: Gender;
  q?: string;
  sort?: Sort;
  offset?: number;
  limit?: number;
};

export const PAGE_SIZE = 12;

type Row = {
  id: string;
  name: string;
  age: number | null;
  gender: Gender;
  category: CategoryId;
  famous_type: CharacterSummary["famousType"] | null;
  hook: string;
  tags: string[];
  message_count: number;
  description?: string;
  personality?: { traits?: string[] };
  speaking_style?: string;
  first_message?: string;
  creator_id?: string | null;
};

const SUMMARY_COLUMNS = "id,name,age,gender,category,famous_type,hook,tags,message_count";

function fromRow(r: Row): CharacterSummary {
  return {
    id: r.id,
    name: r.name,
    age: r.age ?? undefined,
    gender: r.gender,
    category: r.category,
    famousType: r.famous_type ?? undefined,
    hook: r.hook,
    tags: r.tags ?? [],
    messages: Number(r.message_count ?? 0),
  };
}

function fromSeed(c: Character): CharacterSummary {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    category: c.category,
    famousType: c.famousType,
    hook: c.hook,
    tags: c.tags,
    messages: c.messages,
  };
}

/** Local fallback used until Supabase is configured. Mirrors the RLS rule for Lover. */
function querySeed(query: ExploreQuery, viewerIsAdult: boolean): CharacterSummary[] {
  const q = query.q?.trim().toLowerCase();
  let list = seedCharacters.filter(
    (c) =>
      (viewerIsAdult || c.category !== "lover") &&
      (!query.category || c.category === query.category) &&
      (!query.tag || c.tags.includes(query.tag)) &&
      (!query.gender || c.gender === query.gender) &&
      (!q || `${c.name} ${c.hook} ${c.tags.join(" ")}`.toLowerCase().includes(q)),
  );
  if (query.sort === "trending") list = [...list].sort((a, b) => b.trending - a.trending);
  else if (query.sort !== "new") list = [...list].sort((a, b) => b.messages - a.messages);
  const offset = query.offset ?? 0;
  return list.slice(offset, offset + (query.limit ?? PAGE_SIZE)).map(fromSeed);
}

export async function listCharacters(
  query: ExploreQuery,
  viewerIsAdult: boolean,
): Promise<CharacterSummary[]> {
  if (!supabaseConfigured) return querySeed(query, viewerIsAdult);

  const supabase = await createClient();
  const limit = query.limit ?? PAGE_SIZE;
  const offset = query.offset ?? 0;
  let req = supabase
    .from("characters")
    .select(SUMMARY_COLUMNS)
    .eq("status", "approved")
    .eq("visibility", "public");
  if (query.category) req = req.eq("category", query.category);
  if (query.tag) req = req.contains("tags", [query.tag]);
  if (query.gender) req = req.eq("gender", query.gender);
  if (query.q?.trim()) {
    const term = query.q.trim().replace(/[%_,()]/g, " ");
    req = req.or(`name.ilike.%${term}%,hook.ilike.%${term}%`);
  }
  const order =
    query.sort === "trending" ? "trending_score" : query.sort === "new" ? "created_at" : "message_count";
  const { data, error } = await req.order(order, { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function getCharacter(id: string, viewerIsAdult: boolean): Promise<CharacterDetail | null> {
  if (!/^[a-z0-9-]{2,64}$/.test(id)) return null;

  if (!supabaseConfigured) {
    const c = seedCharacters.find((s) => s.id === id);
    if (!c || (c.category === "lover" && !viewerIsAdult)) return null;
    return {
      ...fromSeed(c),
      description: c.description,
      traits: c.traits,
      speakingStyle: c.speakingStyle,
      firstMessage: c.firstMessage,
      creatorName: "Sippa",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .select(`${SUMMARY_COLUMNS},description,personality,speaking_style,first_message,creator_id`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as Row;
  return {
    ...fromRow(r),
    description: r.description ?? "",
    traits: r.personality?.traits ?? [],
    speakingStyle: r.speaking_style ?? "",
    firstMessage: r.first_message ?? "",
    creatorName: r.creator_id ? "Community creator" : "Sippa",
  };
}

/** Is the character a Lover one? Used to explain why a page is hidden. */
export function isSeedLover(id: string) {
  return seedCharacters.some((c) => c.id === id && c.category === "lover");
}
