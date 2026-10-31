// Renders the commercial: stage.html is drawn frame by frame (window.seek(t)), each frame is captured,
// and ffmpeg joins them with the soundtrack.
//
//   node tools/commercial/render.js              the whole film → docs/films/GALIL-Employee-Portal-Commercial.mp4
//   FROM=20 TO=24 node tools/commercial/render.js   a part of it, for checking → build/preview.mp4
//   STILLS=5,12.3 node tools/commercial/render.js   single frames → build/still-<t>.jpg
// Run shoot.js (the clips) and music.py (the soundtrack, build/music.wav) first.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const HERE = __dirname, BUILD = path.join(HERE, "build"), PORTAL = path.resolve(HERE, "../../Employee Portal");
const FPS = 30, PORT = 4196;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = p === "/" ? path.join(HERE, "stage.html") : p.startsWith("/shots/") ? path.join(BUILD, p) : p.startsWith("/portal/") ? path.join(PORTAL, p.slice(8)) : null;
  if (!file) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "max-age=3600" }); res.end(d); });
});

(async () => {
  const shots = {};
  for (const n of fs.readdirSync(path.join(BUILD, "shots"))) {
    const f = path.join(BUILD, "shots", n, "info.json");
    if (fs.existsSync(f)) shots[n] = JSON.parse(fs.readFileSync(f));
  }
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", e => console.log("page error:", e.message));
  await page.addInitScript(s => { window.SHOTS = s; }, shots);
  await page.goto("http://localhost:" + PORT + "/");
  await page.evaluate(() => document.fonts.ready);
  const cdp = await page.context().newCDPSession(page);
  const grab = async file => { const r = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } }); fs.writeFileSync(file, Buffer.from(r.data, "base64")); };

  if (process.env.STILLS) {
    for (const t of process.env.STILLS.split(",").map(Number)) { await page.evaluate(t => window.seek(t), t); await page.waitForTimeout(50); await grab(path.join(BUILD, "still-" + t + ".jpg")); }
    await browser.close(); server.close(); return;
  }
  const dur = await page.evaluate(() => window.DURATION);
  const from = Number(process.env.FROM || 0), to = Math.min(dur, Number(process.env.TO || dur));
  const frames = path.join(BUILD, "frames");
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const n = Math.round((to - from) * FPS), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.seek(t), from + i / FPS);
    await grab(path.join(frames, String(i).padStart(5, "0") + ".jpg"));
    if (i % 150 === 0) console.log("frame", i, "/", n, "·", ((Date.now() - t0) / 1000).toFixed(0), "s");
  }
  await browser.close(); server.close();

  const full = !process.env.FROM && !process.env.TO;
  const out = full ? path.resolve(HERE, "../../docs/films/GALIL-Employee-Portal-Commercial.mp4") : path.join(BUILD, "preview.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(frames, "%05d.jpg"),
    "-ss", String(from), "-i", path.join(BUILD, "music.wav"),
    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", out]);
  console.log("wrote", path.relative(path.resolve(HERE, "../.."), out), (fs.statSync(out).size / 1048576).toFixed(1), "MB");
})();
