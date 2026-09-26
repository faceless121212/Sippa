import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { characterSheet, SAFETY_RULES, type PromptCharacter } from "@/lib/chat/prompt";
import { aiLive, FAST_MODEL } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";

/** Server-enforced minimum gap between popups (client waits 3–4 min). */
export const NUDGE_MIN_GAP_MS = 170_000;
export const NUDGES_PER_DAY = 40;

const NUDGE_RULES = `Write ONE short message (max 25 words) that you, the character, send to the user out of the blue to start a conversation — like a text from a friend.
- Stay fully in character and in your voice. You may add a brief action in *asterisks*, but the message MUST include at least one spoken sentence or question addressed to the user.
- Keep it light and inviting: share a small moment, a question, a thought about them or your day.
- Never guilt-trip, never say you're lonely or hurt they left, never pressure them to reply or stay.
- Nothing sexual. Output only the message text.`;

type Row = {
  id: string;
  name: string;
  age: number | null;
  category: PromptCharacter["category"];
  famous_type: string | null;
  hook: string;
  description: string;
  personality: { traits?: string[] } | null;
  speaking_style: string;
  backstory: string;
  first_message: string;
  example_dialogues: PromptCharacter["exampleDialogues"] | null;
  avatar_url: string | null;
};

export async function writeNudge(c: Row, userName: string | null): Promise<string> {
  if (!aiLive()) return c.first_message.slice(0, 300);
  const sheet = characterSheet({
    name: c.name,
    age: c.age,
    category: c.category,
    famousType: c.famous_type,
    hook: c.hook,
    description: c.description,
    traits: c.personality?.traits ?? [],
    speakingStyle: c.speaking_style,
    backstory: c.backstory,
    firstMessage: c.first_message,
    exampleDialogues: c.example_dialogues ?? [],
  });
  const client = new Anthropic();
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SAFETY_RULES },
    { type: "text", text: sheet },
    {
      type: "text",
      text: `${NUDGE_RULES}${userName ? `\nThe user likes to be called ${userName.slice(0, 40)}.` : ""}`,
    },
  ];
  const ask = [
    "Write the text message you send me right now. It must contain words you say to me — not only an action.",
    "Your last draft had no spoken words. Write one or two sentences you actually say to me, e.g. a question or a small update.",
  ];
  try {
    for (const prompt of ask) {
      const res = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 200,
        system,
        messages: [{ role: "user", content: prompt }],
      });
      if (res.stop_reason === "refusal") break;
      const text = res.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      if (hasSpokenWords(text)) return text.slice(0, 300);
    }
  } catch (e) {
    console.error("nudge:", e);
  }
  return c.first_message.slice(0, 300);
}

export const NUDGE_COLUMNS =
  "id,name,age,category,famous_type,hook,description,personality,speaking_style,backstory,first_message,example_dialogues,avatar_url,status,visibility,creator_id";

export type Admin = ReturnType<typeof createAdminClient>;

/** True when the message says something, not just *an action*. */
export function hasSpokenWords(text: string): boolean {
  return text.replace(/\*[^*]*\*/g, "").replace(/[\s"“”'.,!?…-]/g, "").length >= 8;
}
