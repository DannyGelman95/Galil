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
    applyPrefs();
    authInit();
    parseRoute(); lastRoute = ui.route.slice();
    onRouteChange(null);
    render();
    return;
  }
  /* shared data file: with Entra, sign in first (OneDrive needs the token); otherwise open the file, then sign in */
  db = emptyDB(); applyPrefs();
  parseRoute(); lastRoute = ui.route.slice();
  if (!ENTRA) { if (!signedIn()) { render(); return; } startRemote().then(function () { onRouteChange(null); render(); }); return; }
  Auth.phase = "starting"; render();
  authInit().then(function () {
    parseRoute(); lastRoute = ui.route.slice();
    render();
    if (Auth.account && signedIn()) return startRemote().then(function () { onRouteChange(null); render(); });
  });
}
/* WorkDesk (in another tab of the portal) changed people, clients, projects or work orders: bring them in */
function resyncFromWorkdesk() {
  if (!db || !db.users || !db.users.length || authGate()) return;
  if (syncFromWorkdesk(db)) { save(true); dataVersion++; refreshUI(); }
}
window.addEventListener("storage", function (e) {
  if (e.key === "galil-workdesk-v1") resyncFromWorkdesk();
  if (e.key === "galil-workdesk-session") { if (!signedIn()) render(); else { db.settings.currentUserId = (portalUser() || {}).id || null; render(); } }
  if (e.key === "galil-portal-lang" || e.key === "galil-workdesk-theme") location.reload();
});
window.addEventListener("focus", resyncFromWorkdesk);
boot();
