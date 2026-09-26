"use server";

import { z } from "zod";
import { requireAdult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** ❤️ a moment (RLS: own likes only; a trigger keeps the count). */
export async function toggleMomentLike(momentId: string, liked: boolean): Promise<boolean> {
  if (!z.string().uuid().safeParse(momentId).success) return liked;
  const viewer = await requireAdult("/app/moments");
  const supabase = await createClient();
  if (liked) {
    await supabase.from("moment_likes").delete().eq("moment_id", momentId).eq("user_id", viewer.user.id);
    return false;
  }
  await supabase.from("moment_likes").insert({ moment_id: momentId, user_id: viewer.user.id });
  return true;
}
