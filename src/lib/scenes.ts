import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Scene } from "@/config/engagement";
import { characterSheet, SAFETY_RULES, type PromptCharacter } from "@/lib/chat/prompt";
import { aiLive, FAST_MODEL } from "@/lib/llm";
import { hasSpokenWords } from "@/lib/nudges";

/** The character's first line inside a chosen scene (fast model; falls back to their greeting). */
export async function writeSceneOpener(c: PromptCharacter, scene: Scene): Promise<string> {
  const fallback = `*${scene.emoji} ${scene.title}* ${c.firstMessage}`.slice(0, 500);
  if (!aiLive()) return fallback;
  try {
    const res = await new Anthropic().messages.create({
      model: FAST_MODEL,
      max_tokens: 300,
      system: [
        { type: "text", text: SAFETY_RULES },
        { type: "text", text: characterSheet(c) },
        {
          type: "text",
          text: `Open a new roleplay scene with the user. Scene: ${scene.prompt}\nWrite your opening message (1–3 sentences): set the scene with a short *action*, then say something to the user that invites a reply. Stay in character. Output only the message.`,
        },
      ],
      messages: [{ role: "user", content: "(Start the scene.)" }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return res.stop_reason !== "refusal" && hasSpokenWords(text) ? text.slice(0, 600) : fallback;
  } catch (e) {
    console.error("scene opener:", e);
    return fallback;
  }
}
