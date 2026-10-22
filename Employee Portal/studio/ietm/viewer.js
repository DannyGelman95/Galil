// The interactive manual made by Model Studio's Publish: contents, procedures
// with animated steps, the illustrated parts catalogue and the parts list, a
// 3D view where parts can be identified, and a print layout. Classic script:
// three.js is loaded on demand from the module URLs the page prepares, and
// when it cannot load the manual shows the published pictures instead.
(function () {
  "use strict";
  var D = JSON.parse(document.getElementById("pub-data").textContent);
  var L = D.labels, M = D.meta;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  document.documentElement.lang = M.lang || "en";
  document.documentElement.dir = M.dir || "ltr";
  document.title = M.title;

  var itemsByNo = {}, itemOfKey = {};
  D.bom.forEach(function (it) { itemsByNo[it.no] = it; it.keys.forEach(function (k) { itemOfKey[k] = it; }); });
  var cur = null, view3d = null, playing = null;

  // ---------- header ----------
  $("h-title").textContent = M.title;
  $("h-doc").textContent = [M.doc, M.rev ? L.revision + " " + M.rev : "", M.date].filter(Boolean).join(" · ");
  $("btn-print").textContent = L.print;
  $("btn-print").addEventListener("click", function () { window.print(); });
  $("btn-reset").textContent = L.resetView;
  $("btn-explode").textContent = L.explode;

  // ---------- contents ----------
  function navButton(html, fn) {
    var b = document.createElement("button");
    b.innerHTML = html;
    b.addEventListener("click", fn);
    return b;
  }
  var nav = $("nav"), navMap = [];
  function heading(text) { var h = document.createElement("h3"); h.textContent = text; nav.appendChild(h); }
  if (D.procedures.length) {
    heading(L.procedures);
    D.procedures.forEach(function (p, pi) {
      var box = document.createElement("div"); box.className = "proc";
      var head = navButton(esc(p.title), function () { show({ type: "step", p: pi, i: 0 }); });
      box.appendChild(head);
      var ol = document.createElement("div"); ol.className = "steps";
      p.steps.forEach(function (s, i) {
        var b = navButton("<b>" + (i + 1) + "<\/b>" + esc(s.title || L.step + " " + (i + 1)), function () { show({ type: "step", p: pi, i: i }); });
        navMap.push({ key: "s" + pi + "." + i, el: b });
        ol.appendChild(b);
      });
      box.appendChild(ol);
      nav.appendChild(box);
    });
  }
  if (D.figures.length) {
    heading(L.ipc);
    D.figures.forEach(function (f, i) {
      var b = navButton(esc(L.figure + " " + f.number + " — " + f.title), function () { show({ type: "fig", i: i }); });
      navMap.push({ key: "f" + i, el: b });
      nav.appendChild(b);
    });
  }
  heading(L.partsList);
  var bAll = navButton(esc(L.partsList + " (" + D.bom.length + ")"), function () { show({ type: "bom" }); });
  navMap.push({ key: "bom", el: bAll });
  nav.appendChild(bAll);

  function markNav(key) { navMap.forEach(function (n) { n.el.classList.toggle("on", n.key === key); }); }

  // ---------- content ----------
  function partsTable(nos, qtyOf) {
    var rows = nos.map(function (no) {
      var it = itemsByNo[no]; if (!it) return "";
      return '<tr data-no="' + no + '"><td class="n">' + no + '<\/td><td><span class="pn">' + esc(it.pn || "—") + "<\/span><\/td><td>" + esc(it.desc || it.name) +
        (it.notes ? '<div class="small">' + esc(it.notes) + "<\/div>" : "") + '<\/td><td class="q">' + (qtyOf ? qtyOf(it) : it.qty) + " " + esc(it.uom || "") + "<\/td><\/tr>";
    }).join("");
    return "<table><thead><tr><th>" + esc(L.item) + "<\/th><th>" + esc(L.partNumber) + "<\/th><th>" + esc(L.description) + "<\/th><th>" + esc(L.qty) + "<\/th><\/tr><\/thead><tbody>" + rows + "<\/tbody><\/table>";
  }
  function notice(kind, text) {
    if (!kind || !text) return "";
    return '<div class="notice ' + kind + '"><b>' + esc(L[kind]).toUpperCase() + "<\/b>" + esc(text) + "<\/div>";
  }

  // opts.instant: no animation; opts.keepScene: leave the 3D view alone
  function show(c, opts) {
    opts = opts || {};
    stopPlay();
    cur = c;
    var html = "", st = null;
    if (c.type === "step") {
      var p = D.procedures[c.p], s = p.steps[c.i];
      st = s;
      markNav("s" + c.p + "." + c.i);
      html = '<div class="kicker">' + esc(p.title) + " · " + esc(L.stepOf.replace("{n}", c.i + 1).replace("{m}", p.steps.length)) + "<\/div>" +
        "<h2>" + esc(s.title || L.step + " " + (c.i + 1)) + "<\/h2>" + notice(s.noteKind, s.note) +
        '<div class="text">' + esc(s.text) + "<\/div>" + (s.tools ? '<div class="tools"><b>' + esc(L.tools) + ":<\/b> " + esc(s.tools) + "<\/div>" : "") +
        '<div class="controls"><button id="b-prev">' + esc(L.previous) + '<\/button><button id="b-next" class="primary">' + esc(L.next) +
        '<\/button><button id="b-play">' + esc(L.playAll) + "<\/button><\/div>";
      var used = itemsIn(s.state);
      if (used.length) html += '<h3 class="small">' + esc(L.partsShown) + "<\/h3>" + partsTable(used);
    } else if (c.type === "fig") {
      var f = D.figures[c.i];
      st = f;
      markNav("f" + c.i);
      html = '<div class="kicker">' + esc(L.ipc) + "<\/div><h2>" + esc(L.figure + " " + f.number + " — " + f.title) + "<\/h2>" +
        '<div class="small">' + esc(L.clickPart) + "<\/div>" + partsTable(f.items);
    } else {
      markNav("bom");
      html = '<div class="kicker">' + esc(M.model) + "<\/div><h2>" + esc(L.partsList) + "<\/h2>" + '<div class="small">' + esc(L.clickPart) + "<\/div>" +
        partsTable(D.bom.map(function (it) { return it.no; }));
    }
    $("content").innerHTML = html;
    $("content").scrollTop = 0;
    wireContent();
    if (opts.keepScene) return;
    if (st) setScene(st, !opts.instant);
    else if (view3d) view3d.goHome();
    else showStill(D.figures[0] || (D.procedures[0] && D.procedures[0].steps[0]));
  }

  function wireContent() {
    var prev = $("b-prev"), next = $("b-next"), play = $("b-play");
    if (prev) {
      var p = D.procedures[cur.p];
      prev.disabled = cur.i === 0; next.disabled = cur.i === p.steps.length - 1;
      prev.addEventListener("click", function () { show({ type: "step", p: cur.p, i: cur.i - 1 }); });
      next.addEventListener("click", function () { show({ type: "step", p: cur.p, i: cur.i + 1 }); });
      play.addEventListener("click", function () { if (playing) stopPlay(); else playFrom(cur.p, cur.i); });
      play.disabled = !view3d;
    }
    Array.prototype.forEach.call(document.querySelectorAll("#content tbody tr"), function (tr) {
      tr.addEventListener("click", function () { pickItem(+tr.dataset.no, true); });
    });
  }
  function pickItem(no, fromTable) {
    Array.prototype.forEach.call(document.querySelectorAll("#content tbody tr"), function (tr) {
      var on = +tr.dataset.no === no;
      tr.classList.toggle("on", on);
      if (on && !fromTable) tr.scrollIntoView({ block: "nearest" });
    });
    if (view3d) view3d.highlight(no && itemsByNo[no] ? itemsByNo[no].keys : []);
  }

  function itemsIn(s) {
    var hidden = {};
    Object.keys(s.parts).forEach(function (k) { if (s.parts[k].v === 0) hidden[k] = 1; });
    return D.bom.filter(function (it) {
      return it.keys.some(function (k) {
        var parts = k.split("."), path = "";
        for (var i = 0; i < parts.length; i++) { path = path ? path + "." + parts[i] : parts[i]; if (hidden[path]) return false; }
        return true;
      });
    }).map(function (it) { return it.no; });
  }

  // ---------- the stage ----------
  function showStill(x) {
    var img = $("still");
    if (x && x.img) { img.src = x.img; img.hidden = false; } else img.hidden = true;
  }
  function setScene(x, animate) {
    if (view3d) { $("still").hidden = true; view3d.go(x.state, animate ? 0.9 : 0); }
    else showStill(x);
  }

  function playFrom(pi, i) {
    if (!view3d) return;
    var p = D.procedures[pi];
    playing = { p: pi, i: i, t: 0 };
    $("b-play").textContent = L.stop;
    (function stepTo(j) {
      if (!playing) return;
      cur = { type: "step", p: pi, i: j };
      renderStepOnly(pi, j);
      var s = p.steps[j];
      view3d.go(s.state, j === i ? 0.8 : s.dur || 0.01, function () {
        if (!playing) return;
        playing.timer = setTimeout(function () {
          if (!playing) return;
          if (j + 1 < p.steps.length) stepTo(j + 1); else stopPlay();
        }, (s.hold || 1) * 1000);
      });
    })(i);
  }
  function renderStepOnly(pi, j) {
    var keep = playing;
    playing = null;
    show({ type: "step", p: pi, i: j }, { keepScene: true });
    playing = keep;
    if ($("b-play")) $("b-play").textContent = L.stop;
  }
  function stopPlay() {
    if (!playing) return;
    clearTimeout(playing.timer);
    playing = null;
    if ($("b-play")) $("b-play").textContent = L.playAll;
  }

  // ---------- print layout ----------
  function buildPrint() {
    var h = '<div class="page"><h1>' + esc(M.title) + "<\/h1><table class=\"meta\">" +
      [[L.document, M.doc], [L.revision, M.rev], [L.date, M.date], [L.publisher, M.org], [L.model, M.model]]
        .filter(function (r) { return r[1]; }).map(function (r) { return "<tr><td><b>" + esc(r[0]) + "<\/b><\/td><td>" + esc(r[1]) + "<\/td><\/tr>"; }).join("") +
      "<\/table><h3>" + esc(L.contents) + "<\/h3><ol>" +
      D.procedures.map(function (p) { return "<li>" + esc(p.title) + "<\/li>"; }).join("") +
      (D.figures.length ? "<li>" + esc(L.ipc) + "<\/li>" : "") + "<li>" + esc(L.partsList) + "<\/li><\/ol><\/div>";
    D.procedures.forEach(function (p) {
      h += '<div class="page"><h2>' + esc(p.title) + "<\/h2>";
      p.steps.forEach(function (s, i) {
        h += '<div class="step"><h3>' + esc(L.step + " " + (i + 1) + ". " + (s.title || "")) + "<\/h3>" + notice(s.noteKind, s.note) +
          (s.img ? '<img src="' + s.img + '" alt="">' : "") + '<div class="text">' + esc(s.text) + "<\/div>" +
          (s.tools ? '<div class="tools"><b>' + esc(L.tools) + ":<\/b> " + esc(s.tools) + "<\/div>" : "") + "<\/div>";
      });
      h += "<\/div>";
    });
    D.figures.forEach(function (f) {
      h += '<div class="page figure"><h2>' + esc(L.figure + " " + f.number + " — " + f.title) + "<\/h2>" + (f.img ? '<img src="' + f.img + '" alt="">' : "") + partsTable(f.items) + "<\/div>";
    });
    h += '<div class="page"><h2>' + esc(L.partsList) + "<\/h2>" + partsTable(D.bom.map(function (it) { return it.no; })) + "<\/div>";
    $("print").innerHTML = h;
  }

  // ---------- 3D ----------
  async function start3d() {
    if (!D.scene || !window.__three) return null;
    var THREE = await import(window.__three);
    var OrbitControls = (await import(window.__orbit)).OrbitControls;
    var S = D.scene, stage = $("stage"), canvas = $("c"), ov = $("ov");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    var hemi = new THREE.HemisphereLight(0xffffff, 0x9AA6B8, 1.9), head = new THREE.DirectionalLight(0xffffff, 1.5), amb = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(hemi, amb, head, head.target);
    var root = new THREE.Group();
    scene.add(root);
    var persp = new THREE.PerspectiveCamera(35, 1, 0.1, 1e6), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e6, 1e6);
    var camera = persp, R = S.radius, center = new THREE.Vector3().fromArray(S.center);
    var controls = new OrbitControls(persp, canvas);
    controls.screenSpacePanning = true;

    function bytes(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
    var geoms = S.geoms.map(function (g) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(bytes(g.p)), 3));
      if (g.n) geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(bytes(g.n)), 3));
      if (g.c) geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(bytes(g.c)), 3));
      if (g.i) geo.setIndex(new THREE.BufferAttribute(g.i16 ? new Uint16Array(bytes(g.i)) : new Uint32Array(bytes(g.i)), 1));
      if (!g.n) geo.computeVertexNormals();
      return geo;
    });
    var nodes = [], byKey = {}, meshes = [];
    S.nodes.forEach(function (n) {
      var o;
      if (n.g != null) {
        var mat = new THREE.MeshStandardMaterial({ color: n.c, opacity: n.o == null ? 1 : n.o, transparent: n.o < 1, vertexColors: !!n.vc, metalness: 0, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
        o = new THREE.Mesh(geoms[n.g], mat);
        var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geoms[n.g], 30), new THREE.LineBasicMaterial({ color: 0x1B2433 }));
        edges.raycast = function () {};
        o.add(edges);
        o.userData.edges = edges;
        o.userData.c = n.c; o.userData.o = n.o == null ? 1 : n.o; o.userData.vc = !!n.vc;
        meshes.push(o);
      } else o = new THREE.Group();
      o.name = n.n;
      o.position.fromArray(n.p); o.quaternion.fromArray(n.q); o.scale.fromArray(n.s);
      o.userData.n = n;
      o.userData.home = { p: o.position.clone(), q: o.quaternion.clone() };
      o.userData.x = n.x ? new THREE.Vector3().fromArray(n.x) : null;
      (n.pa < 0 ? root : nodes[n.pa]).add(o);
      nodes.push(o);
      if (n.k) byKey[n.k] = o;
    });
    meshes.forEach(function (m) {
      // the part a mesh belongs to: itself, or the part group around it
      var p = m;
      while (p && !(p.userData.n && p.userData.n.part)) p = p.parent;
      m.userData.partKey = p ? p.userData.n.k : m.userData.n.k;
    });

    var cur = null, anim = null, hl = new Set(), explodeExtra = 0;
    var plane = new THREE.Plane();

    function size() { return { w: Math.max(1, stage.clientWidth), h: Math.max(1, stage.clientHeight) }; }
    function resize() {
      var s = size();
      renderer.setSize(s.w, s.h, false);
      persp.aspect = s.w / s.h; persp.updateProjectionMatrix();
      var b = R * 1.2;
      ortho.top = b; ortho.bottom = -b; ortho.left = -b * s.w / s.h; ortho.right = b * s.w / s.h; ortho.updateProjectionMatrix();
      dirty = true;
    }
    var dirty = true;
    controls.addEventListener("change", function () { dirty = true; });
    new ResizeObserver(resize).observe(stage);

    function poseOf(c) {
      return { target: new THREE.Vector3().fromArray(c.target), dir: new THREE.Vector3().fromArray(c.dir).normalize(), dist: c.dist, up: new THREE.Vector3().fromArray(c.up), zoom: c.zoom };
    }
    function curPose() {
      return { target: controls.target.clone(), dir: camera.position.clone().sub(controls.target).normalize(), dist: camera.position.distanceTo(controls.target), up: camera.up.clone(), zoom: camera.zoom };
    }
    function setPose(p) {
      controls.target.copy(p.target);
      camera.up.copy(p.up).normalize();
      camera.position.copy(p.target).addScaledVector(p.dir, p.dist);
      camera.zoom = p.zoom;
      camera.lookAt(p.target);
      camera.updateProjectionMatrix();
      controls._quat.setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
      controls._quatInverse.copy(controls._quat).invert();
      controls.update();
      dirty = true;
    }
    function useCamera(proj) {
      var want = proj === "ortho" ? ortho : persp;
      if (want === camera) return;
      camera = want; controls.object = camera; resize();
    }

    var WHITE = new THREE.Color(0xffffff);
    function look(m, fade) {
      var st = cur && cur.style || "shaded", ud = m.userData, mat = m.material;
      var color = new THREE.Color(ud.color || ud.c), op = (ud.opacity != null ? ud.opacity : ud.o) * fade;
      mat.vertexColors = ud.vc && !ud.color && st !== "lines";
      mat.toneMapped = st !== "lines";
      mat.emissive.set(0x000000); mat.emissiveIntensity = 1;
      if (st === "technical") mat.color.copy(color).lerp(WHITE, 0.45);
      else if (st === "lines") { mat.color.set(0x000000); mat.emissive.set(0xffffff); }
      else mat.color.copy(color);
      if (hl.has(ud.partKey)) { mat.emissive.set(0xF08A24); mat.emissiveIntensity = st === "lines" ? 1 : 0.45; }
      var xray = st === "xray", wire = st === "wire";
      mat.opacity = xray ? Math.min(op, 0.2) : op;
      mat.transparent = xray || op < 0.999;
      mat.depthWrite = !xray && !wire && op >= 0.999;
      mat.colorWrite = !wire;
      mat.side = cur && cur.plane ? THREE.DoubleSide : THREE.FrontSide;
      mat.needsUpdate = true;
      ud.edges.visible = st !== "shaded" && fade > 0.4;
    }

    function visible(s, k) { var d = s.parts[k]; return !(d && d.v === 0); }
    // puts the scene at e between states A and B
    function pose3d(A, B, e) {
      var ex = ((A.explode || 0) + ((B.explode || 0) - (A.explode || 0)) * e + explodeExtra) * 1.4;
      var fades = new Map();
      nodes.forEach(function (o) {
        var n = o.userData.n, k = n.k, h = o.userData.home;
        var a = (k && A.parts[k]) || {}, b = (k && B.parts[k]) || {};
        var pa = a.p ? new THREE.Vector3().fromArray(a.p) : h.p, pb = b.p ? new THREE.Vector3().fromArray(b.p) : h.p;
        o.position.lerpVectors(pa, pb, e);
        if (n.part && o.userData.x) o.position.addScaledVector(o.userData.x, ex);
        var qa = a.q ? new THREE.Quaternion().fromArray(a.q) : h.q, qb = b.q ? new THREE.Quaternion().fromArray(b.q) : h.q;
        o.quaternion.slerpQuaternions(qa, qb, e);
        var va = !k || visible(A, k), vb = !k || visible(B, k);
        o.visible = e >= 1 ? vb : va || vb;
        var f = va === vb || e >= 1 ? 1 : va ? 1 - e : e;
        fades.set(o, f * (o.parent && fades.has(o.parent) ? fades.get(o.parent) : 1));
        if (o.isMesh) {
          o.userData.color = (e < 0.5 ? a.c : b.c) || null;
          var oa = a.o != null ? a.o : null, ob = b.o != null ? b.o : null;
          o.userData.opacity = oa == null && ob == null ? null : (oa == null ? 1 : oa) + ((ob == null ? 1 : ob) - (oa == null ? 1 : oa)) * e;
        }
      });
      meshes.forEach(function (m) { look(m, fades.get(m)); });
      root.rotation.x = B.zUp ? -Math.PI / 2 : 0;
      dirty = true;
    }

    function go(s, dur, done) {
      var from = cur;
      cur = s;
      useCamera(s.camera ? s.camera.proj : "persp");
      renderer.clippingPlanes = s.plane ? [plane.set(new THREE.Vector3(s.plane[0], s.plane[1], s.plane[2]), s.plane[3])] : [];
      scene.background = new THREE.Color(s.bg === "dark" ? "#262D3A" : s.bg === "light" ? "#EDF0F5" : s.bg === "custom" ? s.bgColor : s.bg === "gradient" ? "#E6EBF2" : "#ffffff");
      var p0 = curPose(), p1 = s.camera ? poseOf(s.camera) : p0;
      var qd = new THREE.Quaternion().setFromUnitVectors(p0.dir, p1.dir), qu = new THREE.Quaternion().setFromUnitVectors(p0.up.clone().normalize(), p1.up.clone().normalize());
      var A = from || s;
      if (!dur || !from) { pose3d(s, s, 1); setPose(p1); anim = null; if (done) done(); return; }
      anim = {
        t0: performance.now(), dur: dur * 1000, done: done,
        step: function (e) {
          pose3d(A, s, e);
          setPose({
            target: p0.target.clone().lerp(p1.target, e),
            dir: p0.dir.clone().applyQuaternion(new THREE.Quaternion().slerp(qd, e)),
            up: p0.up.clone().applyQuaternion(new THREE.Quaternion().slerp(qu, e)),
            dist: p0.dist + (p1.dist - p0.dist) * e, zoom: p0.zoom + (p1.zoom - p0.zoom) * e
          });
        }
      };
    }

    function frame() {
      requestAnimationFrame(frame);
      if (anim) {
        var k = Math.min(1, (performance.now() - anim.t0) / anim.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        anim.step(e);
        if (k >= 1) { var d = anim.done; anim = null; if (d) d(); }
      }
      if (!dirty) return;
      dirty = false;
      var dist = camera.position.distanceTo(center), r = R * (1.6 + explodeExtra * 2.4);
      camera.near = camera.isPerspectiveCamera ? Math.max(R * 1e-4, dist - r * 1.5) : dist - r * 3;
      camera.far = dist + r * 3;
      camera.updateProjectionMatrix();
      head.position.copy(camera.position); head.target.position.copy(controls.target);
      renderer.render(scene, camera);
      drawCallouts();
    }

    function shownNode(node) { for (var o = node; o && o !== root; o = o.parent) if (!o.visible) return false; return true; }
    function scr(p, s) { var v = p.clone().project(camera); return { x: (v.x + 1) / 2 * s.w, y: (1 - v.y) / 2 * s.h, z: v.z }; }
    function drawCallouts() {
      var s = size(), html = "";
      // motion lines: from where each moved part sits as designed to where it is
      if (cur && cur.trails) nodes.forEach(function (o) {
        if (o.parent === root || !shownNode(o)) return;
        o.parent.updateWorldMatrix(true, false);
        var d = o.parent.localToWorld(o.userData.home.p.clone()).sub(o.parent.localToWorld(o.position.clone()));
        if (d.length() < R * 0.02) return;
        var box = new THREE.Box3().setFromObject(o);
        if (box.isEmpty()) return;
        var c1 = box.getCenter(new THREE.Vector3()), a = scr(c1.clone().add(d), s), b = scr(c1, s);
        if (a.z > 1 || b.z > 1) return;
        html += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#5C6B82" stroke-width="1.3" stroke-dasharray="6 4"/>' +
          '<circle cx="' + a.x + '" cy="' + a.y + '" r="3" fill="#fff" stroke="#5C6B82" stroke-width="1.3"/>';
      });
      if (cur && !anim) (cur.measures || []).forEach(function (m) {
        var na = byKey[m.a.key], nb = byKey[m.b.key];
        if (!na || !nb || !shownNode(na) || !shownNode(nb)) return;
        var A = na.localToWorld(new THREE.Vector3().fromArray(m.a.local)), B = nb.localToWorld(new THREE.Vector3().fromArray(m.b.local));
        var a = scr(A, s), b = scr(B, s);
        if (a.z > 1 || b.z > 1) return;
        var dd = A.distanceTo(B), text = dd.toFixed(dd < 10 ? 2 : 1) + (M.units ? " " + M.units : ""), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, wd = 10 + text.length * 6.6;
        html += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#B42318" stroke-width="1.6"/>' +
          '<circle cx="' + a.x + '" cy="' + a.y + '" r="3.2" fill="#B42318"/><circle cx="' + b.x + '" cy="' + b.y + '" r="3.2" fill="#B42318"/>' +
          '<rect x="' + (mx - wd / 2) + '" y="' + (my - 11) + '" width="' + wd + '" height="22" rx="5" fill="#fff" stroke="#B42318" stroke-width="1.4"/>' +
          '<text x="' + mx + '" y="' + (my + 4.3) + '" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="700" fill="#B42318">' + esc(text) + "<\/text>";
      });
      if (cur && !anim) (cur.callouts || []).forEach(function (c) {
        var node = byKey[c.key]; if (!node) return;
        for (var o = node; o && o !== root; o = o.parent) if (!o.visible) return;
        var v = node.localToWorld(new THREE.Vector3().fromArray(c.local)).project(camera);
        if (v.z > 1) return;
        var ax = (v.x + 1) / 2 * s.w, ay = (1 - v.y) / 2 * s.h, bx = ax + c.dx, by = ay + c.dy;
        var it = itemOfKey[c.key], text = c.text || (it ? String(it.no) : node.name);
        var r = text.length > 2 ? 6 + text.length * 3.6 : 12;
        html += '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '" stroke="#1C2D4A" stroke-width="1.5"/><circle cx="' + ax + '" cy="' + ay + '" r="2.5" fill="#1C2D4A"/>' +
          (text.length > 2 ? '<rect x="' + (bx - r) + '" y="' + (by - 12) + '" width="' + r * 2 + '" height="24" rx="12" fill="#fff" stroke="#1C2D4A" stroke-width="1.5"/>'
            : '<circle cx="' + bx + '" cy="' + by + '" r="12" fill="#fff" stroke="#1C2D4A" stroke-width="1.5"/>') +
          '<text x="' + bx + '" y="' + (by + 4.2) + '" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="700" fill="#1C2D4A">' + esc(text) + "<\/text>";
      });
      ov.innerHTML = html;
    }

    // picking: click a part to see what it is
    var ray = new THREE.Raycaster(), down = null;
    canvas.addEventListener("pointerdown", function (e) { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener("pointerup", function (e) {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) { down = null; return; }
      down = null;
      var r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
      var vis = meshes.filter(function (m) { for (var o = m; o && o !== root; o = o.parent) if (!o.visible) return false; return true; });
      var hits = ray.intersectObjects(vis, false).filter(function (h) { return !renderer.clippingPlanes.length || renderer.clippingPlanes[0].distanceToPoint(h.point) >= 0; });
      var tip = $("tip");
      if (!hits.length) { tip.hidden = true; pickItem(0); return; }
      var it = itemOfKey[hits[0].object.userData.partKey];
      if (!it) return;
      pickItem(it.no);
      tip.innerHTML = "<b>" + esc(L.item + " " + it.no) + "<\/b> — " + esc(it.desc || it.name) + (it.pn ? "<br>" + esc(L.partNumber) + ": " + esc(it.pn) : "");
      tip.style.left = Math.min(e.clientX - r.left + 12, r.width - 240) + "px";
      tip.style.top = (e.clientY - r.top + 12) + "px";
      tip.hidden = false;
    });

    $("btn-reset").addEventListener("click", function () { if (cur) { explodeExtra = 0; var s = cur; cur = null; go(s, 0); } });
    $("btn-explode").addEventListener("click", function () {
      var target = explodeExtra > 0 ? 0 : 0.5, from = explodeExtra, t0 = performance.now();
      anim = { t0: t0, dur: 600, step: function (e) { explodeExtra = from + (target - from) * e; pose3d(cur, cur, 1); } };
    });

    resize();
    frame();
    return {
      go: go,
      goHome: function () { if (D.home) go(D.home, 0.8); },
      highlight: function (keys) { hl = new Set(keys); meshes.forEach(function (m) { look(m, 1); }); dirty = true; }
    };
  }

  buildPrint();
  var first = D.procedures.length ? { type: "step", p: 0, i: 0 } : D.figures.length ? { type: "fig", i: 0 } : { type: "bom" };
  start3d().then(function (v) {
    view3d = v;
    if (!v) document.body.classList.add("no3d");
    show(first, { instant: true });
  }).catch(function (err) {
    console.error(err);
    document.body.classList.add("no3d");
    view3d = null;
    $("c").hidden = true;
    show(first, { instant: true });
  });
})();
