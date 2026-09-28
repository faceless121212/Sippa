import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

test("explore lists characters, filters by category and loads more on scroll", async ({ page }) => {
  await page.goto("/app/explore");
  await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
  const cards = page.locator("main li a[href^='/app/c/']");
  await expect(cards).toHaveCount(12);
  await page.locator("main li").last().scrollIntoViewIfNeeded();
  await expect(cards).not.toHaveCount(12); // infinite scroll fetched more

  await page
    .getByRole("link", { name: /Famous/ })
    .first()
    .click();
  await expect(page).toHaveURL(/category=famous/);
  await expect(page.getByText("Marcus Aurelius")).toBeVisible();
  await expect(page.getByText("Pip Marlow")).toHaveCount(0);
});

test("Lover is hidden from signed-out visitors (18+ gate)", async ({ page }) => {
  await page.goto("/app/explore");
  await expect(page.getByRole("navigation", { name: "Categories" }).getByText("Lover")).toHaveCount(0);
  await expect(page.getByText("Mara Vellin")).toHaveCount(0);

  await page.goto("/app/explore?category=lover");
  await expect(page.getByText("Lover is 18+")).toBeVisible();

  await page.goto("/app/c/mara-vellin");
  await expect(page.getByText("This character is 18+")).toBeVisible();
});

test("character page shows sheet, AI disclosure and actions", async ({ page }) => {
  await page.goto("/app/c/marie-curie");
  await expect(page.getByRole("heading", { level: 1, name: /Marie Curie/ })).toBeVisible();
  await expect(page.getByText("You're chatting with an AI character")).toBeVisible();
  // Visitors are sent to sign-up (new accounts), with a way back to this character.
  await expect(page.getByRole("link", { name: "Start chat" })).toHaveAttribute("href", /\/signup\?next=/);
  await page.getByRole("button", { name: "Report" }).click();
  await expect(page.getByRole("dialog", { name: "Report" })).toBeVisible();
});

test("unknown characters 404", async ({ page }) => {
  const res = await page.goto("/app/c/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("protected pages send signed-out users to login", async ({ page }) => {
  for (const path of ["/app/chats", "/app/create", "/app/profile", "/app/plus", "/app/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`),
    );
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  }
});

test("login rejects open redirects", async ({ page }) => {
  await page.goto("/login?next=https://evil.example");
  await expect(page.locator("input[name=next]").first()).toHaveValue("/app");
});

test("navigation: sidebar on desktop, bottom bar with Create on mobile", async ({ page }, testInfo) => {
  await page.goto("/app");
  const mobile = testInfo.project.name === "mobile-360";
  if (mobile) {
    await expect(page.getByRole("link", { name: "Create a character" }).last()).toBeVisible();
  } else {
    await expect(page.locator("aside").getByRole("link", { name: "Explore" })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
