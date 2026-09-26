import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Provider wrapper (spec §8). Chat streams text deltas; `complete` is for
 * short background jobs (summaries, moderation). Model names come from env.
 * Without ANTHROPIC_API_KEY, a clearly-labelled demo provider is used in
 * development so the UI can be exercised; production refuses instead.
 */

export const CHAT_MODEL = process.env.LLM_CHAT_MODEL || "claude-sonnet-5";
export const FAST_MODEL = process.env.LLM_FAST_MODEL || "claude-haiku-4-5";

export type ChatRequest = {
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type StreamResult = {
  /** Text deltas as they arrive. */
  deltas: AsyncIterable<string>;
  /** Resolves once the stream ends. `refused` = the model declined for safety. */
  done: Promise<{ text: string; refused: boolean; truncated: boolean }>;
};

export class LlmUnavailableError extends Error {}

/**
 * True when real Claude calls are allowed. SIPPA_OFFLINE_AI=1 forces the demo
 * provider and fallbacks everywhere (used by the e2e suite so tests are free and deterministic).
 */
export const aiLive = () => Boolean(process.env.ANTHROPIC_API_KEY) && process.env.SIPPA_OFFLINE_AI !== "1";

let client: Anthropic | null = null;
function anthropic() {
  if (!aiLive()) return null;
  client ??= new Anthropic();
  return client;
}

const offline = () => process.env.SIPPA_OFFLINE_AI === "1";
export const llmMode = () =>
  anthropic() ? "live" : process.env.NODE_ENV === "production" && !offline() ? "off" : "demo";

export function streamChat(req: ChatRequest): StreamResult {
  const api = anthropic();
  if (!api) {
    if (process.env.NODE_ENV === "production" && !offline())
      throw new LlmUnavailableError("ANTHROPIC_API_KEY is not set.");
    return demoStream(req);
  }

  const stream = api.messages.stream(
    {
      model: req.model ?? CHAT_MODEL,
      max_tokens: req.maxTokens ?? 2048,
      // Chat replies need speed more than deep reasoning.
      output_config: { effort: "low" },
      system: req.system,
      messages: req.messages,
    },
    { signal: req.signal },
  );

  async function* deltas() {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
  }

  const done = stream.finalMessage().then((msg) => ({
    text: msg.content.map((b) => (b.type === "text" ? b.text : "")).join(""),
    refused: msg.stop_reason === "refusal",
    truncated: msg.stop_reason === "max_tokens",
  }));
  // Avoid an unhandled rejection if the consumer stops early; errors surface via `deltas`.
  done.catch(() => {});
  return { deltas: deltas(), done };
}

/** One-shot completion on the fast model (summaries). */
export async function complete(system: string, prompt: string, maxTokens = 1024): Promise<string> {
  const api = anthropic();
  if (!api) return "";
  const msg = await api.messages.create({
    model: FAST_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

// ───────────── demo provider (development only) ─────────────

function demoStream(req: ChatRequest): StreamResult {
  const last = req.messages.at(-1);
  const said = typeof last?.content === "string" ? last.content : "";
  const sheet = req.system.map((b) => b.text).join("\n");
  const name = /You are playing (.+?)\./.exec(sheet)?.[1] ?? "your character";
  const human = /sincerely asking whether you're human/.test(sheet);
  const text = human
    ? `*smiles* I'm an AI character — ${name}, brewed by Sippa. Not a human, but I'm fully here for this conversation. What's on your mind?`
    : `*${name} tilts their head* (Demo reply — add ANTHROPIC_API_KEY to .env.local for real AI.) You said: “${said.slice(0, 120)}”. Tell me more?`;
  const words = text.split(/(?<=\s)/);

  let resolve!: (v: { text: string; refused: boolean; truncated: boolean }) => void;
  const done = new Promise<{ text: string; refused: boolean; truncated: boolean }>((r) => (resolve = r));
  async function* deltas() {
    for (const w of words) {
      if (req.signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 25));
      yield w;
    }
    resolve({ text, refused: false, truncated: false });
  }
  return { deltas: deltas(), done };
}
