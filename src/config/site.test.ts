import { describe, expect, it } from "vitest";
import { formatPrice, yearlySavingsPercent } from "./site";

describe("pricing helpers", () => {
  it("computes yearly savings", () => {
    expect(yearlySavingsPercent(7.99, 59.99)).toBe(37);
    expect(yearlySavingsPercent(10, 120)).toBe(0);
    expect(yearlySavingsPercent(0, 10)).toBe(0);
  });

  it("formats US dollars", () => {
    expect(formatPrice(13.99)).toBe("$13.99");
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

describe("plans (owner decision 2026-10-14: deck prices + Ultra)", () => {
  it("matches the deck: Plus $13.99/mo, $79.99/yr; Ultra $29.99/mo, $199.99/yr", async () => {
    const { pricing } = await import("./site");
    expect([pricing.plusMonthly, pricing.plusYearly, pricing.ultraMonthly, pricing.ultraYearly]).toEqual([
      13.99, 79.99, 29.99, 199.99,
    ]);
    expect(pricing.currency).toBe("USD");
  });

  it("Ultra is paid and gives more memory, context and Flowers than Plus", async () => {
    const { isPaid, planLimits, pricing } = await import("./site");
    expect([isPaid("free"), isPaid("plus"), isPaid("ultra")]).toEqual([false, true, true]);
    expect(planLimits.ultra.memories).toBeGreaterThan(planLimits.plus.memories);
    expect(planLimits.ultra.historyWindow).toBeGreaterThan(planLimits.plus.historyWindow);
    expect(pricing.ultraMonthlyBeans).toBeGreaterThan(pricing.plusMonthlyBeans);
  });

  it("each subscription item grants the right plan; packs grant none", async () => {
    const { planForItem } = await import("./site");
    expect(planForItem("plus_monthly")).toBe("plus");
    expect(planForItem("ultra_yearly")).toBe("ultra");
    expect(planForItem("beans_600")).toBeNull();
  });
});
