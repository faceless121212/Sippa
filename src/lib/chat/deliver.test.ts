import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const db: { chats: Row[]; messages: Row[]; characters: Row[] } = { chats: [], messages: [], characters: [] };
let calls: string[] = [];

/** Tiny in-memory stand-in for the Supabase query builder (only what deliverToChat uses). */
function from(table: keyof typeof db) {
  const filters: [string, unknown][] = [];
  let op: "select" | "insert" | "update" = "select";
  let payload: Row | Row[] = {};
  const q = {
    select: () => q,
    eq: (k: string, v: unknown) => (filters.push([k, v]), q),
    order: () => q,
    limit: () => q,
    insert: (p: Row | Row[]) => ((op = "insert"), (payload = p), q),
    update: (p: Row) => ((op = "update"), (payload = p), q),
    maybeSingle: () => run(true),
    single: () => run(true),
    then: (res: (v: unknown) => void) => run(false).then(res),
  };
  async function run(single: boolean) {
    calls.push(`${op}:${table}`);
    const match = (r: Row) => filters.every(([k, v]) => r[k] === v);
    if (op === "insert") {
      const rows = (Array.isArray(payload) ? payload : [payload]).map((r) => ({
        id: table === "chats" ? `chat-${db.chats.length + 1}` : db[table].length + 1,
        ...r,
      }));
      db[table].push(...rows);
      return { data: single ? rows[0] : rows, error: null };
    }
    if (op === "update") {
      db[table].filter(match).forEach((r) => Object.assign(r, payload));
      return { data: null, error: null };
    }
    const rows = db[table].filter(match);
    return { data: single ? (rows.at(-1) ?? null) : rows, error: null };
  }
  return q;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }));

const { deliverToChat, ChatError } = await import("./service");

beforeEach(() => {
  db.chats = [];
  db.messages = [];
  db.characters = [
    { id: "pip", first_message: "Hi, I'm Pip!", status: "approved", visibility: "public", creator_id: null },
    { id: "gone", first_message: "", status: "hidden", visibility: "public", creator_id: null },
    { id: "secret", first_message: "psst", status: "approved", visibility: "private", creator_id: "owner" },
  ];
  calls = [];
});

describe("deliverToChat (moment / popup Reply)", () => {
  it("starts a chat with the greeting first, then the delivered message", async () => {
    const id = await deliverToChat("u1", "pip", "*shared a moment:* baking bread");
    expect(db.chats).toHaveLength(1);
    expect(db.chats[0]).toMatchObject({ id, user_id: "u1", character_id: "pip", message_count: 2 });
    expect(db.messages.map((m) => m.content)).toEqual(["Hi, I'm Pip!", "*shared a moment:* baking bread"]);
    expect(db.chats[0].last_message_preview).toBe("*shared a moment:* baking bread");
  });

  it("reuses the latest existing chat instead of creating another", async () => {
    db.chats.push({ id: "c-old", user_id: "u1", character_id: "pip", message_count: 7 });
    const id = await deliverToChat("u1", "pip", "hello again");
    expect(id).toBe("c-old");
    expect(db.chats).toHaveLength(1);
    expect(db.chats[0].message_count).toBe(8);
    expect(db.messages).toEqual([expect.objectContaining({ chat_id: "c-old", role: "assistant", content: "hello again" })]);
  });

  it("stays within a few round-trips (keeps Reply fast)", async () => {
    await deliverToChat("u1", "pip", "x");
    // lookup chat + character (parallel), insert chat, insert both messages
    expect(calls).toHaveLength(4);
    calls = [];
    await deliverToChat("u1", "pip", "y");
    // lookup (parallel pair) + insert message and update chat (parallel pair)
    expect(calls).toHaveLength(4);
  });

  it("refuses hidden characters", async () => {
    await expect(deliverToChat("u1", "gone", "x")).rejects.toBeInstanceOf(ChatError);
    expect(db.chats).toHaveLength(0);
  });

  it("refuses someone else's private character but allows its creator", async () => {
    await expect(deliverToChat("u1", "secret", "x")).rejects.toMatchObject({ status: 404 });
    await expect(deliverToChat("owner", "secret", "x")).resolves.toMatch(/^chat-/);
  });

  it("truncates the chat-list preview to 120 characters", async () => {
    await deliverToChat("u1", "pip", "a".repeat(500));
    expect(String(db.chats[0].last_message_preview)).toHaveLength(120);
    expect(db.messages[1].content).toHaveLength(500);
  });
});
