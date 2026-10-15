/**
 * Pre-writes the first message for every quiz character × scene × vibe, so the quiz
 * result (which has no server on GitHub Pages) and the real chat start with exactly the
 * same line. Saves src/data/quiz-openers.json.
 *
 *   npm run quiz:openers              # characters that don't have openers yet
 *   npm run quiz:openers -- --force   # rewrite all
 *   npm run quiz:openers -- mara-vellin hugo-lindqvist
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { quizzes, VIBES, type Vibe } from "../src/config/quizzes";
import { segmentIds, segments } from "../src/config/segments";
import { seedCharacters } from "../src/data/characters";
import { characterSheet, SAFETY_RULES } from "../src/lib/chat/prompt";
import { CHAT_MODEL } from "../src/lib/llm";
import { isMinorSexualContent } from "../src/lib/safety/content";
import { hasSpokenWords } from "../src/lib/nudges";

type Openers = Record<string, Record<string, Record<Vibe, string>>>;

const file = path.resolve(import.meta.dirname, "../src/data/quiz-openers.json");

const VIBE_HOW: Record<string, Record<Vibe, string>> = {
  love: {
    sweet: "warm, gentle and sweet",
    bold: "confident and flirtatious, but tasteful and respectful (nothing explicit)",
    witty: "witty and playfully teasing",
  },
  friends: {
    sweet: "soft, kind and reassuring",
    bold: "lively, upbeat and full of energy",
    witty: "funny and a bit silly",
  },
  history: {
    sweet: "gentle and encouraging, like a kind teacher",
    bold: "grand and dramatic, true to their era",
    witty: "witty and dryly humorous",
  },
};

const schema = z.object({
  openers: z.array(
    z.object({
      scene: z.string(),
      sweet: z.string(),
      bold: z.string(),
      witty: z.string(),
    }),
  ),
});

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  const out: Openers = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const client = new Anthropic();

  const jobs = segmentIds.flatMap((segment) => {
    const scenes = quizzes[segment].steps.find((s) => s.id === "scene");
    if (!scenes || scenes.kind !== "single") return [];
    return seedCharacters
      .filter((c) => c.category === segments[segment].category)
      .filter((c) => (only.length ? only.includes(c.id) : force || !out[c.id]))
      .map((c) => ({ segment, c, scenes: scenes.options }));
  });
  if (!jobs.length) return console.log("Nothing to write. Use --force to rewrite.");

  let failures = 0;
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(
      jobs.slice(i, i + 6).map(async ({ segment, c, scenes }) => {
        try {
          const how = VIBE_HOW[segment];
          const res = await client.messages.parse({
            model: CHAT_MODEL,
            max_tokens: 2500,
            output_config: { format: zodOutputFormat(schema) },
            system: [
              { type: "text", text: SAFETY_RULES },
              {
                type: "text",
                text: characterSheet({
                  name: c.name,
                  age: c.age ?? null,
                  category: c.category,
                  famousType: c.famousType ?? null,
                  hook: c.hook,
                  description: c.description,
                  traits: c.traits,
                  speakingStyle: c.speakingStyle,
                  backstory: c.backstory,
                  firstMessage: c.firstMessage,
                  exampleDialogues: c.exampleDialogues,
                }),
              },
              {
                type: "text",
                text: `You are writing the very first message ${c.name} sends to a new user who just met you, opening a roleplay scene. For EACH scene below, write three versions:
- sweet: ${how.sweet}
- bold: ${how.bold}
- witty: ${how.witty}
Each version: 1–3 short sentences, under 260 characters. Start with a brief *action in asterisks* that sets the scene, then say something that invites a reply. Stay fully in character and in your own voice. Don't use the user's name, don't describe the user's body or feelings, and keep it suitable for a first hello.

Scenes (use these exact ids):
${scenes.map((s) => `- ${s.id}: ${s.scene}`).join("\n")}`,
              },
            ],
            messages: [{ role: "user", content: "(Write the openers.)" }],
          });
          const parsed = res.parsed_output;
          if (!parsed) throw new Error(`no output (${res.stop_reason})`);
          const byScene: Record<string, Record<Vibe, string>> = {};
          for (const s of scenes) {
            const o = parsed.openers.find((x) => x.scene === s.id);
            if (!o) throw new Error(`missing scene ${s.id}`);
            for (const v of VIBES) {
              const text = o[v].trim();
              if (!hasSpokenWords(text) || text.length > 400 || isMinorSexualContent(text))
                throw new Error(`bad ${s.id}/${v}: ${text.slice(0, 80)}`);
            }
            byScene[s.id] = { sweet: o.sweet.trim(), bold: o.bold.trim(), witty: o.witty.trim() };
          }
          out[c.id] = byScene;
          console.log(`✓ ${c.id}`);
        } catch (e) {
          failures++;
          console.log(`✗ ${c.id}: ${(e as Error).message}`);
        }
      }),
    );
    writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  }
  console.log(failures ? `${failures} failed — run again to retry.` : `Saved openers for ${jobs.length} characters.`);
  if (failures) process.exitCode = 1;
}

main();
