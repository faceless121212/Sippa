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

describe("minor check is precise (owner feedback 2026-10-14)", () => {
  const grandma: Draft = {
    ...base,
    category: "friend",
    name: "Babusya Oksana",
    age: 74,
    hook: "Sarcastic Ukrainian grandma. Teaches you borscht over video call.",
    description: "A sharp-tongued grandmother who shows love through food and criticism.",
    backstory:
      "Oksana raised three children and buried two husbands in a village near Poltava. Her grandkids live abroad.",
    firstMessage: "You call this beetroot? Turn the camera, let me see.",
    tags: ["Foodie", "Comfort"],
    visualPrompt: "elderly woman, headscarf, embroidered blouse, cosy kitchen",
    dials: { ...DEFAULT_DIALS, flirtiness: 0 },
  };

  it("lets a grandma who raised children through", () => {
    expect(checkDraft(grandma)).toEqual([]);
  });

  it("allows other family mentions too", () => {
    for (const backstory of ["Her kids moved to Lviv.", "She has two grown kids.", "Mother of 3 children."])
      expect(checkDraft({ ...grandma, backstory }), backstory).toEqual([]);
  });

  it("a grandma calling you 'my child' is a term of endearment, not an age", () => {
    for (const speakingStyle of [
      "Calls you 'my child' and sighs dramatically.",
      'Says "dear child" a lot.',
      "Calls everyone kid. Blunt, warm.",
    ])
      expect(checkDraft({ ...grandma, speakingStyle }), speakingStyle).toEqual([]);
  });

  it("a Friend's past youth in the backstory is fine", () => {
    expect(checkDraft({ ...grandma, backstory: "Worked in a bakery as a teenager." })).toEqual([]);
  });

  it("still blocks a character described as a minor, and says where", () => {
    const [p] = checkDraft({ ...grandma, description: "A shy teen who loves cooking." });
    expect(p).toMatch(/^The description says "teen"/);
    const [q] = checkDraft({ ...grandma, visualPrompt: "girl in a school uniform" });
    expect(q).toMatch(/^The look says "school uniform"/);
  });

  it("Lover characters stay strict everywhere, including the backstory", () => {
    const [p] = checkDraft({ ...base, backstory: "You were classmates in high school." });
    expect(p).toMatch(/^The backstory says "(classmates|high school)"/);
  });

  it("a single-parent Lover can mention her kids and still be flirty", () => {
    expect(
      checkDraft({
        ...base,
        backstory: "Raised two kids on her own.",
        firstMessage: "Maybe one kiss before you go?",
      }),
    ).toEqual([]);
  });

  it("sexual content involving minors is blocked in every field and category", () => {
    const problems = checkDraft({ ...grandma, backstory: "Explicit sex with a 15-year-old." });
    expect(problems[0]).toMatch(/never allowed/);
  });
});
