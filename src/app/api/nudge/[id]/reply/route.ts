import { NextResponse } from "next/server";
import { createChat } from "@/lib/chat/service";
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

  const { data: existing } = await admin
    .from("chats")
    .select("id,message_count")
    .eq("user_id", user.id)
    .eq("character_id", n.character_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let chatId = existing?.id as string | undefined;
  if (!chatId) {
    chatId = await createChat(user.id, n.character_id);
  }
  if (!n.used_at) {
    await admin.from("messages").insert({ chat_id: chatId, role: "assistant", content: n.text });
    await admin
      .from("chats")
      .update({
        last_message_preview: n.text.slice(0, 120),
        updated_at: new Date().toISOString(),
        message_count: (existing?.message_count ?? 1) + 1,
      })
      .eq("id", chatId);
    await admin.from("nudges").update({ used_at: new Date().toISOString() }).eq("id", id);
  }
  return NextResponse.json({ chatId });
}
