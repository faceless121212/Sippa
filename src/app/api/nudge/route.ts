import { NextResponse } from "next/server";
import { z } from "zod";
import { NUDGE_COLUMNS, NUDGE_MIN_GAP_MS, NUDGES_PER_DAY, writeNudge } from "@/lib/nudges";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const body = z.object({
  excludeChatId: z.string().uuid().optional(),
  /** The visit's first popup: comes from a woman in the Lover category (adults only). */
  first: z.boolean().optional(),
});

/**
 * A character "writes to you": picks someone from your recent chats (or a
 * popular character) and writes a short in-character check-in.
 * 204 = nothing to show right now.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 204 });
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("is_adult,banned_at,nudges_enabled,display_name")
    .eq("id", user.id)
    .single();
  if (!p?.is_adult || p.banned_at || !p.nudges_enabled) return new NextResponse(null, { status: 204 });

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: recent } = await admin
    .from("nudges")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(NUDGES_PER_DAY);
  if (recent?.length && Date.now() - new Date(recent[0].created_at).getTime() < NUDGE_MIN_GAP_MS) {
    return new NextResponse(null, { status: 204 });
  }
  if ((recent?.length ?? 0) >= NUDGES_PER_DAY) return new NextResponse(null, { status: 204 });

  const { excludeChatId, first } = body.parse((await request.json().catch(() => ({}))) ?? {});
  let excludeCharacter: string | null = null;
  if (excludeChatId) {
    const { data: ex } = await admin
      .from("chats")
      .select("character_id")
      .eq("id", excludeChatId)
      .maybeSingle();
    excludeCharacter = ex?.character_id ?? null;
  }

  if (first) {
    const pick = await pickFirstWriter(admin, user.id, excludeCharacter);
    if (pick) return deliver(admin, user.id, pick, p.display_name);
  }

  // Prefer characters the user already talks to.
  const { data: chats } = await admin
    .from("chats")
    .select("character_id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(10);
  let pool = Array.from(new Set((chats ?? []).map((c) => c.character_id))).filter(
    (id) => id !== excludeCharacter,
  );
  if (!pool.length) {
    const { data: popular } = await admin
      .from("characters")
      .select("id")
      .eq("status", "approved")
      .eq("visibility", "public")
      .order("message_count", { ascending: false })
      .limit(12);
    pool = (popular ?? []).map((c) => c.id).filter((id) => id !== excludeCharacter);
  }
  if (!pool.length) return new NextResponse(null, { status: 204 });
  const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
  return deliver(admin, user.id, pick, p.display_name);
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * The first writer of a visit: a woman from the Lover category — one the user
 * already chats with if possible, otherwise one of the most popular. Official,
 * public characters only. (The route has already checked the user is an adult.)
 */
async function pickFirstWriter(admin: Admin, userId: string, exclude: string | null) {
  const [{ data: girls }, { data: chats }] = await Promise.all([
    admin
      .from("characters")
      .select("id")
      .eq("category", "lover")
      .eq("gender", "female")
      .eq("status", "approved")
      .eq("visibility", "public")
      .is("creator_id", null)
      .order("message_count", { ascending: false })
      .limit(20),
    admin
      .from("chats")
      .select("character_id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);
  const ids = (girls ?? []).map((g) => g.id).filter((id) => id !== exclude);
  if (!ids.length) return null;
  const known = (chats ?? []).map((c) => c.character_id).filter((id) => ids.includes(id));
  const from = known.length ? known : ids.slice(0, 8);
  return from[Math.floor(Math.random() * from.length)];
}

async function deliver(admin: Admin, userId: string, characterId: string, displayName: string | null) {
  const { data: c } = await admin
    .from("characters")
    .select(NUDGE_COLUMNS)
    .eq("id", characterId)
    .maybeSingle();
  if (!c || c.status === "hidden" || (c.visibility === "private" && c.creator_id !== userId)) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await writeNudge(c, displayName);
  const { data: nudge, error } = await admin
    .from("nudges")
    .insert({ user_id: userId, character_id: c.id, text })
    .select("id")
    .single();
  if (error) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ id: nudge.id, characterId: c.id, name: c.name, avatarUrl: c.avatar_url, text });
}
