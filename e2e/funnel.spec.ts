import { expect, test } from "@playwright/test";

/** The deck's main flow: ad → segment page → quiz → match → sign-up → offer → chat. */
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

/** Clicks through every quiz step: the first option, "Totally me", a name, Continue. */
async function finishQuiz(page: import("@playwright/test").Page) {
  const main = page.locator("main");
  for (let i = 0; i < 40; i++) {
    const before = await main.innerText();
    if (before.includes("Finding your match") || before.includes("here's your match")) return;
    if (await page.getByRole("group", { name: "How much do you relate?" }).isVisible()) {
      await page.getByRole("button", { name: "Totally me" }).click();
    } else if (await page.getByLabel("Your name").isVisible()) {
      await page.getByLabel("Your name").fill("Kate");
      await page.getByRole("button", { name: "Continue" }).click();
    } else if (await main.locator("ul li button").first().isVisible()) {
      await main.locator("ul li button").first().click();
      const cont = page.getByRole("button", { name: "Continue" });
      if (await cont.isVisible()) await cont.click();
    } else {
      await page.getByRole("button", { name: "Continue" }).click(); // info screen
    }
    // Wait for the next screen before acting again.
    await expect.poll(() => main.innerText()).not.toBe(before);
  }
  throw new Error("The quiz never reached the matching screen");
}

for (const [segment, headline] of [
  ["love", /remembers you/],
  ["friends", /always up for a chat/],
  ["history", /greatest minds/],
] as const) {
  test(`${segment}: landing → 20-question quiz → a match you can reply to`, async ({ page, context }) => {
    await page.goto(`/${segment}`);
    await expect(page.getByRole("heading", { level: 1, name: headline })).toBeVisible();
    await page
      .getByRole("link", { name: /in 2 minutes/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/quiz/${segment}$`));

    // The segment is remembered for the app (Home shows "Picked for you").
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "sippa_segment")?.value).toBe(segment);

    await expect(page.getByText("1/20")).toBeVisible();
    await finishQuiz(page);
    await expect(page.getByText("Kate, here's your match")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Why you two click")).toBeVisible();
    const reply = page.getByRole("link", { name: /^Reply to / });
    await expect(reply).toHaveAttribute("href", /^\/signup\?next=%2Fapp%2Fwelcome%3Fc%3D[a-z0-9-]+$/);

    // Alternatives and retake work without leaving the page.
    await expect(page.getByText("Also a great fit")).toBeVisible();
    await page.getByRole("button", { name: /Retake the quiz/ }).click();
    await expect(page.getByText("1/20")).toBeVisible();
  });
}

test("the quiz's Back button returns to the previous question, keeping the answer", async ({ page }) => {
  await page.goto("/quiz/friends");
  await page.locator("main ul li button").first().click();
  await expect(page.getByText("2/20")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("1/20")).toBeVisible();
  await expect(page.locator("main ul li button").first()).toHaveAttribute("aria-pressed", "true");
});

test("multi-select needs at least one pick and caps at 3", async ({ page }) => {
  await page.goto("/quiz/love");
  for (const n of [2, 3, 4]) {
    await page.locator("main ul li button").first().click(); // who, age, why
    await expect(page.getByText(`${n}/20`)).toBeVisible();
  }
  const cont = page.getByRole("button", { name: "Continue" });
  await expect(cont).toBeDisabled();
  const options = page.locator("main ul li button");
  for (let i = 0; i < 4; i++) await options.nth(i).click();
  await expect(page.locator('main ul li button[aria-pressed="true"]')).toHaveCount(3);
  await cont.click();
  await expect(page.getByText("Got it")).toBeVisible(); // the info screen echoes an earlier answer
});

test("progress survives a reload", async ({ page }) => {
  await page.goto("/quiz/history");
  for (const n of [2, 3]) {
    await page.locator("main ul li button").first().click();
    await expect(page.getByText(`${n}/20`)).toBeVisible();
  }
  await page.reload();
  await expect(page.getByText("3/20")).toBeVisible();
});

test("the offer page sends visitors to sign-up (not sign-in), keeping their match", async ({ page }) => {
  await page.goto("/app/welcome?c=pip-marlow");
  await expect(page).toHaveURL(/\/signup\?next=%2Fapp%2Fwelcome%3Fc%3Dpip-marlow/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
});

test("unknown quiz segments 404", async ({ page }) => {
  expect((await page.goto("/quiz/nope"))?.status()).toBe(404);
});
