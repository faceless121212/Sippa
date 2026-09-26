import { z } from "zod";
import { isAdult } from "./age";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Enter a valid email." }));

export const signUpSchema = z.object({
  displayName: z.string().trim().max(40).optional(),
  email,
  password: passwordSchema,
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth."),
  terms: z.literal("on", { error: "Please confirm you're 18+ and accept the Terms." }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const emailOnlySchema = z.object({ email });

/** Under-18s are refused before any account is created (spec §6.2). */
export function signUpAgeOk(dob: string, today = new Date()) {
  return isAdult(dob, today);
}

/** First validation message, for showing next to the form. */
export function firstError(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Please check the form.";
}
