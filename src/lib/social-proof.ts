import "server-only";
import { unstable_cache } from "next/cache";
import type { CategoryId } from "@/config/categories";
import { socialProof } from "@/config/site";
import { createAdminClient } from "./supabase/admin";
import { supabaseConfigured } from "./supabase/config";

export type Activity = {
  kind: "chat" | "created";
  at: string;
  character: { id: string; name: string; avatarUrl: string | null; category: CategoryId };
};

export type SocialProof = {
  /** Anonymous recent events — never who, only which character. */
  activity: Activity[];
  /** Real totals; null until there are enough chats to be meaningful. */
  counters: { chats: number; communityCharacters: number; moments: number } | null;
  /** Share of rated replies rated 👍; null until enough ratings exist. */
  rating: { percent: number; total: number } | null;
};

type CharJoin = {
  id: string;
  name: string;
  avatar_url: string | null;
  category: CategoryId;
  status: string;
  visibility: string;
} | null;

const EMPTY: SocialProof = { activity: [], counters: null, rating: null };

/** Everything in one parallel round. Service role: only totals and public characters leave the server. */
export async function loadSocialProof(adult: boolean, now = Date.now()): Promise<SocialProof> {
  if (!supabaseConfigured) return EMPTY;
  const admin = createAdminClient();
  const since = new Date(now - socialProof.activityWindowHours * 3_600_000).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [chats, communityCharacters, moments, rated, liked, recentChats, recentCreated] = await Promise.all([
    count(admin.from("chats").select("id", { count: "exact", head: true })),
    count(
      admin
        .from("characters")
        .select("id", { count: "exact", head: true })
        .not("creator_id", "is", null)
        .eq("status", "approved"),
    ),
    count(admin.from("moments").select("id", { count: "exact", head: true })),
    count(admin.from("messages").select("id", { count: "exact", head: true }).not("rating", "is", null)),
    count(admin.from("messages").select("id", { count: "exact", head: true }).eq("rating", 1)),
    admin
      .from("chats")
      .select("created_at,characters(id,name,avatar_url,category,status,visibility)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("characters")
      .select("id,name,avatar_url,category,status,visibility,created_at")
      .not("creator_id", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const visible = (c: CharJoin): c is NonNullable<CharJoin> =>
    Boolean(c && c.status === "approved" && c.visibility === "public" && (adult || c.category !== "lover"));
  const toCharacter = (c: NonNullable<CharJoin>) => ({
    id: c.id,
    name: c.name,
    avatarUrl: c.avatar_url,
    category: c.category,
  });

  const activity: Activity[] = [
    ...(recentChats.data ?? []).flatMap((r) => {
      const c = r.characters as unknown as CharJoin;
      return visible(c)
        ? [{ kind: "chat" as const, at: r.created_at as string, character: toCharacter(c) }]
        : [];
    }),
    ...(recentCreated.data ?? []).flatMap((c) =>
      visible(c as CharJoin)
        ? [
            {
              kind: "created" as const,
              at: c.created_at as string,
              character: toCharacter(c as NonNullable<CharJoin>),
            },
          ]
        : [],
    ),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return {
    activity,
    counters: chats >= socialProof.minChatsForCounters ? { chats, communityCharacters, moments } : null,
    rating:
      rated >= socialProof.minRatingsForScore
        ? { percent: Math.round((liked / rated) * 100), total: rated }
        : null,
  };
}

/** Cached for a minute, so busy pages don't recount on every view. */
export const getSocialProof = (adult: boolean) =>
  unstable_cache(() => loadSocialProof(adult), ["social-proof", adult ? "adult" : "all"], {
    revalidate: 60,
  })();
