/* =====================================================================
   Taskana — signing in.
   Connected (config.js has an Entra client ID): "Sign in with Microsoft"
   and "Sign in with your email" both go through Microsoft Entra ID (MSAL,
   bundled in js/vendor); the password is only ever typed on Microsoft's
   page. Standalone demo: a simulated Microsoft account picker and an
   email + demo password form, as in WorkDesk.
   Either way only @galiltc.co.il accounts get in, and anyone not yet in
   People waits in "Pending activation" until an Admin lets them in.
   ===================================================================== */
"use strict";

var SESSION_KEY = "galil-taskana-session";
var DEMO_PASSWORD = "GalilTaskana1";
var GRAPH_SCOPES = ["User.Read", "Files.ReadWrite.All"];
var Auth = { phase: "", pca: null, account: null, error: "", form: { email: "", pw: "", mode: "", err: "" }, fails: {} };

function domainOK(email) { email = (email || "").trim().toLowerCase(); return email.length > DOMAIN.length && email.slice(-DOMAIN.length) === DOMAIN; }
function domainMsg() { return tr("Only addresses ending in {d} can sign in. Outsourced staff get a {d} account from an Admin.", { d: DOMAIN }); }
function readSession() { try { var s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return s && s.userId ? s : null; } catch (e) { return null; } }
function writeSession(s) { try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }
function signedIn() { return ENTRA ? !!Auth.account : !!readSession(); }
/* once the shared data is in: match the Microsoft account, or pick up the demo session */
function afterDataLoaded() {
  if (ENTRA) { bindAccount(); return; }
  var s = readSession();
  if (s && byId(db.users, s.userId)) db.settings.currentUserId = s.userId; else if (s) writeSession(null);
}

/* ---------- start-up ---------- */
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
      var acc = (res && res.account) || (Auth.pca.getActiveAccount && Auth.pca.getActiveAccount()) || Auth.pca.getAllAccounts()[0] || null;
      if (!acc) return;
      if (!domainOK(acc.username)) { Auth.error = domainMsg(); return forgetAccount(acc); }
      var tid = (acc.idTokenClaims || {}).tid || acc.tenantId;
      if (CONFIG.entra.tenantId && tid && tid !== CONFIG.entra.tenantId) { Auth.error = tr("That account belongs to another organisation."); return forgetAccount(acc); }
      if (Auth.pca.setActiveAccount) Auth.pca.setActiveAccount(acc);
      Auth.account = acc;
    })
    .catch(function (e) { Auth.error = tr("Microsoft sign-in didn't finish: {m}", { m: (e && (e.errorMessage || e.message)) || String(e) }); })
    .then(function () { Auth.phase = ""; if (/^#(code|error|state)=/.test(location.hash)) setHash("#/home"); });
}

/* ---------- Microsoft Entra ID ---------- */
function msLogin(email) {
  Auth.error = "";
  var req = { scopes: GRAPH_SCOPES, domainHint: DOMAIN.slice(1), prompt: email ? "login" : "select_account" };
  if (email) req.loginHint = email;
  Auth.phase = "starting"; render();
  Auth.pca.loginRedirect(req).catch(function (e) { Auth.phase = ""; Auth.error = (e && (e.errorMessage || e.message)) || String(e); render(); });
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
/* sign out of Taskana on this device only (stays signed in to Office) */
function forgetAccount(acc) {
  Auth.account = null;
  if (!Auth.pca || !Auth.pca.logoutRedirect) return Promise.resolve();
  return Auth.pca.logoutRedirect({ account: acc, onRedirectNavigate: function () { return false; } }).catch(function () {});
}

/* Matches the Microsoft account to a person: by Entra id, then email, then (first sign-in only) full name.
   Someone new is added as Pending activation, unless nobody can activate them yet. */
function bindAccount(makeAdmin) {
  var acc = Auth.account; if (!acc) return null;
  var email = acc.username.toLowerCase(), oid = acc.localAccountId || (acc.idTokenClaims || {}).oid || "", name = (acc.name || email.split("@")[0]).trim();
  var norm = function (s) { return (s || "").toLowerCase().replace(/[^a-z\u0590-\u05ff]+/g, " ").trim(); };
  var u = (oid && db.users.filter(function (x) { return x.entraId === oid; })[0]) ||
    db.users.filter(function (x) { return (x.email || "").toLowerCase() === email; })[0] ||
    db.users.filter(function (x) { return !x.entraId && !x.lastSignInAt && norm(x.fullName) === norm(name); })[0];
  var admins = db.users.filter(function (x) { return x.isActive && x.role === "Admin"; }).length;
  var changed = false;
  if (!u) {
    var first = !admins;
    u = { id: uid("u"), fullName: name, email: email, jobTitle: "", department: "", role: first ? "Admin" : "Viewer", employment: "Employee", managerId: null,
      isActive: first, pendingActivation: !first, requestedAt: nowISO() };
    db.users.push(u); changed = true;
  }
  if (makeAdmin && (u.role !== "Admin" || !u.isActive)) { u.role = "Admin"; u.isActive = true; u.pendingActivation = false; changed = true; }
  if (oid && u.entraId !== oid) { u.entraId = oid; changed = true; }
  if ((u.email || "").toLowerCase() !== email) { u.email = email; changed = true; }
  if (u.authProvider !== "microsoft") { u.authProvider = "microsoft"; changed = true; }
  if (!u.lastSignInAt || Date.now() - new Date(u.lastSignInAt).getTime() > 12 * 3600 * 1000) { u.lastSignInAt = nowISO(); changed = true; }
  db.settings.currentUserId = u.id;
  if (changed) save(true);
  return u;
}

/* ---------- standalone demo ---------- */
function demoSignIn(u, provider) {
  writeSession({ userId: u.id, provider: provider, at: nowISO() });
  db.settings.currentUserId = u.id;
  u.lastSignInAt = nowISO(); u.authProvider = provider; save(true);
  Auth.form = { email: "", pw: "", mode: "", err: "" };
  parseRoute(); onRouteChange(null); render();
  toast(tr("Signed in as {n}", { n: u.fullName }));
}
function tryPassword() {
  var f = Auth.form, email = f.email.trim().toLowerCase();
  if (!email) { f.err = tr("Enter your company email address."); return render(); }
  if (!domainOK(email)) { f.err = domainMsg(); return render(); }
  if (ENTRA) return msLogin(email);
  var lock = Auth.fails[email];
  if (lock && lock.until > Date.now()) { f.err = tr("Account locked after five failed attempts. Try again in {m} minutes.", { m: Math.ceil((lock.until - Date.now()) / 60000) }); return render(); }
  var u = db.users.filter(function (x) { return (x.email || "").toLowerCase() === email && !x.declined; })[0];
  if (!u || f.pw !== DEMO_PASSWORD) {
    lock = Auth.fails[email] = Auth.fails[email] || { n: 0, until: 0 };
    lock.n++; if (lock.n >= 5) { lock.until = Date.now() + 15 * 60000; lock.n = 0; }
    f.err = lock.until > Date.now() ? tr("Five failed attempts — the account is locked for 15 minutes.") : tr("That email and password don't match. {n} attempts left.", { n: 5 - lock.n });
    f.pw = ""; return render();
  }
  Auth.fails[email] = null;
  demoSignIn(u, "password");
}
function signOut() {
  if (ENTRA) {
    var acc = Auth.account;
    Store.stop(); Store.clearCache();
    forgetAccount(acc).then(function () { db = emptyDB(); applyPrefs(); render(); });
  } else { writeSession(null); db.settings.currentUserId = null; }
  ui.modal = null; ui.modalStack = []; ui.openTask = null;
  render();
}

/* ---------- screens shown instead of the app ---------- */
function authShell(children) {
  return h("div", { class: "auth" }, h("div", { class: "authcard" },
    h("div", { class: "auth-brand" }, logo(46), h("div", null, h("b", null, "Taskana"), h("small", null, tr("by GALIL")))),
    children,
    h("div", { class: "auth-foot" },
      h("button", { class: "btn ghost sm", onclick: function () { db.settings.theme = isDark() ? "light" : "dark"; savePrefs(); render(); } }, icon(isDark() ? "sun" : "moon"), isDark() ? tr("Light") : tr("Dark")),
      h("button", { class: "btn ghost sm", lang: LANG === "he" ? "en" : "he", onclick: function () { LANG = LANG === "he" ? "en" : "he"; db.settings.lang = LANG; savePrefs(); render(); } }, icon("globe"), LANG === "he" ? "English" : "עברית"))));
}
function splash(text) { return authShell(h("div", { class: "auth-wait", role: "status" }, h("span", { class: "spinner", "aria-hidden": "true" }), text)); }

function signInScreen() {
  var f = Auth.form;
  var field = function (id, label, type, k, extra) {
    return h("div", { class: "field" }, h("label", { class: "l", for: id }, label),
      h("input", Object.assign({ class: "f", id: id, type: type, value: f[k], oninput: function (e) { f[k] = e.target.value; if (f.err) { f.err = ""; var m = document.getElementById("si-err"); if (m) m.remove(); } } }, extra || {})));
  };
  var picker = f.mode === "ms" && !ENTRA ? h("div", { class: "msbox" },
    h("b", null, "Microsoft Entra ID"), h("div", { class: "muted small" }, tr("Choose an account. Simulated in the standalone build — no Microsoft call is made.")),
    h("div", { class: "msacc-list" }, db.users.filter(function (u) { return u.isActive; }).map(function (u) {
      return h("button", { type: "button", class: "msacc", onclick: function () { demoSignIn(u, "microsoft"); } }, avatar(u.id),
        h("span", { class: "grow" }, h("span", { class: "nm" }, u.fullName), h("span", { class: "em" }, u.email)), h("span", { class: "chip" }, tr(u.role)));
    })),
    h("button", { type: "button", class: "btn ghost sm", onclick: function () { f.mode = ""; render(); } }, tr("Cancel"))) : null;
  return authShell([
    h("h1", { class: "auth-h" }, tr("Sign in")),
    Auth.error ? h("div", { class: "banner err", role: "alert" }, icon("alert"), " ", Auth.error) : null,
    h("button", { class: "btn ms", id: "si-ms", disabled: ENTRA && !Auth.pca, onclick: function () { if (ENTRA) msLogin(); else { f.mode = f.mode === "ms" ? "" : "ms"; render(); } } }, msLogo(), tr("Sign in with Microsoft")),
    h("div", { class: "muted small center" }, ENTRA ? tr("Uses your GALIL Microsoft 365 account and the company's MFA policy.") : tr("Standalone demo: Microsoft sign-in is simulated.")),
    picker,
    h("div", { class: "or" }, h("span", null, tr("or"))),
    h("form", { novalidate: true, onsubmit: function (e) { e.preventDefault(); tryPassword(); } },
      field("si-email", tr("Company email"), "email", "email", { autocomplete: "username", placeholder: "name" + DOMAIN }),
      ENTRA ? h("p", { class: "muted small", style: { marginTop: "-4px" } }, tr("You'll type your password on the Microsoft sign-in page.")) : field("si-pw", tr("Password"), "password", "pw", { autocomplete: "current-password" }),
      f.err ? h("div", { class: "banner err", id: "si-err", role: "alert" }, icon("alert"), " ", f.err) : null,
      h("button", { class: "btn primary wide", type: "submit", id: "si-go" }, ENTRA ? tr("Continue") : tr("Sign in"))),
    ENTRA ? null : h("div", { class: "row between", style: { marginTop: "8px" } },
      h("button", { class: "btn ghost sm", onclick: function () { openModal({ kind: "request" }); } }, tr("Request an account")),
      h("button", { class: "btn ghost sm", onclick: function () { toast(tr("In the standalone demo every account uses the demo password.")); } }, tr("Forgot password"))),
    ENTRA ? null : h("div", { class: "demo-hint small" }, h("b", null, tr("Demo accounts")), " — " + tr("password") + " ", h("span", { class: "mono sel-text" }, DEMO_PASSWORD), ". " + tr("Try {a} (Admin) or {b} (Technical Writer).", { a: emailFor("Danny Gelman"), b: emailFor("Eitan Fisch") })),
    h("div", { class: "center", style: { marginTop: "10px" } }, h("button", { class: "linklike small", onclick: function () { openModal({ kind: "connection" }); } }, tr("Connection settings…")))
  ]);
}
function msLogo() {
  var s = h("span", { class: "mslogo", "aria-hidden": "true" });
  ["#F25022", "#7FBA00", "#00A4EF", "#FFB900"].forEach(function (c) { s.appendChild(h("i", { style: { background: c } })); });
  return s;
}

function pendingScreen(u) {
  var declined = !!u.declined, pending = u.pendingActivation && !declined;
  var v = { jobTitle: u.jobTitle || "", department: u.department || "", employment: u.employment || "Employee" };
  return authShell([
    h("h1", { class: "auth-h" }, pending ? tr("Waiting for activation") : tr("No access")),
    h("p", null, pending ? tr("Hi {n}. Your account ({e}) is waiting for an Admin to let you in and choose your role. You'll get in as soon as they do.", { n: u.fullName.split(" ")[0], e: u.email })
      : tr("Your Taskana account ({e}) is switched off. Ask an Admin if you need access.", { e: u.email })),
    pending ? h("form", { class: "fields", novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      u.jobTitle = document.getElementById("pa-job").value.trim(); u.department = document.getElementById("pa-dept").value.trim(); u.employment = document.getElementById("pa-emp").value;
      save(); toast(tr("Thanks — the Admins can see this now."));
    } },
      h("p", { class: "muted small", style: { gridColumn: "1/-1", margin: "0 0 8px" } }, tr("Help the Admin place you:")),
      h("div", { class: "field half" }, h("label", { class: "l", for: "pa-job" }, tr("Job title")), h("input", { class: "f", id: "pa-job", value: v.jobTitle, placeholder: tr("e.g. Bookkeeper") })),
      h("div", { class: "field half" }, h("label", { class: "l", for: "pa-dept" }, tr("Department")), h("input", { class: "f", id: "pa-dept", value: v.department, list: "pa-depts", placeholder: tr("e.g. Finance") }),
        h("datalist", { id: "pa-depts" }, DEPARTMENTS.map(function (d) { return h("option", { value: d }); }))),
      h("div", { class: "field" }, h("label", { class: "l", for: "pa-emp" }, tr("Employment")), h("select", { class: "f", id: "pa-emp" }, EMPLOYMENT.map(function (x) { return h("option", { value: x, selected: x === v.employment }, tr(x)); }))),
      h("button", { class: "btn primary", type: "submit", style: { gridColumn: "1/-1", justifySelf: "start" } }, tr("Send"))) : null,
    h("div", { class: "row", style: { marginTop: "12px" } }, h("button", { class: "btn", id: "pa-out", onclick: signOut }, tr("Sign out")),
      REMOTE ? h("button", { class: "btn ghost", onclick: function () { Store.pollNow(); } }, icon("undo"), tr("Check again")) : null)
  ]);
}

function authGate() {
  if (Auth.phase === "starting") return splash(tr("Signing in…"));
  if (ENTRA && !Auth.account) return signInScreen();
  if (Store.remote) {
    if (Store.state === "token") return tokenScreen();
    if (Store.state === "setup") return setupScreen();
    if (!db.users.length) return Store.state === "error" ? storeErrorScreen() : splash(tr("Opening Taskana from {w}…", { w: whereName() }));
    if (ENTRA && !byId(db.users, db.settings.currentUserId)) bindAccount();
  }
  if (!ENTRA && !readSession()) return signInScreen();
  var u = byId(db.users, db.settings.currentUserId);
  if (!u) { if (!ENTRA) writeSession(null); return signInScreen(); }
  if (u.pendingActivation || !u.isActive) return pendingScreen(u);
  return null;
}

/* ---------- dialogs: request an account (demo), Microsoft 365 connection ---------- */
FORMS.request = function () {
  return {
    title: tr("Request an account"), createLabel: tr("Send request"),
    intro: h("p", { class: "muted small", style: { marginTop: 0 } }, tr("For new employees and outsourced staff (finance, HR, contractors) with a {d} address. An Admin activates the account and picks the role.", { d: DOMAIN })),
    fields: [
      { k: "fullName", label: tr("Full name"), req: true, first: true, max: 120 },
      { k: "email", label: tr("Company email"), req: true, t: "email", ph: "name" + DOMAIN },
      { k: "jobTitle", label: tr("Job title"), half: 1, ph: tr("e.g. Bookkeeper") },
      { k: "department", label: tr("Department"), half: 2, list: DEPARTMENTS },
      { k: "employment", label: tr("Employment"), t: "select", options: opts(EMPLOYMENT), def: "Employee" }
    ],
    validate: function (v, e) {
      if (!domainOK(v.email)) e.email = domainMsg();
      else if (db.users.some(function (x) { return (x.email || "").toLowerCase() === v.email.toLowerCase(); })) e.email = tr("There's already an account for this email. Sign in instead.");
    },
    save: function (v) {
      var u = { id: uid("u"), fullName: v.fullName, email: v.email.toLowerCase(), jobTitle: v.jobTitle, department: v.department, employment: v.employment, role: "Viewer", managerId: null,
        isActive: false, pendingActivation: true, requestedAt: nowISO(), authProvider: "password" };
      db.users.push(u); save(); finish(); demoSignIn(u, "password");
    }
  };
};
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
      inp("cx-gh-repo", tr("Repository (owner/name)"), g.owner && g.repo ? g.owner + "/" + g.repo : "", "DannyGelman95/galil-workdesk-app"),
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
