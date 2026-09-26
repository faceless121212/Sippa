import { afterEach, describe, expect, it, vi } from "vitest";
import { aiLive, llmMode, streamChat } from "./llm";

afterEach(() => vi.unstubAllEnvs());

const req = (said: string, sheet = "You are playing Pip Marlow. Be kind.") => ({
  system: [{ type: "text" as const, text: sheet }],
  messages: [{ role: "user" as const, content: said }],
});

async function collect(said: string, sheet?: string) {
  const out = streamChat(req(said, sheet));
  let text = "";
  for await (const d of out.deltas) text += d;
  return { text, done: await out.done };
}

describe("AI provider switch", () => {
  it("is live only with a key and without SIPPA_OFFLINE_AI", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    vi.stubEnv("SIPPA_OFFLINE_AI", "");
    expect(aiLive()).toBe(true);
    vi.stubEnv("SIPPA_OFFLINE_AI", "1");
    expect(aiLive()).toBe(false);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("SIPPA_OFFLINE_AI", "");
    expect(aiLive()).toBe(false);
  });

  it("refuses to fake replies in production unless explicitly offline", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SIPPA_OFFLINE_AI", "");
    expect(llmMode()).toBe("off");
    expect(() => streamChat(req("hi"))).toThrow(/ANTHROPIC_API_KEY/);
    vi.stubEnv("SIPPA_OFFLINE_AI", "1");
    expect(llmMode()).toBe("demo");
  });

  it("offline mode never calls Anthropic, even with a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    vi.stubEnv("SIPPA_OFFLINE_AI", "1");
    const { text, done } = await collect("hello there");
    expect(text).toContain("Demo reply");
    expect(text).toContain("hello there");
    expect(text).toContain("Pip Marlow");
    expect(done).toEqual({ text, refused: false, truncated: false });
  });

  it("demo replies still disclose being an AI when sincerely asked", async () => {
    vi.stubEnv("SIPPA_OFFLINE_AI", "1");
    const { text } = await collect("are you human?", "You are playing Pip. The user is sincerely asking whether you're human.");
    expect(text).toMatch(/I'm an AI character/);
  });
});
