import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const load = async () => (await import("./site")).siteConfig.url;

describe("site URL never breaks the build", () => {
  it("uses NEXT_PUBLIC_SITE_URL when valid (trailing slash trimmed)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sippa.app/");
    expect(await load()).toBe("https://sippa.app");
  });

  it("keeps a sub-path (GitHub Pages)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://faceless121212.github.io/Sippa");
    expect(await load()).toBe("https://faceless121212.github.io/Sippa");
  });

  it("an empty value falls back to Vercel's address", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "sippa.vercel.app");
    expect(await load()).toBe("https://sippa.vercel.app");
  });

  it("an invalid value without Vercel falls back to localhost", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(await load()).toBe("http://localhost:3000");
  });
});
