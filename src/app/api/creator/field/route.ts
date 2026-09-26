import { NextResponse } from "next/server";
import { z } from "zod";
import { CreatorRefusal, REGENERATABLE, regenerateField } from "@/lib/creator/ai";
import { draftSchema } from "@/lib/creator/schema";
import { creatorError, CreatorError, limits, rateLimit, requireCreator } from "@/lib/creator/server";

export const maxDuration = 60;

const body = z.object({ draft: draftSchema, field: z.enum(REGENERATABLE) });

/** "Regenerate this field" on the tune step. */
export async function POST(request: Request) {
  try {
    const creator = await requireCreator();
    rateLimit(limits.field, creator.userId);
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CreatorError("Invalid request.", 400);
    const value = await regenerateField(parsed.data.draft, parsed.data.field);
    return NextResponse.json({ value });
  } catch (e) {
    if (e instanceof CreatorRefusal) return NextResponse.json({ error: e.message }, { status: 422 });
    return creatorError(e);
  }
}
