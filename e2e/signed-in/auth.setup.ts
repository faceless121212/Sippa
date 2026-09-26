import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test as setup } from "@playwright/test";

const STATE = "e2e/.auth/user.json";

/**
 * Signs the dedicated test account in once and saves the session for the
 * signed-in project. Needs E2E_EMAIL / E2E_PASSWORD in .env.local — an adult,
 * email-confirmed account you created for testing (never a real user's).
 */
setup("sign in the test account", async ({ page }) => {
  mkdirSync("e2e/.auth", { recursive: true });
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    writeFileSync(STATE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.local to run the signed-in tests.");
    return;
  }
  await page
    .context()
    .addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
  await page.goto("/login?next=/app");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Brew someone new." })).toBeVisible();
  await page.context().storageState({ path: STATE });
});
