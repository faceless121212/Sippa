import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps relative paths", () => {
    expect(safeNext("/app/explore?category=friend")).toBe("/app/explore?category=friend");
  });
  it("blocks external and protocol-relative redirects", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null]) {
      expect(safeNext(bad)).toBe("/app");
    }
  });
});
