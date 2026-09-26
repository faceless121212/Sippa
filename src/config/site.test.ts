import { describe, expect, it } from "vitest";
import { formatPrice, yearlySavingsPercent } from "./site";

describe("pricing helpers", () => {
  it("computes yearly savings", () => {
    expect(yearlySavingsPercent(7.99, 59.99)).toBe(37);
    expect(yearlySavingsPercent(10, 120)).toBe(0);
    expect(yearlySavingsPercent(0, 10)).toBe(0);
  });

  it("formats euros", () => {
    expect(formatPrice(7.99)).toBe("€7.99");
  });
});
