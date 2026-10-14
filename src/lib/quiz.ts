import { segments, type QuizOption, type SegmentId } from "@/config/segments";
import { seedCharacters, type Character } from "@/data/characters";

export type QuizMatch = Pick<
  Character,
  "id" | "name" | "age" | "category" | "hook" | "firstMessage" | "tags"
> & {
  score: number;
};

const norm = (s: string) => s.toLowerCase();

/**
 * Picks the best characters for a segment from the quiz answers (one option per
 * question). Hard filters first (who you want to meet, real vs legend), then a score
 * from shared tags (×2) and traits (×1). Always returns matches when the pool allows:
 * if the filters leave nobody, they're relaxed rather than showing an empty result.
 */
export function matchCharacters(
  segmentId: SegmentId,
  answers: QuizOption[],
  pool = seedCharacters,
  limit = 3,
): QuizMatch[] {
  const seg = segments[segmentId];
  const inCategory = pool.filter((c) => c.category === seg.category);
  const gender = answers.find((a) => a.gender)?.gender;
  const famousType = answers.find((a) => a.famousType)?.famousType;
  const filtered = inCategory.filter(
    (c) => (!gender || c.gender === gender) && (!famousType || c.famousType === famousType),
  );
  const candidates = filtered.length ? filtered : inCategory;

  const wantTags = answers.flatMap((a) => a.tags ?? []).map(norm);
  const wantTraits = answers.flatMap((a) => a.traits ?? []).map(norm);

  return candidates
    .map((c) => {
      const tags = c.tags.map(norm);
      const traits = c.traits.map(norm);
      const score =
        wantTags.filter((t) => tags.includes(t)).length * 2 +
        wantTraits.filter((t) => traits.includes(t)).length;
      return { c, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.c.badges?.includes("pick")) - Number(a.c.badges?.includes("pick")) ||
        a.c.name.localeCompare(b.c.name),
    )
    .slice(0, limit)
    .map(({ c, score }) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      category: c.category,
      hook: c.hook,
      firstMessage: c.firstMessage,
      tags: c.tags,
      score,
    }));
}
