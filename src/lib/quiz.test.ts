import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isQuestion, quizImages, quizSceneIds, quizzes, VIBES, type QuizStep } from "@/config/quizzes";
import { segmentIds, segments } from "@/config/segments";
import { seedCharacters } from "@/data/characters";
import openers from "@/data/quiz-openers.json";
import { answerLeanings, defaultVibe, matchFromAnswers, type QuizAnswers } from "./quiz";
import { parseQuizStart, welcomePath } from "./quiz-start";
import { isMinorSexualContent } from "./safety/content";

const byId = (id: string) => seedCharacters.find((c) => c.id === id)!;

/** Answers every step: option chosen by `pick` (wrapping), statements with `v`, a name. */
function answerAll(steps: QuizStep[], pick: (step: QuizStep, n: number) => number, v = 5): QuizAnswers {
  const out: QuizAnswers = {};
  for (const s of steps) {
    if (s.kind === "single" || s.kind === "multi")
      out[s.id] = [s.options[pick(s, s.options.length) % s.options.length].id];
    else if (s.kind === "statement") out[s.id] = v;
    else if (s.kind === "slider") out[s.id] = (v - 1) * 25; // 1→0 … 5→100
    else if (s.kind === "name") out[s.id] = "Kate";
  }
  return out;
}

describe("quiz content", () => {
  it.each(segmentIds)("%s has exactly 20 questions, unique ids and sections in order", (id) => {
    const q = quizzes[id];
    expect(q.steps.filter(isQuestion)).toHaveLength(20);
    expect(new Set(q.steps.map((s) => s.id)).size).toBe(q.steps.length);
    const sections = q.steps.map((s) => s.section);
    expect(sections.every((s) => s >= 0 && s < q.sections.length)).toBe(true);
    // The progress bar never goes backwards.
    expect(sections).toEqual([...sections].sort((a, b) => a - b));
  });

  it("every answer and statement leans towards something that exists in the catalogue", () => {
    for (const id of segmentIds) {
      const pool = seedCharacters.filter((c) => c.category === segments[id].category);
      const tags = new Set(pool.flatMap((c) => c.tags.map((t) => t.toLowerCase())));
      const traits = new Set(pool.flatMap((c) => c.traits.map((t) => t.toLowerCase())));
      const ids = new Set(pool.map((c) => c.id));
      for (const s of quizzes[id].steps) {
        const leans =
          s.kind === "statement"
            ? [{ id: s.id, ...s.leans }]
            : s.kind === "slider"
              ? [
                  { id: `${s.id}-left`, ...s.left.leans },
                  { id: `${s.id}-right`, ...s.right.leans },
                ]
            : s.kind === "single" || s.kind === "multi"
              ? s.options
              : [];
        for (const l of leans) {
          if (["any", "either"].includes(l.id)) continue; // "Surprise me" / "Either is great"
          const hits =
            (l.tags ?? []).filter((t) => tags.has(t.toLowerCase())).length +
            (l.traits ?? []).filter((t) => traits.has(t.toLowerCase())).length +
            (l.characters ?? []).filter((c) => ids.has(c)).length +
            (l.gender || l.famousType || l.ages ? 1 : 0);
          expect(hits, `${id}/${s.id}/${l.id}`).toBeGreaterThan(0);
          (l.characters ?? []).forEach((c) => expect(ids.has(c), c).toBe(true));
        }
      }
    }
  });

  it("every quiz image has been generated", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const missing = quizImages().filter((k) => !existsSync(path.join(root, "public/quiz", `${k}.jpg`)));
    expect(missing).toEqual([]);
  });
});

describe("quiz matching", () => {
  it("many answer paths in every segment end with 3 matches from the right category", () => {
    for (const id of segmentIds) {
      for (let seed = 0; seed < 40; seed++) {
        const answers = answerAll(quizzes[id].steps, (s, n) => (seed * 7 + s.id.length) % n, (seed % 5) + 1);
        const m = matchFromAnswers(id, answers);
        expect(m, `${id} seed ${seed}`).toHaveLength(3);
        expect(m.every((c) => c.category === segments[id].category)).toBe(true);
      }
    }
  });

  it("'A woman' / 'A man' only matches that gender", () => {
    const base = answerAll(quizzes.love.steps, () => 0);
    const woman = matchFromAnswers("love", { ...base, who: ["woman"] });
    expect(woman.every((m) => byId(m.id).gender === "female")).toBe(true);
    const man = matchFromAnswers("love", { ...base, who: ["man"] });
    expect(man.every((m) => byId(m.id).gender === "male")).toBe(true);
  });

  it("'Real historical figures' never returns an inspired-by legend, and vice versa", () => {
    const base = answerAll(quizzes.history.steps, () => 0);
    const real = matchFromAnswers("history", { ...base, kind: ["real"] });
    expect(real.every((m) => byId(m.id).famousType === "historical")).toBe(true);
    const legends = matchFromAnswers("history", { ...base, kind: ["legends"] });
    expect(legends.every((m) => byId(m.id).famousType === "inspired")).toBe(true);
  });

  it("answers steer the result (study + motivation → a study/motivator friend)", () => {
    const base = answerAll(quizzes.friends.steps, () => 0, 3);
    const [top] = matchFromAnswers("friends", {
      ...base,
      need: ["push"],
      topics: ["study", "work"],
      hangout: ["study"],
      accountable: 5,
      goal: ["exam"],
    });
    expect(byId(top.id).tags.some((t) => ["Study Buddy", "Motivator"].includes(t))).toBe(true);
  });

  it("picking an era points at people from that era", () => {
    const base = answerAll(quizzes.history.steps, () => 0, 3);
    const [top] = matchFromAnswers("history", { ...base, eras: ["ancient"], kind: ["real"] });
    expect(["cleopatra", "marcus-aurelius"]).toContain(top.id);
  });

  it("statements only count when you agree, and 'Totally me' counts double", () => {
    const steps = quizzes.love.steps;
    expect(answerLeanings(steps, { laugh: 3 })).toHaveLength(0);
    expect(answerLeanings(steps, { laugh: 4 })).toHaveLength(1);
    expect(answerLeanings(steps, { laugh: 5 })).toHaveLength(2);
  });

  it("explains the match with shared tags or traits", () => {
    const [top] = matchFromAnswers("love", answerAll(quizzes.love.steps, () => 1));
    expect(top.reasons.length).toBeGreaterThan(0);
  });

  it("Lover matches are always adults aged 21+", () => {
    for (let seed = 0; seed < 40; seed++)
      for (const m of matchFromAnswers("love", answerAll(quizzes.love.steps, (s, n) => (seed + s.id.length) % n)))
        expect(m.age ?? 0).toBeGreaterThanOrEqual(21);
  });
});

describe("info screens", () => {
  it("every info screen plays a short chat that ends with a highlight", () => {
    for (const id of segmentIds)
      for (const s of quizzes[id].steps)
        if (s.kind === "info") {
          expect(s.demo.length, s.id).toBeGreaterThanOrEqual(3);
          expect(s.demo.some((l) => l.kind === "you") && s.demo.some((l) => l.kind === "them")).toBe(true);
          expect(s.demo.some((l) => l.kind === "badge"), s.id).toBe(true);
        }
  });
});

describe("second-round funnel screens", () => {
  it.each(segmentIds)("%s: a guide line per section, a scene question, a doubt with an answer for every option", (id) => {
    const q = quizzes[id];
    expect(q.host).toHaveLength(q.sections.length);
    expect(quizSceneIds(id)).toHaveLength(4);
    const doubt = q.steps.find((s) => s.id === "doubt");
    const answer = q.steps.find((s) => s.kind === "reassure");
    expect(doubt?.kind).toBe("single");
    expect(answer?.kind === "reassure" && answer.step).toBe("doubt");
    if (doubt?.kind === "single" && answer?.kind === "reassure")
      for (const o of doubt.options) expect(answer.variants[o.id], o.id).toBeTruthy();
    // The recap comes after the doubt and answer, and there's something to show.
    const recap = q.steps.findIndex((s) => s.kind === "recap");
    expect(recap).toBeGreaterThan(q.steps.indexOf(answer!));
    expect(q.steps.some((s) => s.kind === "slider")).toBe(true);
    expect(q.steps.some((s) => s.kind === "compare")).toBe(true);
    expect(q.steps.some((s) => (s.kind === "single" ? s.options.some((o) => o.reaction) : false))).toBe(true);
  });

  it("sliders lean only past a third of the way, and twice near the ends", () => {
    const steps = quizzes.love.steps;
    expect(answerLeanings(steps, { pace: 50 })).toHaveLength(0);
    expect(answerLeanings(steps, { pace: 30 })).toHaveLength(1);
    expect(answerLeanings(steps, { pace: 30 })[0].label).toBe("Slow burn");
    expect(answerLeanings(steps, { pace: 95 })).toHaveLength(2);
    expect(answerLeanings(steps, { pace: 95 })[0].label).toBe("Instant spark");
  });

  it("the default vibe follows the answer that sets one", () => {
    expect(defaultVibe("love", {})).toBe("sweet");
    expect(defaultVibe("love", { voice: ["bold"] })).toBe("bold");
    expect(defaultVibe("history", { personality: ["witty"] })).toBe("witty");
  });

  it("every character has a first message for every scene and vibe, and they're safe", () => {
    const all = openers as Record<string, Record<string, Record<string, string>>>;
    for (const id of segmentIds)
      for (const c of seedCharacters.filter((c) => c.category === segments[id].category))
        for (const scene of quizSceneIds(id))
          for (const v of VIBES) {
            const text = all[c.id]?.[scene]?.[v];
            expect(text, `${c.id}/${scene}/${v}`).toBeTruthy();
            expect(text.length).toBeLessThanOrEqual(400);
            expect(isMinorSexualContent(text), `${c.id}/${scene}/${v}`).toBe(false);
          }
  });
});

describe("quiz → app hand-off", () => {
  it("only accepts known shapes (ids, a known vibe, a short reply)", () => {
    const ok = encodeURIComponent(JSON.stringify({ c: "mara-vellin", s: "rooftop", v: "bold", r: "Hey you 😊" }));
    expect(parseQuizStart(ok)).toEqual({ c: "mara-vellin", s: "rooftop", v: "bold", r: "Hey you 😊" });
    const bad = (o: object) => parseQuizStart(encodeURIComponent(JSON.stringify(o)));
    expect(bad({ c: "../etc" })).toBeNull();
    expect(bad({ c: "mara-vellin", v: "spicy" })).toBeNull();
    expect(bad({ c: "mara-vellin", r: "x".repeat(301) })).toBeNull();
    expect(parseQuizStart("%%%not json")).toBeNull();
    expect(parseQuizStart(undefined)).toBeNull();
  });

  it("the welcome link carries ids only — never the reply", () => {
    expect(welcomePath("mara-vellin", "rooftop", "bold")).toBe("/app/welcome?c=mara-vellin&s=rooftop&v=bold");
    expect(welcomePath("mara-vellin")).toBe("/app/welcome?c=mara-vellin");
  });
});
