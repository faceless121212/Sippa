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
  const viewer = await requireAdult(`/app/chats/${chatId}`);
  if (!/^[0-9a-f-]{36}$/i.test(chatId)) notFound();

  const supabase = await createClient();
  // One round of parallel reads; the bond lookup chains off the chat row.
  // Wrapped so the request runs once even though two consumers await it.
  const chatQuery = Promise.resolve(
    supabase
      .from("chats")
      .select("id,summary,character_id,characters(id,name,hook,avatar_url,category)")
      .eq("id", chatId)
      .maybeSingle(),
  );
  const [{ data: chat }, { data: rows }, { data: memories }, remaining, bond] = await Promise.all([
    chatQuery,
    supabase
      .from("messages")
      .select("id,role,content,rating,flagged,flag_reason")
      .eq("chat_id", chatId)
      .order("id", { ascending: false })
      .limit(200),
    supabase.from("memories").select("id,text").eq("chat_id", chatId).order("created_at"),
    remainingToday(viewer.user.id, viewer.profile!.plan),
    chatQuery.then(async ({ data }) => {
      if (!data) return null;
      const { data: b } = await supabase
        .from("bonds")
        .select("xp")
        .eq("user_id", viewer.user.id)
        .eq("character_id", data.character_id)
        .maybeSingle();
      return b;
    }),
  ]);
  const row = chat?.characters as unknown as {
    id: string;
    name: string;
    hook: string;
    avatar_url: string | null;
    category: CategoryId;
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
      bondXp={bond?.xp ?? 0}
      initialMessages={messages}
      initialMemories={memories ?? []}
      summary={chat.summary}
      remaining={remaining}
      freeLimit={pricing.freeMessagesPerDay}
      helplines={helplinesFor(countryFromHeaders(await headers())).lines}
    />
  );
}
