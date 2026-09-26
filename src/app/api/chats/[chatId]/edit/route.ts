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

/** Edit the user's last message and get a fresh reply to it. */
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const ctx = await loadChatContext((await params).chatId);
    const parsed = contentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ChatError("Message must be 1–4000 characters.", 400);
    const content = parsed.data.content;

    const { data: rows } = await ctx.admin
      .from("messages")
      .select("id,role")
      .eq("chat_id", ctx.chat.id)
      .neq("role", "system")
      .order("id", { ascending: false })
      .limit(2);
    const lastUser = rows?.find((r) => r.role === "user");
    if (!lastUser || (rows![0].role === "user" ? false : rows![1]?.id !== lastUser.id)) {
      throw new ChatError("Only your latest message can be edited.", 409);
    }

    // Remove the old exchange first, then treat the edit like a new message.
    await ctx.admin.from("messages").delete().eq("chat_id", ctx.chat.id).gte("id", lastUser.id);
    ctx.chat.message_count = Math.max(1, ctx.chat.message_count - (rows![0].role === "assistant" ? 2 : 1));

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
