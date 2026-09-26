import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { requireAdult, viewerIsAdult } from "@/lib/auth";
import { getCharacter } from "@/lib/characters";

export const metadata: Metadata = { title: "Chats" };

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  const viewer = await requireAdult(`/app/chats${start ? `?start=${start}` : ""}`);
  const character = start ? await getCharacter(start, viewerIsAdult(viewer)) : null;

  return (
    <ComingSoon
      title="Chats open next"
      body="Streaming replies, memory and history arrive in the next update."
    >
      {character && (
        <div className="border-border bg-surface mt-6 flex w-full items-center gap-3 rounded-xl border p-3 text-left">
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
            <CharacterAvatar id={character.id} name={character.name} sizes="48px" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{character.name} is waiting</span>
            <span className="text-muted block truncate text-xs">{character.firstMessage}</span>
          </span>
        </div>
      )}
    </ComingSoon>
  );
}
