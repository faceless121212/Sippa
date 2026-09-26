import type { CategoryId } from "@/config/categories";
import { characterById, type Character } from "./characters";

/**
 * Landing-page data (Phase 1). Characters come from the seed set in
 * `characters.ts`; creator-demo results below are landing-only examples.
 */

export type SampleCharacter = Pick<
  Character,
  "id" | "name" | "age" | "category" | "famousType" | "hook" | "tags" | "messages"
>;

const pick = (ids: string[]): SampleCharacter[] => ids.map((id) => characterById(id)!);

/** 4 per category, shown in "Pick your vibe". */
export const sampleCharacters: SampleCharacter[] = pick([
  "mara-vellin",
  "theo-hart",
  "ren-kaito",
  "sol-rivera",
  "pip-marlow",
  "nora-quill",
  "dex-okafor",
  "lina-vasquez",
  "ada-lovelace",
  "leonardo-da-vinci",
  "marcus-aurelius",
  "cleopatra",
]);

export const charactersByCategory = (category: CategoryId): SampleCharacter[] =>
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
    },
  },
];

/** Creator-demo characters (they have portraits but aren't in the database). */
export const demoCharacters: SampleCharacter[] = creatorExamples.map((e) => e.character);

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
