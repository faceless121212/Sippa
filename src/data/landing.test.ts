import { describe, expect, it } from "vitest";
import { creatorExamples, hotThisWeek, pickCreatorExample, sampleCharacters } from "./landing";

describe("landing sample data safety", () => {
  const all = [...sampleCharacters, ...creatorExamples.map((e) => e.character)];

  it("every Lover character is a stated adult aged 21+", () => {
    for (const c of all.filter((c) => c.category === "lover")) {
      expect(c.age, c.name).toBeGreaterThanOrEqual(21);
    }
  });

  it("every Famous character is historical or an inspired-by archetype", () => {
    for (const c of all.filter((c) => c.category === "famous")) {
      expect(["historical", "inspired"]).toContain(c.famousType);
    }
  });

  it("has 4 samples per category and 6 hot characters", () => {
    for (const cat of ["lover", "friend", "famous"]) {
      expect(sampleCharacters.filter((c) => c.category === cat)).toHaveLength(4);
    }
    expect(hotThisWeek).toHaveLength(6);
    expect(hotThisWeek.every(Boolean)).toBe(true);
  });

  it("hooks fit in 90 characters", () => {
    for (const c of all) expect(c.hook.length, c.name).toBeLessThanOrEqual(90);
  });
});

describe("pickCreatorExample", () => {
  it("matches by keyword and falls back to the first example", () => {
    expect(pickCreatorExample("someone to date").character.category).toBe("lover");
    expect(pickCreatorExample("an ancient philosopher").character.category).toBe("famous");
    for (const ex of creatorExamples) {
      expect(pickCreatorExample(ex.prompt).character.id).toBe(ex.character.id);
    }
    expect(pickCreatorExample("zzz").character.id).toBe(creatorExamples[0].character.id);
  });
});
