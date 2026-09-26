/**
 * Living public figures that must never be impersonated (spec §6.3).
 * Not exhaustive — the LLM moderation check at creation and save covers
 * the long tail. Matching ignores case, accents and punctuation.
 */
export const LIVING_PUBLIC_FIGURES = [
  // Music
  "Taylor Swift",
  "Beyonce",
  "Rihanna",
  "Drake",
  "Ariana Grande",
  "Billie Eilish",
  "Harry Styles",
  "Ed Sheeran",
  "Justin Bieber",
  "Selena Gomez",
  "Dua Lipa",
  "Lady Gaga",
  "Katy Perry",
  "Shakira",
  "Madonna",
  "Eminem",
  "Kanye West",
  "Ye",
  "Travis Scott",
  "Bad Bunny",
  "The Weeknd",
  "Olivia Rodrigo",
  "Sabrina Carpenter",
  "Doja Cat",
  "Nicki Minaj",
  "Cardi B",
  "Adele",
  "Bruno Mars",
  "Post Malone",
  "Lana Del Rey",
  "SZA",
  "Charli XCX",
  "Chappell Roan",
  "Miley Cyrus",
  "Jennifer Lopez",
  "Snoop Dogg",
  "Jay-Z",
  "Kendrick Lamar",
  // K-pop
  "Jungkook",
  "Jeon Jungkook",
  "Jimin",
  "Park Jimin",
  "Kim Taehyung",
  "Taehyung",
  "V BTS",
  "RM BTS",
  "Suga",
  "Jin BTS",
  "J-Hope",
  "Jennie",
  "Jennie Kim",
  "Lisa Manoban",
  "Lalisa",
  "Jisoo",
  "Rose Blackpink",
  "Rosé",
  "Hyun Bin",
  "Lee Min-ho",
  "Cha Eun-woo",
  "IU",
  "Karina aespa",
  "Winter aespa",
  "Hanni NewJeans",
  // Film & TV
  "Timothee Chalamet",
  "Zendaya",
  "Tom Holland",
  "Sydney Sweeney",
  "Margot Robbie",
  "Ryan Gosling",
  "Ryan Reynolds",
  "Scarlett Johansson",
  "Jenna Ortega",
  "Pedro Pascal",
  "Henry Cavill",
  "Chris Hemsworth",
  "Chris Evans",
  "Keanu Reeves",
  "Brad Pitt",
  "Angelina Jolie",
  "Leonardo DiCaprio",
  "Johnny Depp",
  "Emma Watson",
  "Emma Stone",
  "Jennifer Aniston",
  "Tom Cruise",
  "Robert Pattinson",
  "Kristen Stewart",
  "Anya Taylor-Joy",
  "Florence Pugh",
  "Jacob Elordi",
  "Austin Butler",
  "Cillian Murphy",
  "Dwayne Johnson",
  "Kim Kardashian",
  "Kylie Jenner",
  "Kendall Jenner",
  "Paris Hilton",
  "Millie Bobby Brown",
  // Creators
  "MrBeast",
  "PewDiePie",
  "Pokimane",
  "Kai Cenat",
  "IShowSpeed",
  "Logan Paul",
  "Jake Paul",
  "Andrew Tate",
  "Charli D'Amelio",
  "Addison Rae",
  "Khaby Lame",
  // Sport
  "Cristiano Ronaldo",
  "Lionel Messi",
  "Kylian Mbappe",
  "Erling Haaland",
  "Neymar",
  "LeBron James",
  "Serena Williams",
  "Novak Djokovic",
  "Rafael Nadal",
  "Roger Federer",
  "Lewis Hamilton",
  "Simone Biles",
  "Robert Lewandowski",
  "Iga Swiatek",
  "Wojciech Szczesny",
  // Politics & public life
  "Donald Trump",
  "Joe Biden",
  "Kamala Harris",
  "Barack Obama",
  "Michelle Obama",
  "Vladimir Putin",
  "Volodymyr Zelensky",
  "Xi Jinping",
  "Emmanuel Macron",
  "Olaf Scholz",
  "Rishi Sunak",
  "Keir Starmer",
  "Giorgia Meloni",
  "Narendra Modi",
  "Benjamin Netanyahu",
  "Andrzej Duda",
  "Donald Tusk",
  "Jaroslaw Kaczynski",
  "Rafal Trzaskowski",
  "Karol Nawrocki",
  "King Charles",
  "Prince William",
  "Prince Harry",
  "Kate Middleton",
  "Meghan Markle",
  "Pope Leo",
  // Tech & business
  "Elon Musk",
  "Mark Zuckerberg",
  "Jeff Bezos",
  "Bill Gates",
  "Sam Altman",
  "Tim Cook",
  "Jensen Huang",
  // Polish celebrities
  "Doda",
  "Sanah",
  "Dawid Podsiadlo",
  "Maryla Rodowicz",
  "Margaret",
  "Mata",
  "Quebonafide",
  "Taco Hemingway",
  "Anja Rubik",
  "Magdalena Gessler",
  "Kuba Wojewodzki",
];

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NORMALIZED = LIVING_PUBLIC_FIGURES.map((n) => ({ name: n, key: normalize(n) }));

/** Single-word names distinctive enough to flag anywhere in free text. */
const DISTINCTIVE = new Set([
  "beyonce",
  "rihanna",
  "shakira",
  "madonna",
  "eminem",
  "zendaya",
  "mrbeast",
  "pewdiepie",
  "pokimane",
  "ishowspeed",
  "neymar",
  "jungkook",
  "quebonafide",
]);

/**
 * Returns the matched living person's name, or null. Whole-word match on
 * full names; common single words (Drake, Margaret, Rose…) are only checked
 * against the character's name field — see nameIsLivingPerson.
 */
export function findLivingPerson(...texts: (string | null | undefined)[]): string | null {
  const hay = ` ${normalize(texts.filter(Boolean).join(" "))} `;
  for (const { name, key } of NORMALIZED) {
    if (!key.includes(" ") && !DISTINCTIVE.has(key)) continue;
    if (hay.includes(` ${key} `)) return name;
  }
  return null;
}

/** Stricter check for the character's name field (catches short stage names too). */
export function nameIsLivingPerson(name: string): string | null {
  const key = normalize(name);
  const hit = NORMALIZED.find((n) => n.key === key);
  return hit?.name ?? findLivingPerson(name);
}
