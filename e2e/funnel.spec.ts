import { expect, test, type Page } from "@playwright/test";

/** The deck's main flow: ad → segment page → quiz → match → sign-up → offer → chat. */
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "sippa_consent", value: "essential", url: "http://localhost:3100" }]);
});

const nextButton = (page: Page) => page.getByRole("button", { name: /^(Next|Continue)$/ });

/** Answers the current single-choice question with its first option (and "Next" if it reacts). */
async function pickFirst(page: Page) {
  const main = page.locator("main");
  const before = await main.innerText();
  await main.locator("ul li button").first().click();
  // Either the screen moves on by itself, or a reaction appears with "Next".
  await expect.poll(async () => (await main.innerText()) !== before || (await nextButton(page).isVisible())).toBe(true);
  if ((await nextButton(page).isVisible()) && (await nextButton(page).isEnabled())) await nextButton(page).click();
}

/** Clicks through every quiz step with simple answers until the matching screen. */
async function finishQuiz(page: Page) {
  const main = page.locator("main");
  for (let i = 0; i < 40; i++) {
    const before = await main.innerText();
    if (before.includes("Finding your match") || (await page.getByRole("list", { name: "Quick replies" }).isVisible()))
      return;
    const recap = page.getByRole("button", { name: "Looks right" });
    if (await recap.isVisible()) {
      await recap.click();
    } else if (await page.getByRole("slider").isVisible()) {
      await page.getByRole("slider").focus();
      await page.keyboard.press("End");
      await page.getByRole("button", { name: "Continue" }).click();
    } else if (await page.getByRole("group", { name: "How much do you relate?" }).isVisible()) {
      await page.getByRole("button", { name: "Totally me" }).click();
    } else if (await page.getByLabel("Your name").isVisible()) {
      await page.getByLabel("Your name").fill("Kate");
      await page.getByRole("button", { name: "Continue" }).click();
    } else if (await main.locator("ul li button").first().isVisible()) {
      await pickFirst(page);
    } else {
      // Info, comparison and "fair question" screens.
      await page.getByRole("button", { name: /^(Continue|Sounds good)$/ }).click();
    }
    await expect.poll(() => main.innerText()).not.toBe(before);
  }
  throw new Error("The quiz never reached the matching screen");
}

for (const [segment, headline] of [
  ["love", /remembers you/],
  ["friends", /always up for a chat/],
  ["history", /greatest minds/],
] as const) {
  test(`${segment}: landing → 20-question quiz → a match you can tune`, async ({ page, context }) => {
    await page.goto(`/${segment}`);
    await expect(page.getByRole("heading", { level: 1, name: headline })).toBeVisible();
    await expect(page.getByRole("list", { name: "About the quiz" })).toBeVisible();
    await page
      .getByRole("link", { name: /in 2 minutes/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/quiz/${segment}$`));

    // The segment is remembered for the app (Home shows "Picked for you").
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "sippa_segment")?.value).toBe(segment);

    await expect(page.getByText("1/20")).toBeVisible();
    await expect(page.getByText(/20 quick questions/)).toBeVisible(); // the guide's first line
    await finishQuiz(page);
    await expect(page.getByRole("heading", { name: /^Kate, meet / })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("list", { name: "Why you two click" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Your first week" })).toBeVisible();

    // Tuning the vibe rewrites the first message.
    const message = page.locator('section[aria-label^="Your first message"] .animate-msg');
    const before = await message.innerText();
    const vibes = page.getByRole("group", { name: "Tune the first message" }).getByRole("button");
    const current = await vibes.evaluateAll((b) => b.findIndex((x) => x.getAttribute("aria-pressed") === "true"));
    await vibes.nth((current + 1) % 3).click();
    await expect.poll(() => message.innerText()).not.toBe(before);

    await expect(page.getByRole("list", { name: "Quick replies" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Also a great fit" })).toBeVisible();
    await page.getByRole("button", { name: /Retake the quiz/ }).click();
    await expect(page.getByText("1/20")).toBeVisible();
  });
}

test("replying on the result carries the reply through sign-up (in a cookie, not the URL)", async ({ page, context }) => {
  await page.goto("/quiz/love");
  await finishQuiz(page);
  await expect(page.getByRole("heading", { name: /^Kate, meet / })).toBeVisible({ timeout: 10_000 });
  await page.getByLabel(/^Your reply to/).fill("Okay, you've got my attention");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page).toHaveURL(
    /\/signup\?next=%2Fapp%2Fwelcome%3Fc%3D[a-z0-9-]+%26s%3D[a-z-]+%26v%3D(sweet|bold|witty)$/,
  );
  expect(page.url()).not.toContain("attention");
  await expect(page.getByRole("heading", { name: /^Save your chat with / })).toBeVisible();
  const start = (await context.cookies()).find((c) => c.name === "sippa_quiz_start");
  expect(JSON.parse(decodeURIComponent(start!.value))).toMatchObject({ r: "Okay, you've got my attention" });
});

test("a reaction from your future match appears before moving on", async ({ page }) => {
  await page.goto("/quiz/friends");
  await page.locator("main ul li button").first().click();
  await expect(page.getByText("Say less. I'm all ears.")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("2/20")).toBeVisible();
});

test("the quiz's Back button returns to the previous question, keeping the answer", async ({ page }) => {
  await page.goto("/quiz/friends");
  await pickFirst(page);
  await expect(page.getByText("2/20")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("1/20")).toBeVisible();
  await expect(page.locator("main ul li button").first()).toHaveAttribute("aria-pressed", "true");
});

test("multi-select needs at least one pick and caps at 3", async ({ page }) => {
  await page.goto("/quiz/love");
  for (const n of [2, 3, 4]) {
    await pickFirst(page); // who, age, why
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

test("sliders need a move before Continue, and say where you landed", async ({ page }) => {
  await page.goto("/quiz/love");
  // Jump straight to the first slider (progress is kept per tab).
  await page.evaluate(() =>
    sessionStorage.setItem("sippa_quiz_love", JSON.stringify({ index: 9, answers: {}, phase: "steps" })),
  );
  await page.reload();
  const slider = page.getByRole("slider");
  await expect(slider).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.getByText("Totally an open book")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(slider).not.toBeVisible();
});

test("the recap lets you change an answer and come straight back", async ({ page }) => {
  await page.goto("/quiz/love");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "sippa_quiz_love",
      JSON.stringify({ index: 20, answers: { who: ["woman"], age: ["25-34"], pace: 10 }, phase: "steps" }),
    ),
  );
  await page.reload();
  await expect(page.getByRole("heading", { name: "Here's what we know so far" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Slow burn/ })).toBeVisible();
  await page.getByRole("button", { name: /^A woman/ }).click();
  await expect(page.getByText("1/20")).toBeVisible();
  await page.getByRole("button", { name: "A man" }).click();
  await expect(page.getByRole("heading", { name: "Here's what we know so far" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^A man/ })).toBeVisible();
});

test("progress survives a reload", async ({ page }) => {
  await page.goto("/quiz/history");
  for (const n of [2, 3]) {
    await pickFirst(page);
    await expect(page.getByText(`${n}/20`)).toBeVisible();
  }
  await page.reload();
  await expect(page.getByText("3/20")).toBeVisible();
});

test("the offer page sends visitors to sign-up (not sign-in), keeping their match", async ({ page }) => {
  await page.goto("/app/welcome?c=pip-marlow");
  await expect(page).toHaveURL(/\/signup\?next=%2Fapp%2Fwelcome%3Fc%3Dpip-marlow/);
  await expect(page.getByRole("heading", { name: "Save your chat with Pip" })).toBeVisible();
});

test("unknown quiz segments 404", async ({ page }) => {
  expect((await page.goto("/quiz/nope"))?.status()).toBe(404);
});
