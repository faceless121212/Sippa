import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

test("home (signed out) shows rankings and sends actions to sign-up", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Brew someone new." })).toBeVisible();
  await expect(page.locator("main a[href^='/app/c/']").first()).toBeVisible();
  // No Flowers chip or check-in for visitors.
  await expect(page.getByRole("link", { name: /Flowers — get more/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Claim \+/ })).toHaveCount(0);
});

test("moments feed (signed out): Reply and Like lead to sign-up", async ({ page }) => {
  await page.goto("/app/moments");
  await expect(page.getByRole("heading", { level: 1, name: "Moments" })).toBeVisible();
  const card = page.locator("article").first();
  test.skip((await card.count()) === 0, "No moments in the feed yet.");
  for (const name of ["Reply", /^(Like|\d+)$/]) {
    await expect(card.getByRole("link", { name })).toHaveAttribute("href", "/signup?next=/app/moments");
  }
  await card.getByRole("link", { name: "Reply" }).click();
  await expect(page).toHaveURL(/\/signup\?next=/);
});

test("moments feed never shows 18+ characters to visitors", async ({ page }) => {
  await page.goto("/app/moments");
  for (const name of ["Mara Vellin", "Theo Hart"]) await expect(page.getByText(name)).toHaveCount(0);
});

for (const [slug, title] of [
  ["privacy", "Privacy Policy"],
  ["terms", "Terms of Service"],
  ["cookies", "Cookie Policy"],
  ["guidelines", "Community Guidelines"],
] as const) {
  test(`legal page /legal/${slug}`, async ({ page }) => {
    await page.goto(`/legal/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  });
}

test("unknown legal pages and routes 404", async ({ page }) => {
  expect((await page.goto("/legal/nope"))?.status()).toBe(404);
  expect((await page.goto("/definitely-not-a-page"))?.status()).toBe(404);
});

test("onboarding and account-deleted pages", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login|\/signup|\/onboarding/);
  await page.goto("/account-deleted");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("character pages for every category render for visitors", async ({ page }) => {
  for (const id of ["pip-marlow", "marie-curie"]) {
    const res = await page.goto(`/app/c/${id}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("You're chatting with an AI character")).toBeVisible();
  }
});

test("explore search finds characters by name", async ({ page }) => {
  await page.goto("/app/explore");
  const search = page.getByPlaceholder("Search names, vibes, tags…");
  await search.fill("Curie");
  await search.press("Enter");
  await expect(page.getByText("Marie Curie").first()).toBeVisible();
});

test("theme toggle switches between light and dark", async ({ page }) => {
  await page.goto("/app");
  const html = page.locator("html");
  const before = await html.getAttribute("class");
  await page.getByRole("button", { name: "Toggle light and dark theme" }).first().click();
  await expect(html).not.toHaveAttribute("class", before ?? "");
});

test("key pages load fast (production build)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  for (const path of ["/", "/app", "/app/explore", "/app/moments", "/app/c/marie-curie"]) {
    const started = Date.now();
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const ms = Date.now() - started;
    console.log(`${path} → ${ms} ms`);
    expect(ms, `${path} took ${ms} ms`).toBeLessThan(5_000);
  }
});
