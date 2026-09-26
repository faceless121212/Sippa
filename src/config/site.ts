/**
 * Editable brand, pricing and link settings. Change copy and prices here,
 * not in components.
 */
export const siteConfig = {
  name: "Sippa",
  tagline: "Brew your perfect companion.",
  description:
    "Chat with AI characters who feel real — or brew your own in seconds. Lovers, friends and famous minds, on web and phone.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  minimumAge: 18,
  loverMinimumCharacterAge: 21,
  freeCharacterCreations: 3,
  socials: [
    { label: "TikTok", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Discord", href: "#" },
    { label: "X", href: "#" },
  ],
} as const;

export const pricing = {
  currency: "EUR",
  plusMonthly: 7.99,
  plusYearly: 59.99,
  freeMessagesPerDay: 30,
} as const;

/** Percentage saved by paying yearly instead of 12 × monthly, rounded down. */
export function yearlySavingsPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0;
  const fullYear = monthly * 12;
  return Math.max(0, Math.floor(((fullYear - yearly) / fullYear) * 100));
}

export function formatPrice(amount: number, currency: string = pricing.currency): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
}
