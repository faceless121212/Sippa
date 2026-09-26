import { pricing } from "@/config/site";
import { errorResponse, limitResponse } from "@/lib/chat/route-helpers";
import { ChatError, consumeAllowance, loadChatContext, streamReply } from "@/lib/chat/service";

export const maxDuration = 60;

/** Replace the last reply with a new one. */
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const ctx = await loadChatContext((await params).chatId);
    const { data: last } = await ctx.admin
      .from("messages")
      .select("id,role,content")
      .eq("chat_id", ctx.chat.id)
      .neq("role", "system")
      .order("id", { ascending: false })
      .limit(2);
    const [reply, prompt] = last ?? [];
    if (!reply || reply.role !== "assistant" || !prompt || prompt.role !== "user") {
      throw new ChatError("There's no reply to regenerate yet.", 409);
    }

    const remaining = await consumeAllowance(ctx);
    if (remaining === "limit") return limitResponse(pricing.freeMessagesPerDay);

    await ctx.admin.from("messages").delete().eq("id", reply.id);
    ctx.chat.message_count -= 1;
    return streamReply(ctx, { lastUserText: prompt.content, remaining, signal: request.signal });
  } catch (e) {
    return errorResponse(e);
  }
}
