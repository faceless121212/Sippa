import { z } from "zod";

export const waitlistSchema = z.object({
  email: z
    .string({ error: "Please enter your email." })
    .trim()
    .toLowerCase()
    .max(254, "That email is too long.")
    .pipe(z.email({ error: "Please enter a valid email." })),
  consent: z.literal(true, { error: "Please tick the consent box to join." }),
  /** Honeypot: must be empty. */
  website: z.string().max(0).optional().or(z.null()),
  source: z.string().max(40).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
