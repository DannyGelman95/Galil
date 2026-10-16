/* =====================================================================
   GALIL WorkDesk — sign-in and shared data files.
   config.js decides:
     storage "local"     this browser only (the standalone demo, as before)
     storage "github"    a data file in a GitHub repository (the testing setup);
                         each device pastes a GitHub access token once
     storage "onedrive"  data files in a company OneDrive folder (needs Entra)
     entra.clientId set  sign-in through Microsoft Entra ID (MSAL, vendor/)
   The app keeps writing its usual browser copy (galil-workdesk-v1), which
   is the offline cache; every change is also uploaded with the version it
   was based on. If someone else saved in between, their version is merged
   in record by record (field by field) and the save is retried. Other
   people's changes arrive every 30 seconds and when the tab is reopened.
   ===================================================================== */
"use strict";
var WDCloud = (function () {
  var base = window.WORKDESK_CONFIG || {}, over = null;
  var CONFIG_KEY = "galil-workdesk-config", TOKEN_KEY = "galil-workdesk-github-token", BASE_KEY = "galil-workdesk-cloud-base", META_KEY = "galil-workdesk-cloud-meta", BACKUP_DAY_KEY = "galil-workdesk-backup-day";
  try { over = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"); } catch (e) {}
  var C = {
    domain: (base.domain || "@galiltc.co.il").toLowerCase(), storage: base.storage || "",
    entra: Object.assign({ clientId: "", tenantId: "" }, base.entra),
    github: Object.assign({ owner: "", repo: "", branch: "workdesk-data", path: "workdesk" }, base.github),
    onedrive: Object.assign({ folderLink: "", folderName: "WorkDesk", fileName: "workdesk-data.json" }, base.onedrive), override: false
  };
  if (over && typeof over === "object") {
    if (over.storage != null) C.storage = over.storage;
    ["entra", "github", "onedrive"].forEach(function (k) { C[k] = Object.assign(C[k], over[k] || {}); });
    C.override = true;
  }
  var ENTRA = !!C.entra.clientId;
  var STORAGE = C.storage || (ENTRA ? "onedrive" : "local");
  if (STORAGE === "onedrive" && !ENTRA) STORAGE = "local";
  if (STORAGE === "github" && !(C.github.owner && C.github.repo)) STORAGE = "local";
  var REMOTE = STORAGE !== "local";
  var GRAPH = "https://graph.microsoft.com/v1.0", GH = "https://api.github.com", SCOPES = ["User.Read", "Files.ReadWrite.All"];
  var FILE = C.onedrive.fileName;

  var S = { state: "idle", error: "", folder: null, etag: null, baseText: null, base: null, data: null, dirty: false, busy: false, again: false, timer: null, retry: null, lastSync: null, size: 0, pca: null, account: null, hooks: null };
  var api = { enabled: REMOTE || ENTRA, remote: false, entra: ENTRA, storage: STORAGE, config: C, data: null, onRemote: null };

  /* ---------- helpers ---------- */
  function el(tag, attrs) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "style") e.style.cssText = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }
    return e;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function domainOK(e) { e = (e || "").trim().toLowerCase(); return e.length > C.domain.length && e.slice(-C.domain.length) === C.domain; }
  function today() { var d = new Date(), m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (dd < 10 ? "0" : "") + dd; }
  function httpError(res, fb) { return res.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} var e2 = new Error((j && (j.error && j.error.message || j.message)) || fb || ("HTTP " + res.status)); e2.status = res.status; e2.code = j && j.error && j.error.code; return e2; }); }
  function netError(w) { var e = new Error("Can't reach " + w + ". Check the connection."); e.network = true; return e; }
  function utf8ToB64(text) { var b = new TextEncoder().encode(text), s = ""; for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function b64ToUtf8(b64) { var bin = atob(b64.replace(/\s+/g, "")), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function where() { return STORAGE === "github" ? "GitHub" : "OneDrive"; }
  /* the uploaded form: the backup wrapper without the export time, so unchanged data uploads nothing */
  function fileText(data) { return JSON.stringify({ app: "galil-workdesk", version: 7, data: data }); }
  function parseFile(text) {
    var o = JSON.parse(text);
    if (!o || o.app !== "galil-workdesk" || !o.data) throw new Error("The data file isn't WorkDesk data.");
    var d = S.hooks.emptyDB(); Object.keys(d).forEach(function (k) { if (o.data[k] == null) o.data[k] = d[k]; });
    return o.data;
  }

  /* ---------- Microsoft Entra ID ---------- */
  function initEntra() {
    var Cls = window.WORKDESK_MSAL || (window.msal && window.msal.PublicClientApplication);
    if (!Cls) return Promise.reject(new Error("The Microsoft sign-in component didn't load. Reload the page."));
    if (!/^https?:$/.test(location.protocol)) return Promise.reject(new Error("Microsoft sign-in needs WorkDesk to be opened from its web address (https://…), not from a file on disk."));
    var here = location.origin + location.pathname;
    S.pca = new Cls({ auth: { clientId: C.entra.clientId, authority: "https://login.microsoftonline.com/" + (C.entra.tenantId || "organizations"), redirectUri: here, postLogoutRedirectUri: here }, cache: { cacheLocation: "localStorage" } });
    return Promise.resolve(S.pca.initialize ? S.pca.initialize() : null).then(function () { return S.pca.handleRedirectPromise(); }).then(function (res) {
      var acc = (res && res.account) || (S.pca.getActiveAccount && S.pca.getActiveAccount()) || S.pca.getAllAccounts()[0] || null;
      if (/^#(code|error|state)=/.test(location.hash)) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (!acc) return null;
      if (!domainOK(acc.username)) { forget(acc); throw new Error("Only addresses ending in " + C.domain + " can sign in. Outsourced staff get a " + C.domain + " account from IT."); }
      var tid = (acc.idTokenClaims || {}).tid || acc.tenantId;
      if (C.entra.tenantId && tid && tid !== C.entra.tenantId) { forget(acc); throw new Error("That account belongs to another organisation."); }
      if (S.pca.setActiveAccount) S.pca.setActiveAccount(acc);
      S.account = acc; return acc;
    });
  }
  function forget(acc) { S.account = null; if (S.pca && S.pca.logoutRedirect) return S.pca.logoutRedirect({ account: acc, onRedirectNavigate: function () { return false; } }).catch(function () {}); return Promise.resolve(); }
  function token(force) {
    return S.pca.acquireTokenSilent({ scopes: SCOPES, account: S.account, forceRefresh: !!force }).then(function (r) { return r.accessToken; }).catch(function (e) {
      if (!/interaction_required|login_required|consent_required|no_tokens_found|no_account/i.test((e && (e.errorCode || e.name || e.message)) || "") && !(window.msal && window.msal.InteractionRequiredAuthError && e instanceof window.msal.InteractionRequiredAuthError)) throw e;
      S.pca.acquireTokenRedirect({ scopes: SCOPES, account: S.account }); return new Promise(function () {});
    });
  }
  api.login = function (email) {
    if (!S.pca) return;
    var req = { scopes: SCOPES, domainHint: C.domain.slice(1), prompt: email ? "login" : "select_account" };
    if (email) req.loginHint = email;
    S.pca.loginRedirect(req);
  };
  api.signOut = function () {
    try { localStorage.removeItem("galil-workdesk-session"); } catch (e) {}
    if (!ENTRA) return;
    clearCache();
    forget(S.account).then(function () { location.reload(); });
  };

  /* ---------- OneDrive (Graph) ---------- */
  function graphFetch(method, path, opts, tries) {
    opts = opts || {}; tries = tries || 0;
    return token(tries > 0 && opts.authRetry).then(function (tok) {
      return fetch(/^https:/.test(path) ? path : GRAPH + path, { method: method, cache: "no-store", headers: Object.assign({ Authorization: "Bearer " + tok }, opts.headers || {}), body: opts.body });
    }).then(function (res) {
      if ((res.status === 429 || res.status === 503 || res.status === 504) && tries < 3) { var ra = +res.headers.get("Retry-After"); return wait((ra > 0 ? Math.min(ra, 30) : Math.pow(2, tries + 1)) * 1000).then(function () { return graphFetch(method, path, opts, tries + 1); }); }
      if (res.status === 401 && tries < 1) return graphFetch(method, path, Object.assign({}, opts, { authRetry: true }), tries + 1);
      return res;
    }, function () { throw netError("OneDrive"); });
  }
  function graphJSON(method, path, body) {
    return graphFetch(method, path, body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
      .then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.status === 204 ? null : res.json(); });
  }
  function shareId(u) { return "u!" + btoa(unescape(encodeURIComponent(u))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-"); }
  function item(name) { var f = S.folder; return "/drives/" + f.driveId + "/items/" + f.id + ":/" + name.split("/").map(encodeURIComponent).join("/") + ":"; }
  var ONEDRIVE = {
    debounce: 700,
    id: function () { return C.onedrive.folderLink || C.onedrive.folderName; },
    open: function () {
      var of = function (it, shared) { return { driveId: (it.parentReference || {}).driveId, id: it.id, name: it.name, webUrl: it.webUrl, shared: shared }; };
      if (C.onedrive.folderLink) return graphJSON("GET", "/shares/" + shareId(C.onedrive.folderLink) + "/driveItem").then(function (it) {
        if (!it.folder) throw new Error("The OneDrive link points to a file, not a folder.");
        return of(it, true);
      });
      return graphJSON("GET", "/me/drive/root:/" + encodeURIComponent(C.onedrive.folderName)).catch(function (e) {
        if (e.status !== 404) throw e;
        return graphJSON("POST", "/me/drive/root/children", { name: C.onedrive.folderName, folder: {}, "@microsoft.graph.conflictBehavior": "fail" });
      }).then(function (it) { return of(it, false); });
    },
    read: function () {
      return graphJSON("GET", item(FILE)).then(function (m) {
        var u = m["@microsoft.graph.downloadUrl"];
        return (u ? fetch(u, { cache: "no-store" }) : graphFetch("GET", item(FILE) + "/content")).then(function (r) { if (!r.ok) return httpError(r).then(function (e) { throw e; }); return r.text(); })
          .then(function (t) { S.size = m.size || t.length; return { text: t, etag: m.eTag }; });
      }, function (e) { if (e.status === 404) return null; throw e; });
    },
    version: function () { return graphJSON("GET", item(FILE) + "?$select=eTag").then(function (m) { return m.eTag; }); },
    write: function (text, etag) {
      var hd = { "Content-Type": "application/json" }; if (etag) hd["If-Match"] = etag; else hd["If-None-Match"] = "*";
      return graphFetch("PUT", item(FILE) + "/content", { body: text, headers: hd }).then(function (r) {
        if (r.ok) return r.json().then(function (it) { return { etag: it.eTag, size: it.size }; });
        if (r.status === 412 || r.status === 409) return { conflict: true };
        return httpError(r).then(function (e) { throw e; });
      });
    },
    backup: function (text) {
      var day = today(), last = null; try { last = localStorage.getItem(BACKUP_DAY_KEY); } catch (e) {}
      if (last === day) return; try { localStorage.setItem(BACKUP_DAY_KEY, day); } catch (e) {}
      var f = S.folder;
      graphJSON("POST", "/drives/" + f.driveId + "/items/" + f.id + "/children", { name: "backups", folder: {}, "@microsoft.graph.conflictBehavior": "fail" }).catch(function () {})
        .then(function () { return graphFetch("PUT", item("backups/workdesk-" + day + ".json") + "/content", { body: text, headers: { "Content-Type": "application/json", "If-None-Match": "*" } }); }).catch(function () {});
    },
    explain: function (e) {
      return e.status === 403 || e.code === "accessDenied" ? "You don't have access to the WorkDesk folder on OneDrive. Ask an administrator to share it with you."
        : e.status === 404 ? "The WorkDesk folder link doesn't open a folder any more. An administrator needs to update it in config.js." : e.message;
    }
  };

  /* ---------- GitHub (contents API) ---------- */
  function ghToken() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function repo() { return "/repos/" + encodeURIComponent(C.github.owner) + "/" + encodeURIComponent(C.github.repo); }
  function ghFile(n) { return (C.github.path ? C.github.path.replace(/\/+$/, "") + "/" : "") + n; }
  function ghPath(n) { return repo() + "/contents/" + ghFile(n).split("/").map(encodeURIComponent).join("/"); }
  function ghFetch(method, path, body, accept) {
    var tok = ghToken();
    if (!tok) { var e0 = new Error("WorkDesk needs a GitHub access token on this device."); e0.token = true; return Promise.reject(e0); }
    return fetch(GH + path, { method: method, cache: "no-store", headers: { Authorization: "Bearer " + tok, Accept: accept || "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function (res) {
        if (res.status === 401) { var e = new Error("GitHub refused the access token — it may have expired or been revoked."); e.token = true; throw e; }
        if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") { var e2 = new Error("GitHub's hourly request limit was reached. WorkDesk tries again shortly."); e2.network = true; throw e2; }
        return res;
      }, function () { throw netError("GitHub"); });
  }
  function ghJSON(m, p, b) { return ghFetch(m, p, b).then(function (r) { if (!r.ok) return httpError(r).then(function (e) { throw e; }); return r.json(); }); }
  var GITHUB = {
    debounce: 2500,
    id: function () { var g = C.github; return g.owner + "/" + g.repo + "@" + g.branch + ":" + g.path; },
    open: function () {
      var g = C.github, name = g.owner + "/" + g.repo;
      return ghJSON("GET", repo()).then(function (r) {
        if (r.permissions && !r.permissions.push) { var e = new Error("This GitHub token can read " + name + " but not save to it. Give it “Contents: Read and write”."); e.token = true; throw e; }
        return ghFetch("GET", repo() + "/branches/" + encodeURIComponent(g.branch)).then(function (res) {
          if (res.ok) return;
          if (res.status !== 404) return httpError(res).then(function (e) { throw e; });
          return ghJSON("GET", repo() + "/git/ref/heads/" + encodeURIComponent(r.default_branch)).then(function (ref) { return ghJSON("POST", repo() + "/git/refs", { ref: "refs/heads/" + g.branch, sha: ref.object.sha }); });
        }).then(function () { return { name: name + " · " + g.branch + (g.path ? " · " + g.path : ""), webUrl: "https://github.com/" + name + "/blob/" + encodeURIComponent(g.branch) + "/" + ghFile(FILE), shared: true }; });
      }, function (e) { if (e.status === 404) { var x = new Error("This GitHub token can't see " + name + ". Give it access to that repository."); x.token = true; throw x; } throw e; });
    },
    read: function () {
      return ghFetch("GET", ghPath(FILE) + "?ref=" + encodeURIComponent(C.github.branch)).then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) return httpError(res).then(function (e) { throw e; });
        return res.json().then(function (m) {
          S.size = m.size;
          if (m.encoding === "base64" && m.content) return { text: b64ToUtf8(m.content), etag: m.sha };
          return ghFetch("GET", repo() + "/git/blobs/" + m.sha, null, "application/vnd.github.raw+json").then(function (r2) {
            if (!r2.ok) return httpError(r2).then(function (e) { throw e; });
            return r2.text().then(function (t) { return { text: t, etag: m.sha }; });
          });
        });
      });
    },
    version: function () {
      return ghFetch("GET", ghPath(FILE) + "?ref=" + encodeURIComponent(C.github.branch)).then(function (res) {
        if (res.status === 404) return null; if (!res.ok) return httpError(res).then(function (e) { throw e; });
        return res.json().then(function (m) { return m.sha; });
      });
    },
    write: function (text, sha) {
      var b = { message: "WorkDesk: data saved", content: utf8ToB64(text), branch: C.github.branch }; if (sha) b.sha = sha;
      return ghFetch("PUT", ghPath(FILE), b).then(function (r) {
        if (r.ok) return r.json().then(function (j) { return { etag: j.content.sha, size: j.content.size }; });
        if (r.status === 409 || r.status === 422) return { conflict: true };
        return httpError(r).then(function (e) { throw e; });
      });
    },
    explain: function (e) { return e.message; }
  };
  function B() { return STORAGE === "github" ? GITHUB : ONEDRIVE; }

  /* ---------- three-way merge (base, mine, theirs) ---------- */
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function mapOf(a) { var m = {}; (a || []).forEach(function (x) { if (x && x.id) m[x.id] = x; }); return m; }
  function mergeRecord(b, l, r) {
    var out = Object.assign({}, l);
    if (b && same(b, l)) return JSON.parse(JSON.stringify(r));
    if (!b) return out;
    var keys = {}; [b, l, r].forEach(function (o) { Object.keys(o).forEach(function (k) { keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) { if (same(l[k], b[k]) && !same(r[k], b[k])) { if (r[k] === undefined) delete out[k]; else out[k] = r[k]; } });
    return out;
  }
  function merge3(base, mine, theirs) {
    var out = {};
    Object.keys(Object.assign({}, base, mine, theirs)).forEach(function (k) {
      var bb = base[k], ll = mine[k], rr = theirs[k];
      if (!Array.isArray(ll) && !Array.isArray(rr)) { out[k] = (ll && rr && typeof ll === "object") ? mergeRecord(bb || null, ll, rr) : same(ll, bb) ? rr : ll; return; }
      var Bm = mapOf(bb), Lm = mapOf(ll), list = [], seen = {};
      (rr || []).forEach(function (r) {
        seen[r.id] = 1; var l = Lm[r.id], b = Bm[r.id];
        if (l) list.push(mergeRecord(b, l, r)); else if (!b || !same(b, r)) list.push(r);
      });
      (ll || []).forEach(function (l) { if (seen[l.id]) return; var b = Bm[l.id]; if (!b || !same(b, l)) list.push(l); });
      out[k] = list;
    });
    return out;
  }

  /* ---------- keep in step ---------- */
  function setState(s, err) { S.state = s; S.error = err || ""; paintStatus(); }
  function writeCacheMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ id: STORAGE + "|" + B().id() + "|" + (S.account ? S.account.username : ""), etag: S.etag, dirty: S.dirty }));
      if (S.dirty && S.baseText) localStorage.setItem(BASE_KEY, S.baseText); else localStorage.removeItem(BASE_KEY);
    } catch (e) {}
  }
  function clearCache() { try { [META_KEY, BASE_KEY, "galil-workdesk-v1"].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} }
  function adopt(r) {
    var theirs = parseFile(r.text);
    var merged = S.base ? merge3(S.base, S.data, theirs) : theirs;
    S.base = parseFile(r.text); S.baseText = fileText(S.base); S.etag = r.etag;
    S.data = merged; api.data = merged; S.dirty = fileText(merged) !== S.baseText;
    try { localStorage.setItem("galil-workdesk-v1", JSON.stringify(S.hooks.wrap(merged))); } catch (e) {}
    if (api.onRemote) api.onRemote(merged);
  }
  function push() {
    if (!api.remote || S.state === "setup" || S.state === "token") return Promise.resolve();
    if (S.busy) { S.again = true; return Promise.resolve(); }
    S.busy = true; clearTimeout(S.retry);
    var tries = 0;
    var step = function () {
      var text = fileText(S.data);
      if (text === S.baseText) { S.dirty = false; return Promise.resolve(); }
      if (tries++ > 4) throw new Error("The data file kept changing while saving. Try again in a moment.");
      setState("saving");
      return B().write(text, S.etag).then(function (w) {
        if (!w.conflict) { S.etag = w.etag; S.base = JSON.parse(text).data; S.baseText = text; S.lastSync = new Date(); S.size = w.size || text.length; if (B().backup) B().backup(text); return step(); }
        return B().read().then(function (r) { if (!r) { S.etag = null; return step(); } adopt(r); return step(); });
      });
    };
    return step().then(function () { setState("saved"); }, function (e) {
      if (e.token) { setState("token", e.message); try { localStorage.removeItem(TOKEN_KEY); } catch (x) {} return; }
      setState(e.network ? "offline" : "error", e.message);
      S.retry = setTimeout(push, e.network ? 15000 : 60000);
    }).then(function () { S.busy = false; writeCacheMeta(); if (S.again) { S.again = false; schedule(50); } });
  }
  function schedule(ms) { clearTimeout(S.timer); S.timer = setTimeout(push, ms); }
  function poll(force) {
    if (!api.remote || S.busy || S.state === "setup" || S.state === "token" || (!force && document.hidden)) return;
    S.busy = true;
    B().version().then(function (v) { if (v === S.etag) return; return B().read().then(function (r) { if (r) adopt(r); }); })
      .then(function () { if (S.state === "offline" || S.state === "error") setState(S.dirty ? "saving" : "saved"); }, function (e) { if (e.network) setState("offline", e.message); })
      .then(function () { S.busy = false; writeCacheMeta(); if (S.dirty || S.again) { S.again = false; schedule(50); } });
  }
  /* the app calls this from writeRaw() on every change */
  api.changed = function (data) {
    if (!api.remote) return;
    S.data = data; api.data = data; S.dirty = true; writeCacheMeta(); schedule(B().debounce);
  };
  api.pollNow = function () { poll(true); };

  /* ---------- status pill ---------- */
  var pill = null;
  function paintStatus() {
    if (!api.remote || !document.body) return;
    if (!pill) {
      pill = el("button", { id: "wd-sync", title: "", style: "position:fixed;left:12px;bottom:12px;z-index:900;display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;border:1px solid var(--line,#D9E4D0);background:var(--surface,#fff);color:var(--muted,#5F6E62);font:600 11.5px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.12);max-width:60vw", onclick: function () { api.showInfo(); } });
      document.body.appendChild(pill);
    }
    var s = S.state, w = where();
    var text = s === "saving" ? "Saving to " + w + "…" : s === "loading" ? "Opening from " + w + "…" : s === "offline" ? "Offline — changes are kept and will sync" :
      s === "error" || s === "token" ? "Not saved: " + S.error : "Saved to " + w + (S.lastSync ? " · " + S.lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
    var dot = { saving: "#EDA100", loading: "#EDA100", offline: "#8A9585", error: "#C0392B", token: "#C0392B" }[s] || "#008300";
    pill.replaceChildren(el("i", { style: "width:8px;height:8px;border-radius:50%;flex:none;background:" + dot }), el("span", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, text));
    pill.title = text;
  }
  api.describe = function () {
    return { storage: STORAGE, where: where(), folder: S.folder, file: FILE, size: S.size, state: S.state, error: S.error, entra: ENTRA, lastSync: S.lastSync };
  };
  api.showInfo = function () {
    var f = S.folder || {};
    var box = el("div", { style: "position:fixed;inset:0;z-index:950;background:rgba(10,20,10,.45);display:grid;place-items:center;padding:16px", onclick: function (e) { if (e.target === box) box.remove(); } },
      el("div", { class: "authcard", style: "max-width:520px" },
        el("div", { class: "h3", style: "margin-bottom:8px" }, "Where WorkDesk's data lives"),
        el("p", { style: "font-size:13.5px;margin:0 0 8px" }, (STORAGE === "github" ? "GitHub repository " : "OneDrive folder ") + (f.name || "")),
        f.webUrl ? el("p", { style: "font-size:13px;margin:0 0 8px" }, el("a", { href: f.webUrl, target: "_blank", rel: "noopener noreferrer" }, "Open " + FILE)) : null,
        el("p", { class: "cap", style: "margin:0 0 12px" }, STORAGE === "github" ? "Every save is a commit on the " + C.github.branch + " branch, so its history is the backup." : "A dated copy goes to backups/ once a day."),
        el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" },
          STORAGE === "github" ? el("button", { class: "btn d sm", onclick: function () { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} clearCache(); location.reload(); } }, "Remove the GitHub token from this browser") : null,
          el("button", { class: "btn sm", onclick: function () { box.remove(); } }, "Close"))));
    document.body.appendChild(box);
  };

  /* ---------- screens before the app ---------- */
  function screen(root, title, children) {
    root.replaceChildren(el("div", { class: "auth" }, el("div", { class: "authcard" },
      el("div", { style: "display:flex;align-items:center;gap:12px;margin-bottom:14px" },
        el("div", { style: "font-weight:800;font-size:22px;letter-spacing:.06em;color:var(--ink)" }, "GALIL"), el("div", { class: "cap" }, "WorkDesk")),
      el("div", { class: "h2", style: "font-size:20px;font-weight:700;margin-bottom:10px" }, title), children)));
  }
  function errorBanner(msg) { return msg ? el("div", { class: "banner err", style: "margin-bottom:10px" }, "⚠ " + msg) : null; }
  function tokenScreen(root, next) {
    var g = C.github, name = g.owner + "/" + g.repo, inp = el("input", { type: "password", id: "wd-gh-token", placeholder: "github_pat_…", autocomplete: "off", style: "width:100%;min-height:38px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;font:13px monospace;background:var(--surface);color:var(--ink)" });
    screen(root, "Connect to GitHub", el("div", null, errorBanner(S.error),
      el("p", { style: "font-size:13.5px;margin:0 0 8px" }, "For now WorkDesk keeps its data file in the GitHub repository " + name + " (branch " + g.branch + "). Paste a GitHub access token that may save there — once per device."),
      el("ol", { style: "font-size:13px;margin:0 0 12px;padding-left:20px;line-height:1.6" },
        el("li", null, "Open ", el("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener noreferrer" }, "GitHub → new fine-grained token"), "."),
        el("li", null, "Resource owner " + g.owner + "; repository access: only " + name + "."),
        el("li", null, "Permissions → Repository → Contents: Read and write. Generate, copy.")),
      el("label", { class: "cap", for: "wd-gh-token" }, "GitHub access token"), inp,
      el("div", { style: "margin-top:12px" }, el("button", { class: "btn p", id: "wd-gh-go", style: "width:100%", onclick: function () {
        var v = inp.value.trim();
        if (!/^(github_pat_|ghp_|gho_|ghu_)\w+$/.test(v)) { S.error = "That doesn't look like a GitHub token (github_pat_… or ghp_…)."; return tokenScreen(root, next); }
        try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {}
        S.error = ""; next();
      } }, "Connect")),
      el("p", { class: "cap", style: "margin:10px 0 0" }, "The token stays in this browser only.")));
    inp.focus();
  }
  function setupScreen(root, next) {
    var start = function (data) { S.data = data; api.data = data; S.etag = null; S.base = null; S.baseText = null; S.dirty = true; api.remote = true; S.state = "saving"; push().then(next); };
    var fileIn = el("input", { type: "file", accept: ".json,application/json", style: "display:none", onchange: function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { var o; try { o = JSON.parse(rd.result); } catch (x) { alert("That file isn't valid JSON."); return; } var v = S.hooks.validateBackup(o); if (!v.ok) { alert(v.reason); return; } var d = S.hooks.emptyDB(); Object.keys(d).forEach(function (k) { if (o.data[k] == null) o.data[k] = d[k]; }); start(o.data); };
      rd.readAsText(f);
    } });
    screen(root, "Set up WorkDesk", el("div", null,
      el("p", { style: "font-size:13.5px;margin:0 0 12px" }, "There's no WorkDesk data in " + ((S.folder && S.folder.name) || where()) + " yet. Start it now:"),
      el("div", { style: "display:grid;gap:8px" },
        el("button", { class: "btn p", onclick: function () { start(S.hooks.seed(false)); } }, "Start with the GALIL team (no work yet)"),
        el("button", { class: "btn", onclick: function () { start(S.hooks.seed(true)); } }, "Start with the team and demo data"),
        el("button", { class: "btn", onclick: function () { fileIn.click(); } }, "Start from a WorkDesk backup file…"), fileIn)));
  }
  function errorScreen(root, retry) {
    screen(root, "Can't open WorkDesk", el("div", null, errorBanner(S.error),
      el("div", { style: "display:flex;gap:8px" }, el("button", { class: "btn p", onclick: retry }, "Try again"),
        STORAGE === "github" ? el("button", { class: "btn t", onclick: function () { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} location.reload(); } }, "Use another token") : null,
        ENTRA ? el("button", { class: "btn t", onclick: api.signOut }, "Sign out") : null)));
  }
  function splash(root, text) { screen(root, text, el("div", { class: "cap" }, "One moment…")); }

  /* match the Microsoft account to a person; someone new waits for activation */
  function bindAccount(d) {
    var acc = S.account, H = S.hooks, email = acc.username.toLowerCase(), oid = acc.localAccountId || (acc.idTokenClaims || {}).oid || "", name = (acc.name || email.split("@")[0]).trim();
    var norm = function (s) { return (s || "").toLowerCase().replace(/[^a-z֐-׿]+/g, " ").trim(); };
    var u = (oid && d.users.filter(function (x) { return x.entraId === oid; })[0]) || d.users.filter(function (x) { return (x.email || "").toLowerCase() === email; })[0] ||
      d.users.filter(function (x) { return !x.entraId && !x.lastSignInAt && norm(x.fullName) === norm(name); })[0];
    if (!u) {
      var id = H.uid("u");
      u = H.mkUser(id, name, "", "EMP", "", "", null, null, false);
      Object.assign(u, { email: email, isActive: false, pendingActivation: true, requestedRole: "EMP", authProvider: "microsoft", password: "" });
      d.users.push(u);
      H.raiseApproval(d, "Account activation", "users", id, id, "First Microsoft sign-in — awaiting role confirmation");
      H.audit(d, id, "Account created by Microsoft sign-in, pending activation", "users", id, null, null);
    }
    u.entraId = oid || u.entraId; u.email = email; u.authProvider = "microsoft";
    if (!u.lastSignInAt || Date.now() - new Date(u.lastSignInAt).getTime() > 12 * 3600 * 1000) u.lastSignInAt = new Date().toISOString();
    try { localStorage.setItem("galil-workdesk-session", u.id); } catch (e) {}
  }

  function openData(root, mount) {
    api.remote = true;
    if (STORAGE === "github" && !ghToken()) { S.state = "token"; return tokenScreen(root, function () { openData(root, mount); }); }
    splash(root, "Opening WorkDesk from " + where() + "…"); setState("loading");
    /* this browser's copy, with unsaved changes from last time if any */
    var meta = null, cached = null;
    try { meta = JSON.parse(localStorage.getItem(META_KEY) || "null"); var raw = JSON.parse(localStorage.getItem("galil-workdesk-v1") || "null"); cached = raw && raw.data; } catch (e) {}
    var mineId = STORAGE + "|" + B().id() + "|" + (S.account ? S.account.username : "");
    if (!meta || meta.id !== mineId) { meta = null; cached = null; }
    return B().open().then(function (f) { S.folder = f; return B().read(); }).then(function (r) {
      if (!r) {
        if (cached && meta) { S.data = cached; S.etag = null; S.dirty = true; return push(); }
        S.state = "setup"; setupScreen(root, function () { finish(root, mount); }); return "setup";
      }
      if (cached && meta && meta.dirty && localStorage.getItem(BASE_KEY)) {
        S.data = cached; S.base = parseFile(localStorage.getItem(BASE_KEY)); S.baseText = fileText(S.base); S.etag = meta.etag;
        if (r.etag !== meta.etag) adopt(r); else S.dirty = true;
      } else { S.data = parseFile(r.text); S.base = parseFile(r.text); S.baseText = fileText(S.base); S.etag = r.etag; S.dirty = false; }
      setState(S.dirty ? "saving" : "saved"); S.lastSync = new Date();
    }).then(function (x) { if (x !== "setup") finish(root, mount); }, function (e) {
      if (e.token) { S.error = e.message; try { localStorage.removeItem(TOKEN_KEY); } catch (y) {} S.state = "token"; return tokenScreen(root, function () { openData(root, mount); }); }
      S.error = B().explain(e);
      if (e.network && cached) { S.data = cached; setState("offline", S.error); return finish(root, mount); }
      setState("error", S.error); errorScreen(root, function () { openData(root, mount); });
    });
  }
  function finish(root, mount) {
    if (ENTRA && S.account) bindAccount(S.data);
    api.data = S.data;
    try { localStorage.setItem("galil-workdesk-v1", JSON.stringify(S.hooks.wrap(S.data))); } catch (e) {}
    if (fileText(S.data) !== S.baseText) { S.dirty = true; schedule(50); }
    setInterval(function () { poll(false); }, 30000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(false); });
    window.addEventListener("online", function () { poll(true); if (S.dirty) schedule(50); });
    paintStatus(); root.replaceChildren(); mount();
  }

  /* hooks: the app's own functions (seed, emptyDB, wrap, validateBackup, mkUser, uid, raiseApproval, audit) */
  api.boot = function (hooks, mount) {
    S.hooks = hooks;
    var root = document.getElementById("root");
    if (!api.enabled) return mount();
    var go = function () { if (!REMOTE) return mount(); openData(root, mount); };
    if (!ENTRA) return go();
    splash(root, "Signing in…");
    initEntra().then(function (acc) {
      if (!acc) { api.data = null; return mount(); }       // the app's sign-in screen offers Microsoft sign-in
      if (!REMOTE) { api.data = null; return mount(); }
      go();
    }, function (e) { api.signInError = e.message; mount(); });
  };
  /* try other settings in this browser only (config.js stays the default for everyone) */
  api.showConfig = function () {
    var g = C.github, here = location.origin + location.pathname;
    var field = function (id, label, value, ph) {
      return el("label", { style: "display:grid;gap:4px;font-size:12.5px;color:var(--muted)" }, label,
        el("input", { id: id, value: value || "", placeholder: ph || "", style: "min-height:36px;border:1px solid var(--line);border-radius:9px;padding:6px 10px;font:13px system-ui;background:var(--surface);color:var(--ink)" }));
    };
    var sel = el("select", { id: "cx-storage", style: "min-height:36px;border:1px solid var(--line);border-radius:9px;padding:6px 10px;background:var(--surface);color:var(--ink)" });
    [["local", "This browser only (demo)"], ["github", "A data file in a GitHub repository"], ["onedrive", "A OneDrive folder (needs Microsoft Entra ID)"]].forEach(function (o) { var op = el("option", { value: o[0] }, o[1]); if (STORAGE === o[0]) op.selected = true; sel.appendChild(op); });
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var box = el("div", { style: "position:fixed;inset:0;z-index:950;background:rgba(10,20,10,.45);display:grid;place-items:center;padding:16px;overflow:auto", onclick: function (e) { if (e.target === box) box.remove(); } },
      el("div", { class: "authcard", style: "display:grid;gap:10px" },
        el("div", { class: "h3" }, "Connection settings"),
        el("div", { class: "cap" }, "Where WorkDesk keeps its data and how people sign in. config.js sets this for everyone; what you save here applies to this browser only."),
        el("label", { style: "display:grid;gap:4px;font-size:12.5px;color:var(--muted)" }, "Data location", sel),
        field("cx-repo", "GitHub repository (owner/name)", g.owner && g.repo ? g.owner + "/" + g.repo : "", "DannyGelman95/galil-workdesk-app"),
        field("cx-branch", "GitHub branch for the data", g.branch, "workdesk-data"),
        field("cx-client", "Microsoft Entra application (client) ID", C.entra.clientId, "00000000-0000-0000-0000-000000000000"),
        field("cx-tenant", "Directory (tenant) ID", C.entra.tenantId, "optional"),
        field("cx-folder", "OneDrive folder link", C.onedrive.folderLink, "https://galiltc-my.sharepoint.com/:f:/…"),
        el("div", { class: "cap" }, "Redirect URI to register (Single-page application): " + here),
        el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end" },
          C.override ? el("button", { class: "btn d sm", onclick: function () { api.setConfig(null); } }, "Use config.js") : null,
          el("button", { class: "btn sm", onclick: function () { box.remove(); } }, "Cancel"),
          el("button", { class: "btn p sm", onclick: function () {
            var guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, id = v("cx-client"), ten = v("cx-tenant"), st = sel.value, rp = v("cx-repo").split("/");
            if (id && !guid.test(id)) return alert("The client ID is a GUID like 00000000-0000-0000-0000-000000000000.");
            if (ten && !guid.test(ten)) return alert("The tenant ID is a GUID like 00000000-0000-0000-0000-000000000000.");
            if (st === "onedrive" && !id) return alert("OneDrive needs the Microsoft Entra application ID.");
            if (st === "github" && rp.length !== 2) return alert("Enter the repository as owner/name.");
            api.setConfig({ storage: st, entra: { clientId: id, tenantId: ten }, onedrive: { folderLink: v("cx-folder") }, github: { owner: rp[0] || "", repo: rp[1] || "", branch: v("cx-branch") || "workdesk-data", path: g.path } });
          } }, "Save and reload"))));
    document.body.appendChild(box);
  };
  api.domainOK = domainOK;
  api.setConfig = function (o) { try { if (o) localStorage.setItem(CONFIG_KEY, JSON.stringify(o)); else localStorage.removeItem(CONFIG_KEY); } catch (e) {} location.reload(); };
  return api;
})();
