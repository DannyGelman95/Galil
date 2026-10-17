// Re-shoots the Handbook's WorkDesk and portal screenshots, in English (img/) and Hebrew (img/he/).
// Run from tests/workdesk (for Playwright):  node ../../tools/handbook-shots.js [en|he]
// Taskana's screenshots (t01–t03) and the expense-attachment close-up (16b) are taken by hand.
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../Employee Portal");
const URL = "file://" + ROOT.replace(/ /g, "%20") + "/index.html";
const LANGS = process.argv[2] ? [process.argv[2]] : ["en", "he"];
const W = { width: 1366, height: 860 }, PHONE = { width: 390, height: 844 };

async function open(b, lang, opts = {}) {
  const ctx = await b.newContext({ viewport: opts.viewport || W, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (!/ResizeObserver/.test(e.message)) console.log("  page error:", e.message); });
  await page.addInitScript(([lang, user]) => {
    try {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-portal-lang", lang);
      localStorage.setItem("galil-workdesk-theme", "light");
      if (user && !sessionStorage.getItem("shot-session")) { localStorage.setItem("galil-workdesk-session", user); sessionStorage.setItem("shot-session", "1"); }
    } catch (e) {}
  }, [lang, opts.user || null]);
  await page.goto(URL + (opts.hash || ""));
  if (opts.roles) {
    await page.evaluate(roles => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      raw.data.users.forEach(u => { if (roles[u.id]) { u.role = roles[u.id]; delete u.access; } });
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    }, opts.roles);
    await page.reload();
  }
  await page.waitForTimeout(700);
  const T = s => page.evaluate(s => window.WDI18N ? WDI18N.t(s) : s, s);
  return { page, ctx, T };
}
const wd = tab => "#/workdesk/" + tab;
async function section(page, T, label) {
  await page.locator(".pill", { hasText: await T(label) }).first().click(); await page.waitForTimeout(400);
}
async function shot(page, file, clip) { await page.screenshot({ path: file, clip }); }
async function modal(page, file) { await page.waitForTimeout(350); await page.locator(".modal").last().screenshot({ path: file }); }

const SCENES = [
  ["p01-portal-home", { user: "u-danny" }, async ({ page }, f) => shot(page, f)],
  ["p02-signin", {}, async ({ page }, f) => shot(page, f)],
  ["p03-signup", {}, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("Create an account") }).click(); await page.waitForTimeout(400); await shot(page, f); }],
  ["p04-access", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => {
    await page.locator('[aria-label="' + await T("Change portal access for {n}").catch(() => "") + '"]').count();
    await page.locator('button[aria-label*="Eitan Fisch"], button[aria-label*="איתן פיש"]').first().click(); await modal(page, f); }],
  ["58-admin-roles", { user: "u-tamir", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("System administration") }).click(); await modal(page, f); }],
  ["60-admin-settings", { user: "u-tamir", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("System administration") }).click(); await section(page, T, "Company settings").catch(async () => { await page.locator(".modal button", { hasText: await T("Company settings") }).first().click(); }); await modal(page, f); }],
  ["61-admin-backup", { user: "u-tamir", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("System administration") }).click(); await page.locator(".modal button", { hasText: await T("Backup & restore") }).first().click(); await modal(page, f); }],
  ["62-admin-audit", { user: "u-tamir", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("System administration") }).click(); await page.locator(".modal button", { hasText: await T("Audit log") }).first().click(); await modal(page, f); }],
  ["91-ext-tabs", { user: "u-gil", hash: wd("time") }, async ({ page }, f) => shot(page, f, { x: 0, y: 0, width: 1366, height: 150 })],
  ["96-view-tabs", { user: "u-office", roles: { "u-office": "VIEW" }, hash: wd("time") }, async ({ page }, f) => shot(page, f, { x: 0, y: 0, width: 1366, height: 150 })],
  ["95-view-landing", { user: "u-office", roles: { "u-office": "VIEW" }, hash: wd("time") }, async ({ page }, f) => shot(page, f)],
  ["50-ops-timelog", { user: "u-inon", hash: wd("time") }, async ({ page }, f) => shot(page, f)],
  ["21-emp-profile", { user: "u-eitan", hash: wd("time") }, async ({ page, T }, f) => { await page.locator(".topbar .who").click(); await modal(page, f); }],
  ["22-table-toolbar", { user: "u-danny", hash: wd("time"), viewport: { width: 1366, height: 1300 } }, async ({ page, T }, f) => {
    const th = page.locator("thead th", { hasText: await T("Hours") }).first();
    await th.click(); await page.waitForTimeout(200); await th.click(); await page.waitForTimeout(300);
    const box = await page.locator(".tblbar").first().boundingBox();
    await shot(page, f, { x: 0, y: Math.max(0, box.y - 10), width: 1366, height: 420 }); }],
  ["10-emp-timelog", { user: "u-eitan", hash: wd("time") }, async ({ page }, f) => shot(page, f)],
  ["11-emp-timelog-form", { user: "u-eitan", hash: wd("time") }, async ({ page }, f) => shot(page, f, { x: 0, y: 0, width: 1366, height: 430 })],
  ["12-emp-planner", { user: "u-eitan", hash: wd("planner") }, async ({ page }, f) => shot(page, f)],
  ["16-emp-expenses", { user: "u-eitan", hash: wd("expenses") }, async ({ page }, f) => shot(page, f)],
  ["17-emp-dashboard", { user: "u-eitan", hash: wd("dashboard") }, async ({ page }, f) => shot(page, f)],
  ["18-emp-library", { user: "u-eitan", hash: wd("library") }, async ({ page }, f) => shot(page, f)],
  ["19-emp-my-assignments", { user: "u-eitan", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("My assignments and allowances") }).click(); await modal(page, f); }],
  ["20-emp-request-hours", { user: "u-eitan", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("My assignments and allowances") }).click(); await page.waitForTimeout(300); await page.locator(".modal button", { hasText: await T("Request hours") }).first().click(); await modal(page, f); }],
  ["31-tl-approvals", { user: "u-danny", hash: wd("approvals") }, async ({ page }, f) => shot(page, f)],
  ["32-tl-decline", { user: "u-danny", hash: wd("approvals") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("Decline"), exact: true }).first().click(); await modal(page, f); }],
  ["33-tl-request-info", { user: "u-danny", hash: wd("approvals") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("Request information"), exact: true }).first().click(); await modal(page, f); }],
  ["63-ops-approvals", { user: "u-inon", hash: wd("approvals") }, async ({ page }, f) => shot(page, f)],
  ["44-pm-dashboard", { user: "u-danny", hash: wd("dashboard") }, async ({ page }, f) => shot(page, f)],
  ["40-pm-budgets", { user: "u-danny", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Budgets"); await shot(page, f); }],
  ["43-pm-new-budget", { user: "u-danny", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Budgets"); await page.getByRole("button", { name: await T("+ New budget") }).click(); await modal(page, f); }],
  ["41-pm-work-orders", { user: "u-danny", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Work Orders"); await shot(page, f); }],
  ["42-pm-new-work-order", { user: "u-danny", hash: wd("management") }, async ({ page, T }, f) => {
    await section(page, T, "Work Orders"); await page.getByRole("button", { name: await T("+ New work order") }).click(); await page.waitForTimeout(300);
    await page.locator(".modal select").first().selectOption({ index: 6 }); await page.locator("#wo-title").fill(await T("Phase 1 — main deliverable"));
    const he = (await page.evaluate(() => WDI18N.he));
    await page.locator("#wo-scope").fill(he ? "כתיבה, איור ועימוד של מדריך המפעיל וכרטיס ההתחלה המהירה, מוכנים להדפסה ולעזרה המקוונת." : "Write, illustrate and lay out the operator manual and quick-start card, ready for print and online help.");
    await page.locator("#wo-deliv").fill(he ? "מדריך מפעיל, כ-120 עמודים\nכרטיס התחלה מהירה\nעזרה מקוונת (HTML5)" : "Operator manual, approx. 120 pages\nQuick-start card\nOnline help (HTML5)");
    await modal(page, f); }],
  ["45-pm-wo-document", { user: "u-danny", hash: wd("management") }, async ({ page, T, lang }, f) => {
    await section(page, T, "Work Orders");
    const [dl] = await Promise.all([page.waitForEvent("download"), (async () => {
      await page.getByRole("button", { name: await T("Work order document (PDF)") }).first().click();
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: await T("Download PDF") }).click(); })()]);
    const pdf = f.replace(/\.png$/, ".pdf"); await dl.saveAs(pdf);
    execFileSync("pdftoppm", ["-r", "90", "-png", "-f", "1", "-l", "1", "-singlefile", pdf, f.replace(/\.png$/, "")]);
    require("fs").unlinkSync(pdf); }],
  ["51-admin-people", { user: "u-tamir", hash: wd("management") }, async ({ page }, f) => shot(page, f)],
  ["52-admin-activation", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Pending Activation"); await shot(page, f); }],
  ["53-admin-assignments", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Assignments & Allowances"); await shot(page, f); }],
  ["54-admin-clients", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Clients"); await shot(page, f); }],
  ["55-admin-projects", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Projects"); await shot(page, f); }],
  ["57-admin-expense-types", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Expense Types"); await shot(page, f); }],
  ["59-admin-verify", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Verification Queue"); await shot(page, f); }],
  ["71-fin-budgets", { user: "u-paul", roles: { "u-paul": "FIN" }, hash: wd("management") }, async ({ page, T }, f) => { await section(page, T, "Budgets").catch(() => {}); await shot(page, f); }],
  ["98-mobile-timelog", { user: "u-eitan", viewport: PHONE, hash: wd("time") }, async ({ page }, f) => shot(page, f)],
  ["99-mobile-more", { user: "u-eitan", viewport: PHONE, hash: wd("time") }, async ({ page }, f) => { await page.locator(".mnav button").last().click(); await page.waitForTimeout(500); await shot(page, f); }]
];

(async () => {
  const only = process.argv[3] ? process.argv[3].split(",") : null;
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
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
  await b.close();
})();
