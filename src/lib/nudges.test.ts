import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

describe("character messages (nudges)", () => {
  it("rejects messages that are only an *action*", async () => {
    const { hasSpokenWords } = await import("./nudges");
    expect(hasSpokenWords("*settles by the window at dusk*")).toBe(false);
    expect(hasSpokenWords("*waves* Hey — rainy day. Coffee later?")).toBe(true);
    expect(hasSpokenWords("…")).toBe(false);
  });

  it("enforces at least ~3 minutes between popups on the server", async () => {
    const { NUDGE_MIN_GAP_MS } = await import("./nudges");
    expect(NUDGE_MIN_GAP_MS).toBeGreaterThanOrEqual(170_000);
    expect(NUDGE_MIN_GAP_MS).toBeLessThan(180_000); // client fires every 3–4 min
  });
});
