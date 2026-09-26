import { NextResponse } from "next/server";
import { createChat } from "@/lib/chat/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Reply to a moment: it lands in your chat with that character, which then opens. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  // RLS read: the viewer must be allowed to see this moment's character.
  const { data: m } = await supabase
    .from("moments")
    .select("id,character_id,text")
    .eq("id", id)
    .maybeSingle();
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("chats")
    .select("id,message_count")
    .eq("user_id", user.id)
    .eq("character_id", m.character_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const chatId = existing?.id ?? (await createChat(user.id, m.character_id));
  const content = `*shared a moment:* ${m.text}`;
  await admin.from("messages").insert({ chat_id: chatId, role: "assistant", content });
  await admin
    .from("chats")
    .update({
      last_message_preview: content.slice(0, 120),
      updated_at: new Date().toISOString(),
      message_count: (existing?.message_count ?? 1) + 1,
    })
    .eq("id", chatId);
  return NextResponse.json({ chatId });
}
