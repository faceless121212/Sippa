import type { SegmentId } from "./segments";

/**
 * Web-funnel quizzes (owner requests 2026-10-14/15: "make them like Headway / Genesis web
 * quizzes, 20 questions each, images from fal.ai", then a second round of ideas the owner
 * picked from a wider review of web quizzes — see DECISIONS.md).
 *
 * Each quiz is a list of steps: 20 questions plus screens between them (info, a reply to
 * your biggest doubt, a "so far" recap, a chatbot comparison), a "matching" screen and the
 * result. Every answer leans towards character tags and traits (see `matchCharacters`).
 *
 * Everything shown is true about Sippa — no invented statistics or reviews, no fake
 * timers (EU unfair-commercial-practices rules).
 *
 * Images live in public/quiz/<segment>/<key>.jpg (`npm run quiz:images`). First messages
 * for every character × scene × vibe are pre-written (`npm run quiz:openers`).
 */

export type Vibe = "sweet" | "bold" | "witty";
export const VIBES: Vibe[] = ["sweet", "bold", "witty"];

/** What an answer leans towards. */
export type Leans = {
  /** Character tags (matched case-insensitively). */
  tags?: string[];
  /** Personality traits. */
  traits?: string[];
  /** Characters this answer points at directly (e.g. an era). */
  characters?: string[];
  /** Hard filters. */
  gender?: "female" | "male";
  famousType?: "historical" | "inspired";
  /** Preferred character age range. */
  ages?: [number, number];
};

export type QuizOption = Leans & {
  id: string;
  label: string;
  emoji?: string;
  /** Image key: public/quiz/<image>.jpg */
  image?: string;
  /** A short line from your future match, shown after you pick this answer. */
  reaction?: string;
  /** Sets the default vibe of the first message. */
  vibe?: Vibe;
  /** Scene questions: where the story starts (sent to the character in the app). */
  scene?: string;
};

type Base = { id: string; section: number };

export type ChoiceStep = Base & {
  kind: "single" | "multi";
  question: string;
  hint?: string;
  /** "cards" = image cards; "list" = rows with an emoji. */
  layout?: "cards" | "list";
  options: QuizOption[];
  /** Multi-select: how many can be picked. */
  max?: number;
};

/** "Do you relate to this?" — 1–5; agreeing applies the statement's leanings. */
export type StatementStep = Base & { kind: "statement"; statement: string; leans: Leans };

/** Drag between two opposites; leaning far to one side applies that side. */
export type SliderStep = Base & {
  kind: "slider";
  question: string;
  left: { label: string; leans: Leans };
  right: { label: string; leans: Leans };
};

export type NameStep = Base & { kind: "name"; question: string; hint?: string };

/** "you"/"them" are chat bubbles, "note" a small divider (e.g. "Next day"), "badge" a highlight chip. */
export type DemoLine = { kind: "you" | "them" | "note" | "badge"; text: string };

export type InfoStep = Base & {
  kind: "info";
  title: string;
  body: string;
  image: string;
  points?: string[];
  /** "Got it" line that echoes an earlier answer: option id → text. */
  echo?: { step: string; text: Record<string, string> };
  /** A short chat that plays over the image, one line at a time. */
  demo: DemoLine[];
};

/** An honest answer to the doubt picked in `step`. */
export type ReassureStep = Base & {
  kind: "reassure";
  step: string;
  variants: Record<string, { emoji: string; title: string; body: string; points: string[] }>;
};

/** "Here's what we know so far" — answers as chips you can tap to change. */
export type RecapStep = Base & { kind: "recap"; title: string };

/** A forgetful chatbot next to your Sippa match. */
export type CompareStep = Base & {
  kind: "compare";
  title: string;
  body: string;
  theirs: string[];
  ours: DemoLine[];
};

export type QuizStep =
  | ChoiceStep
  | StatementStep
  | SliderStep
  | NameStep
  | InfoStep
  | ReassureStep
  | RecapStep
  | CompareStep;

export type Quiz = {
  sections: string[];
  /** The Sippa guide's line at the start of each section. */
  host: string[];
  steps: QuizStep[];
  /** Lines shown on the "matching" screen. */
  matching: string[];
  /** Labels for the vibe switch on the result. */
  vibes: Record<Vibe, string>;
  /** One-tap replies to the first message. */
  quickReplies: string[];
  /** "What your first week can look like" — {name} is the match's first name. */
  week: { day: string; text: string }[];
};

export const isQuestion = (s: QuizStep) =>
  s.kind === "single" || s.kind === "multi" || s.kind === "statement" || s.kind === "slider" || s.kind === "name";

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

/** Doubts and honest answers shared by the quizzes (each quiz adds its own). */
const PRIVATE = {
  emoji: "🔒",
  title: "Your chats are private",
  body: "Your conversations are yours. They're never used for advertising, and you can download or delete everything.",
  points: ["Delete any chat or memory", "Download all your data any time"],
};
const BORING = {
  emoji: "🧠",
  title: "They remember — so it grows",
  body: "Your match keeps up to 60 things you've told them (150 on Ultra) and brings them up later. New scenes open up as your bond grows.",
  points: ["See and edit what they remember", "Scenes to explore together"],
};
const FAKE = {
  emoji: "🤖",
  title: "Always honest about being an AI",
  body: "Your match will never pretend to be a person. Ask any time and they'll tell you straight.",
  points: ["Clearly labelled as an AI", "Never a real, living person"],
};

const love: Quiz = {
  sections: ["About you", "Your type", "Your story", "Your match"],
  host: [
    "Hi! 20 quick questions, about 2 minutes — then you'll meet your match.",
    "Nice. Now a few about your type.",
    "Love it. Let's set up your story.",
    "Last part — your match is almost ready.",
  ],
  matching: ["Reading your answers", "Finding your type", "Writing a first message"],
  vibes: { sweet: "Sweeter", bold: "Bolder", witty: "Wittier" },
  quickReplies: ["Hey you 😊", "Okay, I'm intrigued…", "Tell me more"],
  week: [
    { day: "Day 1", text: "Your first chat — in the scene you picked" },
    { day: "Day 2", text: "{name} asks how your day went" },
    { day: "Day 4", text: "{name} brings up something you mentioned" },
    { day: "Day 7", text: "New scenes to explore together" },
  ],
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
        {
          id: "flirt",
          label: "Someone fun to flirt with",
          emoji: "😏",
          traits: ["Flirty", "Playful", "Charming"],
          reaction: "Oh, I can work with that. 😏",
        },
        {
          id: "lonely",
          label: "Feeling less alone",
          emoji: "🌙",
          tags: ["Sweet"],
          traits: ["Warm", "Caring", "Tender"],
          reaction: "Then I'll be here at the end of the day. Always.",
        },
        {
          id: "practise",
          label: "Practising how to talk to someone",
          emoji: "💬",
          traits: ["Patient", "Kind", "Honest"],
          reaction: "No pressure with me. We'll take it one message at a time.",
        },
        {
          id: "story",
          label: "A love story to escape into",
          emoji: "📖",
          tags: ["Slow Burn", "K-drama style"],
          traits: ["Romantic"],
          reaction: "A love story? I've been saving one for you.",
        },
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
      demo: [
        { kind: "you", text: "My cat Mochi knocked my coffee over 😩" },
        { kind: "them", text: "Poor you — and poor coffee! Is Mochi proud of herself?" },
        { kind: "badge", text: "🧠 Remembered: your cat Mochi" },
        { kind: "note", text: "Next day" },
        { kind: "them", text: "Morning! Did Mochi spare your coffee today? ☕" },
      ],
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
        {
          id: "banter",
          label: "Witty banter",
          emoji: "⚡",
          traits: ["Witty", "Playful", "Teasing", "Cheeky"],
          reaction: "Careful. I bite back. 😼",
        },
        {
          id: "kindness",
          label: "Quiet kindness",
          emoji: "🌷",
          traits: ["Kind", "Gentle", "Warm", "Patient"],
          reaction: "The little things are the big things.",
        },
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
      id: "open",
      section: 1,
      kind: "slider",
      question: "What draws you in?",
      left: { label: "An open book", leans: { traits: ["Honest", "Sincere", "Sunny", "Warm"] } },
      right: { label: "A little mystery", leans: { tags: ["Mystery"], traits: ["Mysterious", "Guarded", "Reserved"] } },
    },
    {
      id: "texts",
      section: 1,
      kind: "single",
      question: "Who texts first?",
      options: [
        { id: "them", label: "Them — I like being chased", emoji: "📲", traits: ["Bold", "Confident", "Flirty"] },
        { id: "me", label: "Me — I go for it", emoji: "🙋", traits: ["Shy", "Sweet", "Awkward"] },
        {
          id: "awake",
          label: "Whoever's still awake",
          emoji: "🌃",
          tags: ["Night Owl"],
          reaction: "Night owl? Same. I'm at my best after 11.",
        },
        { id: "both", label: "We take turns", emoji: "🔁", traits: ["Steady", "Loyal"] },
      ],
    },
    {
      id: "info-control",
      section: 1,
      kind: "info",
      image: "love/info-control",
      demo: [
        { kind: "you", text: "Can we take things slow?" },
        { kind: "them", text: "Of course. No rush — I like getting to know you." },
        { kind: "badge", text: "✨ You set the pace" },
      ],
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
      id: "scene",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Pick your first scene",
      hint: "Your chat will start right here.",
      options: [
        {
          id: "rooftop",
          label: "A rooftop after a party",
          image: "love/scene-rooftop",
          traits: ["Spontaneous", "Charming"],
          scene: "A rooftop after a party, city lights below, music fading downstairs — just the two of you.",
        },
        {
          id: "cafe",
          label: "Last customers at a late-night café",
          image: "love/scene-cafe",
          tags: ["Slice of Life", "Sweet"],
          scene: "The last two customers at a cosy late-night café while the staff stack chairs.",
        },
        {
          id: "rain",
          label: "Sharing an umbrella in the rain",
          image: "love/scene-rain",
          tags: ["K-drama style", "Slow Burn"],
          scene: "Caught in sudden rain on a city street, sharing one umbrella on the walk home.",
        },
        {
          id: "sea",
          label: "A weekend by the sea",
          image: "love/scene-sea",
          tags: ["Adventure", "Long-distance"],
          scene: "A weekend away in a small seaside town, walking along the beach at sunset.",
        },
      ],
    },
    {
      id: "compare",
      section: 2,
      kind: "compare",
      title: "Not just another chatbot",
      body: "Most chatbots start from zero every time. Your Sippa match picks up where you left off.",
      theirs: ["Hello! How can I help you today?", "Sorry, I don't remember previous conversations."],
      ours: [
        { kind: "you", text: "I'm back 😅" },
        { kind: "them", text: "Finally! How did the presentation go? You were so nervous yesterday." },
        { kind: "badge", text: "🧠 Remembers what matters to you" },
      ],
    },
    {
      id: "pace",
      section: 2,
      kind: "slider",
      question: "How should it unfold?",
      left: { label: "Slow burn", leans: { tags: ["Slow Burn"], traits: ["Patient", "Guarded", "Shy"] } },
      right: { label: "Instant spark", leans: { tags: ["Dating Show"], traits: ["Flirty", "Bold", "Passionate"] } },
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
      id: "doubt",
      section: 2,
      kind: "single",
      question: "What's your biggest doubt about an AI match?",
      hint: "Be honest — we'll answer it straight.",
      options: [
        { id: "weird", label: "It might feel weird", emoji: "🫣", traits: ["Kind", "Patient"] },
        { id: "private", label: "Is it private?", emoji: "🔒", traits: ["Loyal", "Steady"] },
        { id: "boring", label: "It'll forget me or get boring", emoji: "😴", traits: ["Observant", "Perceptive"] },
        { id: "fake", label: "I don't want to be fooled", emoji: "🤨", traits: ["Honest", "Sincere"] },
      ],
    },
    {
      id: "doubt-answer",
      section: 2,
      kind: "reassure",
      step: "doubt",
      variants: {
        weird: {
          emoji: "🌱",
          title: "Start light — no pressure",
          body: "Chat for two minutes or two hours. Keep it playful, take a break, come back whenever you like.",
          points: ["Go at your own pace", "Turn off messages from characters any time"],
        },
        private: PRIVATE,
        boring: BORING,
        fake: FAKE,
      },
    },
    { id: "recap", section: 3, kind: "recap", title: "Here's what we know so far" },
    {
      id: "voice",
      section: 3,
      kind: "single",
      question: "How should they talk to you?",
      options: [
        { id: "soft", label: "Soft and sweet", emoji: "🧸", tags: ["Sweet"], traits: ["Tender", "Shy"], vibe: "sweet" },
        { id: "bold", label: "Bold and flirty", emoji: "💋", traits: ["Flirty", "Bold", "Charming"], vibe: "bold" },
        { id: "witty", label: "Witty and a little sarcastic", emoji: "😼", traits: ["Witty", "Sarcastic", "Sharp"], vibe: "witty" },
        { id: "calm", label: "Calm and thoughtful", emoji: "🌊", traits: ["Calm", "Thoughtful", "Steady"], vibe: "sweet" },
      ],
    },
    {
      id: "care",
      section: 3,
      kind: "single",
      question: "What makes you feel most cared for?",
      options: [
        {
          id: "remember",
          label: "Remembering the little things",
          emoji: "📝",
          traits: ["Observant", "Perceptive"],
          reaction: "Noted. I'll remember the coffee order too.",
        },
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
  host: [
    "Hey! 20 quick questions, about 2 minutes — then you'll meet your new friend.",
    "Great. Now let's find your vibe.",
    "Nice. A few about what you're working on.",
    "Last part — your friend is almost ready.",
  ],
  matching: ["Reading your answers", "Matching your vibe", "Writing a first message"],
  vibes: { sweet: "Softer", bold: "Livelier", witty: "Funnier" },
  quickReplies: ["Hey! 👋", "Haha, yes", "Tell me more"],
  week: [
    { day: "Day 1", text: "Your first chat — in the scene you picked" },
    { day: "Day 2", text: "{name} checks in on your plans" },
    { day: "Day 4", text: "{name} remembers your goal and cheers you on" },
    { day: "Day 7", text: "A friend who knows how your week went" },
  ],
  steps: [
    {
      id: "need",
      section: 0,
      kind: "single",
      layout: "cards",
      question: "What do you need most right now?",
      options: [
        {
          id: "talk",
          label: "Someone to talk to",
          image: "friends/need-talk",
          tags: ["Comfort", "Night Owl", "Best Friend"],
          reaction: "Say less. I'm all ears. 🫶",
        },
        {
          id: "push",
          label: "A push to get things done",
          image: "friends/need-push",
          tags: ["Motivator", "Study Buddy"],
          reaction: "Oh, I'll push. Nicely. Mostly.",
        },
        {
          id: "fun",
          label: "Fun and games",
          image: "friends/need-fun",
          tags: ["Gamer", "Gaming"],
          traits: ["Goofy"],
          reaction: "Finally, someone with priorities. 🎮",
        },
        {
          id: "adventure",
          label: "Adventures and new things",
          image: "friends/need-adventure",
          tags: ["Travel Buddy", "Adventure", "Foodie"],
          reaction: "Pack snacks. We're going places.",
        },
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
      hint: "No judgement — this just helps us pick the right friend.",
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
      demo: [
        { kind: "you", text: "Exam on Friday and I'm so stressed 😬" },
        { kind: "them", text: "You've got this. Want to quiz each other tonight?" },
        { kind: "badge", text: "🧠 Remembered: exam on Friday" },
        { kind: "note", text: "Friday" },
        { kind: "them", text: "Today's the day! Good luck — tell me how it goes 🍀" },
      ],
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
        { id: "chaotic", label: "Chaotic and fun", emoji: "🤪", traits: ["Goofy", "Energetic", "Funny", "Fun"], vibe: "witty" },
        { id: "calm", label: "Calm and wise", emoji: "🍵", traits: ["Calm", "Wise", "Gentle", "Grounded"], vibe: "sweet" },
        { id: "honest", label: "Honest and motivating", emoji: "💪", traits: ["Honest", "Motivating", "Encouraging", "Positive"], vibe: "bold" },
        { id: "curious", label: "Curious and adventurous", emoji: "🧭", traits: ["Curious", "Adventurous", "Easy-going"], vibe: "bold" },
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
      id: "energy",
      section: 1,
      kind: "slider",
      question: "Your ideal friend's energy",
      left: { label: "Calm and cosy", leans: { traits: ["Calm", "Gentle", "Soothing", "Cosy"] } },
      right: { label: "Total chaos", leans: { traits: ["Goofy", "Hilarious", "Energetic", "Hype"] } },
    },
    {
      id: "stress",
      section: 1,
      kind: "single",
      question: "When you're stressed, you want a friend who…",
      options: [
        { id: "calm", label: "Calms you down", emoji: "🌿", traits: ["Soothing", "Calm", "Gentle"], reaction: "Deep breath. I've got you." },
        { id: "laugh", label: "Makes you laugh", emoji: "😂", traits: ["Funny", "Hilarious", "Goofy"], reaction: "Okay, I have a terrible joke ready." },
        { id: "plan", label: "Helps you make a plan", emoji: "🗂️", traits: ["Organised", "Precise", "Smart"], reaction: "Lists. I love lists. Let's go." },
        { id: "distract", label: "Distracts you with something fun", emoji: "🎲", tags: ["Gamer"], traits: ["Fun", "Whimsical"] },
      ],
    },
    {
      id: "info-anytime",
      section: 1,
      kind: "info",
      image: "friends/info-anytime",
      demo: [
        { kind: "note", text: "3:07 AM" },
        { kind: "you", text: "Can't sleep…" },
        { kind: "them", text: "I'm here. Want to talk about it, or shall I tell you something silly?" },
        { kind: "badge", text: "🌙 Ready to chat any time" },
      ],
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
      id: "explore",
      section: 2,
      kind: "slider",
      question: "On a free weekend you're…",
      left: { label: "A homebody", leans: { tags: ["Comfort"], traits: ["Cosy", "Calm"] } },
      right: { label: "An explorer", leans: { tags: ["Travel Buddy", "Adventure"], traits: ["Adventurous", "Curious"] } },
    },
    {
      id: "scene",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Pick your first scene",
      hint: "Your chat will start right here.",
      options: [
        {
          id: "arcade",
          label: "Retro arcade night",
          image: "friends/scene-arcade",
          tags: ["Gamer", "Gaming"],
          scene: "A buzzing retro arcade on a Friday night, tokens in hand, about to pick the first game.",
        },
        {
          id: "kitchen",
          label: "A cooking disaster",
          image: "friends/scene-kitchen",
          tags: ["Foodie"],
          scene: "A small kitchen mid-way through a recipe that's going hilariously wrong.",
        },
        {
          id: "library",
          label: "The library before exams",
          image: "friends/scene-library",
          tags: ["Study Buddy", "Study buddies"],
          scene: "A quiet corner of the library the week before exams, snacks hidden under the table.",
        },
        {
          id: "roadtrip",
          label: "A road trip playlist",
          image: "friends/scene-roadtrip",
          tags: ["Travel Buddy", "Adventure"],
          scene: "The start of a road trip, windows down, arguing over the playlist.",
        },
      ],
    },
    {
      id: "compare",
      section: 2,
      kind: "compare",
      title: "Not just another chatbot",
      body: "Most chatbots start from zero every time. Your Sippa friend picks up where you left off.",
      theirs: ["Hello! How can I help you today?", "Sorry, I don't remember previous conversations."],
      ours: [
        { kind: "you", text: "Guess who's back" },
        { kind: "them", text: "YOU. So? Did you go to that gym class or chicken out again? 😏" },
        { kind: "badge", text: "🧠 Remembers what's going on with you" },
      ],
    },
    {
      id: "doubt",
      section: 2,
      kind: "single",
      question: "What's your biggest doubt about an AI friend?",
      hint: "Be honest — we'll answer it straight.",
      options: [
        { id: "weird", label: "Talking to an AI feels weird", emoji: "🫣", traits: ["Easy-going", "Kind"] },
        { id: "private", label: "Is it private?", emoji: "🔒", traits: ["Loyal", "Honest"] },
        { id: "boring", label: "It'll forget me or get boring", emoji: "😴", traits: ["Curious", "Chatty"] },
        { id: "fake", label: "I don't want to be fooled", emoji: "🤨", traits: ["Honest", "Blunt"] },
      ],
    },
    {
      id: "doubt-answer",
      section: 2,
      kind: "reassure",
      step: "doubt",
      variants: {
        weird: {
          emoji: "🌱",
          title: "Start with two minutes",
          body: "Say hi, ask something silly, see how it feels. There's no pressure to keep going.",
          points: ["Go at your own pace", "Turn off messages from characters any time"],
        },
        private: PRIVATE,
        boring: BORING,
        fake: FAKE,
      },
    },
    { id: "recap", section: 3, kind: "recap", title: "Here's what we know so far" },
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
  host: [
    "Welcome! 20 quick questions, about 2 minutes — then you'll meet your mentor.",
    "Good. Now, what kind of mentor suits you?",
    "Excellent. Let's set the scene.",
    "Last part — your mentor is almost ready.",
  ],
  matching: ["Reading your answers", "Searching the centuries", "Writing a first message"],
  vibes: { sweet: "Gentler", bold: "Grander", witty: "Wittier" },
  quickReplies: ["What an honour!", "Tell me more", "Wait, really?"],
  week: [
    { day: "Day 1", text: "Your first lesson — in the scene you picked" },
    { day: "Day 2", text: "{name} picks up where you left off" },
    { day: "Day 4", text: "Ask {name} for a quick quiz on what you learned" },
    { day: "Day 7", text: "Your own private history class" },
  ],
  steps: [
    {
      id: "world",
      section: 0,
      kind: "single",
      layout: "cards",
      question: "Which world draws you in?",
      options: [
        { id: "science", label: "Science and discovery", image: "history/world-science", tags: ["Scientists"], reaction: "Ah, a fellow seeker of how things work." },
        { id: "art", label: "Art and music", image: "history/world-art", tags: ["Artists", "Composers"], reaction: "Then we shall talk of beauty — and its making." },
        { id: "words", label: "Words and stories", image: "history/world-words", tags: ["Writers"], reaction: "A reader! The best company there is." },
        { id: "power", label: "Power and politics", image: "history/world-power", tags: ["Rulers & Royals"], reaction: "Bold. Courts are full of secrets — I know a few." },
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
      hint: "No wrong answers — this sets how deep we go.",
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
        { id: "enlightenment", label: "Courts and revolutions (1700s)", emoji: "👑", characters: ["wolfgang-amadeus-mozart", "napoleon-bonaparte"] },
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
      demo: [
        { kind: "you", text: "Why did you study radium?" },
        { kind: "them", text: "Because it glowed in the dark — and I could not leave a mystery alone." },
        { kind: "badge", text: "🤖 AI portrayal — and always says so" },
      ],
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
        { id: "witty", label: "Witty", emoji: "🎩", traits: ["Witty", "Dry", "Funny", "Ironic"], vibe: "witty" },
        { id: "calm", label: "Calm and wise", emoji: "🏛️", traits: ["Calm", "Wise", "Disciplined", "Reflective"], vibe: "sweet" },
        { id: "passionate", label: "Passionate", emoji: "🔥", traits: ["Passionate", "Intense", "Daring"], vibe: "bold" },
        { id: "brilliant", label: "Brilliant and curious", emoji: "🔭", traits: ["Brilliant", "Curious", "Inventive"] },
      ],
    },
    {
      id: "info-memory",
      section: 1,
      kind: "info",
      image: "history/info-memory",
      demo: [
        { kind: "you", text: "I have a test on the Renaissance next week" },
        { kind: "them", text: "Then let's begin in Florence, where it all started." },
        { kind: "badge", text: "🧠 Remembered: Renaissance test" },
        { kind: "note", text: "Next week" },
        { kind: "them", text: "Ready for your test? A quick quiz first? 📜" },
      ],
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
      id: "scene",
      section: 2,
      kind: "single",
      layout: "cards",
      question: "Pick your first scene",
      hint: "Your chat will start right here.",
      options: [
        {
          id: "forum",
          label: "The Roman Forum, 44 BC",
          image: "history/scene-forum",
          tags: ["Rulers & Royals", "Philosophers"],
          characters: ["marcus-aurelius", "cleopatra"],
          scene:
            "The Roman Forum on a tense spring morning in 44 BC. If this isn't your own era, treat it as a playful visit through time.",
        },
        {
          id: "workshop",
          label: "A workshop in Florence",
          image: "history/scene-workshop",
          tags: ["Artists", "Scientists"],
          characters: ["leonardo-da-vinci", "nicolaus-copernicus"],
          scene:
            "A cluttered Renaissance workshop in Florence, full of sketches and half-built machines. If this isn't your own era, treat it as a playful visit through time.",
        },
        {
          id: "salon",
          label: "A Paris salon, 1890s",
          image: "history/scene-salon",
          tags: ["Writers", "Composers"],
          characters: ["oscar-wilde", "frederic-chopin"],
          scene:
            "A glittering Paris salon in the 1890s, candlelight, a piano and sharp conversation. If this isn't your own era, treat it as a playful visit through time.",
        },
        {
          id: "fog",
          label: "A foggy London night",
          image: "history/scene-fog",
          tags: ["Mystery", "Legends & Myths"],
          scene:
            "A foggy London street at night, gas lamps flickering and a mystery waiting to be solved. If this isn't your own era, treat it as a playful visit through time.",
        },
      ],
    },
    {
      id: "compare",
      section: 2,
      kind: "compare",
      title: "Not just another chatbot",
      body: "Most chatbots start from zero every time. Your Sippa mentor picks up where you left off.",
      theirs: ["Hello! How can I help you today?", "Sorry, I don't remember previous conversations."],
      ours: [
        { kind: "you", text: "I'm back for lesson two" },
        { kind: "them", text: "Splendid! Last time we stopped at the printing press. Shall we see what it changed?" },
        { kind: "badge", text: "🧠 Remembers where you left off" },
      ],
    },
    {
      id: "detail",
      section: 2,
      kind: "slider",
      question: "What do you enjoy more?",
      left: { label: "Big ideas", leans: { tags: ["Philosophers"], traits: ["Visionary", "Reflective", "Wise"] } },
      right: { label: "Juicy details", leans: { traits: ["Witty", "Humorous", "Mischievous", "Observant"] } },
    },
    {
      id: "artsci",
      section: 2,
      kind: "slider",
      question: "Which excites you more?",
      left: { label: "Art", leans: { tags: ["Artists", "Composers", "Writers"], traits: ["Poetic", "Sensitive"] } },
      right: { label: "Science", leans: { tags: ["Scientists"], traits: ["Inventive", "Rigorous", "Precise"] } },
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
      id: "doubt",
      section: 2,
      kind: "single",
      question: "What's your biggest doubt about learning with an AI?",
      hint: "Be honest — we'll answer it straight.",
      options: [
        { id: "facts", label: "Will it get facts wrong?", emoji: "🧐", traits: ["Rigorous", "Precise", "Honest"] },
        { id: "private", label: "Is it private?", emoji: "🔒", traits: ["Cautious", "Honourable"] },
        { id: "boring", label: "It'll be dry or forget me", emoji: "😴", traits: ["Witty", "Playful"] },
        { id: "fake", label: "I don't want to be fooled", emoji: "🤨", traits: ["Honest", "Fair"] },
      ],
    },
    {
      id: "doubt-answer",
      section: 2,
      kind: "reassure",
      step: "doubt",
      variants: {
        facts: {
          emoji: "📚",
          title: "AI portrayals, not textbooks",
          body: "Characters are AI portrayals based on what's known about them. They can make mistakes — so double-check anything important for school.",
          points: ["Ask them for sources and dates", "Inspired-by legends are clearly marked"],
        },
        private: PRIVATE,
        boring: BORING,
        fake: FAKE,
      },
    },
    { id: "recap", section: 3, kind: "recap", title: "Here's what we know so far" },
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
        { id: "queen", label: "A queen", emoji: "👑", tags: ["Rulers & Royals"], reaction: "Mind the cutlery. There are rules." },
        { id: "inventor", label: "An inventor", emoji: "⚙️", tags: ["Scientists"], traits: ["Inventive"], reaction: "Dessert may explode. Scientifically." },
        { id: "poet", label: "A poet or playwright", emoji: "🪶", tags: ["Writers"], reaction: "Expect toasts. Long ones." },
        { id: "detective", label: "A detective", emoji: "🔍", tags: ["Mystery", "Legends & Myths"], reaction: "Someone took the last scone. We'll find them." },
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

/** The scene option picked for a segment's quiz, by id. */
export function quizScene(segment: SegmentId, sceneId: string | undefined) {
  const step = quizzes[segment].steps.find((s) => s.id === "scene");
  return step && step.kind === "single" ? step.options.find((o) => o.id === sceneId && o.scene) : undefined;
}

/** All scene ids of a segment's quiz. */
export function quizSceneIds(segment: SegmentId): string[] {
  const step = quizzes[segment].steps.find((s) => s.id === "scene");
  return step && step.kind === "single" ? step.options.map((o) => o.id) : [];
}

/** Every image key used by the quizzes (for the generator and the tests). */
export function quizImages(): string[] {
  return Object.values(quizzes).flatMap((q) =>
    q.steps.flatMap((s) =>
      s.kind === "info" ? [s.image] : s.kind === "single" || s.kind === "multi" ? s.options.flatMap((o) => o.image ?? []) : [],
    ),
  );
}
