import { NextResponse } from "next/server";
import { z } from "zod";
import { moderateDraft } from "@/lib/creator/ai";
import { checkDraft } from "@/lib/creator/rules";
import { draftSchema } from "@/lib/creator/schema";
import { assertCanCreate, creatorError, CreatorError, requireCreator } from "@/lib/creator/server";

export const maxDuration = 60;

const body = z.object({
  draft: draftSchema,
  avatarUrl: z.string().url(),
  // Public publishing opens with the moderation queue (DECISIONS #13).
  visibility: z.enum(["private", "unlisted"]),
});

/** Only accept portraits we generated (fal.ai CDN) — never arbitrary URLs. */
function isFalUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (u.hostname === "fal.media" || u.hostname.endsWith(".fal.media"));
  } catch {
    return false;
  }
}

function slug(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "character"}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Step 6: rules + moderation review, store the portrait, create the character. */
export async function POST(request: Request) {
  try {
    const creator = await requireCreator();
    assertCanCreate(creator);
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CreatorError("Please check the fields and try again.", 400);
    const { draft, avatarUrl, visibility } = parsed.data;
    if (!isFalUrl(avatarUrl)) throw new CreatorError("Pick one of the generated portraits.", 400);

    const problems = checkDraft(draft);
    if (problems.length) throw new CreatorError(problems[0], 422, { problems });
    const review = await moderateDraft(draft);
    if (!review.allowed) {
      throw new CreatorError(`This character didn't pass our safety review: ${review.explanation}`, 422, {
        issues: review.issues,
      });
    }

    const img = await fetch(avatarUrl);
    if (!img.ok) throw new CreatorError("The portrait expired — generate new ones.", 410);
    const type = img.headers.get("content-type") ?? "image/jpeg";
    if (!/^image\/(jpeg|png|webp)$/.test(type)) throw new CreatorError("Unsupported image.", 400);
    const bytes = Buffer.from(await img.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) throw new CreatorError("Image too large.", 400);

    const id = slug(draft.name);
    const path = `${creator.userId}/${id}.${type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"}`;
    const { error: upErr } = await creator.admin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: type });
    if (upErr) throw upErr;
    const { data: pub } = creator.admin.storage.from("avatars").getPublicUrl(path);

    const { error } = await creator.admin.from("characters").insert({
      id,
      creator_id: creator.userId,
      name: draft.name,
      category: draft.category,
      famous_type: draft.category === "famous" ? draft.famousType : null,
      gender: draft.gender,
      age: draft.age,
      hook: draft.hook,
      description: draft.description,
      personality: { traits: draft.traits, dials: draft.dials },
      speaking_style: draft.speakingStyle,
      backstory: draft.backstory,
      first_message: draft.firstMessage,
      example_dialogues: draft.exampleDialogues,
      tags: draft.tags,
      avatar_url: pub.publicUrl,
      visibility,
      status: "approved",
    });
    if (error) {
      await creator.admin.storage.from("avatars").remove([path]);
      throw error;
    }
    await creator.admin
      .from("profiles")
      .update({ free_creations_used: creator.creationsUsed + 1 })
      .eq("id", creator.userId);

    return NextResponse.json({ id });
  } catch (e) {
    return creatorError(e);
  }
}
