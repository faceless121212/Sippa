import { beforeEach, describe, expect, it, vi } from "vitest";
import { socialProof } from "@/config/site";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 20);

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: true }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));

const { loadSocialProof } = await import("./social-proof");

const NOW = Date.parse("2026-09-28T12:00:00Z");
const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();
const char = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  avatar_url: null,
  category: "friend",
  status: "approved",
  visibility: "public",
  creator_id: null,
  created_at: ago(60 * 24 * 30),
  ...extra,
});

function seed({ chats = 3, rated = 0, liked = 0 } = {}) {
  for (const k of Object.keys(tables)) delete tables[k];
  const pip = char("pip");
  const mara = char("mara", { category: "lover" });
  const secret = char("secret", { visibility: "private", creator_id: "u1" });
  const fresh = char("fresh", { creator_id: "u2", created_at: ago(30) });
  Object.assign(tables, {
    characters: [pip, mara, secret, fresh],
    chats: Array.from({ length: chats }, (_, i) => {
      const c = [pip, mara, secret][i % 3];
      return { id: `c${i}`, created_at: ago(i * 10 + 5), character_id: c.id, characters: c };
    }).concat([{ id: "old", created_at: ago(60 * 48), character_id: "pip", characters: pip }]),
    moments: [{ id: "m1" }, { id: "m2" }],
    messages: [
      ...Array.from({ length: liked }, (_, i) => ({ id: `l${i}`, rating: 1 })),
      ...Array.from({ length: rated - liked }, (_, i) => ({ id: `d${i}`, rating: -1 })),
      { id: "unrated", rating: null },
    ],
  });
}

beforeEach(() => seed());

describe("social proof shows only real, meaningful numbers", () => {
  it("loads everything in one parallel round", async () => {
    const { rounds } = await fake.rounds(() => loadSocialProof(false, NOW));
    expect(rounds).toBeLessThanOrEqual(1);
  });

  it("hides counters and rating until they pass their minimums", async () => {
    const proof = await loadSocialProof(false, NOW);
    expect(proof.counters).toBeNull();
    expect(proof.rating).toBeNull();
  });

  it("shows real totals once there are enough chats", async () => {
    seed({ chats: socialProof.minChatsForCounters });
    const { counters } = await loadSocialProof(false, NOW);
    // Totals are all-time (only activity is windowed); community count includes private characters.
    expect(counters).toEqual({
      chats: socialProof.minChatsForCounters + 1,
      communityCharacters: 2,
      moments: 2,
    });
  });

  it("computes the 👍 share from real ratings only", async () => {
    seed({ rated: socialProof.minRatingsForScore, liked: Math.round(socialProof.minRatingsForScore * 0.9) });
    const { rating } = await loadSocialProof(false, NOW);
    expect(rating).toEqual({ percent: 90, total: socialProof.minRatingsForScore });
  });

  it("activity is anonymous and never shows private or (for non-adults) 18+ characters", async () => {
    seed({ chats: 9 });
    const { activity } = await loadSocialProof(false, NOW);
    const ids = activity.map((a) => a.character.id);
    expect(ids).not.toContain("secret");
    expect(ids).not.toContain("mara");
    expect(JSON.stringify(activity)).not.toMatch(/user_id|u1|u2|email/);
    expect(activity.find((a) => a.kind === "created")?.character.id).toBe("fresh");
  });

  it("adults also see Lover activity", async () => {
    const { activity } = await loadSocialProof(true, NOW);
    expect(activity.map((a) => a.character.id)).toContain("mara");
  });

  it("only the last 24 hours, newest first, at most 6 items", async () => {
    seed({ chats: 30 });
    const { activity } = await loadSocialProof(true, NOW);
    expect(activity.length).toBeLessThanOrEqual(6);
    expect(activity.every((a) => NOW - Date.parse(a.at) <= socialProof.activityWindowHours * 3_600_000)).toBe(
      true,
    );
    const times = activity.map((a) => a.at);
    expect([...times].sort().reverse()).toEqual(times);
  });
});
