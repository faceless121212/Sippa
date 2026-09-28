"use client";

import { useParams } from "next/navigation";
import type { ChatListItem } from "@/lib/chat/queries";
import { ChatList } from "./ChatList";

/** The chat list beside an open chat. Lives in a layout, so it stays put while you switch chats. */
export function ChatSidebar({ chats }: { chats: ChatListItem[] }) {
  const { chatId } = useParams<{ chatId?: string }>();
  return <ChatList chats={chats} activeId={chatId} />;
}
