import { expect, test } from "./fixtures";

test("demo Flowers purchase adds Flowers, then a gift spends them", async ({ page }) => {
  await page.goto("/app/plus");
  await page.getByRole("button", { name: "Buy for €1.99" }).click();
  await expect(page).toHaveURL(/\/app\/plus\/checkout/);
  await expect(page.getByText("DEMO CHECKOUT — no real payment is taken")).toBeVisible();
  await page.getByRole("button", { name: "Confirm demo purchase" }).click();
  await expect(page.getByText(/200 Flowers added/)).toBeVisible({ timeout: 15_000 });

  await page.goto("/app/c/pip-marlow");
  await page.getByRole("button", { name: "Start chat" }).first().click();
  await expect(page).toHaveURL(/\/app\/chats\//);
  await page.getByRole("button", { name: /flowers$/ }).click();
  await page.getByRole("button", { name: /Single bloom/ }).click();
  await expect(page.getByText("gives you a single bloom").last()).toBeVisible();
  await expect(page.getByText(/Demo reply/).last()).toBeVisible({ timeout: 15_000 });
});

test("Plus page offers monthly and yearly with the demo checkout", async ({ page }) => {
  await page.goto("/app/plus");
  await expect(page.getByRole("button", { name: "Go monthly" })).toBeVisible();
  await page.getByRole("button", { name: /Go yearly · save \d+%/ }).click();
  await expect(page).toHaveURL(/\/app\/plus\/checkout/);
  await expect(page.getByText("€59.99")).toBeVisible();
  // Leave without buying so the test account stays on the free plan.
});

test("profile: stats, settings, nudge toggle and data export", async ({ page }) => {
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const toggle = page.getByRole("switch", { name: "Characters can message me" });
  const was = await toggle.getAttribute("aria-checked");
  await toggle.click();
  await expect(page.getByRole("switch", { name: "Characters can message me" })).toHaveAttribute(
    "aria-checked",
    was === "true" ? "false" : "true",
  );
  await page.getByRole("switch", { name: "Characters can message me" }).click(); // restore

  const res = await page.request.get("/api/account/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toMatch(/attachment/);
  const data = await res.json();
  expect(data).toHaveProperty("profile");
  expect(JSON.stringify(data)).not.toMatch(/service_role|password/i);

  // Deletion needs an explicit confirmation step (not performed here).
  await page.getByText("Delete account").click();
  await expect(page.getByRole("button", { name: "Delete forever" })).toBeVisible();
});

test("creator: pick a category and describe step", async ({ page }) => {
  await page.goto("/app/create");
  await page
    .getByRole("button", { name: /Famous/ })
    .first()
    .click();
  await expect(page.getByText("No living celebrities or real people — ever.")).toBeVisible();
  await expect(
    page.getByRole("group", { name: "How to describe" }).or(page.getByLabel("How to describe")),
  ).toBeVisible();
  await expect(page.getByPlaceholder("e.g. a grumpy barista who secretly writes poetry")).toBeVisible();
});

test("admin area is hidden from non-admins", async ({ page }) => {
  const res = await page.goto("/app/admin");
  expect(res?.status()).toBe(404);
});
