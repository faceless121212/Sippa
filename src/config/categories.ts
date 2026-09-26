export type CategoryId = "lover" | "friend" | "famous";

export type Category = {
  id: CategoryId;
  label: string;
  emoji: string;
  blurb: string;
  adultsOnly: boolean;
  subTags: string[];
};

export const categories: Category[] = [
  {
    id: "lover",
    label: "Lover",
    emoji: "💗",
    blurb: "Slow burns and sweet flirting. Adults only.",
    adultsOnly: true,
    subTags: [
      "Sweet",
      "Slow Burn",
      "Friends to Lovers",
      "Dating Show",
      "Protective",
      "Tsundere",
      "Long-distance",
      "Coworkers",
      "Campus (18+)",
    ],
  },
  {
    id: "friend",
    label: "Friend",
    emoji: "☕",
    blurb: "Banter, comfort, someone on your side.",
    adultsOnly: false,
    subTags: [
      "Best Friend",
      "Comfort",
      "Study Buddy",
      "Gamer",
      "Travel Buddy",
      "Language Partner",
      "Motivator",
    ],
  },
  {
    id: "famous",
    label: "Famous",
    emoji: "⭐",
    blurb: "Debate history's greatest minds.",
    adultsOnly: false,
    subTags: [
      "Historical Figures",
      "Scientists",
      "Philosophers",
      "Artists",
      "Legends & Myths",
      "Verified Creators",
    ],
  },
];

/** Cross-cutting genre tags (section 4 + owner-requested extras). */
export const genreTags = [
  "Fantasy",
  "Sci-Fi",
  "Anime-style",
  "Horror",
  "Mystery",
  "Slice of Life",
  "Adventure",
  "RPG",
  "K-drama style",
  "Gaming",
  "Study buddies",
];

/** Tailwind classes per category, kept as literals so Tailwind can see them. */
export const categoryStyles: Record<CategoryId, { ink: string; fill: string; ring: string; softBg: string }> =
  {
    lover: {
      ink: "text-lover-ink",
      fill: "bg-lover",
      ring: "ring-lover",
      softBg: "bg-lover/15",
    },
    friend: {
      ink: "text-friend-ink",
      fill: "bg-friend",
      ring: "ring-friend",
      softBg: "bg-friend/15",
    },
    famous: {
      ink: "text-famous-ink",
      fill: "bg-famous",
      ring: "ring-famous",
      softBg: "bg-famous/15",
    },
  };
