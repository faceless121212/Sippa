import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ChatView, type ChatMessage } from "@/components/chat/ChatView";
import type { CategoryId } from "@/config/categories";
import { pricing } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { remainingToday } from "@/lib/chat/service";
import { countryFromHeaders, helplinesFor } from "@/lib/safety/crisis";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(chatId)) notFound();

  // Everything starts at once (2 rounds): the sign-in check runs alongside the chat's reads,
  // which RLS already limits to the viewer's own rows. The bond is embedded in the chat query
  // (bonds RLS returns only the viewer's own row), so it needs no extra round.
  const viewerP = requireAdult(`/app/chats/${chatId}`);
  const supabase = await createClient();
  const [, { data: chat }, { data: rows }, { data: memories }, remaining] = await Promise.all([
    viewerP,
    supabase
      .from("chats")
      .select("id,summary,character_id,characters(id,name,hook,avatar_url,category,bonds(xp))")
      .eq("id", chatId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id,role,content,rating,flagged,flag_reason")
      .eq("chat_id", chatId)
      .order("id", { ascending: false })
      .limit(200),
    supabase.from("memories").select("id,text").eq("chat_id", chatId).order("created_at"),
    viewerP.then((v) => remainingToday(v.user.id, v.profile!.plan)),
  ]);
  const row = chat?.characters as unknown as {
    id: string;
    name: string;
    hook: string;
    avatar_url: string | null;
    category: CategoryId;
    bonds: { xp: number }[] | null;
  } | null;
  const character = row
    ? { id: row.id, name: row.name, hook: row.hook, avatarUrl: row.avatar_url, category: row.category }
    : null;
  if (!chat || !character) notFound();

  const messages: ChatMessage[] = (rows ?? [])
    .reverse()
    .filter((r) => !(r.flagged && r.flag_reason === "minor_sexual"))
    .map((r) => ({ id: r.id, role: r.role, content: r.content, rating: r.rating }));

  return (
    <ChatView
      key={chatId}
      chatId={chatId}
      character={character}
      bondXp={row?.bonds?.[0]?.xp ?? 0}
      initialMessages={messages}
      initialMemories={memories ?? []}
      summary={chat.summary}
      remaining={remaining}
      freeLimit={pricing.freeMessagesPerDay}
      helplines={helplinesFor(countryFromHeaders(await headers())).lines}
    />
  );
}
