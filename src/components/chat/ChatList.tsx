import Link from "next/link";
import type { ChatListItem } from "@/lib/chat/queries";
import { cn } from "@/lib/utils";
import { CharacterAvatar } from "../CharacterAvatar";

function when(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ChatList({ chats, activeId }: { chats: ChatListItem[]; activeId?: string }) {
  if (!chats.length) {
    return (
      <p className="text-muted px-4 py-8 text-center text-sm">
        No chats yet.{" "}
        <Link href="/app/explore" className="text-text font-semibold underline underline-offset-2">
          Find someone to talk to
        </Link>
        .
      </p>
    );
  }
  return (
    <ul className="space-y-0.5 p-2">
      {chats.map((c) => (
        <li key={c.id}>
          <Link
            href={`/app/chats/${c.id}`}
            aria-current={c.id === activeId ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2.5 transition-colors",
              c.id === activeId ? "bg-surface-2" : "hover:bg-surface",
            )}
          >
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
              <CharacterAvatar id={c.characterId} name={c.characterName} src={c.avatarUrl} sizes="44px" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-bold">{c.characterName}</span>
                <span className="text-muted shrink-0 text-[11px]">{when(c.updatedAt)}</span>
              </span>
              <span className="text-muted block truncate text-xs">{c.preview}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
