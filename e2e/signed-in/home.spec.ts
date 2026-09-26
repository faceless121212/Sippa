import { expect, test } from "./fixtures";

test("home shows the Flowers balance, check-in and rankings", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Brew someone new." })).toBeVisible();
  const chip = page.getByRole("link", { name: /\d+ Flowers — get more/ });
  await expect(chip).toBeVisible();
  // The chip sits inside the banner, not hidden behind it.
  await chip.click({ trial: true });

  const checkin = page.getByRole("region", { name: /check-in|Checked in|Flowers — see you/ });
  await expect(checkin).toBeVisible();
  const claim = checkin.getByRole("button", { name: /Claim \+\d+/ });
  if (await claim.isVisible()) {
    await claim.click();
    await expect(checkin.getByRole("heading")).toHaveText(/Flowers — see you tomorrow|Checked in today/);
  }
  // Claiming twice is refused server-side.
  const again = await page.request.post("/api/checkin");
  expect(again.status()).toBe(409);
});

test("moment Reply opens the chat quickly and delivers the moment", async ({ page }) => {
  await page.goto("/app/moments");
  await expect(page.getByRole("heading", { level: 1, name: "Moments" })).toBeVisible();
  const card = page.locator("article").first();
  test.skip((await card.count()) === 0, "No moments in the feed yet.");
  const text = (await card.locator("p").nth(1).innerText()).trim().slice(0, 40);

  const started = Date.now();
  await card.getByRole("button", { name: "Reply" }).click();
  await expect(page).toHaveURL(/\/app\/chats\/[0-9a-f-]{36}$/, { timeout: 10_000 });
  await expect(page.locator("#chat-input")).toBeVisible();
  const elapsed = Date.now() - started;
  console.log(`moment reply → chat ready in ${elapsed} ms`);
  expect(elapsed, "Reply should open the chat in under 4 s").toBeLessThan(4_000);
  await expect(page.getByText("shared a moment:").last()).toBeVisible();
  await expect(page.getByText(text, { exact: false }).last()).toBeVisible();
});

test("moment Like toggles", async ({ page }) => {
  await page.goto("/app/moments");
  const like = page.locator("article").first().getByRole("button", { pressed: false }).first();
  test.skip((await page.locator("article").count()) === 0, "No moments in the feed yet.");
  await like.click();
  await expect(page.locator("article").first().locator("button[aria-pressed=true]")).toBeVisible();
  await page.locator("article").first().locator("button[aria-pressed=true]").click();
  await expect(page.locator("article").first().locator("button[aria-pressed=false]").first()).toBeVisible();
});
