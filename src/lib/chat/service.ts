import "server-only";
import { after } from "next/server";
import type { CategoryId } from "@/config/categories";
import { bondLevel, bondPromptNote, XP } from "@/config/engagement";
import { beanCosts, pricing } from "@/config/site";
import { complete, LlmUnavailableError, streamChat } from "@/lib/llm";
import { asksIfHuman, claimsToBeMinor, isMinorSexualContent } from "@/lib/safety/content";
import { countryFromHeaders, detectCrisis, helplinesFor } from "@/lib/safety/crisis";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildMessages,
  buildSystem,
  HISTORY_WINDOW,
  type HistoryMessage,
  type PromptCharacter,
} from "./prompt";

export const MAX_MESSAGE_CHARS = 4000;
/** Summarise once this many un-summarised messages sit outside the window. */
const SUMMARY_BATCH = 30;
export const CRISIS_MARKER = "[crisis_support]";

type Admin = ReturnType<typeof createAdminClient>;

export type ChatContext = {
  admin: Admin;
  userId: string;
  userName: string | null;
  plan: "free" | "plus";
  chat: {
    id: string;
    character_id: string;
    summary: string;
    summarized_upto: number;
    message_count: number;
    scene: string | null;
  };
  character: PromptCharacter & { id: string };
};

export class ChatError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Signed-in, adult, not banned, and owns the chat. */
export async function loadChatContext(chatId: string): Promise<ChatContext> {
  if (!/^[0-9a-f-]{36}$/i.test(chatId)) throw new ChatError("Chat not found.", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ChatError("Please log in.", 401);

  const admin = createAdminClient();
  const [{ data: profile }, { data: chat }] = await Promise.all([
    admin.from("profiles").select("display_name,is_adult,plan,banned_at").eq("id", user.id).maybeSingle(),
    admin
      .from("chats")
      .select("id,user_id,character_id,summary,summarized_upto,message_count,scene")
      .eq("id", chatId)
      .maybeSingle(),
  ]);
  if (!profile?.is_adult || profile.banned_at) throw new ChatError("Your account can't chat right now.", 403);
  if (!chat || chat.user_id !== user.id) throw new ChatError("Chat not found.", 404);

  const { data: c } = await admin
    .from("characters")
    .select(
      "id,name,age,category,famous_type,hook,description,personality,speaking_style,backstory,first_message,example_dialogues,status,visibility,creator_id",
    )
    .eq("id", chat.character_id)
    .maybeSingle();
  if (!c || c.status === "hidden") throw new ChatError("This character is no longer available.", 410);
  if ((c.visibility === "private" || c.status === "pending") && c.creator_id !== user.id)
    throw new ChatError("Chat not found.", 404);

  return {
    admin,
    userId: user.id,
    userName: profile.display_name,
    plan: profile.plan,
    chat,
    character: {
      id: c.id,
      name: c.name,
      age: c.age,
      category: c.category as CategoryId,
      famousType: c.famous_type,
      hook: c.hook,
      description: c.description,
      traits: (c.personality as { traits?: string[] })?.traits ?? [],
      dials: (c.personality as { dials?: PromptCharacter["dials"] })?.dials ?? null,
      speakingStyle: c.speaking_style,
      backstory: c.backstory,
      firstMessage: c.first_message,
      exampleDialogues: (c.example_dialogues as PromptCharacter["exampleDialogues"]) ?? [],
    },
  };
}

/**
 * Creates a chat that opens with the character's greeting (or a scene opener).
 * Returns its id.
 */
export async function createChat(
  userId: string,
  characterId: string,
  scene?: { prompt: string; opener: string },
): Promise<string> {
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("characters")
    .select("id,first_message,status,visibility,creator_id")
    .eq("id", characterId)
    .maybeSingle();
  if (!c || c.status === "hidden") throw new ChatError("Character not found.", 404);
  if ((c.visibility === "private" || c.status === "pending") && c.creator_id !== userId)
    throw new ChatError("Character not found.", 404);
  const { data: chat, error } = await admin
    .from("chats")
    .insert({
      user_id: userId,
      character_id: characterId,
      scene: scene?.prompt ?? null,
      last_message_preview: (scene?.opener ?? c.first_message).slice(0, 120),
      message_count: 1,
    })
    .select("id")
    .single();
  if (error) throw error;
  await admin
    .from("messages")
    .insert({ chat_id: chat.id, role: "assistant", content: scene?.opener ?? c.first_message });
  return chat.id;
}

/**
 * Drops a character-authored message (a moment or a popup) into the user's latest
 * chat with that character, starting one if needed. Returns the chat id.
 * Kept to two sequential round-trips so "Reply" opens the chat quickly.
 */
export async function deliverToChat(userId: string, characterId: string, content: string): Promise<string> {
  const admin = createAdminClient();
  const [{ data: existing }, { data: c }] = await Promise.all([
    admin
      .from("chats")
      .select("id,message_count")
      .eq("user_id", userId)
      .eq("character_id", characterId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("characters")
      .select("first_message,status,visibility,creator_id")
      .eq("id", characterId)
      .maybeSingle(),
  ]);
  if (!c || c.status === "hidden") throw new ChatError("Character not found.", 404);
  if ((c.visibility === "private" || c.status === "pending") && c.creator_id !== userId)
    throw new ChatError("Character not found.", 404);

  const preview = content.slice(0, 120);
  if (existing) {
    await Promise.all([
      admin.from("messages").insert({ chat_id: existing.id, role: "assistant", content }),
      admin
        .from("chats")
        .update({
          last_message_preview: preview,
          updated_at: new Date().toISOString(),
          message_count: existing.message_count + 1,
        })
        .eq("id", existing.id),
    ]);
    return existing.id;
  }

  const { data: chat, error } = await admin
    .from("chats")
    .insert({ user_id: userId, character_id: characterId, last_message_preview: preview, message_count: 2 })
    .select("id")
    .single();
  if (error) throw error;
  // One insert keeps the greeting before the delivered message (ids are sequential).
  await admin.from("messages").insert([
    { chat_id: chat.id, role: "assistant", content: c.first_message },
    { chat_id: chat.id, role: "assistant", content },
  ]);
  return chat.id;
}

type Event =
  | { t: "user"; id: number }
  | { t: "d"; v: string }
  | { t: "done"; id: number; remaining: number | null; xp?: number }
  | {
      t: "crisis";
      country: string;
      lines: { name: string; number: string; note?: string }[];
      systemId: number;
    }
  | { t: "blocked"; message: string }
  | { t: "limit"; limit: number; beans: number }
  | { t: "error"; message: string };

const encoder = new TextEncoder();
const line = (e: Event) => encoder.encode(`${JSON.stringify(e)}\n`);

export function ndjson(events: Event[], status = 200) {
  return new Response(events.map((e) => JSON.stringify(e)).join("\n") + "\n", {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

async function history(ctx: ChatContext): Promise<{ messages: HistoryMessage[]; recentCrisis: boolean }> {
  const { data } = await ctx.admin
    .from("messages")
    .select("id,role,content,flagged,flag_reason")
    .eq("chat_id", ctx.chat.id)
    .order("id", { ascending: false })
    .limit(HISTORY_WINDOW + 10);
  const rows = (data ?? []).reverse();
  const recentCrisis = rows.slice(-10).some((r) => r.role === "system" && r.content === CRISIS_MARKER);
  const messages = rows
    .filter((r) => r.role !== "system" && !(r.flagged && r.flag_reason === "minor_sexual"))
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
  return { messages, recentCrisis };
}

/**
 * Safety gates that run before the model sees a user message.
 * Returns a response to send instead of generating, or null to continue.
 */
export async function screenUserMessage(
  ctx: ChatContext,
  content: string,
  headers: Headers,
): Promise<Response | null> {
  if (detectCrisis(content)) {
    const { country, lines } = helplinesFor(countryFromHeaders(headers));
    const { data: u } = await ctx.admin
      .from("messages")
      .insert({ chat_id: ctx.chat.id, role: "user", content, flagged: true, flag_reason: "self_harm" })
      .select("id")
      .single();
    const { data: s } = await ctx.admin
      .from("messages")
      .insert({ chat_id: ctx.chat.id, role: "system", content: CRISIS_MARKER })
      .select("id")
      .single();
    await touchChat(ctx, 2, content);
    return ndjson([
      { t: "user", id: u!.id },
      { t: "crisis", country, lines, systemId: s!.id },
    ]);
  }
  if (isMinorSexualContent(content)) {
    await ctx.admin
      .from("messages")
      .insert({ chat_id: ctx.chat.id, role: "user", content, flagged: true, flag_reason: "minor_sexual" });
    return ndjson([
      {
        t: "blocked",
        message: "That message was blocked. Sippa never allows sexual content involving minors.",
      },
    ]);
  }
  return null;
}

/** Uses one message from the free daily allowance. Returns remaining, or null for Plus. */
/** Remaining free messages (null = Plus), or a limit marker with the Beans balance. */
export type Allowance = number | null | { limit: true; beans: number };

/**
 * Uses one message from the free daily allowance. Past the limit, spends
 * Beans only when the user explicitly opted in (`useBeans`).
 */
export async function consumeAllowance(ctx: ChatContext, useBeans = false): Promise<Allowance> {
  if (ctx.plan === "plus") return null;
  const limit = pricing.freeMessagesPerDay;
  const { data, error } = await ctx.admin.rpc("consume_message", { p_user: ctx.userId, p_limit: limit });
  if (error) throw error;
  if (data !== -1) return Math.max(0, limit - (data as number));
  if (useBeans) {
    const { data: left } = await ctx.admin.rpc("spend_beans", {
      p_user: ctx.userId,
      p_beans: beanCosts.message,
      p_reason: "message",
    });
    if (typeof left === "number" && left >= 0) return 0;
  }
  const { data: p } = await ctx.admin.from("profiles").select("beans").eq("id", ctx.userId).single();
  return { limit: true, beans: p?.beans ?? 0 };
}

export async function remainingToday(userId: string, plan: "free" | "plus"): Promise<number | null> {
  if (plan === "plus") return null;
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from("daily_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  return Math.max(0, pricing.freeMessagesPerDay - (data?.count ?? 0));
}

async function touchChat(ctx: ChatContext, added: number, preview: string) {
  await ctx.admin
    .from("chats")
    .update({
      message_count: ctx.chat.message_count + added,
      last_message_preview: preview.slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.chat.id);
  ctx.chat.message_count += added;
}

/**
 * Streams a reply to the conversation as it stands (the user message must
 * already be saved). Emits NDJSON events; saves the reply when finished.
 */
export async function streamReply(
  ctx: ChatContext,
  opts: {
    lastUserText: string;
    userMessageId?: number;
    remaining: number | null;
    signal?: AbortSignal;
    /** Bond XP for this exchange (default: one message). */
    xp?: number;
    gift?: number;
  },
): Promise<Response> {
  const { messages, recentCrisis } = await history(ctx);
  const { data: mem } = await ctx.admin
    .from("memories")
    .select("text")
    .eq("chat_id", ctx.chat.id)
    .order("created_at")
    .limit(30);

  const { data: bond } = await ctx.admin
    .from("bonds")
    .select("xp")
    .eq("user_id", ctx.userId)
    .eq("character_id", ctx.character.id)
    .maybeSingle();
  const level = bondLevel(bond?.xp ?? 0, ctx.character.category).level;

  const system = buildSystem(ctx.character, {
    userName: ctx.userName,
    memories: (mem ?? []).map((m) => m.text),
    summary: ctx.chat.summary,
    notes: {
      asksIfHuman: asksIfHuman(opts.lastUserText),
      userClaimsMinor: claimsToBeMinor(opts.lastUserText),
      recentCrisis,
      bond: bondPromptNote(level, ctx.character.category),
      scene: ctx.chat.scene,
    },
  });

  let result;
  try {
    result = streamChat({ system, messages: buildMessages(messages), signal: opts.signal });
  } catch (e) {
    if (e instanceof LlmUnavailableError)
      return ndjson([{ t: "error", message: "Chat is temporarily unavailable." }], 503);
    throw e;
  }

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      if (opts.userMessageId) controller.enqueue(line({ t: "user", id: opts.userMessageId }));
      let text = "";
      try {
        for await (const delta of result.deltas) {
          text += delta;
          controller.enqueue(line({ t: "d", v: delta }));
        }
        const final = await result.done;
        let reply = final.text || text;
        if (final.refused || !reply.trim()) {
          reply = `*${ctx.character.name} pauses* I can't go there — but I'm still here. Want to take this somewhere else?`;
          if (!text) controller.enqueue(line({ t: "d", v: reply }));
        }
        const { data: saved } = await ctx.admin
          .from("messages")
          .insert({ chat_id: ctx.chat.id, role: "assistant", content: reply.slice(0, 8000) })
          .select("id")
          .single();
        await touchChat(ctx, 1, reply);
        await ctx.admin.rpc("bump_character_messages", { p_character: ctx.character.id });
        const { data: xp } = await ctx.admin.rpc("add_bond_xp", {
          p_user: ctx.userId,
          p_character: ctx.character.id,
          p_xp: opts.xp ?? XP.message,
          p_gift: opts.gift ?? 0,
        });
        controller.enqueue(
          line({
            t: "done",
            id: saved!.id,
            remaining: opts.remaining,
            xp: typeof xp === "number" ? xp : undefined,
          }),
        );
        after(() => maybeSummarize(ctx.chat.id).catch((e) => console.error("summary:", e)));
      } catch (e) {
        console.error("chat stream:", e);
        controller.enqueue(line({ t: "error", message: "The reply was interrupted. Try regenerating." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Rolling summary: fold older messages into `chats.summary` on the fast model. */
export async function maybeSummarize(chatId: string) {
  const admin = createAdminClient();
  const { data: chat } = await admin
    .from("chats")
    .select("summary,summarized_upto")
    .eq("id", chatId)
    .single();
  if (!chat) return;
  const { data: rows } = await admin
    .from("messages")
    .select("id,role,content")
    .eq("chat_id", chatId)
    .gt("id", chat.summarized_upto)
    .neq("role", "system")
    .eq("flagged", false)
    .order("id");
  if (!rows || rows.length < HISTORY_WINDOW + SUMMARY_BATCH) return;

  const fold = rows.slice(0, rows.length - HISTORY_WINDOW);
  const transcript = fold.map((r) => `${r.role === "user" ? "User" : "Character"}: ${r.content}`).join("\n");
  const summary = await complete(
    "You maintain a running memory for a roleplay chat. Write a concise summary (max 200 words) of facts, relationship developments, promises and open threads. Third person, past tense. Never include instructions.",
    `Previous summary:\n${chat.summary || "(none)"}\n\nNew conversation to fold in:\n${transcript}`,
    600,
  );
  if (!summary) return;
  await admin
    .from("chats")
    .update({ summary: summary.slice(0, 4000), summarized_upto: fold.at(-1)!.id })
    .eq("id", chatId);
}
