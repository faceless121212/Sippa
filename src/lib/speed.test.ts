/**
 * Speed regression tests: each page loader must finish in a fixed number of
 * database round-trips. Slowness in Sippa came from queries running one after
 * another; these fail if a change turns parallel work back into a waterfall.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 25);
const getClaims = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ ...fake.client, auth: { getClaims, getUser } }),
}));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: true }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => void fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));

const { getFeed } = await import("./moments");
const { getViewer } = await import("./auth");
const { chatCounts } = await import("./characters");

function seed() {
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    characters: ["pip", "marie", "mara"].map((id, i) => ({
      id,
      name: id,
      category: id === "mara" ? "lover" : "friend",
      status: "approved",
      visibility: "public",
      creator_id: null,
      message_count: 100 - i,
      avatar_url: null,
    })),
    chats: [
      { id: "c1", user_id: "u1", character_id: "pip", updated_at: iso(1000) },
      { id: "c2", user_id: "u2", character_id: "pip", updated_at: iso(2000) },
      { id: "c3", user_id: "u1", character_id: "marie", updated_at: iso(3000) },
    ],
    // Fresh moments, so no AI top-up is needed on this load.
    moments: ["pip", "marie", "mara", "pip"].map((cid, i) => ({
      id: `m${i}`,
      character_id: cid,
      text: `moment ${i}`,
      created_at: iso(60_000 * (i + 1)),
      like_count: 0,
    })),
    moment_likes: [{ user_id: "u1", moment_id: "m0" }],
    profiles: [{ id: "u1", email: "a@b.c", dob: "1990-01-01", is_adult: true, plan: "free", beans: 5 }],
  });
}

beforeEach(() => {
  seed();
  getClaims.mockReset();
  getUser.mockReset();
});

describe("page loaders stay within their round-trip budget", () => {
  it("Moments feed: 4 rounds for a signed-in user, with likes and age rules applied", async () => {
    const { result, rounds } = await fake.rounds(() => getFeed({ userId: "u1", adult: false }, 10));
    expect(rounds).toBeLessThanOrEqual(4);
    expect(result.map((m) => m.character.id)).not.toContain("mara"); // Lover hidden from non-verified
    expect(result.find((m) => m.id === "m0")?.liked).toBe(true);
  });

  it("Moments feed for visitors: 3 rounds, no likes lookup", async () => {
    const { rounds, queries } = await fake.rounds(() => getFeed(null, 10));
    expect(rounds).toBeLessThanOrEqual(3);
    expect(queries).not.toContain("select:moment_likes");
  });

  it("signed-in check verifies the token locally: no auth-server call, one DB round", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "u1", email: "a@b.c" } } });
    const { result, rounds } = await fake.rounds(() => getViewer());
    expect(getUser).not.toHaveBeenCalled();
    expect(rounds).toBeLessThanOrEqual(1);
    expect(result?.user).toMatchObject({ id: "u1", email: "a@b.c" });
    expect(result?.profile?.is_adult).toBe(true);
  });

  it("signed-out check makes no database calls", async () => {
    getClaims.mockResolvedValue({ data: null });
    const { result, queries } = await fake.rounds(() => getViewer());
    expect(result).toBeNull();
    expect(queries).toHaveLength(0);
  });

  it("chat counts for a whole list come back in one parallel round, and are real", async () => {
    const { result, rounds } = await fake.rounds(() => chatCounts(["pip", "marie", "mara"]));
    expect(rounds).toBeLessThanOrEqual(1);
    expect(Object.fromEntries(result)).toEqual({ pip: 2, marie: 1, mara: 0 });
  });
});
