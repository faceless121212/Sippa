import { describe, expect, it } from "vitest";
import { bondLevel, checkinReward, nextStreak, SCENES } from "./engagement";

describe("bond levels", () => {
  it("maps XP to levels with category names", () => {
    expect(bondLevel(0, "lover")).toMatchObject({ level: 1, name: "Stranger", nextAt: 20 });
    expect(bondLevel(60, "friend")).toMatchObject({ level: 3, name: "Friend" });
    expect(bondLevel(999, "famous")).toMatchObject({
      level: 5,
      name: "Kindred spirit",
      nextAt: null,
      progress: 1,
    });
    expect(bondLevel(40, "lover").progress).toBeCloseTo(0.5);
  });
});

describe("daily check-in", () => {
  it("builds streaks and pays a bonus every 7th day", () => {
    expect(nextStreak(null)).toBe(1);
    expect(nextStreak(6)).toBe(7);
    expect(checkinReward(3).total).toBe(5);
    expect(checkinReward(7)).toEqual({ daily: 5, bonus: 30, total: 35 });
    expect(checkinReward(14).bonus).toBe(30);
  });
});

describe("scenes", () => {
  it("every category has free scenes and locked ones", () => {
    for (const list of Object.values(SCENES)) {
      expect(list.some((s) => s.minLevel === 1)).toBe(true);
      expect(list.some((s) => s.minLevel > 1)).toBe(true);
    }
  });
});
