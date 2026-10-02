import type { AvatarLook } from "@/data/avatar-looks";

/** Owner decision (DECISIONS #11): semi-realistic painted style for the original characters. */
export const AVATAR_STYLE =
  "semi-realistic digital painting, painterly brushwork, soft cinematic lighting, head-and-shoulders portrait, looking at the viewer, shallow depth of field, rich warm colours, high detail";

/**
 * Owner decision 2026-10-02: newer fictional characters get photo-realistic portraits.
 * Always an invented person — never a real or famous individual, never historical figures.
 */
export const PHOTO_STYLE =
  "photorealistic editorial portrait photograph, natural soft light, 85mm lens, shallow depth of field, head-and-shoulders, looking at the camera, true-to-life skin texture, high detail";

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
  if (look.style === "photo") {
    return `${PHOTO_STYLE}. Portrait of a fictional ${subject}, ${look.look}. Clearly an adult. An invented person, not a real or famous individual. Tasteful, fully clothed.`;
  }
  return `${AVATAR_STYLE}. Portrait of a ${subject}, ${look.look}. Clearly an adult. Not a photograph.`;
}
