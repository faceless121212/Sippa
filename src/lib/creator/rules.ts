import { findLivingPerson, nameIsLivingPerson } from "@/lib/safety/blocklist";
import type { Draft } from "./schema";

/**
 * Hard creator rules (spec §6). Run on the generated draft, on every save,
 * and before any avatar is generated. Returns human-readable problems.
 */
const MINOR_WORDS =
  /\b(child|children|kid|kids|minor|underage|preteen|teen|teens|teenager|teenage|schoolgirl|schoolboy|high[-\s]?school|middle[-\s]?school|elementary|classmate|classmates|school uniform|loli|shota|little girl|little boy|young girl|young boy|daddy'?s girl)\b/i;

export const MIN_LOVER_AGE = 21;
export const HISTORICAL_MIN_YEARS_DEAD = 70;

export function checkDraft(d: Draft, now = new Date()): string[] {
  const problems: string[] = [];
  const text = [
    d.name,
    d.hook,
    d.description,
    d.backstory,
    d.firstMessage,
    d.speakingStyle,
    d.visualPrompt,
    ...d.tags,
    ...d.exampleDialogues.flatMap((x) => [x.user, x.character]),
  ].join(" \n ");

  if (MINOR_WORDS.test(text))
    problems.push("Characters can't be, look like, or be described as minors or school-age.");
  if (d.age !== null && d.age < 18) problems.push("Every character must be an adult (18+).");

  if (d.category === "lover") {
    if (d.age === null || d.age < MIN_LOVER_AGE)
      problems.push(`Lover characters must be adults aged ${MIN_LOVER_AGE} or older.`);
  }

  const person = nameIsLivingPerson(d.name) ?? findLivingPerson(text);
  if (person) problems.push(`Characters can't impersonate real living people (${person}).`);

  if (d.category === "famous") {
    if (d.famousType === "historical") {
      const died = d.historicalDiedYear;
      if (died === null || now.getFullYear() - died < HISTORICAL_MIN_YEARS_DEAD) {
        problems.push(`Historical figures must have died at least ${HISTORICAL_MIN_YEARS_DEAD} years ago.`);
      }
    }
    if (d.dials.flirtiness > 0)
      problems.push("Famous characters can't be flirty — no romance with real people.");
  }
  if (d.category === "friend" && d.dials.flirtiness > 0)
    problems.push("Friend characters aren't flirty. Pick Lover for romance.");

  return problems;
}
