// Browser tests for Taskana (site/taskana). Run: npm test
const { defineConfig } = require("@playwright/test");
const path = require("path");
module.exports = defineConfig({
  testDir: ".",
  timeout: 30000,
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "file://" + path.resolve(__dirname, "../../site/taskana/index.html"),
    viewport: { width: 1400, height: 900 },
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  }
});
