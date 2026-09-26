import { z } from "zod";
import { pricing } from "@/config/site";
import { buildMessages, buildSystem } from "@/lib/chat/prompt";
import { checkDraft } from "@/lib/creator/rules";
import { draftSchema } from "@/lib/creator/schema";
import { creatorError, CreatorError, requireCreator } from "@/lib/creator/server";
import { streamChat } from "@/lib/llm";
import { asksIfHuman, claimsToBeMinor, isMinorSexualContent } from "@/lib/safety/content";
import { countryFromHeaders, detectCrisis, helplinesFor } from "@/lib/safety/crisis";

export const maxDuration = 60;

const body = z.object({
  draft: draftSchema,
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(12),
});

const enc = new TextEncoder();
const line = (o: object) => enc.encode(`${JSON.stringify(o)}\n`);

/** Step 5: test-chat with an unsaved draft. Nothing is stored; it uses the daily allowance. */
export async function POST(request: Request) {
  try {
    const creator = await requireCreator();
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CreatorError("Invalid request.", 400);
    const { draft, messages } = parsed.data;
    const last = messages.at(-1)!;
    if (last.role !== "user") throw new CreatorError("Invalid request.", 400);

    const problems = checkDraft(draft);
    if (problems.length) throw new CreatorError(problems[0], 422, { problems });

    const ndjson = (events: object[]) =>
      new Response(events.map((e) => JSON.stringify(e)).join("\n") + "\n", {
        headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
      });
    if (detectCrisis(last.content)) {
      const { country, lines } = helplinesFor(countryFromHeaders(request.headers));
      return ndjson([{ t: "crisis", country, lines }]);
    }
    if (isMinorSexualContent(last.content)) {
      return ndjson([
        {
          t: "blocked",
          message: "That message was blocked. Sippa never allows sexual content involving minors.",
        },
      ]);
    }

    if (creator.plan !== "plus") {
      const { data } = await creator.admin.rpc("consume_message", {
        p_user: creator.userId,
        p_limit: pricing.freeMessagesPerDay,
      });
      if (data === -1) return ndjson([{ t: "limit", limit: pricing.freeMessagesPerDay }]);
    }

    const system = buildSystem(
      { ...draft, famousType: draft.famousType },
      {
        memories: [],
        summary: "",
        notes: { asksIfHuman: asksIfHuman(last.content), userClaimsMinor: claimsToBeMinor(last.content) },
      },
    );
    const result = streamChat({
      system,
      messages: buildMessages([{ role: "assistant", content: draft.firstMessage }, ...messages]),
      maxTokens: 1024,
      signal: request.signal,
    });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const d of result.deltas) controller.enqueue(line({ t: "d", v: d }));
          const final = await result.done;
          if (final.refused)
            controller.enqueue(line({ t: "d", v: "*pauses* I can't go there — ask me something else?" }));
          controller.enqueue(line({ t: "done" }));
        } catch {
          controller.enqueue(line({ t: "error", message: "The reply was interrupted." }));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return creatorError(e);
  }
}
