import { quizzes, type QuizOption, type QuizStep } from "@/config/quizzes";
import { segments, type SegmentId } from "@/config/segments";
import { seedCharacters, type Character } from "@/data/characters";

export type QuizMatch = Pick<
  Character,
  "id" | "name" | "age" | "category" | "hook" | "firstMessage" | "tags"
> & {
  score: number;
  /** Shared tags/traits that led to the match, strongest first (for "Why you two click"). */
  reasons: string[];
};

/** What the visitor answered: option ids for choices, 1–5 for statements, text for the name. */
export type QuizAnswers = Record<string, string[] | number | string>;

const norm = (s: string) => s.toLowerCase();

/**
 * Turns answers into weighted leanings. Choices count once; a statement counts once
 * when you mostly agree (4) and twice when it's "totally you" (5).
 */
export function answerLeanings(steps: QuizStep[], answers: QuizAnswers): QuizOption[] {
  const out: QuizOption[] = [];
  for (const step of steps) {
    const a = answers[step.id];
    if (a === undefined) continue;
    if ((step.kind === "single" || step.kind === "multi") && Array.isArray(a)) {
      out.push(...step.options.filter((o) => a.includes(o.id)));
    } else if (step.kind === "statement" && typeof a === "number" && a >= 4) {
      const lean = { id: step.id, label: step.statement, ...step.leans };
      out.push(...(a === 5 ? [lean, lean] : [lean]));
    }
  }
  return out;
}

/**
 * Picks the best characters for a segment from the quiz answers. Hard filters first
 * (who you want to meet, real vs legend), then a score: shared tags ×2, traits ×1,
 * a named character (e.g. from an era) ×3, and +1 for an age in the preferred range.
 * If the filters leave nobody, they're relaxed rather than showing an empty result.
 */
export function matchCharacters(
  segmentId: SegmentId,
  answers: QuizOption[],
  pool = seedCharacters,
  limit = 3,
): QuizMatch[] {
  const seg = segments[segmentId];
  const inCategory = pool.filter((c) => c.category === seg.category);
  const gender = answers.findLast((a) => a.gender)?.gender;
  const famousType = answers.findLast((a) => a.famousType)?.famousType;
  const filtered = inCategory.filter(
    (c) => (!gender || c.gender === gender) && (!famousType || c.famousType === famousType),
  );
  const candidates = filtered.length ? filtered : inCategory;

  const wantTags = answers.flatMap((a) => a.tags ?? []).map(norm);
  const wantTraits = answers.flatMap((a) => a.traits ?? []).map(norm);
  const wantIds = answers.flatMap((a) => a.characters ?? []);
  const ageRanges = answers.flatMap((a) => (a.ages ? [a.ages] : []));

  return candidates
    .map((c) => {
      const tags = c.tags.map(norm);
      const traits = c.traits.map(norm);
      const hits = new Map<string, number>();
      const hit = (label: string, w: number) => hits.set(label, (hits.get(label) ?? 0) + w);
      wantTags.forEach((t) => {
        const i = tags.indexOf(t);
        if (i >= 0) hit(c.tags[i], 2);
      });
      wantTraits.forEach((t) => {
        const i = traits.indexOf(t);
        if (i >= 0) hit(c.traits[i], 1);
      });
      const idScore = wantIds.filter((id) => id === c.id).length * 3;
      const ageScore = c.age ? ageRanges.filter(([lo, hi]) => c.age! >= lo && c.age! <= hi).length : 0;
      const score = [...hits.values()].reduce((s, w) => s + w, 0) + idScore + ageScore;
      const reasons = [...hits.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
      return { c, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.c.badges?.includes("pick")) - Number(a.c.badges?.includes("pick")) ||
        a.c.name.localeCompare(b.c.name),
    )
    .slice(0, limit)
    .map(({ c, score, reasons }) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      category: c.category,
      hook: c.hook,
      firstMessage: c.firstMessage,
      tags: c.tags,
      score,
      reasons,
    }));
}

/** Matches straight from a segment's quiz answers. */
export function matchFromAnswers(segmentId: SegmentId, answers: QuizAnswers, limit = 3) {
  return matchCharacters(segmentId, answerLeanings(quizzes[segmentId].steps, answers), undefined, limit);
}
