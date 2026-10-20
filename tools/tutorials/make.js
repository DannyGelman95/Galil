// Makes a tutorial film of the Employee Portal: a scene script drives the real app in a
// browser, an on-screen cursor, a spotlight and large captions show what happens and why,
// and the result is an MP4 (1080p on a computer, portrait on a phone) with background
// music and subtitles, ready for the Handbook.
//
// Run from tests/workdesk (for Playwright):
//   node ../../tools/tutorials/make.js workdesk-planner-desktop [en]
//   FAST=1 node ../../tools/tutorials/make.js <scene>     a quick dry run: checks every step, films nothing
// Output, beside the Handbook: Employee Portal/handbook/films/<scene>.<lang>.mp4, .vtt (captions) and .jpg (poster)
//
// Needs ffmpeg and python3 with numpy (for the music).
const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");

const REPO = path.resolve(__dirname, "../..");
const SITE = path.join(REPO, "Employee Portal");
const ORIGIN = "https://portal.test";
const OUT = path.join(SITE, "handbook/films");
const FAST = !!process.env.FAST;

const sceneName = process.argv[2];
const lang = process.argv[3] || "en";
if (!sceneName) { console.log("usage: node make.js <scene> [en|he]"); process.exit(1); }
const scene = require(path.join(__dirname, "scenes", sceneName + ".js"));

/* ---------- the overlay drawn into the page: cursor, spotlight, caption, title card ---------- */
function overlay() {
  if (window.__tut) return;
  var css = [
    "#tut{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:'Noto Sans','Segoe UI',Arial,sans-serif}",
    "#tut .spot{position:fixed;border:3px solid #F08A24;border-radius:12px;box-shadow:0 0 0 4000px rgba(12,22,40,.40),0 0 24px rgba(240,138,36,.55);opacity:0;transition:opacity .22s ease-out}",
    "#tut .spot.on{opacity:1}",
    "#tut .cap{position:fixed;left:50%;bottom:34px;transform:translate(-50%,12px);max-width:min(1120px,86vw);background:rgba(22,38,66,.96);color:#fff;border-radius:16px;padding:18px 28px 18px 24px;font-size:25px;line-height:1.42;font-weight:500;box-shadow:0 18px 50px rgba(0,0,0,.35);border-inline-start:6px solid #F08A24;opacity:0;transition:opacity .3s,transform .3s}",
    "#tut .cap.on{opacity:1;transform:translate(-50%,0)}",
    "#tut .cap.top{bottom:auto;top:30px}",
    "#tut .cap b{color:#FFB46B;font-weight:700;display:inline!important;font-size:inherit;margin:0;padding:0;letter-spacing:normal;text-transform:none}",
    "#tut .cap,#tut .card{letter-spacing:normal;text-transform:none;text-align:start}",
    "#tut .card{text-align:center}",
    "#tut .cap .n{display:block;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#B2C3E0;margin-bottom:4px;font-weight:700}",
    "#tut .cur{position:fixed;left:0;top:0;width:30px;height:30px;transition:transform .7s cubic-bezier(.45,.05,.25,1);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}",
    "#tut .cur.fast{transition:transform .25s ease}",
    "#tut .cur.slow{transition:transform 1.1s cubic-bezier(.45,.05,.25,1)}",
    "#tut .ring{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #F08A24;opacity:.9;animation:tutring .7s ease-out forwards}",
    "@keyframes tutring{from{transform:scale(.3);opacity:.95}to{transform:scale(1.6);opacity:0}}",
    "#tut .ghost{position:fixed;left:0;top:0;opacity:.88;transform-origin:0 0;transition:transform 1.1s cubic-bezier(.45,.05,.25,1);box-shadow:0 14px 34px rgba(0,0,0,.3);border-radius:9px;background:#fff}",
    "#tut .card{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#fff;text-align:center;opacity:0;transition:opacity .6s;",
    "background:radial-gradient(1100px 600px at 80% -10%,rgba(240,138,36,.35),transparent 60%),linear-gradient(160deg,#1F3A66,#14284A)}",
    "#tut .card.on{opacity:1}",
    "#tut .card .k{font-size:18px;letter-spacing:.32em;text-transform:uppercase;color:#FFB46B;font-weight:700}",
    "#tut .card h1{margin:0;font-size:66px;line-height:1.1;font-weight:800;letter-spacing:-.01em}",
    "#tut .card p{margin:0;font-size:26px;color:#C5D3EA;max-width:980px;line-height:1.45}",
    "#tut .card .mark{width:84px;height:72px;margin-bottom:6px}",
    /* on a phone: the same look, sized for a narrow screen, and a fingertip instead of an arrow */
    "#tut.phone .cap{bottom:84px;max-width:92vw;width:92vw;font-size:15.5px;line-height:1.4;padding:11px 14px 11px 13px;border-radius:13px;border-inline-start-width:5px}",
    "#tut.phone .cap.top{top:70px;bottom:auto}",
    "#tut.phone .spot{border-width:2.5px;border-radius:10px}",
    "#tut.phone .card{gap:12px;padding:0 26px}",
    "#tut.phone .card .k{font-size:11px;letter-spacing:.26em}",
    "#tut.phone .card h1{font-size:34px}",
    "#tut.phone .card p{font-size:16px}",
    "#tut.phone .card .mark{width:58px;height:50px}",
    "#tut.phone .cur{width:34px;height:34px}",
    "#tut.phone .ring{width:40px;height:40px;margin:-20px 0 0 -20px}"
  ].join("\n");
  var root = document.createElement("div"); root.id = "tut";
  var phone = innerWidth < 600; if (phone) root.className = "phone";
  root.innerHTML = '<style>' + css + '</style><div class="spot"></div><div class="cap"></div>' +
    (phone ? '<svg class="cur" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.55)" stroke="#14284A" stroke-width="1.4"/><circle cx="12" cy="12" r="4" fill="rgba(240,138,36,.9)"/></svg>'
      : '<svg class="cur" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.5 L14.4 20.3 L11.4 13.7 L17.6 13.7 Z" fill="#fff" stroke="#14284A" stroke-width="1.6" stroke-linejoin="round"/></svg>') +
    '<div class="card"></div>';
  document.documentElement.appendChild(root);
  var spot = root.querySelector(".spot"), cap = root.querySelector(".cap"), cur = root.querySelector(".cur"), card = root.querySelector(".card");
  var target = null, pad = 8;
  function place1() {
    if (target && target.isConnected) {
      var r = target.getBoundingClientRect();
      spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
      spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      cap.classList.toggle("top", r.bottom > innerHeight - (phone ? 200 : 230) && r.top > (phone ? 170 : 200));
    }
  }
  function place() {
    if (target && !target.isConnected) { target = null; spot.classList.remove("on"); }
    if (target && target.isConnected) {
      var r = target.getBoundingClientRect();
      spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
      spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      cap.classList.toggle("top", r.bottom > innerHeight - (phone ? 200 : 230) && r.top > (phone ? 170 : 200));
    }
    requestAnimationFrame(place);
  }
  requestAnimationFrame(place);
  var cx = innerWidth * 0.62, cy = innerHeight * 0.62;
  cur.style.transform = "translate(" + cx + "px," + cy + "px)";
  window.__tut = {
    /* a new target: the ring jumps there unseen and fades in, so it never slides across the screen */
    spot: function (el, p) {
      pad = p == null ? 8 : p;
      if (!el) { target = null; spot.classList.remove("on"); cap.classList.remove("top"); return; }
      if (target !== el) { spot.style.transition = "none"; spot.classList.remove("on"); target = el; place1(); void spot.offsetWidth; spot.style.transition = ""; }
      spot.classList.add("on");
    },
    caption: function (html, n) { if (!html) { cap.classList.remove("on"); return; } cap.innerHTML = (n ? '<span class="n">' + n + '</span>' : "") + html; cap.classList.add("on"); },
    move: function (x, y, speed) { cur.classList.remove("fast", "slow"); if (speed) cur.classList.add(speed); cx = x; cy = y; cur.style.transform = phone ? "translate(" + (x - 17) + "px," + (y - 17) + "px)" : "translate(" + (x - 4) + "px," + (y - 2) + "px)"; },
    ring: function () { var r = document.createElement("div"); r.className = "ring"; r.style.left = cx + "px"; r.style.top = cy + "px"; root.appendChild(r); setTimeout(function () { r.remove(); }, 800); },
    ghost: function (el, x1, y1) {
      var r = el.getBoundingClientRect(), g = el.cloneNode(true); g.className += " ghost"; g.style.width = r.width + "px";
      g.style.transform = "translate(" + r.left + "px," + r.top + "px)"; root.appendChild(g);
      requestAnimationFrame(function () { requestAnimationFrame(function () { g.style.transform = "translate(" + (x1 - r.width / 2) + "px," + (y1 - 12) + "px) rotate(-2deg)"; }); });
      setTimeout(function () { g.remove(); }, 1250);
    },
    card: function (html) { if (html) card.innerHTML = html; card.classList.toggle("on", !!html); },
    hideCursor: function (h) { cur.style.opacity = h ? "0" : "1"; }
  };
}

(async () => {
  const frames = path.join(OUT, ".frames-" + sceneName + "-" + lang);
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const vp = scene.viewport || { width: 1600, height: 900 }, scale = scene.scale || 1920 / vp.width;

  /* the screencast films the browser window itself, so the window is sized to the page and scaled to 1080p */
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined,
    args: ["--window-size=" + vp.width + "," + vp.height, "--force-device-scale-factor=" + scale, "--lang=" + (lang === "he" ? "he-IL" : "en-GB")],
    /* date and time fields follow the system language: day/month/year and a 24-hour clock, as in Israel */
    env: Object.assign({}, process.env, { LANG: (lang === "he" ? "he_IL" : "en_GB") + ".UTF-8", LANGUAGE: lang === "he" ? "he" : "en_GB", LC_ALL: (lang === "he" ? "he_IL" : "en_GB") + ".UTF-8" }) });
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, acceptDownloads: true, locale: lang === "he" ? "he-IL" : "en-GB", timezoneId: "Asia/Jerusalem", hasTouch: !!scene.phone, isMobile: !!scene.phone });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.log("  page error:", e.message));
  await page.route(ORIGIN + "/**", r => {
    const p = decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\//, "")) || "index.html";
    if (p === "__blank") return r.fulfill({ contentType: "text/html", body: "<!doctype html><title>set-up</title>" });
    r.fulfill({ path: path.join(SITE, p) });
  });
  await page.addInitScript(([lang, user]) => {
    try {
      localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-taskana-config", JSON.stringify({ storage: "local" }));
      localStorage.setItem("galil-portal-lang", lang);
      localStorage.setItem("galil-workdesk-theme", "light");
      if (user) localStorage.setItem("galil-workdesk-session", user);
    } catch (e) {}
  }, [lang, scene.user || null]);

  /* set-up before the camera rolls: seed the demo data, open the starting screen */
  await page.goto(ORIGIN + "/index.html"); await page.waitForTimeout(600);
  if (scene.warm) for (const u of scene.warm) { await page.goto(ORIGIN + "/" + u); await page.waitForTimeout(1000); }
  /* the data is changed from a page of the same address where the app isn't running, so the app can't write over it */
  if (scene.setup) { await page.goto(ORIGIN + "/__blank"); await scene.setup(page); }
  await page.goto(ORIGIN + "/" + scene.start); await page.waitForTimeout(1200);
  /* the overlay, and a slow repaint that keeps the camera running while nothing moves — again after any page load */
  const ensureOverlay = async () => {
    try { await page.waitForLoadState("domcontentloaded"); } catch (e) {}
    await page.evaluate("(" + overlay.toString() + ")()");
    await page.evaluate(() => { if (window.__tick) return; window.__tick = 1; const d = document.createElement("div"); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:2147483647;pointer-events:none"; document.documentElement.appendChild(d); let k = 0; setInterval(() => { d.style.background = (k++ % 2) ? "#000" : "#fff"; }, 100); });
  };
  await ensureOverlay();

  /* the camera: every repaint as a JPEG with its time */
  const cdp = await ctx.newCDPSession(page);
  const shots = [];
  cdp.on("Page.screencastFrame", async f => {
    const file = path.join(frames, String(shots.length).padStart(6, "0") + ".jpg");
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    shots.push({ file, t: f.metadata.timestamp });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {}
  });
  /* the film opens on the title backdrop, never on a glimpse of the app: the backdrop is up before the camera rolls */
  await page.evaluate(() => { const c = document.querySelector("#tut .card"); c.style.transition = "none"; c.innerHTML = ""; c.classList.add("on"); __tut.hideCursor(true); void c.offsetWidth; c.style.transition = ""; });
  await page.waitForTimeout(300);
  /* a phone is filmed by taking pictures in a loop: the screencast (and CDP's own capture) crop an emulated phone screen */
  let filming = !FAST && !!scene.phone;
  const loop = (async () => {
    while (filming) {
      try {
        const file = path.join(frames, String(shots.length).padStart(6, "0") + ".jpg");
        await page.screenshot({ path: file, type: "jpeg", quality: 90, animations: "allow", caret: "initial" });
        shots.push({ file, t: Date.now() / 1000 });
      } catch (e) { await new Promise(r => setTimeout(r, 30)); }
    }
  })();
  if (!FAST && !scene.phone) await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: Math.round(vp.width * scale), maxHeight: Math.round(vp.height * scale), everyNthFrame: 1 });
  const T0 = Date.now() / 1000;
  const cues = [];
  const wait = ms => page.waitForTimeout(FAST ? Math.min(ms, 60) : ms);

  const center = async loc => { const b = await loc.boundingBox(); if (!b) throw new Error("not on screen: " + loc); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
  let stepNo = 0;
  const T = {
    page, lang, wait,
    /* the input of a labelled field: T.field("Client"), or T.field("Client", page.locator(".modal")) */
    field: (label, scope) => (scope || page).locator(".fld").filter({ has: page.locator("label", { hasText: new RegExp("^\\s*" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }) }).locator("input, select, textarea").first(),
    /* a title card, full screen */
    card: async (kicker, title, sub, secs = 6) => {
      const html = '<svg class="mark" viewBox="0 7 40 34"><path d="M3 24 C 9 12, 15 12, 20 24 S 32 36, 37 24" fill="none" stroke="#F08A24" stroke-width="4" stroke-linecap="round"/></svg>' +
        '<div class="k">' + kicker + '</div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : "");
      const t = Date.now() / 1000 - T0;
      await page.evaluate(h => { __tut.hideCursor(true); __tut.card(h); }, html);
      await wait(secs * 1000);
      await page.evaluate(() => { __tut.card(null); __tut.hideCursor(false); });
      cues.push({ a: t + 0.4, b: Date.now() / 1000 - T0, text: [title, sub].filter(Boolean).join(" — ").replace(/<[^>]+>/g, "") });
      await wait(600);
    },
    /* a caption, with the spotlight on what it is about; it stays up for secs */
    say: async (text, opts = {}) => {
      await T.uncover();
      const loc = opts.spot || null;
      if (loc) await loc.first().scrollIntoViewIfNeeded().catch(() => {});
      const el = loc ? await loc.first().elementHandle() : null;
      stepNo++;
      if (el) await page.evaluate(el => new Promise(done => {           // until it stops moving (a dialog opening)
        let last = "", same = 0, n = 0;
        (function look() { const r = el.getBoundingClientRect(), k = [r.x, r.y, r.width, r.height].map(Math.round).join();
          same = k === last ? same + 1 : 0; last = k; if (same >= 3 || ++n > 60) done(); else requestAnimationFrame(look); })();
      }), el);
      await page.evaluate(([el, pad]) => __tut.spot(el, pad), [el, opts.pad == null ? 8 : opts.pad]);
      await wait(200);
      const words = text.replace(/<[^>]+>/g, "").split(/\s+/).length;
      const secs = opts.secs || Math.max(3.4, 1.1 + words * 0.25);
      const t = Date.now() / 1000 - T0;
      await page.evaluate(([h, n]) => __tut.caption(h, n), [text, opts.label || ""]);
      if (opts.during) await opts.during();
      await wait(secs * 1000);
      cues.push({ a: t, b: Date.now() / 1000 - T0, text: text.replace(/<[^>]+>/g, "") });
      if (!opts.keep) { await page.evaluate(() => { __tut.caption(null); __tut.spot(null); }); await wait(300); }
    },
    clear: async () => { await page.evaluate(() => { __tut.caption(null); __tut.spot(null); }); await wait(150); },
    /* once an action is done its caption and spotlight go at once — unless { hold: true }, for a next action under the same caption */
    done: async opts => { if (!(opts && opts.hold)) await page.evaluate(() => { __tut.caption(null); __tut.spot(null); }); },
    /* a scene that doesn't open with a title card: take the opening backdrop away first */
    uncover: () => page.evaluate(() => { const c = document.querySelector("#tut .card"); if (c.classList.contains("on") && !c.innerHTML) { __tut.card(null); __tut.hideCursor(false); } }),
    point: async (loc, speed) => { await T.uncover();
      const c = await center(loc.first()); await page.evaluate(([x, y, s]) => __tut.move(x, y, s), [c.x, c.y, speed || null]); await wait(speed === "slow" ? 1150 : 750); return c; },
    click: async (loc, after = 650, opts) => {
      await loc.first().scrollIntoViewIfNeeded().catch(() => {});
      await T.point(loc); await page.evaluate(() => __tut.ring()); await wait(140);
      await T.done(opts); await loc.first().click(); await wait(after);
      if (!(await page.evaluate(() => !!window.__tut).catch(() => false))) { await ensureOverlay(); await wait(400); }
    },
    /* open another page of the portal (Taskana, the Handbook…) */
    goto: async url => { await page.goto(ORIGIN + "/" + url); await ensureOverlay(); await wait(900); },
    /* scroll something into view, smoothly */
    scroll: async loc => { await loc.first().evaluate(e => e.scrollIntoView({ behavior: "smooth", block: "center" })); await wait(900); },
    /* a finger swipe across something, on a phone (dx < 0 is to the left) */
    swipe: async (loc, dx) => {
      const b = await loc.first().boundingBox(), y = b.y + b.height / 2, x0 = dx < 0 ? b.x + b.width - 24 : b.x + 24;
      await page.evaluate(([x, y]) => __tut.move(x, y), [x0, y]); await wait(750);
      const cdp2 = await ctx.newCDPSession(page);
      await cdp2.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= 14; i++) { const x = x0 + dx * i / 14; await cdp2.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] }); await page.evaluate(([x, y]) => __tut.move(x, y, "fast"), [x, y]); await wait(30); }
      await cdp2.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await wait(600);
    },
    type: async (loc, text, opts) => { await T.click(loc, 200, { hold: true }); await loc.first().pressSequentially(text, { delay: 55 }); await wait(450); await T.done(opts); },
    fill: async (loc, value, opts) => { await T.click(loc, 200, { hold: true }); await loc.first().fill(value); await wait(550); await T.done(opts); },
    select: async (loc, label, opts) => { await T.point(loc); await page.evaluate(() => __tut.ring()); await loc.first().selectOption({ label }); await wait(700); await T.done(opts); },
    /* drag one thing onto another: the cursor carries a copy of it across */
    drag: async (src, dst) => {
      const a = await T.point(src); await page.evaluate(() => __tut.ring()); await wait(250);
      const b = await center(dst.first());
      await T.done();
      await page.evaluate(([el, x, y]) => { __tut.ghost(el, x, y); __tut.move(x, y, "slow"); }, [await src.first().elementHandle(), b.x, b.y]);
      await wait(1150);
      await src.first().dragTo(dst.first(), { targetPosition: { x: Math.min(60, b.b.width / 2), y: Math.min(80, b.b.height / 2) } });
      await wait(600);
    }
  };

  let failed = false;
  try { await scene.steps(T); }
  catch (e) { failed = true; console.log("SCENE FAILED:", e.message.split("\n").filter(l => /locator|waiting for|Error/.test(l)).slice(0, 3).join(" | ")); await page.screenshot({ path: path.join(OUT, sceneName + ".failed.png") }); }
  await wait(1200);
  if (FAST) { await browser.close(); fs.rmSync(frames, { recursive: true, force: true }); console.log(sceneName, failed ? "dry run FAILED" : "dry run ok"); process.exit(failed ? 1 : 0); }
  if (scene.phone) { filming = false; await loop; } else await cdp.send("Page.stopScreencast");
  await browser.close();
  if (failed) process.exit(1);

  /* frames → video: each frame lasts until the next one */
  const end = Date.now() / 1000;
  const list = shots.map((s, i) => "file '" + s.file + "'\nduration " + Math.max(0.001, ((shots[i + 1] ? shots[i + 1].t : end) - s.t)).toFixed(4)).join("\n") + "\nfile '" + shots[shots.length - 1].file + "'\n";
  fs.writeFileSync(path.join(frames, "list.txt"), list);
  const dur = end - shots[0].t, shift = shots[0].t - T0;
  console.log(sceneName, lang, "·", shots.length, "frames ·", dur.toFixed(1), "s");

  /* subtitles, timed against the first frame */
  const ts = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(3).padStart(6, "0"); return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + x.replace(".", ","); };
  const srt = cues.map((c, i) => (i + 1) + "\n" + ts(c.a - shift) + " --> " + ts(c.b - shift) + "\n" + c.text + "\n").join("\n");
  const base = path.join(OUT, sceneName + "." + lang);
  fs.writeFileSync(base + ".srt", srt);
  /* the same captions as WebVTT, for the Handbook's video player */
  fs.writeFileSync(base + ".vtt", "WEBVTT\n\n" + cues.map(c => ts(c.a - shift).replace(",", ".") + " --> " + ts(c.b - shift).replace(",", ".") + "\n" + c.text + "\n").join("\n"));

  const music = path.join(frames, "music.wav");
  execFileSync("python3", [path.join(__dirname, "music.py"), String(Math.ceil(dur) + 1), music, String(scene.seed || 7), scene.music || "bright"]);
  execFileSync("ffmpeg", ["-v", "error", "-y",
    "-f", "concat", "-safe", "0", "-i", path.join(frames, "list.txt"),
    "-i", music, "-i", base + ".srt",
    "-filter_complex", "[0:v]fps=30,scale=" + (Math.round(vp.width * scale / 2) * 2) + ":" + (Math.round(vp.height * scale / 2) * 2) + ":flags=lanczos,format=yuv420p[v];[1:a]volume=0.55[a]",
    "-map", "[v]", "-map", "[a]", "-map", "2:s",
    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "stillimage", "-g", "300",
    "-c:a", "aac", "-b:a", "160k", "-c:s", "mov_text", "-metadata:s:s:0", "language=" + (lang === "he" ? "heb" : "eng"),
    "-shortest", "-movflags", "+faststart", base + ".mp4"]);
  /* a poster for the player: the title card */
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "2.5", "-i", base + ".mp4", "-frames:v", "1", "-vf", "scale=" + (scene.phone ? 540 : 960) + ":-2", "-q:v", "4", base + ".jpg"]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log("wrote", path.relative(REPO, base + ".mp4"), "(" + (fs.statSync(base + ".mp4").size / 1048576).toFixed(1) + " MB), .vtt, .srt and .jpg");
})();
