// GALIL Model Studio: open a CAD or 3D model, explore its parts, set it up
// (camera, visibility, positions, colours, explode, section, callouts) and
// export images of it.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadModel, pickMain } from "./loaders.js";
import { makeZip } from "./zip.js";
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
  callouts: [], views: [], activeView: null, tmode: null
};
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

function loop() {
  requestAnimationFrame(loop);
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
  var qd = new THREE.Quaternion().setFromUnitVectors(from.dir, to.dir.clone().normalize());
  var qu = new THREE.Quaternion().setFromUnitVectors(from.up, to.up.clone().normalize());
  tween = { from: from, to: to, qd: qd, qu: qu, t0: performance.now(), ms: ms };
}

function stepTween() {
  var tw = tween, k = Math.min(1, (performance.now() - tw.t0) / tw.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  var q = new THREE.Quaternion();
  setPose({
    target: tw.from.target.clone().lerp(tw.to.target, e),
    dir: k === 1 ? tw.to.dir.clone() : tw.from.dir.clone().applyQuaternion(q.copy(new THREE.Quaternion()).slerp(tw.qd, e)),
    up: k === 1 ? tw.to.up.clone() : tw.from.up.clone().applyQuaternion(new THREE.Quaternion().slerp(tw.qu, e)),
    dist: tw.from.dist + (tw.to.dist - tw.from.dist) * e,
    zoom: tw.from.zoom + (tw.to.zoom - tw.from.zoom) * e
  });
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
    lastHit: null, callouts: [], views: [], activeView: null, explode: 0
  });
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
  loadStoredViews();
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
  state.activeView = null;
  renderViews();
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
    var op = ud.opacity != null ? ud.opacity : o.opacity;
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
    m.depthWrite = !xray && !wire && op >= 0.999;
    m.colorWrite = !wire;
    m.polygonOffset = edges; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1;
    m.side = cut ? THREE.DoubleSide : o.side;
    if (m.vertexColors !== vc) m.vertexColors = vc;
    m.needsUpdate = true;
  });
  var line = ud.edges;
  if (edges) {
    if (!line || ud.edgeAngle !== state.edgeAngle) line = makeEdges(mesh);
    line.visible = true;
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
function setVisible(nodes, v) { nodes.forEach(function (n) { n.visible = v; }); visibilityChanged(); }
function showAll() { state.nodes.forEach(function (n) { n.visible = true; }); visibilityChanged(); }
function isolate() {
  if (!state.selection.size) return toast(t("Select the parts to keep first."));
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
  state.activeView = null; renderViews();
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
  var body = $("bom-body");
  body.innerHTML = "";
  state.bom.forEach(function (it) {
    var tr = document.createElement("tr");
    tr.innerHTML = "<td>" + it.no + "</td><td></td><td>" + it.parts.length + "</td>";
    tr.children[1].textContent = it.name;
    tr.addEventListener("click", function (e) { select(it.parts, e.ctrlKey || e.metaKey); });
    tr.addEventListener("dblclick", function () { select(it.parts); fit(it.parts); });
    it.tr = tr;
    body.appendChild(tr);
  });
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
  var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
  var csv = [[t("Item"), t("Part"), t("Qty")].map(q).join(",")].concat(state.bom.map(function (it) { return [it.no, q(it.name), it.parts.length].join(","); })).join("\r\n");
  download(new Blob(["﻿" + csv], { type: "text/csv" }), stem() + " - " + t("parts list") + ".csv");
});

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
  var m = meshesOf(one)[0];
  if (m) {
    $("sel-color").value = m.userData.color || "#" + m.userData.orig[0].color.getHexString();
    $("sel-opacity").value = Math.round((m.userData.opacity != null ? m.userData.opacity : m.userData.orig[0].opacity) * 100);
  }
  $("sel-parent").disabled = n !== 1 || one === state.model;
}

function forSelectedMeshes(fn) {
  var seen = new Set();
  state.selection.forEach(function (n) { meshesOf(n).forEach(function (m) { if (!seen.has(m)) { seen.add(m); fn(m); } }); });
}
$("sel-color").addEventListener("input", function () {
  var c = this.value;
  forSelectedMeshes(function (m) { m.userData.color = c; look(m); });
  state.selection.forEach(function (n) { n.traverse(function (o) { var r = rows.get(o); var sw = r && r.row.querySelector(".swatch"); if (sw) sw.style.background = c; }); });
  state.activeView = null; requestRender();
});
$("sel-opacity").addEventListener("input", function () {
  var v = this.value / 100;
  forSelectedMeshes(function (m) { m.userData.opacity = v; look(m); });
  state.activeView = null; requestRender();
});
$("sel-focus").addEventListener("click", function () { fit(Array.from(state.selection)); });
$("sel-parent").addEventListener("click", function () {
  var o = first();
  if (o && o !== state.model && o.parent && o.parent !== modelRoot) select([o.parent]);
});
$("sel-reset").addEventListener("click", function () { resetNodes(Array.from(state.selection)); });
$("btn-reset-all").addEventListener("click", function () { if (state.model) resetNodes([state.model]); });

function resetNodes(list) {
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
  state.activeView = null; renderViews();
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
$("chk-section").addEventListener("change", function () { state.section.on = this.checked; applyStyle(); updateSection(); state.activeView = null; });
$("sel-section-axis").addEventListener("change", function () { state.section.axis = this.value; updateSection(); });
$("chk-section-flip").addEventListener("change", function () { state.section.flip = this.checked; updateSection(); });
$("rng-section").addEventListener("input", function () { state.section.pos = +this.value; updateSection(); });

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
$("sel-bg").addEventListener("change", function () { state.bg = this.value; applyBackground(); });
$("bg-color").addEventListener("input", function () { state.bgColor = this.value; applyBackground(); });
function applyLight() {
  var k = state.light;
  hemi.intensity = 0.5 * k; head.intensity = 1.3 * k; scene.environmentIntensity = 0.75 * k; sun.intensity = state.ground ? 0.5 * k : 0;
  requestRender();
}
$("rng-light").addEventListener("input", function () { state.light = this.value / 100; applyLight(); });
var edgeTimer = 0;
$("rng-edge").addEventListener("input", function () {
  state.edgeAngle = +this.value;
  clearTimeout(edgeTimer);
  edgeTimer = setTimeout(applyStyle, 200);
});
$("chk-ground").addEventListener("change", function () {
  state.ground = this.checked; floor.visible = state.ground; sun.castShadow = state.ground; applyLight();
});
$("chk-axes").addEventListener("change", function () { state.axes = this.checked; requestRender(); });
$("chk-zup").addEventListener("change", function () { if (state.model) setZUp(this.checked); });
$("sel-style").addEventListener("change", function () { state.style = this.value; applyStyle(); state.activeView = null; });
$("sel-projection").addEventListener("change", function () { setProjection(this.value); });
$("rng-explode").addEventListener("input", function () { state.explode = this.value / 100; applyExplode(); state.activeView = null; });

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
  state.callouts.push({ id: Date.now() + Math.random(), key: n.userData.key, local: local.toArray(), dx: dx / len * 70, dy: dy / len * 70 - 10, text: null });
  state.activeView = null;
  requestRender();
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
  dragC = { c: c, x: e.clientX, y: e.clientY, dx: c.dx, dy: c.dy };
  g.setPointerCapture(e.pointerId);
  e.preventDefault();
});
overlay.addEventListener("pointermove", function (e) {
  if (!dragC) return;
  dragC.c.dx = dragC.dx + e.clientX - dragC.x;
  dragC.c.dy = dragC.dy + e.clientY - dragC.y;
  state.activeView = null;
  render();
});
overlay.addEventListener("pointerup", function () { dragC = null; });
overlay.addEventListener("dblclick", function (e) {
  var g = e.target.closest(".callout"); if (!g) return;
  var c = calloutById(g), node = state.byKey.get(c.key);
  var v = prompt(t("Callout text (leave empty for the item number):"), c.text || calloutText(c, node));
  if (v === null) return;
  c.text = v.trim() || null;
  requestRender();
});
overlay.addEventListener("contextmenu", function (e) {
  var g = e.target.closest(".callout"); if (!g) return;
  e.preventDefault();
  var c = calloutById(g);
  state.callouts = state.callouts.filter(function (x) { return x !== c; });
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

// Renders the frame rectangle at w×h pixels and returns a 2D canvas.
function capture(opt) {
  var w = Math.round(opt.w), h = Math.round(opt.h), ss = opt.ss || 1, lim = maxDim();
  while (ss > 1 && Math.max(w, h) * ss > lim) ss--;
  if (Math.max(w, h) > lim) throw new Error(t("This computer can make images up to {n} pixels wide.", { n: lim }));
  var W = w * ss, H = h * ss, s = size(), fr = opt.frame || activeFrame();
  var prevPR = renderer.getPixelRatio(), bg = scene.background, gz = gizmoHelper.visible;
  var lit = state.lit;
  // no selection highlight or gizmo in the image
  state.lit = new Set(); lit.forEach(look);
  gizmoHelper.visible = false;
  if (opt.transparent) { scene.background = null; renderer.setClearColor(0x000000, 0); }
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  camera.setViewOffset(s.w, s.h, fr.x, fr.y, fr.w, fr.h);
  setLineScale(W / fr.w, W, H);
  updateNearFar();
  head.position.copy(camera.position); head.target.position.copy(controls.target);
  renderer.render(scene, camera);
  outlinePass();
  var out = document.createElement("canvas");
  out.width = w; out.height = h;
  var ctx = out.getContext("2d");
  if (opt.format === "jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(renderer.domElement, 0, 0, W, H, 0, 0, w, h);
  if (opt.callouts !== false) drawCallouts(ctx, calloutsFor(camera, w, h, w / fr.w), w / fr.w);
  // restore
  camera.clearViewOffset();
  scene.background = bg;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(prevPR);
  gizmoHelper.visible = gz;
  state.lit = lit; lit.forEach(look);
  resize();
  render();
  return out;
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

// ---------- saved views ----------
function v3(a) { return new THREE.Vector3().fromArray(a); }
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
    var k = m.parent.userData.key + "/" + m.parent.children.indexOf(m), d = {};
    if (m.userData.color) d.c = m.userData.color;
    if (m.userData.opacity != null) d.o = m.userData.opacity;
    if (Object.keys(d).length) parts[k] = d;
  });
  var p = pose();
  return {
    camera: { proj: camera.isPerspectiveCamera ? "persp" : "ortho", target: p.target.toArray(), dir: p.dir.toArray(), dist: p.dist, up: p.up.toArray(), zoom: p.zoom },
    parts: parts, explode: state.explode, style: state.style, zUp: state.zUp, ground: state.ground, light: state.light,
    section: Object.assign({}, state.section), bg: state.bg, bgColor: state.bgColor,
    callouts: JSON.parse(JSON.stringify(state.callouts))
  };
}

function restore(s, ms) {
  if (!state.model) return;
  if (!!s.zUp !== state.zUp) setZUp(s.zUp, true);
  state.nodes.forEach(function (o) {
    var h = o.userData.home, d = s.parts[o.userData.key] || {};
    o.visible = d.v !== 0;
    o.userData.base.copy(d.p ? v3(d.p) : h.p);
    o.position.copy(o.userData.base);
    o.quaternion.copy(d.q ? new THREE.Quaternion().fromArray(d.q) : h.q);
    if (o.isMesh) { if (d.c) o.userData.color = d.c; else delete o.userData.color; if (d.o != null) o.userData.opacity = d.o; else delete o.userData.opacity; }
  });
  state.meshes.forEach(function (m) {
    if (m.userData.key) return;
    var d = s.parts[m.parent.userData.key + "/" + m.parent.children.indexOf(m)] || {};
    if (d.c) m.userData.color = d.c; else delete m.userData.color;
    if (d.o != null) m.userData.opacity = d.o; else delete m.userData.opacity;
  });
  state.explode = s.explode || 0; $("rng-explode").value = Math.round(state.explode * 100);
  applyExplode();
  state.style = s.style || "shaded"; $("sel-style").value = state.style;
  state.section = Object.assign({ on: false, axis: "z", flip: false, pos: 500 }, s.section);
  $("chk-section").checked = state.section.on; $("sel-section-axis").value = state.section.axis;
  $("chk-section-flip").checked = state.section.flip; $("rng-section").value = state.section.pos;
  updateSection();
  state.bg = s.bg || "white"; state.bgColor = s.bgColor || "#ffffff"; applyBackground();
  if (s.ground != null) { state.ground = s.ground; $("chk-ground").checked = s.ground; floor.visible = s.ground; sun.castShadow = s.ground; }
  if (s.light != null) { state.light = s.light; $("rng-light").value = Math.round(s.light * 100); }
  applyLight();
  state.callouts = JSON.parse(JSON.stringify(s.callouts || []));
  applyStyle();
  var c = s.camera;
  if ((c.proj === "ortho") !== camera.isOrthographicCamera) setProjection(c.proj);
  flyTo({ target: v3(c.target), dir: v3(c.dir), dist: c.dist, up: v3(c.up), zoom: c.zoom }, ms);
  buildTreeKeepState();
  updateSelPanel();
  updateStatus();
}

function thumb() {
  var f = activeFrame(), a = f.w / f.h, w = a >= 1.5 ? 144 : Math.round(96 * a), h = a >= 1.5 ? Math.round(144 / a) : 96;
  return capture({ w: w, h: h, ss: 2, format: "png", frame: f }).toDataURL("image/png");
}

function addView() {
  if (!state.model) return toast(t("Open a model first."));
  var v = { id: Date.now(), name: t("View {n}", { n: state.views.length + 1 }), state: snapshot(), thumb: thumb() };
  state.views.push(v);
  state.activeView = v.id;
  renderViews(); storeViews();
}

function renderViews() {
  var ol = $("views-list");
  ol.innerHTML = "";
  state.views.forEach(function (v, i) {
    var li = document.createElement("li");
    li.className = v.id === state.activeView ? "on" : "";
    li.innerHTML = '<img alt=""><input type="text"><div class="acts"><button class="mini" data-a="update"></button><button class="mini" data-a="del"></button></div>';
    li.querySelector("img").src = v.thumb;
    var inp = li.querySelector("input");
    inp.value = v.name; inp.title = t("Rename");
    inp.addEventListener("click", function (e) { e.stopPropagation(); });
    inp.addEventListener("change", function () { v.name = inp.value.trim() || v.name; storeViews(); });
    var up = li.querySelector('[data-a="update"]'), del = li.querySelector('[data-a="del"]');
    up.textContent = t("Update"); up.title = t("Replace this view with what is on the screen now");
    del.textContent = t("Delete");
    up.addEventListener("click", function (e) { e.stopPropagation(); v.state = snapshot(); v.thumb = thumb(); state.activeView = v.id; renderViews(); storeViews(); });
    del.addEventListener("click", function (e) { e.stopPropagation(); state.views.splice(i, 1); renderViews(); storeViews(); });
    li.addEventListener("click", function () { restore(v.state, 400); state.activeView = v.id; renderViews(); });
    ol.appendChild(li);
  });
  $("btn-views-zip").disabled = $("btn-views-export").disabled = !state.views.length;
}

var VIEWS_KEY = "galil-model-studio-views:";
function storeViews() {
  try { localStorage.setItem(VIEWS_KEY + state.file, JSON.stringify(state.views)); } catch (e) { /* full or blocked */ }
}
function loadStoredViews() {
  state.views = [];
  try { var v = JSON.parse(localStorage.getItem(VIEWS_KEY + state.file) || "[]"); if (Array.isArray(v)) state.views = v; } catch (e) { state.views = []; }
  renderViews();
}

$("btn-view-add").addEventListener("click", addView);
$("btn-views-export").addEventListener("click", function () {
  var data = { app: "GALIL Model Studio", version: 1, model: state.file, views: state.views };
  download(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), stem() + " - " + t("views") + ".json");
});
$("btn-views-import").addEventListener("click", function () {
  if (!state.model) return toast(t("Open the model first, then load its views."));
  $("views-input").click();
});
$("views-input").addEventListener("change", async function () {
  var f = this.files[0]; this.value = "";
  if (!f) return;
  try {
    var data = JSON.parse(await f.text());
    var list = Array.isArray(data) ? data : data.views;
    if (!Array.isArray(list)) throw new Error("no views");
    list.forEach(function (v, i) { if (v && v.state) state.views.push({ id: Date.now() + i, name: v.name || t("View {n}", { n: state.views.length + 1 }), state: v.state, thumb: v.thumb || "" }); });
    renderViews(); storeViews();
    if (data.model && data.model !== state.file) toast(t("These views were saved for {name}.", { name: data.model }));
  } catch (e) { toast(t("That file does not hold Model Studio views."), true); }
});
$("btn-views-zip").addEventListener("click", async function () {
  if (!state.views.length) return;
  busy(t("Making the images…"));
  var now = snapshot(), files = [], o = shotOptions();
  try {
    for (var i = 0; i < state.views.length; i++) {
      var v = state.views[i];
      restore(v.state, 0);
      var blob = await toBlob(capture(o), o.format);
      var safe = v.name.replace(/[\\/:*?"<>|]+/g, "-");
      files.push({ name: String(i + 1).padStart(2, "0") + " " + safe + (o.format === "jpeg" ? ".jpg" : ".png"), bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    download(makeZip(files), stem() + " - " + t("views") + ".zip");
  } catch (err) { toast(err.message, true); }
  finally { restore(now, 0); busy(false); }
});

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
  if (ctrl && k.toLowerCase() === "o") { e.preventDefault(); $("file-input").click(); return; }
  if (ctrl && e.shiftKey && k.toLowerCase() === "s") { e.preventDefault(); saveImage(); return; }
  if (ctrl && k.toLowerCase() === "a" && state.model) { e.preventDefault(); select(state.parts.filter(shown)); return; }
  if (ctrl || e.altKey || !state.model) return;
  if (k === "f") fit();
  else if (k === "F") fit(state.selection.size ? Array.from(state.selection) : null);
  else if (k === "h" || k === "Delete") setVisible(Array.from(state.selection), false);
  else if (k === "H") showAll();
  else if (k === "i" || k === "I") isolate();
  else if (k === "t" || k === "T") setTMode("translate");
  else if (k === "r" || k === "R") setTMode("rotate");
  else if (k === "Escape") { state.tmode = null; select([]); }
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
  if (state.model) { buildTreeKeepState(); buildBom(); bomSelection(); updateSelPanel(); renderViews(); }
  updateStatus();
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

// For the tests and for people who script it from the console.
window.studio = {
  state: state, open: openFiles, openSample: openSample, capture: capture, snapshot: snapshot, restore: restore,
  select: function (names) { select(state.nodes.filter(function (n) { return names.indexOf(displayName(n)) >= 0; })); },
  camera: function () { return camera; },
  // Where a part's middle is on the screen (page coordinates).
  screenPoint: function (name) {
    var n = state.nodes.find(function (o) { return displayName(o) === name; });
    var v = worldBox([n]).getCenter(new THREE.Vector3()).project(camera), r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }
};
