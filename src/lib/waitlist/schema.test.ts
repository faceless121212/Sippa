import { describe, expect, it } from "vitest";
import { waitlistSchema } from "./schema";

describe("waitlistSchema", () => {
  it("accepts a valid email with consent and normalises it", () => {
    const r = waitlistSchema.safeParse({ email: "  Ada@Example.COM ", consent: true });
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("ada@example.com");
  });

  it("rejects missing consent", () => {
    const r = waitlistSchema.safeParse({ email: "ada@example.com", consent: false });
    expect(r.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    for (const email of ["", "nope", "a@b", "x".repeat(250) + "@example.com"]) {
      expect(waitlistSchema.safeParse({ email, consent: true }).success).toBe(false);
    }
  });

  it("flags a filled honeypot", () => {
    const r = waitlistSchema.safeParse({ email: "ada@example.com", consent: true, website: "spam.biz" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path[0]).toBe("website");
  });
});
