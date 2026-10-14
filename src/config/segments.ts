import type { CategoryId } from "./categories";

/**
 * Audience segments (owner decision 2026-10-14, reviewer feedback on positioning):
 * one product, but a separate landing page and quiz per audience, so each ad campaign
 * speaks to one motivation — romance, friendship or history.
 */
export type SegmentId = "love" | "friends" | "history";

export type QuizOption = {
  label: string;
  /** Character tags this answer leans towards (matched case-insensitively). */
  tags?: string[];
  /** Personality traits this answer leans towards. */
  traits?: string[];
  /** Hard filters. */
  gender?: "female" | "male";
  famousType?: "historical" | "inspired";
};

export type QuizQuestion = { id: string; question: string; options: QuizOption[] };

export type Segment = {
  id: SegmentId;
  category: CategoryId;
  /** Landing page copy. */
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  points: string[];
  quizTitle: string;
  adultsOnly: boolean;
  questions: QuizQuestion[];
};

export const segments: Record<SegmentId, Segment> = {
  love: {
    id: "love",
    category: "lover",
    eyebrow: "Sippa Love · 18+",
    title: "Meet someone who",
    highlight: "remembers you.",
    subtitle:
      "Slow burns, sweet flirting and late-night talks with AI characters who remember your day — and ask about it tomorrow.",
    points: [
      "Remembers your name, your cat, your big day",
      "Romance at your pace, always respectful",
      "Private — and always clearly an AI",
    ],
    quizTitle: "Find your match in 60 seconds",
    adultsOnly: true,
    questions: [
      {
        id: "who",
        question: "Who would you like to meet?",
        options: [
          { label: "A woman", gender: "female" },
          { label: "A man", gender: "male" },
          { label: "Surprise me" },
        ],
      },
      {
        id: "date",
        question: "Pick a first date",
        options: [
          { label: "Late-night coffee and long talks", tags: ["Sweet", "Slow Burn"] },
          { label: "A little rivalry and a lot of banter", tags: ["Tsundere", "Coworkers", "Dating Show"] },
          { label: "A trip somewhere new", tags: ["Long-distance", "Adventure", "Slice of Life"] },
          { label: "Dinner they cook just for you", tags: ["Protective", "Sweet"] },
        ],
      },
      {
        id: "spark",
        question: "What makes your heart beat faster?",
        options: [
          { label: "Witty banter", traits: ["Witty", "Playful", "Teasing", "Cheeky"] },
          { label: "Quiet kindness", traits: ["Kind", "Gentle", "Warm", "Patient"] },
          { label: "Confidence", traits: ["Confident", "Bold", "Protective"] },
          { label: "A bit of mystery", tags: ["Mystery"], traits: ["Mysterious", "Perceptive"] },
        ],
      },
      {
        id: "start",
        question: "How should it start?",
        options: [
          { label: "As friends first", tags: ["Friends to Lovers"] },
          { label: "Slow and sweet", tags: ["Slow Burn", "Sweet"] },
          { label: "Sparks right away", tags: ["Dating Show", "Tsundere"] },
          { label: "Like a K-drama", tags: ["K-drama style"] },
        ],
      },
      {
        id: "evening",
        question: "Your ideal evening together",
        options: [
          { label: "Cosy at home", traits: ["Warm", "Affectionate", "Gentle"] },
          { label: "Out in the city", traits: ["Adventurous", "Spontaneous", "Confident"] },
          { label: "A deep conversation", traits: ["Thoughtful", "Romantic", "Observant"] },
          { label: "Laughing until 2 a.m.", traits: ["Funny", "Playful", "Witty"] },
        ],
      },
    ],
  },
  friends: {
    id: "friends",
    category: "friend",
    eyebrow: "Sippa Friends",
    title: "A friend who's",
    highlight: "always up for a chat.",
    subtitle:
      "Study buddies, gaming partners, night-owl listeners and gym hype-people — AI friends who remember what's going on in your life.",
    points: [
      "Remembers your exams, your goals, your bad days",
      "There at 3 a.m. — no judgement",
      "Private — and always clearly an AI",
    ],
    quizTitle: "Find your new friend in 60 seconds",
    adultsOnly: false,
    questions: [
      {
        id: "need",
        question: "What do you need most right now?",
        options: [
          { label: "Someone to talk to", tags: ["Comfort", "Night Owl", "Best Friend"] },
          { label: "A push to get things done", tags: ["Motivator", "Study Buddy"] },
          { label: "Fun and games", tags: ["Gamer", "Gaming"] },
          { label: "Adventures and new things", tags: ["Travel Buddy", "Adventure", "Foodie"] },
        ],
      },
      {
        id: "hangout",
        question: "Pick a hangout",
        options: [
          { label: "A study session with snacks", tags: ["Study Buddy", "Study buddies"] },
          { label: "Gaming night", tags: ["Gamer", "Gaming"] },
          { label: "Trying new food", tags: ["Foodie"] },
          { label: "A late-night heart-to-heart", tags: ["Night Owl", "Comfort"] },
        ],
      },
      {
        id: "vibe",
        question: "Your friend's vibe",
        options: [
          { label: "Chaotic and fun", traits: ["Chaotic", "Energetic", "Funny", "Fun"] },
          { label: "Calm and wise", traits: ["Calm", "Wise", "Gentle", "Grounded"] },
          { label: "Honest and motivating", traits: ["Honest", "Motivating", "Encouraging", "Positive"] },
          { label: "Curious and adventurous", traits: ["Curious", "Adventurous", "Easy-going"] },
        ],
      },
      {
        id: "learn",
        question: "Want to learn something together?",
        options: [
          { label: "A language", tags: ["Language Partner"] },
          { label: "Cooking", tags: ["Foodie"] },
          { label: "Getting fit", tags: ["Motivator"] },
          { label: "Nah, just vibes", tags: ["Best Friend", "Comfort"] },
        ],
      },
      {
        id: "when",
        question: "When do you chat most?",
        options: [
          { label: "Mornings", traits: ["Energetic", "Cheerful"] },
          { label: "After work or class", traits: ["Supportive", "Encouraging"] },
          { label: "Late at night", tags: ["Night Owl"] },
          { label: "Whenever", tags: ["Best Friend"] },
        ],
      },
    ],
  },
  history: {
    id: "history",
    category: "famous",
    eyebrow: "Sippa History",
    title: "Ask history's greatest minds",
    highlight: "anything.",
    subtitle:
      "Debate Marcus Aurelius, talk radium with Marie Curie, or solve a case with a Victorian detective. Learning that talks back.",
    points: [
      "Real historical figures and inspired-by legends",
      "Remembers what you're curious about",
      "Always clearly an AI — never a real living person",
    ],
    quizTitle: "Find your mentor in 60 seconds",
    adultsOnly: false,
    questions: [
      {
        id: "world",
        question: "Which world draws you in?",
        options: [
          { label: "Science and discovery", tags: ["Scientists"] },
          { label: "Art and music", tags: ["Artists", "Composers"] },
          { label: "Words and stories", tags: ["Writers"] },
          { label: "Power and politics", tags: ["Rulers & Royals"] },
        ],
      },
      {
        id: "question",
        question: "The question you'd ask first",
        options: [
          { label: "How does the universe work?", tags: ["Scientists", "Philosophers"] },
          { label: "What makes a good life?", tags: ["Philosophers"] },
          { label: "How do you create something beautiful?", tags: ["Artists", "Composers", "Writers"] },
          { label: "How do you lead people?", tags: ["Rulers & Royals"] },
        ],
      },
      {
        id: "kind",
        question: "Real figures or legends?",
        options: [
          { label: "Real historical figures", famousType: "historical" },
          { label: "Inspired-by legends", famousType: "inspired" },
          { label: "Either is great" },
        ],
      },
      {
        id: "personality",
        question: "Their personality",
        options: [
          { label: "Witty", traits: ["Witty", "Dry", "Funny"] },
          { label: "Calm and wise", traits: ["Calm", "Wise", "Stoic", "Disciplined"] },
          { label: "Passionate", traits: ["Passionate", "Dramatic", "Daring"] },
          { label: "Brilliant and curious", traits: ["Brilliant", "Curious", "Inventive"] },
        ],
      },
      {
        id: "feel",
        question: "How should the chat feel?",
        options: [
          { label: "Like a lesson", traits: ["Wise", "Patient", "Encouraging"] },
          { label: "Like a debate", traits: ["Witty", "Confident", "Bold"] },
          { label: "Like an adventure", tags: ["Adventure"] },
          { label: "Like a story", tags: ["Writers", "Mystery", "Legends & Myths"] },
        ],
      },
    ],
  },
};

export const segmentIds = Object.keys(segments) as SegmentId[];
export const SEGMENT_COOKIE = "sippa_segment";
export const isSegmentId = (v: unknown): v is SegmentId => typeof v === "string" && v in segments;
export const segmentForCategory = (c: CategoryId): SegmentId =>
  c === "lover" ? "love" : c === "friend" ? "friends" : "history";
