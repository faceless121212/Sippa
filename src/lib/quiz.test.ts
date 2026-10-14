import { describe, expect, it } from "vitest";
import { segmentIds, segments } from "@/config/segments";
import { seedCharacters } from "@/data/characters";
import { matchCharacters } from "./quiz";

const byId = (id: string) => seedCharacters.find((c) => c.id === id)!;

/** Every combination of one answer per question (capped for speed). */
function* allAnswerPaths(segmentId: (typeof segmentIds)[number]) {
  const qs = segments[segmentId].questions;
  const idx = qs.map(() => 0);
  for (let n = 0; n < 2000; n++) {
    yield qs.map((q, i) => q.options[idx[i]]);
    let k = qs.length - 1;
    while (k >= 0 && ++idx[k] === qs[k].options.length) idx[k--] = 0;
    if (k < 0) return;
  }
}

describe("quiz matching", () => {
  it("every answer path in every segment ends with 3 matches from the right category", () => {
    for (const id of segmentIds) {
      for (const answers of allAnswerPaths(id)) {
        const m = matchCharacters(id, answers);
        expect(m, `${id}: ${answers.map((a) => a.label).join(" / ")}`).toHaveLength(3);
        expect(m.every((c) => c.category === segments[id].category)).toBe(true);
      }
    }
  });

  it("'A woman' / 'A man' only matches that gender", () => {
    const q = segments.love.questions;
    const woman = matchCharacters("love", [
      q[0].options[0],
      q[1].options[0],
      q[2].options[0],
      q[3].options[0],
      q[4].options[0],
    ]);
    expect(woman.every((m) => byId(m.id).gender === "female")).toBe(true);
    const man = matchCharacters("love", [
      q[0].options[1],
      q[1].options[0],
      q[2].options[0],
      q[3].options[0],
      q[4].options[0],
    ]);
    expect(man.every((m) => byId(m.id).gender === "male")).toBe(true);
  });

  it("'Real historical figures' never returns an inspired-by legend, and vice versa", () => {
    const q = segments.history.questions;
    const real = matchCharacters("history", [
      q[0].options[0],
      q[1].options[0],
      q[2].options[0],
      q[3].options[0],
      q[4].options[0],
    ]);
    expect(real.every((m) => byId(m.id).famousType === "historical")).toBe(true);
    const legends = matchCharacters("history", [
      q[0].options[0],
      q[1].options[0],
      q[2].options[1],
      q[3].options[0],
      q[4].options[0],
    ]);
    expect(legends.every((m) => byId(m.id).famousType === "inspired")).toBe(true);
  });

  it("answers steer the result (study + motivation → a study/motivator friend)", () => {
    const q = segments.friends.questions;
    const [top] = matchCharacters("friends", [
      q[0].options[1],
      q[1].options[0],
      q[2].options[2],
      q[3].options[2],
      q[4].options[1],
    ]);
    expect(byId(top.id).tags.some((t) => ["Study Buddy", "Motivator"].includes(t))).toBe(true);
  });

  it("Lover matches are always adults aged 21+", () => {
    for (const answers of allAnswerPaths("love"))
      for (const m of matchCharacters("love", answers)) expect(m.age ?? 0).toBeGreaterThanOrEqual(21);
  });
});
