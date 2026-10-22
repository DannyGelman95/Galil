// Publish: one HTML file that holds the whole manual — the model's geometry,
// the procedures, the illustrated parts catalogue, the parts list, a picture of
// every step and figure, three.js and the viewer (ietm/viewer.js).
import { app } from "./studio.js";
import { story } from "./story.js";

var $ = app.$, t = app.t, state = app.state;

function b64(typed) {
  var u8 = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength), s = "";
  for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function floats(attr) {
  var a = new Float32Array(attr.count * attr.itemSize);
  for (var i = 0; i < attr.count; i++) for (var k = 0; k < attr.itemSize; k++) a[i * attr.itemSize + k] = attr.getComponent(i, k);
  return a;
}

// The model as a flat list of nodes (parents first) and their geometries.
function serialize() {
  var geoms = [], gi = new Map(), nodes = [];
  function geom(g) {
    if (gi.has(g)) return gi.get(g);
    var rec = { p: b64(floats(g.attributes.position)) };
    if (g.attributes.normal) rec.n = b64(floats(g.attributes.normal));
    if (g.attributes.color) rec.c = b64(floats(g.attributes.color));
    if (g.index) {
      var max = 0, arr = g.index.array;
      for (var i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
      if (max < 65536) { rec.i = b64(Uint16Array.from(arr)); rec.i16 = 1; } else rec.i = b64(Uint32Array.from(arr));
    }
    gi.set(g, geoms.length);
    geoms.push(rec);
    return geoms.length - 1;
  }
  function add(o, pa, key) {
    var ud = o.userData, h = ud.home;
    var rec = { k: key, pa: pa, n: o.name || "", p: (h ? h.p : o.position).toArray(), q: (h ? h.q : o.quaternion).toArray(), s: o.scale.toArray() };
    if (ud.isPart) rec.part = 1;
    if (ud.xdir) rec.x = ud.xdir.toArray();
    if (o.isMesh) {
      var or = ud.orig[0];
      rec.g = geom(o.geometry); rec.c = "#" + or.color.getHexString(); rec.o = or.opacity;
      if (or.vc) rec.vc = 1;
    }
    var me = nodes.length;
    nodes.push(rec);
    if (ud.isPart && !o.isMesh) o.children.forEach(function (c) { if (c.isMesh) add(c, me, app.innerKey(c)); });
    else if (!o.isMesh) app.treeKids(o).forEach(function (c, i) { add(c, me, key + "." + i); });
  }
  add(state.model, -1, "0");
  return { nodes: nodes, geoms: geoms, radius: state.radius, center: state.center.toArray() };
}

function labels() {
  var L = {
    procedures: "Procedures", ipc: "Illustrated parts catalogue", partsList: "Parts list", step: "Step", stepOf: "Step {n} of {m}",
    previous: "Previous", next: "Next", playAll: "Play from here", stop: "Stop", figure: "Figure", item: "Item",
    partNumber: "Part number", description: "Description", qty: "Qty", tools: "Tools and materials", note: "Note",
    caution: "Caution", warning: "Warning", print: "Print or save as PDF", contents: "Contents", document: "Document",
    revision: "Revision", date: "Date", publisher: "Publisher", model: "Model", resetView: "Reset view", explode: "Explode",
    clickPart: "Click a part in the picture, or a row in the table, to find it.", partsShown: "Parts in this step"
  };
  Object.keys(L).forEach(function (k) { L[k] = t(L[k]); });
  return L;
}

// A frame of the given shape inside the view, like the image frame.
function frameFor(aspect) {
  var vp = $("viewport"), w = vp.clientWidth, h = vp.clientHeight, pad = 14;
  var fw = w - pad * 2, fh = fw / aspect;
  if (fh > h - pad * 2) { fh = h - pad * 2; fw = fh * aspect; }
  return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
}

async function text(url) {
  var r = await fetch(url);
  if (!r.ok) throw new Error(url + ": " + r.status);
  return r.text();
}
function embed(o) { return JSON.stringify(o).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029"); }

async function publish(opts) {
  var prj = story.project();
  app.busy(t("Publishing…"));
  await new Promise(function (r) { setTimeout(r, 30); });
  var now = app.snapshot();
  try {
    var parts = await Promise.all([text("ietm/template.html"), text("ietm/viewer.js"),
      opts.model ? text("vendor/three/three.module.min.js") : "", opts.model ? text("vendor/three/addons/controls/OrbitControls.js") : ""]);
    var frame = frameFor(1.5);
    // each state gets its picture and, when cut, its section plane
    var shoot = function (s) {
      app.applyState(s, { ui: false });
      var img = app.capture({ w: 1200, h: 800, ss: 2, format: "jpeg", opaque: true, frame: frame }).toDataURL("image/jpeg", 0.88);
      var st = JSON.parse(JSON.stringify(s));
      st.plane = app.sectionPlane();
      return { img: img, state: st };
    };
    var procedures = !opts.proc ? [] : prj.procedures.filter(function (p) { return p.steps.length; }).map(function (p) {
      return {
        title: p.title, kind: p.kind,
        steps: p.steps.map(function (s) {
          var sh = shoot(s.state);
          return { title: s.title, text: s.text, noteKind: s.noteKind, note: s.note, tools: s.tools, dur: s.dur, hold: s.hold, state: sh.state, img: sh.img };
        })
      };
    });
    var figures = !opts.ipc ? [] : prj.figures.map(function (f) {
      var sh = shoot(f.state);
      return { number: f.number, title: f.title, items: story.figItems(f), state: sh.state, img: sh.img };
    });
    var home = shoot(now);
    var bom = state.bom.map(function (it) {
      var m = app.meta(it.name);
      return { no: it.no, name: it.name, pn: m.pn || "", desc: m.desc || "", uom: m.uom || "EA", notes: m.notes || "", qty: it.parts.length, keys: it.parts.map(function (p) { return p.userData.key; }) };
    });
    var data = {
      meta: {
        title: opts.title, doc: opts.doc, rev: opts.rev, org: opts.org, model: state.file, units: state.units ? t(state.units) : "",
        date: new Date().toISOString().slice(0, 10), lang: app.lang(), dir: app.lang() === "he" ? "rtl" : "ltr"
      },
      labels: labels(), bom: bom, procedures: procedures, figures: figures, home: home.state,
      scene: opts.model ? serialize() : null
    };
    var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
    var html = parts[0]
      .replace("__TITLE__", function () { return esc(opts.title); })
      .replace("__DATA__", function () { return embed(data); })
      .replace("__THREE__", function () { return opts.model ? embed(parts[2]) : '""'; })
      .replace("__ORBIT__", function () { return opts.model ? embed(parts[3]) : '""'; })
      .replace("__VIEWER__", function () { return parts[1].replace(/<\/script/gi, "<\\/script"); });
    var blob = new Blob([html], { type: "text/html" });
    var name = (opts.doc ? opts.doc + " " : "") + opts.title.replace(/[\\/:*?"<>|]+/g, "-") + ".html";
    app.download(blob, name);
    app.toast(t("Published {name} ({size} MB). Open it in any browser; Print makes the PDF.", { name: name, size: (blob.size / 1048576).toFixed(1) }), false, 8000);
  } catch (err) {
    console.error(err);
    app.toast(t("Publishing failed: {msg}", { msg: err.message }), true, 9000);
  } finally {
    app.applyState(now);
    app.busy(false);
  }
}

var PUB_KEY = "galil-model-studio-publish";
$("btn-publish").addEventListener("click", function () {
  if (!state.model) return app.toast(t("Open a model first."));
  var prj = story.project(), saved = {};
  try { saved = JSON.parse(localStorage.getItem(PUB_KEY) || "{}"); } catch (e) { saved = {}; }
  $("pub-title").value = (saved.file === state.file && saved.title) || app.stem();
  $("pub-doc").value = saved.file === state.file ? saved.doc || "" : "";
  $("pub-rev").value = saved.file === state.file ? saved.rev || "A" : "A";
  $("pub-org").value = saved.org || "GALIL";
  $("pub-proc").disabled = !prj.procedures.some(function (p) { return p.steps.length; });
  $("pub-ipc").disabled = !prj.figures.length;
  $("dlg-publish").returnValue = "";
  $("dlg-publish").showModal();
});
$("dlg-publish").addEventListener("close", function () {
  if (this.returnValue !== "ok") return;
  var opts = {
    title: $("pub-title").value.trim() || app.stem(), doc: $("pub-doc").value.trim(), rev: $("pub-rev").value.trim(), org: $("pub-org").value.trim(),
    proc: $("pub-proc").checked && !$("pub-proc").disabled, ipc: $("pub-ipc").checked && !$("pub-ipc").disabled, model: $("pub-model").checked
  };
  try { localStorage.setItem(PUB_KEY, JSON.stringify({ file: state.file, title: opts.title, doc: opts.doc, rev: opts.rev, org: opts.org })); } catch (e) { /* blocked */ }
  publish(opts);
});

export { publish };
