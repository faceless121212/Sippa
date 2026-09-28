/**
 * Editable brand, pricing and link settings. Change copy and prices here,
 * not in components.
 */
/**
 * Message counts and popularity badges ("Hot", "Trending") are hidden until they
 * reflect real usage. Turn on once the numbers come from actual chats.
 */
export const showUsageStats = false;

/**
 * Social proof only shows real numbers, and only once they're meaningful.
 * Lower these to preview the sections; never fake the underlying data.
 */
export const socialProof = {
  /** Show "chats started / characters created / moments" once there are this many chats. */
  minChatsForCounters: 100,
  /** Show "% of replies rated 👍" once this many replies have been rated. */
  minRatingsForScore: 30,
  /** Live activity looks back this far. */
  activityWindowHours: 24,
};

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
  /** Beans granted with every paid Plus period (monthly, or monthly-equivalent on yearly). */
  plusMonthlyBeans: 300,
} as const;

/** What Beans buy (owner decision, Phase 5). */
export const beanCosts = {
  /** One character creation after the free ones. */
  creation: 50,
  /** One message past the free daily limit (only when the user opts in). */
  message: 1,
} as const;

export type BeanPack = {
  id: "beans_200" | "beans_600" | "beans_1500";
  beans: number;
  price: number;
  label?: string;
};

export const beanPacks: BeanPack[] = [
  { id: "beans_200", beans: 200, price: 1.99 },
  { id: "beans_600", beans: 600, price: 4.99, label: "Popular" },
  { id: "beans_1500", beans: 1500, price: 9.99, label: "Best value" },
];

/** Stripe lookup keys for everything sold. `npm run stripe:setup` creates them. */
export const STRIPE_ITEMS = {
  plus_monthly: { lookupKey: "sippa_plus_monthly", mode: "subscription" },
  plus_yearly: { lookupKey: "sippa_plus_yearly", mode: "subscription" },
  beans_200: { lookupKey: "sippa_beans_200", mode: "payment" },
  beans_600: { lookupKey: "sippa_beans_600", mode: "payment" },
  beans_1500: { lookupKey: "sippa_beans_1500", mode: "payment" },
} as const;
export type StripeItem = keyof typeof STRIPE_ITEMS;

/** Percentage saved by paying yearly instead of 12 × monthly, rounded down. */
export function yearlySavingsPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0;
  const fullYear = monthly * 12;
  return Math.max(0, Math.floor(((fullYear - yearly) / fullYear) * 100));
}

export function formatPrice(amount: number, currency: string = pricing.currency): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
}
