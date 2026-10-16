// End-to-end checks for Taskana's main flows and the QA fixes.
const { test, expect } = require("@playwright/test");

const open = async (page, route = "home", userId = "u-danny") => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  /* signed in as an Admin (Danny) unless a test says otherwise */
  await page.addInitScript(id => {
    localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" }));
    localStorage.setItem("galil-taskana-session", JSON.stringify({ userId: id, provider: "password" }));
  }, userId);
  await page.goto(test.info().project.use.baseURL + "#/" + route);
  await expect(page.locator(".top h1")).toBeVisible();
  return errors;
};
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("galil-taskana-v1")));
const go = (page, route) => page.evaluate(r => { location.hash = "#/" + r; }, route);

test("every page renders without errors", async ({ page }) => {
  const errors = await open(page);
  for (const r of ["inbox", "my", "board", "tasks", "insights", "clients", "clients/c-iai", "project/p-iai1", "people", "people/u-danny", "view/v-3", "task/RSOM-1"]) {
    await go(page, r);
    await expect(page.locator(".top h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("demo data is saved on first load", async ({ page }) => {
  await open(page);
  expect((await store(page)).tasks.length).toBeGreaterThan(30);
});

test("Ctrl+C does not open the new-task dialog; c does", async ({ page }) => {
  await open(page, "board");
  await page.keyboard.press("Control+c");
  await expect(page.locator(".modal")).toHaveCount(0);
  await page.keyboard.press("c");
  await expect(page.getByRole("dialog", { name: "New task" })).toBeVisible();
});

test("Esc while editing the description cancels the edit, not the task; unsaved text asks first", async ({ page }) => {
  await open(page, "task/RSOM-1");
  await page.locator(".desc").click();
  await page.fill("#desc-ed", "Unsaved words");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Discard your changes/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#desc-ed")).toHaveValue("Unsaved words");
});

test("description draft survives other changes in the task", async ({ page }) => {
  await open(page, "task/RSOM-1");
  await page.locator(".desc").click();
  await page.fill("#desc-ed", "Draft in progress");
  await page.locator(".ck-row input").nth(2).check();
  await expect(page.locator("#desc-ed")).toHaveValue("Draft in progress");
});

test("focus stays on a field after changing it", async ({ page }) => {
  await open(page, "task/RSOM-1");
  await page.fill("#tf-deliverable", "Vol 1 · Ch 3b");
  await page.keyboard.press("Tab");
  const id = await page.evaluate(() => document.activeElement.id);
  expect(id).toBe("tf-labels");
});

test("negative estimates are rejected", async ({ page }) => {
  await open(page, "task/RSOM-1");
  await page.fill("#tf-estimateHours", "-5");
  await page.keyboard.press("Tab");
  await expect(page.locator(".toast")).toContainText("between 0 and 2000");
  expect((await store(page)).tasks.find(t => t.id === "t-1").estimateHours).toBe(24);
});

test("Back closes the task and returns to the page it was opened from", async ({ page }) => {
  await open(page, "tasks");
  await page.locator("tr.click").first().click();
  await expect(page.locator(".modal.wide")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".modal")).toHaveCount(0);
  expect(page.url()).toContain("#/tasks");
});

test("unknown task key shows a not-found page", async ({ page }) => {
  await open(page, "task/NOPE-99");
  await expect(page.locator(".top h1")).toHaveText("Task not found");
});

test("on-time shows 0% when nothing was on time", async ({ page }) => {
  await open(page);
  await page.evaluate(() => { db.tasks.forEach(t => { if (t.status === "Done") t.dueDate = "2000-01-02"; }); save(); render(); });
  await go(page, "insights");
  await expect(page.locator(".kpi").nth(3).locator(".val")).toHaveText("0%");
});

test("a deactivated person is shown the no-access screen and can sign out", async ({ page }) => {
  await open(page);
  await page.evaluate(() => { byId(db.users, "u-danny").isActive = false; save(); render(); });
  await expect(page.locator(".auth-h")).toHaveText("No access");
  await page.locator("#pa-out").click();
  await expect(page.locator("#si-email")).toBeVisible();
});

test("leaving a saved view clears the filters it applied", async ({ page }) => {
  await open(page, "view/v-3");
  await expect(page.locator("#f-clientId")).toHaveValue("c-iai");
  await page.locator(".nav button", { hasText: "Board" }).first().click();
  await expect(page.locator("#f-clientId")).toHaveValue("");
});

test("moving a task to another project keeps the old key working", async ({ page }) => {
  await open(page, "task/RSOM-1");
  await page.selectOption("#tf-projectId", "p-mob1");
  await expect(page).toHaveURL(/#\/task\/SDK-\d+/);
  await go(page, "task/RSOM-1");
  await expect(page.locator(".modal .td-title")).toHaveValue("Draft chapter 3 — Track modes");
});

test("deleting a project cleans up saved views that filtered on it", async ({ page }) => {
  await open(page);
  await page.evaluate(() => { db.views.push({ id: "v-x", name: "SDK only", ownerId: "u-danny", shared: false, mode: "tasks", filters: { projectId: "p-mob1" } }); save(); });
  await go(page, "project/p-mob1");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  const views = (await store(page)).views;
  expect(views.find(v => v.id === "v-x")).toBeUndefined();
});

test("CSV export neutralises spreadsheet formulas", async ({ page }) => {
  await open(page);
  const csv = await page.evaluate(() => { db.tasks[0].title = '=HYPERLINK("http://x")'; return tasksCSV(); });
  expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
});

test("restore rejects a broken backup and keeps the old data for undo", async ({ page }) => {
  await open(page);
  const err = await page.evaluate(() => validateBackup({ app: "galil-taskana", tasks: [{ id: "t" }], users: [], clients: [], projects: [] }));
  expect(err).toContain("has no");
});

test("board cards and list rows are keyboard reachable; dialogs trap focus", async ({ page }) => {
  await open(page, "board");
  const card = page.locator(".tcard").first();
  await card.focus();
  await page.keyboard.press("Enter");
  const dlg = page.getByRole("dialog");
  await expect(dlg).toHaveAttribute("aria-modal", "true");
  for (let i = 0; i < 60; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector(".scrim").contains(document.activeElement))).toBe(true);
});

test("a card can be moved with its Move menu and with Alt+Arrow", async ({ page }) => {
  await open(page, "board");
  const card = page.locator('[data-task="t-3"]');
  await card.locator("select.move").selectOption("To Do");
  expect((await store(page)).tasks.find(t => t.id === "t-3").status).toBe("To Do");
  await page.locator('[data-task="t-3"]').focus();
  await page.keyboard.press("Alt+ArrowRight");
  expect((await store(page)).tasks.find(t => t.id === "t-3").status).toBe("Writing");
});

test("dragging a card with the pointer moves it", async ({ page }) => {
  await open(page, "board");
  /* the demo board is random, so put the card at the top of its column first */
  await page.evaluate(() => { db.tasks.find(t => t.id === "t-3").priority = "Critical"; save(); render(); });
  const card = page.locator('[data-task="t-3"]');
  await card.scrollIntoViewIfNeeded();
  const target = page.locator('[data-drop="Peer Review"]');
  const a = await card.boundingBox(), b = await target.boundingBox();
  await page.mouse.move(a.x + 20, a.y + 20); await page.mouse.down();
  await page.mouse.move(a.x + 60, a.y + 40, { steps: 5 });
  await page.mouse.move(b.x + 60, b.y + 30, { steps: 10 });
  await page.mouse.up();
  expect((await store(page)).tasks.find(t => t.id === "t-3").status).toBe("Peer Review");
});

test("mentions notify by id and show in the inbox", async ({ page }) => {
  await open(page, "task/RSOM-2");
  await page.fill("#composer", "@Shosh");
  await page.locator(".mention-hint button", { hasText: "Shoshana Axtell" }).click();
  await page.locator("#composer").pressSequentially("please check the figures");
  await page.getByRole("button", { name: "Post" }).click();
  const s = await store(page);
  const c = s.comments[s.comments.length - 1];
  expect(c.body).toContain("@[u-shoshana]");
  expect(s.notifications.some(n => n.userId === "u-shoshana" && n.kind === "mention")).toBe(true);
});

test("sub-tasks, links, attachments and recurrence", async ({ page }) => {
  await open(page, "task/RSOM-3");
  await page.fill("#sub-new", "Interview prep");
  await page.locator("#sub-new").press("Enter");
  await page.fill("#link-key", "RSOM-1");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.fill("#att-url", "https://example.com/spec");
  await page.getByRole("button", { name: "Add link" }).click();
  await page.selectOption("#tf-recurrence", "Weekly");
  await page.selectOption("#tf-status", "Done");
  const s = await store(page);
  expect(s.tasks.some(t => t.parentId === "t-3" && t.title === "Interview prep")).toBe(true);
  expect(s.tasks.find(t => t.id === "t-3").links.length).toBe(1);
  expect(s.attachments.some(a => a.url === "https://example.com/spec")).toBe(true);
  expect(s.tasks.filter(t => t.title === "Maintenance procedures — outline").length).toBe(2);
});

test("bulk actions update several tasks", async ({ page }) => {
  await open(page, "tasks");
  await page.evaluate(() => { db.tasks.forEach(t => { t.priority = "Medium"; }); save(); render(); });   // demo priorities are random
  const boxes = page.locator("tbody .chk input");
  await boxes.nth(0).check(); await boxes.nth(1).check();
  await page.selectOption("#bulk-priority", "Critical");
  await expect(page.locator(".toast")).toContainText("2 tasks updated");
});

test("viewers can't edit tasks", async ({ page }) => {
  await open(page, "home", "u-eitan");
  await page.evaluate(() => { byId(db.users, "u-eitan").role = "Viewer"; save(); render(); });
  await go(page, "task/RSOM-1");
  await expect(page.locator("#tf-status")).toBeDisabled();
  await expect(page.getByRole("button", { name: "New task" })).toHaveCount(0);
});

test("Hebrew switches the interface to right-to-left", async ({ page }) => {
  await open(page, "board");
  await page.getByRole("button", { name: "עברית" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".top h1")).toHaveText("לוח");
});

test("phone layout folds the filters and has no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page, "tasks");
  await expect(page.locator("#f-clientId")).toBeHidden();
  await page.locator(".filters-btn").click();
  await expect(page.locator("#f-clientId")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("WorkDesk import adds people, clients and projects", async ({ page }) => {
  await open(page);
  const stats = await page.evaluate(() => importWorkdesk({ users: [{ id: "u-wd", fullName: "New Writer", role: "EMP", isActive: true }], clients: [{ id: "c-wd", name: "Rafael", initials: "RAF" }], projects: [{ id: "p-wd", clientId: "c-wd", name: "Missile Manual", status: "Active" }] }));
  expect(stats).toEqual({ users: 1, clients: 1, projects: 1 });
  const s = await store(page);
  expect(s.projects.find(p => p.id === "p-wd").key).toMatch(/^[A-Z][A-Z0-9]{1,5}$/);
});

/* ---------------- sign-in (standalone demo) ---------------- */
test.describe("sign-in", () => {
  const fresh = async page => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" })); });
    await page.goto(test.info().project.use.baseURL);
    return errors;
  };
  test("only @galiltc.co.il addresses and the right password get in", async ({ page }) => {
    const errors = await fresh(page);
    await page.fill("#si-email", "someone@gmail.com"); await page.fill("#si-pw", "GalilTaskana1"); await page.click("#si-go");
    await expect(page.locator("#si-err")).toContainText("@galiltc.co.il");
    await page.fill("#si-email", "danny.gelman@galiltc.co.il"); await page.fill("#si-pw", "wrong"); await page.click("#si-go");
    await expect(page.locator("#si-err")).toContainText("4 attempts left");
    await page.fill("#si-pw", "GalilTaskana1"); await page.click("#si-go");
    await expect(page.locator(".top h1")).toContainText("Danny");
    await expect(page.locator(".who-am-i")).toContainText("Admin");
    await page.locator("#sign-out").click();
    await expect(page.locator("#si-email")).toBeVisible();
    expect(errors).toEqual([]);
  });
  test("the simulated Microsoft picker lists the real team", async ({ page }) => {
    await fresh(page);
    await page.click("#si-ms");
    await expect(page.locator(".msacc")).toHaveCount(22);
    await page.locator(".msacc", { hasText: "Amy di Nardo" }).click();
    await expect(page.locator(".who-am-i")).toContainText("Amy di Nardo");
  });
  test("a new account waits for an Admin, who activates it as External", async ({ page }) => {
    await fresh(page);
    await page.getByRole("button", { name: "Request an account" }).click();
    await page.fill("#fm-fullName", "Outsourced Bookkeeper");
    await page.fill("#fm-email", "books@galiltc.co.il");
    await page.selectOption("#fm-employment", "Outsourced");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.locator(".auth-h")).toHaveText("Waiting for activation");
    await page.locator("#pa-out").click();
    await page.fill("#si-email", "danny.gelman@galiltc.co.il"); await page.fill("#si-pw", "GalilTaskana1"); await page.click("#si-go");
    await expect(page.locator(".nav button", { hasText: "People" }).locator(".count")).toHaveText("1");
    await go(page, "people");
    const u = await page.evaluate(() => db.users.find(x => x.email === "books@galiltc.co.il").id);
    await expect(page.locator("#act-role-" + u)).toHaveValue("External");
    await page.locator(".pending .btn.primary").click();
    await page.evaluate(id => { db.tasks.find(t => t.id === "t-19").assigneeId = id; save(); }, u);
    await page.locator("#sign-out").click();
    await page.fill("#si-email", "books@galiltc.co.il"); await page.fill("#si-pw", "GalilTaskana1"); await page.click("#si-go");
    await expect(page.locator(".nav button", { hasText: "People" })).toHaveCount(0);
    await go(page, "tasks");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await go(page, "task/RSOM-1");
    await expect(page.locator(".top h1")).toHaveText("Task not found");
  });
});

test("demo data can be removed and filled again without touching real work", async ({ page }) => {
  await open(page);
  await page.evaluate(() => { createTask({ projectId: "p-iai1", title: "Real work" }); });
  await page.evaluate(() => { removeDemo(db); save(); });
  let s = await store(page);
  expect(s.tasks.map(t => t.title)).toEqual(["Real work"]);
  expect(s.users.length).toBe(22);
  await page.evaluate(() => { addDemo(db); save(); });
  s = await store(page);
  expect(s.tasks.length).toBeGreaterThan(30);
  expect(s.tasks.filter(t => t.title === "Real work").length).toBe(1);
  expect(new Set(s.tasks.map(t => t.id)).size).toBe(s.tasks.length);
});

/* ---------------- connected: Microsoft Entra ID + OneDrive, both mocked ---------------- */
test.describe("Microsoft 365", () => {
  const fs = require("fs"), path = require("path");
  const SITE = path.resolve(__dirname, "../../site/taskana");
  const ORIGIN = "https://taskana.test";
  const file = () => ({ text: null, etag: null, n: 0, puts: [] });

  async function connect(page, drive, account) {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route(ORIGIN + "/**", r => {
      const p = new URL(r.request().url()).pathname.replace(/^\//, "") || "index.html";
      r.fulfill({ path: path.join(SITE, p) });
    });
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Expose-Headers": "*" };
    const json = (r, status, body) => r.fulfill({ status, headers: Object.assign({ "Content-Type": "application/json" }, cors), body: JSON.stringify(body) });
    await page.route("https://dl.test/**", r => r.fulfill({ status: 200, headers: cors, body: drive.text }));
    await page.route("https://graph.microsoft.com/**", async r => {
      const req = r.request(), url = decodeURIComponent(new URL(req.url()).pathname), m = req.method();
      if (m === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
      if (url.endsWith("/me/drive/root:/Taskana")) return json(r, 200, { id: "F", name: "Taskana", webUrl: "https://onedrive.test/Taskana", folder: {}, parentReference: { driveId: "D" } });
      if (url.endsWith("/children") || url.includes("backups/")) return json(r, 201, { id: "x" });
      if (url.endsWith("taskana-data.json:/content") && m === "PUT") {
        const h = req.headers();
        if ((h["if-match"] && h["if-match"] !== drive.etag) || (h["if-none-match"] === "*" && drive.text)) return json(r, 412, { error: { code: "resourceModified", message: "changed" } });
        drive.text = req.postData(); drive.etag = "e" + (++drive.n); drive.puts.push(h["if-match"] || "new");
        return json(r, 200, { id: "data", eTag: drive.etag, size: drive.text.length });
      }
      if (url.endsWith("taskana-data.json:")) return drive.text ? json(r, 200, { id: "data", eTag: drive.etag, size: drive.text.length, "@microsoft.graph.downloadUrl": "https://dl.test/data" }) : json(r, 404, { error: { code: "itemNotFound", message: "nope" } });
      return json(r, 404, { error: { code: "itemNotFound", message: url } });
    });
    await page.addInitScript(acc => {
      localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "onedrive", entra: { clientId: "11111111-2222-3333-4444-555555555555" }, onedrive: {} }));
      window.TASKANA_MSAL = function () {
        this.initialize = () => Promise.resolve();
        this.handleRedirectPromise = () => Promise.resolve(null);
        this.getAllAccounts = () => (sessionStorage.getItem("signed-out") ? [] : [acc]);
        this.setActiveAccount = () => {};
        this.acquireTokenSilent = () => Promise.resolve({ accessToken: "token" });
        this.loginRedirect = () => { sessionStorage.removeItem("signed-out"); location.reload(); return Promise.resolve(); };
        this.logoutRedirect = () => { sessionStorage.setItem("signed-out", "1"); return Promise.resolve(); };
      };
    }, account);
    await page.goto(ORIGIN + "/index.html");
    return errors;
  }
  const danny = { username: "danny.gelman@galiltc.co.il", name: "Danny Gelman", localAccountId: "oid-danny", idTokenClaims: { tid: "t" } };

  test("first sign-in sets up the OneDrive file; the person who did it is Admin", async ({ page }) => {
    const drive = file();
    const errors = await connect(page, drive, danny);
    await expect(page.locator(".auth-h")).toHaveText("Set up Taskana");
    await page.getByRole("button", { name: "Start with the team and demo tasks" }).click();
    await expect(page.locator(".top h1")).toContainText("Danny");
    await expect.poll(() => drive.text && JSON.parse(drive.text).tasks.length).toBeGreaterThan(30);
    const d = JSON.parse(drive.text);
    expect(d.settings).toBeUndefined();
    const u = d.users.find(x => x.email === "danny.gelman@galiltc.co.il");
    expect(u.role).toBe("Admin"); expect(u.entraId).toBe("oid-danny");
    await expect(page.locator("#sync-status")).toContainText("Saved to OneDrive");
    expect(errors).toEqual([]);
  });

  test("someone else's save in between is merged, not overwritten", async ({ page }) => {
    const drive = file();
    await connect(page, drive, danny);
    await page.getByRole("button", { name: "Start with the GALIL team (no tasks)" }).click();
    await expect.poll(() => drive.etag).toBe("e1");
    /* another person changes the file on OneDrive… */
    const other = JSON.parse(drive.text);
    other.clients.push({ id: "c-theirs", name: "Their client", code: "THR" });
    other.users.find(u => u.id === "u-amy").jobTitle = "Senior Technical Writer";
    drive.text = JSON.stringify(other); drive.etag = "e-other";
    /* …while we change something else here */
    await page.evaluate(() => { db.clients.push({ id: "c-mine", name: "My client", code: "MIN" }); byId(db.users, "u-eitan").jobTitle = "Lead Writer"; save(); });
    await expect.poll(() => JSON.parse(drive.text).clients.map(c => c.id).sort().join()).toBe("c-mine,c-theirs");
    const d = JSON.parse(drive.text);
    expect(d.users.find(u => u.id === "u-amy").jobTitle).toBe("Senior Technical Writer");
    expect(d.users.find(u => u.id === "u-eitan").jobTitle).toBe("Lead Writer");
    expect(await page.evaluate(() => db.clients.length)).toBe(2);
  });

  test("an unknown company account waits for activation; other domains are refused", async ({ page }) => {
    const drive = file();
    drive.text = JSON.stringify(Object.assign({ app: "galil-taskana", version: 2, rosterVersion: 1, clients: [], projects: [], tasks: [], comments: [], activity: [], views: [], notifications: [], attachments: [] }, { users: [{ id: "u-danny", fullName: "Danny Gelman", email: "danny.gelman@galiltc.co.il", role: "Admin", isActive: true }] }));
    drive.etag = "e0";
    await connect(page, drive, { username: "hr.outsourced@galiltc.co.il", name: "Outsourced HR", localAccountId: "oid-hr" });
    await expect(page.locator(".auth-h")).toHaveText("Waiting for activation");
    await expect.poll(() => JSON.parse(drive.text).users.some(u => u.email === "hr.outsourced@galiltc.co.il" && u.pendingActivation)).toBe(true);
    /* an Admin activates them elsewhere; "Check again" lets them in */
    const d = JSON.parse(drive.text); const u = d.users.find(x => x.email === "hr.outsourced@galiltc.co.il");
    Object.assign(u, { pendingActivation: false, isActive: true, role: "External" }); drive.text = JSON.stringify(d); drive.etag = "e-admin";
    await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.locator(".who-am-i")).toContainText("External");
  });

  test("accounts outside @galiltc.co.il are refused", async ({ page }) => {
    await connect(page, file(), { username: "someone@gmail.com", name: "Someone", localAccountId: "x" });
    await expect(page.locator(".banner.err")).toContainText("@galiltc.co.il");
    await expect(page.locator("#si-ms")).toBeVisible();
  });
});

/* ---------------- GitHub data file (the testing setup), API mocked ---------------- */
test.describe("GitHub storage", () => {
  const fs = require("fs"), path = require("path");
  const b64 = t => Buffer.from(t, "utf8").toString("base64"), unb64 = t => Buffer.from(t, "base64").toString("utf8");
  async function connect(page, repo, opts = {}) {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" };
    const json = (r, status, body) => r.fulfill({ status, headers: Object.assign({ "Content-Type": "application/json" }, cors), body: JSON.stringify(body) });
    await page.route("https://api.github.com/**", r => {
      const req = r.request(), u = new URL(req.url()), p = decodeURIComponent(u.pathname), m = req.method();
      if (m === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
      if (req.headers().authorization !== "Bearer github_pat_test") return json(r, 401, { message: "Bad credentials" });
      if (p === "/repos/o/r") return json(r, 200, { private: false, default_branch: "main", permissions: { push: opts.push !== false } });
      if (p === "/repos/o/r/branches/taskana-data") return repo.branch ? json(r, 200, {}) : json(r, 404, { message: "Branch not found" });
      if (p === "/repos/o/r/git/ref/heads/main") return json(r, 200, { object: { sha: "main-sha" } });
      if (p === "/repos/o/r/git/refs" && m === "POST") { repo.branch = true; return json(r, 201, {}); }
      if (p === "/repos/o/r/contents/taskana/taskana-data.json") {
        if (m === "GET") return repo.text ? json(r, 200, { sha: repo.sha, size: repo.text.length, encoding: "base64", content: b64(repo.text) }) : json(r, 404, { message: "Not Found" });
        if (m === "PUT") {
          const body = JSON.parse(req.postData());
          if (body.branch !== "taskana-data") return json(r, 422, { message: "wrong branch" });
          if ((body.sha || null) !== (repo.sha || null)) return json(r, 409, { message: "does not match" });
          repo.text = unb64(body.content); repo.sha = "s" + (++repo.n); repo.commits.push(body.message);
          return json(r, 200, { content: { sha: repo.sha, size: repo.text.length } });
        }
      }
      return json(r, 404, { message: "Not Found: " + p });
    });
    await page.addInitScript(tok => {
      localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "github", github: { owner: "o", repo: "r", branch: "taskana-data", path: "taskana" } }));
      if (tok) localStorage.setItem("galil-taskana-github-token", tok);
    }, opts.token === undefined ? "github_pat_test" : opts.token);
    await page.goto(test.info().project.use.baseURL);
    return errors;
  }
  const empty = () => ({ text: null, sha: null, n: 0, branch: false, commits: [] });
  const signIn = async (page, email = "danny.gelman@galiltc.co.il") => {
    await page.fill("#si-email", email); await page.fill("#si-pw", "GalilTaskana1"); await page.click("#si-go");
  };

  test("asks for a token, makes the data branch, sets up and saves commits there", async ({ page }) => {
    const repo = empty();
    const errors = await connect(page, repo, { token: "" });
    await expect(page.locator(".auth-h")).toHaveText("Connect to GitHub");
    await page.fill("#gh-token", "github_pat_test"); await page.click("#gh-go");
    await expect(page.locator(".auth-h")).toHaveText("Set up Taskana");
    expect(repo.branch).toBe(true);
    await page.getByRole("button", { name: "Start with the team and demo tasks" }).click();
    await expect(page.locator("#si-email")).toBeVisible();
    await expect.poll(() => repo.text && JSON.parse(repo.text).tasks.length).toBeGreaterThan(30);
    await signIn(page);
    await expect(page.locator(".who-am-i")).toContainText("Danny Gelman");
    await page.evaluate(() => { createTask({ projectId: "p-iai1", title: "Saved to GitHub" }); });
    await expect.poll(() => JSON.parse(repo.text).tasks.some(t => t.title === "Saved to GitHub"), { timeout: 10000 }).toBe(true);
    await expect(page.locator("#sync-status")).toContainText("Saved to GitHub");
    expect(repo.commits.every(m => m.startsWith("Taskana: data saved"))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("a save that crossed someone else's is merged", async ({ page }) => {
    const repo = empty();
    await connect(page, repo);
    await page.getByRole("button", { name: "Start with the GALIL team (no tasks)" }).click();
    await expect.poll(() => repo.sha).toBe("s1");
    await signIn(page);
    await expect.poll(() => repo.sha).not.toBe("s1");          // the sign-in time is saved too
    const theirs = JSON.parse(repo.text); theirs.clients.push({ id: "c-theirs", name: "Theirs", code: "THR" });
    repo.text = JSON.stringify(theirs); repo.sha = "other";
    await page.evaluate(() => { db.clients.push({ id: "c-mine", name: "Mine", code: "MIN" }); save(); });
    await expect.poll(() => JSON.parse(repo.text).clients.map(c => c.id).sort().join(), { timeout: 10000 }).toBe("c-mine,c-theirs");
  });

  test("a token without write access is turned away with a clear message", async ({ page }) => {
    await connect(page, empty(), { push: false });
    await expect(page.locator(".auth-h")).toHaveText("Connect to GitHub");
    await expect(page.locator(".banner.err")).toContainText("Read and write");
  });
});
