import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** GDPR data export (Art. 15/20): everything we hold about the signed-in user, as JSON. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const admin = createAdminClient();
  const [profile, characters, chats, favorites, transactions, reports] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("characters").select("*").eq("creator_id", user.id),
    admin.from("chats").select("id,character_id,summary,created_at,updated_at").eq("user_id", user.id),
    admin.from("favorites").select("character_id,created_at").eq("user_id", user.id),
    admin
      .from("transactions")
      .select("type,beans,amount_cents,currency,reason,created_at")
      .eq("user_id", user.id),
    admin
      .from("reports")
      .select("target_type,target_id,reason,details,status,created_at")
      .eq("reporter_id", user.id),
  ]);
  const chatIds = (chats.data ?? []).map((c) => c.id);
  const [messages, memories] = chatIds.length
    ? await Promise.all([
        admin
          .from("messages")
          .select("chat_id,role,content,rating,created_at")
          .in("chat_id", chatIds)
          .order("id"),
        admin.from("memories").select("chat_id,text,created_at").in("chat_id", chatIds),
      ])
    : [{ data: [] }, { data: [] }];

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    characters_created: characters.data ?? [],
    chats: (chats.data ?? []).map((c) => ({
      ...c,
      messages: (messages.data ?? []).filter((m) => m.chat_id === c.id),
      memories: (memories.data ?? []).filter((m) => m.chat_id === c.id),
    })),
    favorites: favorites.data ?? [],
    purchases_and_spending: transactions.data ?? [],
    reports_filed: reports.data ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sippa-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
