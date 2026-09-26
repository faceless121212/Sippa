import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChatList } from "@/components/chat/ChatList";
import { buttonClass } from "@/components/ui/button";
import { requireAdult } from "@/lib/auth";
import { listChats } from "@/lib/chat/queries";

export const metadata: Metadata = { title: "Chats" };

export default async function ChatsPage() {
  await requireAdult("/app/chats");
  const chats = await listChats();

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4rem)] md:h-dvh">
      <div className="border-border w-full overflow-y-auto lg:w-80 lg:shrink-0 lg:border-r">
        <h1 className="px-4 pt-5 pb-1 text-2xl font-extrabold tracking-[-0.03em]">Chats</h1>
        <ChatList chats={chats} />
      </div>
      <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center lg:flex">
        <MessageCircle className="text-muted h-10 w-10" aria-hidden="true" />
        <p className="mt-3 text-lg font-extrabold">
          {chats.length ? "Pick a chat" : "Start your first chat"}
        </p>
        <p className="text-muted mt-1 text-sm">Or find someone new to talk to.</p>
        <Link href="/app/explore" className={buttonClass({ className: "mt-5" })}>
          Explore characters
        </Link>
      </div>
    </div>
  );
}
