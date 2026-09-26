import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChatListItem = {
  id: string;
  characterId: string;
  characterName: string;
  avatarUrl: string | null;
  preview: string;
  updatedAt: string;
};

/** The signed-in user's chats, newest first (RLS: own chats only). */
export async function listChats(): Promise<ChatListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select("id,character_id,last_message_preview,updated_at,characters(name,avatar_url)")
    .order("updated_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => ({
    id: c.id,
    characterId: c.character_id,
    characterName: (c.characters as unknown as { name: string } | null)?.name ?? "Character",
    avatarUrl: (c.characters as unknown as { avatar_url: string | null } | null)?.avatar_url ?? null,
    preview: c.last_message_preview,
    updatedAt: c.updated_at,
  }));
}
