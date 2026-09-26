"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdult } from "@/lib/auth";
import { stripe, stripeConfigured } from "@/lib/billing/stripe";
import { audit } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the account (GDPR Art. 17). Owner decision: delete
 * everything — created characters (and everyone's chats with them), their
 * portraits, chats, messages, memories, favourites and the ledger.
 */
export async function deleteAccount(form: FormData) {
  const viewer = await requireAdult("/app/profile");
  if (
    String(form.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "DELETE"
  )
    redirect("/app/profile?delete=confirm");
  const userId = viewer.user.id;
  const admin = createAdminClient();

  const { data: p } = await admin.from("profiles").select("subscription_id").eq("id", userId).single();
  if (p?.subscription_id && stripeConfigured()) {
    await stripe()
      .subscriptions.cancel(p.subscription_id)
      .catch((e) => console.error("cancel sub:", e));
  }

  // Portraits live under avatars/<userId>/…
  const { data: files } = await admin.storage.from("avatars").list(userId, { limit: 1000 });
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
  await admin.from("characters").delete().eq("creator_id", userId);

  await audit(admin, null, "account.delete", "user", userId);
  // Cascades: profile, chats → messages/memories, favourites, usage, transactions, reports' reporter set null.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
  await (await createClient()).auth.signOut();
  redirect("/account-deleted");
}

/** Turn "characters write to you" popups on/off. */
export async function setNudges(form: FormData) {
  await requireAdult("/app/profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // Column-level grant lets users change only this flag (and display_name) themselves.
  await supabase
    .from("profiles")
    .update({ nudges_enabled: form.get("on") === "1" })
    .eq("id", user.id);
  revalidatePath("/app", "layout");
}
