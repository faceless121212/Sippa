import { describe, expect, it } from "vitest";
import { findLivingPerson, nameIsLivingPerson } from "./blocklist";

describe("living-person blocklist (spec §6.3)", () => {
  it("blocks characters named after living celebrities, accents and case ignored", () => {
    expect(nameIsLivingPerson("Taylor Swift")).toBe("Taylor Swift");
    expect(nameIsLivingPerson("TIMOTHÉE CHALAMET")).toBe("Timothee Chalamet");
    expect(nameIsLivingPerson("Iga Świątek")).toBe("Iga Swiatek");
    expect(nameIsLivingPerson("Robert Lewandowski")).toBe("Robert Lewandowski");
    expect(nameIsLivingPerson("Drake")).toBe("Drake");
    expect(nameIsLivingPerson("Jungkook")).toBe("Jungkook");
  });

  it("finds living people mentioned in descriptions", () => {
    expect(findLivingPerson("A pop star who is basically Taylor Swift")).toBe("Taylor Swift");
    expect(findLivingPerson("looks exactly like Zendaya")).toBe("Zendaya");
    expect(findLivingPerson("based on elon musk")).toBe("Elon Musk");
  });

  it("does not flag ordinary names or historical figures", () => {
    expect(nameIsLivingPerson("Mara Vellin")).toBeNull();
    expect(nameIsLivingPerson("Marie Curie")).toBeNull();
    expect(findLivingPerson("Margaret, a baker who loves roses and drakes on the pond")).toBeNull();
    expect(findLivingPerson("She has a younger sister named Rose")).toBeNull();
  });
});
