import type { CategoryId } from "./categories";

// ───────────── Bond levels ─────────────

export const XP = {
  message: 1,
  perFlowerGifted: 2,
  sceneStart: 3,
} as const;

type Level = { level: number; minXp: number; names: Record<CategoryId, string> };

export const LEVELS: Level[] = [
  { level: 1, minXp: 0, names: { lover: "Stranger", friend: "New face", famous: "Visitor" } },
  { level: 2, minXp: 20, names: { lover: "Acquaintance", friend: "Buddy", famous: "Guest" } },
  { level: 3, minXp: 60, names: { lover: "Crush", friend: "Friend", famous: "Student" } },
  { level: 4, minXp: 150, names: { lover: "Sweetheart", friend: "Close friend", famous: "Confidant" } },
  { level: 5, minXp: 300, names: { lover: "Soulmate", friend: "Best friend", famous: "Kindred spirit" } },
];

export function bondLevel(xp: number, category: CategoryId) {
  const current = [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return {
    level: current.level,
    name: current.names[category],
    xp,
    nextAt: next?.minXp ?? null,
    nextName: next?.names[category] ?? null,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

/** Tone hint for the chat prompt so the relationship actually feels different. */
export function bondPromptNote(level: number, category: CategoryId): string | null {
  if (level <= 1) return null;
  const warmth = [
    "",
    "",
    "You've chatted a few times — be a little more familiar.",
    "You know each other well now — be warm, reference shared moments and inside jokes.",
    "You're very close — be openly warm and personal (still following every rule).",
    "You share a deep bond — be your most open, caring self (still following every rule).",
  ][level];
  void category;
  return warmth;
}

// ───────────── Gifts ─────────────

export const GIFTS = [
  { size: 5, label: "Single bloom", emoji: "🌷" },
  { size: 20, label: "Bouquet", emoji: "💐" },
  { size: 50, label: "Grand bouquet", emoji: "🌸" },
] as const;
export type GiftSize = (typeof GIFTS)[number]["size"];

// ───────────── Daily check-in ─────────────

export const CHECKIN = { daily: 5, streakBonus: 30, streakLength: 7 } as const;

/** Streak after checking in today, given yesterday's streak (0 if missed). */
export function nextStreak(yesterdayStreak: number | null) {
  return (yesterdayStreak ?? 0) + 1;
}

export function checkinReward(streak: number) {
  const bonus = streak % CHECKIN.streakLength === 0 ? CHECKIN.streakBonus : 0;
  return { daily: CHECKIN.daily, bonus, total: CHECKIN.daily + bonus };
}

// ───────────── Scene starters ─────────────

export type Scene = { id: string; title: string; emoji: string; prompt: string; minLevel: number };

export const SCENES: Record<CategoryId, Scene[]> = {
  lover: [
    {
      id: "coffee-date",
      title: "Coffee date",
      emoji: "☕",
      minLevel: 1,
      prompt: "A first coffee date at a cosy café on a quiet afternoon.",
    },
    {
      id: "rainy-walk",
      title: "Rainy walk home",
      emoji: "🌧️",
      minLevel: 1,
      prompt: "Walking home together under one umbrella in the rain.",
    },
    {
      id: "stargazing",
      title: "Rooftop stargazing",
      emoji: "✨",
      minLevel: 3,
      prompt: "Lying on a rooftop at night, naming stars and talking about dreams.",
    },
    {
      id: "weekend-away",
      title: "Weekend getaway",
      emoji: "🧳",
      minLevel: 4,
      prompt: "A spontaneous weekend trip to a seaside town.",
    },
  ],
  friend: [
    {
      id: "catch-up",
      title: "Catch-up call",
      emoji: "📞",
      minLevel: 1,
      prompt: "A late-evening call to catch up on each other's week.",
    },
    {
      id: "game-night",
      title: "Game night",
      emoji: "🎮",
      minLevel: 1,
      prompt: "A chaotic co-op game night with snacks.",
    },
    {
      id: "road-trip",
      title: "Road trip",
      emoji: "🚗",
      minLevel: 3,
      prompt: "Day one of a road trip with a questionable playlist.",
    },
    {
      id: "heart-to-heart",
      title: "Heart-to-heart",
      emoji: "🫶",
      minLevel: 4,
      prompt: "A quiet late-night heart-to-heart about what really matters.",
    },
  ],
  famous: [
    {
      id: "advice",
      title: "Ask for advice",
      emoji: "🧭",
      minLevel: 1,
      prompt: "You come to them with a real-life dilemma and ask for their counsel.",
    },
    {
      id: "debate",
      title: "Friendly debate",
      emoji: "⚖️",
      minLevel: 1,
      prompt: "A lively debate where they defend an idea from their era.",
    },
    {
      id: "their-world",
      title: "A day in their world",
      emoji: "🏛️",
      minLevel: 3,
      prompt: "They show you around the place and time they lived in.",
    },
    {
      id: "lesson",
      title: "Private lesson",
      emoji: "📜",
      minLevel: 4,
      prompt: "A private lesson in the craft they were famous for.",
    },
  ],
};

export function sceneById(category: CategoryId, id: string) {
  return SCENES[category].find((s) => s.id === id) ?? null;
}
