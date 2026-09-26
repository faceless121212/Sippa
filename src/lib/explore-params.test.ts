import { describe, expect, it } from "vitest";
import { exploreHref, parseExploreParams } from "./explore-params";

describe("parseExploreParams", () => {
  it("keeps valid filters", () => {
    expect(
      parseExploreParams({
        category: "friend",
        tag: "Comfort",
        gender: "female",
        q: " tea ",
        sort: "trending",
      }),
    ).toEqual({
      category: "friend",
      tag: "Comfort",
      gender: "female",
      q: "tea",
      sort: "trending",
      offset: 0,
    });
  });

  it("drops unknown values and clamps offset", () => {
    const p = parseExploreParams(
      new URLSearchParams("category=kids&tag=<script>&gender=x&sort=rand&offset=-5"),
    );
    expect(p).toEqual({
      category: undefined,
      tag: undefined,
      gender: undefined,
      q: undefined,
      sort: "popular",
      offset: 0,
    });
  });
});

describe("exploreHref", () => {
  it("builds clean URLs and lets patches clear values", () => {
    expect(exploreHref({ category: "famous", sort: "popular" })).toBe("/app/explore?category=famous");
    expect(exploreHref({ category: "famous", tag: "Artists" }, { tag: undefined })).toBe(
      "/app/explore?category=famous",
    );
    expect(exploreHref({}, { q: "tea time" })).toBe("/app/explore?q=tea+time");
  });
});
