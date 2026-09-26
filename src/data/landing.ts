import type { CategoryId } from "@/config/categories";

/**
 * Static example data for the landing page (Phase 1).
 * All characters are original and fictional, except Famous characters,
 * which are historical figures who died long ago (public domain).
 * Every Lover character is a fictional adult aged 21+.
 */

export type HairStyle = "short" | "long" | "bun" | "curly" | "bald";
export type Accessory = "glasses" | "earring" | "laurel" | "crown" | "beard" | "headphones" | "flower";

export type AvatarSpec = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: string;
  bg: [string, string];
  accessories?: Accessory[];
};

export type SampleCharacter = {
  id: string;
  name: string;
  age?: number;
  category: CategoryId;
  famousType?: "historical" | "inspired";
  hook: string;
  tags: string[];
  messages: number;
  avatar: AvatarSpec;
};

const SKIN = {
  light: "#F3D2B8",
  medium: "#D9A77E",
  tan: "#B97F55",
  deep: "#7A4B2E",
};

export const sampleCharacters: SampleCharacter[] = [
  // ---- Lover (fictional adults, 21+) ----
  {
    id: "mara-vellin",
    name: "Mara Vellin",
    age: 27,
    category: "lover",
    hook: "Night-shift florist. Saves you the last bouquet.",
    tags: ["Sweet", "Slow Burn", "Slice of Life"],
    messages: 2_430_000,
    avatar: {
      skin: SKIN.light,
      hair: "#6B2E2A",
      hairStyle: "long",
      outfit: "#C4577A",
      bg: ["#4A1F2E", "#C4577A"],
      accessories: ["flower"],
    },
  },
  {
    id: "theo-hart",
    name: "Theo Hart",
    age: 29,
    category: "lover",
    hook: "Your office rival. Always one step ahead.",
    tags: ["Coworkers", "Slow Burn", "Tsundere"],
    messages: 1_870_000,
    avatar: {
      skin: SKIN.medium,
      hair: "#2B1D16",
      hairStyle: "short",
      outfit: "#2F3A4F",
      bg: ["#2A1A22", "#8E3F5C"],
      accessories: ["glasses"],
    },
  },
  {
    id: "ren-kaito",
    name: "Ren Kaito",
    age: 26,
    category: "lover",
    hook: "Remembers your order — and your bad days.",
    tags: ["Protective", "Sweet", "Anime-style"],
    messages: 3_120_000,
    avatar: {
      skin: SKIN.light,
      hair: "#1C1C2B",
      hairStyle: "short",
      outfit: "#E8A35C",
      bg: ["#3B1E2A", "#D06C8C"],
      accessories: ["earring"],
    },
  },
  {
    id: "sol-rivera",
    name: "Sol Rivera",
    age: 30,
    category: "lover",
    hook: "Back in town for one week only.",
    tags: ["Long-distance", "Friends to Lovers", "Adventure"],
    messages: 954_000,
    avatar: {
      skin: SKIN.tan,
      hair: "#1E140F",
      hairStyle: "curly",
      outfit: "#5B6B4A",
      bg: ["#40202C", "#B34D6E"],
    },
  },

  // ---- Friend ----
  {
    id: "pip-marlow",
    name: "Pip Marlow",
    age: 22,
    category: "friend",
    hook: "Chaotic study buddy. Colour-codes everything.",
    tags: ["Study Buddy", "Motivator", "Study buddies"],
    messages: 1_240_000,
    avatar: {
      skin: SKIN.medium,
      hair: "#C9793A",
      hairStyle: "bun",
      outfit: "#6FBF8E",
      bg: ["#15332A", "#3F8F66"],
      accessories: ["glasses"],
    },
  },
  {
    id: "nora-quill",
    name: "Nora Quill",
    age: 58,
    category: "friend",
    hook: "Tea, calm, and exactly the right book.",
    tags: ["Comfort", "Best Friend", "Slice of Life"],
    messages: 811_000,
    avatar: {
      skin: SKIN.light,
      hair: "#B8B2AC",
      hairStyle: "bun",
      outfit: "#7A5C8E",
      bg: ["#1B3329", "#5AAA7C"],
      accessories: ["glasses"],
    },
  },
  {
    id: "dex-okafor",
    name: "Dex Okafor",
    age: 24,
    category: "friend",
    hook: "Carries you in co-op. Roasts you lovingly.",
    tags: ["Gamer", "Gaming", "Best Friend"],
    messages: 2_050_000,
    avatar: {
      skin: SKIN.deep,
      hair: "#141010",
      hairStyle: "short",
      outfit: "#3A4A7A",
      bg: ["#12302A", "#4FA37A"],
      accessories: ["headphones"],
    },
  },
  {
    id: "lina-vasquez",
    name: "Lina Vasquez",
    age: 31,
    category: "friend",
    hook: "A story and a street-food tip for every city.",
    tags: ["Travel Buddy", "Adventure", "Language Partner"],
    messages: 640_000,
    avatar: {
      skin: SKIN.tan,
      hair: "#3A2418",
      hairStyle: "long",
      outfit: "#E8A35C",
      bg: ["#1A3A30", "#6FBF8E"],
      accessories: ["earring"],
    },
  },

  // ---- Famous (historical, long deceased) ----
  {
    id: "ada-lovelace",
    name: "Ada Lovelace",
    category: "famous",
    famousType: "historical",
    hook: "Dreamed computers could make music.",
    tags: ["Scientists", "Historical Figures"],
    messages: 1_530_000,
    avatar: {
      skin: SKIN.light,
      hair: "#3B2418",
      hairStyle: "bun",
      outfit: "#3E3A6B",
      bg: ["#1C2240", "#6F86D6"],
      accessories: ["earring"],
    },
  },
  {
    id: "leonardo-da-vinci",
    name: "Leonardo da Vinci",
    category: "famous",
    famousType: "historical",
    hook: "Painter, engineer, genius. Ask anything.",
    tags: ["Artists", "Historical Figures"],
    messages: 2_210_000,
    avatar: {
      skin: SKIN.medium,
      hair: "#D9D2C9",
      hairStyle: "long",
      outfit: "#7A3B2A",
      bg: ["#1E2440", "#8FA7F0"],
      accessories: ["beard"],
    },
  },
  {
    id: "marcus-aurelius",
    name: "Marcus Aurelius",
    category: "famous",
    famousType: "historical",
    hook: "Stoic emperor. Calm for your chaotic Monday.",
    tags: ["Philosophers", "Historical Figures"],
    messages: 3_480_000,
    avatar: {
      skin: SKIN.medium,
      hair: "#4A3526",
      hairStyle: "curly",
      outfit: "#E9E2D6",
      bg: ["#1A2038", "#5C73C4"],
      accessories: ["laurel", "beard"],
    },
  },
  {
    id: "cleopatra",
    name: "Cleopatra VII",
    category: "famous",
    famousType: "historical",
    hook: "Last pharaoh. Zero patience for fools.",
    tags: ["Historical Figures", "Legends & Myths"],
    messages: 1_960_000,
    avatar: {
      skin: SKIN.tan,
      hair: "#111018",
      hairStyle: "long",
      outfit: "#2E8C8C",
      bg: ["#222A4A", "#8FA7F0"],
      accessories: ["crown"],
    },
  },
];

export const charactersByCategory = (category: CategoryId) =>
  sampleCharacters.filter((c) => c.category === category);

export const hotThisWeek: SampleCharacter[] = [
  "marcus-aurelius",
  "ren-kaito",
  "mara-vellin",
  "leonardo-da-vinci",
  "dex-okafor",
  "pip-marlow",
].map((id) => sampleCharacters.find((c) => c.id === id)!);

// ---- Creator demo (pre-made results; no real AI call on the landing page) ----

export type CreatorExample = {
  keywords: string[];
  prompt: string;
  character: SampleCharacter & {
    traits: string[];
    speakingStyle: string;
    firstMessage: string;
  };
};

export const creatorExamples: CreatorExample[] = [
  {
    keywords: ["barista", "coffee", "poet", "poetry", "grumpy", "café", "cafe"],
    prompt: "a grumpy barista who secretly writes poetry",
    character: {
      id: "elio-marsh",
      name: "Elio Marsh",
      age: 31,
      category: "friend",
      hook: "Scowls at you. Leaves poems on your napkin.",
      tags: ["Comfort", "Slice of Life"],
      messages: 0,
      traits: ["Grumpy", "Secretly soft", "Poetic", "Loyal"],
      speakingStyle: "Short, dry sentences. Softens when nobody's watching.",
      firstMessage:
        "*slides your cup across the counter* You're late. The poem's on the lid. Don't read it here.",
      avatar: {
        skin: "#D9A77E",
        hair: "#2B1D16",
        hairStyle: "curly",
        outfit: "#6B4A33",
        bg: ["#2A1D16", "#E8A35C"],
        accessories: ["beard"],
      },
    },
  },
  {
    keywords: [
      "love",
      "romance",
      "date",
      "dating",
      "flirt",
      "crush",
      "boyfriend",
      "girlfriend",
      "kiss",
      "charming",
      "lighthouse",
    ],
    prompt: "a charming lighthouse keeper I keep running into on the pier",
    character: {
      id: "isla-maren",
      name: "Isla Maren",
      age: 28,
      category: "lover",
      hook: "Keeps the light on — lately, for you.",
      tags: ["Slow Burn", "Sweet", "Mystery"],
      messages: 0,
      traits: ["Warm", "Teasing", "Mysterious", "Brave"],
      speakingStyle: "Playful, a little poetic, full of sea metaphors.",
      firstMessage:
        "*leans on the railing, grinning* Third time this week on my pier. Should I start charging rent — or start expecting you?",
      avatar: {
        skin: "#F3D2B8",
        hair: "#C9793A",
        hairStyle: "long",
        outfit: "#2F4A6B",
        bg: ["#3B1E2A", "#C4577A"],
        accessories: ["earring"],
      },
    },
  },
  {
    keywords: [
      "history",
      "historical",
      "scientist",
      "philosopher",
      "ancient",
      "king",
      "queen",
      "emperor",
      "inventor",
    ],
    prompt: "a Renaissance inventor who wants to hear about modern technology",
    character: {
      id: "maestro-orlando",
      name: "Maestro Orlando",
      category: "famous",
      famousType: "inspired",
      hook: "Renaissance tinkerer, amazed by your phone.",
      tags: ["Artists", "Adventure"],
      messages: 0,
      traits: ["Curious", "Theatrical", "Brilliant", "Easily distracted"],
      speakingStyle: "Grand, excitable, sketches ideas mid-sentence.",
      firstMessage:
        "*squints at your screen* A glass tablet that holds every library in Florence? Explain. Slowly. I am taking notes.",
      avatar: {
        skin: "#D9A77E",
        hair: "#6B4A33",
        hairStyle: "curly",
        outfit: "#7A3B2A",
        bg: ["#1E2440", "#8FA7F0"],
        accessories: ["beard"],
      },
    },
  },
];

/** Every character with a placeholder avatar (samples + creator demo results). */
export const allLandingCharacters: SampleCharacter[] = [
  ...sampleCharacters,
  ...creatorExamples.map((e) => e.character),
];

export function pickCreatorExample(input: string): CreatorExample {
  const text = input.trim().toLowerCase();
  return (
    creatorExamples.find((ex) => ex.prompt.toLowerCase() === text) ??
    creatorExamples.find((ex) => ex.keywords.some((k) => text.includes(k))) ??
    creatorExamples[0]
  );
}

// ---- Why Sippa ----

export const whySippa = [
  {
    icon: "brain",
    title: "Remembers you",
    body: "Long-term memory you can see and edit.",
  },
  {
    icon: "ban",
    title: "No pop-up ads",
    body: "Never interrupts your chat. Ever.",
  },
  {
    icon: "devices",
    title: "Web + phone",
    body: "Start on desktop, continue on your phone.",
  },
  {
    icon: "theater",
    title: "Stays in character",
    body: "No personality drift, even in long chats.",
  },
  {
    icon: "lock",
    title: "Private by default",
    body: "Never used for ads. Delete anytime.",
  },
] as const;

// ---- FAQ ----

export const faqs = [
  {
    q: "Is Sippa free?",
    a: "Yes — 30 messages a day and 3 character creations. Plus removes the limits.",
  },
  {
    q: "Is it safe?",
    a: "Safety rules can't be overridden, explicit content is blocked, and everything can be reported.",
  },
  {
    q: "Who can use Sippa?",
    a: "Adults 18+. Romantic characters are always fictional adults, 21+.",
  },
  {
    q: "Are the famous characters real people?",
    a: "No. Long-gone historical figures or fictional archetypes — never living celebrities.",
  },
  {
    q: "Am I talking to a human?",
    a: "No. Every character is an AI and will always say so.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Export or delete everything in Settings, anytime.",
  },
];
