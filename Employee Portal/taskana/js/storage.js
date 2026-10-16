/* =====================================================================
   Taskana — where the data lives.
   "local"    this browser's localStorage (core.js load/save) — the demo.
   "github"   a data file in a GitHub repository, written through the
              GitHub API with a personal access token (the testing setup):
                <path>/taskana-data.json, <path>/attachments/…
              on its own branch, so every save is a commit there.
   "onedrive" data files in a company OneDrive folder, through Microsoft
              Graph with the signed-in person's Entra ID token:
                taskana-data.json, attachments/…, backups/taskana-<date>.json
   Saving is optimistic: every write carries the version it was based on
   (GitHub blob sha / OneDrive eTag); if someone else saved in between,
   their version is fetched and merged record by record (and field by
   field) before trying again. Other people's changes are picked up every
   30 seconds and when the tab comes back into view. A copy is cached in
   this browser so Taskana opens instantly and keeps working offline.
   ===================================================================== */
"use strict";

var GRAPH = "https://graph.microsoft.com/v1.0", GITHUB_API = "https://api.github.com";
var CACHE_KEY = "galil-taskana-cache", PREFS_KEY = "galil-taskana-prefs", BACKUP_DAY_KEY = "galil-taskana-backup-day", GH_TOKEN_KEY = "galil-taskana-github-token";
var MAX_ONEDRIVE_ATTACHMENT = 50 * 1024 * 1024, MAX_GITHUB_ATTACHMENT = 10 * 1024 * 1024;
var COLLECTIONS = ["users", "clients", "projects", "tasks", "comments", "activity", "views", "notifications", "attachments"];

var Store = {
  remote: false, state: "idle", error: "", lastSync: null, folder: null, etag: null, base: null, baseText: null,
  dirty: false, busy: false, again: false, timer: null, poller: null, retry: null, size: 0, merges: 0, renderWait: null, subs: {},

  changed: function () { savePrefs(true); this.dirty = true; writeCache(); this.schedule(backend().debounce); },
  schedule: function (ms) { var s = this; clearTimeout(s.timer); s.timer = setTimeout(function () { pushRemote(); }, ms); },
  stop: function () { clearTimeout(this.timer); clearInterval(this.poller); clearTimeout(this.retry); this.remote = false; this.state = "idle"; this.folder = null; this.etag = null; this.base = null; this.baseText = null; this.dirty = false; },
  clearCache: function () { try { [CACHE_KEY, CACHE_KEY + ":data", CACHE_KEY + ":base"].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} },
  pollNow: function () { poll(true); }
};
function backend() { return BACKENDS[STORAGE] || BACKENDS.onedrive; }
function whereName() { return backend().label; }

/* ---------- device preferences (theme, language) stay on the device ---------- */
function readPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {}; } catch (e) { return {}; } }
function applyPrefs() { var p = readPrefs(); if (p.theme !== undefined) db.settings.theme = p.theme; if (p.lang) db.settings.lang = p.lang; LANG = db.settings.lang === "he" ? "he" : "en"; }
function savePrefs(quiet) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: db.settings.theme || null, lang: db.settings.lang || "en" })); } catch (e) {}
  if (!quiet && !Store.remote && db.users.length) save(true);
}

/* the shared part of the data, as uploaded (per-device settings left out) */
function sharedText(d) { return JSON.stringify(Object.assign({}, d, { settings: undefined })); }
function parseShared(text) { var o = JSON.parse(text); if (!isBackup(o)) throw new Error(tr("The data file isn't Taskana data.")); return upgrade(o); }

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function httpError(res, fallback) {
  return res.text().then(function (t) {
    var j = null; try { j = JSON.parse(t); } catch (e) {}
    var msg = j && (j.error && j.error.message || j.message);
    var e = new Error(msg || fallback || ("HTTP " + res.status)); e.status = res.status; e.code = j && j.error && j.error.code; return e;
  });
}
function netError(where) { var err = new Error(tr("Can't reach {w}. Check the connection.", { w: where })); err.network = true; return err; }
function utf8ToB64(text) { var bytes = new TextEncoder().encode(text), s = ""; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function b64ToUtf8(b64) { var bin = atob(b64.replace(/\s+/g, "")), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function fileToB64(file) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(",")[1] || ""); }; r.onerror = function () { no(r.error); }; r.readAsDataURL(file); }); }
function safeName(n) { return n.replace(/[\\/:*?"<>|#%]+/g, "_").slice(-120); }

/* =================== OneDrive (Microsoft Graph) =================== */
function graphFetch(method, path, opts, tries) {
  opts = opts || {}; tries = tries || 0;
  return graphToken(tries > 0 && opts.authRetry).then(function (token) {
    return fetch(/^https:/.test(path) ? path : GRAPH + path, { method: method, cache: "no-store", headers: Object.assign({ Authorization: "Bearer " + token }, opts.headers || {}), body: opts.body });
  }).then(function (res) {
    if ((res.status === 429 || res.status === 503 || res.status === 504) && tries < 3) {
      var ra = +res.headers.get("Retry-After"); return wait((ra > 0 ? Math.min(ra, 30) : Math.pow(2, tries + 1)) * 1000).then(function () { return graphFetch(method, path, opts, tries + 1); });
    }
    if (res.status === 401 && tries < 1) return graphFetch(method, path, Object.assign({}, opts, { authRetry: true }), tries + 1);
    return res;
  }, function () { throw netError("OneDrive"); });
}
function graphJSON(method, path, body) {
  return graphFetch(method, path, body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
    .then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.status === 204 ? null : res.json(); });
}
function shareId(url) { return "u!" + btoa(unescape(encodeURIComponent(url))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-"); }
function folderOf(it, shared) { return { driveId: (it.parentReference || {}).driveId, id: it.id, name: it.name, webUrl: it.webUrl, shared: shared }; }
function itemPath(name) { var f = Store.folder; return "/drives/" + f.driveId + "/items/" + f.id + ":/" + name.split("/").map(encodeURIComponent).join("/") + ":"; }
function ensureSub(name) {
  if (Store.subs[name]) return Promise.resolve();
  var f = Store.folder;
  return graphJSON("POST", "/drives/" + f.driveId + "/items/" + f.id + "/children", { name: name, folder: {}, "@microsoft.graph.conflictBehavior": "fail" })
    .catch(function (e) { if (e.status !== 409) throw e; }).then(function () { Store.subs[name] = 1; });
}
var ONEDRIVE = {
  label: "OneDrive", debounce: 700, maxAttachment: MAX_ONEDRIVE_ATTACHMENT,
  id: function () { return CONFIG.onedrive.folderLink || CONFIG.onedrive.folderName; },
  open: function () {
    var c = CONFIG.onedrive;
    if (c.folderLink) return graphJSON("GET", "/shares/" + shareId(c.folderLink) + "/driveItem").then(function (it) {
      if (!it.folder) throw new Error(tr("The OneDrive link points to a file, not a folder."));
      if (it.parentReference && it.parentReference.driveId) return folderOf(it, true);
      return graphJSON("GET", "/shares/" + shareId(c.folderLink) + "/driveItem?$select=id,name,webUrl,parentReference").then(function (x) { return folderOf(x, true); });
    });
    return graphJSON("GET", "/me/drive/root:/" + encodeURIComponent(c.folderName)).catch(function (e) {
      if (e.status !== 404) throw e;
      return graphJSON("POST", "/me/drive/root/children", { name: c.folderName, folder: {}, "@microsoft.graph.conflictBehavior": "fail" });
    }).then(function (it) { return folderOf(it, false); });
  },
  read: function () {
    var file = CONFIG.onedrive.fileName;
    return graphJSON("GET", itemPath(file)).then(function (meta) {
      var url = meta["@microsoft.graph.downloadUrl"];
      return (url ? fetch(url, { cache: "no-store" }) : graphFetch("GET", itemPath(file) + "/content")).then(function (res) {
        if (!res.ok) return httpError(res).then(function (e) { throw e; });
        return res.text();
      }).then(function (text) { Store.size = meta.size || text.length; return { text: text, etag: meta.eTag }; });
    }, function (e) { if (e.status === 404) return null; throw e; });
  },
  version: function () { return graphJSON("GET", itemPath(CONFIG.onedrive.fileName) + "?$select=eTag,size").then(function (m) { return m.eTag; }); },
  write: function (text, etag) {
    var hd = { "Content-Type": "application/json" };
    if (etag) hd["If-Match"] = etag; else hd["If-None-Match"] = "*";
    return graphFetch("PUT", itemPath(CONFIG.onedrive.fileName) + "/content", { body: text, headers: hd }).then(function (res) {
      if (res.ok) return res.json().then(function (it) { return { etag: it.eTag, size: it.size || text.length }; });
      if (res.status === 412 || res.status === 409) return { conflict: true };
      return httpError(res).then(function (e) { throw e; });
    });
  },
  backup: function (text) {
    var day = today(), last = null;
    try { last = localStorage.getItem(BACKUP_DAY_KEY); } catch (e) {}
    if (last === day) return;
    try { localStorage.setItem(BACKUP_DAY_KEY, day); } catch (e) {}
    ensureSub("backups").then(function () {
      return graphFetch("PUT", itemPath("backups/taskana-" + day + ".json") + "/content", { body: text, headers: { "Content-Type": "application/json", "If-None-Match": "*" } });
    }).catch(function () {});
  },
  putFile: function (file, attId) {
    return ensureSub("attachments").then(function () {
      return graphFetch("PUT", itemPath("attachments/" + attId + "-" + safeName(file.name)) + "/content", { body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
    }).then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.json(); })
      .then(function (it) { return { driveId: (it.parentReference || {}).driveId, driveItemId: it.id, url: it.webUrl }; });
  },
  deleteFile: function (a) {
    if (!a.driveItemId || !Store.folder) return;
    graphFetch("DELETE", "/drives/" + (a.driveId || Store.folder.driveId) + "/items/" + a.driveItemId).catch(function () {});
  },
  explain: function (e) {
    return e.status === 403 || e.code === "accessDenied" ? tr("You don't have access to the Taskana folder on OneDrive. Ask an Admin to share it with you.")
      : e.status === 404 ? tr("The Taskana folder link doesn't open a folder any more. An Admin needs to update it in config.js.") : e.message;
  }
};

/* =================== GitHub (contents API) =================== */
function ghToken() { try { return localStorage.getItem(GH_TOKEN_KEY) || ""; } catch (e) { return ""; } }
function ghRepo() { var g = CONFIG.github; return "/repos/" + encodeURIComponent(g.owner) + "/" + encodeURIComponent(g.repo); }
function ghFile(name) { var g = CONFIG.github; return (g.path ? g.path.replace(/\/+$/, "") + "/" : "") + name; }
function ghPath(name) { return ghRepo() + "/contents/" + ghFile(name).split("/").map(encodeURIComponent).join("/"); }
function ghFetch(method, path, body, accept) {
  var tok = ghToken();
  if (!tok) { var e0 = new Error(tr("Taskana needs a GitHub access token on this device.")); e0.status = 401; e0.token = true; return Promise.reject(e0); }
  return fetch(GITHUB_API + path, { method: method, cache: "no-store", headers: { Authorization: "Bearer " + tok, Accept: accept || "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    .then(function (res) {
      if (res.status === 401) { var e = new Error(tr("GitHub refused the access token — it may have expired or been revoked.")); e.status = 401; e.token = true; throw e; }
      if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") { var e2 = new Error(tr("GitHub's hourly request limit was reached. Taskana tries again shortly.")); e2.network = true; throw e2; }
      return res;
    }, function () { throw netError("GitHub"); });
}
function ghJSON(method, path, body) {
  return ghFetch(method, path, body).then(function (res) { if (!res.ok) return httpError(res).then(function (e) { throw e; }); return res.status === 204 ? null : res.json(); });
}
var GITHUB = {
  label: "GitHub", debounce: 2500, maxAttachment: MAX_GITHUB_ATTACHMENT,
  id: function () { var g = CONFIG.github; return g.owner + "/" + g.repo + "@" + g.branch + ":" + g.path; },
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
      }).then(function () {
        return { name: g.owner + "/" + g.repo + " · " + g.branch + (g.path ? " · " + g.path : ""), webUrl: "https://github.com/" + g.owner + "/" + g.repo + "/blob/" + encodeURIComponent(g.branch) + "/" + ghFile(CONFIG.onedrive.fileName), shared: true, private: repo.private };
      });
    }, function (e) {
      if (e.status === 404) { var x = new Error(tr("This GitHub token can't see {r}. Give it access to that repository.", { r: g.owner + "/" + g.repo })); x.token = true; throw x; }
      throw e;
    });
  },
  read: function () {
    var g = CONFIG.github;
    return ghFetch("GET", ghPath(CONFIG.onedrive.fileName) + "?ref=" + encodeURIComponent(g.branch)).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) return httpError(res).then(function (e) { throw e; });
      return res.json().then(function (m) {
        Store.size = m.size;
        if (m.encoding === "base64" && m.content) return { text: b64ToUtf8(m.content), etag: m.sha };
        /* over 1 MB the contents API leaves the content out: fetch the blob itself */
        return ghFetch("GET", ghRepo() + "/git/blobs/" + m.sha, null, "application/vnd.github.raw+json").then(function (r2) {
          if (!r2.ok) return httpError(r2).then(function (e) { throw e; });
          return r2.text().then(function (t) { return { text: t, etag: m.sha }; });
        });
      });
    });
  },
  version: function () {
    return ghFetch("GET", ghPath(CONFIG.onedrive.fileName) + "?ref=" + encodeURIComponent(CONFIG.github.branch)).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) return httpError(res).then(function (e) { throw e; });
      return res.json().then(function (m) { return m.sha; });
    });
  },
  write: function (text, sha) {
    var body = { message: "Taskana: data saved" + (me().fullName ? " by " + me().fullName : ""), content: utf8ToB64(text), branch: CONFIG.github.branch };
    if (sha) body.sha = sha;
    return ghFetch("PUT", ghPath(CONFIG.onedrive.fileName), body).then(function (res) {
      if (res.ok) return res.json().then(function (r) { return { etag: r.content.sha, size: r.content.size }; });
      if (res.status === 409 || res.status === 422) return { conflict: true };   // the file moved on (sha no longer matches) or already exists
      return httpError(res).then(function (e) { throw e; });
    });
  },
  putFile: function (file, attId) {
    var rel = "attachments/" + attId + "-" + safeName(file.name);
    return fileToB64(file).then(function (b64) {
      return ghJSON("PUT", ghPath(rel), { message: "Taskana: attach " + file.name, content: b64, branch: CONFIG.github.branch });
    }).then(function (r) { return { ghPath: ghFile(rel), ghSha: r.content.sha, url: r.content.html_url }; });
  },
  deleteFile: function (a) {
    if (!a.ghPath) return;
    ghFetch("DELETE", ghRepo() + "/contents/" + a.ghPath.split("/").map(encodeURIComponent).join("/"), { message: "Taskana: remove " + a.name, sha: a.ghSha, branch: CONFIG.github.branch }).catch(function () {});
  },
  explain: function (e) { return e.message; }
};
var BACKENDS = { onedrive: ONEDRIVE, github: GITHUB };

/* ---------- read / write the data file ---------- */
function pullRemote() { return backend().read(); }
function adopt(r) {
  var remote = parseShared(r.text), base = parseShared(r.text);
  if (Store.base) merge3(Store.base, db, remote);
  else { var keep = db.settings; COLLECTIONS.forEach(function (k) { db[k] = remote[k]; }); db.rosterVersion = remote.rosterVersion; db.settings = keep; }
  Store.base = base; Store.baseText = sharedText(base); Store.etag = r.etag;
  Store.dirty = sharedText(db) !== Store.baseText;
  dataVersion++;
}
function pushRemote() {
  if (!Store.remote || !Store.folder || Store.state === "setup" || Store.state === "token") return Promise.resolve();
  if (Store.busy) { Store.again = true; return Promise.resolve(); }
  Store.busy = true; clearTimeout(Store.retry);
  var B = backend(), attempt = 0;
  var step = function () {
    var text = sharedText(db);
    if (text === Store.baseText) { Store.dirty = false; return Promise.resolve(); }
    if (attempt++ > 4) throw new Error(tr("The data file kept changing while saving. Try again in a moment."));
    setState("saving");
    return B.write(text, Store.etag).then(function (w) {
      if (!w.conflict) {
        Store.etag = w.etag; Store.size = w.size || text.length; Store.base = parseShared(text); Store.baseText = sharedText(Store.base); Store.lastSync = new Date();
        if (B.backup) B.backup(text);
        return step();
      }
      /* someone else saved first: bring their changes in, then try again */
      return pullRemote().then(function (r) {
        if (!r) { Store.etag = null; return step(); }
        adopt(r); Store.merges++; refreshUI(); return step();
      });
    });
  };
  return step().then(function () { setState("saved"); }, function (e) {
    if (e.token) { setState("token", e.message); render(); return; }
    setState(e.network ? "offline" : "error", e.message);
    Store.retry = setTimeout(function () { pushRemote(); }, e.network ? 15000 : 60000);
  }).then(function () {
    Store.busy = false; writeCache();
    if (Store.again) { Store.again = false; Store.schedule(50); }
  });
}

/* ---------- three-way merge, in place (so open screens keep pointing at live records) ---------- */
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function mapOf(arr) { var m = {}; (arr || []).forEach(function (x) { if (x && x.id) m[x.id] = x; }); return m; }
function mergeRecord(b, l, r) {
  if (b && same(b, l)) {                                  // unchanged here: take theirs
    Object.keys(l).forEach(function (k) { if (!(k in r)) delete l[k]; });
    Object.assign(l, r);
  } else if (b) {                                         // changed here: per field, theirs where only they changed it
    var keys = {}; [b, l, r].forEach(function (o) { Object.keys(o).forEach(function (k) { keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      if (same(l[k], b[k]) && !same(r[k], b[k])) { if (r[k] === undefined) delete l[k]; else l[k] = r[k]; }
    });
  }
  if (l.nextNum != null && r.nextNum != null) l.nextNum = Math.max(l.nextNum, r.nextNum);
}
function merge3(base, local, remote) {
  COLLECTIONS.forEach(function (k) {
    var B = mapOf(base[k]), L = mapOf(local[k]), out = [], seen = {};
    (remote[k] || []).forEach(function (r) {
      seen[r.id] = 1;
      var l = L[r.id], b = B[r.id];
      if (l) { mergeRecord(b, l, r); out.push(l); }
      else if (!b || !same(b, r)) out.push(r);           // new there, or deleted here but changed there
    });
    (local[k] || []).forEach(function (l) {
      if (seen[l.id]) return;
      var b = B[l.id];
      if (!b || !same(b, l)) out.push(l);                // new here, or deleted there but changed here
    });
    local[k] = out;
  });
  local.rosterVersion = Math.max(local.rosterVersion || 0, remote.rosterVersion || 0);
  /* two people added a task to the same project at once: the later one gets the next number */
  var p = mapOf(local.projects), used = {};
  local.tasks.forEach(function (t) {
    var pr = p[t.projectId]; if (!pr) return;
    var key = t.projectId + "#" + t.num;
    if (used[key]) t.num = pr.nextNum++;
    used[t.projectId + "#" + t.num] = 1;
    if (pr.nextNum <= t.num) pr.nextNum = t.num + 1;
  });
  return local;
}

/* ---------- this browser's copy ---------- */
function cacheId() { return STORAGE + "|" + (Auth.account ? Auth.account.username.toLowerCase() : "") + "|" + backend().id(); }
function writeCache() {
  if (!Store.remote || !db.users.length) return;
  try {
    localStorage.setItem(CACHE_KEY + ":data", sharedText(db));
    if (Store.dirty && Store.baseText) localStorage.setItem(CACHE_KEY + ":base", Store.baseText); else localStorage.removeItem(CACHE_KEY + ":base");
    localStorage.setItem(CACHE_KEY, JSON.stringify({ id: cacheId(), etag: Store.etag, dirty: Store.dirty, at: nowISO() }));
  } catch (e) {}
}
function readCache() {
  try {
    var m = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!m || m.id !== cacheId()) return null;
    var data = localStorage.getItem(CACHE_KEY + ":data"), base = localStorage.getItem(CACHE_KEY + ":base");
    return { meta: m, data: parseShared(data), base: m.dirty && base ? parseShared(base) : null };
  } catch (e) { return null; }
}

/* ---------- start, keep in step ---------- */
function startRemote() {
  Store.remote = true;
  if (STORAGE === "github" && !ghToken()) { setState("token"); render(); return Promise.resolve(); }
  setState("loading");
  var cached = readCache();
  if (cached) {
    var keep = db.settings; db = cached.data; db.settings = keep; dataVersion++;
    Store.etag = cached.meta.etag;
    Store.base = cached.base || parseShared(sharedText(cached.data));
    Store.baseText = sharedText(Store.base);
    Store.dirty = !!cached.meta.dirty;
  }
  return backend().open().then(function (f) { Store.folder = f; return pullRemote(); }).then(function (r) {
    if (!r) {
      if (cached) { Store.etag = null; Store.dirty = true; setState("saving"); pushRemote(); }   // the file was removed: put our copy back
      else setState("setup");
      return;
    }
    if (!cached || r.etag !== Store.etag) adopt(r);
    setState(Store.dirty ? "saving" : "saved"); Store.lastSync = new Date();
    if (Store.dirty) pushRemote();
  }).catch(function (e) {
    if (e.token) { setState("token", e.message); return; }
    setState(e.network && cached ? "offline" : "error", backend().explain(e));
  }).then(function () {
    clearInterval(Store.poller);
    Store.poller = setInterval(function () { poll(false); }, 30000);
    if (db.users.length && Store.state !== "setup" && Store.state !== "token") afterDataLoaded();
    render();
  });
}
function poll(force) {
  if (!Store.remote || !Store.folder || Store.busy || Store.state === "setup" || Store.state === "token" || (!force && document.hidden)) return Promise.resolve();
  Store.busy = true;
  return backend().version().then(function (v) {
    if (v === Store.etag) return;
    return pullRemote().then(function (r) { if (r) { adopt(r); refreshUI(); } });
  }).then(function () { if (Store.state === "offline" || Store.state === "error") setState(Store.dirty ? "saving" : "saved"); }, function (e) { if (e.network) setState("offline", e.message); else if (e.token) setState("token", e.message); })
    .then(function () { Store.busy = false; writeCache(); if (Store.dirty || Store.again) { Store.again = false; Store.schedule(50); } if (force || Store.state === "token") render(); });
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(false); });
window.addEventListener("online", function () { if (Store.remote) { poll(true); if (Store.dirty) Store.schedule(50); } });

/* redraw with other people's changes, but never under someone's hands */
function uiBusy() {
  var a = document.activeElement;
  return !!(ui.modal || ui.editingDesc || ui.editingCommentId || drag || (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)));
}
function refreshUI() {
  clearTimeout(Store.renderWait);
  if (uiBusy()) { Store.renderWait = setTimeout(refreshUI, 2000); return; }
  render();
}

/* sync status: shown in the sidebar, updated without a full redraw */
function setState(s, err) {
  Store.state = s; Store.error = err || "";
  var el = document.getElementById("sync-status"); if (el) el.replaceWith(syncStatus());
}
function syncStatus() {
  if (!Store.remote) return h("span", { id: "sync-status", hidden: true });
  var s = Store.state, w = whereName();
  var text = s === "saving" ? tr("Saving to {w}…", { w: w }) : s === "loading" ? tr("Opening from {w}…", { w: w }) : s === "offline" ? tr("Offline — changes are kept and will sync") :
    s === "error" || s === "token" ? tr("Not saved: {m}", { m: Store.error }) : tr("Saved to {w}", { w: w }) + (Store.lastSync ? " · " + Store.lastSync.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }) : "");
  return h("button", { id: "sync-status", class: "sync " + s, title: text, onclick: function () { openModal({ kind: "data" }); } }, h("i", { class: "sync-dot", "aria-hidden": "true" }), h("span", { class: "ellipsis" }, text));
}

/* ---------- first use of an empty folder / repository ---------- */
function startFresh(d) {
  var keep = db.settings;
  db = d; db.settings = keep;
  if (ENTRA) bindAccount(true);                            // whoever sets Taskana up is its first Admin
  Store.etag = null; Store.base = null; Store.baseText = null; Store.dirty = true;
  setState("saving"); dataVersion++;
  return pushRemote().then(function () { afterDataLoaded(); parseRoute(); onRouteChange(null); render(); });
}
function setupScreen() {
  var f = Store.folder || {};
  return authShell([
    h("h1", { class: "auth-h" }, tr("Set up Taskana")),
    h("p", null, tr("There's no Taskana data in {f} yet. Start it now:", { f: "“" + (f.name || whereName()) + "”" }) + (ENTRA ? " " + tr("you'll be its first Admin.") : "")),
    h("div", { class: "grid", style: { gap: "8px" } },
      h("button", { class: "btn primary wide", onclick: function () { startFresh(seed(false)); } }, icon("people"), tr("Start with the GALIL team (no tasks)")),
      h("button", { class: "btn wide", onclick: function () { startFresh(seed(true)); } }, icon("board"), tr("Start with the team and demo tasks")),
      h("label", { class: "btn wide" }, icon("upload"), tr("Start from a Taskana backup file…"), h("input", { type: "file", class: "sr", accept: "application/json,.json", onchange: function (e) {
        var file = e.target.files[0]; if (!file) return;
        var rd = new FileReader();
        rd.onload = function () {
          var o; try { o = JSON.parse(rd.result); } catch (x) { toast(tr("That file isn't valid JSON.")); return; }
          var err = validateBackup(o); if (err) { toast(err); return; }
          startFresh(upgrade(o));
        };
        rd.readAsText(file);
      } }))),
    ENTRA ? h("div", { class: "row", style: { marginTop: "12px" } }, h("button", { class: "btn ghost", onclick: signOut }, tr("Sign out"))) : null
  ]);
}
function storeErrorScreen() {
  return authShell([
    h("h1", { class: "auth-h" }, tr("Can't open Taskana")),
    h("div", { class: "banner err", role: "alert" }, icon("alert"), " ", Store.error),
    h("div", { class: "row", style: { marginTop: "12px" } },
      h("button", { class: "btn primary", onclick: function () { startRemote(); render(); } }, icon("undo"), tr("Try again")),
      ENTRA ? h("button", { class: "btn ghost", onclick: signOut }, tr("Sign out")) : null,
      STORAGE === "github" ? h("button", { class: "btn ghost", onclick: function () { forgetGithubToken(); } }, tr("Use another token")) : null)
  ]);
}
/* GitHub: each device needs a personal access token that may write to the repository */
function forgetGithubToken() { try { localStorage.removeItem(GH_TOKEN_KEY); } catch (e) {} Store.stop(); Store.clearCache(); Store.remote = true; setState("token"); ui.modal = null; ui.modalStack = []; render(); }
function tokenScreen() {
  var g = CONFIG.github, repo = g.owner + "/" + g.repo;
  return authShell([
    h("h1", { class: "auth-h" }, tr("Connect to GitHub")),
    Store.error ? h("div", { class: "banner err", role: "alert" }, icon("alert"), " ", Store.error) : null,
    h("p", null, tr("For now Taskana keeps its data file in the GitHub repository {r} (branch {b}). Paste a GitHub access token that may save there — once per device.", { r: repo, b: g.branch })),
    h("ol", { class: "small steps" },
      h("li", null, tr("Open "), h("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener noreferrer" }, tr("GitHub → new fine-grained token")), "."),
      h("li", null, tr("Resource owner {o}; repository access: only {r}.", { o: g.owner, r: repo })),
      h("li", null, tr("Permissions → Repository → Contents: Read and write. Generate, copy.")),
      h("li", null, tr("Your GitHub account needs write access to the repository."))),
    h("form", { novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var v = document.getElementById("gh-token").value.trim();
      if (!/^(github_pat_|ghp_|gho_|ghu_)\w+$/.test(v)) { toast(tr("That doesn't look like a GitHub token (github_pat_… or ghp_…).")); return; }
      try { localStorage.setItem(GH_TOKEN_KEY, v); } catch (x) {}
      Store.error = ""; startRemote().then(function () { parseRoute(); onRouteChange(null); render(); });
    } },
      h("div", { class: "field" }, h("label", { class: "l", for: "gh-token" }, tr("GitHub access token")), h("input", { class: "f mono", id: "gh-token", type: "password", autocomplete: "off", placeholder: "github_pat_…" })),
      h("button", { class: "btn primary wide", type: "submit", id: "gh-go" }, tr("Connect"))),
    h("p", { class: "muted small" }, tr("The token stays in this browser only. Remove it any time from the Data window."))
  ]);
}

/* ---------- attachments as files next to the data ---------- */
function uploadAttachment(file, attId) { return backend().putFile(file, attId); }
function deleteAttachmentFile(a) { if (Store.remote) backend().deleteFile(a); }

/* ---------- share the folder (when it was made in the Admin's own OneDrive) ---------- */
function shareFolder() {
  var f = Store.folder;
  return graphJSON("POST", "/drives/" + f.driveId + "/items/" + f.id + "/createLink", { type: "edit", scope: "organization" }).then(function (r) { return r.link.webUrl; });
}
