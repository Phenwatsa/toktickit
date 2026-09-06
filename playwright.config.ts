import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // Single worker to preserve database test state
  reporter: [["list"]],
  timeout: 45000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm --prefix server run dev",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: "npm --prefix client run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
