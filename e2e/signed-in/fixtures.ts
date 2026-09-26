import { test as base, expect } from "@playwright/test";

/** Signed-in tests: skipped (not failed) until a test account is configured. */
export const test = base.extend<{ requireAccount: void }>({
  requireAccount: [
    async ({}, use, testInfo) => {
      testInfo.skip(
        !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
        "No E2E_EMAIL / E2E_PASSWORD in .env.local.",
      );
      await use();
    },
    { auto: true },
  ],
});

/** Starts (or reopens) a chat with a Friend character and returns its URL. */
export async function openChat(page: import("@playwright/test").Page, characterId = "pip-marlow") {
  await page.goto(`/app/c/${characterId}`);
  await page.getByRole("button", { name: "Start chat" }).first().click();
  await expect(page).toHaveURL(/\/app\/chats\/[0-9a-f-]{36}$/, { timeout: 15_000 });
  return page.url();
}

export { expect };
