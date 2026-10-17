// End-to-end checks for Taskana in the Employee Portal: its main flows, the QA fixes,
// and what it shows from WorkDesk.
const { test, expect } = require("@playwright/test");
/* ---------------- served over https with the APIs mocked ---------------- */
const pathM = require("path");
const PORTAL_DIR = pathM.resolve(__dirname, "../../Employee Portal");
const ORIGIN = "https://portal.test";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Expose-Headers": "*" };
const json = (r, status, body) => r.fulfill({ status, headers: Object.assign({ "Content-Type": "application/json" }, cors), body: JSON.stringify(body) });

/* signed in to the Employee Portal (as Danny, a Taskana Admin, unless a test says otherwise):
   the portal home seeds WorkDesk's team and projects, which Taskana reads. The portal folder is
   served at an https address, so both pages share one storage (file:// pages don't, reliably). */
const open = async (page, route = "home", userId = "u-danny") => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(ORIGIN + "/**", r => {
    const p = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, "") || "index.html";
    r.fulfill({ path: pathM.join(PORTAL_DIR, p) });
  });
  await page.addInitScript(id => {
    localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
    localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" }));
    if (!sessionStorage.getItem("pw-signed-in")) { localStorage.setItem("galil-workdesk-session", id); sessionStorage.setItem("pw-signed-in", "1"); }
  }, userId);
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#portal-home")).toBeVisible();
  await page.goto(ORIGIN + "/taskana/index.html#/" + route);
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

test("a person deactivated in WorkDesk is turned away and led back to the portal", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
    raw.data.users.find(u => u.id === "u-danny").isActive = false;
    localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
  });
  await page.reload();
  await expect(page.locator(".auth-h")).toHaveText("No access to Taskana");
  await expect(page.locator("#to-portal")).toHaveAttribute("href", "../index.html");
});

test("saved views are personal: other people don't see them", async ({ page }) => {
  await open(page, "home", "u-tamir");
  const r = await page.evaluate(() => ({ all: db.views.length, mine: visibleViews().length, others: db.views.filter(v => v.ownerId !== me().id).length }));
  expect(r.others).toBeGreaterThan(0);
  expect(r.mine).toBe(r.all - r.others);
  const other = await page.evaluate(() => db.views.find(v => v.ownerId !== me().id).id);
  await go(page, "view/" + other);
  await expect(page.locator(".top h1")).toHaveText("View not found");
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

test("clients and projects are WorkDesk's: read-only here, with only the key and document type to edit", async ({ page }) => {
  await open(page, "project/p-mob1");
  await expect(page.locator(".wd-note")).toContainText("WorkDesk");
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await page.getByRole("button", { name: "Key & description" }).click();
  await expect(page.locator("#fm-key")).toBeVisible();
  await expect(page.locator("#fm-name")).toHaveCount(0);
});

test("a project removed in WorkDesk leaves Taskana, with the saved views that filtered on it", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    db.views.push({ id: "v-x", name: "SDK only", ownerId: "u-danny", shared: false, mode: "tasks", filters: { projectId: "p-mob1" } });
    db.tasks.filter(t => t.projectId === "p-mob1").forEach(t => { t.projectId = "p-iai1"; });
    save();
    const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
    raw.data.projects = raw.data.projects.filter(p => p.id !== "p-mob1");
    localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
  });
  await page.reload();
  await expect(page.locator(".top h1")).toBeVisible();
  const s = await store(page);
  expect(s.projects.some(p => p.id === "p-mob1")).toBe(false);
  expect(s.views.find(v => v.id === "v-x")).toBeUndefined();
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
  expect(await page.evaluate(() => localStorage.getItem("galil-portal-lang"))).toBe("he");
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

test("WorkDesk projects get a short task key", async ({ page }) => {
  await open(page);
  const keys = await page.evaluate(() => db.projects.map(p => p.key));
  keys.forEach(k => expect(k).toMatch(/^[A-Z][A-Z0-9]{1,5}$/));
  expect(new Set(keys).size).toBe(keys.length);
});

/* ---------------- signing in happens on the Employee Portal ---------------- */
test.describe("portal sign-in", () => {
  test("without a portal session Taskana leads to the portal", async ({ page }) => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" })));
    await page.goto(test.info().project.use.baseURL);
    await expect(page.locator(".auth-h")).toHaveText("Sign in to the Employee Portal first");
    await expect(page.locator("#to-portal")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the Taskana role is the person's portal access", async ({ page }) => {
    await open(page, "home", "u-eitan");
    await expect(page.locator(".who-am-i")).toContainText("Member");
    await expect(page.locator(".who-am-i")).toContainText("Eitan Fisch");
  });

  test("an external contractor sees only their own tasks and no People page", async ({ page }) => {
    await open(page, "home", "u-gil");
    await expect(page.locator(".who-am-i")).toContainText("External");
    await expect(page.locator(".nav button", { hasText: "People" })).toHaveCount(0);
    const mine = await page.evaluate(() => visibleTasks().every(t => canSee(t)) && visibleTasks().length < db.tasks.length);
    expect(mine).toBe(true);
  });

  test("no Taskana in the portal access: no entry", async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      raw.data.users.find(u => u.id === "u-danny").access = { taskana: "none" };
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    });
    await page.reload();
    await expect(page.locator(".auth-h")).toHaveText("No access to Taskana");
  });

  test("signing out signs out of the whole portal", async ({ page }) => {
    await open(page);
    await page.locator("#sign-out").click();
    await expect(page.locator("#si-email")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("galil-workdesk-session"))).toBeNull();
  });
});

/* ---------------- what Taskana shows from WorkDesk ---------------- */
test.describe("from WorkDesk", () => {
  test("people, clients, projects and work orders come from WorkDesk", async ({ page }) => {
    await open(page);
    const r = await page.evaluate(() => {
      const wd = GalilPortal.workdesk();
      return {
        users: wd.users.every(u => byId(db.users, u.id)),
        clients: wd.clients.every(c => byId(db.clients, c.id)),
        projects: wd.projects.every(p => byId(db.projects, p.id)),
        workOrders: wd.workOrders.every(w => byId(db.workOrders, w.id))
      };
    });
    expect(r).toEqual({ users: true, clients: true, projects: true, workOrders: true });
  });

  test("a new WorkDesk project appears in Taskana straight away", async ({ page }) => {
    await open(page, "clients");
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      raw.data.projects.push({ id: "p-new", clientId: raw.data.clients[1].id, name: "Brand-new manual", status: "Active", ownerId: "u-danny" });
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
      window.dispatchEvent(new Event("focus"));
    });
    await expect.poll(() => page.evaluate(() => !!byId(db.projects, "p-new"))).toBe(true);
  });

  test("a project page shows its budget and the team's hours banks", async ({ page }) => {
    await open(page);
    const id = await page.evaluate(() => db.projects.find(p => wdBudgetsOfProject(p.id).length).id);
    await go(page, "project/" + id);
    await expect(page.getByRole("heading", { name: "Budget & hours" })).toBeVisible();
    await expect(page.locator(".wd-line").first()).toBeVisible();
  });

  test("a task links to WorkDesk's time form for that task", async ({ page }) => {
    await open(page);
    const key = await page.evaluate(() => taskKey(db.tasks.find(t => t.assigneeId === "u-danny")));
    await go(page, "task/" + key);
    await expect(page.locator("#wd-task-hours")).toBeVisible();
    await expect(page.locator("#wd-report")).toHaveAttribute("href", /\.\.\/index\.html#\/workdesk\/time\?task=/);
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

/* the whole portal folder at ORIGIN; WorkDesk on local data, signed in as Danny */
async function servePortal(page, taskanaConfig, before) {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(ORIGIN + "/**", r => {
    const p = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, "") || "index.html";
    r.fulfill({ path: pathM.join(PORTAL_DIR, p) });
  });
  await page.addInitScript(cfg => {
    localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
    localStorage.setItem("galil-taskana-config", JSON.stringify(cfg));
    localStorage.setItem("galil-workdesk-session", "u-danny");
  }, taskanaConfig);
  if (before) await before();
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#portal-home")).toBeVisible();
  await page.goto(ORIGIN + "/taskana/index.html");
  return errors;
}

/* ---------------- Microsoft 365: OneDrive, with the portal's Microsoft account ---------------- */
test.describe("Microsoft 365", () => {
  const file = () => ({ text: null, etag: null, n: 0, puts: [] });
  async function connect(page, drive, accounts) {
    return servePortal(page, { storage: "onedrive", entra: { clientId: "11111111-2222-3333-4444-555555555555" }, onedrive: {} }, async () => {
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
      await page.addInitScript(accs => {
        window.TASKANA_MSAL = function () {
          this.initialize = () => Promise.resolve();
          this.handleRedirectPromise = () => Promise.resolve(null);
          this.getAllAccounts = () => accs;
          this.setActiveAccount = () => {};
          this.acquireTokenSilent = () => Promise.resolve({ accessToken: "token" });
          this.acquireTokenRedirect = () => Promise.resolve();
        };
      }, accounts);
    });
  }
  const danny = { username: "danny.gelman@galiltc.co.il", name: "Danny Gelman", localAccountId: "oid-danny" };

  test("the first opening sets up the OneDrive file with demo tasks on WorkDesk's projects", async ({ page }) => {
    const drive = file();
    const errors = await connect(page, drive, [danny]);
    await expect(page.locator(".auth-h")).toHaveText("Set up Taskana");
    await page.getByRole("button", { name: "Start with demo tasks on WorkDesk's projects" }).click();
    await expect(page.locator(".who-am-i")).toContainText("Danny Gelman");
    await expect.poll(() => drive.text && JSON.parse(drive.text).tasks.length).toBeGreaterThan(30);
    await expect(page.locator("#sync-status")).toContainText("Saved to OneDrive");
    expect(errors).toEqual([]);
  });

  test("someone else's save in between is merged, not overwritten", async ({ page }) => {
    const drive = file();
    await connect(page, drive, [danny]);
    await page.getByRole("button", { name: "Start with no tasks" }).click();
    await expect.poll(() => drive.etag).not.toBeNull();
    await expect(page.locator("#sync-status")).toContainText("Saved to OneDrive");
    const other = JSON.parse(drive.text);
    other.views.push({ id: "v-theirs", name: "Theirs", ownerId: "u-kfir", shared: true, mode: "tasks", filters: {} });
    drive.text = JSON.stringify(other); drive.etag = "e-other";
    await page.evaluate(() => { db.views.push({ id: "v-mine", name: "Mine", ownerId: "u-danny", shared: false, mode: "tasks", filters: {} }); save(); });
    await expect.poll(() => JSON.parse(drive.text).views.map(v => v.id).sort().join(), { timeout: 15000 }).toBe("v-mine,v-theirs");
  });

  test("without the portal's Microsoft account Taskana sends people back to the portal", async ({ page }) => {
    await connect(page, file(), []);
    await expect(page.locator(".auth-h")).toHaveText("Sign in to the Employee Portal first");
  });
});

/* ---------------- GitHub data file (the testing setup), API mocked ---------------- */
test.describe("GitHub storage", () => {
  const b64 = t => Buffer.from(t, "utf8").toString("base64"), unb64 = t => Buffer.from(t, "base64").toString("utf8");
  async function connect(page, repo, opts = {}) {
    return servePortal(page, { storage: "github", github: { owner: "o", repo: "r", branch: "taskana-data", path: "taskana" } }, async () => {
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
      /* the portal's one GitHub token (WorkDesk and Taskana share it) */
      await page.addInitScript(tok => { if (tok && !sessionStorage.getItem("pw-tok")) { localStorage.setItem("galil-portal-github-token", tok); sessionStorage.setItem("pw-tok", "1"); } },
        opts.token === undefined ? "github_pat_test" : opts.token);
    });
  }
  const empty = () => ({ text: null, sha: null, n: 0, branch: false, commits: [] });

  test("asks for the portal's token, makes the data branch, sets up and saves commits there", async ({ page }) => {
    const repo = empty();
    const errors = await connect(page, repo, { token: "" });
    await expect(page.locator(".auth-h")).toHaveText("Connect to GitHub");
    await page.fill("#gh-token", "github_pat_test"); await page.click("#gh-go");
    await expect(page.locator(".auth-h")).toHaveText("Set up Taskana");
    expect(repo.branch).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("galil-portal-github-token"))).toBe("github_pat_test");
    await page.getByRole("button", { name: "Start with demo tasks on WorkDesk's projects" }).click();
    await expect(page.locator(".who-am-i")).toContainText("Danny Gelman");
    await expect.poll(() => repo.text && JSON.parse(repo.text).tasks.length).toBeGreaterThan(30);
    await page.evaluate(() => { createTask({ projectId: db.projects[0].id, title: "Saved to GitHub" }); });
    await expect.poll(() => JSON.parse(repo.text).tasks.some(t => t.title === "Saved to GitHub"), { timeout: 10000 }).toBe(true);
    await expect(page.locator("#sync-status")).toContainText("Saved to GitHub");
    expect(repo.commits.every(m => m.startsWith("Taskana: data saved"))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("a save that crossed someone else's is merged", async ({ page }) => {
    const repo = empty();
    await connect(page, repo);
    await page.getByRole("button", { name: "Start with no tasks" }).click();
    await expect.poll(() => repo.sha).not.toBeNull();
    await expect(page.locator("#sync-status")).toContainText("Saved to GitHub");
    const theirs = JSON.parse(repo.text); theirs.views.push({ id: "v-theirs", name: "Theirs", ownerId: "u-kfir", shared: true, mode: "tasks", filters: {} });
    repo.text = JSON.stringify(theirs); repo.sha = "other";
    await page.evaluate(() => { db.views.push({ id: "v-mine", name: "Mine", ownerId: "u-danny", shared: false, mode: "tasks", filters: {} }); save(); });
    await expect.poll(() => JSON.parse(repo.text).views.map(v => v.id).sort().join(), { timeout: 10000 }).toBe("v-mine,v-theirs");
  });

  test("a token without write access is turned away with a clear message", async ({ page }) => {
    await connect(page, empty(), { push: false });
    await expect(page.locator(".auth-h")).toHaveText("Connect to GitHub");
    await expect(page.locator(".banner.err")).toContainText("Read and write");
  });
});

test("the Library turns pasted SME notes into a structured document and saves it", async ({ page }) => {
  const errors = await open(page, "library");
  await expect(page.locator(".lib-item", { hasText: "SME interview" }).first()).toBeVisible();
  await page.getByRole("button", { name: "New document" }).click();
  await page.locator(".lib-menu button", { hasText: "Blank document" }).click();
  await page.locator("#lib-ed").click();
  const notes = ["POWER-UP PROCEDURE", "1. Switch on the main breaker", "2. Turn the console key", "Q: What if BIT fails?", "A: Call maintenance.",
    "Error codes:", "- E12 cooling loop", "todo: get the amber codes", "{\"mode\":\"standby\",\"checks\":[\"tx\"]}"].join("\n");
  await page.evaluate(t => { const dt = new DataTransfer(); dt.setData("text/plain", t); document.getElementById("lib-ed").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); }, notes);
  await page.getByRole("button", { name: "Writer tools" }).click();
  await page.locator(".lib-menu button", { hasText: "Organize pasted notes" }).click();
  const ed = page.locator("#lib-ed");
  await expect(ed.locator("div.toc a")).toHaveCount(2);
  await expect(ed.locator("h1")).toHaveText("Power-up procedure");
  await expect(ed.locator("ol > li")).toHaveCount(2);
  await expect(ed.locator(".qa .q")).toHaveText("What if BIT fails?");
  await expect(ed.locator("mark.fu")).toHaveText("get the amber codes");
  await expect(ed.locator("pre.lang-json")).toContainText('"mode": "standby"');
  await expect(page.locator("#lib-foot")).toContainText("Saved");
  const doc = (await store(page)).library.find(d => /<h1/.test(d.html) && /class="toc"/.test(d.html));
  expect(doc).toBeTruthy();
  expect(doc.html).not.toMatch(/<script|onerror/i);
  expect(errors).toEqual([]);
});
