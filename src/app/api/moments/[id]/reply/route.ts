import { NextResponse } from "next/server";
import { ChatError, deliverToChat } from "@/lib/chat/service";
import { createClient } from "@/lib/supabase/server";

/** Reply to a moment: it lands in your chat with that character, which then opens. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  // Auth check and the RLS read run together: RLS already scopes the read to this session.
  const [
    {
      data: { user },
    },
    { data: m },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("moments").select("id,character_id,text").eq("id", id).maybeSingle(),
  ]);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const chatId = await deliverToChat(user.id, m.character_id, `*shared a moment:* ${m.text}`);
    return NextResponse.json({ chatId });
  } catch (e) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
