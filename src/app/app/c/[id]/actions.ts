"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Adds or removes a favourite for the signed-in user (RLS: own rows only). */
export async function toggleFavorite(form: FormData) {
  const id = String(form.get("character_id") ?? "");
  if (!/^[a-z0-9-]{2,64}$/.test(id)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/app/c/${id}`)}`);

  if (form.get("favorited") === "1") {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("character_id", id);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, character_id: id });
  }
  revalidatePath(`/app/c/${id}`);
}
