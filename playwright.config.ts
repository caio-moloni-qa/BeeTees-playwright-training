import { defineConfig, devices } from "@playwright/test";

/**
 * Run `npm run dev:all` before executing tests.
 * The Vite dev server proxies /api → http://localhost:3001.
 */
export default defineConfig({
  testDir: "./playwright",
  // Demos are collectable by the runner but only through their own project (§3 of
  // .github/agents/playwright-demo-recordings-playbook.md) — never by `npx playwright test`.
  testMatch: ["**/tests/**/*.spec.ts", "**/Demo/**/*.demo.ts"],

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker — avoids session cookie collisions between suites */
  workers: 1,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    /* Base URL for all page.goto() calls */
    baseURL: "http://localhost:5173",

    /* Retain trace on first retry */
    trace: "on-first-retry",

    /* Keep screenshots on failure */
    screenshot: "only-on-failure",

    /* Viewport matches the app's primary breakpoint */
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    {
      name: "chromium",
      testMatch: "**/tests/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Demo walkthroughs ────────────────────────────────────────────────
    // Headed, slowed, always video-recorded — for screen recordings, never part
    // of a test run. Run with: npm run demo:<name>
    {
      name: "demo",
      testMatch: "**/Demo/**/*.demo.ts",
      timeout: 20 * 60_000, // narration is slow; a demo is minutes, not seconds
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        viewport: { width: 1440, height: 900 },
        video: { mode: "on", size: { width: 1440, height: 900 } },
        screenshot: "off", // stills are noise here
        trace: "off", // tracing visibly costs frames
        launchOptions: { slowMo: Number(process.env.DEMO_SLOWMO_MS ?? 600) },
      },
    },
  ],

  /* Global setup / teardown hooks (optional — add when needed) */
  // globalSetup: "./playwright/helpers/global-setup.ts",
});
