import { describe, expect, it } from "vitest";
import { checkDraft } from "./rules";
import { DEFAULT_DIALS, type Draft } from "./schema";

const base: Draft = {
  category: "lover",
  famousType: null,
  historicalDiedYear: null,
  name: "Isla Maren",
  age: 28,
  gender: "female",
  hook: "Keeps the light on for you.",
  description: "A lighthouse keeper with a teasing smile.",
  traits: ["Warm", "Teasing", "Brave"],
  speakingStyle: "Playful sea metaphors.",
  backstory: "Took over the lighthouse from her aunt.",
  firstMessage: "Third time on my pier this week.",
  exampleDialogues: [
    { user: "Hi", character: "Ahoy." },
    { user: "Nice view", character: "Mine's better." },
  ],
  tags: ["Sweet"],
  visualPrompt: "wavy copper hair, navy peacoat, pier at dusk",
  dials: { ...DEFAULT_DIALS, flirtiness: 60 },
};
const now = new Date("2026-09-26");

describe("creator rules — acceptance criteria (spec §12)", () => {
  it("accepts a valid adult Lover character", () => {
    expect(checkDraft(base, now)).toEqual([]);
  });

  it("blocks a Lover character younger than 21", () => {
    expect(checkDraft({ ...base, age: 19 }, now).join()).toMatch(/21 or older/);
    expect(checkDraft({ ...base, age: null }, now).join()).toMatch(/21 or older/);
  });

  it("blocks school / minor wording", () => {
    expect(checkDraft({ ...base, description: "My classmate from high school" }, now).join()).toMatch(
      /minors or school-age/,
    );
    expect(checkDraft({ ...base, visualPrompt: "wearing a school uniform" }, now).join()).toMatch(/minors/);
    expect(checkDraft({ ...base, backstory: "She is a shy teen" }, now).join()).toMatch(/minors/);
  });

  it("blocks characters named after blocklisted living celebrities", () => {
    expect(checkDraft({ ...base, name: "Taylor Swift" }, now).join()).toMatch(
      /real living people \(Taylor Swift\)/,
    );
    expect(checkDraft({ ...base, description: "Basically Timothée Chalamet" }, now).join()).toMatch(
      /Timothee Chalamet/,
    );
  });

  it("requires historical figures to have died 70+ years ago and forbids flirting", () => {
    const famous: Draft = {
      ...base,
      category: "famous",
      famousType: "historical",
      age: null,
      dials: { ...DEFAULT_DIALS, flirtiness: 0 },
    };
    expect(checkDraft({ ...famous, name: "Marie Curie", historicalDiedYear: 1934 }, now)).toEqual([]);
    expect(checkDraft({ ...famous, name: "Someone Recent", historicalDiedYear: 1990 }, now).join()).toMatch(
      /70 years/,
    );
    expect(
      checkDraft(
        {
          ...famous,
          name: "Marie Curie",
          historicalDiedYear: 1934,
          dials: { ...DEFAULT_DIALS, flirtiness: 30 },
        },
        now,
      ).join(),
    ).toMatch(/no romance with real people/);
  });

  it("keeps Friend characters non-flirty", () => {
    expect(
      checkDraft({ ...base, category: "friend", dials: { ...DEFAULT_DIALS, flirtiness: 20 } }, now).join(),
    ).toMatch(/aren't flirty/);
  });
});
