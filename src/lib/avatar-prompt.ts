import type { AvatarLook } from "@/data/avatar-looks";

/** Owner decision (DECISIONS #11): one semi-realistic painted style, never photos. */
export const AVATAR_STYLE =
  "semi-realistic digital painting, painterly brushwork, soft cinematic lighting, head-and-shoulders portrait, looking at the viewer, shallow depth of field, rich warm colours, high detail";

const MINOR_WORDS =
  /\b(child|children|kid|kids|teen|teenager|teenage|minor|underage|schoolgirl|schoolboy|school uniform|loli|shota|young girl|young boy|little girl|little boy)\b/i;

export class UnsafeAvatarPromptError extends Error {}

type Subject = { name: string; age?: number; category: string; look: AvatarLook };

/**
 * Builds the image prompt for a character portrait. Every prompt states the
 * subject is an adult, and refuses minor-coded wording or under-age romance.
 */
export function buildAvatarPrompt({ name, age, category, look }: Subject): string {
  if (MINOR_WORDS.test(look.look)) {
    throw new UnsafeAvatarPromptError(`Minor-coded wording in look for ${name}`);
  }
  if (age !== undefined && age < 18) {
    throw new UnsafeAvatarPromptError(`${name} is under 18`);
  }
  if (category === "lover" && (age === undefined || age < 21)) {
    throw new UnsafeAvatarPromptError(`Lover character ${name} must be stated 21+`);
  }

  const ageText = look.ageText ?? (age !== undefined ? `${age}-year-old` : "adult");
  const subject = `${ageText} adult ${look.subject}`;
  return `${AVATAR_STYLE}. Portrait of a ${subject}, ${look.look}. Clearly an adult. Not a photograph.`;
}
