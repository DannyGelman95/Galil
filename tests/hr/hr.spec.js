// End-to-end checks for HR in the Employee Portal: news, events, surveys, performance
// reviews, the directory and recognition; who may do what; Hebrew; the GitHub data file.
const { test, expect } = require("@playwright/test");
const path = require("path");
const PORTAL_DIR = path.resolve(__dirname, "../../Employee Portal");
const ORIGIN = "https://portal.test";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Expose-Headers": "*" };
const json = (r, status, body) => r.fulfill({ status, headers: Object.assign({ "Content-Type": "application/json" }, cors), body: JSON.stringify(body) });

/* signed in to the Employee Portal (as Danny unless a test says otherwise): the portal home seeds
   WorkDesk's team, which HR reads. The portal is served at an https address so pages share storage. */
const serve = async (page, cfg) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(ORIGIN + "/**", r => {
    const p = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, "") || "index.html";
    r.fulfill({ path: path.join(PORTAL_DIR, p) });
  });
  await page.addInitScript(c => {
    localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
    if (c) localStorage.setItem("galil-hr-config", JSON.stringify(c));
  }, cfg || null);
  return errors;
};
const signIn = async (page, id) => {
  await page.evaluate(i => localStorage.setItem("galil-workdesk-session", i), id);
};
const open = async (page, route = "", userId = "u-danny", cfg) => {
  const errors = await serve(page, cfg);
  await page.goto(ORIGIN + "/index.html");
  await page.evaluate(() => localStorage.setItem("galil-workdesk-session", "u-danny"));
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#portal-home")).toBeVisible();
  await signIn(page, userId);
  await page.goto(ORIGIN + "/hr/index.html#/" + route);
  await expect(page.locator("#tabs .tab").first()).toBeVisible();
  return errors;
};
const as = async (page, userId, route = "") => {
  await signIn(page, userId);
  await page.goto(ORIGIN + "/hr/index.html#/" + route);
  await page.reload();
  await expect(page.locator("#tabs .tab").first()).toBeVisible();
};
const go = (page, r) => page.evaluate(x => { location.hash = "#/" + x; }, r);
const hr = page => page.evaluate(() => JSON.parse(localStorage.getItem("galil-hr-v1")));
const live = list => list.filter(r => !r.deleted);

test("every page renders without errors, with the demo content", async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator("h1")).toContainText("Danny");
  const routes = ["news", "news/demo-news-welcome", "events", "events/calendar", "events/demo-ev-word", "surveys", "surveys/demo-sv-engagement",
    "surveys/demo-sv-hybrid/results", "reviews", "reviews/demo-rv-u-eitan", "people", "kudos"];
  for (const r of routes) {
    await go(page, r);
    await expect(page.locator("#main h1").first()).toBeVisible();
  }
  const d = await hr(page);
  expect(d.app).toBe("galil-hr");
  expect(live(d.news).length).toBe(4);
  expect(live(d.surveys).length).toBe(3);
  expect(live(d.reviews).length).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test("the portal home has an HR tile; contractors have no HR", async ({ page }) => {
  await serve(page);
  await page.goto(ORIGIN + "/index.html");
  await page.evaluate(() => localStorage.setItem("galil-workdesk-session", "u-eitan"));
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#tile-hr")).toContainText("HR");
  await page.click("#tile-hr");
  await expect(page).toHaveURL(/\/hr\/index\.html$/);
  await expect(page.locator("#tab-surveys")).toBeVisible();
  expect(await page.evaluate(() => GalilPortal.access(GalilPortal.sessionUser()).hr)).toBe("Member");

  await page.evaluate(() => localStorage.setItem("galil-workdesk-session", "u-gil"));
  await page.goto(ORIGIN + "/index.html");
  await expect(page.locator("#tile-hr")).toHaveAttribute("aria-disabled", "true");
  await page.goto(ORIGIN + "/hr/index.html");
  await expect(page.getByText("No access to HR")).toBeVisible();

  /* the CEO, Operations and the office are HR admins */
  const roles = await page.evaluate(() => ["u-tamir", "u-inon", "u-office", "u-danny"].map(id => GalilPortal.access(GalilPortal.workdesk().users.find(u => u.id === id)).hr));
  expect(roles).toEqual(["Admin", "Admin", "Admin", "Member"]);
});

test("an administrator changes a person's HR role in Management → People", async ({ page }) => {
  await serve(page);
  await page.goto(ORIGIN + "/index.html");
  await page.evaluate(() => localStorage.setItem("galil-workdesk-session", "u-tamir"));
  await page.goto(ORIGIN + "/index.html");
  await page.click("#tile-workdesk");
  await page.getByRole("tab", { name: /Management/ }).click();
  await page.getByRole("button", { name: "Change portal access for Eitan Fisch" }).click();
  await page.selectOption("#acc-hr", "Admin");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const acc = await page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data.users.find(u => u.id === "u-eitan").access);
  expect(acc.hr).toBe("Admin");
});

test("news: an HR admin publishes; people like and comment; members can't post", async ({ page }) => {
  await open(page, "news", "u-office");
  await page.click("#news-new");
  await page.fill("#news-title", "Office closed on Friday");
  await page.fill("#news-body", "The office is closed this Friday.\n\nHave a good weekend.");
  await page.click("#news-save");
  await expect(page.locator("article h1")).toHaveText("Office closed on Friday");
  await expect(page.locator("article .body p")).toHaveCount(2);
  const id = page.url().split("/").pop();

  await as(page, "u-eitan", "news/" + id);
  await expect(page.locator("#news-edit")).toHaveCount(0);
  await page.click("#news-like");
  await expect(page.locator("#news-like")).toHaveAttribute("aria-pressed", "true");
  await page.fill("#comment-text", "Thanks for the heads-up");
  await page.click("#comment-post");
  await expect(page.locator("#comments")).toContainText("Thanks for the heads-up");
  await go(page, "news");
  await expect(page.locator("#news-new")).toHaveCount(0);
  const d = await hr(page);
  expect(live(d.reactions).some(r => r.newsId === id && r.userId === "u-eitan")).toBe(true);
  expect(live(d.comments).some(c => c.newsId === id && c.userId === "u-eitan")).toBe(true);
});

test("events: RSVP, the calendar, a calendar file, and a new event", async ({ page }) => {
  await open(page, "events/demo-ev-word", "u-eitan");
  await page.click("#rsvp-going");
  await expect(page.locator("#attendees")).toContainText("Eitan Fisch");
  const dl = page.waitForEvent("download");
  await page.click("#event-ics");
  const file = await dl;
  const text = require("fs").readFileSync(await file.path(), "utf8");
  expect(text).toContain("BEGIN:VEVENT");
  expect(text).toMatch(/DTSTART:\d{8}T100000/);
  await page.click("#rsvp-no");
  await expect(page.locator("#rsvp-no")).toHaveAttribute("aria-pressed", "true");
  const d = await hr(page);
  expect(d.rsvps.find(r => r.id === "demo-ev-word:u-eitan").status).toBe("no");

  await go(page, "events/calendar");
  await expect(page.locator(".cal-ev").first()).toBeVisible();

  await as(page, "u-tamir", "events");
  await page.click("#event-new");
  await page.fill("#ev-title", "Board games night");
  await page.fill("#ev-cap", "1");
  await page.click("#ev-save");
  await expect(page.locator("article h1")).toHaveText("Board games night");
  await page.click("#rsvp-going");
  /* one place, taken: the next person can't say they're going */
  await as(page, "u-eitan", page.url().split("#/")[1]);
  await expect(page.locator("#rsvp-going")).toBeDisabled();
});

test("an anonymous survey: answered once, without a name; results stay with HR", async ({ page }) => {
  await open(page, "", "u-eitan");
  await expect(page.locator("#tab-surveys .badge")).toHaveText("2");
  await go(page, "surveys/demo-sv-engagement");
  await page.click("#survey-submit");
  await expect(page.locator("#toast")).toContainText("Please answer every question");
  const qs = page.locator("#survey-form .q");
  await qs.nth(0).getByRole("radio", { name: "4" }).click();
  await qs.nth(1).getByRole("radio", { name: "9" }).click();
  await qs.nth(2).getByText("From home").click();
  await qs.nth(3).getByText("Flexible hours").click();
  await qs.nth(4).locator("textarea").fill("More pairing on big manuals.");
  await page.click("#survey-submit");
  await expect(page.locator("#survey-thanks")).toBeVisible();
  await expect(page.locator("#survey-thanks")).not.toContainText("See the results");
  const d = await hr(page);
  const mine = live(d.responses).filter(r => r.surveyId === "demo-sv-engagement" && r.answers.q5 === "More pairing on big manuals.");
  expect(mine.length).toBe(1);
  expect(mine[0].userId).toBeUndefined();
  expect(mine[0].at).toBeUndefined();
  expect(mine[0].answers).toEqual({ q1: 4, q2: 9, q3: 1, q4: [1], q5: "More pairing on big manuals." });
  expect(d.taken.some(t => t.id === "demo-sv-engagement:u-eitan")).toBe(true);
  await expect(page.locator("#tab-surveys .badge")).toHaveText("1");
  await go(page, "surveys/demo-sv-engagement/results");
  await expect(page.getByText("The results of this survey are for HR only.")).toBeVisible();

  await as(page, "u-office", "surveys/demo-sv-engagement/results");
  await expect(page.locator("#main")).toContainText("7 of 22 people answered");
  await expect(page.locator("#main")).toContainText("More pairing on big manuals.");
});

test("an HR admin builds a survey, opens it, and people see the results after answering", async ({ page }) => {
  await open(page, "surveys", "u-office");
  await page.click("#survey-new");
  await page.fill("#sv-title", "Lunch on Thursdays");
  await page.check("#sv-show");
  const q = page.locator(".qedit").first();
  await q.locator(".q-text").fill("Which lunch?");
  await q.locator(".q-type").selectOption("choice");
  await q.locator(".q-opts").fill("Pizza\nSushi\nSalad");
  await page.click("#sv-add");
  await page.locator(".qedit").nth(1).locator(".q-text").fill("How hungry are you?");
  await page.click("#sv-publish");
  await expect(page.locator("#survey-form")).toBeVisible();
  const id = page.url().split("/").pop();

  await as(page, "u-eitan", "surveys/" + id);
  await page.getByText("Sushi").click();
  await page.locator("#survey-form .q").nth(1).getByRole("radio", { name: "5" }).click();
  await page.click("#survey-submit");
  await page.getByRole("link", { name: "See the results" }).click();
  await expect(page.locator(".q-res").first()).toContainText("Sushi");
  await expect(page.locator(".q-res").first()).toContainText("1 · 100%");

  /* once people have answered, the questions are fixed */
  await as(page, "u-office", "surveys/" + id + "/edit");
  await expect(page.locator(".q-text").first()).toBeDisabled();
  await expect(page.locator("#sv-add")).toHaveCount(0);
});

test("a performance review goes from self-assessment to manager review to acknowledgement", async ({ page }) => {
  await open(page, "reviews", "u-eitan");
  await expect(page.locator("#my-reviews")).toContainText("Self-assessment");
  await page.locator("#my-reviews .row-card").first().click();
  /* the manager doesn't see a draft */
  await page.click("#self-submit");
  await expect(page.locator("#toast")).toContainText("Rate every competency first.");
  for (const comp of await page.locator("#self-section .comp").all()) await comp.getByRole("radio", { name: "4" }).click();
  await page.fill("#self-achievements", "Shipped the IPC update.");
  await page.click("#self-save");
  await as(page, "u-danny", "reviews/demo-rv-u-eitan");
  await expect(page.locator("#self-section")).toHaveCount(0);
  await expect(page.locator("#main")).toContainText("is still writing their self-assessment");

  await as(page, "u-eitan", "reviews/demo-rv-u-eitan");
  await expect(page.locator("#self-achievements")).toHaveValue("Shipped the IPC update.");
  await page.click("#self-submit");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".steps li.cur")).toContainText("Manager review");
  await expect(page.locator("#manager-section")).toHaveCount(0);

  await as(page, "u-danny", "reviews");
  await expect(page.locator("#team-reviews")).toContainText("Eitan Fisch");
  await go(page, "reviews/demo-rv-u-eitan");
  await expect(page.locator("#self-section")).toContainText("Shipped the IPC update.");
  for (const comp of await page.locator("#manager-section .comp").all()) await comp.getByRole("radio", { name: "5" }).click();
  await page.fill("#mgr-strengths", "Fast and careful.");
  await page.locator("#manager-section .field").filter({ hasText: "Overall rating" }).getByRole("radio", { name: "5" }).click();
  await page.click("#mgr-share");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator(".steps li.cur")).toContainText("Waiting for acknowledgement");

  await as(page, "u-eitan", "reviews/demo-rv-u-eitan");
  await expect(page.locator("#manager-section")).toContainText("Fast and careful.");
  await page.fill("#ack-text", "Thanks, Danny.");
  await page.click("#ack-submit");
  await expect(page.locator("#ack-section")).toContainText("Thanks, Danny.");
  const r = (await hr(page)).reviews.find(x => x.id === "demo-rv-u-eitan");
  expect(r.status).toBe("done");
  expect(r.mgr.overall).toBe(5);

  /* people outside the review can't open it */
  await as(page, "u-kfir", "reviews/demo-rv-u-eitan");
  await expect(page.getByText("This review isn't yours to see.")).toBeVisible();
});

test("an HR admin starts a review cycle for everyone with a manager", async ({ page }) => {
  await open(page, "reviews", "u-office");
  await page.click("#cycle-new");
  await page.fill("#cy-title", "Mid-year check-in");
  await page.click("#cy-save");
  await expect(page.locator("#main h1")).toHaveText("Mid-year check-in");
  const rows = page.locator("#cycle-table tbody tr");
  expect(await rows.count()).toBeGreaterThan(10);
  await expect(page.locator("#cycle-table")).not.toContainText("Gil Hadar");
  const dl = page.waitForEvent("download");
  await page.click("#cycle-csv");
  expect((await dl).suggestedFilename()).toBe("Mid-year check-in.csv");
});

test("people, celebrations and kudos", async ({ page }) => {
  await open(page, "people", "u-danny");
  await expect(page.locator("#people-grid .pcard")).toHaveCount(22);
  await page.fill("#people-q", "defense");
  await expect(page.locator("#people-grid .pcard")).toHaveCount(4);
  await page.locator("#people-grid .pcard").filter({ hasText: "Daniel Barak" }).getByRole("button", { name: "Say thanks" }).click();
  await expect(page.locator("#kd-to")).toHaveValue("u-daniel");
  await page.fill("#kd-text", "Great review comments on the manual.");
  await page.click("#kd-send");
  await go(page, "kudos");
  await expect(page.locator("#kudos-list")).toContainText("Great review comments on the manual.");
  await as(page, "u-daniel", "kudos");
  await page.getByRole("button", { name: "For me" }).click();
  await expect(page.locator("#kudos-list .kudos")).toHaveCount(1);
});

test("Hebrew: right to left, in the portal's language", async ({ page }) => {
  const errors = await open(page, "", "u-danny");
  await page.evaluate(() => localStorage.setItem("galil-portal-lang", "he"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#tab-surveys")).toContainText("סקרים");
  await expect(page.locator("#main h1")).toContainText("דני");
  for (const r of ["news/demo-news-welcome", "events", "surveys/demo-sv-engagement", "reviews/demo-rv-u-daniel", "people", "kudos"]) {
    await go(page, r);
    await expect(page.locator("#main h1").first()).toBeVisible();
  }
  await go(page, "news/demo-news-welcome");
  await expect(page.locator("article h1")).toHaveText("ברוכים הבאים למשאבי אנוש בפורטל העובדים");
  expect(errors).toEqual([]);
});

test.describe("GitHub storage", () => {
  const CFG = { storage: "github", github: { owner: "o", repo: "r", branch: "hr-data", path: "hr" } };
  const mock = async (page, state) => {
    const b64 = s => Buffer.from(s, "utf8").toString("base64");
    await page.route("https://api.github.com/**", async r => {
      const req = r.request(), url = new URL(req.url()), m = req.method();
      if (m === "OPTIONS") return r.fulfill({ status: 204, headers: cors });
      if (url.pathname === "/repos/o/r") return json(r, 200, { default_branch: "main", permissions: { push: true }, private: true });
      if (url.pathname === "/repos/o/r/branches/hr-data") return json(r, 200, { name: "hr-data" });
      if (url.pathname === "/repos/o/r/contents/hr/hr-data.json") {
        if (m === "GET") return state.text ? json(r, 200, { sha: state.sha, encoding: "base64", content: b64(state.text), size: state.text.length }) : json(r, 404, { message: "Not Found" });
        if (m === "PUT") {
          const body = JSON.parse(req.postData());
          state.puts.push(body);
          if (state.conflictOnce) { state.conflictOnce = false; return json(r, 409, { message: "sha mismatch" }); }
          if ((body.sha || null) !== (state.sha || null)) return json(r, 409, { message: "sha mismatch" });
          state.text = Buffer.from(body.content, "base64").toString("utf8"); state.sha = "sha" + state.puts.length;
          return json(r, 200, { content: { sha: state.sha, size: state.text.length } });
        }
      }
      return json(r, 404, { message: "Not Found" });
    });
  };

  test("starts the data file on its branch and saves changes there", async ({ page }) => {
    const state = { text: null, sha: null, puts: [] };
    await mock(page, state);
    await serve(page, CFG);
    await page.goto(ORIGIN + "/index.html");
    await page.evaluate(() => { localStorage.setItem("galil-workdesk-session", "u-eitan"); localStorage.setItem("galil-portal-github-token", "github_pat_test"); });
    await page.goto(ORIGIN + "/index.html");
    await expect(page.locator("#portal-home")).toBeVisible();
    await page.goto(ORIGIN + "/hr/index.html#/kudos");
    await expect(page.locator("#sync")).toContainText("GitHub");
    await expect.poll(() => state.puts.length).toBeGreaterThan(0);
    expect(JSON.parse(state.text).app).toBe("galil-hr");
    expect(state.puts[0].branch).toBe("hr-data");

    /* someone else saved in between: their kudos and mine both survive */
    const other = JSON.parse(state.text);
    other.kudos.push({ id: "kd-other", from: "u-tamir", to: "u-danny", value: "quality", text: "From another device", at: new Date().toISOString(), updatedAt: new Date().toISOString() });
    state.text = JSON.stringify(other); state.sha = "sha-other";
    await page.click("#kudos-new");
    await page.selectOption("#kd-to", "u-daniel");
    await page.fill("#kd-text", "Saved through GitHub");
    await page.click("#kd-send");
    await expect.poll(() => (state.text || "").includes("Saved through GitHub")).toBe(true);
    const saved = JSON.parse(state.text);
    expect(saved.kudos.some(k => k.id === "kd-other")).toBe(true);
    await expect(page.locator("#kudos-list")).toContainText("From another device");
  });

  test("asks for a GitHub token when this device has none", async ({ page }) => {
    await mock(page, { text: null, sha: null, puts: [] });
    await open(page, "", "u-eitan", CFG);
    await expect(page.locator("#gh-token")).toBeVisible();
  });
});
