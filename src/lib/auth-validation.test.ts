import { describe, expect, it } from "vitest";
import { passwordSchema, signInSchema, signUpAgeOk, signUpSchema } from "./auth-validation";

describe("sign-up validation", () => {
  const ok = { email: " Me@Example.com ", password: "sippa2026", dob: "1995-04-02", terms: "on" };

  it("accepts a valid sign-up and normalises the email", () => {
    const r = signUpSchema.safeParse(ok);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("me@example.com");
  });

  it("requires a decent password", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("onlyletters").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("letters123").success).toBe(true);
  });

  it("requires the 18+/Terms checkbox and a date of birth", () => {
    expect(signUpSchema.safeParse({ ...ok, terms: undefined }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ok, dob: "" }).success).toBe(false);
  });

  it("refuses under-18s before any account exists", () => {
    const today = new Date(Date.UTC(2026, 8, 26));
    expect(signUpAgeOk("2008-09-26", today)).toBe(true);
    expect(signUpAgeOk("2008-09-27", today)).toBe(false);
  });
});

describe("sign-in validation", () => {
  it("needs an email and a password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});
