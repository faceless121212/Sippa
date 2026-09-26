import { NextResponse } from "next/server";
import { z } from "zod";
import { GIFTS, XP } from "@/config/engagement";
import { errorResponse } from "@/lib/chat/route-helpers";
import { loadChatContext, streamReply } from "@/lib/chat/service";

export const maxDuration = 60;

const body = z.object({
  size: z.union(GIFTS.map((g) => z.literal(g.size)) as [z.ZodLiteral<5>, z.ZodLiteral<20>, z.ZodLiteral<50>]),
});

/** Gift Flowers to the character: spends Flowers, grows the bond, streams their reaction. */
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const ctx = await loadChatContext((await params).chatId);
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Pick a gift." }, { status: 400 });
    const gift = GIFTS.find((g) => g.size === parsed.data.size)!;

    const { data: left } = await ctx.admin.rpc("spend_beans", {
      p_user: ctx.userId,
      p_beans: gift.size,
      p_reason: `gift:${ctx.character.id}`,
    });
    if (typeof left !== "number" || left < 0) {
      return NextResponse.json({ error: "Not enough Flowers.", needFlowers: true }, { status: 402 });
    }

    const text = `${gift.emoji} *gives you ${gift.size === 5 ? "a single bloom" : gift.size === 20 ? "a bouquet of 20 flowers" : "a grand bouquet of 50 flowers"}*`;
    const { data: saved } = await ctx.admin
      .from("messages")
      .insert({ chat_id: ctx.chat.id, role: "user", content: text })
      .select("id")
      .single();
    ctx.chat.message_count += 1;
    // Gifts don't use the daily free-message allowance.
    return streamReply(ctx, {
      lastUserText: text,
      userMessageId: saved!.id,
      remaining: null,
      signal: request.signal,
      xp: gift.size * XP.perFlowerGifted,
      gift: gift.size,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
