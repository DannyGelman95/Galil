// Opening files: CAD (STEP, IGES, BREP) through OpenCascade in a worker, and
// mesh formats through the three.js loaders. Every format ends up as one
// THREE.Object3D whose hierarchy is the model's assembly structure.
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { VRMLLoader } from "three/addons/loaders/VRMLLoader.js";
import { TDSLoader } from "three/addons/loaders/TDSLoader.js";
import { AMFLoader } from "three/addons/loaders/AMFLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

export const CAD = { step: "step", stp: "step", p21: "step", iges: "iges", igs: "iges", brep: "brep", brp: "brep" };
export const MESH = ["gltf", "glb", "obj", "stl", "3mf", "ply", "fbx", "dae", "wrl", "vrml", "3ds", "amf"];
// Files that carry no model of their own but are read with one (OBJ materials,
// glTF buffers, textures).
const RESOURCE = ["mtl", "bin", "png", "jpg", "jpeg", "webp", "bmp", "gif", "tga", "ktx2"];
// Native formats of CAD and documentation programs that no browser can read.
export const NATIVE = {
  sldprt: "SolidWorks part", sldasm: "SolidWorks assembly", slddrw: "SolidWorks drawing",
  ipt: "Inventor part", iam: "Inventor assembly", idw: "Inventor drawing",
  catpart: "CATIA part", catproduct: "CATIA product", cgr: "CATIA CGR",
  prt: "Creo or NX part", asm: "Creo assembly", x_t: "Parasolid", x_b: "Parasolid",
  sat: "ACIS", sab: "ACIS", jt: "JT", "3dxml": "3D XML", f3d: "Fusion 360", f3z: "Fusion 360",
  par: "Solid Edge part", psm: "Solid Edge sheet metal", dwg: "AutoCAD drawing", dxf: "AutoCAD drawing",
  smg: "SOLIDWORKS Composer", smgxml: "SOLIDWORKS Composer", rh: "Cortona3D", "3dm": "Rhino"
};
// Formats usually written Z-up (3D printing and scanning).
export const Z_UP = ["stl", "3mf", "ply", "amf"];

export function ext(name) {
  var m = /\.([^.\/\\]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

function base(name) {
  return String(name).split(/[\\/]/).pop().toLowerCase();
}

// Picks the model among the files given (the others are its resources).
export function pickMain(files) {
  var rank = function (f) {
    var e = ext(f.name);
    if (CAD[e]) return 0;
    if (e === "gltf" || e === "glb") return 1;
    if (MESH.indexOf(e) >= 0) return 2;
    if (NATIVE[e]) return 8;
    if (RESOURCE.indexOf(e) >= 0) return 9;
    return 10;
  };
  var sorted = files.slice().sort(function (a, b) { return rank(a) - rank(b); });
  return sorted[0];
}

// ---------- CAD through OpenCascade ----------
var worker = null, seq = 0, pending = new Map();

function occt(format, buffer) {
  if (!worker) {
    worker = new Worker(new URL("./occt-worker.js", import.meta.url));
    worker.onmessage = function (e) {
      var p = pending.get(e.data.id); if (!p) return;
      pending.delete(e.data.id);
      if (e.data.error) p.reject(new Error(e.data.error)); else p.resolve(e.data.result);
    };
    worker.onerror = function (e) {
      pending.forEach(function (p) { p.reject(new Error(e.message || "The CAD reader stopped.")); });
      pending.clear(); worker.terminate(); worker = null;
    };
  }
  var id = ++seq;
  return new Promise(function (resolve, reject) {
    pending.set(id, { resolve: resolve, reject: reject });
    worker.postMessage({
      id: id, format: format, buffer: buffer,
      params: { linearUnit: "millimeter", linearDeflectionType: "bounding_box_ratio", linearDeflection: 0.0008, angularDeflection: 0.35 }
    }, [buffer]);
  });
}

function cadMesh(m) {
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(m.attributes.position.array, 3));
  if (m.attributes.normal) g.setAttribute("normal", new THREE.Float32BufferAttribute(m.attributes.normal.array, 3));
  if (m.index) g.setIndex(new THREE.Uint32BufferAttribute(m.index.array, 1));
  if (!m.attributes.normal) g.computeVertexNormals();
  var color = m.color ? new THREE.Color().setRGB(m.color[0], m.color[1], m.color[2], THREE.SRGBColorSpace) : new THREE.Color(0xB8C0CC);
  var mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.12, roughness: 0.5 });
  // Faces coloured differently from their part become vertex colours.
  var faces = (m.brep_faces || []).filter(function (f) { return f.color; });
  if (faces.length && m.index) {
    var cols = new Float32Array(g.attributes.position.count * 3), idx = m.index.array, c = new THREE.Color();
    for (var v = 0; v < cols.length; v += 3) { cols[v] = color.r; cols[v + 1] = color.g; cols[v + 2] = color.b; }
    faces.forEach(function (f) {
      c.setRGB(f.color[0], f.color[1], f.color[2], THREE.SRGBColorSpace);
      for (var t = f.first; t <= f.last; t++) for (var k = 0; k < 3; k++) {
        var vi = idx[t * 3 + k] * 3; cols[vi] = c.r; cols[vi + 1] = c.g; cols[vi + 2] = c.b;
      }
    });
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    mat.vertexColors = true; mat.color.set(0xffffff);
  }
  var mesh = new THREE.Mesh(g, mat);
  mesh.name = m.name || "";
  return mesh;
}

async function readCad(file, format) {
  var res = await occt(format, await file.arrayBuffer());
  if (!res || !res.success) throw new Error("This file could not be read as " + format.toUpperCase() + ".");
  function node(n) {
    var g = new THREE.Group();
    g.name = n.name || "";
    n.meshes.forEach(function (i) { g.add(cadMesh(res.meshes[i])); });
    n.children.forEach(function (c) { g.add(node(c)); });
    return g;
  }
  return node(res.root);
}

// ---------- mesh formats ----------
function manager(resources) {
  var m = new THREE.LoadingManager();
  m.setURLModifier(function (url) {
    if (/^(blob|data):/.test(url)) return url;
    var key = base(decodeURIComponent(url.split("?")[0]));
    return resources[key] || url;
  });
  return m;
}

function geometryMesh(g, name) {
  if (!g.attributes.normal || g.userData.flatNormals) {
    g.deleteAttribute("normal");
    g = toCreasedNormals(g, THREE.MathUtils.degToRad(30));
  }
  var mat = new THREE.MeshStandardMaterial({
    color: g.attributes.color ? 0xffffff : 0xB8C0CC, vertexColors: !!g.attributes.color, metalness: 0.12, roughness: 0.5
  });
  var mesh = new THREE.Mesh(g, mat);
  mesh.name = name;
  return mesh;
}

async function readMesh(file, e, files) {
  var resources = {}, urls = [];
  files.forEach(function (f) { if (f !== file) { var u = URL.createObjectURL(f); urls.push(u); resources[base(f.name)] = u; } });
  var mgr = manager(resources), stem = file.name.replace(/\.[^.]+$/, "");
  try {
    switch (e) {
      case "stl": {
        var g = new STLLoader(mgr).parse(await file.arrayBuffer());
        g.userData.flatNormals = true;
        return geometryMesh(g, stem);
      }
      case "ply": return geometryMesh(new PLYLoader(mgr).parse(await file.arrayBuffer()), stem);
      case "obj": {
        var loader = new OBJLoader(mgr), text = await file.text();
        var lib = /^\s*mtllib\s+(.+?)\s*$/m.exec(text);
        if (lib && resources[base(lib[1])]) {
          var mtl = await new MTLLoader(mgr).loadAsync(resources[base(lib[1])]);
          mtl.preload(); loader.setMaterials(mtl);
        }
        var o = loader.parse(text);
        o.traverse(function (c) { if (c.isMesh && !c.geometry.attributes.normal) c.geometry.computeVertexNormals(); });
        return o;
      }
      case "gltf": case "glb": {
        var gl = new GLTFLoader(mgr);
        var data = e === "glb" ? await file.arrayBuffer() : await file.text();
        var gltf = await new Promise(function (res, rej) { gl.parse(data, "", res, rej); });
        return gltf.scene;
      }
      case "3mf": return new ThreeMFLoader(mgr).parse(await file.arrayBuffer());
      case "fbx": return new FBXLoader(mgr).parse(await file.arrayBuffer(), "");
      case "dae": return new ColladaLoader(mgr).parse(await file.text(), "").scene;
      case "wrl": case "vrml": return new VRMLLoader(mgr).parse(await file.text(), "");
      case "3ds": return new TDSLoader(mgr).parse(await file.arrayBuffer(), "");
      case "amf": return new AMFLoader(mgr).parse(await file.arrayBuffer());
    }
  } finally {
    // Textures are decoded by now or keep their own copy; free the file URLs a little later.
    setTimeout(function () { urls.forEach(URL.revokeObjectURL); }, 30000);
  }
  throw new Error("Unsupported format");
}

// Every mesh gets its own PBR material (so its colour and opacity can be set on
// its own) and the wrappers that add nothing to the structure are removed.
function normalise(root) {
  root.traverse(function (o) {
    if (!o.isMesh) return;
    var conv = function (m) {
      if (m.isMeshStandardMaterial) return m.clone();
      var n = new THREE.MeshStandardMaterial({
        color: m.color ? m.color.clone() : 0xB8C0CC, map: m.map || null, vertexColors: !!m.vertexColors,
        opacity: m.opacity, transparent: m.transparent && m.opacity < 1, side: m.side,
        metalness: 0.12, roughness: 0.5
      });
      n.name = m.name;
      return n;
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    o.castShadow = true;
  });
  root.traverse(function (o) { if (o.isLight || o.isCamera) o.visible = false; });
  // A group holding a single mesh is that mesh; a nameless group holding a
  // single group is that group.
  (function simplify(o) {
    for (var i = 0; i < o.children.length; i++) {
      var c = o.children[i];
      simplify(c);
      if (!c.isMesh && c.children.length === 1 && !c.isLight) {
        var only = c.children[0];
        if (only.isMesh || !c.name) {
          c.updateMatrix(); only.applyMatrix4(c.matrix);
          if (c.name && (only.isMesh || !only.name)) only.name = c.name;
          o.children[i] = only; only.parent = o;
          c.children.length = 0; c.parent = null;
        }
      }
    }
  })(root);
  return root;
}

export async function loadModel(files) {
  var file = pickMain(files), e = ext(file.name);
  if (NATIVE[e]) {
    var err = new Error(NATIVE[e]);
    err.native = NATIVE[e];
    throw err;
  }
  var obj;
  if (CAD[e]) obj = await readCad(file, CAD[e]);
  else if (MESH.indexOf(e) >= 0) obj = await readMesh(file, e, files);
  else { var u = new Error(e); u.unsupported = e || file.name; throw u; }
  var wrap = new THREE.Group();
  wrap.add(obj);
  normalise(wrap);
  var root = wrap.children[0];
  wrap.remove(root);
  if (!root.name) root.name = file.name.replace(/\.[^.]+$/, "");
  return { object: root, file: file.name, ext: e, units: CAD[e] ? "mm" : "", zUp: Z_UP.indexOf(e) >= 0 };
}
