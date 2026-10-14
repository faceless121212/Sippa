import type { SegmentId } from "./segments";

/**
 * Web-funnel quizzes (owner request 2026-10-14: "make them like Headway / Genesis web
 * quizzes, 20 questions each, images from fal.ai").
 *
 * Each quiz is a list of steps: 20 questions, a few info screens between them and a
 * "matching" screen before the result. Every answer leans towards character tags and
 * traits (see `matchCharacters`), so all 20 questions change who you're matched with.
 *
 * Info screens only state things that are true about Sippa — no invented statistics,
 * no fake timers (EU unfair-commercial-practices rules; see DECISIONS.md).
 *
 * Images live in public/quiz/<segment>/<key>.jpg and are generated with
 * `npm run quiz:images` (prompts in scripts/quiz-images.ts).
 */

export type QuizOption = {
  id: string;
  label: string;
  emoji?: string;
  /** Image key: public/quiz/<image>.jpg */
  image?: string;
  /** Character tags this answer leans towards (matched case-insensitively). */
  tags?: string[];
  /** Personality traits this answer leans towards. */
  traits?: string[];
  /** Characters this answer points at directly (e.g. an era). */
  characters?: string[];
  /** Hard filters. */
  gender?: "female" | "male";
  famousType?: "historical" | "inspired";
  /** Preferred character age range. */
  ages?: [number, number];
};

type Base = { id: string; section: number };

export type ChoiceStep = Base & {
  kind: "single" | "multi";
  question: string;
  hint?: string;
  /** "cards" = 2-column image cards; "list" = rows with an emoji. */
  layout?: "cards" | "list";
  options: QuizOption[];
  /** Multi-select: how many can be picked. */
  max?: number;
};

/** "Do you relate to this?" — a 5-point answer; agreeing applies the statement's leanings. */
export type StatementStep = Base & {
  kind: "statement";
  statement: string;
  leans: Omit<QuizOption, "id" | "label">;
};

export type NameStep = Base & { kind: "name"; question: string; hint?: string };

export type InfoStep = Base & {
  kind: "info";
  title: string;
  body: string;
  image: string;
  points?: string[];
  /** "Got it" line that echoes an earlier answer: option id → text. */
  echo?: { step: string; text: Record<string, string> };
};

export type QuizStep = ChoiceStep | StatementStep | NameStep | InfoStep;

export type Quiz = {
  sections: string[];
  steps: QuizStep[];
  /** Lines shown on the "matching" screen. */
  matching: string[];
};

export const isQuestion = (s: QuizStep) => s.kind !== "info";

export const STATEMENT_SCALE = [
  { value: 1, label: "Not at all" },
  { value: 2, label: "Not really" },
  { value: 3, label: "Not sure" },
  { value: 4, label: "Mostly" },
  { value: 5, label: "Totally me" },
] as const;

const AGE_OPTIONS: QuizOption[] = [
  { id: "18-24", label: "18–24", ages: [18, 27] },
  { id: "25-34", label: "25–34", ages: [24, 34] },
  { id: "35-44", label: "35–44", ages: [30, 45] },
  { id: "45+", label: "45+", ages: [33, 99] },
];

const love: Quiz = {
  sections: ["About you", "Your type", "Your story", "Your match"],
  matching: ["Reading your answers", "Finding your type", "Choosing a first message"],
  steps: [
    {
      id: "who",
      section: 0,
      kind: "single",
      layout: "cards",
      question: "Who would you like to meet?",
      hint: "Sippa Love is for adults 18+.",
      options: [
        { id: "woman", label: "A woman", image: "love/who-woman", gender: "female" },
        { id: "man", label: "A man", image: "love/who-man", gender: "male" },
        { id: "any", label: "Surprise me", image: "love/who-any" },
      ],
    },
    {
      id: "age",
      section: 0,
      kind: "single",
      question: "How old are you?",
      hint: "We'll suggest someone around your age.",
      options: AGE_OPTIONS,
    },
    {
      id: "why",
      section: 0,
      kind: "single",
      question: "What brings you to Sippa?",
      options: [
        { id: "flirt", label: "Someone fun to flirt with", emoji: "😏", traits: ["Flirty", "Playful", "Charming"] },
        { id: "lonely", label: "Feeling less alone", emoji: "🌙", tags: ["Sweet"], traits: ["Warm", "Caring", "Tender"] },
        { id: "practise", label: "Practising how to talk to someone", emoji: "💬", traits: ["Patient", "Kind", "Honest"] },
        { id: "story", label: "A love story to escape into", emoji: "📖", tags: ["Slow Burn", "K-drama style"], traits: ["Romantic"] },
      ],
    },
    {
      id: "topics",
      section: 0,
      kind: "multi",
      max: 3,
      question: "What do you love talking about?",
      hint: "Pick up to 3.",
      options: [
        { id: "music", label: "Music", emoji: "🎧", traits: ["Artistic", "Creative"] },
        { id: "films", label: "Films & series", emoji: "🎬", tags: ["K-drama style", "Anime-style"] },
        { id: "books", label: "Books", emoji: "📚", traits: ["Bookish", "Dreamy"] },
        { id: "travel", label: "Travel", emoji: "✈️", tags: ["Adventure", "Long-distance"], traits: ["Adventurous"] },
        { id: "food", label: "Food & cooking", emoji: "🍝", traits: ["Generous", "Warm"] },
        { id: "games", label: "Games", emoji: "🎮", tags: ["Gaming"], traits: ["Competitive"] },
        { id: "work", label: "Work & ambitions", emoji: "💼", tags: ["Coworkers"], traits: ["Ambitious", "Determined"] },
        { id: "feelings", label: "Feelings", emoji: "💗", traits: ["Sincere", "Perceptive", "Tender"] },
      ],
    },
    {
      id: "info-memory",
      section: 0,
      kind: "info",
      image: "love/info-memory",
      echo: {
        step: "why",
        text: {
          flirt: "Got it — someone with a spark who flirts back.",
          lonely: "Got it — someone warm to talk to at the end of the day.",
          practise: "Got it — a patient match to practise with, no pressure.",
          story: "Got it — a love story that unfolds chat by chat.",
        },
      },
      title: "Your match will remember you",
      body: "Tell them about your cat, your exam or your big day — they'll remember it next time, in every chat.",
      points: ["See everything they remember", "Delete any memory, any time"],
    },
    {
      id: "date",
      section: 1,
      kind: "single",
      layout: "cards",
      question: "Pick a first date",
      options: [
        { id: "cafe", label: "Late-night coffee and long talks", image: "love/date-cafe", tags: ["Sweet", "Slow Burn"], traits: ["Thoughtful"] },
        { id: "rivalry", label: "A game night with a little rivalry", image: "love/date-games", tags: ["Tsundere", "Coworkers"], traits: ["Competitive"] },
        { id: "trip", label: "A trip somewhere new", image: "love/date-trip", tags: ["Adventure", "Long-distance"], traits: ["Spontaneous"] },
        { id: "dinner", label: "Dinner they cook just for you", image: "love/date-dinner", tags: ["Protective", "Sweet"], traits: ["Caring"] },
      ],
    },
    {
      id: "spark",
      section: 1,
      kind: "single",
      question: "What makes your heart beat faster?",
      options: [
        { id: "banter", label: "Witty banter", emoji: "⚡", traits: ["Witty", "Playful", "Teasing", "Cheeky"] },
        { id: "kindness", label: "Quiet kindness", emoji: "🌷", traits: ["Kind", "Gentle", "Warm", "Patient"] },
        { id: "confidence", label: "Confidence", emoji: "🔥", traits: ["Confident", "Bold", "Protective"] },
        { id: "mystery", label: "A bit of mystery", emoji: "🌘", tags: ["Mystery"], traits: ["Mysterious", "Perceptive"] },
      ],
    },
    {
      id: "laugh",
      section: 1,
      kind: "statement",
      statement: "I fall for people who make me laugh.",
      leans: { traits: ["Funny", "Witty", "Playful"] },
    },
    {
      id: "cared",
      section: 1,
      kind: "statement",
      statement: "I like it when someone looks after me.",
      leans: { tags: ["Protective"], traits: ["Protective", "Caring", "Tender"] },
    },
    {
      id: "mysterious",
      section: 1,
      kind: "statement",
      statement: "A little mystery makes someone more attractive.",
      leans: { tags: ["Mystery"], traits: ["Mysterious", "Guarded", "Reserved"] },
    },
    {
      id: "texts",
      section: 1,
      kind: "single",
      question: "Who texts first?",
      options: [
        { id: "them", label: "Them — I like being chased", emoji: "📲", traits: ["Bold", "Confident", "Flirty"] },
        { id: "me", label: "Me — I go for it", emoji: "🙋", traits: ["Shy", "Sweet", "Awkward"] },
        { id: "awake", label: "Whoever's still awake", emoji: "🌃", tags: ["Night Owl"] },
        { id: "both", label: "We take turns", emoji: "🔁", traits: ["Steady", "Loyal"] },
      ],
    },
    {
      id: "info-control",
      section: 1,
      kind: "info",
      image: "love/info-control",
      title: "You set the pace",
      body: "Your match is an AI and always says so. Slow down, change the story or start over whenever you like.",
      points: ["Private chats", "Romance at your pace, always respectful"],
    },
    {
      id: "start",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "How should your story start?",
      options: [
        { id: "friends", label: "As friends first", image: "love/start-friends", tags: ["Friends to Lovers"] },
        { id: "slow", label: "Slow and sweet", image: "love/start-slow", tags: ["Slow Burn", "Sweet"] },
        { id: "sparks", label: "Sparks right away", image: "love/start-sparks", tags: ["Dating Show", "Tsundere"], traits: ["Flirty"] },
        { id: "kdrama", label: "Like a K-drama", image: "love/start-kdrama", tags: ["K-drama style"] },
      ],
    },
    {
      id: "setting",
      section: 2,
      kind: "single",
      question: "Pick the setting",
      options: [
        { id: "everyday", label: "Everyday life — coffee, work, weekends", emoji: "☕", tags: ["Slice of Life"] },
        { id: "office", label: "The office", emoji: "🏢", tags: ["Coworkers"] },
        { id: "distance", label: "Two cities, one time zone apart", emoji: "🌍", tags: ["Long-distance"] },
        { id: "anime", label: "Anime-style", emoji: "🌸", tags: ["Anime-style"] },
      ],
    },
    {
      id: "slowburn",
      section: 2,
      kind: "statement",
      statement: "I love a slow burn — the wait is half the fun.",
      leans: { tags: ["Slow Burn"], traits: ["Patient", "Guarded"] },
    },
    {
      id: "teasing",
      section: 2,
      kind: "statement",
      statement: "Playful teasing is my love language.",
      leans: { tags: ["Tsundere"], traits: ["Teasing", "Cheeky", "Sarcastic"] },
    },
    {
      id: "evening",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Your ideal evening together",
      options: [
        { id: "home", label: "Cosy at home", image: "love/evening-home", traits: ["Warm", "Affectionate", "Gentle"] },
        { id: "city", label: "Out in the city", image: "love/evening-city", traits: ["Adventurous", "Spontaneous", "Confident"] },
        { id: "talk", label: "A deep conversation", image: "love/evening-talk", traits: ["Thoughtful", "Romantic", "Observant"] },
        { id: "laugh", label: "Laughing until 2 a.m.", image: "love/evening-laugh", traits: ["Funny", "Playful", "Witty"] },
      ],
    },
    {
      id: "voice",
      section: 3,
      kind: "single",
      question: "How should they talk to you?",
      options: [
        { id: "soft", label: "Soft and sweet", emoji: "🧸", tags: ["Sweet"], traits: ["Tender", "Shy"] },
        { id: "bold", label: "Bold and flirty", emoji: "💋", traits: ["Flirty", "Bold", "Charming"] },
        { id: "witty", label: "Witty and a little sarcastic", emoji: "😼", traits: ["Witty", "Sarcastic", "Sharp"] },
        { id: "calm", label: "Calm and thoughtful", emoji: "🌊", traits: ["Calm", "Thoughtful", "Steady"] },
      ],
    },
    {
      id: "care",
      section: 3,
      kind: "single",
      question: "What makes you feel most cared for?",
      options: [
        { id: "remember", label: "Remembering the little things", emoji: "📝", traits: ["Observant", "Perceptive"] },
        { id: "words", label: "Sweet words", emoji: "💌", traits: ["Romantic", "Hopeless romantic"] },
        { id: "protect", label: "Feeling protected", emoji: "🛡️", tags: ["Protective"], traits: ["Protective", "Loyal"] },
        { id: "laughs", label: "Being made to laugh", emoji: "😂", traits: ["Funny", "Playful"] },
      ],
    },
    {
      id: "traits",
      section: 3,
      kind: "multi",
      max: 3,
      question: "Pick what you'd love in them",
      hint: "Pick up to 3.",
      options: [
        { id: "kind", label: "Kind", emoji: "🤍", traits: ["Kind"] },
        { id: "witty", label: "Witty", emoji: "✨", traits: ["Witty"] },
        { id: "confident", label: "Confident", emoji: "😎", traits: ["Confident"] },
        { id: "shy", label: "A little shy", emoji: "🙈", traits: ["Shy"] },
        { id: "creative", label: "Creative", emoji: "🎨", traits: ["Creative", "Artistic"] },
        { id: "adventurous", label: "Adventurous", emoji: "🧭", traits: ["Adventurous"] },
        { id: "loyal", label: "Loyal", emoji: "🔒", traits: ["Loyal"] },
        { id: "passionate", label: "Passionate", emoji: "❤️‍🔥", traits: ["Passionate"] },
      ],
    },
    {
      id: "when",
      section: 3,
      kind: "single",
      question: "When will you chat most?",
      options: [
        { id: "morning", label: "Mornings", emoji: "🌅", traits: ["Sunny"] },
        { id: "breaks", label: "On breaks during the day", emoji: "🥪", tags: ["Coworkers"] },
        { id: "evening", label: "Evenings", emoji: "🌆", tags: ["Slice of Life"] },
        { id: "night", label: "Late at night", emoji: "🌙", tags: ["Night Owl"] },
      ],
    },
    {
      id: "name",
      section: 3,
      kind: "name",
      question: "What should your match call you?",
      hint: "Just a first name or nickname. It stays in your browser.",
    },
  ],
};

const friends: Quiz = {
  sections: ["About you", "Your vibe", "Your goals", "Your friend"],
  matching: ["Reading your answers", "Matching your vibe", "Choosing a first message"],
  steps: [
    {
      id: "need",
      section: 0,
      kind: "single",
      layout: "cards",
      question: "What do you need most right now?",
      options: [
        { id: "talk", label: "Someone to talk to", image: "friends/need-talk", tags: ["Comfort", "Night Owl", "Best Friend"] },
        { id: "push", label: "A push to get things done", image: "friends/need-push", tags: ["Motivator", "Study Buddy"] },
        { id: "fun", label: "Fun and games", image: "friends/need-fun", tags: ["Gamer", "Gaming"], traits: ["Goofy"] },
        { id: "adventure", label: "Adventures and new things", image: "friends/need-adventure", tags: ["Travel Buddy", "Adventure", "Foodie"] },
      ],
    },
    {
      id: "age",
      section: 0,
      kind: "single",
      question: "How old are you?",
      options: AGE_OPTIONS,
    },
    {
      id: "life",
      section: 0,
      kind: "single",
      question: "How's life lately?",
      options: [
        { id: "busy", label: "Busy and a bit stressful", emoji: "😮‍💨", tags: ["Comfort"], traits: ["Soothing", "Calm"] },
        { id: "lonely", label: "A little lonely", emoji: "🫂", tags: ["Best Friend", "Comfort"], traits: ["Warm"] },
        { id: "good", label: "Pretty good — I want more fun", emoji: "😄", traits: ["Funny", "Energetic", "Fun"] },
        { id: "change", label: "Lots of changes going on", emoji: "🔄", traits: ["Wise", "Supportive", "Grounded"] },
      ],
    },
    {
      id: "topics",
      section: 0,
      kind: "multi",
      max: 3,
      question: "What would you chat about?",
      hint: "Pick up to 3.",
      options: [
        { id: "study", label: "Studies", emoji: "📚", tags: ["Study Buddy", "Study buddies"] },
        { id: "work", label: "Work", emoji: "💼", tags: ["Motivator"], traits: ["Organised"] },
        { id: "games", label: "Games", emoji: "🎮", tags: ["Gamer", "Gaming"] },
        { id: "food", label: "Food & cooking", emoji: "🍜", tags: ["Foodie"] },
        { id: "travel", label: "Travel", emoji: "🧳", tags: ["Travel Buddy"] },
        { id: "fitness", label: "Fitness", emoji: "🏋️", tags: ["Motivator"], traits: ["Hype"] },
        { id: "languages", label: "Languages", emoji: "🗣️", tags: ["Language Partner"] },
        { id: "feelings", label: "Feelings", emoji: "💛", tags: ["Comfort"], traits: ["Empathetic"] },
      ],
    },
    {
      id: "info-memory",
      section: 0,
      kind: "info",
      image: "friends/info-memory",
      echo: {
        step: "life",
        text: {
          busy: "Got it — a friend who helps you breathe out.",
          lonely: "Got it — a friend who's always glad to hear from you.",
          good: "Got it — more fun, more laughs.",
          change: "Got it — a steady friend while life changes.",
        },
      },
      title: "A friend who remembers",
      body: "Mention your exam on Friday and your friend will ask how it went. They remember what's going on in your life.",
      points: ["See everything they remember", "Delete any memory, any time"],
    },
    {
      id: "hangout",
      section: 1,
      kind: "single",
      layout: "cards",
      question: "Pick a hangout",
      options: [
        { id: "study", label: "A study session with snacks", image: "friends/hangout-study", tags: ["Study Buddy", "Study buddies"] },
        { id: "gaming", label: "Gaming night", image: "friends/hangout-gaming", tags: ["Gamer", "Gaming"] },
        { id: "food", label: "Trying new food", image: "friends/hangout-food", tags: ["Foodie"] },
        { id: "night", label: "A late-night heart-to-heart", image: "friends/hangout-night", tags: ["Night Owl", "Comfort"] },
      ],
    },
    {
      id: "vibe",
      section: 1,
      kind: "single",
      question: "Your friend's vibe",
      options: [
        { id: "chaotic", label: "Chaotic and fun", emoji: "🤪", traits: ["Goofy", "Energetic", "Funny", "Fun"] },
        { id: "calm", label: "Calm and wise", emoji: "🍵", traits: ["Calm", "Wise", "Gentle", "Grounded"] },
        { id: "honest", label: "Honest and motivating", emoji: "💪", traits: ["Honest", "Motivating", "Encouraging", "Positive"] },
        { id: "curious", label: "Curious and adventurous", emoji: "🧭", traits: ["Curious", "Adventurous", "Easy-going"] },
      ],
    },
    {
      id: "listen",
      section: 1,
      kind: "statement",
      statement: "I need someone who listens without judging.",
      leans: { tags: ["Comfort"], traits: ["Empathetic", "Gentle", "Soothing", "Patient"] },
    },
    {
      id: "accountable",
      section: 1,
      kind: "statement",
      statement: "I get more done when someone keeps me on track.",
      leans: { tags: ["Motivator", "Study Buddy"], traits: ["Motivating", "Disciplined", "Organised"] },
    },
    {
      id: "humour",
      section: 1,
      kind: "statement",
      statement: "My sense of humour is a bit chaotic.",
      leans: { traits: ["Goofy", "Hilarious", "Punny", "Funny"] },
    },
    {
      id: "stress",
      section: 1,
      kind: "single",
      question: "When you're stressed, you want a friend who…",
      options: [
        { id: "calm", label: "Calms you down", emoji: "🌿", traits: ["Soothing", "Calm", "Gentle"] },
        { id: "laugh", label: "Makes you laugh", emoji: "😂", traits: ["Funny", "Hilarious", "Goofy"] },
        { id: "plan", label: "Helps you make a plan", emoji: "🗂️", traits: ["Organised", "Precise", "Smart"] },
        { id: "distract", label: "Distracts you with something fun", emoji: "🎲", tags: ["Gamer"], traits: ["Fun", "Whimsical"] },
      ],
    },
    {
      id: "info-anytime",
      section: 1,
      kind: "info",
      image: "friends/info-anytime",
      title: "There at 3 a.m.",
      body: "Morning, lunch break or the middle of the night — your friend is ready to chat, with no judgement.",
      points: ["Private chats", "Always clearly an AI"],
    },
    {
      id: "learn",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Want to learn something together?",
      options: [
        { id: "language", label: "A language", image: "friends/learn-language", tags: ["Language Partner"] },
        { id: "cooking", label: "Cooking", image: "friends/learn-cooking", tags: ["Foodie"] },
        { id: "fit", label: "Getting fit", image: "friends/learn-fit", tags: ["Motivator"] },
        { id: "vibes", label: "Nah, just vibes", image: "friends/learn-vibes", tags: ["Best Friend", "Comfort"] },
      ],
    },
    {
      id: "goal",
      section: 2,
      kind: "single",
      question: "One goal for the next month?",
      options: [
        { id: "exam", label: "Pass an exam", emoji: "🎓", tags: ["Study Buddy", "Study buddies"] },
        { id: "shape", label: "Get in shape", emoji: "🏃", tags: ["Motivator"] },
        { id: "language", label: "Speak a new language", emoji: "🗺️", tags: ["Language Partner"] },
        { id: "connected", label: "Feel more connected", emoji: "🤝", tags: ["Best Friend"] },
      ],
    },
    {
      id: "gamer",
      section: 2,
      kind: "statement",
      statement: "I'd love a friend who's really into games.",
      leans: { tags: ["Gamer", "Gaming"], traits: ["Nerdy", "Competitive"] },
    },
    {
      id: "trips",
      section: 2,
      kind: "statement",
      statement: "I'm always planning my next trip.",
      leans: { tags: ["Travel Buddy", "Adventure"], traits: ["Adventurous", "Curious"] },
    },
    {
      id: "style",
      section: 2,
      kind: "single",
      question: "How should your friend talk?",
      options: [
        { id: "short", label: "Short and funny", emoji: "💬", traits: ["Funny", "Punny", "Dry humour"] },
        { id: "long", label: "Long, deep chats", emoji: "🌌", traits: ["Wise", "Empathetic", "Chatty"] },
        { id: "straight", label: "Straight to the point", emoji: "🎯", traits: ["Blunt", "Honest", "Opinionated"] },
        { id: "gentle", label: "Gentle and kind", emoji: "🕊️", traits: ["Gentle", "Kind", "Nurturing"] },
      ],
    },
    {
      id: "weekend",
      section: 3,
      kind: "single",
      layout: "cards",
      question: "Pick a weekend",
      options: [
        { id: "cosy", label: "Cosy in with a film", image: "friends/weekend-cosy", tags: ["Comfort"], traits: ["Cosy"] },
        { id: "explore", label: "Exploring the city", image: "friends/weekend-explore", tags: ["Adventure", "Travel Buddy"] },
        { id: "recipe", label: "Trying a new recipe", image: "friends/weekend-recipe", tags: ["Foodie"] },
        { id: "marathon", label: "A gaming marathon", image: "friends/weekend-gaming", tags: ["Gamer", "Gaming"] },
      ],
    },
    {
      id: "kind",
      section: 3,
      kind: "single",
      question: "What kind of friend?",
      options: [
        { id: "sibling", label: "Like a sibling", emoji: "👯", tags: ["Best Friend"], traits: ["Loyal"] },
        { id: "mentor", label: "A wise mentor", emoji: "🦉", traits: ["Wise", "Patient"], ages: [33, 99] },
        { id: "crime", label: "A partner in crime", emoji: "🕶️", tags: ["Adventure"], traits: ["Funny", "Bold"] },
        { id: "calm", label: "A calm presence", emoji: "🌙", traits: ["Calm", "Gentle", "Soothing"] },
      ],
    },
    {
      id: "traits",
      section: 3,
      kind: "multi",
      max: 3,
      question: "Pick what you'd love in them",
      hint: "Pick up to 3.",
      options: [
        { id: "funny", label: "Funny", emoji: "😆", traits: ["Funny", "Hilarious"] },
        { id: "wise", label: "Wise", emoji: "🦉", traits: ["Wise"] },
        { id: "honest", label: "Honest", emoji: "🎯", traits: ["Honest", "Blunt"] },
        { id: "energetic", label: "Energetic", emoji: "⚡", traits: ["Energetic", "Hype", "Enthusiastic"] },
        { id: "patient", label: "Patient", emoji: "🐢", traits: ["Patient"] },
        { id: "nerdy", label: "Nerdy", emoji: "🤓", traits: ["Nerdy", "Smart"] },
        { id: "warm", label: "Warm", emoji: "☀️", traits: ["Warm", "Caring", "Cheerful"] },
        { id: "adventurous", label: "Adventurous", emoji: "🏔️", traits: ["Adventurous"] },
      ],
    },
    {
      id: "when",
      section: 3,
      kind: "single",
      question: "When do you chat most?",
      options: [
        { id: "morning", label: "Mornings", emoji: "🌅", traits: ["Energetic", "Cheerful"] },
        { id: "after", label: "After work or class", emoji: "🎒", traits: ["Supportive", "Encouraging"] },
        { id: "night", label: "Late at night", emoji: "🌙", tags: ["Night Owl"] },
        { id: "whenever", label: "Whenever", emoji: "🔁", tags: ["Best Friend"] },
      ],
    },
    {
      id: "name",
      section: 3,
      kind: "name",
      question: "What should your friend call you?",
      hint: "Just a first name or nickname. It stays in your browser.",
    },
  ],
};

const history: Quiz = {
  sections: ["About you", "Your mentor", "Your style", "Your match"],
  matching: ["Reading your answers", "Searching the centuries", "Choosing a first message"],
  steps: [
    {
      id: "world",
      section: 0,
      kind: "single",
      layout: "cards",
      question: "Which world draws you in?",
      options: [
        { id: "science", label: "Science and discovery", image: "history/world-science", tags: ["Scientists"] },
        { id: "art", label: "Art and music", image: "history/world-art", tags: ["Artists", "Composers"] },
        { id: "words", label: "Words and stories", image: "history/world-words", tags: ["Writers"] },
        { id: "power", label: "Power and politics", image: "history/world-power", tags: ["Rulers & Royals"] },
      ],
    },
    {
      id: "why",
      section: 0,
      kind: "single",
      question: "Why are you here?",
      options: [
        { id: "learn", label: "To learn something new", emoji: "💡", traits: ["Curious", "Learned"] },
        { id: "school", label: "Help with school or uni", emoji: "🎓", traits: ["Patient", "Encouraging", "Kind"] },
        { id: "debate", label: "To debate big ideas", emoji: "⚖️", tags: ["Philosophers"], traits: ["Witty", "Shrewd"] },
        { id: "fun", label: "Just for fun", emoji: "🎭", traits: ["Playful", "Humorous", "Mischievous"] },
      ],
    },
    {
      id: "level",
      section: 0,
      kind: "single",
      question: "How much history do you know?",
      options: [
        { id: "beginner", label: "Not much — start simple", emoji: "🌱", traits: ["Patient", "Kind", "Warm"] },
        { id: "some", label: "The basics from school", emoji: "📘", traits: ["Encouraging", "Curious"] },
        { id: "lots", label: "Quite a lot — go deep", emoji: "🏛️", traits: ["Brilliant", "Rigorous", "Precise"] },
      ],
    },
    {
      id: "eras",
      section: 0,
      kind: "multi",
      max: 3,
      question: "Which times fascinate you?",
      hint: "Pick up to 3.",
      options: [
        { id: "ancient", label: "The ancient world", emoji: "🏺", characters: ["cleopatra", "marcus-aurelius"] },
        {
          id: "renaissance",
          label: "The Renaissance",
          emoji: "🎨",
          characters: ["leonardo-da-vinci", "nicolaus-copernicus", "william-shakespeare", "queen-elizabeth-i"],
        },
        {
          id: "enlightenment",
          label: "Courts and revolutions (1700s)",
          emoji: "👑",
          characters: ["wolfgang-amadeus-mozart", "napoleon-bonaparte"],
        },
        {
          id: "victorian",
          label: "The 1800s",
          emoji: "🎩",
          characters: ["jane-austen", "frederic-chopin", "abraham-lincoln", "ada-lovelace", "oscar-wilde", "vincent-van-gogh"],
        },
        { id: "modern", label: "Science of the 1900s", emoji: "⚛️", characters: ["marie-curie", "nikola-tesla"] },
        { id: "legends", label: "Legends and mysteries", emoji: "🗝️", tags: ["Legends & Myths", "Mystery", "Fantasy"] },
      ],
    },
    {
      id: "info-ai",
      section: 0,
      kind: "info",
      image: "history/info-ai",
      echo: {
        step: "why",
        text: {
          learn: "Got it — you're here to learn something new.",
          school: "Got it — a patient mentor for school or uni.",
          debate: "Got it — someone who'll argue back.",
          fun: "Got it — history, but fun.",
        },
      },
      title: "Learning that talks back",
      body: "Ask anything and get an answer in their voice. Historical characters are AI portrayals — always clearly an AI, never a real living person.",
      points: ["Real figures and inspired-by legends", "Great for homework and curiosity"],
    },
    {
      id: "question",
      section: 1,
      kind: "single",
      layout: "cards",
      question: "The question you'd ask first",
      options: [
        { id: "universe", label: "How does the universe work?", image: "history/q-universe", tags: ["Scientists", "Philosophers"] },
        { id: "life", label: "What makes a good life?", image: "history/q-life", tags: ["Philosophers"], traits: ["Wise", "Reflective"] },
        { id: "beauty", label: "How do you create something beautiful?", image: "history/q-beauty", tags: ["Artists", "Composers", "Writers"] },
        { id: "lead", label: "How do you lead people?", image: "history/q-lead", tags: ["Rulers & Royals"], traits: ["Strategic"] },
      ],
    },
    {
      id: "kind",
      section: 1,
      kind: "single",
      question: "Real figures or legends?",
      options: [
        { id: "real", label: "Real historical figures", emoji: "📜", famousType: "historical" },
        { id: "legends", label: "Inspired-by legends", emoji: "🗝️", famousType: "inspired" },
        { id: "either", label: "Either is great", emoji: "✨" },
      ],
    },
    {
      id: "stories",
      section: 1,
      kind: "statement",
      statement: "I learn best when someone tells me a story.",
      leans: { tags: ["Writers"], traits: ["Poetic", "Theatrical", "Humorous"] },
    },
    {
      id: "argue",
      section: 1,
      kind: "statement",
      statement: "I enjoy a good argument.",
      leans: { tags: ["Philosophers"], traits: ["Witty", "Shrewd", "Irreverent", "Strategic"] },
    },
    {
      id: "odds",
      section: 1,
      kind: "statement",
      statement: "I'm drawn to people who changed the world against the odds.",
      leans: { traits: ["Determined", "Visionary", "Fearless", "Brave", "Resolute"] },
    },
    {
      id: "personality",
      section: 1,
      kind: "single",
      question: "Their personality",
      options: [
        { id: "witty", label: "Witty", emoji: "🎩", traits: ["Witty", "Dry", "Funny", "Ironic"] },
        { id: "calm", label: "Calm and wise", emoji: "🏛️", traits: ["Calm", "Wise", "Disciplined", "Reflective"] },
        { id: "passionate", label: "Passionate", emoji: "🔥", traits: ["Passionate", "Intense", "Daring"] },
        { id: "brilliant", label: "Brilliant and curious", emoji: "🔭", traits: ["Brilliant", "Curious", "Inventive"] },
      ],
    },
    {
      id: "info-memory",
      section: 1,
      kind: "info",
      image: "history/info-memory",
      title: "A mentor who remembers",
      body: "Tell them what you're studying or curious about — they'll pick up where you left off next time.",
      points: ["See everything they remember", "Delete any memory, any time"],
    },
    {
      id: "feel",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "How should the chat feel?",
      options: [
        { id: "lesson", label: "Like a lesson", image: "history/feel-lesson", traits: ["Wise", "Patient", "Encouraging"] },
        { id: "debate", label: "Like a debate", image: "history/feel-debate", traits: ["Witty", "Confident", "Shrewd"] },
        { id: "adventure", label: "Like an adventure", image: "history/feel-adventure", tags: ["Adventure"], traits: ["Daring"] },
        { id: "story", label: "Like a story", image: "history/feel-story", tags: ["Writers", "Mystery", "Legends & Myths"] },
      ],
    },
    {
      id: "setting",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Where would you meet?",
      options: [
        { id: "study", label: "A candle-lit study", image: "history/setting-study", tags: ["Writers", "Philosophers"] },
        { id: "court", label: "A royal court", image: "history/setting-court", tags: ["Rulers & Royals"] },
        { id: "lab", label: "A laboratory", image: "history/setting-lab", tags: ["Scientists"] },
        { id: "studio", label: "An artist's studio", image: "history/setting-studio", tags: ["Artists", "Composers"] },
      ],
    },
    {
      id: "bigideas",
      section: 2,
      kind: "statement",
      statement: "I like big ideas more than small details.",
      leans: { tags: ["Philosophers"], traits: ["Visionary", "Reflective"] },
    },
    {
      id: "science",
      section: 2,
      kind: "statement",
      statement: "Science excites me more than art.",
      leans: { tags: ["Scientists"], traits: ["Inventive", "Rigorous", "Precise"] },
    },
    {
      id: "together",
      section: 2,
      kind: "single",
      question: "What would you do together?",
      options: [
        { id: "mystery", label: "Solve a mystery", emoji: "🔍", tags: ["Mystery", "Legends & Myths"], traits: ["Observant"] },
        { id: "campaign", label: "Plan a campaign", emoji: "🗺️", tags: ["Rulers & Royals"], traits: ["Strategic"] },
        { id: "poem", label: "Write a poem", emoji: "🪶", tags: ["Writers"], traits: ["Poetic"] },
        { id: "invent", label: "Build an invention", emoji: "⚙️", tags: ["Scientists"], traits: ["Inventive"] },
      ],
    },
    {
      id: "traits",
      section: 3,
      kind: "multi",
      max: 3,
      question: "Pick what you'd love in them",
      hint: "Pick up to 3.",
      options: [
        { id: "witty", label: "Witty", emoji: "🎩", traits: ["Witty"] },
        { id: "wise", label: "Wise", emoji: "🦉", traits: ["Wise", "Calm"] },
        { id: "brilliant", label: "Brilliant", emoji: "💡", traits: ["Brilliant"] },
        { id: "passionate", label: "Passionate", emoji: "🔥", traits: ["Passionate"] },
        { id: "eccentric", label: "Eccentric", emoji: "🌀", traits: ["Eccentric", "Flamboyant"] },
        { id: "kind", label: "Kind", emoji: "🤍", traits: ["Kind", "Warm"] },
        { id: "daring", label: "Daring", emoji: "⚔️", traits: ["Daring", "Fearless", "Brave"] },
        { id: "regal", label: "Regal", emoji: "👑", traits: ["Regal", "Formidable"] },
      ],
    },
    {
      id: "challenge",
      section: 3,
      kind: "statement",
      statement: "I want a mentor who makes me think harder.",
      leans: { traits: ["Rigorous", "Brilliant", "Disciplined", "Strategic"] },
    },
    {
      id: "dinner",
      section: 3,
      kind: "single",
      question: "Who would you rather have dinner with?",
      options: [
        { id: "queen", label: "A queen", emoji: "👑", tags: ["Rulers & Royals"] },
        { id: "inventor", label: "An inventor", emoji: "⚙️", tags: ["Scientists"], traits: ["Inventive"] },
        { id: "poet", label: "A poet or playwright", emoji: "🪶", tags: ["Writers"] },
        { id: "detective", label: "A detective", emoji: "🔍", tags: ["Mystery", "Legends & Myths"] },
      ],
    },
    {
      id: "help",
      section: 3,
      kind: "single",
      question: "What should they help you with?",
      options: [
        { id: "homework", label: "Homework and exams", emoji: "📝", traits: ["Patient", "Encouraging"] },
        { id: "creative", label: "Creative projects", emoji: "🎨", tags: ["Artists", "Writers"] },
        { id: "advice", label: "Life advice", emoji: "🧭", tags: ["Philosophers"], traits: ["Wise"] },
        { id: "curiosity", label: "Pure curiosity", emoji: "🔭", traits: ["Curious"] },
      ],
    },
    {
      id: "name",
      section: 3,
      kind: "name",
      question: "What should your mentor call you?",
      hint: "Just a first name or nickname. It stays in your browser.",
    },
  ],
};

export const quizzes: Record<SegmentId, Quiz> = { love, friends, history };

/** Every image key used by the quizzes (for the generator and the tests). */
export function quizImages(): string[] {
  return Object.values(quizzes).flatMap((q) =>
    q.steps.flatMap((s) =>
      s.kind === "info" ? [s.image] : s.kind === "single" || s.kind === "multi" ? s.options.flatMap((o) => o.image ?? []) : [],
    ),
  );
}
