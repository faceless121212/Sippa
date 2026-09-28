import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 0);
const after = vi.fn();
const create = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => after(fn) }));
vi.mock("@/lib/llm", () => ({ aiLive: () => true, FAST_MODEL: "test-model" }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

const { addCharacterReactions, getFeed } = await import("./moments");

const char = (id: string, category: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  category,
  status: "approved",
  visibility: "public",
  creator_id: null,
  age: 30,
  hook: "h",
  description: "",
  personality: { traits: [] },
  speaking_style: "",
  backstory: "",
  first_message: "Hi",
  example_dialogues: [],
  avatar_url: null,
  message_count: 1,
  ...extra,
});

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    characters: [
      char("marcus", "famous"),
      char("austen", "famous"),
      char("pip", "friend"),
      char("mara", "lover"),
      char("theo", "lover"),
      char("mine", "friend", { creator_id: "u1", visibility: "private" }),
    ],
    moment_reactions: [],
  });
  create.mockReset().mockResolvedValue({
    content: [{ type: "text", text: "Bravo, my friend — well said!" }],
    stop_reason: "end_turn",
  });
  after.mockReset();
});

const react = (author: string, category: string) =>
  addCharacterReactions(fake.client as never, [
    { id: `m-${author}`, text: "A calm morning.", author: { id: author, name: author, category } },
  ]);

describe("characters reacting to moments", () => {
  it("adds 1–3 likes and one reply from other characters", async () => {
    await react("marcus", "famous");
    const rows = tables.moment_reactions;
    const likes = rows.filter((r) => r.kind === "like");
    expect(likes.length).toBeGreaterThanOrEqual(1);
    expect(likes.length).toBeLessThanOrEqual(3);
    expect(rows.filter((r) => r.kind === "reply")).toEqual([
      expect.objectContaining({ text: "Bravo, my friend — well said!" }),
    ]);
    expect(rows.every((r) => r.character_id !== "marcus")).toBe(true);
  });

  it("never lets users' private characters react", async () => {
    for (let i = 0; i < 20; i++) await react("marcus", "famous");
    expect(tables.moment_reactions.some((r) => r.character_id === "mine")).toBe(false);
  });

  it("keeps romance separate: Lover moments only get Lover reactions, and vice versa", async () => {
    for (let i = 0; i < 10; i++) {
      await react("mara", "lover");
      await react("pip", "friend");
    }
    const byMoment = (id: string) => tables.moment_reactions.filter((r) => r.moment_id === id);
    expect(byMoment("m-mara").every((r) => r.character_id === "theo")).toBe(true);
    expect(byMoment("m-pip").every((r) => !["mara", "theo"].includes(r.character_id as string))).toBe(true);
  });

  it("each character likes and replies to a moment at most once", async () => {
    for (let i = 0; i < 5; i++) await react("mara", "lover");
    const theo = tables.moment_reactions.filter((r) => r.character_id === "theo");
    expect(theo.filter((r) => r.kind === "like").length).toBeLessThanOrEqual(1);
    expect(theo.filter((r) => r.kind === "reply").length).toBeLessThanOrEqual(1);
  });

  it("skips the reply when the model refuses", async () => {
    create.mockResolvedValue({ content: [{ type: "text", text: "I can't" }], stop_reason: "refusal" });
    await react("marcus", "famous");
    expect(tables.moment_reactions.some((r) => r.kind === "reply")).toBe(false);
  });
});

describe("feed display", () => {
  const embedded = (id: string, kind: string, c: ReturnType<typeof char>, text: string | null = null) => ({
    id,
    kind,
    text,
    created_at: "2026-09-28T10:00:00Z",
    characters: c,
  });

  beforeEach(() => {
    const [marcus, austen, , , theo, mine] = tables.characters as ReturnType<typeof char>[];
    tables.chats = [];
    tables.moments = [
      {
        id: "m1",
        character_id: "pip",
        text: "Colour-coded my notes again.",
        created_at: new Date().toISOString(),
        like_count: 0,
        moment_reactions: [
          embedded("r1", "like", marcus),
          embedded("r2", "like", mine), // private: must never show
          embedded("r3", "reply", austen, "How very orderly of you."),
          embedded("r4", "like", theo), // Lover reactor: hidden from non-adults
        ],
      },
    ];
  });

  it("shows character likes and replies separately from the real like count", async () => {
    const [m] = await getFeed({ userId: "u1", adult: false }, 5);
    expect(m.likeCount).toBe(0);
    expect(m.reactions.likedBy.map((c) => c.id)).toEqual(["marcus"]);
    expect(m.reactions.replies).toEqual([
      expect.objectContaining({
        text: "How very orderly of you.",
        character: expect.objectContaining({ id: "austen" }),
      }),
    ]);
  });

  it("adults also see Lover characters' reactions", async () => {
    const [m] = await getFeed({ userId: "u1", adult: true }, 5);
    expect(m.reactions.likedBy.map((c) => c.id)).toEqual(["marcus", "theo"]);
  });

  it("moments that already have reactions don't get more", async () => {
    await getFeed({ userId: "u1", adult: false }, 5);
    // Run whatever was queued for after the response (e.g. new moments), then check.
    for (const [fn] of after.mock.calls) await (fn as () => Promise<unknown>)();
    // (Brand-new moments written in the background may get reactions; m1 already has some.)
    expect(tables.moment_reactions.filter((r) => r.moment_id === "m1")).toHaveLength(0);
  });
});
