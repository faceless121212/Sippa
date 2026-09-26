import { NextResponse } from "next/server";
import { z } from "zod";
import { NUDGE_COLUMNS, NUDGE_MIN_GAP_MS, NUDGES_PER_DAY, writeNudge } from "@/lib/nudges";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ excludeChatId: z.string().uuid().optional() });

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

  const { excludeChatId } = body.parse((await request.json().catch(() => ({}))) ?? {});
  let excludeCharacter: string | null = null;
  if (excludeChatId) {
    const { data: ex } = await admin
      .from("chats")
      .select("character_id")
      .eq("id", excludeChatId)
      .maybeSingle();
    excludeCharacter = ex?.character_id ?? null;
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

  const { data: c } = await admin.from("characters").select(NUDGE_COLUMNS).eq("id", pick).maybeSingle();
  if (!c || c.status === "hidden" || (c.visibility === "private" && c.creator_id !== user.id)) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await writeNudge(c, p.display_name);
  const { data: nudge, error } = await admin
    .from("nudges")
    .insert({ user_id: user.id, character_id: c.id, text })
    .select("id")
    .single();
  if (error) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ id: nudge.id, characterId: c.id, name: c.name, avatarUrl: c.avatar_url, text });
}
