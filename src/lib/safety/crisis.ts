/**
 * Self-harm / suicide signal detection (spec §6.6). Deliberately broad: a
 * false positive shows a kind message and helplines; a false negative can
 * leave someone alone. English + Polish.
 */
const PATTERNS: RegExp[] = [
  /\b(kill|killing|hurt|hurting|harm|harming|cut|cutting)\s+my\s*self\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\b(want|wanna|going)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|going\s+on)\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bself[-\s]?harm/i,
  /\boverdose\b/i,
  // Polish (no \b: JS word boundaries don't understand ą/ę/ż etc.)
  /zabi(ć|c|ję|je)\s+si(ę|e)|si(ę|e)\s+zabi(ć|c)/i,
  /samob(ó|o)j/i,
  /nie\s+chc(ę|e)\s+(już\s+|juz\s+)?(żyć|zyc)/i,
  /sko(ń|n)czy(ć|c)\s+ze\s+sob(ą|a)/i,
  /okalecza(m|ć|c)|tn(ę|e)\s+si(ę|e)/i,
];

export function detectCrisis(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

export type Helpline = { name: string; number: string; note?: string };

const HELPLINES: Record<string, Helpline[]> = {
  PL: [
    { name: "Telefon Zaufania dla Dorosłych", number: "116 123" },
    { name: "Centrum Wsparcia (24/7)", number: "800 70 2222" },
    { name: "Emergency", number: "112" },
  ],
  US: [
    { name: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text" },
    { name: "Emergency", number: "911" },
  ],
  GB: [
    { name: "Samaritans", number: "116 123" },
    { name: "Emergency", number: "999" },
  ],
  IE: [
    { name: "Samaritans", number: "116 123" },
    { name: "Emergency", number: "112" },
  ],
  DE: [
    { name: "TelefonSeelsorge", number: "0800 111 0 111" },
    { name: "Emergency", number: "112" },
  ],
};

const FALLBACK: Helpline[] = [
  { name: "Emergency services (EU)", number: "112" },
  { name: "Find a helpline near you", number: "findahelpline.com" },
];

/** Country-aware crisis resources. Poland is the default market. */
export function helplinesFor(country: string | null | undefined): { country: string; lines: Helpline[] } {
  const cc = (country ?? "").toUpperCase();
  if (HELPLINES[cc]) return { country: cc, lines: HELPLINES[cc] };
  return { country: cc || "PL", lines: cc ? FALLBACK : HELPLINES.PL };
}

/** Best-effort country from hosting headers or the browser language. */
export function countryFromHeaders(h: Headers): string | null {
  const geo = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
  if (geo) return geo;
  const lang = h.get("accept-language") ?? "";
  const m = /\b[a-z]{2}-([A-Z]{2})\b/.exec(lang);
  if (m) return m[1];
  if (/^pl\b/i.test(lang)) return "PL";
  return null;
}
