import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  // Pre-accept essential cookies so the banner doesn't cover content.
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

test("renders all landing sections without horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("brew your own");
  for (const id of ["vibes", "creator", "why", "hot", "pricing", "faq", "waitlist"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("category tabs switch sample characters and deep links", async ({ page }) => {
  await page.goto("/");
  const panel = page.getByRole("tabpanel");
  await expect(page.getByRole("tab", { name: /Lover/ })).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("Mara Vellin");

  await page.getByRole("tab", { name: /Famous/ }).click();
  await expect(panel).toContainText("Ada Lovelace");
  await expect(panel.getByRole("link", { name: /Start chatting/ })).toHaveAttribute(
    "href",
    "/app/explore?category=famous",
  );

  // Arrow-key navigation (WAI-ARIA tabs pattern).
  await page.getByRole("tab", { name: /Famous/ }).press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /Friend/ })).toBeFocused();
  await expect(panel).toContainText("Pip Marlow");
});

test("creator demo brews a pre-made character", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Who do you want to talk to?").fill("someone to date who runs a bookshop");
  await page.getByRole("button", { name: "Brew", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Isla Maren/ })).toBeVisible();
});

test("pricing toggle shows yearly price", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#pricing");
  await expect(pricing).toContainText("€7.99");
  await pricing.getByText(/Yearly/).click();
  await expect(pricing).toContainText("€59.99");
  await expect(pricing).toContainText("save 37%");
});

test("FAQ answers expand", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Who can use Sippa?").click();
  await expect(page.getByText(/Adults 18\+/)).toBeVisible();
});

test("waitlist requires consent, then succeeds", async ({ page }, testInfo) => {
  await page.goto("/");
  const form = page.locator("#waitlist");
  await form.getByLabel("Email address").fill(`e2e-${testInfo.project.name}-${Date.now()}@example.com`);
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByRole("status")).toHaveCount(0);

  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByRole("status")).toContainText("You're on the list");
});

test("waitlist API rejects bad input", async ({ request }) => {
  const res = await request.post("/api/waitlist", { data: { email: "nope", consent: true } });
  expect(res.status()).toBe(400);
  const noConsent = await request.post("/api/waitlist", { data: { email: "a@example.com", consent: false } });
  expect(noConsent.status()).toBe(400);
});

test("skip link is the first keyboard stop", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("cookie banner appears for new visitors and remembers the choice", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Cookie consent" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Essential only" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(banner).toBeHidden();
  await context.close();
});

test("SEO and PWA endpoints respond", async ({ request }) => {
  for (const path of [
    "/sitemap.xml",
    "/robots.txt",
    "/manifest.webmanifest",
    "/opengraph-image",
    "/pwa-icon/512",
    "/legal/privacy",
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});
