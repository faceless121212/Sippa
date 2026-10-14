import { expect, test } from "@playwright/test";

/** The deck's main flow: ad → segment page → quiz → match → sign-up → offer → chat. */
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

for (const [segment, headline] of [
  ["love", /remembers you/],
  ["friends", /always up for a chat/],
  ["history", /greatest minds/],
] as const) {
  test(`${segment}: landing → 60-second quiz → a match you can reply to`, async ({ page, context }) => {
    await page.goto(`/${segment}`);
    await expect(page.getByRole("heading", { level: 1, name: headline })).toBeVisible();
    await page
      .getByRole("link", { name: /in 60 seconds/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/quiz/${segment}$`));

    // The segment is remembered for the app (Home shows "Picked for you").
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "sippa_segment")?.value).toBe(segment);

    for (let q = 1; q <= 5; q++) {
      await expect(page.getByText(`Question ${q} of 5`)).toBeVisible();
      await page.locator("main ul li button").first().click();
    }
    await expect(page.getByText("Your match", { exact: true })).toBeVisible();
    const reply = page.getByRole("link", { name: /^Reply to / });
    await expect(reply).toHaveAttribute("href", /^\/signup\?next=%2Fapp%2Fwelcome%3Fc%3D[a-z0-9-]+$/);

    // Alternatives and retake work without leaving the page.
    const alt = page.getByText("Also a great fit");
    await expect(alt).toBeVisible();
    await page.getByRole("button", { name: /Retake the quiz/ }).click();
    await expect(page.getByText("Question 1 of 5")).toBeVisible();
  });
}

test("the quiz's Back button changes an answer", async ({ page }) => {
  await page.goto("/quiz/friends");
  await page.locator("main ul li button").first().click();
  await expect(page.getByText("Question 2 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Question 1 of 5")).toBeVisible();
});

test("the offer page sends visitors to sign-up (not sign-in), keeping their match", async ({ page }) => {
  await page.goto("/app/welcome?c=pip-marlow");
  await expect(page).toHaveURL(/\/signup\?next=%2Fapp%2Fwelcome%3Fc%3Dpip-marlow/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
});

test("unknown quiz segments 404", async ({ page }) => {
  expect((await page.goto("/quiz/nope"))?.status()).toBe(404);
});
