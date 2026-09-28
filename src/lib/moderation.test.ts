import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 0);
const moderateDraft = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake.client }));
vi.mock("@/lib/creator/ai", () => ({ moderateDraft: (...a: unknown[]) => moderateDraft(...a) }));

const { autoReviewReport, AUTO_HIDE_REPORTS } = await import("./moderation");

const report = (id: string, targetId: string, targetType = "character") => ({
  id,
  target_type: targetType,
  target_id: targetId,
  reason: "other",
  status: "open",
});

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    characters: [
      {
        id: "user-made",
        creator_id: "u9",
        status: "approved",
        category: "friend",
        name: "X",
        hook: "h",
        personality: {},
      },
      {
        id: "official",
        creator_id: null,
        status: "approved",
        category: "famous",
        name: "Y",
        hook: "h",
        personality: {},
      },
    ],
    reports: [],
    messages: [{ id: 7, content: "hello", flagged: false }],
    audit_log: [],
  });
  moderateDraft.mockReset().mockResolvedValue({ allowed: true, explanation: "fine" });
});

describe("automated report review", () => {
  it("hides a user-made character at the report threshold and logs it", async () => {
    for (let i = 1; i <= AUTO_HIDE_REPORTS; i++) tables.reports.push(report(`r${i}`, "user-made"));
    await autoReviewReport(`r${AUTO_HIDE_REPORTS}`);
    expect(tables.characters[0].status).toBe("hidden");
    expect(tables.reports.every((r) => r.status === "auto_hidden")).toBe(true);
    expect(tables.audit_log).toContainEqual(
      expect.objectContaining({ action: "character.auto_hide", target_id: "user-made" }),
    );
  });

  it("below the threshold, a clean character stays up and keeps its report open for a human", async () => {
    tables.reports.push(report("r1", "user-made"));
    await autoReviewReport("r1");
    expect(tables.characters[0].status).toBe("approved");
    expect(tables.reports[0]).toMatchObject({ status: "open", auto_verdict: expect.anything() });
  });

  it("hides immediately when the AI review finds a clear violation", async () => {
    moderateDraft.mockResolvedValue({ allowed: false, explanation: "real living person" });
    tables.reports.push(report("r1", "user-made"));
    await autoReviewReport("r1");
    expect(tables.characters[0]).toMatchObject({ status: "hidden", moderation_note: "real living person" });
  });

  it("never auto-hides official characters, however many reports", async () => {
    for (let i = 1; i <= AUTO_HIDE_REPORTS + 2; i++) tables.reports.push(report(`r${i}`, "official"));
    await autoReviewReport("r1");
    expect(tables.characters[1].status).toBe("approved");
    expect(moderateDraft).not.toHaveBeenCalled();
  });

  it("ignores reports that are already closed", async () => {
    tables.reports.push({ ...report("r1", "user-made"), status: "dismissed" });
    await autoReviewReport("r1");
    expect(tables.characters[0].status).toBe("approved");
  });

  it("message reports without an AI verdict stay open for a human", async () => {
    tables.reports.push(report("r1", "7", "message"));
    await autoReviewReport("r1");
    expect(tables.messages[0].flagged).toBe(false);
    expect(tables.reports[0].status).toBe("open");
  });
});
