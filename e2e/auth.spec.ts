import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

test("sign-up form: fields, live password rules and links", async ({ page }) => {
  await page.goto("/signup?next=/app/create");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  for (const label of ["Email", "Password", "Date of birth"])
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();

  const rules = page.locator("#password-rules");
  await expect(rules).toContainText("8+ characters — missing");
  await page.getByLabel("Password", { exact: true }).fill("sippa2026");
  await expect(rules).toContainText("8+ characters — done");
  await expect(rules).toContainText("a number — done");

  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");

  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fcreate/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/signup/);
});

test("under-18s are refused before any account is created", async ({ page }) => {
  await page.goto("/signup");
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  await page.getByLabel("Email", { exact: true }).fill("minor-e2e@example.com");
  await page.getByLabel("Password", { exact: true }).fill("sippa2026");
  // The date input's max blocks under-18 dates in the browser; remove it to exercise the server check.
  await page.getByLabel("Date of birth").evaluate((el) => el.removeAttribute("max"));
  await page.getByLabel("Date of birth").fill(d.toISOString().slice(0, 10));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding\/blocked/);
  await expect(page.getByRole("heading", { name: "Sippa is for adults only" })).toBeVisible();
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/onboarding\/blocked/); // cookie keeps them out
});

test("sign-in page offers password, magic link, Google and reset", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.getByRole("button", { name: "Email me a sign-in link instead" }).click();
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  await page.getByRole("button", { name: "Use my password instead" }).click();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
});

test("reset-password page requires the emailed link", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page).toHaveURL(/\/forgot-password/);
});
