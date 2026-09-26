import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { characterSheet, SAFETY_RULES } from "@/lib/chat/prompt";
import { FAST_MODEL } from "@/lib/llm";
import { hasSpokenWords } from "@/lib/nudges";
import { createAdminClient } from "@/lib/supabase/admin";

const FRESH_MS = 8 * 3600_000;
const MAX_NEW_PER_LOAD = 3;

export type Moment = {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  character: { id: string; name: string; avatarUrl: string | null; category: string };
};

type CharRow = {
  id: string;
  name: string;
  age: number | null;
  category: "lover" | "friend" | "famous";
  famous_type: string | null;
  hook: string;
  description: string;
  personality: { traits?: string[] } | null;
  speaking_style: string;
  backstory: string;
  first_message: string;
  example_dialogues: { user: string; character: string }[] | null;
  avatar_url: string | null;
};

async function writeMoment(c: CharRow): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await new Anthropic().messages.create({
      model: FAST_MODEL,
      max_tokens: 150,
      system: [
        { type: "text", text: SAFETY_RULES },
        {
          type: "text",
          text: characterSheet({
            name: c.name,
            age: c.age,
            category: c.category,
            famousType: c.famous_type,
            hook: c.hook,
            description: c.description,
            traits: c.personality?.traits ?? [],
            speakingStyle: c.speaking_style,
            backstory: c.backstory,
            firstMessage: c.first_message,
            exampleDialogues: c.example_dialogues ?? [],
          }),
        },
        {
          type: "text",
          text: "Write a short 'moment' you post to your feed today: a small thought, scene or happening from your life, first person, in your voice, max 180 characters, at most one emoji, no hashtags, nothing sexual, don't address a specific person. Output only the post.",
        },
      ],
      messages: [{ role: "user", content: "(Post your moment.)" }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .replace(/^["“]|["”]$/g, "");
    return res.stop_reason !== "refusal" && hasSpokenWords(text) ? text.slice(0, 300) : null;
  } catch (e) {
    console.error("moment:", e);
    return null;
  }
}

/**
 * The feed: moments from characters you chat with, topped up with popular
 * ones. Stale characters get a fresh moment on load (a few at a time).
 */
export async function getFeed(
  viewer: { userId: string; adult: boolean } | null,
  limit = 20,
): Promise<Moment[]> {
  const admin = createAdminClient();
  let ids: string[] = [];
  if (viewer) {
    const { data: chats } = await admin
      .from("chats")
      .select("character_id")
      .eq("user_id", viewer.userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    ids = Array.from(new Set((chats ?? []).map((c) => c.character_id))).slice(0, 8);
  }
  let popular = admin.from("characters").select("id").eq("status", "approved").eq("visibility", "public");
  if (!viewer?.adult) popular = popular.neq("category", "lover");
  const { data: top } = await popular.order("message_count", { ascending: false }).limit(10);
  ids = Array.from(new Set([...ids, ...(top ?? []).map((c) => c.id)])).slice(0, 14);
  if (!ids.length) return [];

  const { data: chars } = await admin
    .from("characters")
    .select(
      "id,name,age,category,famous_type,hook,description,personality,speaking_style,backstory,first_message,example_dialogues,avatar_url,status,visibility,creator_id",
    )
    .in("id", ids);
  const allowed = (chars ?? []).filter(
    (c) =>
      c.status === "approved" &&
      (c.visibility !== "private" || c.creator_id === viewer?.userId) &&
      (viewer?.adult || c.category !== "lover"),
  ) as (CharRow & { status: string })[];

  // Top up stale characters.
  const { data: latest } = await admin
    .from("moments")
    .select("character_id,created_at")
    .in(
      "character_id",
      allowed.map((c) => c.id),
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const lastAt = new Map<string, number>();
  for (const m of latest ?? [])
    if (!lastAt.has(m.character_id)) lastAt.set(m.character_id, new Date(m.created_at).getTime());
  const stale = allowed
    .filter((c) => Date.now() - (lastAt.get(c.id) ?? 0) > FRESH_MS)
    .slice(0, MAX_NEW_PER_LOAD);
  const topUp = async () => {
    const fresh = await Promise.all(stale.map(async (c) => ({ id: c.id, text: await writeMoment(c) })));
    const rows = fresh.filter((f) => f.text).map((f) => ({ character_id: f.id, text: f.text! }));
    if (rows.length) await admin.from("moments").insert(rows);
  };
  // Keep pages fast: only wait for new moments when the feed is nearly empty;
  // otherwise write them after the response (they show up on the next visit).
  if (stale.length) {
    if ((latest?.length ?? 0) < 3) await topUp();
    else after(() => topUp().catch((e) => console.error("moments:", e)));
  }

  const { data: moments } = await admin
    .from("moments")
    .select("id,character_id,text,created_at,like_count")
    .in(
      "character_id",
      allowed.map((c) => c.id),
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  const likedIds = new Set<string>();
  if (viewer && moments?.length) {
    const { data: likes } = await admin
      .from("moment_likes")
      .select("moment_id")
      .eq("user_id", viewer.userId)
      .in(
        "moment_id",
        moments.map((m) => m.id),
      );
    for (const l of likes ?? []) likedIds.add(l.moment_id);
  }
  const byId = new Map(allowed.map((c) => [c.id, c]));
  return (moments ?? []).map((m) => {
    const c = byId.get(m.character_id)!;
    return {
      id: m.id,
      text: m.text,
      createdAt: m.created_at,
      likeCount: m.like_count,
      liked: likedIds.has(m.id),
      character: { id: c.id, name: c.name, avatarUrl: c.avatar_url, category: c.category },
    };
  });
}
