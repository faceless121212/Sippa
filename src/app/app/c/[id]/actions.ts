"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
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

const idSchema = /^[a-z0-9-]{2,64}$/;

async function ownCharacter(id: string) {
  if (!idSchema.test(id)) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("characters")
    .select("id,creator_id,status,avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (!c || c.creator_id !== user.id) return null;
  return { c, admin, userId: user.id };
}

/** Owner changes who can see their character. Public goes back through review. */
export async function changeVisibility(form: FormData) {
  const id = String(form.get("character_id") ?? "");
  const visibility = String(form.get("visibility") ?? "");
  if (!["private", "unlisted", "public"].includes(visibility)) return;
  const own = await ownCharacter(id);
  if (!own || own.c.status === "hidden") return;
  await own.admin
    .from("characters")
    .update({ visibility, status: visibility === "public" ? "pending" : "approved" })
    .eq("id", id);
  await audit(own.admin, own.userId, "character.visibility", "character", id, { visibility });
  revalidatePath(`/app/c/${id}`);
}

/** Owner deletes their character, its portrait, and every chat with it. */
export async function deleteMyCharacter(form: FormData) {
  const id = String(form.get("character_id") ?? "");
  if (form.get("confirm") !== "yes") return;
  const own = await ownCharacter(id);
  if (!own) return;
  const prefix = `/storage/v1/object/public/avatars/`;
  const path = own.c.avatar_url?.includes(prefix) ? own.c.avatar_url.split(prefix)[1] : null;
  if (path) await own.admin.storage.from("avatars").remove([decodeURIComponent(path)]);
  await own.admin.from("characters").delete().eq("id", id);
  await audit(own.admin, own.userId, "character.delete", "character", id);
  revalidatePath("/app/profile");
  redirect("/app/profile");
}
