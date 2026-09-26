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

describe("billing config", () => {
  it("has three Bean packs with better value as they grow", async () => {
    const { beanPacks, STRIPE_ITEMS } = await import("./site");
    expect(beanPacks).toHaveLength(3);
    const perBean = beanPacks.map((p) => p.price / p.beans);
    expect(perBean[1]).toBeLessThan(perBean[0]);
    expect(perBean[2]).toBeLessThan(perBean[1]);
    for (const p of beanPacks) expect(STRIPE_ITEMS[p.id].mode).toBe("payment");
    expect(STRIPE_ITEMS.plus_monthly.mode).toBe("subscription");
  });
});
