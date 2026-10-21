// GALIL Model Studio: open a CAD or 3D model, explore its parts, set it up
// (camera, visibility, positions, colours, explode, section, callouts) and
// export images of it. The storyboard (story.js) and the manual publisher
// (publish.js) work through the `app` object exported at the end.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadModel, pickMain } from "./loaders.js";
import { t, lang, setLang, applyTexts } from "./i18n.js";

var $ = function (id) { return document.getElementById(id); };
var viewport = $("viewport"), canvas = $("canvas"), overlay = $("overlay");
var Y = new THREE.Vector3(0, 1, 0);

// ---------- renderer, scene, lights ----------
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
var pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
var hemi = new THREE.HemisphereLight(0xffffff, 0x8D99AB, 0.5);
var head = new THREE.DirectionalLight(0xffffff, 1.3);
var sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 4;
scene.add(hemi, head, head.target, sun, sun.target);
var floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.16 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.visible = false;
floor.userData.helper = true;
scene.add(floor);

// The model sits in modelRoot, which stands Z-up models upright.
var modelRoot = new THREE.Group();
scene.add(modelRoot);

var persp = new THREE.PerspectiveCamera(35, 1, 0.1, 1e6);
var ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e6, 1e6);
var camera = persp;
persp.position.set(1, 1, 1);
var controls = new OrbitControls(persp, canvas);
controls.screenSpacePanning = true;
controls.zoomToCursor = true;
controls.addEventListener("change", requestRender);

var gizmo = new TransformControls(persp, canvas);
gizmo.setSize(0.9);
var gizmoHelper = gizmo.getHelper();
gizmoHelper.userData.helper = true;
scene.add(gizmoHelper);
gizmo.addEventListener("change", function () { requestRender(); });
gizmo.addEventListener("dragging-changed", function (e) {
  controls.enabled = !e.value;
  if (e.value) checkpoint();
  if (!e.value) afterMove(gizmo.object);
});

// Edges are drawn with screen-space lines so they keep their weight in exported images.
var EDGE = {
  normal: new LineMaterial({ color: 0x1B2433, linewidth: 1 }),
  sel: new LineMaterial({ color: 0x2F6FD0, linewidth: 1.7 }),
  faint: new LineMaterial({ color: 0x5C6B82, linewidth: 0.8, transparent: true, opacity: 0.45, depthWrite: false })
};
EDGE.normal.userData.w = 1; EDGE.sel.userData.w = 1.7; EDGE.faint.userData.w = 0.8;

// Outlines: a depth-only pass, then a full-screen pass that draws a line wherever
// the depth jumps — silhouettes of curved parts and one part in front of another,
// which the crease edges above do not show.
var depthRT = new THREE.WebGLRenderTarget(1, 1);
depthRT.depthTexture = new THREE.DepthTexture(1, 1);
var depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
var outlineMat = new THREE.ShaderMaterial({
  uniforms: { tDepth: { value: null }, texel: { value: new THREE.Vector2() }, t: { value: 1 }, color: { value: new THREE.Color(0x1B2433) } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  fragmentShader: [
    "uniform sampler2D tDepth; uniform vec2 texel; uniform float t; uniform vec3 color; varying vec2 vUv;",
    "float D(vec2 o) { return texture2D(tDepth, vUv + o * texel).x; }",
    "void main() {",
    "  float c = D(vec2(0.0)), l = D(vec2(-t, 0.0)), r = D(vec2(t, 0.0)), u = D(vec2(0.0, t)), d = D(vec2(0.0, -t));",
    "  if (min(min(min(c, l), min(r, u)), d) >= 1.0) discard;",
    "  float lap = abs(l + r - 2.0 * c) + abs(u + d - 2.0 * c);",
    "  float grad = abs(l - r) + abs(u - d);",
    "  if (lap < 0.25 * grad + 2e-6) discard;",
    "  gl_FragColor = vec4(color, 1.0);",
    "  #include <colorspace_fragment>",
    "}"
  ].join("\n"),
  depthTest: false, depthWrite: false
});
var quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), outlineMat);
quad.frustumCulled = false;
quadScene.add(quad);
var outlineScale = 1;
persp.layers.enable(1); ortho.layers.enable(1);

// Small axes in the corner.
var axesScene = new THREE.Scene(), axesGroup = new THREE.Group();
var axesCam = new THREE.OrthographicCamera(-1.7, 1.7, 1.7, -1.7, 0.1, 10);
axesScene.add(axesGroup);
[["X", 0xD9443A, [1, 0, 0]], ["Y", 0x3FA14E, [0, 1, 0]], ["Z", 0x2F6FD0, [0, 0, 1]]].forEach(function (a) {
  var g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3().fromArray(a[2])]);
  axesGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: a[1] })));
  var c = document.createElement("canvas"); c.width = c.height = 64;
  var x = c.getContext("2d");
  x.fillStyle = "#" + a[1].toString(16).padStart(6, "0");
  x.beginPath(); x.arc(32, 32, 26, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff"; x.font = "bold 34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(a[0], 32, 34);
  var tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.position.fromArray(a[2]).multiplyScalar(1.25); s.scale.setScalar(0.5);
  axesGroup.add(s);
});

// ---------- state ----------
var state = {
  model: null, file: "", ext: "", units: "", zUp: false,
  nodes: [], meshes: [], parts: [], byKey: new Map(), bom: [],
  center: new THREE.Vector3(), radius: 1,
  selection: new Set(), lit: new Set(), lastHit: null,
  style: "shaded", explode: 0, edgeAngle: 30, light: 1,
  section: { on: false, axis: "z", flip: false, pos: 500 },
  bg: "white", bgColor: "#ffffff", ground: false, axes: true,
  callouts: [], tmode: null, meta: {}, recording: false
};

// Other modules listen for: "model" (a model was opened), "change" (the scene
// was edited), "data" (part data changed), "lang", "escape", "frame" (each
// animation frame, before drawing).
var listeners = {};
function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
function emit(ev, a) { (listeners[ev] || []).forEach(function (fn) { fn(a); }); }
function changed() { emit("change"); }
var plane = new THREE.Plane();

// ---------- rendering ----------
var dirty = true, tween = null;
function requestRender() { dirty = true; }

function size() { return { w: Math.max(1, viewport.clientWidth), h: Math.max(1, viewport.clientHeight) }; }

function updateNearFar() {
  var d = camera.position.distanceTo(state.center), r = state.radius * (1 + state.explode * 2.4) + state.radius * 0.1;
  if (camera.isPerspectiveCamera) {
    camera.near = Math.max(r * 1e-4, d - r * 1.5);
    camera.far = d + r * 3;
  } else {
    camera.near = d - r * 3;
    camera.far = d + r * 3;
  }
  camera.updateProjectionMatrix();
}

function render() {
  updateNearFar();
  head.position.copy(camera.position);
  head.target.position.copy(controls.target);
  renderer.render(scene, camera);
  outlinePass();
  if (state.axes && state.model) renderAxes();
  drawOverlay();
}

var dbSize = new THREE.Vector2();
function outlinePass() {
  var st = state.style;
  if (!state.model || (st !== "edges" && st !== "technical" && st !== "lines")) return;
  renderer.getDrawingBufferSize(dbSize);
  if (depthRT.width !== dbSize.x || depthRT.height !== dbSize.y) depthRT.setSize(dbSize.x, dbSize.y);
  var bg = scene.background, fl = floor.visible, gz = gizmoHelper.visible;
  scene.background = null; scene.overrideMaterial = depthOnly;
  depthOnly.side = state.section.on ? THREE.DoubleSide : THREE.FrontSide;
  floor.visible = false; gizmoHelper.visible = false;
  camera.layers.disable(1);
  renderer.setRenderTarget(depthRT);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  camera.layers.enable(1);
  scene.background = bg; scene.overrideMaterial = null; floor.visible = fl; gizmoHelper.visible = gz;
  outlineMat.uniforms.tDepth.value = depthRT.depthTexture;
  outlineMat.uniforms.texel.value.set(1 / dbSize.x, 1 / dbSize.y);
  outlineMat.uniforms.t.value = Math.max(1, Math.round(outlineScale));
  var planes = renderer.clippingPlanes;
  renderer.clippingPlanes = [];
  renderer.autoClear = false;
  renderer.render(quadScene, quadCam);
  renderer.autoClear = true;
  renderer.clippingPlanes = planes;
}

function renderAxes() {
  var s = 84, m = 6;
  var planes = renderer.clippingPlanes;
  renderer.clippingPlanes = [];
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setScissor(m, m, s, s);
  renderer.setViewport(m, m, s, s);
  axesGroup.quaternion.copy(modelRoot.quaternion);
  axesCam.position.copy(camera.position).sub(controls.target).normalize().multiplyScalar(4);
  axesCam.quaternion.copy(camera.quaternion);
  renderer.render(axesScene, axesCam);
  renderer.setScissorTest(false);
  var sz = size();
  renderer.setViewport(0, 0, sz.w, sz.h);
  renderer.autoClear = true;
  renderer.clippingPlanes = planes;
}

function loop(now) {
  requestAnimationFrame(loop);
  if (state.recording) return;
  emit("frame", now || performance.now());
  if (tween) stepTween();
  if (!dirty) return;
  dirty = false;
  render();
}

function setLineScale(k, w, h) {
  outlineScale = k;
  Object.keys(EDGE).forEach(function (n) {
    EDGE[n].linewidth = EDGE[n].userData.w * k;
    EDGE[n].resolution.set(w, h);
  });
}

function resize() {
  if (state.recording) return;
  var s = size(), pr = renderer.getPixelRatio();
  renderer.setSize(s.w, s.h, false);
  persp.aspect = s.w / s.h;
  persp.updateProjectionMatrix();
  var b = orthoBase();
  ortho.top = b; ortho.bottom = -b; ortho.left = -b * s.w / s.h; ortho.right = b * s.w / s.h;
  ortho.updateProjectionMatrix();
  setLineScale(pr, s.w * pr, s.h * pr);
  if ($("sel-shot-preset").value === "view") viewShotSize();
  updateFrame();
  requestRender();
}
function orthoBase() { return state.radius * 1.2; }

// ---------- camera ----------
function syncUp() {
  controls._quat.setFromUnitVectors(camera.up, Y);
  controls._quatInverse.copy(controls._quat).invert();
}

function pose() {
  return {
    target: controls.target.clone(),
    dir: camera.position.clone().sub(controls.target).normalize(),
    dist: camera.position.distanceTo(controls.target),
    up: camera.up.clone(),
    zoom: camera.zoom
  };
}

function setPose(p) {
  controls.target.copy(p.target);
  camera.up.copy(p.up).normalize();
  camera.position.copy(p.target).addScaledVector(p.dir, p.dist);
  camera.zoom = p.zoom;
  camera.lookAt(p.target);
  camera.updateProjectionMatrix();
  syncUp();
  controls.update();
  requestRender();
}

function flyTo(to, ms) {
  var from = pose();
  to = Object.assign({}, from, to);
  if (!ms) { tween = null; setPose(to); return; }
  tween = Object.assign(poseTween(from, to), { t0: performance.now(), ms: ms });
}

function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function poseAt(tw, e) {
  return {
    target: tw.from.target.clone().lerp(tw.to.target, e),
    dir: e >= 1 ? tw.to.dir.clone() : tw.from.dir.clone().applyQuaternion(new THREE.Quaternion().slerp(tw.qd, e)),
    up: e >= 1 ? tw.to.up.clone() : tw.from.up.clone().applyQuaternion(new THREE.Quaternion().slerp(tw.qu, e)),
    dist: tw.from.dist + (tw.to.dist - tw.from.dist) * e,
    zoom: tw.from.zoom + (tw.to.zoom - tw.from.zoom) * e
  };
}
function poseTween(from, to) {
  return {
    from: from, to: to,
    qd: new THREE.Quaternion().setFromUnitVectors(from.dir, to.dir.clone().normalize()),
    qu: new THREE.Quaternion().setFromUnitVectors(from.up.clone().normalize(), to.up.clone().normalize())
  };
}
function stepTween() {
  var tw = tween, k = Math.min(1, (performance.now() - tw.t0) / tw.ms);
  setPose(poseAt(tw, ease(k)));
  if (k === 1) tween = null;
}

// The part of the viewport the exported image covers.
function shotSize() { return { w: Math.max(16, +$("shot-w").value || 16), h: Math.max(16, +$("shot-h").value || 16) }; }
function activeFrame() {
  var s = size();
  if ($("sel-shot-preset").value === "view") return { x: 0, y: 0, w: s.w, h: s.h };
  var o = shotSize(), a = o.w / o.h, pad = 14;
  var fw = s.w - pad * 2, fh = fw / a;
  if (fh > s.h - pad * 2) { fh = s.h - pad * 2; fw = fh * a; }
  return { x: (s.w - fw) / 2, y: (s.h - fh) / 2, w: Math.max(1, fw), h: Math.max(1, fh) };
}

function worldBox(objs) {
  var box = new THREE.Box3(), tmp = new THREE.Box3();
  objs.forEach(function (o) {
    o.updateWorldMatrix(true, true);
    o.traverse(function (m) {
      if (!m.isMesh || m.userData.helper || !shown(m)) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
      box.union(tmp);
    });
  });
  return box;
}

function fit(objs, ms, dir, up) {
  if (!state.model) return;
  var box = worldBox(objs || [state.model]);
  if (box.isEmpty()) box = worldBox([state.model]);
  if (box.isEmpty()) return;
  var sph = box.getBoundingSphere(new THREE.Sphere()), r = Math.max(sph.radius, 1e-6) * 1.06;
  var fr = activeFrame(), s = size(), to = { target: sph.center.clone() };
  if (dir) to.dir = dir.clone().normalize();
  if (up) to.up = up.clone();
  if (camera.isPerspectiveCamera) {
    var tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * fr.h / s.h, th = tv * fr.w / fr.h;
    to.dist = r / Math.sin(Math.atan(Math.min(tv, th)));
  } else {
    var half = r / Math.min(1, fr.w / fr.h) / (fr.h / s.h);
    to.zoom = orthoBase() / half;
    to.dist = state.radius * 4;
  }
  flyTo(to, ms === undefined ? 350 : ms);
}

var VIEWS = {
  front: [0, 0, 1], back: [0, 0, -1], right: [1, 0, 0], left: [-1, 0, 0],
  top: [0, 1, 0.0005], bottom: [0, -1, 0.0005], iso: [1, 1, 1]
};
function standardView(name) {
  if (!state.model) return;
  fit(null, 350, new THREE.Vector3().fromArray(VIEWS[name]), Y);
}

function roll(deg) {
  var fwd = controls.target.clone().sub(camera.position).normalize();
  flyTo({ up: camera.up.clone().applyAxisAngle(fwd, THREE.MathUtils.degToRad(deg)) }, 250);
}

function setProjection(p) {
  var cur = pose();
  if (p === "ortho" && camera.isPerspectiveCamera) {
    var h = 2 * cur.dist * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2));
    camera = ortho;
    cur.zoom = 2 * orthoBase() / h;
    cur.dist = Math.max(cur.dist, state.radius * 4);
  } else if (p === "persp" && camera.isOrthographicCamera) {
    var vh = (ortho.top - ortho.bottom) / ortho.zoom;
    camera = persp;
    cur.dist = vh / (2 * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)));
    cur.zoom = 1;
  } else return;
  controls.object = camera;
  gizmo.camera = camera;
  $("sel-projection").value = p;
  setPose(cur);
  resize();
}

// ---------- the model ----------
function shown(o) {
  for (; o; o = o.parent) { if (!o.visible) return false; if (o === modelRoot) return true; }
  return true;
}
function isPartGroup(o) {
  if (o.isMesh) return false;
  var kids = o.children.filter(function (c) { return !c.userData.helper; });
  return kids.length > 0 && kids.every(function (c) { return c.isMesh && c.children.every(function (g) { return g.userData.helper; }) && (!c.name || c.name === o.name); });
}
function treeKids(o) {
  if (o.isMesh || isPartGroup(o)) return [];
  return o.children.filter(function (c) { return !c.userData.helper && !c.isLight && !c.isCamera && (c.isMesh || hasMesh(c)); });
}
function hasMesh(o) { var f = false; o.traverse(function (c) { if (c.isMesh) f = true; }); return f; }
function partOf(mesh) { var p = mesh.parent; return p && p.userData.isPart && !mesh.userData.isPart ? p : mesh; }
function displayName(o) { return o.name || (o.userData.isPart ? t("Part") : t("Assembly")); }
function mats(m) { return Array.isArray(m.material) ? m.material : [m.material]; }
function triangles(o) {
  var n = 0;
  o.traverse(function (m) { if (m.isMesh && !m.userData.helper) { var g = m.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  return Math.round(n);
}
function meshesOf(o) { var a = []; o.traverse(function (m) { if (m.isMesh && !m.userData.helper) a.push(m); }); return a; }

function original(m) {
  return {
    color: m.color.clone(), vc: m.vertexColors, opacity: m.opacity, map: m.map, metal: m.metalness, rough: m.roughness,
    side: m.side, em: m.emissive.clone(), emi: m.emissiveIntensity
  };
}

function disposeModel() {
  if (!state.model) return;
  gizmo.detach();
  state.model.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !(o.material instanceof LineMaterial)) mats(o).forEach(function (m) { m.dispose(); });
  });
  modelRoot.remove(state.model);
  state.model = null;
}

function setModel(res) {
  disposeModel();
  var root = res.object;
  Object.assign(state, {
    model: root, file: res.file, ext: res.ext, units: res.units,
    nodes: [], meshes: [], parts: [], byKey: new Map(), selection: new Set(), lit: new Set(),
    lastHit: null, callouts: [], explode: 0, meta: {}
  });
  history.undo = []; history.redo = []; undoButtons();
  $("rng-explode").value = 0;
  modelRoot.add(root);
  centrePivots(root);
  // keys (stable paths), home transforms, original materials
  (function walk(o, key) {
    o.userData.key = key;
    o.userData.home = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
    o.userData.base = o.position.clone();
    state.byKey.set(key, o);
    state.nodes.push(o);
    if (o.isMesh) {
      o.userData.orig = mats(o).map(original);
      o.castShadow = true;
      state.meshes.push(o);
    }
    if (o.isMesh || isPartGroup(o)) { o.userData.isPart = true; state.parts.push(o); return; }
    treeKids(o).forEach(function (c, i) { walk(c, key + "." + i); });
  })(root, "0");
  // meshes inside part groups
  state.parts.forEach(function (p) {
    if (p.isMesh) return;
    p.children.forEach(function (m) {
      if (!m.isMesh) return;
      m.userData.orig = mats(m).map(original);
      m.castShadow = true;
      state.meshes.push(m);
    });
  });
  setZUp(res.zUp, true);
  buildBom();
  buildTree();
  applyStyle();
  $("start").hidden = true;
  $("filename").textContent = res.file;
  document.title = res.file + " · GALIL Model Studio";
  $("shot-name").value = "";
  $("shot-name").placeholder = res.file.replace(/\.[^.]+$/, "");
  selectionChanged();
  setProjection($("sel-projection").value);
  fit(null, 0, new THREE.Vector3().fromArray(VIEWS.iso), Y);
  updateStatus();
  emit("model");
}

// CAD readers place every part at the assembly origin with its geometry where
// it belongs. Give each part and assembly its own middle as its origin, so the
// move and rotate handles sit on it. Only done when nothing in the model has
// a transform of its own (shared geometry is left alone).
function centrePivots(root) {
  var identity = true, uses = new Map(), centres = new Map();
  root.traverse(function (o) {
    if (!o.matrix.equals(new THREE.Matrix4()) || !o.position.equals(new THREE.Vector3()) || !o.quaternion.equals(new THREE.Quaternion()) || !o.scale.equals(new THREE.Vector3(1, 1, 1))) identity = false;
    if (o.isMesh) uses.set(o.geometry, (uses.get(o.geometry) || 0) + 1);
  });
  if (!identity) return;
  root.updateMatrixWorld(true);
  root.traverse(function (o) {
    var b = new THREE.Box3().setFromObject(o);
    centres.set(o, b.isEmpty() ? new THREE.Vector3() : b.getCenter(new THREE.Vector3()));
  });
  root.traverse(function (o) {
    if (o.isMesh && uses.get(o.geometry) !== 1) centres.set(o, new THREE.Vector3());
    var c = centres.get(o), pc = o === root ? new THREE.Vector3() : centres.get(o.parent);
    if (o.isMesh && c.lengthSq()) { o.geometry.translate(-c.x, -c.y, -c.z); o.geometry.boundingBox = null; o.geometry.boundingSphere = null; }
    o.position.copy(c).sub(pc);
  });
  root.updateMatrixWorld(true);
}

// Bounds, the floor, the section range and the explode directions follow the
// model's standing.
function setZUp(on, initial) {
  state.zUp = !!on;
  $("chk-zup").checked = state.zUp;
  modelRoot.rotation.x = state.zUp ? -Math.PI / 2 : 0;
  modelRoot.updateMatrixWorld(true);
  var save = state.explode;
  state.explode = 0; applyExplode();
  var box = worldBox([state.model]);
  var sph = box.getBoundingSphere(new THREE.Sphere());
  state.center.copy(sph.center); state.radius = Math.max(sph.radius, 1e-6);
  state.box = box;
  computeExplode();
  state.explode = save; applyExplode();
  var r = state.radius;
  floor.scale.setScalar(r * 12);
  floor.position.set(sph.center.x, box.min.y - r * 0.004, sph.center.z);
  sun.position.copy(sph.center).add(new THREE.Vector3(r * 0.6, r * 3, r * 1.1));
  sun.target.position.copy(sph.center);
  var sc = sun.shadow.camera;
  sc.left = sc.bottom = -r * 1.8; sc.right = sc.top = r * 1.8; sc.near = r * 0.5; sc.far = r * 6;
  sc.updateProjectionMatrix();
  resize();
  updateSection();
  if (!initial) fit(null, 300);
}

function computeExplode() {
  var c = state.center;
  state.parts.forEach(function (p) {
    var pc = worldBox([p]).getCenter(new THREE.Vector3());
    var d = pc.clone().sub(c);
    p.parent.updateWorldMatrix(true, false);
    var a = p.parent.worldToLocal(pc.clone()), b = p.parent.worldToLocal(pc.clone().add(d));
    p.userData.xdir = b.sub(a);
  });
}
function explodeFactor() { return state.explode * 1.4; }
function applyExplode() {
  var f = explodeFactor();
  state.parts.forEach(function (p) {
    p.position.copy(p.userData.base);
    if (p.userData.xdir) p.position.addScaledVector(p.userData.xdir, f);
  });
  requestRender();
}

// After a part has been moved with the gizmo, its new place is where it sits unexploded.
function afterMove(o) {
  if (!o) return;
  o.userData.base.copy(o.position);
  if (o.userData.isPart && o.userData.xdir) o.userData.base.addScaledVector(o.userData.xdir, -explodeFactor());
  changed();
  updateSelPanel();
}

// ---------- looks ----------
var WHITE = new THREE.Color(0xffffff);
function look(mesh) {
  var st = state.style, sel = state.lit.has(mesh), ud = mesh.userData, cut = state.section.on;
  var edges = st !== "shaded";
  mats(mesh).forEach(function (m, i) {
    var o = ud.orig[i] || ud.orig[0];
    var color = ud.color ? new THREE.Color(ud.color) : o.color;
    var op = (ud.opacity != null ? ud.opacity : o.opacity) * (ud.fade == null ? 1 : ud.fade);
    var vc = ud.color ? false : o.vc;
    m.toneMapped = true;
    m.envMapIntensity = 1;
    m.map = o.map; m.metalness = o.metal; m.roughness = o.rough;
    m.emissive.copy(o.em); m.emissiveIntensity = o.emi;
    if (st === "technical") {
      m.color.copy(color).lerp(WHITE, 0.45); m.metalness = 0; m.roughness = 1; m.map = null;
    } else if (st === "lines") {
      m.color.set(0x000000); m.emissive.set(sel ? 0xCFE0FA : 0xffffff); m.map = null; vc = false;
      m.metalness = 0; m.roughness = 1; m.envMapIntensity = 0; m.toneMapped = false;
    } else {
      m.color.copy(color);
    }
    if (sel && st !== "lines") { m.emissive.set(0x2F6FD0); m.emissiveIntensity = 0.38; }
    var xray = st === "xray", wire = st === "wire";
    m.opacity = xray ? Math.min(op, 0.2) : op;
    m.transparent = xray || op < 0.999;
    // a part fading in or out keeps writing depth, so its far side stays hidden
    m.depthWrite = !xray && !wire && op / (ud.fade == null ? 1 : Math.max(ud.fade, 1e-3)) >= 0.999;
    m.colorWrite = !wire;
    m.polygonOffset = edges; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1;
    m.side = cut ? THREE.DoubleSide : o.side;
    if (m.vertexColors !== vc) m.vertexColors = vc;
    m.needsUpdate = true;
  });
  var line = ud.edges;
  if (edges) {
    if (!line || ud.edgeAngle !== state.edgeAngle) line = makeEdges(mesh);
    line.visible = ud.fade == null || ud.fade > 0.4;
    line.material = sel ? EDGE.sel : st === "xray" ? EDGE.faint : EDGE.normal;
  } else if (line) line.visible = false;
}

function makeEdges(mesh) {
  var ud = mesh.userData;
  if (ud.edges) { mesh.remove(ud.edges); ud.edges.geometry.dispose(); }
  // Welded first, so the seams of curved faces and the joins between
  // faces that meet smoothly are not drawn.
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", mesh.geometry.attributes.position);
  if (mesh.geometry.index) g.setIndex(mesh.geometry.index);
  var welded = mergeVertices(g, Math.max(1e-7, state.radius * 2e-6));
  var eg = new THREE.EdgesGeometry(welded, state.edgeAngle);
  welded.dispose();
  var lg = new LineSegmentsGeometry().fromEdgesGeometry(eg);
  eg.dispose();
  var line = new LineSegments2(lg, EDGE.normal);
  line.userData.helper = true;
  line.layers.set(1);
  line.raycast = function () {};
  mesh.add(line);
  ud.edges = line; ud.edgeAngle = state.edgeAngle;
  return line;
}

function applyStyle() {
  state.meshes.forEach(look);
  requestRender();
}

// ---------- selection ----------
function select(nodes, add) {
  if (!add) state.selection.clear();
  nodes.forEach(function (n) {
    if (add && state.selection.has(n) && nodes.length === 1) state.selection.delete(n); else state.selection.add(n);
  });
  selectionChanged(true);
}

function selectionChanged(scroll) {
  var lit = new Set();
  state.selection.forEach(function (n) { meshesOf(n).forEach(function (m) { lit.add(m); }); });
  var changed = [];
  state.meshes.forEach(function (m) { if (lit.has(m) !== state.lit.has(m)) changed.push(m); });
  state.lit = lit;
  changed.forEach(look);
  treeSelection(scroll);
  bomSelection();
  updateSelPanel();
  attachGizmo();
  updateStatus();
  requestRender();
}

function first() { return state.selection.values().next().value; }

function attachGizmo() {
  var one = state.selection.size === 1 ? first() : null;
  if (state.tmode && one && one !== state.model) {
    gizmo.attach(one);
    gizmo.setMode(state.tmode);
    gizmo.setSpace(state.tmode === "rotate" ? "local" : "world");
  } else gizmo.detach();
  $("btn-move").classList.toggle("on", state.tmode === "translate");
  $("btn-rotate").classList.toggle("on", state.tmode === "rotate");
  requestRender();
}

function setTMode(m) {
  state.tmode = state.tmode === m ? null : m;
  if (state.tmode && state.selection.size !== 1) toast(t("Select one part (or one assembly) to move it."));
  attachGizmo();
}

// picking
var ray = new THREE.Raycaster(), down = null;
function hit(ev) {
  var r = canvas.getBoundingClientRect();
  var ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  var vis = state.meshes.filter(shown);
  var hits = ray.intersectObjects(vis, false);
  for (var i = 0; i < hits.length; i++) {
    if (state.section.on && plane.distanceToPoint(hits[i].point) < 0) continue;
    return hits[i];
  }
  return null;
}

canvas.addEventListener("pointerdown", function (ev) {
  down = { x: ev.clientX, y: ev.clientY, onGizmo: gizmo.axis !== null && !!gizmo.object };
});
canvas.addEventListener("pointerup", function (ev) {
  if (!down || ev.button !== 0 || !state.model) return;
  var moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 4, onGizmo = down.onGizmo;
  down = null;
  if (moved || onGizmo) return;
  var h = hit(ev), add = ev.ctrlKey || ev.metaKey || ev.shiftKey;
  if (!h) { if (!add) select([]); return; }
  var node = partOf(h.object);
  if (ev.altKey && node.parent && node !== state.model && node.parent !== modelRoot) node = node.parent;
  state.lastHit = { node: node, local: node.worldToLocal(h.point.clone()) };
  select([node], add);
});
canvas.addEventListener("dblclick", function (ev) {
  if (!state.model) return;
  var h = hit(ev);
  if (h) { select([partOf(h.object)]); fit([partOf(h.object)]); } else fit();
});
canvas.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });

// ---------- visibility ----------
function setVisible(nodes, v) { if (!nodes.length) return; checkpoint(); nodes.forEach(function (n) { n.visible = v; }); visibilityChanged(); }
function showAll() { checkpoint(); state.nodes.forEach(function (n) { n.visible = true; }); visibilityChanged(); }
function isolate() {
  if (!state.selection.size) return toast(t("Select the parts to keep first."));
  checkpoint();
  var keep = new Set();
  state.selection.forEach(function (n) {
    n.traverse(function (c) { keep.add(c); });
    for (var p = n; p && p !== modelRoot; p = p.parent) keep.add(p);
  });
  state.nodes.forEach(function (n) { n.visible = keep.has(n); });
  visibilityChanged();
  fit(Array.from(state.selection));
}
function visibilityChanged() {
  treeVisibility();
  changed();
  updateStatus();
  requestRender();
}

// ---------- tree ----------
var rows = new Map(), treeEl = $("tree");
var EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1"/></svg>';
var CARET = '<svg viewBox="0 0 10 10"><path d="M3 1l4 4-4 4z"/></svg>';

function buildTree() {
  rows.clear();
  treeEl.innerHTML = "";
  if (!state.model) return;
  treeEl.appendChild(nodeEl(state.model, 0));
  expand(state.model, true);
}

function partCount(o) { var n = 0; o.traverse(function (c) { if (c.userData.isPart) n++; }); return n; }

function nodeEl(o, depth) {
  var wrap = document.createElement("div"), row = document.createElement("div"), kids = treeKids(o);
  wrap.className = "node";
  row.className = "row";
  row.setAttribute("role", "treeitem");
  row.style.paddingInlineStart = (4 + depth * 14) + "px";
  var swatch = "";
  if (o.userData.isPart) {
    var m = meshesOf(o)[0], c = m && (m.userData.color || "#" + m.userData.orig[0].color.getHexString());
    swatch = '<span class="swatch" style="background:' + c + '"></span>';
  }
  row.innerHTML = '<button class="caret' + (kids.length ? "" : " leaf") + '" tabindex="-1">' + CARET + '</button>' +
    '<button class="eye" tabindex="-1">' + EYE + '</button>' + swatch +
    '<span class="nm"></span>' + (kids.length ? '<span class="cnt">' + partCount(o) + "</span>" : "");
  row.querySelector(".nm").textContent = displayName(o);
  row.title = displayName(o);
  wrap.appendChild(row);
  var k = document.createElement("div"); k.className = "kids"; wrap.appendChild(k);
  rows.set(o, { wrap: wrap, row: row, kids: k, depth: depth, built: false });
  row.querySelector(".caret").addEventListener("click", function (e) { e.stopPropagation(); expand(o, !wrap.classList.contains("open")); });
  row.querySelector(".eye").addEventListener("click", function (e) { e.stopPropagation(); setVisible([o], !o.visible); });
  row.addEventListener("click", function (e) { select([o], e.ctrlKey || e.metaKey || e.shiftKey); });
  row.addEventListener("dblclick", function () { select([o]); fit([o]); });
  paintRow(o);
  if (state.selection.has(o)) row.classList.add("sel");
  return wrap;
}

function expand(o, open) {
  var r = rows.get(o); if (!r) return;
  if (open && !r.built) {
    treeKids(o).forEach(function (c) { r.kids.appendChild(nodeEl(c, r.depth + 1)); });
    r.built = true;
  }
  r.wrap.classList.toggle("open", !!open);
}

function reveal(o) {
  var chain = [];
  for (var p = o.parent; p && p !== modelRoot; p = p.parent) chain.unshift(p);
  chain.forEach(function (p) { expand(p, true); });
  return rows.get(o);
}

function paintRow(o) {
  var r = rows.get(o); if (!r) return;
  r.wrap.classList.toggle("hidden-part", !shown(o));
  r.row.querySelector(".eye").innerHTML = o.visible ? EYE : EYE_OFF;
  r.row.querySelector(".eye").title = o.visible ? t("Hide") : t("Show");
}
function treeVisibility() { rows.forEach(function (r, o) { paintRow(o); }); }

function treeSelection(scroll) {
  rows.forEach(function (r, o) { r.row.classList.toggle("sel", state.selection.has(o)); });
  if (scroll && state.selection.size) {
    var r = reveal(first());
    if (r) r.row.scrollIntoView({ block: "nearest" });
  }
}

var searchTimer = 0;
$("tree-search").addEventListener("input", function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(search, 150);
});
$("tree-search").addEventListener("keydown", function (e) {
  if (e.key === "Enter") { var m = matches(); if (m.length) select(m); }
});
function matches() {
  var q = $("tree-search").value.trim().toLowerCase();
  if (!q) return [];
  return state.nodes.filter(function (n) { return displayName(n).toLowerCase().indexOf(q) >= 0; });
}
function search() {
  rows.forEach(function (r) { r.row.classList.remove("match"); });
  var m = matches();
  m.forEach(function (n) { var r = reveal(n); if (r) r.row.classList.add("match"); });
  if (m.length) rows.get(m[0]).row.scrollIntoView({ block: "nearest" });
}

var allOpen = false;
$("btn-expand").addEventListener("click", function () {
  allOpen = !allOpen;
  if (allOpen) state.nodes.forEach(function (n) { if (treeKids(n).length) { reveal(n); expand(n, true); } });
  else rows.forEach(function (r, o) { expand(o, o === state.model); });
  $("btn-expand").textContent = allOpen ? t("Collapse") : t("Expand");
});

// ---------- parts list ----------
function buildBom() {
  var by = new Map();
  state.bom = [];
  state.parts.forEach(function (p) {
    var n = displayName(p);
    if (!by.has(n)) { var it = { no: state.bom.length + 1, name: n, parts: [] }; by.set(n, it); state.bom.push(it); }
    by.get(n).parts.push(p);
  });
  renderBom();
}
function meta(name) { return state.meta[name] || {}; }
function renderBom() {
  var body = $("bom-body");
  body.innerHTML = "";
  state.bom.forEach(function (it) {
    var tr = document.createElement("tr"), m = meta(it.name);
    tr.innerHTML = "<td>" + it.no + "</td><td><span></span><span class=\"pn\"></span></td><td>" + it.parts.length + "</td>";
    tr.children[1].children[0].textContent = m.desc || it.name;
    tr.children[1].children[1].textContent = m.pn || "";
    tr.title = it.name;
    tr.addEventListener("click", function (e) { select(it.parts, e.ctrlKey || e.metaKey); });
    tr.addEventListener("dblclick", function () { select(it.parts); fit(it.parts); });
    it.tr = tr;
    body.appendChild(tr);
  });
  bomSelection();
}
function bomItem(node) {
  var n = displayName(node);
  return state.bom.find(function (it) { return it.name === n; });
}
function bomSelection() {
  state.bom.forEach(function (it) { if (it.tr) it.tr.classList.toggle("sel", it.parts.some(function (p) { return state.selection.has(p); })); });
}
$("btn-bom-csv").addEventListener("click", function () {
  if (!state.model) return;
  var q = function (s) { return '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"'; };
  var head = ["Item", "Part number", "Name", "Description", "Unit", "Qty", "Notes"].map(function (h) { return q(t(h)); }).join(",");
  var csv = [head].concat(state.bom.map(function (it) {
    var m = meta(it.name);
    return [it.no, q(m.pn), q(it.name), q(m.desc), q(m.uom || "EA"), it.parts.length, q(m.notes)].join(",");
  })).join("\r\n");
  download(new Blob(["\ufeff" + csv], { type: "text/csv" }), stem() + " - " + t("parts list") + ".csv");
});
$("btn-bom-import").addEventListener("click", function () {
  if (!state.model) return toast(t("Open a model first."));
  $("bom-input").click();
});
$("bom-input").addEventListener("change", async function () {
  var f = this.files[0]; this.value = "";
  if (!f) return;
  var n = importPartData(parseCsv(await f.text()));
  toast(n ? t("Part data read for {n} parts.", { n: n }) : t("No rows in that file match the parts of this model (by name or part number)."), !n);
});

function parseCsv(text) {
  text = text.replace(/^\ufeff/, "");
  var sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(function (x) { return x.trim(); })) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(function (x) { return x.trim(); })) rows.push(row);
  return rows;
}

// Rows with a header naming the columns: Name, Part number, Description, Unit, Notes
// (English or Hebrew). Rows match the parts by name, or by part number.
function importPartData(rows) {
  if (rows.length < 2) return 0;
  var h = rows[0].map(function (x) { return x.trim().toLowerCase(); });
  var col = function (re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
  var cPn = col(/part.?(no|num|#)|p\/n|^pn$|מק.?ט|מספר חלק/), cName = col(/^name$|part name|^part$|^שם|component|רכיב/);
  var cDesc = col(/desc|nomencl|תיאור/), cUom = col(/^unit|uom|יחידה/), cNotes = col(/note|remark|הערה/);
  if (cName < 0 && cPn < 0) return 0;
  checkpoint();
  var count = 0;
  rows.slice(1).forEach(function (r) {
    var get = function (i) { return i >= 0 && r[i] != null ? r[i].trim() : ""; };
    var name = get(cName).toLowerCase(), pn = get(cPn);
    var it = state.bom.find(function (b) { return (name && b.name.toLowerCase() === name) || (!name && pn && meta(b.name).pn === pn); });
    if (!it) return;
    var m = Object.assign({}, meta(it.name));
    if (pn) m.pn = pn;
    if (get(cDesc)) m.desc = get(cDesc);
    if (get(cUom)) m.uom = get(cUom);
    if (get(cNotes)) m.notes = get(cNotes);
    state.meta[it.name] = m;
    count++;
  });
  renderBom(); updateSelPanel(); emit("data");
  return count;
}

// ---------- selected part panel ----------
// Keeps "1920 × 1080" in that order inside Hebrew text.
function ltr(s) { return "\u2066" + s + "\u2069"; }
function fmt(n, d) { return new Intl.NumberFormat(lang() === "he" ? "he-IL" : "en-US", { maximumFractionDigits: d == null ? 1 : d }).format(n); }
function dims(objs) {
  var box = worldBox(objs);
  if (box.isEmpty()) return "—";
  var s = box.getSize(new THREE.Vector3());
  if (state.zUp) s.set(s.x, s.z, s.y);
  var u = state.units ? " " + t(state.units) : "";
  return ltr(fmt(s.x) + " × " + fmt(s.y) + " × " + fmt(s.z)) + u;
}

function updateSelPanel() {
  var n = state.selection.size;
  $("sel-empty").hidden = n > 0;
  $("sel-props").hidden = n === 0;
  if (!n) return;
  var one = first(), list = Array.from(state.selection);
  var info = [];
  if (n === 1) {
    $("sel-name").textContent = displayName(one);
    var path = [];
    for (var p = one.parent; p && p !== modelRoot; p = p.parent) path.unshift(displayName(p));
    $("sel-path").textContent = path.join(" › ");
    info.push([t("Type"), one.userData.isPart ? t("Part") : t("Assembly")]);
    if (!one.userData.isPart) info.push([t("Parts inside"), fmt(partCount(one), 0)]);
    var it = one.userData.isPart && bomItem(one);
    if (it) info.push([t("Item"), it.no + (it.parts.length > 1 ? " (" + t("{n} in the model", { n: it.parts.length }) + ")" : "")]);
  } else {
    $("sel-name").textContent = t("{n} selected", { n: n });
    $("sel-path").textContent = "";
  }
  info.push([t("Size"), dims(list)]);
  info.push([t("Triangles"), fmt(list.reduce(function (s, o) { return s + triangles(o); }, 0), 0)]);
  if (n === 1 && one !== state.model) {
    var h = one.userData.home, moved = !one.userData.base.equals(h.p) || !one.quaternion.equals(h.q);
    info.push([t("Position"), moved ? t("Moved") : t("As designed")]);
  }
  var dl = $("sel-info");
  dl.innerHTML = "";
  info.forEach(function (kv) {
    var dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = kv[0]; dd.textContent = kv[1];
    dl.appendChild(dt); dl.appendChild(dd);
  });
  var item = selectedItem();
  $("sel-data").hidden = !item;
  if (item) {
    var md = meta(item.name);
    $("meta-pn").value = md.pn || ""; $("meta-desc").value = md.desc || "";
    $("meta-uom").value = md.uom || ""; $("meta-notes").value = md.notes || "";
    $("meta-desc").placeholder = item.name;
  }
  var m = meshesOf(one)[0];
  if (m) {
    $("sel-color").value = m.userData.color || "#" + m.userData.orig[0].color.getHexString();
    $("sel-opacity").value = Math.round((m.userData.opacity != null ? m.userData.opacity : m.userData.orig[0].opacity) * 100);
  }
  $("sel-parent").disabled = n !== 1 || one === state.model;
}

// The parts-list item when every selected node is an instance of the same part.
function selectedItem() {
  var items = new Set();
  state.selection.forEach(function (n) { items.add(n.userData.isPart ? bomItem(n) : null); });
  return items.size === 1 ? items.values().next().value : null;
}
[["meta-pn", "pn"], ["meta-desc", "desc"], ["meta-uom", "uom"], ["meta-notes", "notes"]].forEach(function (f) {
  $(f[0]).addEventListener("input", function () {
    var it = selectedItem(); if (!it) return;
    var m = Object.assign({}, meta(it.name));
    m[f[1]] = this.value;
    state.meta[it.name] = m;
    renderBom();
    emit("data");
  });
});

function forSelectedMeshes(fn) {
  var seen = new Set();
  state.selection.forEach(function (n) { meshesOf(n).forEach(function (m) { if (!seen.has(m)) { seen.add(m); fn(m); } }); });
}
$("sel-color").addEventListener("input", function () {
  burst();
  var c = this.value;
  forSelectedMeshes(function (m) { m.userData.color = c; look(m); });
  state.selection.forEach(function (n) { n.traverse(function (o) { var r = rows.get(o); var sw = r && r.row.querySelector(".swatch"); if (sw) sw.style.background = c; }); });
  changed(); requestRender();
});
$("sel-opacity").addEventListener("input", function () {
  burst();
  var v = this.value / 100;
  forSelectedMeshes(function (m) { m.userData.opacity = v; look(m); });
  changed(); requestRender();
});

// Moving and turning by exact amounts, along the model's own axes.
function topSelected() {
  var list = Array.from(state.selection);
  return list.filter(function (n) {
    if (n === state.model) return false;
    for (var p = n.parent; p; p = p.parent) if (state.selection.has(p)) return false;
    return true;
  });
}
$("mv-apply").addEventListener("click", function () {
  var list = topSelected();
  if (!list.length) return toast(t("Select a part first."));
  var d = new THREE.Vector3(+$("mv-x").value || 0, +$("mv-y").value || 0, +$("mv-z").value || 0).applyQuaternion(modelRoot.quaternion);
  if (!d.lengthSq()) return;
  checkpoint();
  list.forEach(function (n) {
    n.parent.updateWorldMatrix(true, false);
    var w = n.getWorldPosition(new THREE.Vector3());
    var delta = n.parent.worldToLocal(w.clone().add(d)).sub(n.parent.worldToLocal(w.clone()));
    n.userData.base.add(delta); n.position.add(delta);
  });
  afterEdit();
});
$("rt-apply").addEventListener("click", function () {
  var list = topSelected();
  if (!list.length) return toast(t("Select a part first."));
  var deg = +$("rt-deg").value || 0;
  if (!deg) return;
  checkpoint();
  var q = new THREE.Quaternion().setFromAxisAngle(axisVec($("rt-axis").value), THREE.MathUtils.degToRad(deg));
  list.forEach(function (n) {
    n.parent.updateWorldMatrix(true, false);
    var pq = n.parent.getWorldQuaternion(new THREE.Quaternion());
    var local = pq.clone().invert().multiply(q).multiply(pq);
    n.quaternion.premultiply(local);
  });
  afterEdit();
});
function afterEdit() {
  requestRender(); updateSelPanel(); changed();
}
$("sel-focus").addEventListener("click", function () { fit(Array.from(state.selection)); });
$("sel-parent").addEventListener("click", function () {
  var o = first();
  if (o && o !== state.model && o.parent && o.parent !== modelRoot) select([o.parent]);
});
$("sel-reset").addEventListener("click", function () { resetNodes(Array.from(state.selection)); });
$("btn-reset-all").addEventListener("click", function () { if (state.model) resetNodes([state.model]); });

function resetNodes(list) {
  if (!list.length) return;
  checkpoint();
  list.forEach(function (n) {
    n.traverse(function (o) {
      var h = o.userData.home; if (!h) return;
      o.userData.base.copy(h.p); o.position.copy(h.p); o.quaternion.copy(h.q); o.scale.copy(h.s);
      if (o.isMesh) { delete o.userData.color; delete o.userData.opacity; }
    });
  });
  applyExplode();
  applyStyle();
  buildTreeKeepState();
  updateSelPanel();
  changed();
}
function buildTreeKeepState() {
  var open = [];
  rows.forEach(function (r, o) { if (r.wrap.classList.contains("open")) open.push(o); });
  buildTree();
  open.forEach(function (o) { reveal(o); expand(o, true); });
  treeSelection(false);
}

// ---------- section ----------
function axisVec(a) {
  var v = new THREE.Vector3(a === "x" ? 1 : 0, a === "y" ? 1 : 0, a === "z" ? 1 : 0);
  return v.applyQuaternion(modelRoot.quaternion).round();
}
function updateSection() {
  var s = state.section;
  renderer.clippingPlanes = s.on && state.model ? [plane] : [];
  if (state.model && state.box) {
    var n = axisVec(s.axis), b = state.box;
    var lo = Infinity, hi = -Infinity;
    [b.min.x, b.max.x].forEach(function (x) { [b.min.y, b.max.y].forEach(function (y) { [b.min.z, b.max.z].forEach(function (z) {
      var d = n.x * x + n.y * y + n.z * z; lo = Math.min(lo, d); hi = Math.max(hi, d);
    }); }); });
    var pad = (hi - lo) * 0.002, v = lo - pad + (hi - lo + pad * 2) * s.pos / 1000;
    if (s.flip) plane.set(n, -v); else plane.set(n.clone().negate(), v);
  }
  requestRender();
}
function sectionPlane() { return state.section.on ? [plane.normal.x, plane.normal.y, plane.normal.z, plane.constant] : null; }
$("chk-section").addEventListener("change", function () { checkpoint(); state.section.on = this.checked; applyStyle(); updateSection(); changed(); });
$("sel-section-axis").addEventListener("change", function () { checkpoint(); state.section.axis = this.value; updateSection(); changed(); });
$("chk-section-flip").addEventListener("change", function () { checkpoint(); state.section.flip = this.checked; updateSection(); changed(); });
$("rng-section").addEventListener("input", function () { burst(); state.section.pos = +this.value; updateSection(); changed(); });

// ---------- display ----------
var gradientTex = (function () {
  var c = document.createElement("canvas"); c.width = 4; c.height = 256;
  var x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#FBFCFE"); g.addColorStop(1, "#C3CDDC");
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  var tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();
var BG = { white: "#ffffff", light: "#EDF0F5", dark: "#262D3A" };
function applyBackground() {
  var b = state.bg;
  scene.background = b === "gradient" ? gradientTex : new THREE.Color(b === "custom" ? state.bgColor : BG[b]);
  viewport.style.background = b === "gradient" ? "#E2E7EF" : (b === "custom" ? state.bgColor : BG[b]);
  $("sel-bg").value = b;
  $("bg-color").hidden = b !== "custom";
  $("bg-color").value = state.bgColor;
  requestRender();
}
$("sel-bg").addEventListener("change", function () { checkpoint(); state.bg = this.value; applyBackground(); changed(); });
$("bg-color").addEventListener("input", function () { burst(); state.bgColor = this.value; applyBackground(); changed(); });
function applyLight() {
  var k = state.light;
  hemi.intensity = 0.5 * k; head.intensity = 1.3 * k; scene.environmentIntensity = 0.75 * k; sun.intensity = state.ground ? 0.5 * k : 0;
  requestRender();
}
$("rng-light").addEventListener("input", function () { burst(); state.light = this.value / 100; applyLight(); changed(); });
var edgeTimer = 0;
$("rng-edge").addEventListener("input", function () {
  state.edgeAngle = +this.value;
  clearTimeout(edgeTimer);
  edgeTimer = setTimeout(applyStyle, 200);
});
$("chk-ground").addEventListener("change", function () {
  checkpoint(); changed();
  state.ground = this.checked; floor.visible = state.ground; sun.castShadow = state.ground; applyLight();
});
$("chk-axes").addEventListener("change", function () { state.axes = this.checked; requestRender(); });
$("chk-zup").addEventListener("change", function () { if (state.model) setZUp(this.checked); });
$("sel-style").addEventListener("change", function () { checkpoint(); state.style = this.value; applyStyle(); changed(); });
$("sel-projection").addEventListener("change", function () { setProjection(this.value); });
$("rng-explode").addEventListener("input", function () { burst(); state.explode = this.value / 100; applyExplode(); changed(); });

// ---------- callouts ----------
function addCallout() {
  var n = first();
  if (!n) return toast(t("Select a part first."));
  var local;
  if (state.lastHit && state.lastHit.node === n) local = state.lastHit.local.clone();
  else local = n.worldToLocal(worldBox([n]).getCenter(new THREE.Vector3()));
  var a = n.localToWorld(local.clone()).project(camera), s = size();
  var sx = (a.x + 1) / 2 * s.w, sy = (1 - a.y) / 2 * s.h;
  var dx = sx - s.w / 2, dy = sy - s.h / 2, len = Math.hypot(dx, dy) || 1;
  checkpoint();
  state.callouts.push({ id: Date.now() + Math.random(), key: n.userData.key, local: local.toArray(), dx: dx / len * 70, dy: dy / len * 70 - 10, text: null });
  changed();
  requestRender();
}

// A callout for every part item that can be seen, labels laid out on an
// ellipse around the model in the order of their parts, so leaders do not cross.
function autoBalloon() {
  if (!state.model) return 0;
  var s = size(), fr = activeFrame(), pts = [];
  var proj = function (p) { var v = p.clone().project(camera); return { x: (v.x + 1) / 2 * s.w, y: (1 - v.y) / 2 * s.h, z: v.z }; };
  state.bom.forEach(function (it) {
    var p = it.parts.find(function (x) { return shown(x) && (!state.section.on || plane.distanceToPoint(worldBox([x]).getCenter(new THREE.Vector3())) >= 0); });
    if (!p) return;
    var c = worldBox([p]).getCenter(new THREE.Vector3()), sp = proj(c);
    if (sp.z > 1 || sp.x < fr.x || sp.x > fr.x + fr.w || sp.y < fr.y || sp.y > fr.y + fr.h) return;
    pts.push({ p: p, local: p.worldToLocal(c.clone()), x: sp.x, y: sp.y });
  });
  if (!pts.length) return 0;
  checkpoint();
  var b = worldBox([state.model]), minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  [b.min.x, b.max.x].forEach(function (x) { [b.min.y, b.max.y].forEach(function (y) { [b.min.z, b.max.z].forEach(function (z) {
    var q = proj(new THREE.Vector3(x, y, z)); minx = Math.min(minx, q.x); maxx = Math.max(maxx, q.x); miny = Math.min(miny, q.y); maxy = Math.max(maxy, q.y);
  }); }); });
  var cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  var rx = Math.min((maxx - minx) / 2 + 46, fr.w / 2 - 18), ry = Math.min((maxy - miny) / 2 + 36, fr.h / 2 - 18);
  cx = Math.min(Math.max(cx, fr.x + rx + 16), fr.x + fr.w - rx - 16);
  cy = Math.min(Math.max(cy, fr.y + ry + 16), fr.y + fr.h - ry - 16);
  pts.forEach(function (q) { q.a = Math.atan2(q.y - cy, q.x - cx); });
  pts.sort(function (a, c) { return a.a - c.a; });
  var n = pts.length, best = 0, bestCost = Infinity, start = pts[0].a;
  var slot = function (i) { return start + (i * 2 * Math.PI) / n; };
  var diff = function (a, c) { var d = Math.abs(a - c) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
  for (var off = -Math.PI / n; off <= Math.PI / n + 1e-9; off += Math.PI / n / 6) {
    var cost = 0;
    for (var i = 0; i < n; i++) cost += diff(pts[i].a, slot(i) + off);
    if (cost < bestCost) { bestCost = cost; best = off; }
  }
  state.callouts = pts.map(function (q, i) {
    var th = slot(i) + best, lx = cx + rx * Math.cos(th), ly = cy + ry * Math.sin(th);
    return { id: Date.now() + i + Math.random(), key: q.p.userData.key, local: q.local.toArray(), dx: lx - q.x, dy: ly - q.y, text: null };
  });
  changed();
  requestRender();
  return pts.length;
}
function clearCallouts() {
  if (!state.callouts.length) return;
  checkpoint();
  state.callouts = [];
  changed(); requestRender();
}
$("sel-callout").addEventListener("click", addCallout);

function calloutText(c, node) {
  if (c.text) return c.text;
  var it = node.userData.isPart ? bomItem(node) : null;
  return it ? String(it.no) : displayName(node);
}

// Callouts in screen space for a camera framing the frame rectangle (w×h px).
function calloutsFor(cam, w, h, k) {
  var out = [];
  state.callouts.forEach(function (c) {
    var node = state.byKey.get(c.key);
    if (!node || !shown(node)) return;
    var p = node.localToWorld(new THREE.Vector3().fromArray(c.local));
    if (state.section.on && plane.distanceToPoint(p) < -state.radius * 1e-3) return;
    var v = p.project(cam);
    if (v.z > 1) return;
    var ax = (v.x + 1) / 2 * w, ay = (1 - v.y) / 2 * h;
    out.push({ c: c, ax: ax, ay: ay, bx: ax + c.dx * k, by: ay + c.dy * k, text: calloutText(c, node) });
  });
  return out;
}

function drawOverlay() {
  var s = size(), html = "";
  calloutsFor(camera, s.w, s.h, 1).forEach(function (o) {
    var r = o.text.length > 2 ? 6 + o.text.length * 3.6 : 12;
    html += '<g class="callout" data-id="' + o.c.id + '"><title>' + esc(t("Drag to move · double-click to change the text · right-click to delete")) + "</title>" +
      '<line x1="' + o.ax + '" y1="' + o.ay + '" x2="' + o.bx + '" y2="' + o.by + '" stroke="#1C2D4A" stroke-width="1.5"/>' +
      '<circle cx="' + o.ax + '" cy="' + o.ay + '" r="2.5" fill="#1C2D4A"/>' +
      (o.text.length > 2
        ? '<rect x="' + (o.bx - r) + '" y="' + (o.by - 12) + '" width="' + r * 2 + '" height="24" rx="12" fill="#fff" stroke="#1C2D4A" stroke-width="1.5"/>'
        : '<circle cx="' + o.bx + '" cy="' + o.by + '" r="12" fill="#fff" stroke="#1C2D4A" stroke-width="1.5"/>') +
      '<text x="' + o.bx + '" y="' + (o.by + 4.2) + '" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="700" fill="#1C2D4A">' + esc(o.text) + "</text></g>";
  });
  overlay.innerHTML = html;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function calloutById(el) { var id = +el.closest(".callout").dataset.id; return state.callouts.find(function (c) { return c.id === id; }); }

var dragC = null;
overlay.addEventListener("pointerdown", function (e) {
  var g = e.target.closest(".callout"); if (!g || e.button !== 0) return;
  var c = calloutById(g);
  checkpoint();
  dragC = { c: c, x: e.clientX, y: e.clientY, dx: c.dx, dy: c.dy };
  g.setPointerCapture(e.pointerId);
  e.preventDefault();
});
overlay.addEventListener("pointermove", function (e) {
  if (!dragC) return;
  dragC.c.dx = dragC.dx + e.clientX - dragC.x;
  dragC.c.dy = dragC.dy + e.clientY - dragC.y;
  render();
});
overlay.addEventListener("pointerup", function () { if (dragC) changed(); dragC = null; });
overlay.addEventListener("dblclick", function (e) {
  var g = e.target.closest(".callout"); if (!g) return;
  var c = calloutById(g), node = state.byKey.get(c.key);
  var v = prompt(t("Callout text (leave empty for the item number):"), c.text || calloutText(c, node));
  if (v === null) return;
  checkpoint();
  c.text = v.trim() || null;
  changed();
  requestRender();
});
overlay.addEventListener("contextmenu", function (e) {
  var g = e.target.closest(".callout"); if (!g) return;
  e.preventDefault();
  var c = calloutById(g);
  checkpoint();
  state.callouts = state.callouts.filter(function (x) { return x !== c; });
  changed();
  requestRender();
});

function drawCallouts(ctx, list, k) {
  list.forEach(function (o) {
    ctx.strokeStyle = "#1C2D4A"; ctx.fillStyle = "#1C2D4A"; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); ctx.moveTo(o.ax, o.ay); ctx.lineTo(o.bx, o.by); ctx.stroke();
    ctx.beginPath(); ctx.arc(o.ax, o.ay, 2.5 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    if (o.text.length > 2) {
      var r = (6 + o.text.length * 3.6) * k;
      ctx.roundRect(o.bx - r, o.by - 12 * k, r * 2, 24 * k, 12 * k);
    } else ctx.arc(o.bx, o.by, 12 * k, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1C2D4A";
    ctx.font = "700 " + 12 * k + "px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(o.text, o.bx, o.by + 4.2 * k);
  });
}

// ---------- images ----------
function maxDim() {
  var gl = renderer.getContext();
  return Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0], gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]);
}

// Output rendering: the frame rectangle drawn at w×h pixels into a 2D canvas.
// beginOutput sets the renderer up for it, renderOutput draws one picture (or one
// video frame), endOutput puts the screen back.
function beginOutput(opt) {
  var w = Math.round(opt.w), h = Math.round(opt.h), ss = opt.ss || 1, lim = maxDim();
  while (ss > 1 && Math.max(w, h) * ss > lim) ss--;
  if (Math.max(w, h) > lim) throw new Error(t("This computer can make images up to {n} pixels wide.", { n: lim }));
  var o = {
    w: w, h: h, W: w * ss, H: h * ss, opt: opt, fr: opt.frame || activeFrame(), s: size(),
    prevPR: renderer.getPixelRatio(), bg: scene.background, gz: gizmoHelper.visible, lit: state.lit
  };
  // no selection highlight or gizmo in the picture
  state.lit = new Set(); o.lit.forEach(look);
  gizmoHelper.visible = false;
  if (opt.transparent) { scene.background = null; renderer.setClearColor(0x000000, 0); }
  renderer.setPixelRatio(1);
  renderer.setSize(o.W, o.H, false);
  camera.setViewOffset(o.s.w, o.s.h, o.fr.x, o.fr.y, o.fr.w, o.fr.h);
  setLineScale(o.W / o.fr.w, o.W, o.H);
  o.out = document.createElement("canvas");
  o.out.width = w; o.out.height = h;
  o.ctx = o.out.getContext("2d");
  return o;
}
function renderOutput(o, extra) {
  if (camera.view === null || !camera.view.enabled) camera.setViewOffset(o.s.w, o.s.h, o.fr.x, o.fr.y, o.fr.w, o.fr.h);
  updateNearFar();
  head.position.copy(camera.position); head.target.position.copy(controls.target);
  renderer.render(scene, camera);
  outlinePass();
  var ctx = o.ctx;
  ctx.clearRect(0, 0, o.w, o.h);
  if (o.opt.format === "jpeg" || o.opt.opaque) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, o.w, o.h); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(renderer.domElement, 0, 0, o.W, o.H, 0, 0, o.w, o.h);
  var k = o.w / o.fr.w;
  if (o.opt.callouts !== false) drawCallouts(ctx, calloutsFor(camera, o.w, o.h, k), k);
  if (extra) extra(ctx, o, k);
}
function endOutput(o) {
  camera.clearViewOffset();
  scene.background = o.bg;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(o.prevPR);
  gizmoHelper.visible = o.gz;
  state.lit = o.lit; o.lit.forEach(look);
  resize();
  render();
}
function capture(opt) {
  var o = beginOutput(opt);
  try { renderOutput(o); } finally { endOutput(o); }
  return o.out;
}

function toBlob(c, type) {
  return new Promise(function (res) { c.toBlob(res, "image/" + type, 0.95); });
}
function stem() { return ($("shot-name").value.trim() || state.file.replace(/\.[^.]+$/, "") || "model"); }
function stamp() { var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
function shotOptions() {
  var o = shotSize(), fmtv = $("sel-shot-format").value;
  return { w: o.w, h: o.h, ss: +$("sel-shot-ss").value, format: fmtv, transparent: fmtv === "png" && $("chk-transparent").checked };
}
async function saveImage() {
  if (!state.model) return toast(t("Open a model first."));
  try {
    var o = shotOptions(), c = capture(o);
    var blob = await toBlob(c, o.format);
    var name = ($("shot-name").value.trim() || stem() + " " + stamp()) + (o.format === "jpeg" ? ".jpg" : ".png");
    download(blob, name);
    toast(t("Saved {name} ({size})", { name: name, size: ltr(o.w + " × " + o.h) }));
  } catch (err) { toast(err.message, true); }
}
$("btn-shot").addEventListener("click", saveImage);
$("btn-shot-2").addEventListener("click", saveImage);

function viewShotSize() {
  var s = size(), pr = window.devicePixelRatio || 1;
  $("shot-w").value = Math.round(s.w * pr); $("shot-h").value = Math.round(s.h * pr);
}
$("sel-shot-preset").addEventListener("change", function () {
  var v = this.value;
  if (v === "view") viewShotSize();
  else if (v !== "custom") { var p = v.split("x"); $("shot-w").value = p[0]; $("shot-h").value = p[1]; }
  updateFrame();
  remember();
});
["shot-w", "shot-h"].forEach(function (id) {
  $(id).addEventListener("input", function () {
    $("sel-shot-preset").value = "custom";
    updateFrame(); remember();
  });
});
$("chk-frame").addEventListener("change", function () { updateFrame(); remember(); });
["sel-shot-format", "sel-shot-ss", "chk-transparent"].forEach(function (id) { $(id).addEventListener("change", remember); });

function updateFrame() {
  var el = $("frame"), on = $("chk-frame").checked && $("sel-shot-preset").value !== "view" && !!state.model;
  el.hidden = !on;
  if (!on) return;
  var f = activeFrame(), o = shotSize();
  el.style.left = f.x + "px"; el.style.top = f.y + "px"; el.style.width = f.w + "px"; el.style.height = f.h + "px";
  $("frame-size").textContent = ltr(o.w + " × " + o.h);
}

// ---------- scene states ----------
// A state is what a view, a procedure step or a figure keeps: camera, which
// parts are shown, where they are, colours, explode, style, cut, background,
// floor, light and callouts. Parts are listed by key only where they differ
// from the model as designed.
function v3(a) { return new THREE.Vector3().fromArray(a); }
function innerKey(m) { return m.parent.userData.key + "/" + m.parent.children.indexOf(m); }
function snapshot() {
  var parts = {};
  state.nodes.forEach(function (o) {
    var ud = o.userData, d = {};
    if (!o.visible) d.v = 0;
    if (!ud.base.equals(ud.home.p)) d.p = ud.base.toArray();
    if (!o.quaternion.equals(ud.home.q)) d.q = o.quaternion.toArray();
    if (o.isMesh) {
      if (ud.color) d.c = ud.color;
      if (ud.opacity != null) d.o = ud.opacity;
    }
    if (Object.keys(d).length) parts[ud.key] = d;
  });
  // colours of meshes inside part groups
  state.meshes.forEach(function (m) {
    if (m.userData.key) return;
    var d = {};
    if (m.userData.color) d.c = m.userData.color;
    if (m.userData.opacity != null) d.o = m.userData.opacity;
    if (Object.keys(d).length) parts[innerKey(m)] = d;
  });
  var p = pose();
  return {
    camera: { proj: camera.isPerspectiveCamera ? "persp" : "ortho", target: p.target.toArray(), dir: p.dir.toArray(), dist: p.dist, up: p.up.toArray(), zoom: p.zoom },
    parts: parts, explode: state.explode, style: state.style, zUp: state.zUp, ground: state.ground, light: state.light,
    section: Object.assign({}, state.section), bg: state.bg, bgColor: state.bgColor,
    callouts: JSON.parse(JSON.stringify(state.callouts))
  };
}

// The settings that are not animated: style, background, floor, light, cut, standing.
function applySettings(s) {
  if (!!s.zUp !== state.zUp) setZUp(s.zUp, true);
  state.style = s.style || "shaded"; $("sel-style").value = state.style;
  state.section = Object.assign({ on: false, axis: "z", flip: false, pos: 500 }, s.section);
  $("chk-section").checked = state.section.on; $("sel-section-axis").value = state.section.axis;
  $("chk-section-flip").checked = state.section.flip; $("rng-section").value = state.section.pos;
  updateSection();
  state.bg = s.bg || "white"; state.bgColor = s.bgColor || "#ffffff"; applyBackground();
  state.ground = !!s.ground; $("chk-ground").checked = state.ground; floor.visible = state.ground; sun.castShadow = state.ground;
  state.light = s.light != null ? s.light : 1; $("rng-light").value = Math.round(state.light * 100);
  applyLight();
}

function camPose(c) { return { target: v3(c.target), dir: v3(c.dir).normalize(), dist: c.dist, up: v3(c.up), zoom: c.zoom }; }

// opts: camera (false keeps the camera), ms (camera flight), ui (false skips the tree and panels)
function applyState(s, opts) {
  opts = opts || {};
  if (!state.model || !s) return;
  blendData = null;
  applySettings(s);
  state.nodes.forEach(function (o) {
    var h = o.userData.home, d = s.parts[o.userData.key] || {};
    o.visible = d.v !== 0;
    o.userData.base.copy(d.p ? v3(d.p) : h.p);
    o.position.copy(o.userData.base);
    o.quaternion.copy(d.q ? new THREE.Quaternion().fromArray(d.q) : h.q);
    delete o.userData.fadeSelf;
    if (o.isMesh) { if (d.c) o.userData.color = d.c; else delete o.userData.color; if (d.o != null) o.userData.opacity = d.o; else delete o.userData.opacity; }
  });
  state.meshes.forEach(function (m) {
    delete m.userData.fade;
    if (m.userData.key) return;
    var d = s.parts[innerKey(m)] || {};
    if (d.c) m.userData.color = d.c; else delete m.userData.color;
    if (d.o != null) m.userData.opacity = d.o; else delete m.userData.opacity;
  });
  state.explode = s.explode || 0; $("rng-explode").value = Math.round(state.explode * 100);
  applyExplode();
  state.callouts = JSON.parse(JSON.stringify(s.callouts || []));
  applyStyle();
  if (opts.camera !== false && s.camera) {
    if ((s.camera.proj === "ortho") !== camera.isOrthographicCamera) setProjection(s.camera.proj);
    flyTo(camPose(s.camera), opts.ms || 0);
  }
  if (opts.ui !== false) {
    buildTreeKeepState();
    updateSelPanel();
    updateStatus();
  }
  requestRender();
}

// Animation between two states. beginBlend(A, B) takes the settings of B and
// prepares the motion; blend(e) puts the scene at e (0 = A, 1 = B). Parts that
// appear or disappear fade in or out; callouts show once the motion ends.
var blendData = null;
function beginBlend(A, B) {
  applySettings(B);
  var vis = function (d) { return d.v !== 0; };
  blendData = {
    A: A, B: B,
    nodes: state.nodes.map(function (o) {
      var h = o.userData.home, a = A.parts[o.userData.key] || {}, b = B.parts[o.userData.key] || {};
      return {
        o: o, pa: a.p ? v3(a.p) : h.p.clone(), pb: b.p ? v3(b.p) : h.p.clone(),
        qa: a.q ? new THREE.Quaternion().fromArray(a.q) : h.q.clone(), qb: b.q ? new THREE.Quaternion().fromArray(b.q) : h.q.clone(),
        va: vis(a), vb: vis(b)
      };
    }),
    meshes: state.meshes.map(function (m) {
      var k = m.userData.key || innerKey(m), a = A.parts[k] || {}, b = B.parts[k] || {};
      return { m: m, ca: a.c, cb: b.c, oa: a.o, ob: b.o };
    }),
    cam: B.camera ? poseTween(A.camera ? camPose(A.camera) : pose(), camPose(B.camera)) : null
  };
  if (B.camera && (B.camera.proj === "ortho") !== camera.isOrthographicCamera) setProjection(B.camera.proj);
  state.callouts = [];
  blend(0);
}
var tmpColor = new THREE.Color(), tmpColor2 = new THREE.Color();
function blend(e) {
  var d = blendData; if (!d) return;
  var A = d.A, B = d.B;
  state.explode = (A.explode || 0) + ((B.explode || 0) - (A.explode || 0)) * e;
  var f = explodeFactor();
  d.nodes.forEach(function (n) {
    var o = n.o, ud = o.userData;
    ud.base.lerpVectors(n.pa, n.pb, e);
    o.position.copy(ud.base);
    if (ud.isPart && ud.xdir) o.position.addScaledVector(ud.xdir, f);
    o.quaternion.slerpQuaternions(n.qa, n.qb, e);
    o.visible = e >= 1 ? n.vb : n.va || n.vb;
    ud.fadeSelf = n.va === n.vb || e >= 1 ? 1 : n.va ? 1 - e : e;
  });
  var fades = new Map();
  (function walk(o, k) {
    var kk = k * (o.userData.fadeSelf == null ? 1 : o.userData.fadeSelf);
    if (o.isMesh) fades.set(o, kk);
    o.children.forEach(function (c) { if (!c.userData.helper) walk(c, kk); });
  })(state.model, 1);
  d.meshes.forEach(function (x) {
    var m = x.m, ud = m.userData, before = [ud.color, ud.opacity, ud.fade].join("|");
    if (x.ca && x.cb && x.ca !== x.cb) ud.color = "#" + tmpColor.set(x.ca).lerp(tmpColor2.set(x.cb), e).getHexString();
    else { var c = e < 0.5 ? x.ca : x.cb; if (c) ud.color = c; else delete ud.color; }
    var oa = x.oa != null ? x.oa : 1, ob = x.ob != null ? x.ob : 1;
    if (x.oa == null && x.ob == null) delete ud.opacity; else ud.opacity = oa + (ob - oa) * e;
    var fd = fades.get(m);
    if (fd == null || fd >= 1) delete ud.fade; else ud.fade = fd;
    if ([ud.color, ud.opacity, ud.fade].join("|") !== before) look(m);
  });
  if (d.cam) { tween = null; setPose(poseAt(d.cam, e)); }
  if (A.section && B.section && A.section.on && B.section.on && A.section.axis === B.section.axis) {
    state.section.pos = A.section.pos + (B.section.pos - A.section.pos) * e;
    updateSection();
  }
  if (e >= 1) state.callouts = JSON.parse(JSON.stringify(B.callouts || []));
  requestRender();
}

// ---------- undo ----------
var history = { undo: [], redo: [] }, burstTimer = 0;
function sceneState() { var s = snapshot(); delete s.camera; return s; }
function checkpoint() {
  if (!state.model) return;
  history.undo.push(sceneState());
  if (history.undo.length > 80) history.undo.shift();
  history.redo = [];
  undoButtons();
}
// One checkpoint for a run of quick changes (dragging a slider).
function burst() {
  if (!burstTimer) checkpoint();
  clearTimeout(burstTimer);
  burstTimer = setTimeout(function () { burstTimer = 0; }, 700);
}
function undoButtons() {
  $("btn-undo").disabled = !history.undo.length;
  $("btn-redo").disabled = !history.redo.length;
}
function undo() {
  if (!history.undo.length) return;
  history.redo.push(sceneState());
  applyState(history.undo.pop(), { camera: false });
  undoButtons(); changed();
}
function redo() {
  if (!history.redo.length) return;
  history.undo.push(sceneState());
  applyState(history.redo.pop(), { camera: false });
  undoButtons(); changed();
}
$("btn-undo").addEventListener("click", undo);
$("btn-redo").addEventListener("click", redo);

// ---------- opening ----------
async function openFiles(list) {
  var files = Array.from(list || []);
  if (!files.length) return;
  var main = pickMain(files);
  busy(t("Opening {name}…", { name: main.name }));
  try {
    setModel(await loadModel(files));
    toast(main.name + ": " + (state.parts.length === 1 ? t("1 part") : t("{n} parts", { n: state.parts.length })));
  } catch (err) {
    console.error(err);
    if (err.native) toast(t("{kind} files cannot be opened directly. In the program they come from, save the model as STEP (AP214 or AP242) and open the STEP file here.", { kind: t(err.native) }), true, 12000);
    else if (err.unsupported) toast(t("Model Studio cannot open {name}.", { name: main.name }), true);
    else toast(t("{name} could not be opened: {msg}", { name: main.name, msg: err.message }), true, 9000);
  } finally { busy(false); }
}
async function openSample() {
  busy(t("Opening {name}…", { name: "shaft-support.step" }));
  try {
    var r = await fetch("samples/shaft-support.step");
    if (!r.ok) throw new Error(r.status);
    var f = new File([await r.blob()], "shaft-support.step");
    await openFiles([f]);
  } catch (e) { busy(false); toast(t("The sample could not be loaded. Open Model Studio from a web server, not from a file on disk."), true, 9000); }
}

$("btn-open").addEventListener("click", function () { $("file-input").click(); });
$("btn-open-2").addEventListener("click", function () { $("file-input").click(); });
$("btn-sample").addEventListener("click", openSample);
$("btn-sample-2").addEventListener("click", openSample);
$("file-input").addEventListener("change", function () { var f = this.files; openFiles(f).then(function () { $("file-input").value = ""; }); });

var dragDepth = 0;
window.addEventListener("dragenter", function (e) { if (e.dataTransfer && Array.from(e.dataTransfer.types).indexOf("Files") >= 0) { dragDepth++; $("dropmask").hidden = false; } });
window.addEventListener("dragleave", function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $("dropmask").hidden = true; });
window.addEventListener("dragover", function (e) { e.preventDefault(); });
window.addEventListener("drop", function (e) {
  e.preventDefault(); dragDepth = 0; $("dropmask").hidden = true;
  if (e.dataTransfer && e.dataTransfer.files.length) openFiles(e.dataTransfer.files);
});

// ---------- toolbar ----------
$("btn-fit").addEventListener("click", function () { fit(); });
$("btn-fit-sel").addEventListener("click", function () { fit(state.selection.size ? Array.from(state.selection) : null); });
document.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { standardView(b.dataset.view); }); });
$("btn-roll-l").addEventListener("click", function () { roll(-90); });
$("btn-roll-r").addEventListener("click", function () { roll(90); });
$("btn-move").addEventListener("click", function () { setTMode("translate"); });
$("btn-rotate").addEventListener("click", function () { setTMode("rotate"); });
$("btn-show-all").addEventListener("click", showAll);
$("btn-hide").addEventListener("click", function () { setVisible(Array.from(state.selection), false); });
$("btn-isolate").addEventListener("click", isolate);
document.querySelectorAll(".tab").forEach(function (b) {
  b.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === b); });
    $("tab-tree").hidden = b.dataset.tab !== "tree";
    $("tab-bom").hidden = b.dataset.tab !== "bom";
  });
});

window.addEventListener("keydown", function (e) {
  var tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return;
  var k = e.key, ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && !e.shiftKey && k.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
  if (ctrl && (k.toLowerCase() === "y" || (e.shiftKey && k.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
  if (ctrl && k.toLowerCase() === "o") { e.preventDefault(); $("file-input").click(); return; }
  if (ctrl && e.shiftKey && k.toLowerCase() === "s") { e.preventDefault(); saveImage(); return; }
  if (ctrl && k.toLowerCase() === "a" && state.model) { e.preventDefault(); select(state.parts.filter(shown)); return; }
  if (k === "Escape") emit("escape");
  if (ctrl || e.altKey || !state.model) return;
  if (k === "f") fit();
  else if (k === "F") fit(state.selection.size ? Array.from(state.selection) : null);
  else if (k === "h" || k === "Delete") setVisible(Array.from(state.selection), false);
  else if (k === "H") showAll();
  else if (k === "i" || k === "I") isolate();
  else if (k === "t" || k === "T") setTMode("translate");
  else if (k === "r" || k === "R") setTMode("rotate");
  else if (k === "Escape") { state.tmode = null; select([]); emit("escape"); }
  else if (k >= "1" && k <= "7") standardView(["front", "back", "left", "right", "top", "bottom", "iso"][+k - 1]);
  else return;
  e.preventDefault();
});

// ---------- language ----------
$("btn-lang").addEventListener("click", function () {
  setLang(lang() === "he" ? "en" : "he");
  localise();
});
function localise() {
  document.documentElement.lang = lang();
  document.documentElement.dir = lang() === "he" ? "rtl" : "ltr";
  $("btn-lang").textContent = lang() === "he" ? "EN" : "עב";
  applyTexts(document);
  $("btn-expand").textContent = allOpen ? t("Collapse") : t("Expand");
  if (state.model) { buildTreeKeepState(); buildBom(); bomSelection(); updateSelPanel(); }
  updateStatus();
  emit("lang");
  requestRender();
}

// ---------- remembered settings ----------
var PREFS_KEY = "galil-model-studio-prefs";
function remember() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      preset: $("sel-shot-preset").value, w: $("shot-w").value, h: $("shot-h").value, format: $("sel-shot-format").value,
      ss: $("sel-shot-ss").value, transparent: $("chk-transparent").checked, frame: $("chk-frame").checked
    }));
  } catch (e) { /* blocked */ }
}
function recall() {
  var p = null;
  try { p = JSON.parse(localStorage.getItem(PREFS_KEY) || "null"); } catch (e) { p = null; }
  if (!p) return;
  if (p.preset) $("sel-shot-preset").value = p.preset;
  if (p.w) $("shot-w").value = p.w;
  if (p.h) $("shot-h").value = p.h;
  if (p.format) $("sel-shot-format").value = p.format;
  if (p.ss) $("sel-shot-ss").value = p.ss;
  $("chk-transparent").checked = !!p.transparent;
  $("chk-frame").checked = p.frame !== false;
}

// ---------- status, messages ----------
function updateStatus() {
  if (!state.model) { $("st-model").textContent = t("No model open"); $("st-sel").textContent = ""; return; }
  var shownParts = state.parts.filter(shown).length;
  $("st-model").textContent = (state.parts.length === 1 ? t("1 part") : t("{n} parts", { n: fmt(state.parts.length, 0) })) +
    (shownParts < state.parts.length ? " (" + t("{n} shown", { n: fmt(shownParts, 0) }) + ")" : "") +
    " · " + t("{n} triangles", { n: fmt(triangles(state.model), 0) }) + " · " + dims([state.model]);
  $("st-sel").textContent = state.selection.size ? t("{n} selected", { n: state.selection.size }) : "";
}

var toastTimer = 0;
function toast(msg, err, ms) {
  var el = $("toast");
  el.textContent = msg;
  el.classList.toggle("err", !!err);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, ms || (err ? 7000 : 3500));
}
function busy(msg) {
  $("busy").hidden = !msg;
  $("busy-text").textContent = msg || "";
}
function download(blob, name) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 20000);
}

// ---------- start ----------
recall();
if ($("sel-shot-preset").value === "view") viewShotSize();
localise();
applyBackground();
applyLight();
new ResizeObserver(resize).observe(viewport);
resize();
loop();

// What the storyboard and the publisher use.
export var app = {
  THREE: THREE, state: state, on: on, emit: emit, t: t, lang: lang, $: $,
  snapshot: snapshot, applyState: applyState, beginBlend: beginBlend, blend: blend, ease: ease,
  capture: capture, beginOutput: beginOutput, renderOutput: renderOutput, endOutput: endOutput,
  sectionPlane: sectionPlane, checkpoint: checkpoint, autoBalloon: autoBalloon, clearCallouts: clearCallouts,
  shotOptions: shotOptions, toBlob: toBlob, download: download, toast: toast, busy: busy, stem: stem,
  activeFrame: activeFrame, fit: fit, standardView: standardView, setVisible: setVisible, showAll: showAll,
  displayName: displayName, bomItem: bomItem, meta: meta, renderBom: renderBom, updateSelPanel: updateSelPanel,
  treeKids: treeKids, worldBox: worldBox, shown: shown, innerKey: innerKey, mats: mats,
  explodeFactor: explodeFactor, modelRoot: modelRoot, requestRender: requestRender,
  select: select, fmt: fmt, ltr: ltr, esc: esc, VIEWS: VIEWS, Y: Y
};

// For the tests and for people who script it from the console.
window.studio = {
  state: state, open: openFiles, openSample: openSample, capture: capture, snapshot: snapshot, restore: applyState, app: app,
  select: function (names) { select(state.nodes.filter(function (n) { return names.indexOf(displayName(n)) >= 0; })); },
  camera: function () { return camera; },
  // true when no camera flight or procedure playback is running
  idle: function () { return !tween && !(app.isPlaying && app.isPlaying()); },
  // Where a part's middle is on the screen (page coordinates).
  screenPoint: function (name) {
    var n = state.nodes.find(function (o) { return displayName(o) === name; });
    var v = worldBox([n]).getCenter(new THREE.Vector3()).project(camera), r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }
};
