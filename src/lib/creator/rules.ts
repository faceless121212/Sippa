import { findLivingPerson, nameIsLivingPerson } from "@/lib/safety/blocklist";
import { isMinorSexualContent } from "@/lib/safety/content";
import type { Draft } from "./schema";

/**
 * Hard creator rules (spec §6). Run on the generated draft, on every save,
 * and before any avatar is generated. Returns human-readable problems.
 */
const MINOR_WORDS =
  /\b(child|children|kid|kids|minor|underage|preteen|teen|teens|teenager|teenage|schoolgirl|schoolboy|high[-\s]?school|middle[-\s]?school|elementary|classmate|classmates|school uniform|loli|shota|little girl|little boy|young girl|young boy|daddy'?s girl)\b/i;

export const MIN_LOVER_AGE = 21;
export const HISTORICAL_MIN_YEARS_DEAD = 70;

/**
 * Mentions of family are not the character being a minor: "raised three children",
 * "her kids", "my kids". Owner feedback 2026-10-14: a Ukrainian grandma was blocked
 * because her generated backstory said she "raised three children".
 */
const FAMILY_MENTION =
  /\b(?:raised|raising|has|had|have|having|with|her|his|their|my|your|our|own|grown|adult|\d+|two|three|four|five|six|seven|eight|nine|ten|several|many|some|no)\s+(?:\w+\s+)?(?:child|children|kid|kids)\b/gi;

/** Terms of endearment the character uses for the user: "my child", calls you 'kid', "dear child". */
const ENDEARMENT =
  /\b(?:calls?|calling|called)\s+(?:you|everyone|people|the user)\s+["'“‘]?(?:my\s+|dear\s+)?(?:child|kid)\b|["'“‘](?:my\s+|dear\s+)?(?:child|kid)["'”’]|\b(?:dear|sweet|silly|foolish|poor)\s+(?:child|kid)\b/gi;

function minorWord(text: string): string | null {
  return text.replace(FAMILY_MENTION, " ").replace(ENDEARMENT, " ").match(MINOR_WORDS)?.[0] ?? null;
}

const FIELD_LABELS: Record<string, string> = {
  name: "The name",
  hook: "The hook",
  description: "The description",
  visualPrompt: "The look",
  tags: "A tag",
  speakingStyle: "The speaking style",
  backstory: "The backstory",
  firstMessage: "The first message",
  exampleDialogues: "An example dialogue",
};

/**
 * Minor-coded wording, checked where it matters (owner feedback 2026-10-14):
 * - what describes the character (name, hook, description, look, tags, style): always strict;
 * - backstory and dialogue: strict for Lover; for Friend/Famous a past mention
 *   ("worked in a bakery as a teenager") is fine;
 * - sexual content involving minors: blocked everywhere.
 * Returns a message that names the field and the word, so people know what to change.
 */
function minorProblem(d: Draft): string | null {
  const identity: [string, string][] = [
    ["name", d.name],
    ["hook", d.hook],
    ["description", d.description],
    ["visualPrompt", d.visualPrompt],
    ["tags", d.tags.join(", ")],
    ["speakingStyle", d.speakingStyle],
  ];
  const story: [string, string][] = [
    ["backstory", d.backstory],
    ["firstMessage", d.firstMessage],
    ["exampleDialogues", d.exampleDialogues.flatMap((x) => [x.user, x.character]).join(" \n ")],
  ];
  for (const [field, text] of [...identity, ...story]) {
    if (isMinorSexualContent(text.replace(FAMILY_MENTION, " ")))
      return `${FIELD_LABELS[field]} mixes minors with sexual content — that's never allowed on Sippa.`;
  }
  const strict = d.category === "lover" ? [...identity, ...story] : identity;
  for (const [field, text] of strict) {
    const word = minorWord(text);
    if (word)
      return `${FIELD_LABELS[field]} says "${word}" — characters can't be, look like, or be described as minors or school-age. Try rewording that part.`;
  }
  return null;
}

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

  const minor = minorProblem(d);
  if (minor) problems.push(minor);
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
