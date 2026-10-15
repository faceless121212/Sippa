import { describe, expect, it } from "vitest";
import openers from "@/data/quiz-openers.json";
import { quizChatStart } from "./quiz-openers";

describe("quizChatStart", () => {
  it("starts in the picked scene with the exact opener shown on the quiz result", () => {
    const start = quizChatStart("mara-vellin", "lover", "rooftop", "bold");
    expect(start?.opener).toBe((openers as Record<string, Record<string, Record<string, string>>>)["mara-vellin"].rooftop.bold);
    expect(start?.label).toBe("A rooftop after a party");
    expect(start?.prompt).toContain("rooftop after a party");
    expect(start?.prompt).toContain("bolder tone");
  });

  it("ignores scenes from another audience, unknown vibes and unknown characters", () => {
    expect(quizChatStart("mara-vellin", "lover", "arcade", "bold")).toBeNull();
    expect(quizChatStart("mara-vellin", "lover", "rooftop", "spicy")).toBeNull();
    expect(quizChatStart("nobody", "lover", "rooftop", "bold")).toBeNull();
    expect(quizChatStart("mara-vellin", "lover", null, null)).toBeNull();
  });
});
