import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Signed-in tests read E2E_EMAIL / E2E_PASSWORD (a dedicated test account) from .env.local.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3100;
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Production-build pages are fast, but three viewports in parallel can saturate a laptop.
  workers: process.env.CI ? undefined : 2,
  // Generous limits so a busy machine doesn't produce false failures; speed has its own tests.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    // Signed-out flows at three widths.
    {
      name: "mobile-360",
      testIgnore: /signed-in\//,
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 } },
    },
    {
      name: "tablet-768",
      testIgnore: /signed-in\//,
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    { name: "desktop-1440", testIgnore: /signed-in\//, use: desktop },
    // Signed-in flows: log in once, then reuse the session. Skipped without E2E_EMAIL.
    { name: "auth-setup", testMatch: /signed-in\/auth\.setup\.ts/, use: desktop },
    {
      name: "signed-in",
      testMatch: /signed-in\/.*\.spec\.ts/,
      dependencies: ["auth-setup"],
      fullyParallel: false,
      use: { ...desktop, storageState: "e2e/.auth/user.json" },
    },
  ],
  webServer: {
    // E2E_SKIP_BUILD=1 reuses the last .next-e2e build when iterating on tests.
    command: `${process.env.E2E_SKIP_BUILD ? "" : "npm run build && "}npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      WAITLIST_FILE: ".data/waitlist.e2e.json",
      WAITLIST_RATE_LIMIT_PER_MIN: "1000",
      // Deterministic, free AI: demo chat replies and no image generation.
      SIPPA_OFFLINE_AI: "1",
      // Simulated checkout, so Plus/Flowers purchases can be tested without charging anyone.
      PAYMENTS_MODE: "demo",
    },
  },
});
