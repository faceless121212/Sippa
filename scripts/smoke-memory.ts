/**
 * Live check of long-term memory with the real models (a few cents). Reproduces the
 * reviewer's scenario: cat + job + "presentation tomorrow", a different name than the
 * profile, a brand-new chat, and questions about things the character can't know.
 *
 *   npm run memory:smoke
 */
import Anthropic from "@anthropic-ai/sdk";
import { characterById } from "../src/data/characters";
import { extractFacts } from "../src/lib/chat/memory";
import { buildMessages, buildSystem } from "../src/lib/chat/prompt";
import { CHAT_MODEL } from "../src/lib/llm";

const character = characterById("ren-kaito")!;
const sheet = {
  name: character.name,
  age: character.age ?? null,
  category: character.category,
  famousType: null,
  hook: character.hook,
  description: character.description,
  traits: character.traits,
  speakingStyle: character.speakingStyle,
  backstory: character.backstory,
  firstMessage: character.firstMessage,
  exampleDialogues: character.exampleDialogues,
};
const today = "2026-10-14";
const tomorrow = "2026-10-15";
let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `\n    ${detail}` : ""}`);
  if (!ok) failures++;
};

async function reply(memories: string[], userName: string | null, turns: { role: "user" | "assistant"; content: string }[]) {
  const system = buildSystem(sheet, { userName, memories, summary: "", notes: {} });
  const res = await new Anthropic().messages.create({
    model: CHAT_MODEL,
    max_tokens: 300,
    system,
    messages: buildMessages([{ role: "assistant", content: character.firstMessage }, ...turns]),
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function main() {
  // 1. Facts are picked up automatically, with "tomorrow" turned into a date.
  const said =
    "Ugh, long day. My cat Mochi knocked my coffee all over the desk this morning. I'm a product designer at a fintech startup and I have a big presentation tomorrow, so I'm nervous.";
  const facts = await extractFacts({
    characterName: character.name,
    userText: said,
    knownFacts: [],
    knownName: null,
    today,
  });
  const all = (facts?.facts ?? []).join(" | ");
  check("picks up the cat's name", /mochi/i.test(all), all);
  check("picks up the job", /product designer/i.test(all));
  check(`dates the presentation (${tomorrow})`, all.includes(tomorrow));

  // 2. The name given in chat wins over the profile name.
  const named = await extractFacts({
    characterName: character.name,
    userText: "By the way, my name's Kate — please call me that.",
    knownFacts: facts?.facts ?? [],
    knownName: null,
    today,
  });
  check('learns the preferred name ("Kate")', named?.preferredName === "Kate", `got: ${named?.preferredName}`);
  check("doesn't invent facts from small talk", (named?.facts ?? []).length <= 1, (named?.facts ?? []).join(" | "));

  // 3. Nothing remembered → the character must not fake it.
  const blank = await reply([], "May", [{ role: "user", content: "Do you remember my cat's name?" }]);
  check(
    "with no memory, doesn't invent a cat's name or a shared past",
    // A false claim of remembering ("of course I remember", "you've mentioned her so many times")…
    !/mochi|so many times|of course i remember|i remember (her|him|your cat)|you('ve| have) (told me|mentioned) (about )?(her|him|your cat) (before|so|many|a lot)/i.test(
      blank,
    ) &&
      // …while saying it doesn't know and asking.
      /(don'?t|do not|haven'?t|not sure|first i'?m hearing|remind|tell me|what'?s the name)/i.test(blank),
    blank.replace(/\s+/g, " ").slice(0, 220),
  );

  // 4. A brand-new chat with saved memories remembers.
  const fresh = await reply([...(facts?.facts ?? [])], "Kate", [
    { role: "user", content: "Hey, it's me again. Anything you remember about what's coming up for me?" },
  ]);
  check("a new chat remembers the presentation", /presentation|pitch/i.test(fresh), fresh.replace(/\s+/g, " ").slice(0, 220));
  check('uses the chosen name, not the profile name "May"', !/\bMay\b/.test(fresh));

  // 5. Told in this conversation → must not say "you haven't told me".
  const sameChat = await reply([], null, [
    { role: "user", content: "My cat is called Mochi, she's a little tabby." },
    { role: "assistant", content: "Mochi sounds adorable — a tabby menace?" },
    { role: "user", content: "Haha yes. So what's my cat's name again?" },
  ]);
  check(
    "uses what was said earlier in the same chat",
    /mochi/i.test(sameChat) && !/haven'?t told me/i.test(sameChat),
    sameChat.replace(/\s+/g, " ").slice(0, 220),
  );

  console.log(failures ? `\n${failures} check(s) failed.` : "\nAll memory checks passed.");
  if (failures) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
