import { describe, expect, it } from "vitest";
import { ageOn, isAdult } from "./age";

const today = new Date(Date.UTC(2026, 8, 26)); // 26 Sep 2026

describe("age gate", () => {
  it("computes whole years around the birthday", () => {
    expect(ageOn("2008-09-26", today)).toBe(18);
    expect(ageOn("2008-09-27", today)).toBe(17);
    expect(ageOn("1990-01-01", today)).toBe(36);
  });

  it("requires 18+", () => {
    expect(isAdult("2008-09-26", today)).toBe(true);
    expect(isAdult("2008-09-27", today)).toBe(false);
    expect(isAdult("2015-05-05", today)).toBe(false);
  });

  it("rejects invalid or impossible dates", () => {
    for (const dob of ["", "2000-02-30", "26/09/2000", "2030-01-01", "1850-01-01"]) {
      expect(ageOn(dob, today), dob).toBeNull();
      expect(isAdult(dob, today)).toBe(false);
    }
  });
});
