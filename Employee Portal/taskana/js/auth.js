/* =====================================================================
   Taskana — who is signed in.
   People sign in once, on the Employee Portal home (../index.html):
   Microsoft Entra ID when config.js has a client ID, otherwise the
   company email and the demo password. Taskana reads that session
   (shared/portal.js); it has no sign-in screen of its own. Someone who
   isn't signed in, or whose portal access has no Taskana role, sees a
   screen that leads back to the portal.
   With Entra ID, Taskana also asks Microsoft (silently, with the
   portal's account) for the token it needs to read and save its files
   on OneDrive.
   ===================================================================== */
"use strict";

var GRAPH_SCOPES = ["User.Read", "Files.ReadWrite.All"];
var Auth = { phase: "", pca: null, account: null, error: "" };

function domainOK(email) { email = (email || "").trim().toLowerCase(); return email.length > DOMAIN.length && email.slice(-DOMAIN.length) === DOMAIN; }
/* the portal session is the sign-in */
function signedIn() { var u = portalUser(); return !!u && portalAccess(u).taskana !== "none"; }
/* once the shared data is in: bring WorkDesk's people, clients, projects and work orders in, and point at the signed-in person */
function afterDataLoaded() {
  var changed = syncFromWorkdesk(db);
  var u = portalUser();
  db.settings.currentUserId = u ? u.id : null;
  if (u) {
    var me_ = byId(db.users, u.id);
    if (me_ && (!me_.lastSignInAt || Date.now() - new Date(me_.lastSignInAt).getTime() > 12 * 3600 * 1000)) { me_.lastSignInAt = nowISO(); me_.authProvider = ENTRA ? "microsoft" : "password"; changed = true; }
  }
  if (changed) save(true);
  dataVersion++;
}

/* ---------- start-up: with Entra ID, the portal's Microsoft account gives Taskana its OneDrive token ---------- */
function authInit() {
  if (!ENTRA) { afterDataLoaded(); return Promise.resolve(); }
  var Cls = window.TASKANA_MSAL || (window.msal && window.msal.PublicClientApplication);
  if (!Cls) { Auth.error = tr("The Microsoft sign-in component didn't load. Reload the page."); return Promise.resolve(); }
  if (!/^https?:$/.test(location.protocol)) { Auth.error = tr("Microsoft sign-in needs Taskana to be opened from its web address (https://…), not from a file on disk."); return Promise.resolve(); }
  var here = location.origin + location.pathname;
  Auth.pca = new Cls({
    auth: { clientId: CONFIG.entra.clientId, authority: "https://login.microsoftonline.com/" + (CONFIG.entra.tenantId || "organizations"), redirectUri: here, postLogoutRedirectUri: here },
    cache: { cacheLocation: "localStorage" }
  });
  Auth.phase = "starting";
  return Promise.resolve(Auth.pca.initialize ? Auth.pca.initialize() : null)
    .then(function () { return Auth.pca.handleRedirectPromise(); })
    .then(function (res) {
      var u = portalUser(), all = Auth.pca.getAllAccounts();
      var acc = (res && res.account) || all.filter(function (a) { return u && (a.username || "").toLowerCase() === (u.email || "").toLowerCase(); })[0] ||
        (Auth.pca.getActiveAccount && Auth.pca.getActiveAccount()) || all[0] || null;
      if (!acc) return;
      if (Auth.pca.setActiveAccount) Auth.pca.setActiveAccount(acc);
      Auth.account = acc;
    })
    .catch(function (e) { Auth.error = tr("Microsoft sign-in didn't finish: {m}", { m: (e && (e.errorMessage || e.message)) || String(e) }); })
    .then(function () { Auth.phase = ""; if (/^#(code|error|state)=/.test(location.hash)) setHash("#/home"); });
}
function interactionNeeded(e) {
  if (window.msal && window.msal.InteractionRequiredAuthError && e instanceof window.msal.InteractionRequiredAuthError) return true;
  return /interaction_required|login_required|consent_required|no_tokens_found|no_account/i.test((e && (e.errorCode || e.name || e.message)) || "");
}
/* an access token for Microsoft Graph (OneDrive) */
function graphToken(force) {
  if (!Auth.pca || !Auth.account) return Promise.reject(new Error(tr("Not signed in.")));
  return Auth.pca.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: Auth.account, forceRefresh: !!force })
    .then(function (r) { return r.accessToken; })
    .catch(function (e) {
      if (!interactionNeeded(e)) throw e;
      Auth.pca.acquireTokenRedirect({ scopes: GRAPH_SCOPES, account: Auth.account });
      return new Promise(function () {});   // the page is leaving for Microsoft
    });
}
/* the portal signs out (and, with Entra ID, signs the account out of this device) */
function signOut() { Store.stop(); GalilPortal.signOut("../"); }

/* ---------- screens shown instead of the app ---------- */
function authShell(children) {
  return h("div", { class: "auth" }, h("div", { class: "authcard" },
    h("div", { class: "auth-brand" }, logo(46), h("div", null, h("b", null, "Taskana"), h("small", null, tr("by GALIL")))),
    children,
    h("div", { class: "auth-foot" },
      h("a", { class: "btn ghost sm", href: "../index.html" }, icon("home"), tr("Employee Portal")),
      h("button", { class: "btn ghost sm", lang: LANG === "he" ? "en" : "he", onclick: function () { GalilPortal.setLang(LANG === "he" ? "en" : "he"); } }, icon("globe"), LANG === "he" ? "English" : "עברית"))));
}
function splash(text) { return authShell(h("div", { class: "auth-wait", role: "status" }, h("span", { class: "spinner", "aria-hidden": "true" }), text)); }
/* not signed in to the portal, or no Taskana in this person's portal access */
function portalGateScreen() {
  var u = portalUser();
  return authShell([
    h("h1", { class: "auth-h" }, u ? tr("No access to Taskana") : tr("Sign in to the Employee Portal first")),
    h("p", null, u ? tr("Your account ({e}) doesn't include Taskana. Ask an Operations Manager or the CEO to add it to your portal access.", { e: u.email })
      : tr("Taskana is part of the GALIL Employee Portal. Sign in there once, then open Taskana from the home page.")),
    h("a", { class: "btn primary wide", id: "to-portal", href: "../index.html" }, u ? tr("Back to the Employee Portal") : tr("Go to the Employee Portal"))
  ]);
}

function authGate() {
  if (Auth.phase === "starting") return splash(tr("Signing in…"));
  if (!signedIn()) return portalGateScreen();
  if (ENTRA && !Auth.account) return authShell([h("h1", { class: "auth-h" }, tr("Sign in to the Employee Portal first")),
    Auth.error ? h("div", { class: "banner err", role: "alert" }, icon("alert"), " ", Auth.error) : null,
    h("p", null, tr("Taskana needs your Microsoft sign-in from the Employee Portal to open its files on OneDrive.")),
    h("a", { class: "btn primary wide", href: "../index.html" }, tr("Go to the Employee Portal"))]);
  if (Store.remote) {
    if (Store.state === "token") return tokenScreen();
    if (Store.state === "setup") return setupScreen();
    if (!db.users.length) return Store.state === "error" ? storeErrorScreen() : splash(tr("Opening Taskana from {w}…", { w: whereName() }));
  }
  var u = byId(db.users, db.settings.currentUserId);
  if (!u) { afterDataLoaded(); u = byId(db.users, db.settings.currentUserId); }
  if (!u) return portalGateScreen();
  return null;
}

/* ---------- dialog: Microsoft 365 connection (Admins, from the Data window) ---------- */
function connectionModal() {
  var c = CONFIG, here = location.origin + location.pathname, g = c.github;
  var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
  var inp = function (id, label, value, ph, cls, help) {
    return h("div", { class: "field" }, h("label", { class: "l", for: id }, label), h("input", { class: "f" + (cls ? " " + cls : ""), id: id, value: value, placeholder: ph || "" }),
      help ? h("div", { class: "muted small", style: { marginTop: "3px" } }, help) : null);
  };
  return shell(tr("Connection settings"), h("div", null,
    h("p", { class: "muted small", style: { marginTop: 0 } }, tr("Where Taskana keeps its data and how people sign in. config.js sets this for everyone; settings saved here apply to this browser only, for trying things out.")),
    h("div", { class: "fields" },
      h("div", { class: "field" }, h("label", { class: "l", for: "cx-storage" }, tr("Data location")),
        h("select", { class: "f", id: "cx-storage" }, [["local", tr("This browser only (demo)")], ["github", tr("A data file in a GitHub repository")], ["onedrive", tr("A OneDrive folder (needs Microsoft Entra ID)")]].map(function (o) { return h("option", { value: o[0], selected: STORAGE === o[0] }, o[1]); }))),
      h("h3", { style: { gridColumn: "1/-1", margin: "6px 0 4px" } }, "GitHub"),
      inp("cx-gh-repo", tr("Repository (owner/name)"), g.owner && g.repo ? g.owner + "/" + g.repo : "", "DannyGelman95/Galil"),
      inp("cx-gh-branch", tr("Branch for the data"), g.branch, "taskana-data", "mono", tr("Created automatically on first use.")),
      inp("cx-gh-path", tr("Folder in the repository"), g.path, "taskana", "mono"),
      h("h3", { style: { gridColumn: "1/-1", margin: "6px 0 4px" } }, "Microsoft 365"),
      inp("cx-client", tr("Application (client) ID"), c.entra.clientId, "00000000-0000-0000-0000-000000000000", "mono", tr("Filled in: sign-in goes through Microsoft Entra ID.")),
      inp("cx-tenant", tr("Directory (tenant) ID"), c.entra.tenantId, tr("optional"), "mono"),
      inp("cx-folder", tr("OneDrive folder link"), c.onedrive.folderLink, "https://galiltc-my.sharepoint.com/:f:/g/personal/…", "", tr("Empty: a “{f}” folder in the signed-in person's own OneDrive.", { f: c.onedrive.folderName }))),
    h("p", { class: "small" }, tr("Redirect URI to register (platform: Single-page application):"), " ", h("span", { class: "mono sel-text" }, here))),
    [c.override ? h("button", { class: "btn danger", style: { marginInlineEnd: "auto" }, onclick: function () { try { localStorage.removeItem(CONFIG_KEY); } catch (e) {} location.reload(); } }, tr("Use config.js")) : null,
      h("button", { class: "btn", onclick: closeModal }, tr("Cancel")),
      h("button", { class: "btn primary", onclick: function () {
        var id = val("cx-client"), ten = val("cx-tenant"), link = val("cx-folder"), st = val("cx-storage"), repo = val("cx-gh-repo");
        var guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (id && !guid.test(id)) { toast(tr("The client ID is a GUID like 00000000-0000-0000-0000-000000000000.")); return; }
        if (ten && !guid.test(ten)) { toast(tr("The tenant ID is a GUID like 00000000-0000-0000-0000-000000000000.")); return; }
        if (link && !/^https:\/\//i.test(link)) { toast(tr("The folder link starts with https://")); return; }
        if (st === "github" && !/^[\w.-]+\/[\w.-]+$/.test(repo)) { toast(tr("Enter the repository as owner/name.")); return; }
        if (st === "onedrive" && !id) { toast(tr("OneDrive needs the Microsoft Entra application ID.")); return; }
        var rp = repo.split("/");
        try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ storage: st, entra: { clientId: id, tenantId: ten }, onedrive: { folderLink: link },
          github: { owner: rp[0] || "", repo: rp[1] || "", branch: val("cx-gh-branch") || "taskana-data", path: val("cx-gh-path") } })); } catch (e) {}
        location.reload();
      } }, tr("Save and reload"))]);
}
