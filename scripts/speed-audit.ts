/**
 * Measures how fast each part of Sippa feels, in a real browser.
 *
 *   BASE_URL=http://localhost:3200 npm run speed:audit
 *
 * Point it at a production build (`next start`) for numbers users will see; a dev
 * server adds compile time. Signed-in flows run when E2E_EMAIL / E2E_PASSWORD are
 * set (a dedicated test account — never a real user's). Writes .data/speed-report.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const RUNS = Number(process.env.RUNS ?? 3);

type Row = { area: string; what: string; ms: number[]; budget: number };
const rows: Row[] = [];
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? NaN;

async function time(area: string, what: string, budget: number, fn: () => Promise<void>) {
  const ms: number[] = [];
  await fn(); // warm-up: first hit loads code and fills caches
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    await fn();
    ms.push(Math.round(performance.now() - t));
  }
  rows.push({ area, what, ms, budget });
}

/** Full page load until the given element is visible, plus server response time. */
async function load(page: Page, path: string, ready: string) {
  await page.goto(BASE + path, { waitUntil: "commit" });
  await page.locator(ready).first().waitFor({ state: "visible", timeout: 20_000 });
}

async function serverTime(page: Page, path: string) {
  const res = await page.request.get(BASE + path, { maxRedirects: 0 });
  return res.status();
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: BASE }]);
  const page = await context.newPage();

  // ── Signed out ──
  const publicPages: [string, string, string][] = [
    ["Landing", "/", "h1"],
    ["Home (visitor)", "/app", "text=Brew someone new."],
    ["Explore", "/app/explore", "main li a[href^='/app/c/']"],
    ["Moments (visitor)", "/app/moments", "h1"],
    ["Character page", "/app/c/marie-curie", "h1"],
    ["Sign up", "/signup", "h1"],
  ];
  for (const [what, path, ready] of publicPages) {
    await time("Page load · signed out", what, 2_500, () => load(page, path, ready));
    await time("Server response · signed out", what, 800, async () => void (await serverTime(page, path)));
  }

  // ── Signed in ──
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (email && password) {
    await page.goto(`${BASE}/login?next=/app`);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/app$/, { timeout: 20_000 });

    const privatePages: [string, string, string][] = [
      ["Home", "/app", "text=Brew someone new."],
      ["Moments", "/app/moments", "h1"],
      ["Chats", "/app/chats", "h1"],
      ["Profile", "/app/profile", "h1"],
      ["Create", "/app/create", "h1"],
      ["Plus", "/app/plus", "h1"],
    ];
    for (const [what, path, ready] of privatePages) {
      await time("Page load · signed in", what, 2_500, () => load(page, path, ready));
      await time("Server response · signed in", what, 800, async () => void (await serverTime(page, path)));
    }

    // Clicking around the sidebar (client-side navigation).
    const nav = page.getByRole("navigation", { name: "App" });
    await load(page, "/app", "text=Brew someone new.");
    for (const [link, ready] of [
      ["Explore", "h1:has-text('Explore')"],
      ["Moments", "h1:has-text('Moments')"],
      ["Chats", "h1:has-text('Chats')"],
      ["Profile", "role=switch[name='Characters can message me']"],
      ["Home", "text=Brew someone new."],
    ] as const) {
      await time("Sidebar click", link, 1_500, async () => {
        await nav.getByRole("link", { name: link, exact: true }).click();
        await page.locator(ready).first().waitFor({ state: "visible", timeout: 20_000 });
      });
    }

    // Switching between two chats.
    const openChat = async (id: string) => {
      await load(page, `/app/c/${id}`, "h1");
      await page.getByRole("button", { name: "Start chat" }).first().click();
      await page.waitForURL(/\/app\/chats\/[0-9a-f-]{36}$/, { timeout: 20_000 });
      return new URL(page.url()).pathname;
    };
    const a = await openChat("pip-marlow");
    const b = await openChat("marie-curie");
    const list = page.getByRole("navigation", { name: "Your chats" });
    let target = a;
    await time("Chat", "Switch between chats", 1_500, async () => {
      await list.locator(`a[href="${target}"]`).click();
      await page.waitForURL((u) => u.pathname === target);
      await page.locator("#chat-input").waitFor({ state: "visible" });
      target = target === a ? b : a;
    });
    await time("Chat", "Open a chat (full load)", 2_500, () => load(page, a, "#chat-input"));

    // Moment → Reply → chat open.
    await load(page, "/app/moments", "h1");
    if ((await page.locator("article").count()) > 0) {
      await time("Moments", "Reply → chat ready", 2_500, async () => {
        await load(page, "/app/moments", "article");
        await page.locator("article").first().getByRole("button", { name: "Reply" }).click();
        await page.waitForURL(/\/app\/chats\//, { timeout: 20_000 });
        await page.locator("#chat-input").waitFor({ state: "visible" });
      });
    }
  } else {
    console.log("Signed-in flows skipped: set E2E_EMAIL and E2E_PASSWORD (a dedicated test account).\n");
  }
  await browser.close();

  // ── Report ──
  const over = rows.filter((r) => median(r.ms) > r.budget);
  console.log(`Speed audit — ${BASE} — median of ${RUNS} runs after a warm-up\n`);
  console.log("| Area | What | Median | Runs | Budget | |");
  console.log("|---|---|---|---|---|---|");
  for (const r of rows) {
    const m = median(r.ms);
    console.log(`| ${r.area} | ${r.what} | ${m} ms | ${r.ms.join(", ")} | ${r.budget} ms | ${m > r.budget ? "❌" : "✅"} |`);
  }
  console.log(`\n${over.length ? `${over.length} over budget.` : "Everything within budget."}`);
  mkdirSync(".data", { recursive: true });
  writeFileSync(
    ".data/speed-report.json",
    JSON.stringify({ base: BASE, runs: RUNS, at: new Date().toISOString(), rows }, null, 2),
  );
  if (over.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
