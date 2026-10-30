/* =====================================================================
   GALIL HR — where the data lives (config.js → hr, storage):
   "local"    this browser's localStorage (galil-hr-v1) — the demo.
   "github"   <path>/hr-data.json on its own branch of the repository,
              through the GitHub API with the portal's access token —
              every save is a commit there.
   "onedrive" hr-data.json in the company OneDrive's HR folder, through
              Microsoft Graph with the portal's Microsoft account.
   Every write carries the version it was based on (blob sha / eTag). If
   someone saved in between, their copy is merged in record by record
   (core.js mergeData) and the save is tried again. Other people's changes
   arrive every 30 seconds and when the tab comes back into view. A copy is
   kept in this browser, so HR opens at once and works offline.
   ===================================================================== */
"use strict";

var GITHUB_API = "https://api.github.com", GRAPH = "https://graph.microsoft.com/v1.0", GRAPH_SCOPES = ["User.Read", "Files.ReadWrite.All"];
var GH_TOKEN_KEY = GalilPortal.GITHUB_TOKEN_KEY;

var Store = {
  state: "idle", error: "", etag: null, dirty: false, busy: false, again: false, timer: null, poller: null, lastSync: null, folder: null, pca: null, account: null,
  onChange: null,
  changed: function () {
    this.dirty = true; writeCache();
    if (!REMOTE) return;
    var s = this; clearTimeout(s.timer); s.timer = setTimeout(push, STORAGE === "github" ? 1500 : 700);
  },
  label: function () { return STORAGE === "github" ? "GitHub" : STORAGE === "onedrive" ? "OneDrive" : tr("this browser"); }
};

function setState(st, err) { Store.state = st; Store.error = err || ""; if (window.paintSync) paintSync(); }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function httpError(res, fb) {
  return res.text().then(function (t) {
    var j = null; try { j = JSON.parse(t); } catch (e) {}
    var e2 = new Error((j && (j.error && j.error.message || j.message)) || fb || ("HTTP " + res.status)); e2.status = res.status; return e2;
  });
}
/* fetch, given up after 20 seconds — a request that never answers would leave HR "Loading…" for good */
function tfetch(url, opts) {
  var ac = window.AbortController ? new AbortController() : null, t = ac ? setTimeout(function () { ac.abort(); }, 20000) : 0;
  return fetch(url, Object.assign({}, opts, ac ? { signal: ac.signal } : {}))
    .then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
}
function netError(w) { var e = new Error(tr("Can't reach {w}. Check the connection.", { w: w })); e.network = true; return e; }
function utf8ToB64(text) { var b = new TextEncoder().encode(text), s = ""; for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function b64ToUtf8(b64) { var bin = atob(b64.replace(/\s+/g, "")), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
function dataText(d) { return JSON.stringify(Object.assign({ app: APP, version: APP_VERSION }, d)); }
function parseText(text) { var o = JSON.parse(text); if (!isHrData(o)) throw new Error(tr("The data file isn't HR data.")); return normalize(o); }

/* ---------- this browser's copy ---------- */
function writeCache() {
  try {
    if (REMOTE) localStorage.setItem(CACHE_KEY, JSON.stringify({ data: db, etag: Store.etag, dirty: Store.dirty, id: backendId() }));
    else localStorage.setItem(LOCAL_KEY, dataText(db));
  } catch (e) {}
}
function readCache() {
  try {
    if (!REMOTE) { var t = localStorage.getItem(LOCAL_KEY); return t ? { data: parseText(t) } : null; }
    var c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return c && c.id === backendId() && isHrData(c.data) ? { data: normalize(c.data), etag: c.etag, dirty: c.dirty } : null;
  } catch (e) { return null; }
}
function backendId() { var g = CONFIG.github; return STORAGE === "github" ? g.owner + "/" + g.repo + "@" + g.branch + ":" + g.path : STORAGE === "onedrive" ? (CONFIG.onedrive.folderLink || CONFIG.onedrive.folderName) : "local"; }

/* =================== GitHub =================== */
function ghToken() { try { return localStorage.getItem(GH_TOKEN_KEY) || ""; } catch (e) { return ""; } }
function ghRepo() { var g = CONFIG.github; return "/repos/" + encodeURIComponent(g.owner) + "/" + encodeURIComponent(g.repo); }
function ghFile() { var g = CONFIG.github; return (g.path ? g.path.replace(/\/+$/, "") + "/" : "") + CONFIG.onedrive.fileName; }
function ghPath() { return ghRepo() + "/contents/" + ghFile().split("/").map(encodeURIComponent).join("/"); }
function ghFetch(method, path, body, accept) {
  var tok = ghToken();
  if (!tok) { var e0 = new Error(tr("HR needs a GitHub access token on this device.")); e0.token = true; return Promise.reject(e0); }
  return tfetch(GITHUB_API + path, { method: method, cache: "no-store", headers: { Authorization: "Bearer " + tok, Accept: accept || "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    .then(function (res) {
      if (res.status === 401) { var e = new Error(tr("GitHub refused the access token — it may have expired or been revoked.")); e.token = true; throw e; }
      return res;
    }, function () { throw netError("GitHub"); });
}
function ghJSON(method, path, body) { return ghFetch(method, path, body).then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.json(); }); }
var GITHUB = {
  open: function () {
    var g = CONFIG.github;
    return ghJSON("GET", ghRepo()).then(function (repo) {
      if (repo.permissions && !repo.permissions.push) { var e = new Error(tr("This GitHub token can read {r} but not save to it. Give it “Contents: Read and write”.", { r: g.owner + "/" + g.repo })); e.token = true; throw e; }
      return ghFetch("GET", ghRepo() + "/branches/" + encodeURIComponent(g.branch)).then(function (res) {
        if (res.ok) return;
        if (res.status !== 404) return httpError(res).then(function (e) { throw e; });
        /* first use: the data branch starts from the default branch */
        return ghJSON("GET", ghRepo() + "/git/ref/heads/" + encodeURIComponent(repo.default_branch)).then(function (ref) {
          return ghJSON("POST", ghRepo() + "/git/refs", { ref: "refs/heads/" + g.branch, sha: ref.object.sha });
        });
      });
    }, function (e) {
      if (e.status === 404) { var x = new Error(tr("This GitHub token can't see {r}. Give it access to that repository.", { r: g.owner + "/" + g.repo })); x.token = true; throw x; }
      throw e;
    });
  },
  read: function () {
    return ghFetch("GET", ghPath() + "?ref=" + encodeURIComponent(CONFIG.github.branch)).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) return httpError(res).then(function (e) { throw e; });
      return res.json().then(function (m) {
        if (m.encoding === "base64" && m.content) return { text: b64ToUtf8(m.content), etag: m.sha };
        /* over 1 MB the contents API leaves the content out: fetch the blob itself */
        return ghFetch("GET", ghRepo() + "/git/blobs/" + m.sha, null, "application/vnd.github.raw+json").then(function (r2) {
          if (!r2.ok) return httpError(r2).then(function (e) { throw e; });
          return r2.text().then(function (t) { return { text: t, etag: m.sha }; });
        });
      });
    });
  },
  write: function (text, sha) {
    var body = { message: "HR: data saved" + (ME && ME.fullName ? " by " + ME.fullName : ""), content: utf8ToB64(text), branch: CONFIG.github.branch };
    if (sha) body.sha = sha;
    return ghFetch("PUT", ghPath(), body).then(function (res) {
      if (res.ok) return res.json().then(function (r) { return { etag: r.content.sha }; });
      if (res.status === 409 || res.status === 422) return { conflict: true };
      return httpError(res).then(function (e) { throw e; });
    });
  }
};

/* =================== OneDrive =================== */
function graphToken(force) {
  if (!Store.pca || !Store.account) return Promise.reject(new Error(tr("Sign in to the Employee Portal with your Microsoft account first.")));
  return Store.pca.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: Store.account, forceRefresh: !!force }).then(function (r) { return r.accessToken; })
    .catch(function (e) {
      if (!/interaction_required|login_required|consent_required|no_tokens_found|no_account/i.test((e && (e.errorCode || e.name || e.message)) || "")) throw e;
      Store.pca.acquireTokenRedirect({ scopes: GRAPH_SCOPES, account: Store.account });
      return new Promise(function () {});
    });
}
function graphFetch(method, path, opts, tries) {
  opts = opts || {}; tries = tries || 0;
  return graphToken(tries > 0).then(function (token) {
    return tfetch(/^https:/.test(path) ? path : GRAPH + path, { method: method, cache: "no-store", headers: Object.assign({ Authorization: "Bearer " + token }, opts.headers || {}), body: opts.body });
  }).then(function (res) {
    if ((res.status === 429 || res.status === 503) && tries < 3) return wait(Math.pow(2, tries + 1) * 1000).then(function () { return graphFetch(method, path, opts, tries + 1); });
    if (res.status === 401 && tries < 1) return graphFetch(method, path, opts, tries + 1);
    return res;
  }, function () { throw netError("OneDrive"); });
}
function graphJSON(method, path, body) {
  return graphFetch(method, path, body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
    .then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.status === 204 ? null : res.json(); });
}
function shareId(url) { return "u!" + btoa(unescape(encodeURIComponent(url))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-"); }
function odItem() { var f = Store.folder; return "/drives/" + f.driveId + "/items/" + f.id + ":/" + encodeURIComponent(CONFIG.onedrive.fileName) + ":"; }
var ONEDRIVE = {
  open: function () {
    var c = CONFIG.onedrive, Cls = window.msal && window.msal.PublicClientApplication;
    if (!Cls) return Promise.reject(new Error(tr("The Microsoft sign-in component didn't load. Reload the page.")));
    var here = location.origin + location.pathname;
    Store.pca = new Cls({ auth: { clientId: CONFIG.entra.clientId, authority: "https://login.microsoftonline.com/" + (CONFIG.entra.tenantId || "organizations"), redirectUri: here }, cache: { cacheLocation: "localStorage" } });
    return Promise.resolve(Store.pca.initialize ? Store.pca.initialize() : null).then(function () { return Store.pca.handleRedirectPromise(); }).then(function (res) {
      var all = Store.pca.getAllAccounts();
      Store.account = (res && res.account) || all.filter(function (a) { return (a.username || "").toLowerCase() === (ME.email || "").toLowerCase(); })[0] || all[0] || null;
      var folderOf = function (it) { return { driveId: (it.parentReference || {}).driveId, id: it.id }; };
      if (c.folderLink) return graphJSON("GET", "/shares/" + shareId(c.folderLink) + "/driveItem?$select=id,name,parentReference").then(folderOf);
      return graphJSON("GET", "/me/drive/root:/" + encodeURIComponent(c.folderName)).catch(function (e) {
        if (e.status !== 404) throw e;
        return graphJSON("POST", "/me/drive/root/children", { name: c.folderName, folder: {}, "@microsoft.graph.conflictBehavior": "fail" });
      }).then(folderOf);
    }).then(function (f) { Store.folder = f; });
  },
  read: function () {
    return graphJSON("GET", odItem()).then(function (meta) {
      var url = meta["@microsoft.graph.downloadUrl"];
      return (url ? tfetch(url, { cache: "no-store" }) : graphFetch("GET", odItem() + "/content")).then(function (res) {
        if (!res.ok) return httpError(res).then(function (e) { throw e; });
        return res.text().then(function (t) { return { text: t, etag: meta.eTag }; });
      });
    }, function (e) { if (e.status === 404) return null; throw e; });
  },
  write: function (text, etag) {
    var hd = { "Content-Type": "application/json" };
    if (etag) hd["If-Match"] = etag; else hd["If-None-Match"] = "*";
    return graphFetch("PUT", odItem() + "/content", { body: text, headers: hd }).then(function (res) {
      if (res.ok) return res.json().then(function (it) { return { etag: it.eTag }; });
      if (res.status === 412 || res.status === 409) return { conflict: true };
      return httpError(res).then(function (e) { throw e; });
    });
  }
};
function backend() { return STORAGE === "github" ? GITHUB : ONEDRIVE; }

/* ---------- start-up ---------- */
function storeInit() {
  var c = readCache();
  db = c ? c.data : emptyData();
  if (!REMOTE) {
    if (!db.seededAt) { seedDemo(db); writeCache(); }
    return Promise.resolve();
  }
  Store.etag = c ? c.etag : null; Store.dirty = !!(c && c.dirty);
  if (STORAGE === "github" && !ghToken()) { setState("token"); return Promise.resolve(); }
  setState("loading");
  var first = backend().open().then(function () { return backend().read(); }).then(function (r) {
    if (!r) { if (!db.seededAt) seedDemo(db); Store.etag = null; Store.dirty = true; }
    else adopt(r);
    writeCache();
    setState("saved");
    Store.lastSync = new Date();
    if (Store.dirty) return push();
  }).catch(function (e) {
    if (e.token) { setState("token", e.message); return; }
    setState(e.network ? "offline" : "error", e.message);
    if (!db.seededAt && !c) seedDemo(db);
    setTimeout(poll, 5000);
  });
  startPolling();
  /* with a copy in this browser, open at once and catch up in the background */
  return c ? Promise.resolve() : first;
}
function adopt(r) {
  var remote = parseText(r.text);
  db = mergeData(remote, db); Store.etag = r.etag;
  Store.dirty = dataText(db) !== dataText(remote);
}
function push() {
  if (!REMOTE || Store.state === "token") return Promise.resolve();
  if (Store.busy) { Store.again = true; return Promise.resolve(); }
  Store.busy = true; setState("saving");
  var tries = 0;
  var attempt = function () {
    return backend().write(dataText(db), Store.etag).then(function (r) {
      if (!r.conflict) { Store.etag = r.etag; Store.dirty = false; Store.lastSync = new Date(); writeCache(); setState("saved"); return; }
      if (++tries > 5) throw new Error(tr("Others keep saving at the same moment. HR tries again shortly."));
      /* someone saved in between: bring their changes in, then try again */
      return backend().read().then(function (cur) {
        if (cur) { var mine = db; db = mergeData(parseText(cur.text), mine); Store.etag = cur.etag; } else Store.etag = null;
        writeCache(); if (window.refresh) refresh();
        return attempt();
      });
    });
  };
  return attempt().catch(function (e) {
    setState(e.token ? "token" : e.network ? "offline" : "error", e.message);
    clearTimeout(Store.timer); Store.timer = setTimeout(push, 15000);
  }).then(function () {
    Store.busy = false;
    if (Store.again) { Store.again = false; return push(); }
  });
}
function poll() {
  if (!REMOTE || Store.busy || Store.state === "token" || document.hidden) return;
  backend().read().then(function (r) {
    /* nothing new — but the connection works, so whatever the badge said (loading, offline, an error), it's in step now */
    if (!r || r.etag === Store.etag) { if (Store.state !== "saved" && !Store.dirty) setState("saved"); return; }
    adopt(r); writeCache(); Store.lastSync = new Date(); setState("saved");
    if (window.refresh) refresh();
    if (Store.dirty) push();
  }).catch(function (e) { if (e.network) setState("offline", e.message); });
}
function startPolling() {
  clearInterval(Store.poller);
  Store.poller = setInterval(poll, 30000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(); });
  window.addEventListener("online", function () { if (Store.dirty) push(); else poll(); });
}
function saveGithubToken(tok) { try { localStorage.setItem(GH_TOKEN_KEY, tok.trim()); } catch (e) {} location.reload(); }
