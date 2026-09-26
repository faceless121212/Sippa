import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAvatarPrompt, UnsafeAvatarPromptError } from "@/lib/avatar-prompt";
import { checkDraft } from "@/lib/creator/rules";
import { draftSchema } from "@/lib/creator/schema";
import { creatorError, CreatorError, limits, rateLimit, requireCreator } from "@/lib/creator/server";
import { generateImages } from "@/lib/images";

export const maxDuration = 60;

const SUBJECT = { female: "woman", male: "man", nonbinary: "person" } as const;

/** Four portrait options for the draft (step 4). */
export async function POST(request: Request) {
  try {
    const creator = await requireCreator();
    rateLimit(limits.avatars, creator.userId);
    const parsed = z.object({ draft: draftSchema }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CreatorError("Invalid request.", 400);
    const d = parsed.data.draft;

    const problems = checkDraft(d);
    if (problems.length) throw new CreatorError(problems[0], 422, { problems });

    const prompt = buildAvatarPrompt({
      name: d.name,
      age: d.age ?? undefined,
      category: d.category,
      look: {
        subject: SUBJECT[d.gender],
        look: d.visualPrompt,
        ...(d.famousType === "historical" ? { ageText: "adult" } : {}),
      },
    });
    const images = await generateImages({ prompt, count: 4 });
    return NextResponse.json({ urls: images.map((i) => i.url) });
  } catch (e) {
    if (e instanceof UnsafeAvatarPromptError)
      return NextResponse.json({ error: "That look isn't allowed." }, { status: 422 });
    return creatorError(e);
  }
}
