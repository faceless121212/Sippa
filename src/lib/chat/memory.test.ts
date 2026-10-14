import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 0);
const parse = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("@/lib/llm", () => ({ aiLive: () => true, FAST_MODEL: "test" }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));
// The fake builder has no .delete(); give it one that removes matching rows.
const { rememberFromMessage, loadMemories, MAX_MEMORIES } = await import("./memory");

const base = { userId: "u1", characterId: "ren", chatId: "c1", characterName: "Ren", today: "2026-10-14" };
const said = (facts: string[], preferredName: string | null = null) =>
  parse.mockResolvedValueOnce({ parsed_output: { facts, preferredName } });

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  tables.memories = [];
  parse.mockReset();
});

describe("automatic memory", () => {
  it("saves new facts from a message, per user and character", async () => {
    said(["User has a cat named Mochi.", "User has a work presentation on 2026-10-15."]);
    const r = await rememberFromMessage({ ...base, userText: "My cat Mochi… big presentation tomorrow" });
    expect(r.added).toHaveLength(2);
    expect(tables.memories).toEqual([
      expect.objectContaining({
        user_id: "u1",
        character_id: "ren",
        source: "auto",
        kind: "fact",
        text: "User has a cat named Mochi.",
      }),
      expect.objectContaining({ text: "User has a work presentation on 2026-10-15." }),
    ]);
  });

  it("skips facts it already knows (ignoring case and punctuation)", async () => {
    tables.memories.push({
      id: "m1",
      user_id: "u1",
      character_id: "ren",
      text: "User has a cat named Mochi.",
      source: "auto",
      kind: "fact",
      created_at: "1",
    });
    said(["user has a cat named mochi", "User works as a product designer."]);
    const r = await rememberFromMessage({ ...base, userText: "Mochi again! I'm a product designer btw" });
    expect(r.added).toEqual(["User works as a product designer."]);
  });

  it("ignores one-word replies without calling the model", async () => {
    const r = await rememberFromMessage({ ...base, userText: "haha ok" });
    expect(r.added).toEqual([]);
    expect(parse).not.toHaveBeenCalled();
  });

  it("a newly stated name becomes the name the character uses", async () => {
    said([], "Kate");
    await rememberFromMessage({ ...base, userText: "By the way, please call me Kate." });
    const { name } = await loadMemories(fake.client as never, "u1", "ren");
    expect(name).toBe("Kate");
  });

  it("keeps the list bounded by dropping the oldest automatic facts, never hand-written ones", async () => {
    tables.memories.push({
      id: "mine",
      user_id: "u1",
      character_id: "ren",
      text: "My dog is Biscuit",
      source: "user",
      kind: "fact",
      created_at: "0",
    });
    for (let i = 0; i < MAX_MEMORIES - 1; i++)
      tables.memories.push({
        id: `a${i}`,
        user_id: "u1",
        character_id: "ren",
        text: `User fact ${i}.`,
        source: "auto",
        kind: "fact",
        created_at: String(i + 1).padStart(3, "0"),
      });
    said(["User likes jazz.", "User runs on Sundays."]);
    await rememberFromMessage({ ...base, userText: "I love jazz and I run every Sunday" });
    const texts = tables.memories.map((m) => m.text);
    expect(texts).toContain("My dog is Biscuit");
    expect(texts).toContain("User likes jazz.");
    expect(texts).not.toContain("User fact 0.");
  });

  it("never touches another user's or another character's memories", async () => {
    tables.memories.push({
      id: "x",
      user_id: "u2",
      character_id: "ren",
      text: "User has a cat named Mochi.",
      source: "auto",
      kind: "fact",
      created_at: "1",
    });
    said(["User has a cat named Mochi."]);
    const r = await rememberFromMessage({ ...base, userText: "I have a cat called Mochi" });
    expect(r.added).toEqual(["User has a cat named Mochi."]);
    expect(tables.memories.filter((m) => m.user_id === "u1")).toHaveLength(1);
  });
});
