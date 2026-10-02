import { describe, expect, it } from "vitest";
import { avatarLooks } from "@/data/avatar-looks";
import { seedCharacters } from "@/data/characters";
import { demoCharacters } from "@/data/landing";
import { buildAvatarPrompt, UnsafeAvatarPromptError } from "./avatar-prompt";

describe("buildAvatarPrompt", () => {
  it("every character has a look and a safe prompt stating adulthood", () => {
    for (const c of [...seedCharacters, ...demoCharacters]) {
      const look = avatarLooks[c.id];
      expect(look, c.id).toBeDefined();
      const prompt = buildAvatarPrompt({ name: c.name, age: c.age, category: c.category, look });
      expect(prompt).toMatch(/adult/);
      if (look.style === "photo") {
        // Photo-realistic portraits must always be of an invented person.
        expect(prompt, c.id).toMatch(/fictional/);
        expect(prompt, c.id).toMatch(/not a real or famous individual/);
        expect(prompt, c.id).toMatch(/fully clothed/);
      } else {
        expect(prompt, c.id).toMatch(/Not a photograph/);
      }
    }
  });

  it("blocks minor-coded wording", () => {
    expect(() =>
      buildAvatarPrompt({
        name: "X",
        age: 25,
        category: "friend",
        look: { subject: "woman", look: "wearing a school uniform" },
      }),
    ).toThrow(UnsafeAvatarPromptError);
  });

  it("blocks Lover characters under 21 or without a stated age", () => {
    const look = { subject: "man" as const, look: "dark hair" };
    expect(() => buildAvatarPrompt({ name: "X", age: 19, category: "lover", look })).toThrow(
      UnsafeAvatarPromptError,
    );
    expect(() => buildAvatarPrompt({ name: "X", category: "lover", look })).toThrow(UnsafeAvatarPromptError);
    expect(() => buildAvatarPrompt({ name: "X", age: 17, category: "friend", look })).toThrow(
      UnsafeAvatarPromptError,
    );
  });
});
