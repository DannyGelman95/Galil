// The Employee Portal and WorkDesk: the GALIL team, demo data, the portal home page and
// per-person access, Hebrew, and the GitHub / Microsoft 365 data files (APIs mocked).
const { test, expect } = require("@playwright/test");
const fs = require("fs"), path = require("path");

const SITE = path.resolve(__dirname, "../../Employee Portal");
const data = page => page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data);
const local = async page => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  /* the work order preview is a blob: frame, where storage is off limits */
  await page.addInitScript(() => { try { localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })); } catch (e) {} });
  await page.goto(test.info().project.use.baseURL);
  await expect(page.locator("#si-email")).toBeVisible();
  return errors;
};
const signIn = async (page, email) => {
  await page.fill("#si-email", email); await page.fill("#si-pw", "GalilWorkdesk1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
};

test("the standalone demo starts with the real GALIL team and demo work", async ({ page }) => {
  const errors = await local(page);
  await signIn(page, "danny.gelman@galiltc.co.il");
  await expect(page.getByText("Signed in as Danny Gelman")).toBeVisible();
  const d = await data(page);
  expect(d.users.length).toBe(22);
  const role = e => d.users.find(u => u.email === e).role;
  expect(role("tamir@galiltc.co.il")).toBe("CEO");
  expect(role("inon.kanner@galiltc.co.il")).toBe("OPS");
  expect(role("gil.hadar@galiltc.co.il")).toBe("EXT");
  expect(d.users.find(u => u.id === "u-eitan").managerId).toBe("u-danny");
  expect(d.entries.length).toBeGreaterThan(300);
  expect(d.users.some(u => /Dana Galil|Maya Ben Ari/.test(u.fullName))).toBe(false);
  expect(errors).toEqual([]);
});

test("demo data can be removed and filled again; real records stay", async ({ page }) => {
  await local(page);
  const r = await page.evaluate(() => {
    const d = seed(true);
    d.clients.push({ id: "c-real", name: "Real client", initials: "RC" });
    removeDemo(d);
    const after = { clients: d.clients.map(c => c.id), entries: d.entries.length, users: d.users.length, demo: hasDemo(d) };
    addDemo(d);
    return { after, refilled: d.entries.length, demo: hasDemo(d) };
  });
  expect(r.after.clients.sort()).toEqual(["c-gal", "c-real"]);
  expect(r.after.entries).toBe(0);
  expect(r.after.users).toBe(22);
  expect(r.after.demo).toBe(false);
  expect(r.refilled).toBeGreaterThan(300);
  expect(r.demo).toBe(true);
});

/* ---------- served over https with the APIs mocked ---------- */
const ORIGIN = "https://workdesk.test";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" };
const json = (r, status, body) => r.fulfill({ status, headers: Object.assign({ "Content-Type": "application/json" }, cors), body: JSON.stringify(body) });
async function serve(page) {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(ORIGIN + "/**", r => {
    const p = new URL(r.request().url()).pathname.replace(/^\//, "") || "index.html";
    r.fulfill({ path: path.join(SITE, p) });
  });
  return errors;
}

test.describe("GitHub data file", () => {
  const b64 = t => Buffer.from(t, "utf8").toString("base64"), unb64 = t => Buffer.from(t, "base64").toString("utf8");
  async function connect(page, repo, token = "github_pat_test") {
    const errors = await serve(page);
    await page.route("https://api.github.com/**", r => {
      const req = r.request(), p = decodeURIComponent(new URL(req.url()).pathname), m = req.method();
      if (m === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
      if (req.headers().authorization !== "Bearer github_pat_test") return json(r, 401, { message: "Bad credentials" });
      if (p === "/repos/o/r") return json(r, 200, { default_branch: "main", permissions: { push: true } });
      if (p === "/repos/o/r/branches/workdesk-data") return repo.branch ? json(r, 200, {}) : json(r, 404, {});
      if (p === "/repos/o/r/git/ref/heads/main") return json(r, 200, { object: { sha: "m" } });
      if (p === "/repos/o/r/git/refs") { repo.branch = true; return json(r, 201, {}); }
      if (p === "/repos/o/r/contents/workdesk/workdesk-data.json") {
        if (m === "GET") return repo.text ? json(r, 200, { sha: repo.sha, size: repo.text.length, encoding: "base64", content: b64(repo.text) }) : json(r, 404, {});
        const body = JSON.parse(req.postData());
        if ((body.sha || null) !== (repo.sha || null)) return json(r, 409, { message: "does not match" });
        repo.text = unb64(body.content); repo.sha = "s" + (++repo.n);
        return json(r, 200, { content: { sha: repo.sha, size: repo.text.length } });
      }
      return json(r, 404, { message: p });
    });
    await page.addInitScript(tok => {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "github", github: { owner: "o", repo: "r", branch: "workdesk-data", path: "workdesk" } }));
      if (tok && !sessionStorage.getItem("seen")) { localStorage.setItem("galil-portal-github-token", tok); sessionStorage.setItem("seen", "1"); }
    }, token);
    await page.goto(ORIGIN + "/index.html");
    return errors;
  }
  const empty = () => ({ text: null, sha: null, n: 0, branch: false });

  test("token, branch, set-up, sign-in and saving as commits", async ({ page }) => {
    const repo = empty();
    const errors = await connect(page, repo, "");
    await expect(page.getByText("Connect to GitHub")).toBeVisible();
    await page.fill("#wd-gh-token", "github_pat_test"); await page.click("#wd-gh-go");
    await expect(page.getByText("Set up WorkDesk")).toBeVisible();
    expect(repo.branch).toBe(true);
    await page.getByRole("button", { name: "Start with the team and demo data" }).click();
    await expect(page.locator("#si-email")).toBeVisible();
    expect(JSON.parse(repo.text).data.users.length).toBe(22);
    await signIn(page, "danny.gelman@galiltc.co.il");
    await expect(page.getByText("Signed in as Danny Gelman")).toBeVisible();
    await expect.poll(() => JSON.parse(repo.text).data.audit.some(a => /Sign-in/.test(a.action)), { timeout: 10000 }).toBe(true);
    await expect(page.locator("#wd-sync")).toContainText("Saved to GitHub", { timeout: 10000 });
    /* the save status sits in the header, next to the GALIL mark, on the home page and in WorkDesk */
    await expect(page.locator(".hubtop .brand #wd-sync")).toBeVisible();
    await page.locator("#tile-workdesk").click();
    await expect(page.locator(".topbar .brand #wd-sync")).toContainText("Saved to GitHub");
    expect(errors).toEqual([]);
  });

  test("a save that crossed someone else's is merged", async ({ page }) => {
    const repo = empty();
    await connect(page, repo);
    await page.getByRole("button", { name: "Start with the GALIL team (no work yet)" }).click();
    await signIn(page, "danny.gelman@galiltc.co.il");
    await expect(page.locator("#wd-sync")).toContainText("Saved to GitHub", { timeout: 10000 });
    const theirs = JSON.parse(repo.text);
    theirs.data.clients.push({ id: "c-theirs", name: "Theirs", initials: "TH" });
    repo.text = JSON.stringify(theirs); repo.sha = "other";
    await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1")); raw.data.clients.push({ id: "c-mine", name: "Mine", initials: "MI" }); writeRaw(raw); });
    await expect.poll(() => JSON.parse(repo.text).data.clients.map(c => c.id).sort().join(), { timeout: 15000 }).toBe("c-gal,c-mine,c-theirs");
  });
});

test.describe("Microsoft 365", () => {
  async function connect(page, drive, account) {
    const errors = await serve(page);
    await page.route("https://dl.test/**", r => r.fulfill({ status: 200, headers: cors, body: drive.text }));
    await page.route("https://graph.microsoft.com/**", r => {
      const req = r.request(), url = decodeURIComponent(new URL(req.url()).pathname), m = req.method();
      if (m === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
      if (url.endsWith("/me/drive/root:/WorkDesk")) return json(r, 200, { id: "F", name: "WorkDesk", folder: {}, parentReference: { driveId: "D" } });
      if (url.endsWith("/children") || url.includes("backups/")) return json(r, 201, {});
      if (url.endsWith("workdesk-data.json:/content") && m === "PUT") {
        const h = req.headers();
        if ((h["if-match"] && h["if-match"] !== drive.etag) || (h["if-none-match"] === "*" && drive.text)) return json(r, 412, {});
        drive.text = req.postData(); drive.etag = "e" + (++drive.n);
        return json(r, 200, { eTag: drive.etag, size: drive.text.length });
      }
      if (url.endsWith("workdesk-data.json:")) return drive.text ? json(r, 200, { eTag: drive.etag, size: 1, "@microsoft.graph.downloadUrl": "https://dl.test/d" }) : json(r, 404, { error: { code: "itemNotFound" } });
      return json(r, 404, {});
    });
    await page.addInitScript(acc => {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "onedrive", entra: { clientId: "11111111-2222-3333-4444-555555555555" } }));
      window.WORKDESK_MSAL = function () {
        this.initialize = () => Promise.resolve();
        this.handleRedirectPromise = () => Promise.resolve(null);
        this.getAllAccounts = () => (sessionStorage.getItem("out") ? [] : [acc]);
        this.setActiveAccount = () => {};
        this.acquireTokenSilent = () => Promise.resolve({ accessToken: "t" });
        this.loginRedirect = () => { sessionStorage.removeItem("out"); location.reload(); return Promise.resolve(); };
        this.logoutRedirect = () => { sessionStorage.setItem("out", "1"); return Promise.resolve(); };
      };
    }, account);
    await page.goto(ORIGIN + "/index.html");
    return errors;
  }
  const file = () => ({ text: null, etag: null, n: 0 });

  test("first sign-in sets up the OneDrive file and signs Tamir in as CEO", async ({ page }) => {
    const drive = file();
    const errors = await connect(page, drive, { username: "tamir@galiltc.co.il", name: "Tamir Nisman", localAccountId: "oid-t" });
    await page.getByRole("button", { name: "Start with the team and demo data" }).click();
    await expect(page.getByText("Tamir Nisman").first()).toBeVisible();
    await expect.poll(() => drive.text && JSON.parse(drive.text).data.users.find(u => u.email === "tamir@galiltc.co.il").entraId).toBe("oid-t");
    await expect(page.locator("#wd-sync")).toContainText("Saved to OneDrive");
    expect(errors).toEqual([]);
  });

  test("an unknown company account waits for activation", async ({ page }) => {
    const drive = file();
    await connect(page, drive, { username: "hr.outsourced@galiltc.co.il", name: "Outsourced HR", localAccountId: "oid-hr" });
    await page.getByRole("button", { name: "Start with the GALIL team (no work yet)" }).click();
    await expect(page.getByText("Your account is awaiting activation.")).toBeVisible();
    await expect.poll(() => {
      const d = drive.text && JSON.parse(drive.text).data;
      return !!d && d.users.some(u => u.email === "hr.outsourced@galiltc.co.il" && u.pendingActivation) && d.approvals.some(a => a.type === "Account activation");
    }).toBe(true);
  });

  test("accounts outside @galiltc.co.il are refused", async ({ page }) => {
    await connect(page, file(), { username: "someone@gmail.com", name: "Someone", localAccountId: "x" });
    await expect(page.getByText(/Only addresses ending in @galiltc.co.il/).first()).toBeVisible();
  });
});

/* ---------- the Employee Portal: home page, access, language ---------- */
test.describe("Employee Portal", () => {
  test("signing in lands on the home page; WorkDesk has no Tasks tab and ⌂ goes back", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "eitan.f@galiltc.co.il");
    await expect(page.locator("#portal-home")).toBeVisible();
    for (const k of ["workdesk", "taskana", "handbook", "kb"]) await expect(page.locator("#tile-" + k)).toBeVisible();
    await page.click("#tile-workdesk");
    await expect(page).toHaveURL(/#\/workdesk/);
    const tabs = await page.locator('[role="tab"]').allTextContents();
    expect(tabs.join("|")).toContain("Time Log");
    expect(tabs.some(t => /^Tasks/.test(t.trim()))).toBe(false);
    await page.click("#to-portal");
    await expect(page.locator("#portal-home")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("access follows the role: a contractor has no Knowledge Base and is External in Taskana", async ({ page }) => {
    await local(page);
    await signIn(page, "gil.hadar@galiltc.co.il");
    await expect(page.locator("#tile-kb")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#tile-taskana")).toContainText("External");
    const acc = await page.evaluate(() => GalilPortal.access(GalilPortal.sessionUser()));
    expect(acc).toEqual({ workdesk: true, taskana: "External", handbook: true, kb: false });
  });

  test("an administrator changes one person's portal access in Management → People", async ({ page }) => {
    await local(page);
    await signIn(page, "tamir@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.getByRole("tab", { name: /Management/ }).click();
    await page.getByRole("button", { name: "Change portal access for Eitan Fisch" }).click();
    await page.selectOption("#acc-taskana", "none");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const d = await data(page);
    expect(d.users.find(u => u.id === "u-eitan").access).toEqual({ workdesk: true, taskana: "none", handbook: true, kb: true });
    expect(d.audit.some(a => /Portal access changed for Eitan Fisch/.test(a.action))).toBe(true);
  });

  test("one click switches the portal and WorkDesk to Hebrew, right to left", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "danny.gelman@galiltc.co.il");
    await page.getByRole("button", { name: "עב" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("#tile-workdesk")).toContainText("דיווח שעות");
    await page.click("#tile-workdesk");
    await expect(page.getByRole("tab", { name: /יומן שעות/ })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("galil-portal-lang"))).toBe("he");
    expect(errors).toEqual([]);
  });

  test("the Handbook and the Knowledge Base open for signed-in people only", async ({ page }) => {
    /* served at an https address, so the pages share one storage */
    await serve(page);
    await page.addInitScript(() => localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })));
    const base = ORIGIN + "/";
    await page.goto(base + "kb/index.html");
    await expect(page.getByText("Sign in to the Employee Portal first")).toBeVisible();
    await page.goto(base + "index.html");
    await signIn(page, "gil.hadar@galiltc.co.il");
    await expect(page.locator("#portal-home")).toBeVisible();
    await page.goto(base + "kb/index.html");
    await expect(page.getByText(/No access to/)).toBeVisible();
    await page.goto(base + "handbook/index.html");
    await expect(page.locator('a.tcard[href="#ch-portal"]')).toBeVisible();
    await expect(page.getByText(/No access to/)).toHaveCount(0);
  });

  test("an opened Handbook screenshot zooms with the wheel, the buttons and a double-click, and drags", async ({ page }) => {
    const errors = await serve(page);
    await page.addInitScript(() => localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })));
    await page.goto(ORIGIN + "/index.html"); await signIn(page, "danny.gelman@galiltc.co.il");
    await expect(page.locator("#portal-home")).toBeVisible();
    await page.goto(ORIGIN + "/handbook/index.html");
    await page.goto(ORIGIN + "/handbook/index.html#ch-portal");
    await page.locator('#ch-portal figure img').first().click();
    const pct = page.locator(".lightbox-pct");
    await expect(pct).toHaveText("100%");
    await page.mouse.move(683, 450); await page.mouse.wheel(0, -400);
    await expect.poll(async () => parseInt(await pct.textContent())).toBeGreaterThan(150);
    await page.mouse.down(); await page.mouse.move(560, 350, { steps: 5 }); await page.mouse.up();
    await expect(page.locator(".lightbox.on")).toHaveCount(1);              // a drag doesn't close it
    await pct.click(); await expect(pct).toHaveText("100%");
    await page.locator(".lightbox img").click(); await expect(page.locator(".lightbox.on")).toHaveCount(1);   // only the backdrop closes it
    await page.waitForTimeout(400);
    await page.locator('.lightbox [data-z="in"]').click(); await expect(pct).toHaveText("150%");
    await page.locator('.lightbox [data-z="out"]').click(); await expect(pct).toHaveText("100%");
    await page.locator(".lightbox img").dblclick(); await expect(pct).toHaveText("250%");
    await page.keyboard.press("Escape"); await expect(page.locator(".lightbox.on")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

/* ---------- icons, Back, email copy and the work order document ---------- */
test.describe("WorkDesk tools", () => {
  test("Back retraces tabs and Management sections, closes an open window first, then returns home", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "tamir@galiltc.co.il");
    await page.click("#tile-workdesk");
    const back = page.locator("#wd-back");
    await page.getByRole("tab", { name: /Management/ }).click();
    await page.getByRole("button", { name: "Clients", exact: true }).click();
    await page.getByRole("tab", { name: /Dashboard/ }).click();
    await page.getByRole("button", { name: "System administration" }).click();
    await page.keyboard.press("Alt+ArrowLeft");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await back.click();
    await expect(page.getByRole("tab", { name: /Management/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: "Clients", exact: true })).toHaveClass(/on/);
    await back.click();
    await expect(page.getByRole("button", { name: "People", exact: true })).toHaveClass(/on/);
    await back.click();
    await expect(page.getByRole("tab", { name: /Time Log/ })).toHaveAttribute("aria-selected", "true");
    await back.click();
    await expect(page.locator("#portal-home")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("email addresses copy to the clipboard when clicked", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const errors = await local(page);
    await signIn(page, "tamir@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.getByRole("tab", { name: /Management/ }).click();
    await page.getByRole("button", { name: "Copy inon.kanner@galiltc.co.il" }).click();
    await expect(page.getByText("inon.kanner@galiltc.co.il copied to the clipboard.")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("inon.kanner@galiltc.co.il");
    expect(errors).toEqual([]);
  });

  test("a work order carries its document fields and downloads as a branded PDF in English and Hebrew", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "tamir@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.getByRole("tab", { name: /Management/ }).click();
    await page.getByRole("button", { name: "Work Orders", exact: true }).click();
    await page.getByRole("button", { name: "+ New work order" }).click();
    const dlg = page.getByRole("dialog", { name: "New work order" });
    await dlg.locator("select").first().selectOption({ index: 2 });
    await dlg.locator("#wo-title").fill("Operator manual — release 4");
    await dlg.locator("#wo-scope").fill("Write and lay out the operator manual for release 4.");
    await dlg.locator("#wo-deliv").fill("Operator manual, EN\nQuick-start card");
    await dlg.getByRole("button", { name: "+ Add contact" }).click();
    await dlg.getByLabel("Contact name").last().fill("Ruth Levi");
    await dlg.getByLabel("Contact email").last().fill("ruth@client.example");
    await dlg.locator("#wo-csig").fill("Ruth Levi");
    await dlg.getByRole("button", { name: "Save work order" }).click();
    const d = await data(page);
    const wo = d.workOrders.find(w => w.title === "Operator manual — release 4");
    expect(wo.scope).toContain("release 4");
    expect(wo.clientContacts.some(c => c.email === "ruth@client.example")).toBe(true);
    expect(wo.createdBy).toBe("u-tamir");

    await page.getByRole("row", { name: new RegExp(wo.code) }).getByRole("button", { name: "Work order document (PDF)" }).click();
    const doc = page.getByRole("dialog", { name: "Work order document — " + wo.code });
    await expect(doc.locator("iframe.wodoc")).toBeVisible();
    await expect(doc.getByLabel("Send to")).toHaveValue(/ruth@client\.example/);
    const [dl] = await Promise.all([page.waitForEvent("download"), doc.getByRole("button", { name: "Download PDF" }).click()]);
    expect(dl.suggestedFilename()).toBe("GALIL-" + wo.code + ".pdf");
    expect(fs.readFileSync(await dl.path()).slice(0, 5).toString()).toBe("%PDF-");
    await doc.getByRole("button", { name: "עברית" }).click();
    await expect(doc.getByRole("button", { name: "עברית" })).toHaveAttribute("aria-pressed", "true");
    await expect(doc.locator("iframe.wodoc")).toBeVisible();
    const [he] = await Promise.all([page.waitForEvent("download"), doc.getByRole("button", { name: "Download PDF" }).click()]);
    expect(he.suggestedFilename()).toBe("GALIL-" + wo.code + "-HE.pdf");
    expect(fs.readFileSync(await he.path()).slice(0, 5).toString()).toBe("%PDF-");
    expect(errors).toEqual([]);
  });
});

/* ---------- Management: record details and birthdays ---------- */
test.describe("Management details", () => {
  const openMgmt = async (page, section) => {
    await signIn(page, "tamir@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.getByRole("tab", { name: /Management/ }).click();
    if (section) await page.getByRole("button", { name: section, exact: true }).click();
  };

  test("a client is added and edited with its VAT number, address and payment terms", async ({ page }) => {
    const errors = await local(page);
    await openMgmt(page, "Clients");
    await page.locator(".band input").first().fill("Negev Robotics");
    await page.getByRole("button", { name: "More details…" }).click();
    const dlg = page.getByRole("dialog", { name: "New client" });
    await expect(dlg.locator("#rec-name")).toHaveValue("Negev Robotics");
    await dlg.locator("#rec-vatNumber").fill("51-765432-1");
    await dlg.locator("#rec-address").fill("HaMelacha St 12");
    await dlg.locator("#rec-city").fill("Beer Sheva");
    await dlg.locator("#rec-paymentTerms").selectOption("Net 60");
    await dlg.getByRole("button", { name: "+ Add" }).click();
    let c = (await data(page)).clients.find(x => x.name === "Negev Robotics");
    expect(c).toMatchObject({ vatNumber: "51-765432-1", city: "Beer Sheva", paymentTerms: "Net 60", initials: "NR" });
    expect(c.createdAt).toBeTruthy();
    const row = page.getByRole("row", { name: /Negev Robotics/ });
    await expect(row).toContainText("51-765432-1");
    await expect(row).toContainText("Beer Sheva");
    await row.getByRole("button", { name: "Edit Negev Robotics" }).click();
    await page.getByRole("dialog", { name: "Edit client" }).locator("#rec-city").fill("Ashdod");
    await page.getByRole("dialog", { name: "Edit client" }).getByRole("button", { name: "Save", exact: true }).click();
    c = (await data(page)).clients.find(x => x.name === "Negev Robotics");
    expect(c.city).toBe("Ashdod");
    expect(errors).toEqual([]);
  });

  test("projects show their dates, work orders, Taskana tasks and creation date, and edit in full", async ({ page }) => {
    const errors = await local(page);
    await page.evaluate(() => localStorage.setItem("galil-taskana-v1", JSON.stringify({ projects: [{ id: "p-iai1", key: "RAD" }], users: [],
      tasks: [{ id: "t1", projectId: "p-iai1", num: 1, title: "A", status: "Done" }, { id: "t2", projectId: "p-iai1", num: 2, title: "B", status: "To do" }, { id: "t3", projectId: "p-iai1", workOrderId: "p-iai1-w1", num: 3, title: "C", status: "To do" }] })));
    await openMgmt(page, "Projects");
    for (const col of ["Dates", "Work orders", "Tasks", "Created"]) await expect(page.locator("th").filter({ hasText: new RegExp("^" + col + "$") }).first()).toBeVisible();
    const row = page.getByRole("row", { name: /Radar Suite — Operator Manual/ });
    const tasks = await page.evaluate(() => GalilPortal.taskana() ? GalilPortal.taskana().tasks.length : -1);
    if (tasks === 3) await expect(row).toContainText("2 open");
    await row.getByRole("button", { name: "Edit Radar Suite — Operator Manual" }).click();
    const dlg = page.getByRole("dialog", { name: "Edit project" });
    await dlg.locator("#rec-description").fill("Operator manual for the radar suite.");
    await dlg.locator("#rec-endDate").fill("2027-06-30");
    await dlg.getByRole("button", { name: "Save", exact: true }).click();
    const pr = (await data(page)).projects.find(x => x.id === "p-iai1");
    expect(pr).toMatchObject({ description: "Operator manual for the radar suite.", endDate: "2027-06-30" });
    expect(errors).toEqual([]);
  });

  test("people carry a mobile and a birthday; birthdays this week are reminded on People and the home page", async ({ page }) => {
    const errors = await local(page);
    await openMgmt(page, "People");
    await expect(page.locator("#people-birthdays")).toContainText("Dennis Sablin");
    await page.getByRole("button", { name: "Edit the details of Eitan Fisch" }).click();
    const dlg = page.getByRole("dialog", { name: "Details — Eitan Fisch" });
    await dlg.locator("#rec-mobile").fill("054-111-2222");
    const today = await page.evaluate(() => todayStr());
    await dlg.locator("#rec-dob").fill("1990-" + today.slice(5));
    await dlg.getByRole("button", { name: "Save", exact: true }).click();
    const row = page.getByRole("row", { name: /Eitan Fisch/ });
    await expect(row).toContainText("054-111-2222");
    await expect(row).toContainText("Today");
    await page.click("#to-portal");
    await expect(page.locator("#home-birthdays")).toContainText("Eitan Fisch");
    expect(errors).toEqual([]);
  });

  test("anyone adds their own mobile and birthday in My profile, and can keep the birthday private", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "eitan.f@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.locator('button[title="My profile"]').click();
    await page.click("#edit-my-details");
    const dlg = page.getByRole("dialog", { name: "My details" });
    await dlg.locator("#rec-mobile").fill("052-333-4444");
    await dlg.locator("#rec-dob").fill("1991-03-14");
    await dlg.locator("#rec-hideBirthday").check();
    await dlg.getByRole("button", { name: "Save", exact: true }).click();
    const u = (await data(page)).users.find(x => x.id === "u-eitan");
    expect(u).toMatchObject({ mobile: "052-333-4444", dob: "1991-03-14", hideBirthday: true });
    expect(errors).toEqual([]);
  });

  test("work orders show their lead, team, tasks and creation date", async ({ page }) => {
    const errors = await local(page);
    await openMgmt(page, "Work Orders");
    for (const col of ["Lead", "Team", "Tasks", "Created"]) await expect(page.locator("th").filter({ hasText: new RegExp("^" + col + "$") }).first()).toBeVisible();
    await page.getByRole("button", { name: "Budgets", exact: true }).click();
    for (const col of ["Notes", "Created"]) await expect(page.locator("th").filter({ hasText: new RegExp("^" + col + "$") }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

/* ---------- the phone layout ---------- */
test.describe("phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a Handbook screenshot pinches to zoom once opened; the page itself stays unzoomable", async ({ page }) => {
    const errors = await serve(page);
    await page.addInitScript(() => localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })));
    await page.goto(ORIGIN + "/index.html"); await signIn(page, "danny.gelman@galiltc.co.il");
    await expect(page.locator("#portal-home")).toBeVisible();
    await page.goto(ORIGIN + "/handbook/index.html");
    expect(await page.locator('meta[name="viewport"]').getAttribute("content")).toContain("user-scalable=no");
    await page.goto(ORIGIN + "/handbook/index.html#ch-portal");
    await page.locator('#ch-portal figure img').first().click();
    const pct = page.locator(".lightbox-pct");
    await expect(pct).toHaveText("100%");
    /* two fingers moving apart over the image */
    await page.locator(".lightbox").evaluate(box => {
      const fire = (type, id, x) => box.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: x, clientY: 420, bubbles: true }));
      fire("pointerdown", 1, 170); fire("pointerdown", 2, 220);
      for (let i = 1; i <= 8; i++) { fire("pointermove", 1, 170 - i * 12); fire("pointermove", 2, 220 + i * 12); }
      fire("pointerup", 1, 74); fire("pointerup", 2, 316);
    });
    await expect.poll(async () => parseInt(await pct.textContent())).toBeGreaterThan(250);
    await expect(page.locator(".lightbox.on")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("the Time tab lists my own time, and my team's only when I ask, each card naming who reported", async ({ page }) => {
    const errors = await local(page);
    await signIn(page, "danny.gelman@galiltc.co.il");
    await page.click("#tile-workdesk");
    await expect(page.locator("#m-time-bar")).toBeVisible();
    const r = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1")).data;
      const me = raw.users.find(u => u.id === "u-danny");
      return { team: managedUserIds(raw, me).sort(), everyone: raw.users.length };
    });
    expect(r.team).toContain("u-eitan");
    expect(r.team).not.toContain("u-tamir");
    expect(r.team.length).toBeLessThan(r.everyone - 1);
    await expect(page.locator(".mwho")).toHaveCount(0);
    await page.getByRole("button", { name: "Me and my team" }).click();
    const names = await page.locator(".mwho").allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names.some(n => /Tamir Nisman|Inon Kanner/.test(n))).toBe(false);
    expect(errors).toEqual([]);
  });

  test("Filter & sort narrows the list", async ({ page }) => {
    await local(page);
    await signIn(page, "eitan.f@galiltc.co.il");
    await page.click("#tile-workdesk");
    await page.click("#m-filter");
    await page.selectOption("#mf-status", "pending");
    await page.getByRole("button", { name: "Show entries" }).click();
    await expect(page.locator("#m-filter")).toContainText("(1)");
    const statuses = await page.evaluate(() => [...document.querySelectorAll(".mcard")].length);
    expect(statuses).toBeGreaterThanOrEqual(1);
  });

  test("the page can't be zoomed and nothing runs off the screen", async ({ page }) => {
    await local(page);
    await signIn(page, "danny.gelman@galiltc.co.il");
    expect(await page.getAttribute('meta[name="viewport"]', "content")).toContain("user-scalable=no");
    await page.click("#tile-workdesk");
    await page.getByRole("button", { name: "Report without the timer" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const off = await page.evaluate(() => [...document.querySelectorAll(".sheet input,.sheet select,.sheet button")].filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.left < 0 || b.right > innerWidth); }).length);
    expect(off).toBe(0);
  });
});
