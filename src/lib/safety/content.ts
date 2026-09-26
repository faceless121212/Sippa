/**
 * Hard input filter (spec §6.1): sexual or romantic content combined with
 * minor-coded wording is always refused, whatever the character.
 */
const MINOR =
  /\b(child|children|kid|kids|minor|underage|under[-\s]?age|preteen|teen|teenager|teenage|schoolgirl|schoolboy|loli|shota|(1[0-7]|[1-9])\s*(yo|y\/o|years?\s*old)|dziecko|dzieci|nieletni|nastolat(ek|ka))\b/i;
const SEXUAL =
  /\b(sex|sexual|sexy|nude|naked|porn|horny|kiss|kissing|make\s+out|undress|strip|touch\s+(me|you|her|him)|bed|seduce|erotic|orgasm|fuck|nsfw|lewd|seks|nag(i|a|ie)|całow)\w*/i;

export function isMinorSexualContent(text: string): boolean {
  return MINOR.test(text) && SEXUAL.test(text);
}

/** User says they are under 18 → romance must stop (spec §6.1/§6.2). */
export function claimsToBeMinor(text: string): boolean {
  return (
    /\b(i'?m|i\s+am|im)\s+(only\s+)?(1[0-7]|[1-9]|thirteen|fourteen|fifteen|sixteen|seventeen)\b(?!\s*(ft|feet|cm|kg|lbs|minutes|min|hours|%))/i.test(
      text,
    ) || /\b(mam|jestem)\s+(1[0-7]|[1-9])\s*(lat|lata)\b/i.test(text)
  );
}

/** A sincere "am I talking to a human?" question (EU AI Act transparency). */
export function asksIfHuman(text: string): boolean {
  return (
    /\b(are|r)\s+(you|u)\s+(a\s+)?(real|human|a\s+person|real\s+person|bot|robot|ai|an\s+ai|machine|chat\s*bot)\b/i.test(
      text,
    ) ||
    /\b(am\s+i|i'?m)\s+(talking|chatting|speaking)\s+(to|with)\s+(a\s+)?(real\s+)?(human|person|bot|ai|machine)\b/i.test(
      text,
    ) ||
    /\bczy\s+jeste(ś|s)\s+(człowiekiem|czlowiekiem|botem|ai|prawdziw)/i.test(text)
  );
}
