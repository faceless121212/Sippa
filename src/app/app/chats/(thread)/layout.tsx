import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { listChats } from "@/lib/chat/queries";

/**
 * Shared by every open chat. A layout isn't re-rendered when you move between chats,
 * so switching only loads the conversation, not the whole list again.
 */
export default async function ChatThreadLayout({ children }: { children: React.ReactNode }) {
  const chats = await listChats();
  return (
    <div className="flex h-dvh">
      <nav
        aria-label="Your chats"
        className="border-border hidden w-80 shrink-0 overflow-y-auto border-r lg:block"
      >
        <h2 className="px-4 pt-5 pb-1 text-xl font-extrabold tracking-[-0.02em]">Chats</h2>
        <ChatSidebar chats={chats} />
      </nav>
      {children}
    </div>
  );
}
