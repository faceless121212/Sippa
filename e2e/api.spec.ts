import { expect, test } from "@playwright/test";

// API routes are the same at every width; run them once.
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop-1440"));

const ID = "00000000-0000-4000-8000-000000000000";

/** Every mutating or private endpoint must refuse signed-out callers — and never crash. */
const PRIVATE: [method: "get" | "post", path: string, body?: unknown][] = [
  ["get", "/api/account/export"],
  ["post", "/api/billing/checkout", { item: "plus_monthly" }],
  ["post", "/api/billing/portal"],
  ["post", `/api/chats/${ID}/messages`, { content: "hi" }],
  ["post", `/api/chats/${ID}/regenerate`],
  ["post", `/api/chats/${ID}/edit`, { messageId: 1, content: "hi" }],
  ["post", `/api/chats/${ID}/gift`, { size: 5 }],
  ["post", "/api/checkin"],
  ["post", "/api/creator/generate", { category: "friend", mode: "text", idea: "a kind baker" }],
  ["post", "/api/creator/field", {}],
  ["post", "/api/creator/avatars", {}],
  ["post", "/api/creator/preview", {}],
  ["post", "/api/creator/save", {}],
  ["post", "/api/messages/1/rate", { rating: 1 }],
  ["post", `/api/moments/${ID}/reply`],
  ["post", `/api/nudge/${ID}/reply`],
  ["post", "/api/report", { targetType: "character", targetId: "marie-curie", reason: "other" }],
];

for (const [method, path, body] of PRIVATE) {
  test(`signed-out ${method.toUpperCase()} ${path} is refused`, async ({ request }) => {
    const res = await request[method](path, body === undefined ? {} : { data: body });
    expect(res.status(), await res.text()).toBeGreaterThanOrEqual(400);
    // 503 = payments not configured (Stripe off) — a deliberate refusal, not a crash.
    expect([500, 502, 504]).not.toContain(res.status());
  });
}

test("signed-out popup poll gets nothing", async ({ request }) => {
  const res = await request.post("/api/nudge");
  expect([204, 401]).toContain(res.status());
});

test("malformed ids are rejected without a server error", async ({ request }) => {
  for (const path of ["/api/moments/not-a-uuid/reply", "/api/nudge/../reply", "/api/chats/xyz/messages"]) {
    const res = await request.post(path, { data: {} });
    expect(res.status(), path).toBeLessThan(500);
    expect(res.status(), path).toBeGreaterThanOrEqual(400);
  }
});

test("Stripe webhook rejects unsigned events", async ({ request }) => {
  const res = await request.post("/api/billing/webhook", { data: { type: "checkout.session.completed" } });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect([500, 502, 504]).not.toContain(res.status());
});

test("public character API pages through results and hides 18+ from visitors", async ({ request }) => {
  const res = await request.get("/api/characters");
  expect(res.status()).toBe(200);
  const { items, nextOffset } = await res.json();
  expect(items.length).toBeGreaterThan(0);
  expect(typeof nextOffset === "number" || nextOffset === null).toBe(true);
  expect(items.some((c: { category: string }) => c.category === "lover")).toBe(false);

  const lover = await (await request.get("/api/characters?category=lover")).json();
  expect(lover.items).toHaveLength(0);

  const next = await (await request.get(`/api/characters?offset=${nextOffset}`)).json();
  expect(next.items[0]?.id).not.toBe(items[0].id);
});

test("API responses never leak secrets", async ({ request }) => {
  const body = await (await request.get("/api/characters")).text();
  expect(body).not.toMatch(/sk-ant-|service_role|SUPABASE_SERVICE|FAL_KEY|re_[A-Za-z0-9]{8}/);
});
