// Reads STEP, IGES and BREP files with OpenCascade (occt-import-js, WebAssembly)
// off the main thread, so the page stays responsive while a large assembly loads.
importScripts("../vendor/occt/occt-import-js.js");

var ready = occtimportjs({ locateFile: function (path) { return "../vendor/occt/" + path; } });

onmessage = function (ev) {
  ready.then(function (occt) {
    var result = occt.ReadFile(ev.data.format, new Uint8Array(ev.data.buffer), ev.data.params);
    postMessage({ id: ev.data.id, result: result });
  }).catch(function (err) {
    postMessage({ id: ev.data.id, error: String(err && err.message || err) });
  });
};
