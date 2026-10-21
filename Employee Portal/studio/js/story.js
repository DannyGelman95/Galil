// The storyboard under the view: procedures (steps for assembly, disassembly
// and maintenance, played as animations and recorded as video), the figures of
// the illustrated parts catalogue, and saved views. Together with the part data
// they make the project, kept in the browser per model and saved as a file.
import { app } from "./studio.js";
import { makeZip } from "./zip.js";

var $ = app.$, t = app.t, state = app.state;
var project = emptyProject();
var ui = { tab: "proc", proc: 0, step: null, fig: null, view: null };
var player = null, recorder = null;

function emptyProject() { return { procedures: [], figures: [], views: [] }; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function proc() { return project.procedures[ui.proc] || null; }
function stepIndex(id) { var p = proc(); return p ? p.steps.findIndex(function (s) { return s.id === id; }) : -1; }

// ---------- storage: IndexedDB per model file, and project files ----------
var DB = "galil-model-studio", STORE = "projects";
function db() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}
async function dbGet(key) {
  try {
    var d = await db();
    return await new Promise(function (res) {
      var q = d.transaction(STORE).objectStore(STORE).get(key);
      q.onsuccess = function () { res(q.result || null); };
      q.onerror = function () { res(null); };
    });
  } catch (e) { return null; }
}
async function dbPut(key, val) {
  try {
    var d = await db();
    d.transaction(STORE, "readwrite").objectStore(STORE).put(val, key);
  } catch (e) { /* private window or blocked */ }
}
function projectData() {
  return { app: "GALIL Model Studio", version: 2, model: state.file, meta: state.meta, views: project.views, procedures: project.procedures, figures: project.figures };
}
var saveTimer = 0;
function save() {
  if (!state.model) return;
  clearTimeout(saveTimer);
  var key = state.file;
  saveTimer = setTimeout(function () { dbPut(key, projectData()); }, 400);
}
function load(data) {
  project = emptyProject();
  state.meta = {};
  if (data) {
    if (Array.isArray(data.views)) project.views = data.views;
    if (Array.isArray(data.procedures)) project.procedures = data.procedures;
    if (Array.isArray(data.figures)) project.figures = data.figures;
    if (data.meta && typeof data.meta === "object") state.meta = data.meta;
  }
  ui.proc = 0; ui.step = null; ui.fig = null; ui.view = null;
  app.renderBom(); app.updateSelPanel();
  renderAll();
}

app.on("model", async function () {
  stop();
  var data = await dbGet(state.file);
  if (!data) {
    // views saved by the first version of Model Studio
    try {
      var old = JSON.parse(localStorage.getItem("galil-model-studio-views:" + state.file) || "null");
      if (Array.isArray(old)) data = { views: old };
    } catch (e) { data = null; }
  }
  load(data);
});
app.on("data", save);
app.on("lang", renderAll);
app.on("change", function () {
  var changedCard = false;
  if (ui.view) { ui.view = null; changedCard = true; }
  if (changedCard) renderViews();
});
app.on("escape", stop);

// project menu
$("btn-project").addEventListener("click", function (e) {
  e.stopPropagation();
  $("menu-project").hidden = !$("menu-project").hidden;
});
document.addEventListener("click", function () { $("menu-project").hidden = true; });
$("btn-project-save").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open a model first."));
  app.download(new Blob([JSON.stringify(projectData())], { type: "application/json" }), app.stem() + " - " + t("project") + ".json");
});
$("btn-project-open").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open the model first, then its project."));
  $("project-input").click();
});
$("project-input").addEventListener("change", async function () {
  var f = this.files[0]; this.value = "";
  if (!f) return;
  try {
    var data = JSON.parse(await f.text());
    if (Array.isArray(data)) data = { views: data };
    if (!data || (!data.views && !data.procedures && !data.figures && !data.meta)) throw new Error("not a project");
    load(data); save();
    app.toast(data.model && data.model !== state.file ? t("This project was made for {name}.", { name: data.model }) : t("Project opened."), data.model && data.model !== state.file);
  } catch (e) { app.toast(t("That file is not a Model Studio project."), true); }
});
$("btn-project-clear").addEventListener("click", function () {
  if (!state.model) return;
  if (!confirm(t("Remove every procedure, figure, view and part number of this model?"))) return;
  load(null); save();
});

// ---------- tabs ----------
document.querySelectorAll(".stab").forEach(function (b) {
  b.addEventListener("click", function () {
    ui.tab = b.dataset.stab;
    document.querySelectorAll(".stab").forEach(function (x) { x.classList.toggle("on", x === b); });
    $("sp-proc").hidden = ui.tab !== "proc";
    $("sp-fig").hidden = ui.tab !== "fig";
    $("sp-views").hidden = ui.tab !== "views";
    $("story").classList.remove("collapsed");
    $("btn-story-toggle").textContent = t("Hide panel");
  });
});
$("btn-story-toggle").addEventListener("click", function () {
  var c = $("story").classList.toggle("collapsed");
  this.textContent = c ? t("Show panel") : t("Hide panel");
});

// ---------- thumbnails ----------
function thumb() {
  var f = app.activeFrame(), a = f.w / f.h;
  var w = a >= 1.57 ? 264 : Math.round(168 * a), h = a >= 1.57 ? Math.round(264 / a) : 168;
  return app.capture({ w: w, h: h, ss: 1, format: "png", frame: f }).toDataURL("image/png");
}
// Applies each state in turn without touching the panels, calls fn, and puts the scene back.
function withStates(list, fn) {
  var now = app.snapshot();
  try { list.forEach(function (s, i) { app.applyState(s, { ui: false }); fn(s, i); }); }
  finally { app.applyState(now); }
}

function card(opts) {
  var li = document.createElement("li");
  li.className = "card" + (opts.on ? " on" : "");
  li.innerHTML = '<img alt=""><div class="ct"><b></b><span></span></div>';
  if (opts.thumb) li.querySelector("img").src = opts.thumb;
  li.querySelector("b").textContent = opts.no;
  li.querySelector("span").textContent = opts.title;
  li.title = opts.title;
  if (opts.flag) {
    var f = document.createElement("span");
    f.className = "flag " + opts.flagKind;
    f.textContent = opts.flag;
    li.appendChild(f);
  }
  li.addEventListener("click", opts.click);
  return li;
}
function addCard(label, fn) {
  var li = document.createElement("li");
  li.className = "card add";
  li.textContent = label;
  li.addEventListener("click", fn);
  return li;
}

function renderAll() { renderProcedures(); renderFigures(); renderViews(); }

// ---------- procedures ----------
var NOTE = { note: "Note", caution: "Caution", warning: "Warning" };

function renderProcedures() {
  var sel = $("proc-select");
  sel.innerHTML = "";
  project.procedures.forEach(function (p, i) {
    var o = document.createElement("option");
    o.value = i; o.textContent = p.title + " (" + p.steps.length + ")";
    sel.appendChild(o);
  });
  if (!project.procedures.length) {
    var o = document.createElement("option");
    o.value = -1; o.textContent = t("No procedures yet");
    sel.appendChild(o);
  }
  if (ui.proc >= project.procedures.length) ui.proc = Math.max(0, project.procedures.length - 1);
  sel.value = project.procedures.length ? ui.proc : -1;
  var p = proc();
  $("proc-kind").value = p ? p.kind : "disassembly";
  ["proc-rename", "proc-delete", "proc-kind", "proc-reverse"].forEach(function (id) { $(id).disabled = !p; });
  ["proc-play", "proc-video"].forEach(function (id) { $(id).disabled = !p || !p.steps.length || !!player; });
  $("proc-stop").disabled = !player;
  renderSteps();
}

function renderSteps() {
  var strip = $("proc-strip"), p = proc();
  strip.innerHTML = "";
  if (p) p.steps.forEach(function (s, i) {
    strip.appendChild(card({
      no: i + 1, title: s.title || t("Step {n}", { n: i + 1 }), thumb: s.thumb, on: s.id === ui.step,
      flag: s.noteKind ? t(NOTE[s.noteKind]) : "", flagKind: s.noteKind,
      click: function () { selectStep(s.id, true); }
    }));
  });
  if (state.model) strip.appendChild(addCard(t("+ Add step from the screen"), addStep));
  renderStepEditor();
}

function renderStepEditor() {
  var p = proc(), i = stepIndex(ui.step), s = i >= 0 ? p.steps[i] : null;
  $("step-empty").hidden = !!s;
  $("step-form").hidden = !s;
  if (!s) return;
  $("step-no").textContent = t("Step {n} of {m}", { n: i + 1, m: p.steps.length });
  $("step-title").value = s.title || "";
  $("step-text").value = s.text || "";
  $("step-note-kind").value = s.noteKind || "";
  $("step-note").value = s.note || "";
  $("step-note").disabled = !s.noteKind;
  $("step-tools").value = s.tools || "";
  $("step-dur").value = s.dur;
  $("step-hold").value = s.hold;
  $("step-left").disabled = i === 0;
  $("step-right").disabled = i === p.steps.length - 1;
  $("step-play").disabled = !!player;
}

function ensureProc() {
  if (proc()) return proc();
  project.procedures.push({ id: uid(), title: t("Procedure {n}", { n: project.procedures.length + 1 }), kind: "disassembly", steps: [] });
  ui.proc = project.procedures.length - 1;
  return proc();
}
function newStep(st, title) {
  return { id: uid(), title: title || "", text: "", noteKind: "", note: "", tools: "", dur: 2, hold: 1.5, state: st || app.snapshot(), thumb: thumb() };
}
function addStep() {
  if (!state.model) return app.toast(t("Open a model first."));
  var p = ensureProc(), i = stepIndex(ui.step);
  var s = newStep(null, t("Step {n}", { n: p.steps.length + 1 }));
  p.steps.splice(i >= 0 ? i + 1 : p.steps.length, 0, s);
  ui.step = s.id;
  renderProcedures(); save();
  setTimeout(function () { $("step-title").focus(); $("step-title").select(); }, 0);
}

function selectStep(id, animate) {
  if (player) return;
  ui.step = id;
  var p = proc(), s = p && p.steps[stepIndex(id)];
  renderSteps();
  if (s) {
    if (animate) playSegments([{ from: app.snapshot(), to: s.state, dur: 0.6, hold: 0, step: -1 }], null, true);
    else app.applyState(s.state);
  }
}

$("proc-select").addEventListener("change", function () {
  stop();
  ui.proc = +this.value; ui.step = null;
  renderProcedures();
});
$("proc-new").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open a model first."));
  var name = prompt(t("Name of the new procedure:"), t("Procedure {n}", { n: project.procedures.length + 1 }));
  if (name === null) return;
  project.procedures.push({ id: uid(), title: name.trim() || t("Procedure {n}", { n: project.procedures.length + 1 }), kind: "disassembly", steps: [] });
  ui.proc = project.procedures.length - 1; ui.step = null;
  renderProcedures(); save();
});
$("proc-rename").addEventListener("click", function () {
  var p = proc(); if (!p) return;
  var name = prompt(t("Name of the procedure:"), p.title);
  if (name === null || !name.trim()) return;
  p.title = name.trim();
  renderProcedures(); save();
});
$("proc-delete").addEventListener("click", function () {
  var p = proc(); if (!p) return;
  if (!confirm(t("Delete the procedure “{name}” and its {n} steps?", { name: p.title, n: p.steps.length }))) return;
  stop();
  project.procedures.splice(ui.proc, 1);
  ui.proc = Math.max(0, ui.proc - 1); ui.step = null;
  renderProcedures(); save();
});
$("proc-kind").addEventListener("change", function () { var p = proc(); if (p) { p.kind = this.value; save(); } });

function stepField(id, key, num) {
  $(id).addEventListener("input", function () {
    var p = proc(), i = stepIndex(ui.step); if (i < 0) return;
    var v = this.value;
    p.steps[i][key] = num ? Math.max(0, Math.min(60, parseFloat(v) || 0)) : v;
    if (key === "title" || key === "noteKind") renderStepsKeepEditor();
    if (key === "noteKind") { $("step-note").disabled = !v; }
    save();
  });
}
function renderStepsKeepEditor() {
  // refresh the cards only, so typing in the editor keeps its focus
  var p = proc(), strip = $("proc-strip");
  if (!p) return;
  Array.from(strip.children).forEach(function (li, i) {
    var s = p.steps[i]; if (!s) return;
    li.querySelector("span").textContent = s.title || t("Step {n}", { n: i + 1 });
    var f = li.querySelector(".flag");
    if (f) f.remove();
    if (s.noteKind) {
      f = document.createElement("span");
      f.className = "flag " + s.noteKind; f.textContent = t(NOTE[s.noteKind]);
      li.appendChild(f);
    }
  });
  $("proc-select").options[ui.proc].textContent = p.title + " (" + p.steps.length + ")";
}
stepField("step-title", "title"); stepField("step-text", "text"); stepField("step-note-kind", "noteKind");
stepField("step-note", "note"); stepField("step-tools", "tools"); stepField("step-dur", "dur", true); stepField("step-hold", "hold", true);

$("step-update").addEventListener("click", function () {
  var p = proc(), i = stepIndex(ui.step); if (i < 0) return;
  p.steps[i].state = app.snapshot(); p.steps[i].thumb = thumb();
  renderSteps(); save();
  app.toast(t("Step {n} updated.", { n: i + 1 }));
});
$("step-dup").addEventListener("click", function () {
  var p = proc(), i = stepIndex(ui.step); if (i < 0) return;
  var s = clone(p.steps[i]); s.id = uid(); s.title = (s.title || "") + " " + t("(copy)");
  p.steps.splice(i + 1, 0, s); ui.step = s.id;
  renderProcedures(); save();
});
$("step-delete").addEventListener("click", function () {
  var p = proc(), i = stepIndex(ui.step); if (i < 0) return;
  p.steps.splice(i, 1);
  ui.step = p.steps[Math.min(i, p.steps.length - 1)] ? p.steps[Math.min(i, p.steps.length - 1)].id : null;
  renderProcedures(); save();
});
function moveStep(d) {
  var p = proc(), i = stepIndex(ui.step), j = i + d; if (i < 0 || j < 0 || j >= p.steps.length) return;
  var s = p.steps.splice(i, 1)[0]; p.steps.splice(j, 0, s);
  renderSteps(); save();
}
$("step-left").addEventListener("click", function () { moveStep(document.dir === "rtl" ? 1 : -1); });
$("step-right").addEventListener("click", function () { moveStep(document.dir === "rtl" ? -1 : 1); });
$("step-play").addEventListener("click", function () {
  var p = proc(), i = stepIndex(ui.step); if (i < 0) return;
  var from = i > 0 ? p.steps[i - 1].state : app.snapshot();
  playSegments([{ from: from, to: p.steps[i].state, dur: p.steps[i].dur || 0.01, hold: 0.6, step: i }], null);
});

// ---------- playing ----------
function segmentsFrom(p, start) {
  var segs = [{ from: app.snapshot(), to: p.steps[start].state, dur: 0.8, hold: p.steps[start].hold, step: start }];
  for (var i = start + 1; i < p.steps.length; i++) segs.push({ from: p.steps[i - 1].state, to: p.steps[i].state, dur: p.steps[i].dur, hold: p.steps[i].hold, step: i });
  return segs;
}
function play() {
  var p = proc(); if (!p || !p.steps.length) return;
  var i = Math.max(0, stepIndex(ui.step));
  if (i === p.steps.length - 1 && p.steps.length > 1) i = 0;
  playSegments(segmentsFrom(p, i), null);
}

// quiet: a short glide that is not a playback (choosing a card)
function playSegments(segs, onFrame, quiet) {
  stop();
  player = { segs: segs, i: 0, onFrame: onFrame, quiet: quiet };
  if (!quiet) {
    $("proc-play").disabled = true; $("proc-video").disabled = true; $("proc-stop").disabled = false; $("step-play").disabled = true;
  }
}

// Moves the playback to time `now` (ms); returns false when it has finished.
function advance(now) {
  var pl = player; if (!pl) return false;
  var seg = pl.segs[pl.i];
  if (!seg.t0) {
    seg.t0 = now;
    app.beginBlend(seg.from, seg.to);
    if (!pl.quiet && seg.step >= 0) showStep(seg.step);
  }
  var tt = (now - seg.t0) / 1000, k = seg.dur > 0 ? Math.min(1, tt / seg.dur) : 1;
  app.blend(app.ease(k));
  if (tt >= seg.dur + seg.hold) {
    pl.i++;
    if (pl.i >= pl.segs.length) { finish(); return false; }
  }
  return true;
}
app.on("frame", function (now) { if (player && !recorder) advance(now); });

function showStep(i) {
  var p = proc(), s = p.steps[i];
  ui.step = s.id;
  Array.from($("proc-strip").children).forEach(function (li, j) { li.classList.toggle("playing", j === i); li.classList.toggle("on", j === i); });
  $("caption").hidden = false;
  $("caption-title").textContent = t("Step {n}", { n: i + 1 }) + (s.title ? " — " + s.title : "");
  $("caption-text").textContent = captionText(s);
  renderStepEditor();
}
function captionText(s) {
  var lines = [];
  if (s.noteKind && s.note) lines.push(t(NOTE[s.noteKind]).toUpperCase() + ": " + s.note);
  if (s.text) lines.push(s.text);
  if (s.tools) lines.push(t("Tools and materials") + ": " + s.tools);
  return lines.join("\n");
}

function finish() {
  var pl = player; player = null;
  var last = pl.segs[pl.segs.length - 1];
  app.applyState(last.to);
  done(pl);
}
function stop() {
  if (recorder) { recorder.stopNow = true; return; }
  if (!player) return;
  var pl = player; player = null;
  var seg = pl.segs[Math.min(pl.i, pl.segs.length - 1)];
  app.applyState(seg.to);
  done(pl);
}
function done(pl) {
  $("caption").hidden = true;
  if (!pl.quiet) renderProcedures(); else renderSteps();
}
$("proc-play").addEventListener("click", play);
$("proc-stop").addEventListener("click", stop);
window.addEventListener("keydown", function (e) {
  var tag = (e.target.tagName || "").toLowerCase();
  if (e.key !== " " || tag === "input" || tag === "textarea" || tag === "select" || tag === "button" || !state.model) return;
  e.preventDefault();
  if (player) stop(); else play();
});

// ---------- video ----------
function videoType() {
  var types = ["video/mp4;codecs=avc1.640028", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (var i = 0; i < types.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) return types[i];
  return null;
}

function drawCaption(ctx, o, step) {
  var p = proc(), s = p && p.steps[step]; if (!s) return;
  var k = o.h / 720, pad = 16 * k, w = Math.min(o.w - 40 * k, 980 * k), x = (o.w - w) / 2;
  var title = t("Step {n}", { n: step + 1 }) + (s.title ? " — " + s.title : "");
  ctx.font = "400 " + 17 * k + "px Segoe UI, Arial, sans-serif";
  var lines = [];
  captionText(s).split("\n").forEach(function (para) {
    var words = para.split(/\s+/), line = "";
    words.forEach(function (wd) {
      var test = line ? line + " " + wd : wd;
      if (ctx.measureText(test).width > w - pad * 2 && line) { lines.push(line); line = wd; } else line = test;
    });
    if (line) lines.push(line);
  });
  lines = lines.slice(0, 4);
  var h = pad * 2 + 24 * k + lines.length * 23 * k, y = o.h - h - 22 * k;
  ctx.fillStyle = "rgba(28,45,74,0.92)";
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12 * k); ctx.fill();
  ctx.fillStyle = "#F08A24"; ctx.fillRect(x, y + 12 * k, 4 * k, h - 24 * k);
  var rtl = document.dir === "rtl";
  ctx.textAlign = rtl ? "right" : "left"; ctx.direction = rtl ? "rtl" : "ltr"; ctx.textBaseline = "top";
  var tx = rtl ? x + w - pad : x + pad;
  ctx.fillStyle = "#fff"; ctx.font = "700 " + 20 * k + "px Segoe UI, Arial, sans-serif";
  ctx.fillText(title, tx, y + pad);
  ctx.fillStyle = "#DCE5F5"; ctx.font = "400 " + 17 * k + "px Segoe UI, Arial, sans-serif";
  lines.forEach(function (l, i) { ctx.fillText(l, tx, y + pad + 30 * k + i * 23 * k); });
}

async function recordVideo() {
  var p = proc(); if (!p || !p.steps.length || recorder) return;
  var type = videoType();
  if (!type) return app.toast(t("This browser cannot record video. Use Chrome, Edge or Firefox."), true);
  var so = app.shotOptions(), w = Math.round(so.w / 2) * 2, h = Math.round(so.h / 2) * 2;
  if (w * h > 3840 * 2160) { w = 1920; h = Math.round(1920 * so.h / so.w / 2) * 2; }
  stop();
  var captions = $("proc-captions").checked;
  var start = app.snapshot();
  var segs = [{ from: p.steps[0].state, to: p.steps[0].state, dur: 0, hold: Math.max(1, p.steps[0].hold), step: 0 }];
  for (var i = 1; i < p.steps.length; i++) segs.push({ from: p.steps[i - 1].state, to: p.steps[i].state, dur: p.steps[i].dur, hold: p.steps[i].hold, step: i });
  segs[segs.length - 1].hold += 1;
  var total = segs.reduce(function (a, s) { return a + s.dur + s.hold; }, 0);
  var o;
  try { o = app.beginOutput({ w: w, h: h, ss: 1, format: "png", opaque: true, frame: app.activeFrame() }); }
  catch (err) { return app.toast(err.message, true); }
  state.recording = true;
  var stream = o.out.captureStream(30), chunks = [];
  var mr = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: Math.round(w * h * 30 * 0.12) });
  mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
  var stopped = new Promise(function (res) { mr.onstop = res; });
  recorder = { stopNow: false };
  player = { segs: segs, i: 0, quiet: true };
  $("rec").hidden = false; $("busy").hidden = false; $("busy-text").textContent = t("Recording the video…");
  // The encoder takes a moment to start on slow machines: hold the first
  // picture until it is running, and the last one for a moment at the end,
  // so neither end of the procedure is cut off.
  // the recorder starts once it has a frame, so keep drawing while waiting
  var isStarted = false;
  mr.onstart = function () { isStarted = true; };
  var hold = function (ms) {
    return new Promise(function (res) {
      var until = performance.now() + ms;
      (function f(now) {
        app.renderOutput(o, captions ? function (ctx) { drawCaption(ctx, o, player.segs[Math.min(player.i, player.segs.length - 1)].step); } : null);
        if (!recorder.stopNow && (now < until || !isStarted) && now < until + 10000) requestAnimationFrame(f); else res();
      })(performance.now());
    });
  };
  app.beginBlend(segs[0].from, segs[0].to); app.blend(1);
  mr.start(500);
  await hold(600);
  var t0 = performance.now();
  await new Promise(function (res) {
    (function frame(now) {
      var going = !recorder.stopNow && advance(now);
      var seg = player && player.segs[Math.min(player.i, player.segs.length - 1)];
      app.renderOutput(o, captions && seg ? function (ctx) { drawCaption(ctx, o, seg.step); } : null);
      $("rec-text").textContent = t("Recording {a} of {b} s", { a: Math.min(total, (now - t0) / 1000).toFixed(0), b: total.toFixed(0) });
      if (going) requestAnimationFrame(frame); else res();
    })(performance.now());
  });
  var cancelled = recorder.stopNow;
  if (!cancelled) { player = { segs: segs, i: segs.length - 1, quiet: true }; await hold(500); }
  mr.stop();
  await stopped;
  player = null; recorder = null;
  state.recording = false;
  app.endOutput(o);
  $("rec").hidden = true; $("busy").hidden = true;
  app.applyState(start);
  renderProcedures();
  if (cancelled) return app.toast(t("Recording stopped."));
  var ext = type.indexOf("mp4") >= 0 ? ".mp4" : ".webm";
  app.download(new Blob(chunks, { type: type.split(";")[0] }), app.stem() + " - " + p.title + ext);
  app.toast(t("Saved the video of “{name}” ({w} × {h}).", { name: p.title, w: w, h: h }));
}
$("proc-video").addEventListener("click", recordVideo);
$("btn-rec-stop").addEventListener("click", function () { if (recorder) recorder.stopNow = true; });

// ---------- making procedures ----------
// Disassembly steps from the model: parts removed one item at a time, the
// ones furthest from the middle first, each sliding away along its explode
// direction as it fades out. The last, central part stays.
function autoDisassembly() {
  if (!state.model) return app.toast(t("Open a model first."));
  stop();
  var start = app.snapshot(), T = app.THREE;
  start.explode = 0;
  // each item scored by how far out its parts sit, less a share of their size;
  // the biggest item (usually the base or housing) stays to the end
  var items = state.bom.map(function (it) {
    var parts = it.parts.filter(function (p) { return visibleIn(start, p); });
    if (!parts.length) return null;
    var d = 0, size = 0, vol = 0;
    parts.forEach(function (p) {
      var b = app.worldBox([p]), sz = b.getSize(new T.Vector3());
      d += b.getCenter(new T.Vector3()).distanceTo(state.center);
      size += sz.length();
      vol = Math.max(vol, sz.x * sz.y * sz.z);
    });
    return { it: it, parts: parts, d: (d - size * 0.25) / parts.length, vol: vol };
  }).filter(Boolean);
  if (items.length < 2) return app.toast(t("The model needs at least two visible parts."));
  var keep = items.reduce(function (a, b) { return b.vol > a.vol ? b : a; });
  items = items.filter(function (x) { return x !== keep; });
  items.sort(function (a, b) { return b.d - a.d; });
  var steps = [], cur = clone(start), dist = state.radius * 0.9;
  steps.push(Object.assign(newStepNoThumb(clone(start)), { title: t("Assembled"), text: t("The assembly before it is taken apart.") }));
  items.forEach(function (x) {
    var s = clone(cur);
    x.parts.forEach(function (p) {
      var k = p.userData.key, d = s.parts[k] || {};
      var base = d.p ? new T.Vector3().fromArray(d.p) : p.userData.home.p.clone();
      var dir = p.userData.xdir && p.userData.xdir.lengthSq() > 1e-12 ? p.userData.xdir.clone().normalize() : null;
      if (!dir) { p.parent.updateWorldMatrix(true, false); var w = p.getWorldPosition(new T.Vector3()); dir = p.parent.worldToLocal(w.clone().add(app.Y)).sub(p.parent.worldToLocal(w.clone())).normalize(); }
      d.p = base.addScaledVector(dir, dist).toArray();
      d.v = 0;
      s.parts[k] = d;
    });
    s.callouts = [];
    var name = app.meta(x.it.name).desc || x.it.name, n = x.parts.length;
    steps.push(Object.assign(newStepNoThumb(s), {
      title: n > 1 ? t("Remove the {name} (×{n})", { name: name, n: n }) : t("Remove the {name}", { name: name }),
      text: n > 1 ? t("Remove the {n} {name}.", { n: n, name: name }) : t("Remove the {name}.", { name: name })
    }));
    cur = s;
  });
  withStates(steps.map(function (s) { return s.state; }), function (s, i) { steps[i].thumb = thumb(); });
  project.procedures.push({ id: uid(), title: t("Disassembly of {name}", { name: app.stem() }), kind: "disassembly", steps: steps, auto: true });
  ui.proc = project.procedures.length - 1; ui.step = steps[0].id;
  renderProcedures(); save();
  app.toast(t("Made {n} steps. Check the order, write the instructions, and play it.", { n: steps.length }));
}
function newStepNoThumb(st) {
  return { id: uid(), title: "", text: "", noteKind: "", note: "", tools: "", dur: 2, hold: 1.5, state: st, thumb: "" };
}
function visibleIn(s, node) {
  for (var o = node; o && o !== app.modelRoot; o = o.parent) {
    var d = s.parts[o.userData.key];
    if (d && d.v === 0) return false;
  }
  return true;
}
$("proc-auto").addEventListener("click", autoDisassembly);

// The same steps the other way round, as a new procedure: disassembly becomes
// assembly ("Remove" becomes "Install") and the other way.
$("proc-reverse").addEventListener("click", function () {
  var p = proc(); if (!p || !p.steps.length) return;
  var swap = function (s) {
    if (!s) return s;
    var pairs = [[t("Remove the"), t("Install the")], [t("Remove"), t("Install")]];
    for (var i = 0; i < pairs.length; i++) {
      if (s.indexOf(pairs[i][0]) === 0) return pairs[i][1] + s.slice(pairs[i][0].length);
      if (s.indexOf(pairs[i][1]) === 0) return pairs[i][0] + s.slice(pairs[i][1].length);
    }
    return s;
  };
  var steps = p.steps.slice().reverse().map(function (s, i, arr) {
    var c = clone(s); c.id = uid();
    // the title and text describe the motion into a step, which now happens one step later
    var src = i > 0 ? arr[i - 1] : null;
    c.title = src ? swap(src.title) : (p.kind === "disassembly" ? t("Parts laid out") : s.title);
    c.text = src ? swap(src.text) : "";
    c.noteKind = src ? src.noteKind : ""; c.note = src ? src.note : ""; c.tools = src ? src.tools : "";
    c.dur = src ? src.dur : 2;
    return c;
  });
  if (p.auto && p.kind === "disassembly") steps[steps.length - 1].title = t("Assembled");
  var kind = p.kind === "disassembly" ? "assembly" : p.kind === "assembly" ? "disassembly" : p.kind;
  var title = p.kind === "disassembly" ? t("Assembly of {name}", { name: app.stem() }) : p.kind === "assembly" ? t("Disassembly of {name}", { name: app.stem() }) : p.title + " " + t("(reversed)");
  project.procedures.push({ id: uid(), title: title, kind: kind, steps: steps });
  ui.proc = project.procedures.length - 1; ui.step = steps[0].id;
  renderProcedures(); save();
});

// ---------- figures of the illustrated parts catalogue ----------
function fig() { return project.figures.find(function (f) { return f.id === ui.fig; }) || null; }
function figItems(f) {
  var n = [];
  state.bom.forEach(function (it) { if (it.parts.some(function (p) { return visibleIn(f.state, p); })) n.push(it.no); });
  return n;
}
function renderFigures() {
  var strip = $("fig-strip");
  strip.innerHTML = "";
  project.figures.forEach(function (f) {
    strip.appendChild(card({ no: f.number, title: f.title, thumb: f.thumb, on: f.id === ui.fig, click: function () { selectFig(f.id); } }));
  });
  if (state.model) strip.appendChild(addCard(t("+ Add figure from the screen"), addFig));
  var f = fig();
  $("fig-empty").hidden = !!f; $("fig-form").hidden = !f;
  if (!f) return;
  $("fig-number").value = f.number; $("fig-title").value = f.title;
  var items = figItems(f);
  $("fig-items").textContent = t("{n} items in this figure: {list}", { n: items.length, list: items.join(", ") });
  var i = project.figures.indexOf(f);
  $("fig-left").disabled = i === 0; $("fig-right").disabled = i === project.figures.length - 1;
}
function nextFigNo() {
  var max = 0;
  project.figures.forEach(function (f) { var n = parseInt(f.number, 10); if (n > max) max = n; });
  return String(max + 1);
}
function addFig(title) {
  if (!state.model) return app.toast(t("Open a model first."));
  var f = { id: uid(), number: nextFigNo(), title: typeof title === "string" ? title : state.model.name || app.stem(), state: app.snapshot(), thumb: thumb() };
  project.figures.push(f);
  ui.fig = f.id;
  renderFigures(); save();
  if (!f.state.callouts.length && typeof title !== "string") app.toast(t("Tip: Balloon the visible parts before adding a figure, so it has item numbers."));
  return f;
}
function selectFig(id) {
  ui.fig = id;
  var f = fig();
  renderFigures();
  if (f) playSegments([{ from: app.snapshot(), to: f.state, dur: 0.6, hold: 0, step: -1 }], null, true);
}
$("fig-add").addEventListener("click", function () { addFig(); });
$("fig-balloon").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open a model first."));
  var n = app.autoBalloon();
  app.toast(n ? t("{n} callouts. Drag them to tidy up, then add or update the figure.", { n: n }) : t("No parts can be seen inside the frame."));
});
$("fig-clear").addEventListener("click", function () { app.clearCallouts(); });
$("fig-auto").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open a model first."));
  stop();
  var now = app.snapshot(), nodes = [state.model];
  state.nodes.forEach(function (n) { if (n !== state.model && !n.userData.isPart && app.treeKids(n).length) nodes.push(n); });
  // one figure per assembly name (two copies of a sub-assembly need one figure)
  var seen = new Set(), made = 0;
  nodes.forEach(function (n) {
    var name = app.displayName(n);
    if (seen.has(name)) return;
    seen.add(name);
    app.applyState(Object.assign(clone(now), { parts: {}, explode: 0, callouts: [], camera: null }), { ui: false, camera: false });
    var keep = new Set();
    n.traverse(function (c) { keep.add(c); });
    for (var p = n; p && p !== app.modelRoot; p = p.parent) keep.add(p);
    state.nodes.forEach(function (o) { o.visible = keep.has(o); });
    app.fit([n], 0, new app.THREE.Vector3().fromArray(app.VIEWS.iso), app.Y);
    app.autoBalloon();
    addFig(name);
    made++;
  });
  app.applyState(now);
  renderFigures();
  app.toast(t("Made {n} figures.", { n: made }));
});
$("fig-number").addEventListener("input", function () { var f = fig(); if (f) { f.number = this.value; refreshFigCard(f); save(); } });
$("fig-title").addEventListener("input", function () { var f = fig(); if (f) { f.title = this.value; refreshFigCard(f); save(); } });
function refreshFigCard(f) {
  var li = $("fig-strip").children[project.figures.indexOf(f)];
  if (!li) return;
  li.querySelector("b").textContent = f.number; li.querySelector("span").textContent = f.title;
}
$("fig-update").addEventListener("click", function () {
  var f = fig(); if (!f) return;
  f.state = app.snapshot(); f.thumb = thumb();
  renderFigures(); save();
  app.toast(t("Figure {n} updated.", { n: f.number }));
});
$("fig-delete").addEventListener("click", function () {
  var f = fig(); if (!f) return;
  var i = project.figures.indexOf(f);
  project.figures.splice(i, 1);
  ui.fig = project.figures[Math.min(i, project.figures.length - 1)] ? project.figures[Math.min(i, project.figures.length - 1)].id : null;
  renderFigures(); save();
});
function moveFig(d) {
  var f = fig(); if (!f) return;
  var i = project.figures.indexOf(f), j = i + d; if (j < 0 || j >= project.figures.length) return;
  project.figures.splice(i, 1); project.figures.splice(j, 0, f);
  renderFigures(); save();
}
$("fig-left").addEventListener("click", function () { moveFig(document.dir === "rtl" ? 1 : -1); });
$("fig-right").addEventListener("click", function () { moveFig(document.dir === "rtl" ? -1 : 1); });

// ---------- views ----------
function view() { return project.views.find(function (v) { return v.id === ui.view; }) || null; }
function renderViews() {
  var strip = $("views-list");
  strip.innerHTML = "";
  project.views.forEach(function (v, i) {
    strip.appendChild(card({ no: i + 1, title: v.name, thumb: v.thumb, on: v.id === ui.view, click: function () { selectView(v.id); } }));
  });
  if (state.model) strip.appendChild(addCard(t("+ Save this view"), addView));
  var v = view();
  $("view-empty").hidden = !!v; $("view-form").hidden = !v;
  if (v) $("view-name").value = v.name;
  $("btn-views-zip").disabled = !project.views.length;
}
function addView() {
  if (!state.model) return app.toast(t("Open a model first."));
  var v = { id: uid(), name: t("View {n}", { n: project.views.length + 1 }), state: app.snapshot(), thumb: thumb() };
  project.views.push(v);
  renderViews(); save();
  ui.view = v.id;
  renderViews();
}
function selectView(id) {
  var v = project.views.find(function (x) { return x.id === id; });
  if (!v) return;
  playSegments([{ from: app.snapshot(), to: v.state, dur: 0.5, hold: 0, step: -1 }], null, true);
  // the glide's own "change" events clear the highlight; set it after
  setTimeout(function () { ui.view = id; renderViews(); }, 0);
  ui.view = id; renderViews();
}
$("btn-view-add").addEventListener("click", addView);
$("view-name").addEventListener("input", function () {
  var v = view(); if (!v) return;
  v.name = this.value;
  var li = $("views-list").children[project.views.indexOf(v)];
  if (li) li.querySelector("span").textContent = v.name;
  save();
});
$("view-update").addEventListener("click", function () {
  var v = view(); if (!v) return;
  v.state = app.snapshot(); v.thumb = thumb();
  renderViews(); save();
});
$("view-delete").addEventListener("click", function () {
  var v = view(); if (!v) return;
  project.views.splice(project.views.indexOf(v), 1);
  ui.view = null;
  renderViews(); save();
});
$("view-to-step").addEventListener("click", function () {
  var v = view(); if (!v) return;
  var p = ensureProc(), s = newStep(clone(v.state), v.name);
  s.thumb = v.thumb;
  p.steps.push(s); ui.step = s.id;
  renderProcedures(); save();
  app.toast(t("Added to “{name}” as step {n}.", { name: p.title, n: p.steps.length }));
});
$("view-to-fig").addEventListener("click", function () {
  var v = view(); if (!v) return;
  var f = { id: uid(), number: nextFigNo(), title: v.name, state: clone(v.state), thumb: v.thumb };
  project.figures.push(f); ui.fig = f.id;
  renderFigures(); save();
  app.toast(t("Added as figure {n}.", { n: f.number }));
});
$("btn-views-zip").addEventListener("click", async function () {
  if (!project.views.length) return;
  app.busy(t("Making the images…"));
  var now = app.snapshot(), files = [], o = app.shotOptions();
  try {
    for (var i = 0; i < project.views.length; i++) {
      var v = project.views[i];
      app.applyState(v.state, { ui: false });
      var blob = await app.toBlob(app.capture(o), o.format);
      var safe = v.name.replace(/[\\/:*?"<>|]+/g, "-");
      files.push({ name: String(i + 1).padStart(2, "0") + " " + safe + (o.format === "jpeg" ? ".jpg" : ".png"), bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    app.download(makeZip(files), app.stem() + " - " + t("views") + ".zip");
  } catch (err) { app.toast(err.message, true); }
  finally { app.applyState(now); app.busy(false); }
});

renderAll();
app.isPlaying = function () { return !!player; };

export var story = {
  project: function () { return project; }, figItems: figItems, visibleIn: visibleIn, captionText: captionText, NOTE: NOTE,
  isPlaying: function () { return !!player; }
};
