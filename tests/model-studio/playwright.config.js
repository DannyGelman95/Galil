// Browser tests for Model Studio. Run: npm test
// The pages are served over HTTP (serve.js): ES modules and WebAssembly do not load from file://.
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: ".",
  timeout: 90000,
  expect: { timeout: 30000 },
  workers: 2,
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: { command: "node serve.js", url: "http://localhost:4178/", reuseExistingServer: !process.env.CI },
  use: {
    baseURL: "http://localhost:4178/",
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
    screenshot: "only-on-failure",
    launchOptions: Object.assign(
      { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] },
      process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
    )
  }
});
