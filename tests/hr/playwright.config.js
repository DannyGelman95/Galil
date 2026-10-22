// Browser tests for HR (Employee Portal/hr). Run: npm test
const { defineConfig } = require("@playwright/test");
const path = require("path");
module.exports = defineConfig({
  testDir: ".",
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 3,
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "file://" + path.resolve(__dirname, "../../Employee Portal/hr/index.html"),
    viewport: { width: 1400, height: 900 },
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  }
});
