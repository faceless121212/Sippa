import { expect, openChat, test } from "./fixtures";

test("start a chat, send a message and get a streamed reply", async ({ page }) => {
  await openChat(page);
  const input = page.getByLabel(/^Message /);
  await input.fill("Hello from the e2e suite");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Hello from the e2e suite").last()).toBeVisible();
  // The e2e server runs the demo provider (SIPPA_OFFLINE_AI=1), which echoes the message.
  await expect(page.getByText(/Demo reply/).last()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Regenerate reply" }).last()).toBeVisible();
});

test("chat list shows the conversation", async ({ page }) => {
  const url = await openChat(page);
  await page.goto("/app/chats");
  await expect(page.getByRole("heading", { level: 1, name: "Chats" })).toBeVisible();
  await expect(page.locator(`a[href="${new URL(url).pathname}"]`).first()).toBeVisible();
});

test("memory panel: add and forget a memory", async ({ page }) => {
  await openChat(page);
  await page
    .getByRole("button", { name: /Memory/ })
    .first()
    .click();
  const panel = page.getByRole("complementary", { name: "Memory" }).or(page.getByLabel("Memory"));
  const note = `E2E memory ${Date.now()}`;
  await panel.getByPlaceholder("e.g. My dog is called Biscuit").fill(note);
  await panel.getByPlaceholder("e.g. My dog is called Biscuit").press("Enter");
  const forget = page.getByRole("button", { name: `Forget: ${note}` });
  await expect(forget).toBeVisible();
  await forget.click();
  await expect(forget).toHaveCount(0);
});

test("gift menu lists the three gifts", async ({ page }) => {
  await openChat(page);
  await page.getByRole("button", { name: /flowers$/ }).click();
  for (const g of ["Single bloom", "Bouquet", "Grand bouquet"])
    await expect(page.getByRole("button", { name: new RegExp(g) })).toBeVisible();
});

test("character page: bond meter, scenes and like", async ({ page }) => {
  await page.goto("/app/c/pip-marlow");
  await expect(page.getByRole("heading", { name: "Start a scene" })).toBeVisible();
  const locked = page.getByRole("button", { name: /Bond Lv/ });
  if ((await locked.count()) > 0) await expect(locked.first()).toBeDisabled();

  const like = page.getByRole("button", { name: /^(Like|Liked)/ });
  const before = await like.getAttribute("aria-pressed");
  await like.click();
  await expect(page.getByRole("button", { name: /^(Like|Liked)/ })).toHaveAttribute(
    "aria-pressed",
    before === "true" ? "false" : "true",
  );
  await page.getByRole("button", { name: /^(Like|Liked)/ }).click(); // restore
});

test("a free scene opens a chat with an opener", async ({ page }) => {
  await page.goto("/app/c/pip-marlow");
  const scene = page
    .locator("form button:not([disabled])")
    .filter({ hasText: /\w/ })
    .filter({ hasNotText: /Start chat|Like/ });
  await scene.first().click();
  await expect(page).toHaveURL(/\/app\/chats\/[0-9a-f-]{36}$/, { timeout: 15_000 });
  await expect(page.locator("#chat-input")).toBeVisible();
});

test("messages API rejects empty and oversized input", async ({ page }) => {
  const url = await openChat(page);
  const chatId = url.split("/").pop();
  const empty = await page.request.post(`/api/chats/${chatId}/messages`, { data: { content: "" } });
  expect(empty.status()).toBe(400);
  const huge = await page.request.post(`/api/chats/${chatId}/messages`, {
    data: { content: "x".repeat(5000) },
  });
  expect(huge.status()).toBe(400);
});

test("another user's chat id is a 404", async ({ page }) => {
  const res = await page.goto("/app/chats/00000000-0000-4000-8000-000000000000");
  expect(res?.status()).toBe(404);
});
