// WorkDesk: the GALIL team, demo data, and the GitHub / Microsoft 365 data files (APIs mocked).
const { test, expect } = require("@playwright/test");
const fs = require("fs"), path = require("path");

const SITE = path.resolve(__dirname, "../../site/app");
const data = page => page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data);
const local = async page => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })));
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
      if (tok && !sessionStorage.getItem("seen")) { localStorage.setItem("galil-workdesk-github-token", tok); sessionStorage.setItem("seen", "1"); }
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
