import { NextResponse } from "next/server";
import { ChatError, createChat, deliverToChat } from "@/lib/chat/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** "Reply" on a popup: put the character's message into your chat with them and open it. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: n } = await admin
    .from("nudges")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (!n.used_at) {
      const [chatId] = await Promise.all([
        deliverToChat(user.id, n.character_id, n.text),
        admin.from("nudges").update({ used_at: new Date().toISOString() }).eq("id", id),
      ]);
      return NextResponse.json({ chatId });
    }
    // Already delivered: just open the latest chat with this character.
    const { data: existing } = await admin
      .from("chats")
      .select("id")
      .eq("user_id", user.id)
      .eq("character_id", n.character_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ chatId: existing?.id ?? (await createChat(user.id, n.character_id)) });
  } catch (e) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
