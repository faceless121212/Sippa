import { z } from "zod";
import { VIBES, type Vibe } from "@/config/quizzes";

/**
 * Carries the quiz result into the app: which character, scene and vibe, and the first
 * reply the visitor wrote on the result screen. Stored in a short-lived first-party
 * cookie (not the URL, because the reply is the visitor's own words) and used once:
 * the chat sends the reply and clears the cookie.
 *
 * Everything in it is treated as untrusted: the server only uses the ids to look up
 * its own scene and opener, and the reply goes through the normal chat checks.
 */
export const QUIZ_START_COOKIE = "sippa_quiz_start";
export const MAX_FIRST_REPLY = 300;

export const quizStartSchema = z.object({
  c: z.string().regex(/^[a-z0-9-]{1,64}$/),
  s: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
  v: z.enum(VIBES as [Vibe, ...Vibe[]]).optional(),
  r: z.string().trim().min(1).max(MAX_FIRST_REPLY).optional(),
});
export type QuizStart = z.infer<typeof quizStartSchema>;

export function parseQuizStart(raw: string | undefined | null): QuizStart | null {
  if (!raw) return null;
  try {
    const parsed = quizStartSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Browser only. One hour is plenty to get through sign-up and the email link. */
export function saveQuizStart(start: QuizStart) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${QUIZ_START_COOKIE}=${encodeURIComponent(JSON.stringify(start))}; path=/; max-age=3600; samesite=lax${secure}`;
}

export function readQuizStart(): QuizStart | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${QUIZ_START_COOKIE}=`))
    ?.slice(QUIZ_START_COOKIE.length + 1);
  return parseQuizStart(raw);
}

export function clearQuizStart() {
  document.cookie = `${QUIZ_START_COOKIE}=; path=/; max-age=0`;
}

/** The app page that follows the quiz (after sign-up). Ids only — no free text in URLs. */
export function welcomePath(c: string, s?: string, v?: Vibe) {
  const q = new URLSearchParams({ c, ...(s ? { s } : {}), ...(v ? { v } : {}) });
  return `/app/welcome?${q}`;
}
