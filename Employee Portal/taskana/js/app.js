/* =====================================================================
   Taskana — start-up and keyboard shortcuts.
   ===================================================================== */
"use strict";

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && (ui.modal || ui.openTask)) { e.preventDefault(); dismissTop(); return; }
  /* "c" = new task — only on its own, never with Ctrl/Cmd/Alt (so copying text still works) */
  if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !ui.modal && !ui.openTask && !authGate() && can.createTask()) {
    var a = document.activeElement;
    if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
    if (window.getSelection && String(window.getSelection())) return;
    e.preventDefault(); openModal({ kind: "task", defaults: {} });
  }
});

function boot() {
  root = document.getElementById("app");
  if (!REMOTE) {
    db = load();
    LANG = db.settings.lang === "he" ? "he" : "en";
    authInit();
    parseRoute(); lastRoute = ui.route.slice();
    onRouteChange(null);
    render();
    return;
  }
  /* shared data file: with Entra, sign in first (OneDrive needs the token); otherwise open the file, then sign in */
  db = emptyDB(); applyPrefs();
  parseRoute(); lastRoute = ui.route.slice();
  if (!ENTRA) { startRemote().then(function () { onRouteChange(null); render(); }); return; }
  Auth.phase = "starting"; render();
  authInit().then(function () {
    parseRoute(); lastRoute = ui.route.slice();
    render();
    if (Auth.account) return startRemote().then(function () { onRouteChange(null); render(); });
  });
}
boot();
