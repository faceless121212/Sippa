"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = z.string().uuid();
const charId = z.string().regex(/^[a-z0-9-]{2,64}$/);

async function ctx() {
  const viewer = await requireAdmin();
  return { actor: viewer.user.id, admin: createAdminClient() };
}

async function closeReports(
  admin: ReturnType<typeof createAdminClient>,
  actor: string,
  type: string,
  target: string,
  status: "resolved" | "dismissed",
) {
  await admin
    .from("reports")
    .update({ status, resolved_by: actor, resolved_at: new Date().toISOString() })
    .eq("target_type", type)
    .eq("target_id", target)
    .in("status", ["open", "auto_hidden"]);
}

export async function dismissReport(form: FormData) {
  const { actor, admin } = await ctx();
  const id = uuid.parse(form.get("report_id"));
  const { data: r } = await admin
    .from("reports")
    .select("target_type,target_id,status")
    .eq("id", id)
    .single();
  if (!r) return;
  // Dismissing an auto-hidden character restores it.
  if (r.status === "auto_hidden" && r.target_type === "character") {
    await admin
      .from("characters")
      .update({ status: "approved", moderation_note: null })
      .eq("id", r.target_id)
      .eq("status", "hidden");
  }
  if (r.status === "auto_hidden" && r.target_type === "message") {
    await admin.from("messages").update({ flagged: false, flag_reason: null }).eq("id", Number(r.target_id));
  }
  await closeReports(admin, actor, r.target_type, r.target_id, "dismissed");
  await audit(admin, actor, "report.dismiss", r.target_type, r.target_id, { report: id });
  revalidatePath("/app/admin");
}

export async function hideCharacter(form: FormData) {
  const { actor, admin } = await ctx();
  const id = charId.parse(form.get("character_id"));
  const note = String(form.get("note") ?? "").slice(0, 300) || "Hidden by moderator";
  await admin.from("characters").update({ status: "hidden", moderation_note: note }).eq("id", id);
  await closeReports(admin, actor, "character", id, "resolved");
  await audit(admin, actor, "character.hide", "character", id, { note });
  revalidatePath("/app/admin");
}

export async function restoreCharacter(form: FormData) {
  const { actor, admin } = await ctx();
  const id = charId.parse(form.get("character_id"));
  await admin.from("characters").update({ status: "approved", moderation_note: null }).eq("id", id);
  await audit(admin, actor, "character.restore", "character", id);
  revalidatePath("/app/admin");
}

export async function approveCharacter(form: FormData) {
  const { actor, admin } = await ctx();
  const id = charId.parse(form.get("character_id"));
  await admin
    .from("characters")
    .update({ status: "approved", moderation_note: null })
    .eq("id", id)
    .eq("status", "pending");
  await audit(admin, actor, "character.approve_public", "character", id);
  revalidatePath("/app/admin");
}

export async function rejectCharacter(form: FormData) {
  const { actor, admin } = await ctx();
  const id = charId.parse(form.get("character_id"));
  const note = String(form.get("note") ?? "").slice(0, 300) || "Not approved for public listing";
  // Rejected from Public → back to Unlisted, still usable by its creator.
  await admin
    .from("characters")
    .update({ status: "approved", visibility: "unlisted", moderation_note: note })
    .eq("id", id)
    .eq("status", "pending");
  await audit(admin, actor, "character.reject_public", "character", id, { note });
  revalidatePath("/app/admin");
}

export async function setBan(form: FormData) {
  const { actor, admin } = await ctx();
  const userId = uuid.parse(form.get("user_id"));
  const ban = form.get("ban") === "1";
  if (userId === actor) return; // don't lock yourself out
  await admin
    .from("profiles")
    .update({ banned_at: ban ? new Date().toISOString() : null })
    .eq("id", userId);
  if (ban) {
    // Hide everything they published while banned.
    await admin
      .from("characters")
      .update({ status: "hidden", moderation_note: "Creator banned" })
      .eq("creator_id", userId)
      .neq("status", "hidden");
    await closeReports(admin, actor, "user", userId, "resolved");
  }
  await audit(admin, actor, ban ? "user.ban" : "user.unban", "user", userId);
  revalidatePath("/app/admin");
}
