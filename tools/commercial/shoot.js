// Films the short clips of the Employee Portal that the commercial is cut from: each shot drives the
// real app (demo data) with an on-screen cursor and is saved as a 30 fps JPEG sequence.
//
//   node tools/commercial/shoot.js [shot,shot…]
// Output: tools/commercial/build/shots/<shot>/00000.jpg … and info.json
// The pages are served over HTTP (Model Studio needs it). Needs Playwright (preinstalled) and ffmpeg.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "../../Employee Portal");
const OUT = path.join(__dirname, "build/shots");
const PORT = 4195, BASE = "http://localhost:" + PORT + "/";
const FPS = 30;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".wasm": "application/wasm",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

/* Defense News' feed is built on deployment: the clip reads a few neutral sample headlines */
const hour = 36e5, now = Date.now();
const FEED = {
  updated: new Date(now - 1.2 * hour).toISOString(), days: 30, source: "Google News",
  companies: [
    { id: "iai", name: "IAI", full: "Israel Aerospace Industries", he: "התעשייה האווירית", color: "#1D4ED8" },
    { id: "elbit", name: "Elbit Systems", full: "Elbit Systems", he: "אלביט מערכות", color: "#0F766E" },
    { id: "rafael", name: "Rafael", full: "Rafael Advanced Defense Systems", he: "רפאל", color: "#B91C1C" },
    { id: "controp", name: "Controp", full: "Controp Precision Technologies", he: "קונטרופ", color: "#C2410C" },
    { id: "mod", name: "Israel MOD", full: "Israel Ministry of Defense", he: "משרד הביטחון", color: "#475569" }],
  items: [
    ["Sample headline — IAI", 1, ["iai"]], ["Sample headline — Elbit Systems", 3, ["elbit"]],
    ["Sample headline — Rafael and the Israel MOD", 6, ["rafael", "mod"]], ["Sample headline — Controp", 12, ["controp"]],
    ["Sample headline — IAI and Elbit Systems", 20, ["iai", "elbit"]], ["Sample headline — Israel MOD", 30, ["mod"]],
    ["Sample headline — Rafael", 44, ["rafael"]], ["Sample headline — Elbit Systems", 60, ["elbit"]]
  ].map((x, i) => ({ id: "s" + i, title: x[0], url: "https://example.com/" + i, source: "Sample source", date: new Date(now - x[1] * hour).toISOString(), lang: "en", companies: x[2] }))
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

/* the cursor drawn into the page */
function overlay() {
  if (window.__cc) return;
  const phone = innerWidth < 600;
  const root = document.createElement("div");
  root.id = "cc";
  root.innerHTML = "<style>#cc{position:fixed;inset:0;pointer-events:none;z-index:2147483647}" +
    "#cc .cur{position:fixed;left:0;top:0;width:" + (phone ? 40 : 30) + "px;height:" + (phone ? 40 : 30) + "px;transition:transform .55s cubic-bezier(.65,0,.25,1);filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))}" +
    "#cc .cur.fast{transition-duration:.05s}#cc .cur.slow{transition-duration:.9s}" +
    "#cc .ring{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #F08A24;animation:ccr .6s ease-out forwards}" +
    "@keyframes ccr{from{transform:scale(.3);opacity:1}to{transform:scale(1.7);opacity:0}}" +
    "#cc .ghost{position:fixed;left:0;top:0;opacity:.92;box-shadow:0 18px 40px rgba(0,0,0,.3);transition:transform .9s cubic-bezier(.65,0,.25,1);background:#fff;border-radius:10px}</style>" +
    (phone ? '<svg class="cur" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.6)" stroke="#14284A" stroke-width="1.4"/><circle cx="12" cy="12" r="4" fill="rgba(240,138,36,.95)"/></svg>'
      : '<svg class="cur" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.5 L14.4 20.3 L11.4 13.7 L17.6 13.7 Z" fill="#fff" stroke="#14284A" stroke-width="1.6" stroke-linejoin="round"/></svg>');
  document.documentElement.appendChild(root);
  const cur = root.querySelector(".cur");
  let cx = innerWidth * 0.7, cy = innerHeight * 0.75;
  const put = () => { cur.style.transform = phone ? "translate(" + (cx - 20) + "px," + (cy - 20) + "px)" : "translate(" + (cx - 5) + "px," + (cy - 2) + "px)"; };
  put();
  window.__cc = {
    move(x, y, s) { cur.classList.remove("fast", "slow"); if (s) cur.classList.add(s); cx = x; cy = y; put(); },
    ring() { const r = document.createElement("div"); r.className = "ring"; r.style.left = cx + "px"; r.style.top = cy + "px"; root.appendChild(r); setTimeout(() => r.remove(), 700); },
    ghost(el, x1, y1) {
      const r = el.getBoundingClientRect(), g = el.cloneNode(true); g.classList.add("ghost"); g.style.width = r.width + "px";
      g.style.transform = "translate(" + r.left + "px," + r.top + "px)"; root.appendChild(g);
      requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = "translate(" + (x1 - r.width / 2) + "px," + (y1 - 14) + "px) rotate(-3deg)"; }));
      setTimeout(() => g.remove(), 1100);
    },
    hide(h) { cur.style.opacity = h ? "0" : "1"; }
  };
  /* keeps the screencast delivering frames while nothing moves */
  const d = document.createElement("div"); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;pointer-events:none"; root.appendChild(d);
  let k = 0; setInterval(() => { d.style.background = (k++ % 2) ? "#000" : "#fff"; }, 33);
}

function day(n) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() + n); const p = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

/* ---------------- the shots ---------------- */
const DESK = { width: 1600, height: 900 }, PHONE = { width: 390, height: 844 };
const SHOTS = {
  "home": { user: "u-danny", url: "index.html", cursor: false, run: async T => { await T.wait(4200); } },
  "home-tiles": { user: "u-danny", url: "index.html", run: async T => {
    const tiles = ["workdesk", "taskana", "handbook", "kb", "studio", "hr"];
    for (const k of tiles) { await T.point(T.page.locator("#tile-" + k), "fast2"); await T.wait(180); }
    await T.wait(400);
  } },
  "theme": { user: "u-danny", url: "index.html", run: async T => {
    const b = T.page.locator(".hubtop").getByLabel(/Switch to the dark theme/);
    await T.point(b); await T.wait(300); await T.click(b, 1600);
  } },
  "hebrew": { user: "u-danny", url: "index.html", run: async T => {
    const b = T.page.locator(".hubtop").getByRole("button", { name: "עב" });
    await T.point(b); await T.wait(300); await T.click(b, 2000);
  } },
  "timelog": { user: "u-danny", url: "index.html#/workdesk/time", run: async T => {
    const form = T.page.locator(".tlform"), f = l => T.field(l, form);
    await T.wait(300);
    await T.select(form.getByLabel("Start hour"), "09");
    await T.select(form.getByLabel("End hour"), "13");
    await T.select(f("Client"), "Elbit Systems");
    await T.click(form.getByRole("button", { name: "Office", exact: true }), 150);
    await T.select(f("Project"), "Avionics Help System");
    await T.select(f("Work order"), (await f("Work order").locator("option").allTextContents())[1]);
    await T.type(f("Description"), "Help topics review");
    await T.click(form.getByRole("button", { name: "Add entry" }), 1500);
  } },
  "timer": { user: "u-danny", url: "index.html#/workdesk/time", run: async T => {
    const b = T.page.getByRole("button", { name: /Start the timer/ }).first();
    await T.point(b); await T.click(b, 2500);
  } },
  "planner": { user: "u-danny", url: "index.html#/workdesk/planner", setup: async page => {
    await page.evaluate(([d0, d1, d2, d3, d4]) => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      raw.data.planned = raw.data.planned.filter(x => x.userId !== "u-danny");
      const b = (id, date, s, e, y, r, c, p, d) => ({ id, userId: "u-danny", date, start: s, end: e, red: r, yellow: y, blue: 0, clientId: c, projectId: p, workOrderId: null, taskId: null, task: "", description: d });
      raw.data.planned.push(
        b("pl-c1", d0, "09:00", "15:00", 6, 0, "c-iai", "p-iai1", "Chapter 5 — first draft"),
        b("pl-c2", d1, "09:00", "11:00", 0, 2, "c-gal", "p-int1", "Team meeting"),
        b("pl-c3", d1, "11:00", "17:00", 6, 0, "c-iai", "p-iai1", "SME review"),
        b("pl-c4", d2, "09:00", "13:00", 4, 0, "c-iai", "p-iai1", "Screenshots and figures"),
        b("pl-c5", d4, "09:00", "18:00", 9, 0, "c-iai", "p-iai1", "Release build"));
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    }, [day(0), day(1), day(2), day(3), day(4)]);
  }, run: async T => {
    const d = n => T.page.locator(".week .day").nth(n);
    await T.wait(300);
    await T.drag(d(2).locator(".pcard").first(), d(3));
    await T.wait(900);
  } },
  "expenses": { user: "u-danny", url: "index.html#/workdesk/expenses", run: async T => {
    const form = T.page.locator(".panel").filter({ hasText: "Report an expense" }).first(), f = l => T.field(l, form);
    const opts = await f("Expense type").locator("option").allTextContents();
    await T.select(f("Expense type"), opts.find(o => /^Travel/.test(o)) || opts[1]);
    await T.type(f("Amount"), "126");
    await T.select(f("Client"), "Elbit Systems");
    await T.select(f("Project"), "Avionics Help System");
    const wo = await f("Work order").locator("option").allTextContents(); if (wo.length > 1) await T.select(f("Work order"), wo[1]);
    await T.type(f("Description"), "Drive to the client site");
    await T.click(form.getByRole("button", { name: "Add expense" }), 1500);
  } },
  "approvals": { user: "u-danny", url: "index.html#/workdesk/approvals", run: async T => {
    await T.wait(500);
    const card = T.page.locator(".apcard").first();
    await T.click(card.getByRole("button", { name: "Approve", exact: true }), 900);
    const m = T.page.locator(".modal").last();
    if (await m.count() && await m.isVisible()) { const b = m.getByRole("button", { name: /Approve/ }).first(); await T.click(b, 1500); }
  } },
  "dashboard": { user: "u-danny", url: "index.html#/workdesk/dashboard", cursor: false, early: true, run: async T => {
    await T.wait(1500); await T.page.mouse.wheel(0, 380); await T.wait(1800);
  } },
  "board": { user: "u-danny", url: "taskana/index.html#/board", run: async T => {
    const page = T.page;
    const src = page.locator("[data-drop] [data-task]").first(), dst = page.locator("[data-drop]").nth(2);
    await T.point(src); await T.wait(150);
    const a = await src.boundingBox(), b = await dst.boundingBox();
    const x0 = a.x + a.width / 2, y0 = a.y + 30, x1 = b.x + b.width / 2, y1 = b.y + 160;
    await page.mouse.move(x0, y0); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { const e = i / 30, k = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
      await page.mouse.move(x, y); await page.evaluate(([x, y]) => __cc.move(x, y, "fast"), [x, y]); await T.wait(22); }
    await page.mouse.up(); await T.wait(1300);
  } },
  "hr": { user: "u-eitan", url: "hr/index.html#/", cursor: false, run: async T => { await T.wait(800); await T.page.mouse.wheel(0, 300); await T.wait(1800); } },
  "kudos": { user: "u-eitan", url: "hr/index.html#/kudos", run: async T => {
    const b = T.page.getByRole("button", { name: /Give kudos/ }).first();
    await T.click(b, 1800);
  } },
  "news": { user: "u-eitan", url: "news/index.html", cursor: false, run: async T => { await T.wait(700); await T.page.mouse.wheel(0, 250); await T.wait(1800); } },
  "handbook": { user: "u-danny", url: "handbook/index.html", cursor: false, run: async T => { await T.wait(600); await T.page.mouse.wheel(0, 500); await T.wait(1800); } },
  "kb": { user: "u-danny", url: "kb/index.html", run: async T => {
    const s = T.page.locator("input[type=search], header input").first();
    await T.type(s, "QR time", 70); await T.wait(1800);
  } },
  "studio": { user: "u-eitan", url: "studio/index.html", gl: true, setup2: async page => {
    await page.click("#btn-sample-2");
    await page.waitForFunction(() => /12/.test((document.getElementById("st-model") || {}).textContent || ""), null, { timeout: 120000 });
    await page.waitForFunction(() => window.studio && window.studio.idle(), null, { timeout: 60000 });
    await page.waitForTimeout(600);
  }, run: async T => {
    await T.click(T.page.locator("#proc-auto"), 600);
    await T.click(T.page.locator("#proc-strip .card:not(.add)").nth(2), 2600);
  } },
  "phone-home": { user: "u-eitan", url: "index.html", phone: true, timer: true, cursor: false, run: async T => { await T.wait(1200); await T.page.mouse.wheel(0, 260).catch(() => {}); await T.wait(1500); } },
  "phone-time": { user: "u-eitan", url: "index.html#/workdesk/time", phone: true, run: async T => {
    const b = T.page.getByRole("button", { name: "Report without the timer" });
    await T.click(b, 1200);
    const sheet = T.page.locator(".sheet").last(), f = l => T.field(l, sheet);
    await T.select(f("Client"), "Elbit Systems");
    await T.click(sheet.getByRole("button", { name: "Office", exact: true }), 150);
    await T.select(f("Project"), "Avionics Help System");
    await T.select(f("Work order"), (await f("Work order").locator("option").allTextContents())[1]);
    await T.type(f("Description"), "Help topics review");
    await T.click(sheet.getByRole("button", { name: "Save entry" }), 1500);
  } }
};

/* ---------------- the camera ---------------- */
async function film(browser, name, s) {
  const dir = path.join(OUT, name), raw = dir + ".raw";
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(raw, { recursive: true, force: true });
  fs.mkdirSync(raw, { recursive: true });
  const vp = s.phone ? PHONE : DESK, scale = s.phone ? (process.env.PHONE_HIRES ? 2 : 1) : 1.2;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, isMobile: !!s.phone, hasTouch: !!s.phone, locale: "en-GB", timezoneId: "Asia/Jerusalem",
    userAgent: s.phone ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" : undefined });
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (!/ResizeObserver/.test(e.message)) console.log("  page error:", e.message); });
  await page.addInitScript(user => {
    try {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-hr-config", JSON.stringify({ storage: "local" }));
      if (!sessionStorage.getItem("cc-init")) { localStorage.setItem("galil-portal-lang", "en"); localStorage.setItem("galil-workdesk-theme", "light"); sessionStorage.setItem("cc-init", "1"); }
      localStorage.setItem("galil-workdesk-session", user);
    } catch (e) {}
  }, s.user);
  await page.goto(BASE + "index.html"); await page.waitForTimeout(900);
  await page.goto(BASE + "taskana/index.html#/my"); await page.waitForTimeout(700);
  if (s.setup) { await page.goto(BASE + "news/feed.json"); await s.setup(page); }
  if (s.timer) await page.evaluate(() => { const d = new Date(Date.now() - (2 * 3600 + 17 * 60) * 1000); const p = x => String(x).padStart(2, "0");
    localStorage.setItem("galil-workdesk-timer", JSON.stringify({ at: d.getTime(), date: d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()), start: p(d.getHours()) + ":" + p(Math.floor(d.getMinutes() / 5) * 5) })); });

  const shots = [];
  let filming = false, cdp = null;
  const startCam = async () => {
    if (s.phone && process.env.PHONE_HIRES) {
      /* sharper but slow (about 5 pictures a second): a loop of captures at twice the density */
      filming = true; cdp = await ctx.newCDPSession(page);
      (async () => { while (filming) { try { const t = Date.now() / 1000; const r = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 88, optimizeForSpeed: true, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 2 } });
        const f = path.join(raw, String(shots.length).padStart(6, "0") + ".jpg"); fs.writeFileSync(f, Buffer.from(r.data, "base64")); shots.push({ f, t }); } catch (e) { await new Promise(r => setTimeout(r, 20)); } } })();
    } else {
      cdp = await ctx.newCDPSession(page);
      cdp.on("Page.screencastFrame", async fr => {
        const f = path.join(raw, String(shots.length).padStart(6, "0") + ".jpg");
        fs.writeFileSync(f, Buffer.from(fr.data, "base64")); shots.push({ f, t: fr.metadata.timestamp });
        try { await cdp.send("Page.screencastFrameAck", { sessionId: fr.sessionId }); } catch (e) {}
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: Math.round(vp.width * scale), maxHeight: Math.round(vp.height * scale), everyNthFrame: 1 });
    }
  };
  const ensure = async () => { await page.evaluate("(" + overlay.toString() + ")()"); if (s.cursor === false) await page.evaluate(() => __cc.hide(true)); };

  if (s.early) { await startCam(); await page.goto(BASE + s.url); await ensure(); }
  else {
    await page.goto(BASE + s.url); await page.waitForTimeout(1500);
    if (s.setup2) await s.setup2(page);
    await ensure(); await page.waitForTimeout(200); await startCam();
  }
  const T0 = Date.now() / 1000;
  const wait = ms => page.waitForTimeout(ms);
  const center = async loc => { await loc.first().scrollIntoViewIfNeeded().catch(() => {}); const b = await loc.first().boundingBox(); if (!b) throw new Error("not on screen"); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
  const T = {
    page, wait,
    field: (label, scope) => (scope || page).locator(".fld").filter({ has: page.locator("label", { hasText: new RegExp("^\\s*" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }) }).locator("input, select, textarea").first(),
    point: async (loc, speed) => { const c = await center(loc); await page.evaluate(([x, y, sp]) => __cc.move(x, y, sp), [c.x, c.y, speed === "fast2" ? null : speed || null]); await wait(speed === "fast2" ? 380 : speed === "slow" ? 950 : 600); return c; },
    click: async (loc, after = 600) => { await T.point(loc); await page.evaluate(() => __cc.ring()); await wait(120); await loc.first().click(); await wait(after); if (!(await page.evaluate(() => !!window.__cc).catch(() => false))) await ensure(); },
    select: async (loc, label) => { await T.point(loc); await page.evaluate(() => __cc.ring()); await loc.first().selectOption({ label }); await wait(350); },
    type: async (loc, text, delay = 45) => { await T.click(loc, 120); await loc.first().pressSequentially(text, { delay }); await wait(250); },
    drag: async (src, dst) => {
      await T.point(src); await page.evaluate(() => __cc.ring()); await wait(200);
      const b = await center(dst);
      await page.evaluate(([el, x, y]) => { __cc.ghost(el, x, y); __cc.move(x, y, "slow"); }, [await src.first().elementHandle(), b.x, b.y]);
      await wait(950);
      await src.first().dragTo(dst.first(), { targetPosition: { x: Math.min(60, b.b.width / 2), y: Math.min(80, b.b.height / 2) } });
      await wait(500);
    },
    dragTo: async (src, dstHeader) => {
      const col = dstHeader.locator("xpath=ancestor::*[.//*[@draggable='true']][1]");
      await T.drag(src, col);
    }
  };
  let ok = true;
  try { await s.run(T); } catch (e) { ok = false; console.log(name, "FAILED:", e.message.split("\n")[0]); await page.screenshot({ path: dir + ".failed.png" }); }
  await wait(300);
  if (filming) { filming = false; await wait(300); } else await cdp.send("Page.stopScreencast");
  const end = Date.now() / 1000;
  await ctx.close();
  if (!ok || !shots.length) return false;

  /* a steady 30 fps: each output frame is the latest picture taken by then */
  fs.mkdirSync(dir, { recursive: true });
  const t0 = s.early ? shots[0].t : Math.max(shots[0].t, T0 - 0.1);
  const n = Math.floor((end - t0) * FPS);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / FPS;
    while (j + 1 < shots.length && shots[j + 1].t <= t) j++;
    fs.copyFileSync(shots[j].f, path.join(dir, String(i).padStart(5, "0") + ".jpg"));
  }
  fs.writeFileSync(path.join(dir, "info.json"), JSON.stringify({ frames: n, fps: FPS, phone: !!s.phone, w: Math.round(vp.width * scale), h: Math.round(vp.height * scale) }));
  fs.rmSync(raw, { recursive: true, force: true });
  console.log(name, "·", n, "frames ·", (n / FPS).toFixed(1), "s ·", shots.length, "pictures");
  return true;
}

(async () => {
  const only = process.argv[2] ? process.argv[2].split(",") : Object.keys(SHOTS);
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  let bad = [];
  for (const name of only) { if (!(await film(browser, name, SHOTS[name]))) bad.push(name); }
  await browser.close(); server.close();
  if (bad.length) { console.log("failed:", bad.join(", ")); process.exit(1); }
})();
