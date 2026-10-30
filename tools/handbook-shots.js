// Re-shoots the Handbook's WorkDesk and portal screenshots, in English (img/) and Hebrew (img/he/).
// Run from tests/workdesk (for Playwright):  node ../../tools/handbook-shots.js [en|he]
// Taskana's board, task and budget screenshots (t01–t03), the expense-attachment close-up (16b) and the
// Library's (t10–t16) are taken here too.
// Model Studio, HR's pages and Defense News are shot by handbook-shots-apps.js (they need an HTTP server).
// So are HR's admin screenshots (h01–h02), which the Knowledge Base uses too. Shots run from files, so a QR code in them
// points to a file; the Shift QR code window's note about that is left out.
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../Employee Portal");
const URL = "file://" + ROOT.replace(/ /g, "%20") + "/index.html";
const TK_URL = "file://" + ROOT.replace(/ /g, "%20") + "/taskana/index.html";
const HR_URL = "file://" + ROOT.replace(/ /g, "%20") + "/hr/index.html";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const LANGS = process.argv[2] ? [process.argv[2]] : ["en", "he"];
const W = { width: 1366, height: 860 }, PHONE = { width: 390, height: 844 };

async function open(b, lang, opts = {}) {
  const ctx = await b.newContext(Object.assign({ viewport: opts.viewport || W, deviceScaleFactor: 1, acceptDownloads: true },
    opts.phone ? { isMobile: true, hasTouch: true, userAgent: IPHONE } : {}));
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (!/ResizeObserver/.test(e.message)) console.log("  page error:", e.message); });
  await page.addInitScript(([lang, user]) => {
    try {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-portal-lang", lang);
      localStorage.setItem("galil-workdesk-theme", "light");
      if (user && !sessionStorage.getItem("shot-session")) { localStorage.setItem("galil-workdesk-session", user); sessionStorage.setItem("shot-session", "1"); }
    } catch (e) {}
  }, [lang, opts.user || null]);
  await page.goto(URL + (opts.hash || ""));
  if (opts.taskana) { await page.waitForTimeout(500); await page.goto(TK_URL + opts.taskana); }
  if (opts.hr) { await page.waitForTimeout(500); await page.goto(HR_URL + opts.hr); await page.waitForTimeout(500); }
  if (opts.timer) await page.evaluate(() => { const d = new Date(Date.now() - (2 * 3600 + 17 * 60) * 1000); localStorage.setItem("galil-workdesk-timer", JSON.stringify({ at: d.getTime(), date: d2s(d), start: round5(d) })); window.dispatchEvent(new Event("wd-timer")); });
  if (opts.roles) {
    await page.evaluate(roles => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      raw.data.users.forEach(u => { if (roles[u.id]) { u.role = roles[u.id]; delete u.access; } });
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    }, opts.roles);
    await page.reload();
  }
  await page.waitForTimeout(700);
  const T = s => page.evaluate(s => window.WDI18N ? WDI18N.t(s) : window.tr ? tr(s) : s, s);
  return { page, ctx, T };
}
const wd = tab => "#/workdesk/" + tab;
/* the Library lives in Taskana: open the portal signed in, then Taskana's Library */
const LIB = { user: "u-danny", taskana: "#/library", viewport: { width: 1500, height: 900 } };
async function libDoc(page) { await page.locator(".lib-item").filter({ has: page.locator(".chip.teal") }).filter({ hasText: /SME|מומחה/ }).first().click(); await page.waitForTimeout(800); }
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
    await page.locator('button[title="' + await T("Change portal access") + '"]').nth(await page.evaluate(() => { const r = [...document.querySelectorAll("tbody tr")]; return Math.max(0, r.filter(x => x.querySelector('button[title]')).findIndex(x => /Eitan Fisch|איתן פיש/.test(x.textContent))); })).click(); await modal(page, f); }],
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
  ["11-emp-timelog-form", { user: "u-eitan", hash: wd("time") }, async ({ page }, f) => { const b = await page.locator(".tlform").boundingBox(); await shot(page, f, { x: Math.max(0, b.x - 8), y: 0, width: b.width + 16, height: 860 }); }],
  ["12-emp-planner", { user: "u-eitan", hash: wd("planner") }, async ({ page }, f) => shot(page, f)],
  ["16-emp-expenses", { user: "u-eitan", hash: wd("expenses") }, async ({ page }, f) => shot(page, f)],
  ["16b-emp-expense-attach", { user: "u-danny", hash: wd("expenses") }, async ({ page, T }, f) => {
    await page.locator(".tbl tbody tr").filter({ hasText: "📎" }).locator('button[aria-label="' + await T("Edit") + '"]').click();
    await page.waitForTimeout(400); await page.locator(".panel").first().screenshot({ path: f }); }],
  ["17-emp-dashboard", { user: "u-eitan", hash: wd("dashboard") }, async ({ page }, f) => shot(page, f)],
  ["19-emp-my-assignments", { user: "u-eitan", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("My assignments and allowances") }).click(); await modal(page, f); }],
  ["20-emp-request-hours", { user: "u-eitan", hash: wd("time") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("My assignments and allowances") }).click(); await page.waitForTimeout(300); await page.locator(".modal button", { hasText: await T("Request hours") }).first().click(); await modal(page, f); }],
  ["31-tl-approvals", { user: "u-danny", hash: wd("approvals") }, async ({ page }, f) => shot(page, f)],
  ["32-tl-decline", { user: "u-danny", hash: wd("approvals") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("Decline"), exact: true }).first().click(); await modal(page, f); }],
  ["33-tl-request-info", { user: "u-danny", hash: wd("approvals") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("Request info"), exact: true }).first().click(); await modal(page, f); }],
  ["63-ops-approvals", { user: "u-inon", hash: wd("approvals") }, async ({ page }, f) => shot(page, f)],
  ["44-pm-dashboard", { user: "u-danny", hash: wd("dashboard") }, async ({ page }, f) => shot(page, f)],
  ["46-pm-dashboard-custom", { user: "u-danny", hash: wd("dashboard") }, async ({ page, T }, f) => {
    await page.getByRole("button", { name: new RegExp(await T("Customize")) }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: await T("+ Add widget") }).click(); await page.waitForTimeout(400); await shot(page, f); }],
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
  ["t01-board", { user: "u-danny", taskana: "#/board" }, async ({ page }, f) => { await page.waitForTimeout(500); await shot(page, f); }],
  ["t02-task", { user: "u-danny", taskana: "#/task/RSOM-5" }, async ({ page }, f) => {
    await page.waitForTimeout(500); await page.evaluate(() => document.querySelectorAll(".modal, .modal *").forEach(e => { if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = e.scrollHeight; }));
    await page.waitForTimeout(300); await shot(page, f); }],
  ["t03-budget", { user: "u-danny", taskana: "#/project/p-iai1" }, async ({ page, T }, f) => {
    await page.waitForTimeout(500); await page.getByText(await T("Budget & hours"), { exact: true }).first().evaluate(e => e.closest(".card, .panel, section, div").scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300); await shot(page, f); }],
  ["t10-library", LIB, async ({ page }, f) => { await libDoc(page); await shot(page, f); }],
  ["t11-library-edit", LIB, async ({ page, T }, f) => { await libDoc(page); await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    await page.locator('button[aria-label="' + await T("Insert") + '"]').click(); await page.waitForTimeout(200);
    await page.locator(".ed-menu button", { hasText: await T("Content block") }).hover(); await page.waitForTimeout(500); await shot(page, f); }],
  ["t12-library-table", LIB, async ({ page, T }, f) => { await libDoc(page); await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    await page.frameLocator(".ed-frame").locator("table td").first().click(); await page.waitForTimeout(200);
    await page.locator('button[aria-label="' + await T("Table") + '"]').click(); await page.waitForTimeout(200);
    await page.locator(".ed-menu button", { hasText: await T("Autofit") }).hover(); await page.waitForTimeout(500); await shot(page, f); }],
  ["t13-library-html", LIB, async ({ page }, f) => { await libDoc(page); await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    await page.locator(".lib-moderow button", { hasText: "HTML" }).click(); await page.waitForTimeout(700); await shot(page, f); }],
  ["t14-library-styles", LIB, async ({ page, T }, f) => { await libDoc(page); await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    await page.locator(".lib-tabs button", { hasText: await T("Styles") }).click(); await page.waitForTimeout(200);
    await page.locator('select[aria-label="' + await T("Style to edit") + '"]').selectOption("h1"); await page.waitForTimeout(300);
    await page.locator('button[aria-label="' + await T("Paragraph style") + '"]').click(); await page.waitForTimeout(400); await shot(page, f); }],
  ["t15-library-organize", LIB, async ({ page, T, lang }, f) => {
    await page.getByRole("button", { name: await T("New document") }).click(); await page.locator(".lib-menu button", { hasText: await T("Blank document") }).click(); await page.waitForTimeout(600);
    await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    const notes = lang === "he"
      ? ["הליך הדלקה", "1. מפעילים את המפסק הראשי", "2. מסובבים את מפתח הקונסולה", "הערה: ממתינים 40 שניות לאתחול", "ש: מה עושים אם הבדיקה העצמית נכשלת?", "ת: מתקשרים לתחזוקה ורושמים את הקוד.", "קודי שגיאה:", "- E12 מעגל הקירור", "- E31 המשדר", "לבדוק: רשימת הקודים הצהובים המלאה", "{\"mode\":\"standby\",\"timeout\":40}", "1.1 מסננים", "החלפה כל 500 שעות."]
      : ["POWER-UP PROCEDURE", "1. Switch on the main breaker", "2. Turn the console key", "Note: wait 40 seconds for the boot screen", "Q: What if the self-test fails?", "A: Call maintenance and log the code.", "Error codes:", "- E12 cooling loop", "- E31 transmitter", "todo: get the full list of amber codes", "{\"mode\":\"standby\",\"timeout\":40}", "1.1 Filters", "Replace every 500 hours."];
    await page.evaluate(t => { const dt = new DataTransfer(); dt.setData("text/plain", t); ED.root.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); }, notes.join("\n"));
    await page.locator('button[aria-label="' + await T("Writer tools") + '"]').click(); await page.waitForTimeout(200);
    await page.locator(".ed-menu button", { hasText: await T("Organize pasted notes into a document") }).click(); await page.waitForTimeout(800);
    await page.locator(".toast").evaluateAll(t => t.forEach(x => x.remove()));
    await shot(page, f); }],
  ["t16-library-links", LIB, async ({ page, T }, f) => { await libDoc(page); await page.locator("#lib-edit").click(); await page.waitForTimeout(300);
    await page.frameLocator(".ed-frame").locator("h1").nth(1).click(); await page.keyboard.press("End");
    await page.locator('button[aria-label="' + await T("Insert") + '"]').click(); await page.waitForTimeout(200);
    await page.locator(".ed-menu button", { hasText: await T("Link to a document, heading or task…") }).click(); await page.waitForTimeout(500); await shot(page, f); }],
  /* QR time reporting, the shift QR code, the timer strip, Worked from, and HR's admin tools */
  ["p05-qr-time", { user: "u-eitan", viewport: PHONE, phone: true, timer: true }, async ({ page }, f) => { await page.waitForTimeout(1200); await shot(page, f, { x: 0, y: 0, width: 390, height: 620 }); }],
  ["64-shift-qr", { user: "u-tamir", hash: wd("management") }, async ({ page, T }, f) => { await page.click("#shift-qr-btn"); await page.waitForSelector("#shift-qr svg");
    await page.locator(".modal footer .grow.cap").evaluate(e => { e.textContent = ""; }); /* the shots run from files; the note about that isn't for the reader */
    await modal(page, f); }],
  ["13-emp-timer-strip", { user: "u-eitan", hash: wd("time"), timer: true }, async ({ page }, f) => { await page.waitForTimeout(1200); await page.locator("#timer-strip").evaluate(e => e.closest(".panel")); const b = await page.locator(".tlform").boundingBox(); await shot(page, f, { x: Math.max(0, b.x - 8), y: b.y - 8, width: b.width + 16, height: 230 }); }],
  ["14-emp-plan-editor", { user: "u-eitan", hash: wd("planner") }, async ({ page, T }, f) => { await page.getByRole("button", { name: await T("+ plan") }).first().click(); await page.waitForTimeout(300); await page.click("#pwf-office"); await modal(page, f); }],
  ["97-mobile-report", { user: "u-eitan", viewport: PHONE, hash: wd("time") }, async ({ page, T }, f) => {
    await page.getByRole("button", { name: await T("Report without the timer") }).click(); await page.waitForTimeout(400);
    await page.click("#mwf-home"); await page.click("#mwf-client"); await page.waitForTimeout(200);
    await page.locator(".sheet .sb").evaluate(e => { const l = [...e.querySelectorAll("label")].find(x => /Worked from|מקום העבודה/.test(x.textContent)); e.scrollTop = Math.max(0, l.offsetTop - 260); });
    await page.waitForTimeout(300); await shot(page, f); }],
  ["h01-hr-create", { user: "u-tamir", hr: "#/" }, async ({ page }, f) => { const b = await page.locator("#home-create").boundingBox(); await shot(page, f, { x: Math.max(0, b.x - 12), y: Math.max(0, b.y - 12), width: b.width + 24, height: b.height + 24 }); }],
  ["h02-hr-cycle-form", { user: "u-tamir", hr: "#/" }, async ({ page }, f) => { await page.click("#create-cycle"); await page.waitForTimeout(500);
    await page.locator(".modal, [role=dialog]").last().evaluate(e => { const sb = e.querySelector("#cy-self-q"); if (sb) sb.scrollIntoView({ block: "center" }); });
    await page.waitForTimeout(300); await page.locator(".modal, [role=dialog]").last().screenshot({ path: f }); }],
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
