// Re-shoots the Handbook's screenshots of Model Studio, HR and Defense News, in English (img/) and Hebrew (img/he/),
// and the portal home with Defense News' headlines on its tile.
// Run from tests/model-studio (for Playwright):  node ../../tools/handbook-shots-apps.js [en|he] [name,name…]
// The pages are served over HTTP from here: Model Studio loads ES modules and WebAssembly, which file:// pages can't.
// Defense News' feed is built only on deployment, so the shots read a few sample headlines (labelled as samples).
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../Employee Portal");
const PORT = 4191, BASE = "http://localhost:" + PORT + "/";
const LANGS = process.argv[2] ? [process.argv[2]] : ["en", "he"];
const W = { width: 1366, height: 860 };
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".wasm": "application/wasm",
  ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

const hour = 36e5, now = Date.now();
const FEED = {
  updated: new Date(now - 1.5 * hour).toISOString(), days: 30, source: "Google News",
  companies: [
    { id: "iai", name: "IAI", full: "Israel Aerospace Industries", he: "התעשייה האווירית", color: "#1D4ED8" },
    { id: "elbit", name: "Elbit Systems", full: "Elbit Systems", he: "אלביט מערכות", color: "#0F766E" },
    { id: "rafael", name: "Rafael", full: "Rafael Advanced Defense Systems", he: "רפאל", color: "#B91C1C" },
    { id: "controp", name: "Controp", full: "Controp Precision Technologies", he: "קונטרופ", color: "#C2410C" },
    { id: "mod", name: "Israel MOD", full: "Israel Ministry of Defense", he: "משרד הביטחון", color: "#475569" }],
  items: [
    ["Sample headline — IAI", "Sample source", 1, "en", ["iai"]],
    ["כותרת לדוגמה — אלביט מערכות", "מקור לדוגמה", 3, "he", ["elbit"]],
    ["Sample headline — Rafael and the Israel MOD", "Sample source", 6, "en", ["rafael", "mod"]],
    ["Sample headline — Controp", "Sample source", 20, "en", ["controp"]],
    ["כותרת לדוגמה — התעשייה האווירית", "מקור לדוגמה", 28, "he", ["iai"]],
    ["Sample headline — Elbit Systems", "Sample source", 50, "en", ["elbit"]],
    ["Sample headline — IAI and Elbit Systems", "Sample source", 75, "en", ["iai", "elbit"]]
  ].map((x, i) => ({ id: "s" + i, title: x[0], url: "https://example.com/" + i, source: x[1], date: new Date(now - x[2] * hour).toISOString(), lang: x[3], companies: x[4] }))
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/news/feed.json") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(FEED)); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
});

async function open(b, lang, opts = {}) {
  const ctx = await b.newContext({ viewport: opts.viewport || W, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (!/ResizeObserver/.test(e.message)) console.log("  page error:", e.message); });
  await page.addInitScript(([lang, user]) => {
    try {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-hr-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-portal-lang", lang);
      localStorage.setItem("galil-workdesk-theme", "light");
      if (user) localStorage.setItem("galil-workdesk-session", user);
    } catch (e) {}
  }, [lang, opts.user || "u-eitan"]);
  await page.goto(BASE + "index.html");             // the portal seeds WorkDesk's people, which HR and Model Studio read
  await page.waitForTimeout(800);
  if (opts.url) { await page.goto(BASE + opts.url); await page.waitForTimeout(900); }
  return { page, ctx };
}
async function shot(page, f, clip) { await page.evaluate(() => { const t = document.getElementById("toast"); if (t && document.querySelector(".tree")) t.style.visibility = "hidden"; }); await page.screenshot({ path: f, clip }); }
async function studio(page) {
  await page.click("#btn-sample-2");
  await page.waitForFunction(() => /12/.test((document.getElementById("st-model") || {}).textContent || ""), null, { timeout: 120000 });
  await page.waitForFunction(() => window.studio && window.studio.idle(), null, { timeout: 60000 });
  await page.waitForTimeout(600);
}

const SCENES = [
  /* the portal home, with Defense News' headlines on its tile */
  ["p01-portal-home", { user: "u-danny" }, async ({ page }, f) => { await page.waitForTimeout(800); await shot(page, f); }],
  /* Defense News */
  ["n01-news", { url: "news/index.html" }, async ({ page }, f) => { await page.waitForSelector(".item"); await page.waitForTimeout(400); await shot(page, f); }],
  /* HR */
  ["h03-hr-home", { url: "hr/index.html#/" }, async ({ page }, f) => shot(page, f)],
  ["h04-hr-news", { url: "hr/index.html#/news" }, async ({ page }, f) => shot(page, f)],
  ["h05-hr-events", { url: "hr/index.html#/events/calendar" }, async ({ page }, f) => shot(page, f)],
  ["h06-hr-survey", { url: "hr/index.html#/surveys/demo-sv-engagement" }, async ({ page }, f) => shot(page, f)],
  ["h07-hr-review", { url: "hr/index.html#/reviews/demo-rv-u-eitan" }, async ({ page }, f) => shot(page, f)],
  ["h08-hr-people", { url: "hr/index.html#/people" }, async ({ page }, f) => shot(page, f)],
  ["h09-hr-kudos", { url: "hr/index.html#/kudos" }, async ({ page }, f) => shot(page, f)],
  /* Model Studio */
  ["s01-studio", { url: "studio/index.html", viewport: { width: 1500, height: 900 } }, async ({ page }, f) => { await studio(page); await shot(page, f); }],
  ["s02-studio-procedure", { url: "studio/index.html", viewport: { width: 1500, height: 900 } }, async ({ page }, f) => {
    await studio(page); await page.click("#proc-auto"); await page.waitForTimeout(500);
    await page.locator("#proc-strip .card:not(.add)").nth(2).click();
    await page.waitForFunction(() => window.studio.idle()); await page.waitForTimeout(700); await shot(page, f); }],
  ["s03-studio-ipc", { url: "studio/index.html", viewport: { width: 1500, height: 900 } }, async ({ page }, f) => {
    await studio(page); await page.click('.stab[data-stab="fig"]'); await page.click("#fig-balloon"); await page.waitForTimeout(300);
    await page.click("#fig-add"); await page.waitForFunction(() => window.studio.idle()); await page.waitForTimeout(700); await shot(page, f); }],
  ["s04-studio-publish", { url: "studio/index.html", viewport: { width: 1500, height: 900 } }, async ({ page }, f) => {
    await studio(page); await page.click("#btn-publish"); await page.waitForTimeout(500); await page.locator("#dlg-publish").screenshot({ path: f }); }]
];

(async () => {
  const only = process.argv[3] ? process.argv[3].split(",") : null;
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  for (const lang of LANGS) {
    const dir = path.join(ROOT, "handbook/img", lang === "he" ? "he" : "");
    for (const [name, opts, fn] of SCENES) {
      if (only && !only.includes(name)) continue;
      const s = await open(b, lang, opts);
      try { await fn(Object.assign({ lang }, s), path.join(dir, name + ".png")); console.log(lang, name, "ok"); }
      catch (e) { console.log(lang, name, "FAILED", e.message.split("\n")[0]); }
      await s.ctx.close();
    }
  }
  await b.close(); server.close();
})();
