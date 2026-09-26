"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdult } from "@/lib/auth";
import { createChat } from "@/lib/chat/service";
import { createClient } from "@/lib/supabase/server";

const characterId = z.string().regex(/^[a-z0-9-]{2,64}$/);

/** "Start chat" on a character page: reopen the latest chat with them, or create one. */
export async function startChat(form: FormData) {
  const id = characterId.parse(form.get("character_id"));
  const viewer = await requireAdult(`/app/c/${id}`);
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .eq("character_id", id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const chatId = existing?.id ?? (await createChat(viewer.user.id, id));
  redirect(`/app/chats/${chatId}`);
}

/** "New chat": always a fresh conversation with the same character. */
export async function newChat(form: FormData) {
  const id = characterId.parse(form.get("character_id"));
  const viewer = await requireAdult(`/app/c/${id}`);
  const chatId = await createChat(viewer.user.id, id);
  revalidatePath("/app/chats");
  redirect(`/app/chats/${chatId}`);
}

export async function deleteChat(form: FormData) {
  const chatId = z.string().uuid().parse(form.get("chat_id"));
  await requireAdult("/app/chats");
  const supabase = await createClient();
  await supabase.from("chats").delete().eq("id", chatId); // RLS: own chats only
  revalidatePath("/app/chats");
  redirect("/app/chats");
}

export type MemoryRow = { id: string; text: string };

export async function addMemory(chatId: string, text: string): Promise<MemoryRow | { error: string }> {
  const parsed = z
    .object({ chatId: z.string().uuid(), text: z.string().trim().min(1).max(300) })
    .safeParse({ chatId, text });
  if (!parsed.success) return { error: "Memories are 1–300 characters." };
  await requireAdult(`/app/chats/${chatId}`);
  const supabase = await createClient();
  const { count } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId);
  if ((count ?? 0) >= 30) return { error: "Up to 30 memories per chat." };
  const { data, error } = await supabase
    .from("memories")
    .insert({ chat_id: parsed.data.chatId, text: parsed.data.text })
    .select("id,text")
    .single();
  if (error) return { error: "Couldn't save that memory." };
  return data;
}

export async function deleteMemory(memoryId: string): Promise<{ ok: boolean }> {
  if (!z.string().uuid().safeParse(memoryId).success) return { ok: false };
  await requireAdult("/app/chats");
  const supabase = await createClient();
  const { error } = await supabase.from("memories").delete().eq("id", memoryId);
  return { ok: !error };
}
