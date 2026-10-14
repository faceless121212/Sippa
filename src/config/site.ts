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

/**
 * The public site address. An empty or invalid NEXT_PUBLIC_SITE_URL falls back to the
 * address Vercel assigns (VERCEL_PROJECT_PRODUCTION_URL), then to localhost — so a blank
 * variable never breaks the build.
 */
function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ];
  for (const c of candidates) {
    if (!c?.trim()) continue;
    try {
      return new URL(c.trim()).origin + new URL(c.trim()).pathname.replace(/\/$/, "");
    } catch {
      // not a valid URL — try the next one
    }
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Sippa",
  tagline: "Brew your perfect companion.",
  description:
    "Chat with AI characters who feel real — or brew your own in seconds. Lovers, friends and famous minds, on web and phone.",
  url: siteUrl(),
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

/** Owner decision 2026-10-14: prices follow the pitch deck (USD), with an Ultra tier. */
export const pricing = {
  currency: "USD",
  plusMonthly: 13.99,
  plusYearly: 79.99,
  ultraMonthly: 29.99,
  ultraYearly: 199.99,
  freeMessagesPerDay: 30,
  /** Flowers granted with every paid month (yearly plans get 12× up front). */
  plusMonthlyBeans: 300,
  ultraMonthlyBeans: 1000,
} as const;

export type Plan = "free" | "plus" | "ultra";
export type PaidPlan = Exclude<Plan, "free">;
/** Plus and Ultra unlock everything paid; Ultra adds longer memory, more Flowers and voice (soon). */
export const isPaid = (plan: Plan | null | undefined): plan is PaidPlan =>
  plan === "plus" || plan === "ultra";

/** What each paid plan unlocks beyond Free. */
export const planLimits: Record<Plan, { memories: number; historyWindow: number }> = {
  free: { memories: 60, historyWindow: 24 },
  plus: { memories: 60, historyWindow: 24 },
  ultra: { memories: 150, historyWindow: 48 },
};

export const planNames: Record<Plan, string> = { free: "Free", plus: "Sippa Plus", ultra: "Sippa Ultra" };

/**
 * What each plan includes, shown on the landing page and the Plus page. Only list what
 * the code actually does (lib/chat/service.ts, lib/chat/memory.ts, lib/creator/server.ts).
 */
export const planFeatures: Record<Plan, string[]> = {
  free: [
    "30 messages a day",
    "3 free character creations",
    "Characters remember what you tell them",
    "One light ad, never mid-chat",
  ],
  plus: ["Unlimited messages", "Unlimited character creations", "300 Flowers a month", "No ads"],
  ultra: [
    "Everything in Plus",
    "Longer memory: 150 facts and twice the chat context",
    "1,000 Flowers a month",
    "Voice replies (coming soon)",
  ],
};

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
  ultra_monthly: { lookupKey: "sippa_ultra_monthly", mode: "subscription" },
  ultra_yearly: { lookupKey: "sippa_ultra_yearly", mode: "subscription" },
  beans_200: { lookupKey: "sippa_beans_200", mode: "payment" },
  beans_600: { lookupKey: "sippa_beans_600", mode: "payment" },
  beans_1500: { lookupKey: "sippa_beans_1500", mode: "payment" },
} as const;
export type StripeItem = keyof typeof STRIPE_ITEMS;

/** The plan a subscription item grants (null for Flowers packs). */
export function planForItem(item: StripeItem): PaidPlan | null {
  if (item.startsWith("ultra_")) return "ultra";
  if (item.startsWith("plus_")) return "plus";
  return null;
}

/** Percentage saved by paying yearly instead of 12 × monthly, rounded down. */
export function yearlySavingsPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0;
  const fullYear = monthly * 12;
  return Math.max(0, Math.floor(((fullYear - yearly) / fullYear) * 100));
}

export function formatPrice(amount: number, currency: string = pricing.currency): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
