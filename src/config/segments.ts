import type { CategoryId } from "./categories";

/**
 * Audience segments (owner decision 2026-10-14, reviewer feedback on positioning):
 * one product, but a separate landing page and quiz per audience, so each ad campaign
 * speaks to one motivation — romance, friendship or history.
 */
export type SegmentId = "love" | "friends" | "history";

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
    quizTitle: "Find your match in 2 minutes",
    adultsOnly: true,
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
    quizTitle: "Find your new friend in 2 minutes",
    adultsOnly: false,
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
    quizTitle: "Find your mentor in 2 minutes",
    adultsOnly: false,
  },
};

export const segmentIds = Object.keys(segments) as SegmentId[];
export const SEGMENT_COOKIE = "sippa_segment";
export const isSegmentId = (v: unknown): v is SegmentId => typeof v === "string" && v in segments;
export const segmentForCategory = (c: CategoryId): SegmentId =>
  c === "lover" ? "love" : c === "friend" ? "friends" : "history";
