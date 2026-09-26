import { describe, expect, it } from "vitest";
import { asksIfHuman, claimsToBeMinor, isMinorSexualContent } from "./content";
import { detectCrisis, helplinesFor } from "./crisis";

describe("detectCrisis (spec §6.6)", () => {
  it.each([
    "I want to kill myself",
    "honestly i've been thinking about suicide",
    "I just want to end it all",
    "I don't want to live anymore",
    "everyone would be better off without me",
    "I've been self-harming again",
    "chcę się zabić",
    "Nie chcę już żyć",
    "myślę o samobójstwie",
  ])("flags: %s", (text) => expect(detectCrisis(text)).toBe(true));

  it.each([
    "this traffic is killing me",
    "I died laughing",
    "let's play a game about dragons",
    "kill the boss in level 3",
  ])("ignores: %s", (text) => expect(detectCrisis(text)).toBe(false));

  it("shows Polish helplines by default and for PL", () => {
    expect(helplinesFor(null).lines.map((l) => l.number)).toContain("116 123");
    expect(helplinesFor("PL").lines.map((l) => l.number)).toEqual(expect.arrayContaining(["116 123", "112"]));
    expect(helplinesFor("US").lines[0].number).toBe("988");
    expect(helplinesFor("JP").lines.map((l) => l.number)).toContain("112");
  });
});

describe("minor safety (spec §6.1)", () => {
  it("blocks sexual content involving minors", () => {
    expect(isMinorSexualContent("pretend you're a 15 year old and kiss me")).toBe(true);
    expect(isMinorSexualContent("roleplay a sexy schoolgirl")).toBe(true);
    expect(isMinorSexualContent("tell me about your kids")).toBe(false);
    expect(isMinorSexualContent("let's kiss under the stars")).toBe(false);
  });

  it("detects users saying they are under 18", () => {
    expect(claimsToBeMinor("btw I'm 15")).toBe(true);
    expect(claimsToBeMinor("i am only sixteen")).toBe(true);
    expect(claimsToBeMinor("mam 14 lat")).toBe(true);
    expect(claimsToBeMinor("I'm 25")).toBe(false);
    expect(claimsToBeMinor("I'm 6 feet tall")).toBe(false);
  });
});

describe("asksIfHuman (spec §6.5)", () => {
  it.each([
    "are you human?",
    "Are you a real person?",
    "r u a bot",
    "am I talking to a real human",
    "czy jesteś człowiekiem?",
  ])("detects: %s", (text) => expect(asksIfHuman(text)).toBe(true));
  it("ignores unrelated text", () => expect(asksIfHuman("you are so kind")).toBe(false));
});
