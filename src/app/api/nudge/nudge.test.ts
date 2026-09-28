import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 0);
let userId: string | null = "u1";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) },
  }),
}));
vi.mock("@/lib/nudges", async (orig) => ({
  ...(await orig<typeof import("@/lib/nudges")>()),
  writeNudge: async (c: { name: string }) => `Hi from ${c.name}`,
}));

const { POST } = await import("./route");

const char = (id: string, category: string, gender: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  category,
  gender,
  status: "approved",
  visibility: "public",
  creator_id: null,
  message_count: 10,
  avatar_url: null,
  ...extra,
});
const call = (body: object) =>
  POST(new Request("http://x/api/nudge", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  userId = "u1";
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    profiles: [{ id: "u1", is_adult: true, banned_at: null, nudges_enabled: true, display_name: "Ilia" }],
    characters: [
      char("mara", "lover", "female"),
      char("elena", "lover", "female"),
      char("theo", "lover", "male"),
      char("pip", "friend", "female"),
      char("mine", "lover", "female", { creator_id: "u2", visibility: "private" }),
    ],
    chats: [],
    nudges: [],
  });
});

describe("the visit's first popup", () => {
  it("comes from a woman in the Lover category", async () => {
    for (let i = 0; i < 15; i++) {
      tables.nudges = [];
      const res = await call({ first: true });
      expect(res.status).toBe(200);
      expect(["mara", "elena"]).toContain((await res.json()).characterId);
    }
  });

  it("prefers one the user already chats with", async () => {
    tables.chats = [{ id: "c1", user_id: "u1", character_id: "elena", updated_at: "2026-09-28" }];
    for (let i = 0; i < 5; i++) {
      tables.nudges = [];
      expect((await (await call({ first: true })).json()).characterId).toBe("elena");
    }
  });

  it("never uses someone's private character", async () => {
    for (let i = 0; i < 15; i++) {
      tables.nudges = [];
      expect((await (await call({ first: true })).json()).characterId).not.toBe("mine");
    }
  });

  it("is never sent to non-adults, people who turned popups off, or visitors", async () => {
    tables.profiles[0].is_adult = false;
    expect((await call({ first: true })).status).toBe(204);
    tables.profiles[0].is_adult = true;
    tables.profiles[0].nudges_enabled = false;
    expect((await call({ first: true })).status).toBe(204);
    userId = null;
    expect((await call({ first: true })).status).toBe(204);
  });

  it("respects the minimum gap between popups", async () => {
    tables.nudges = [{ user_id: "u1", created_at: new Date().toISOString() }];
    expect((await call({ first: true })).status).toBe(204);
  });
});
