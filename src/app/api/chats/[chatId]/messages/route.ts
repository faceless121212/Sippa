import { pricing } from "@/config/site";
import { contentSchema, errorResponse, limitResponse } from "@/lib/chat/route-helpers";
import {
  ChatError,
  consumeAllowance,
  loadChatContext,
  screenUserMessage,
  streamReply,
} from "@/lib/chat/service";

export const maxDuration = 60;

/** Send a message and stream the character's reply (NDJSON). */
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const ctx = await loadChatContext((await params).chatId);
    const parsed = contentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ChatError("Message must be 1–4000 characters.", 400);
    const content = parsed.data.content;

    const screened = await screenUserMessage(ctx, content, request.headers);
    if (screened) return screened;

    const remaining = await consumeAllowance(ctx, parsed.data.useBeans);
    if (remaining && typeof remaining === "object")
      return limitResponse(pricing.freeMessagesPerDay, remaining.beans);

    const { data: saved, error } = await ctx.admin
      .from("messages")
      .insert({ chat_id: ctx.chat.id, role: "user", content })
      .select("id")
      .single();
    if (error) throw error;
    ctx.chat.message_count += 1;

    return streamReply(ctx, {
      lastUserText: content,
      userMessageId: saved.id,
      remaining,
      signal: request.signal,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
