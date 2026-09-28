import { expect, openChat, test } from "./fixtures";

/**
 * Speed budgets for the signed-in app, on a production build. Every click must
 * show the new section quickly; switching chats must not reload the chat list.
 */
const SECTION_BUDGET_MS = 2_500;
const CHAT_SWITCH_BUDGET_MS = 1_500;

const SECTIONS = [
  {
    link: "Explore",
    ready: (p: import("@playwright/test").Page) => p.getByRole("heading", { level: 1, name: "Explore" }),
  },
  {
    link: "Moments",
    ready: (p: import("@playwright/test").Page) => p.getByRole("heading", { level: 1, name: "Moments" }),
  },
  {
    link: "Chats",
    ready: (p: import("@playwright/test").Page) => p.getByRole("heading", { level: 1, name: "Chats" }),
  },
  { link: "Create", ready: (p: import("@playwright/test").Page) => p.getByRole("heading", { level: 1 }) },
  {
    link: "Profile",
    ready: (p: import("@playwright/test").Page) =>
      p.getByRole("switch", { name: "Characters can message me" }),
  },
  {
    link: "Home",
    ready: (p: import("@playwright/test").Page) => p.getByRole("heading", { name: "Brew someone new." }),
  },
];

test("every sidebar section opens within budget", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Brew someone new." })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "App" });
  // Warm-up pass (first visit in a fresh server loads code), then the timed pass.
  for (const pass of ["warm-up", "timed"] as const) {
    for (const s of SECTIONS) {
      const started = Date.now();
      await nav.getByRole("link", { name: s.link, exact: true }).click();
      await expect(s.ready(page)).toBeVisible({ timeout: 15_000 });
      const ms = Date.now() - started;
      if (pass === "timed") {
        console.log(`${s.link} → ${ms} ms`);
        expect(ms, `${s.link} took ${ms} ms`).toBeLessThan(SECTION_BUDGET_MS);
      }
    }
  }
});

test("switching chats is fast and keeps the chat list in place", async ({ page }) => {
  const first = await openChat(page, "pip-marlow");
  const second = await openChat(page, "marie-curie");
  const list = page.getByRole("navigation", { name: "Your chats" });
  await expect(list).toBeVisible();
  // Tag the sidebar node: if it survives the switch, the list wasn't re-rendered from scratch.
  await list.evaluate((el) => el.setAttribute("data-e2e-kept", "1"));

  for (const [target, name] of [
    [first, /Pip Marlow/],
    [second, /Marie Curie/],
    [first, /Pip Marlow/],
  ] as const) {
    const path = new URL(target).pathname;
    const started = Date.now();
    await list.locator(`a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("region", { name: new RegExp(`Chat with ${name.source}`) })).toBeVisible();
    await expect(page.locator("#chat-input")).toBeVisible();
    const ms = Date.now() - started;
    console.log(`switch → ${name.source}: ${ms} ms`);
    expect(ms, `chat switch took ${ms} ms`).toBeLessThan(CHAT_SWITCH_BUDGET_MS);
  }
  await expect(page.locator('nav[data-e2e-kept="1"]')).toHaveCount(1);
});
