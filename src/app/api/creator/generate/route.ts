import { NextResponse } from "next/server";
import { z } from "zod";
import { CreatorRefusal, generateCharacter } from "@/lib/creator/ai";
import { checkDraft } from "@/lib/creator/rules";
import { fromGenerated, quizToDescription } from "@/lib/creator/schema";
import {
  assertCanCreate,
  creatorError,
  CreatorError,
  limits,
  rateLimit,
  requireCreator,
} from "@/lib/creator/server";
import { isMinorSexualContent } from "@/lib/safety/content";

export const maxDuration = 60;

const body = z.object({
  category: z.enum(["lover", "friend", "famous"]),
  text: z.string().trim().max(400).optional(),
  answers: z.record(z.string(), z.array(z.string().max(40)).max(8)).optional(),
  famousType: z.enum(["historical", "inspired"]).optional(),
});

/** Step 3: idea (text or quiz) → full character draft, checked against the rules. */
export async function POST(request: Request) {
  try {
    const creator = await requireCreator();
    assertCanCreate(creator);
    rateLimit(limits.generate, creator.userId);

    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CreatorError("Invalid request.", 400);
    const { category, text, answers, famousType } = parsed.data;
    let idea = (text && text.length > 0 ? text : answers ? quizToDescription(category, answers) : "").trim();
    if (idea.length < 3) {
      throw new CreatorError(
        text === undefined ? "Answer at least one question." : "Describe your character in a few words.",
        400,
      );
    }
    if (isMinorSexualContent(idea))
      throw new CreatorError("Sippa never allows content involving minors.", 422);
    if (category === "famous" && famousType === "historical") {
      idea += "\n(Make this a real historical figure who died at least 70 years ago.)";
    } else if (category === "famous" && famousType === "inspired") {
      idea += "\n(Make this an original 'inspired-by' archetype with a fictional name, not a real person.)";
    }

    const draft = fromGenerated(await generateCharacter(category, idea), category);
    const problems = checkDraft(draft);
    if (problems.length) throw new CreatorError(problems[0], 422, { problems });
    return NextResponse.json({ draft });
  } catch (e) {
    if (e instanceof CreatorRefusal) return NextResponse.json({ error: e.message }, { status: 422 });
    return creatorError(e);
  }
}
