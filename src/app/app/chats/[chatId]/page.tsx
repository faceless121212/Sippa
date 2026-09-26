import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ChatList } from "@/components/chat/ChatList";
import { ChatView, type ChatMessage } from "@/components/chat/ChatView";
import { pricing } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { listChats } from "@/lib/chat/queries";
import { remainingToday } from "@/lib/chat/service";
import { countryFromHeaders, helplinesFor } from "@/lib/safety/crisis";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const viewer = await requireAdult(`/app/chats/${chatId}`);
  if (!/^[0-9a-f-]{36}$/i.test(chatId)) notFound();

  const supabase = await createClient();
  const { data: chat } = await supabase
    .from("chats")
    .select("id,summary,character_id,characters(id,name,hook)")
    .eq("id", chatId)
    .maybeSingle();
  const character = chat?.characters as unknown as { id: string; name: string; hook: string } | null;
  if (!chat || !character) notFound();

  const [{ data: rows }, { data: memories }, chats, remaining] = await Promise.all([
    supabase
      .from("messages")
      .select("id,role,content,rating,flagged,flag_reason")
      .eq("chat_id", chatId)
      .order("id", { ascending: false })
      .limit(200),
    supabase.from("memories").select("id,text").eq("chat_id", chatId).order("created_at"),
    listChats(),
    remainingToday(viewer.user.id, viewer.profile!.plan),
  ]);

  const messages: ChatMessage[] = (rows ?? [])
    .reverse()
    .filter((r) => !(r.flagged && r.flag_reason === "minor_sexual"))
    .map((r) => ({ id: r.id, role: r.role, content: r.content, rating: r.rating }));

  return (
    <div className="flex h-dvh">
      <nav
        aria-label="Your chats"
        className="border-border hidden w-80 shrink-0 overflow-y-auto border-r lg:block"
      >
        <h2 className="px-4 pt-5 pb-1 text-xl font-extrabold tracking-[-0.02em]">Chats</h2>
        <ChatList chats={chats} activeId={chatId} />
      </nav>
      <ChatView
        key={chatId}
        chatId={chatId}
        character={character}
        initialMessages={messages}
        initialMemories={memories ?? []}
        summary={chat.summary}
        remaining={remaining}
        freeLimit={pricing.freeMessagesPerDay}
        helplines={helplinesFor(countryFromHeaders(await headers())).lines}
      />
    </div>
  );
}
