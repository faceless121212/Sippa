import { z } from "zod";
import { categories, genreTags, type CategoryId } from "@/config/categories";

/** Every tag a creator may use. */
export const ALLOWED_TAGS = Array.from(new Set([...categories.flatMap((c) => c.subTags), ...genreTags]));

/**
 * Shape the model must return (structured output). Kept free of min/max
 * constraints — those are enforced afterwards by `draftSchema` + `checkDraft`.
 */
export const generatedSchema = z.object({
  refusal_reason: z.string().nullable(),
  name: z.string(),
  age: z.number().int().nullable(),
  gender: z.enum(["male", "female", "nonbinary"]),
  short_hook: z.string(),
  description: z.string(),
  personality_traits: z.array(z.string()),
  speaking_style: z.string(),
  backstory: z.string(),
  first_message: z.string(),
  example_dialogues: z.array(z.object({ user: z.string(), character: z.string() })),
  tags: z.array(z.string()),
  famous_type: z.enum(["historical", "inspired"]).nullable(),
  historical_died_year: z.number().int().nullable(),
  visual_prompt: z.string(),
});
export type Generated = z.infer<typeof generatedSchema>;

export const dialsSchema = z.object({
  warmth: z.number().int().min(0).max(100),
  humor: z.number().int().min(0).max(100),
  flirtiness: z.number().int().min(0).max(100),
  talkativeness: z.number().int().min(0).max(100),
});
export type Dials = z.infer<typeof dialsSchema>;
export const DEFAULT_DIALS: Dials = { warmth: 60, humor: 50, flirtiness: 40, talkativeness: 50 };

/** What the tune step edits and the save step stores. */
export const draftSchema = z.object({
  category: z.enum(["lover", "friend", "famous"]),
  famousType: z.enum(["historical", "inspired"]).nullable(),
  historicalDiedYear: z.number().int().nullable(),
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(18).max(120).nullable(),
  gender: z.enum(["male", "female", "nonbinary"]),
  hook: z.string().trim().min(1).max(90),
  description: z.string().trim().min(1).max(600),
  traits: z.array(z.string().trim().min(1).max(30)).min(3).max(6),
  speakingStyle: z.string().trim().min(1).max(300),
  backstory: z.string().trim().min(1).max(1000),
  firstMessage: z.string().trim().min(1).max(500),
  exampleDialogues: z
    .array(
      z.object({ user: z.string().trim().min(1).max(300), character: z.string().trim().min(1).max(400) }),
    )
    .min(2)
    .max(3),
  tags: z.array(z.string()).max(6),
  visualPrompt: z.string().trim().min(1).max(500),
  dials: dialsSchema,
});
export type Draft = z.infer<typeof draftSchema>;

export function fromGenerated(g: Generated, category: CategoryId): Draft {
  return {
    category,
    famousType: category === "famous" ? (g.famous_type ?? "inspired") : null,
    historicalDiedYear: category === "famous" ? g.historical_died_year : null,
    name: g.name.trim().slice(0, 60),
    age: g.age,
    gender: g.gender,
    hook: g.short_hook.trim().slice(0, 90),
    description: g.description.trim().slice(0, 600),
    traits: g.personality_traits.slice(0, 6).map((t) => t.trim().slice(0, 30)),
    speakingStyle: g.speaking_style.trim().slice(0, 300),
    backstory: g.backstory.trim().slice(0, 1000),
    firstMessage: g.first_message.trim().slice(0, 500),
    exampleDialogues: g.example_dialogues.slice(0, 3),
    tags: g.tags.filter((t) => ALLOWED_TAGS.includes(t)).slice(0, 6),
    visualPrompt: g.visual_prompt.trim().slice(0, 500),
    dials: { ...DEFAULT_DIALS, flirtiness: category === "lover" ? 50 : 0 },
  };
}

// ───────────── quiz (step 2 alternative) ─────────────

export type QuizQuestion = { id: string; label: string; multi?: boolean; options: string[] };

export const QUIZ: Record<CategoryId, QuizQuestion[]> = {
  lover: [
    {
      id: "vibe",
      label: "What's the vibe?",
      options: ["Cosy", "Mysterious", "Playful", "Elegant", "Adventurous", "Moody"],
    },
    {
      id: "traits",
      label: "Personality",
      multi: true,
      options: ["Kind", "Teasing", "Shy", "Confident", "Protective", "Sarcastic", "Loyal", "Dramatic"],
    },
    {
      id: "talk",
      label: "How do they talk?",
      options: ["Soft-spoken", "Witty & dry", "Flirty", "Formal", "Poetic", "Blunt"],
    },
    {
      id: "setting",
      label: "Where do you meet?",
      options: ["Coffee shop", "Office", "Rooftop bar", "Bookshop", "Beach town", "Fantasy kingdom"],
    },
    {
      id: "relation",
      label: "Who are they to you?",
      options: ["New crush", "Rival", "Old flame", "Fake date", "Neighbour", "Travel companion"],
    },
  ],
  friend: [
    {
      id: "vibe",
      label: "What's the vibe?",
      options: ["Cosy", "Chaotic", "Chill", "Nerdy", "Sporty", "Artsy"],
    },
    {
      id: "traits",
      label: "Personality",
      multi: true,
      options: ["Kind", "Funny", "Honest", "Hype", "Wise", "Patient", "Goofy", "Organised"],
    },
    {
      id: "talk",
      label: "How do they talk?",
      options: ["Soft-spoken", "Witty & dry", "Loud & excited", "Straight-talking", "Gentle", "Punny"],
    },
    {
      id: "setting",
      label: "Where do you hang out?",
      options: ["Coffee shop", "Gaming night", "Library", "Gym", "Kitchen", "Road trip"],
    },
    {
      id: "relation",
      label: "Who are they to you?",
      options: ["Best friend", "Mentor", "Study buddy", "Gaming buddy", "Travel buddy", "Neighbour"],
    },
  ],
  famous: [
    {
      id: "vibe",
      label: "Which era?",
      options: ["Ancient world", "Renaissance", "1700s", "1800s", "Early 1900s", "Myth & legend"],
    },
    {
      id: "traits",
      label: "Personality",
      multi: true,
      options: ["Wise", "Witty", "Stern", "Passionate", "Curious", "Theatrical", "Humble", "Proud"],
    },
    {
      id: "talk",
      label: "How do they talk?",
      options: ["Grand & formal", "Plain-spoken", "Poetic", "Witty", "Teacherly", "Mysterious"],
    },
    {
      id: "setting",
      label: "Field",
      options: ["Science", "Art", "Music", "Philosophy", "Leadership", "Literature"],
    },
    {
      id: "relation",
      label: "What do you want from them?",
      options: ["Life advice", "A good story", "Debate", "Teach me", "Motivation", "Just chat"],
    },
  ],
};

export function quizToDescription(category: CategoryId, answers: Record<string, string[]>): string {
  const q = QUIZ[category];
  return q
    .map((question) => {
      const a = (answers[question.id] ?? []).filter((x) => question.options.includes(x));
      return a.length ? `${question.label} ${a.join(", ")}` : "";
    })
    .filter(Boolean)
    .join(". ");
}
