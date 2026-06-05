import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // This machine (OneDrive-synced path) is unreliable serving many concurrent
  // page loads — navigations abort under contention. One worker is stable and
  // the suite is small enough to stay fast. Raise on a faster filesystem.
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:1420",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Serve the production build statically — stable under parallel load, no
  // on-demand transforms or HMR file-watching to disrupt in-flight navigations.
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:1420",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
