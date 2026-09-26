/**
 * PLACEHOLDER legal copy. Must be reviewed and replaced by a lawyer once the
 * company entity and country are decided (see docs/DECISIONS.md #17).
 */
export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "What we collect",
        body: "Your email address, date of birth (to confirm you're 18+), the characters you create and your chats. Waitlist sign-ups store only your email, consent and the date.",
      },
      {
        heading: "How we use it",
        body: "To run Sippa: sign you in, show your chats, and keep characters' memory. Your chat content is never used for advertising.",
      },
      {
        heading: "Your rights (GDPR)",
        body: "You can export all your data (Settings → Export) and permanently delete your account and everything in it (Settings → Delete account) at any time. You can withdraw consent to emails with one click and turn off character messages in Settings.",
      },
      {
        heading: "Processors",
        body: "Vercel (hosting), Supabase (database, sign-in and file storage, EU region), Anthropic (AI replies and safety review), fal.ai (character portraits) and Stripe (payments) process data on our behalf under data-processing agreements. Chat content is sent to the AI provider only to generate replies and is never used for advertising.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Who can use Sippa",
        body: "You must be 18 or older. Accounts that give an under-18 date of birth are deleted immediately.",
      },
      {
        heading: "Flowers and Sippa Plus",
        body: "Flowers are an in-app currency for extra creations and messages. They have no cash value and can't be transferred. Sippa Plus renews until cancelled; you can cancel any time and keep access until the end of the paid period.",
      },
      {
        heading: "AI characters",
        body: "All characters are AI. They can be wrong, and they are not a substitute for professional, medical, legal or financial advice.",
      },
      {
        heading: "Your content",
        body: "You own the characters you create. By publishing a character you let us display it on Sippa. Content must follow the Community Guidelines.",
      },
      {
        heading: "Subscriptions",
        body: "Sippa Plus renews automatically until cancelled. You can cancel any time from your account.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    sections: [
      {
        heading: "Essential cookies",
        body: "Needed to sign you in, remember your theme and your cookie choice. These are always on.",
      },
      {
        heading: "Optional cookies",
        body: "Measurement and advertising on the free plan. These only run if you choose “Accept all”, and you can change your mind at any time.",
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    sections: [
      {
        heading: "Adults only for romance",
        body: "Romantic characters must be fictional adults aged 21 or older, with an adult appearance. Characters that are, look like, or are described as minors are never allowed in romantic or sexual contexts.",
      },
      {
        heading: "No impersonation of real people",
        body: "Famous characters may be historical figures who died long ago, fictional “inspired-by” archetypes, or verified creators who consented. No living celebrities, politicians or idols, no real photos, and no romance with any real person.",
      },
      {
        heading: "No explicit content",
        body: "Flirting and romance are welcome. Sexually explicit content is not.",
      },
      {
        heading: "Always an AI",
        body: "Characters must never claim to be human when sincerely asked.",
      },
      {
        heading: "Look after yourself",
        body: "If you're struggling, please reach out. In Poland call 116 123 (adult crisis line) or 112 in an emergency. Elsewhere, contact your local emergency number.",
      },
      {
        heading: "Reporting",
        body: "Every character and message has a report button. Reports are reviewed and repeat offenders are banned.",
      },
    ],
  },
} as const;

export type LegalSlug = keyof typeof legalPages;
export const legalSlugs = Object.keys(legalPages) as LegalSlug[];
