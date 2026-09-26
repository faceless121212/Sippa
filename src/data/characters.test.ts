import { describe, expect, it } from "vitest";
import manifest from "./avatar-manifest.json";
import { avatarLooks } from "./avatar-looks";
import { seedCharacters } from "./characters";

const THIS_YEAR = new Date().getFullYear();

describe("seed characters (spec §6 rules)", () => {
  it("has 8 Lover, 8 Friend and 8 Famous with unique ids", () => {
    for (const cat of ["lover", "friend", "famous"]) {
      expect(
        seedCharacters.filter((c) => c.category === cat),
        cat,
      ).toHaveLength(8);
    }
    expect(new Set(seedCharacters.map((c) => c.id)).size).toBe(seedCharacters.length);
  });

  it("every Lover character is a stated adult aged 21+", () => {
    for (const c of seedCharacters.filter((c) => c.category === "lover")) {
      expect(c.age, c.id).toBeGreaterThanOrEqual(21);
    }
  });

  it("every stated age is 18+", () => {
    for (const c of seedCharacters.filter((c) => c.age !== undefined))
      expect(c.age, c.id).toBeGreaterThanOrEqual(18);
  });

  it("every Famous character is historical and died 70+ years ago", () => {
    for (const c of seedCharacters.filter((c) => c.category === "famous")) {
      expect(c.famousType, c.id).toBe("historical");
      expect(c.diedYear, c.id).toBeDefined();
      expect(THIS_YEAR - c.diedYear!, c.id).toBeGreaterThanOrEqual(70);
    }
  });

  it("no minor-coded wording anywhere in a character sheet", () => {
    const minor = /\b(child|kid|teen|teenager|minor|underage|schoolgirl|schoolboy|high school|classmate)\b/i;
    for (const c of seedCharacters) {
      const text = [c.hook, c.description, c.backstory, c.firstMessage, ...c.tags].join(" ");
      expect(minor.test(text), c.id).toBe(false);
    }
  });

  it("has a complete sheet, a look and a generated portrait", () => {
    for (const c of seedCharacters) {
      expect(c.hook.length, c.id).toBeLessThanOrEqual(90);
      expect(c.traits.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.exampleDialogues.length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.firstMessage.length, c.id).toBeGreaterThan(0);
      expect(avatarLooks[c.id], c.id).toBeDefined();
      expect(manifest, c.id).toContain(c.id);
    }
  });
});
