/* =====================================================================
   Taskana (by GALIL) — core: constants, utilities, data store,
   permissions, history and notifications. (Team and demo data: seed.js;
   sign-in: auth.js; GitHub / OneDrive files: storage.js.)
   Classic script: everything here is a global used by the other files.
   ===================================================================== */
"use strict";

/* deployment settings (config.js), optionally overridden in this browser from the sign-in screen */
var CONFIG_KEY = "galil-taskana-config";
var CONFIG = (function () {
  var base = window.TASKANA_CONFIG || {}, o = null;
  try { o = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"); } catch (e) {}
  var c = { domain: base.domain || "@galiltc.co.il", storage: base.storage || "", entra: Object.assign({ clientId: "", tenantId: "" }, base.entra),
    github: Object.assign({ owner: "", repo: "", branch: "taskana-data", path: "taskana" }, base.github),
    onedrive: Object.assign({ folderLink: "", folderName: "Taskana", fileName: "taskana-data.json" }, base.onedrive), override: false };
  if (o && typeof o === "object") {
    if (o.storage != null) c.storage = o.storage;
    ["entra", "github", "onedrive"].forEach(function (k) { c[k] = Object.assign(c[k], o[k] || {}); });
    c.override = true;
  }
  return c;
})();
var DOMAIN = CONFIG.domain.toLowerCase();
/* ENTRA: real Microsoft Entra ID sign-in (otherwise the WorkDesk-style demo sign-in).
   STORAGE: "local" (this browser), "github" (a data file in a repository) or "onedrive" (needs Entra). */
var ENTRA = !!CONFIG.entra.clientId;
var STORAGE = (function () {
  var s = CONFIG.storage || (ENTRA ? "onedrive" : "local");
  if (s === "onedrive" && !ENTRA) s = "local";
  if (s === "github" && !(CONFIG.github.owner && CONFIG.github.repo)) s = "local";
  return /^(local|github|onedrive)$/.test(s) ? s : "local";
})();
var REMOTE = STORAGE !== "local";

var KEY = "galil-taskana-v1", OLD_KEYS = ["galil-folio-v1"], BEFORE_RESTORE_KEY = "galil-taskana-before-restore";
var WORKDESK_KEY = "galil-workdesk-v1";
var APP_VERSION = 2;
var ACTIVITY_PER_TASK = 200, NOTIFICATIONS_PER_USER = 300;
var MAX_ATTACHMENT_BYTES = 1024 * 1024;

var STATUSES = [
  { k: "Backlog",     color: "var(--st-backlog)", chip: "" },
  { k: "To Do",       color: "var(--st-todo)",    chip: "blue" },
  { k: "Writing",     color: "var(--st-writing)", chip: "amber" },
  { k: "Peer Review", color: "var(--st-peer)",    chip: "pink" },
  { k: "SME Review",  color: "var(--st-sme)",     chip: "violet" },
  { k: "Done",        color: "var(--st-done)",    chip: "green" }
];
var NOT_STARTED = { "Backlog": 1, "To Do": 1 };
var TYPES = ["Writing", "Editing", "Review", "Illustration", "Translation", "Localization", "SME Interview", "Publishing", "Doc Defect", "Research"];
var TYPE_CHIP = { "Writing": "amber", "Editing": "violet", "Review": "violet", "Illustration": "teal", "Translation": "blue", "Localization": "blue", "SME Interview": "teal", "Publishing": "green", "Doc Defect": "red", "Research": "" };
var PRIORITIES = [
  { k: "Critical", color: "var(--err)" },
  { k: "High",     color: "var(--amber)" },
  { k: "Medium",   color: "var(--blue)" },
  { k: "Low",      color: "var(--grey)" }
];
var DOC_TYPES = ["User Manual", "Operator Manual", "Maintenance Manual", "Online Help", "API Reference", "Release Notes", "Training Courseware", "Quick Start Guide", "Knowledge Base", "Proposal", "Other"];
var PROJECT_STATUSES = ["Active", "On Hold", "Completed", "Archived"];
var ROLES = ["Admin", "Manager", "Member", "External", "Viewer"];
var EMPLOYMENT = ["Employee", "Outsourced"];
var DEPARTMENTS = ["Management", "Civil Division", "Defense Division", "Engineering", "Office & HR", "Marketing", "Finance"];
var RECURRENCES = ["", "Weekly", "Every 2 weeks", "Monthly"];
var LINK_TYPES = ["blocks", "is blocked by", "relates to"];
var LINK_INVERSE = { "blocks": "is blocked by", "is blocked by": "blocks", "relates to": "relates to" };
var AVATAR_COLORS = ["#4E7A1C", "#2A78D6", "#B8402F", "#6250D6", "#1F7F72", "#B0661C", "#7A4E33", "#2F6F4F", "#A0326A", "#4A5A9A"];

/* ================= utilities ================= */
function uid(p) { return p + "-" + Math.random().toString(36).slice(2, 9); }
function nowISO() { return new Date().toISOString(); }
function d2s(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (dd < 10 ? "0" : "") + dd; }
function today() { return d2s(new Date()); }
/* the calendar date (in the viewer's time zone) of a timestamp */
function localDate(iso) { return iso ? d2s(new Date(iso)) : null; }
function parseDay(s) { return new Date(s + "T00:00:00"); }
function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return d2s(d); }
function addMonths(s, n) { var d = parseDay(s); d.setMonth(d.getMonth() + n); return d2s(d); }
/* GALIL works Sunday–Thursday */
function isWeekend(s) { if (!s) return false; var g = parseDay(s).getDay(); return g === 5 || g === 6; }
function isOverdue(t) { return !!t.dueDate && t.status !== "Done" && t.dueDate < today(); }
function initials(name) { return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (s) { return s[0].toUpperCase(); }).join(""); }
function colorFor(id) { var h_ = 0; for (var i = 0; i < id.length; i++) h_ = (h_ * 31 + id.charCodeAt(i)) >>> 0; return AVATAR_COLORS[h_ % AVATAR_COLORS.length]; }
function byId(arr, id) { if (!id) return null; for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
function statusOf(k) { for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].k === k) return STATUSES[i]; return STATUSES[0]; }
function prioOf(k) { for (var i = 0; i < PRIORITIES.length; i++) if (PRIORITIES[i].k === k) return PRIORITIES[i]; return PRIORITIES[2]; }
function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
function fmtBytes(n) { return n < 1024 ? n + " B" : n < 1048576 ? Math.round(n / 1024) + " KB" : (Math.round(n / 104857.6) / 10) + " MB"; }

/* ================= store ================= */
var db;
var dataVersion = 0;          // bumped on every save; indexes rebuild lazily
var storageOK = true;

function emptyDB() {
  return { app: "galil-taskana", version: APP_VERSION, rosterVersion: 1, users: [], clients: [], projects: [], tasks: [], comments: [], activity: [],
    views: [], notifications: [], attachments: [], settings: { currentUserId: null, theme: null, lang: "en" } };
}
function isBackup(o) { return !!o && (o.app === "galil-taskana" || o.app === "galil-folio") && Array.isArray(o.tasks); }

/* bring older saves (including the app's earlier "Folio" name) up to the current shape */
function upgrade(o) {
  var e = emptyDB();
  Object.keys(e).forEach(function (k) { if (o[k] == null) o[k] = e[k]; });
  o.settings = Object.assign({}, e.settings, o.settings || {});
  o.app = "galil-taskana"; o.version = APP_VERSION;
  o.users.forEach(function (u) {
    if (!u.role) u.role = "Member"; if (u.isActive == null) u.isActive = true;
    if (u.pendingActivation == null) u.pendingActivation = false; if (!u.employment) u.employment = "Employee";
  });
  /* once: saves from before the real roster get the GALIL team added */
  if (!o.rosterVersion) {
    if (typeof teamUsers === "function") teamUsers().forEach(function (t) { if (!byId(o.users, t.id) && !o.users.some(function (u) { return (u.email || "").toLowerCase() === t.email; })) o.users.push(t); });
    o.rosterVersion = 1;
  }
  o.tasks.forEach(function (t) {
    if (!t.aliases) t.aliases = [];
    if (!t.links) t.links = [];
    if (!t.checklist) t.checklist = [];
    if (!t.labels) t.labels = [];
    if (t.parentId === undefined) t.parentId = null;
    if (t.status === "Done" && !t.completedAt) t.completedAt = t.updatedAt;
    if (t.status === "Done" && t.completedBy === undefined) t.completedBy = t.assigneeId;
    if (t.startedAt === undefined) t.startedAt = NOT_STARTED[t.status] ? null : t.createdAt;
  });
  o.activity.forEach(function (a) {
    if (!a.kind) { a.kind = a.text === "created the task" ? "created" : "note"; if (a.kind === "created") { var t = byId(o.tasks, a.taskId); a.to = t ? t.assigneeId : null; } }
  });
  o.comments.forEach(function (c) { c.mentions = c.mentions || []; });
  return o;
}

/* Validate a backup before it replaces anything. Returns an error message or "". */
function validateBackup(o) {
  if (!isObj(o)) return "The file is not a JSON object.";
  if (!isBackup(o)) return "This file is not a Taskana backup.";
  var need = { users: ["id", "fullName"], clients: ["id", "name"], projects: ["id", "clientId", "key", "name"], tasks: ["id", "projectId", "title", "status"] };
  for (var k in need) {
    if (!Array.isArray(o[k])) return "The backup has no “" + k + "” list.";
    for (var i = 0; i < o[k].length; i++) {
      var r = o[k][i];
      if (!isObj(r)) return "Entry " + (i + 1) + " in “" + k + "” is not an object.";
      for (var j = 0; j < need[k].length; j++) if (r[need[k][j]] == null || r[need[k][j]] === "") return "Entry " + (i + 1) + " in “" + k + "” has no " + need[k][j] + ".";
    }
  }
  var pids = {}; o.projects.forEach(function (p) { pids[p.id] = 1; });
  for (var n = 0; n < o.tasks.length; n++) if (!pids[o.tasks[n].projectId]) return "Task “" + o.tasks[n].title + "” belongs to a project that is not in the backup.";
  ["comments", "activity", "views", "notifications", "attachments"].forEach(function (k2) { if (o[k2] != null && !Array.isArray(o[k2])) o[k2] = []; });
  return "";
}

function readStore() {
  try {
    var keys = [KEY].concat(OLD_KEYS);
    for (var i = 0; i < keys.length; i++) {
      var s = localStorage.getItem(keys[i]);
      if (s) { var o = JSON.parse(s); if (isBackup(o)) return upgrade(o); }
    }
  } catch (e) {}
  return null;
}
function load() {
  var o = readStore();
  if (o) return o;
  o = seed(); db = o; save(true);   // save the demo data at once so its dates stay fixed
  return o;
}
function save(quiet) {
  dataVersion++;
  if (REMOTE) { if (Store.remote) Store.changed(); return; }   // GitHub / OneDrive (storage.js)
  try { localStorage.setItem(KEY, JSON.stringify(db)); storageOK = true; }
  catch (e) { storageOK = false; if (!quiet && typeof toast === "function") toast(tr("Browser storage is full — the last change was not saved. Remove attachments or download a backup.")); }
}
function storageSize() { try { return (localStorage.getItem(KEY) || "").length * 2; } catch (e) { return 0; } }

/* ================= lookups & indexes ================= */
var idx = { v: -1 };
function index() {
  if (idx.v === dataVersion) return idx;
  idx = { v: dataVersion, keys: {}, comments: {}, openQ: {}, children: {}, attachments: {} };
  var pk = {}; db.projects.forEach(function (p) { pk[p.id] = p.key; });
  db.tasks.forEach(function (t) {
    idx.keys[(pk[t.projectId] || "?") + "-" + t.num] = t;
    (t.aliases || []).forEach(function (a) { if (!idx.keys[a]) idx.keys[a] = t; });
    if (t.parentId) (idx.children[t.parentId] = idx.children[t.parentId] || []).push(t);
  });
  db.comments.forEach(function (c) {
    (idx.comments[c.taskId] = idx.comments[c.taskId] || []).push(c);
    if (c.kind === "question" && !c.resolved) (idx.openQ[c.taskId] = idx.openQ[c.taskId] || []).push(c);
  });
  Object.keys(idx.comments).forEach(function (k) { idx.comments[k].sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; }); });
  db.attachments.forEach(function (a) { (idx.attachments[a.taskId] = idx.attachments[a.taskId] || []).push(a); });
  return idx;
}
/* the signed-in person (auth.js keeps db.settings.currentUserId in step with the session) */
function me() { return byId(db.users, db.settings.currentUserId) || { id: "", fullName: "", role: "Viewer", isActive: false }; }
function userName(id) { var u = byId(db.users, id); return u ? u.fullName : tr("Unassigned"); }
function projectOf(t) { return byId(db.projects, t.projectId); }
function clientOf(p) { return p ? byId(db.clients, p.clientId) : null; }
function taskKey(t) { var p = projectOf(t); return (p ? p.key : "?") + "-" + t.num; }
function taskByKey(k) { return index().keys[k] || null; }
function commentsOf(taskId) { return index().comments[taskId] || []; }
function openQuestions(taskId) { return index().openQ[taskId] || []; }
function childrenOf(taskId) { return index().children[taskId] || []; }
function attachmentsOf(taskId) { return index().attachments[taskId] || []; }

/* ================= permissions ================= */
function roleOf(u) { return (u || me()).role || "Member"; }
function isManager(u) { var r = roleOf(u); return r === "Admin" || r === "Manager"; }
/* External (outsourced finance, HR, contractors): only the tasks they work on, report or are mentioned in */
function isExternal(u) { return roleOf(u) === "External"; }
function canSee(t) {
  if (!isExternal()) return true;
  var id = me().id;
  return t.assigneeId === id || t.reporterId === id || commentsOf(t.id).some(function (c) { return c.authorId === id || (c.mentions || []).indexOf(id) >= 0; });
}
function visibleTasks() { return isExternal() ? db.tasks.filter(canSee) : db.tasks; }
var can = {
  seeEverything: function () { return !isExternal(); },
  exportData: function () { return !isExternal(); },
  manageClients: function () { return isManager(); },
  manageProjects: function () { return isManager(); },
  managePeople: function () { return roleOf() === "Admin"; },
  manageData: function () { return roleOf() === "Admin"; },
  createTask: function () { return roleOf() !== "Viewer"; },
  editTask: function () { return roleOf() !== "Viewer"; },
  deleteTask: function (t) { return isManager() || (roleOf() !== "Viewer" && t.reporterId === me().id); },
  comment: function () { return true; },
  editComment: function (c) { return c.authorId === me().id; },
  deleteComment: function (c) { return c.authorId === me().id || roleOf() === "Admin"; },
  resolveQuestion: function (c, t) {
    var u = me(), p = projectOf(t);
    return isManager() || c.authorId === u.id || t.assigneeId === u.id || t.reporterId === u.id || (p && p.leadUserId === u.id);
  },
  editView: function (v) { return v.ownerId === me().id || roleOf() === "Admin"; }
};

/* ================= history ================= */
function log(taskId, kind, fields) {
  var a = Object.assign({ id: uid("a"), taskId: taskId, userId: me().id, at: nowISO(), kind: kind }, fields || {});
  db.activity.push(a);
  /* keep each task's history to a sane length */
  var mine = db.activity.filter(function (x) { return x.taskId === taskId; });
  if (mine.length > ACTIVITY_PER_TASK) {
    var drop = {}; mine.slice(0, mine.length - ACTIVITY_PER_TASK).forEach(function (x) { if (x.kind !== "created") drop[x.id] = 1; });
    db.activity = db.activity.filter(function (x) { return !drop[x.id]; });
  }
  return a;
}

/* ================= notifications ================= */
function notify(userIds, kind, taskId, extra) {
  var by = me().id, seen = {};
  userIds.forEach(function (u) {
    if (!u || u === by || seen[u]) return; seen[u] = 1;
    var usr = byId(db.users, u); if (!usr || !usr.isActive) return;
    db.notifications.push(Object.assign({ id: uid("n"), userId: u, kind: kind, taskId: taskId, byId: by, at: nowISO(), read: false }, extra || {}));
  });
  /* cap per person */
  var count = {};
  for (var i = db.notifications.length - 1; i >= 0; i--) {
    var n = db.notifications[i]; count[n.userId] = (count[n.userId] || 0) + 1;
    if (count[n.userId] > NOTIFICATIONS_PER_USER) db.notifications.splice(i, 1);
  }
}
function unreadCount() { var u = me(); return db.notifications.filter(function (n) { return n.userId === u.id && !n.read; }).length; }

/* ================= mentions =================
   Stored as @[user-id] so renames and duplicate names stay unambiguous. */
var MENTION_RE = /@\[([\w-]+)\]/g;
function mentionIds(body) { var out = [], m; MENTION_RE.lastIndex = 0; while ((m = MENTION_RE.exec(body))) if (out.indexOf(m[1]) < 0) out.push(m[1]); return out; }
/* "@Full Name" → "@[id]": names picked from the list (picked) win; otherwise a name used by exactly one person */
function encodeMentions(text, picked) {
  var names = {};
  db.users.forEach(function (u) { (names[u.fullName] = names[u.fullName] || []).push(u.id); });
  Object.keys(picked || {}).forEach(function (n) { names[n] = [picked[n]]; });
  var list = Object.keys(names).filter(function (n) { return names[n].length === 1; }).sort(function (a, b) { return b.length - a.length; });
  if (!list.length) return text;
  var re = new RegExp("@(" + list.map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")(?![\\w])", "g");
  return text.replace(re, function (_, n) { return "@[" + names[n][0] + "]"; });
}
function decodeMentions(body, picked) {
  return body.replace(MENTION_RE, function (_, id) { var u = byId(db.users, id); if (!u) return "@?"; if (picked) picked[u.fullName] = id; return "@" + u.fullName; });
}

/* ================= task changes ================= */
function setField(t, k, v) {
  var old = t[k];
  if (JSON.stringify(old) === JSON.stringify(v)) return false;
  if (k === "projectId") {
    var np = byId(db.projects, v); if (!np) return false;
    t.aliases = (t.aliases || []).concat([taskKey(t)]);
    t.num = np.nextNum++;
  }
  t[k] = v; t.updatedAt = nowISO();
  if (k === "status") onStatusChange(t, old, v);
  if (k === "assigneeId" && v) notify([v], "assigned", t.id);
  log(t.id, "field", { field: k, from: old == null ? null : old, to: v == null ? null : v });
  save();
  return true;
}
function onStatusChange(t, old, v) {
  if (!NOT_STARTED[v] && !t.startedAt) t.startedAt = nowISO();
  if (v === "Done") {
    if (old !== "Done") { t.completedAt = nowISO(); t.completedBy = t.assigneeId || null; maybeRecur(t); }
  } else { t.completedAt = null; t.completedBy = null; }
  if (v === "Done" && t.reporterId) notify([t.reporterId], "done", t.id);
}
/* recurring work: closing it schedules the next one */
function maybeRecur(t) {
  if (!t.recurrence) return;
  var p = byId(db.projects, t.projectId); if (!p) return;
  var step = function (s) { return !s ? null : t.recurrence === "Weekly" ? addDays(s, 7) : t.recurrence === "Every 2 weeks" ? addDays(s, 14) : addMonths(s, 1); };
  var n = Object.assign({}, t, {
    id: uid("t"), num: p.nextNum++, status: "To Do", aliases: [], links: [],
    checklist: (t.checklist || []).map(function (c) { return { id: uid("ck"), text: c.text, done: false }; }),
    startDate: step(t.startDate), dueDate: step(t.dueDate) || step(today()),
    createdAt: nowISO(), updatedAt: nowISO(), startedAt: null, completedAt: null, completedBy: null
  });
  db.tasks.push(n);
  log(n.id, "created", { to: n.assigneeId, recurFrom: t.id });
  log(t.id, "recurred", { to: n.id });
}
function createTask(fields) {
  var p = byId(db.projects, fields.projectId);
  var t = Object.assign({
    id: uid("t"), num: p.nextNum++, title: "", type: "Writing", priority: "Medium", status: "To Do", assigneeId: null,
    reporterId: me().id, startDate: null, dueDate: null, estimateHours: null, deliverable: "", description: "",
    labels: [], checklist: [], links: [], aliases: [], parentId: null, recurrence: "",
    createdAt: nowISO(), updatedAt: nowISO(), startedAt: null, completedAt: null, completedBy: null
  }, fields);
  if (!NOT_STARTED[t.status]) t.startedAt = t.createdAt;
  if (t.status === "Done") { t.completedAt = t.createdAt; t.completedBy = t.assigneeId; }
  db.tasks.push(t);
  log(t.id, "created", { to: t.assigneeId });
  if (t.assigneeId) notify([t.assigneeId], "assigned", t.id);
  save();
  return t;
}
function deleteTasks(ids) {
  var set = {}; ids.forEach(function (i) { set[i] = 1; });
  /* sub-tasks of a deleted task become top-level tasks */
  db.tasks.forEach(function (t) { if (t.parentId && set[t.parentId] && !set[t.id]) t.parentId = null; t.links = (t.links || []).filter(function (l) { return !set[l.taskId]; }); });
  db.tasks = db.tasks.filter(function (t) { return !set[t.id]; });
  db.comments = db.comments.filter(function (c) { return !set[c.taskId]; });
  db.activity = db.activity.filter(function (a) { return !set[a.taskId]; });
  db.notifications = db.notifications.filter(function (n) { return !set[n.taskId]; });
  db.attachments = db.attachments.filter(function (a) { if (set[a.taskId] && (a.driveItemId || a.ghPath)) deleteAttachmentFile(a); return !set[a.taskId]; });
  save();
}
function addLink(a, type, b) {
  if (a.id === b.id) return;
  a.links = (a.links || []).filter(function (l) { return l.taskId !== b.id; }).concat([{ type: type, taskId: b.id }]);
  b.links = (b.links || []).filter(function (l) { return l.taskId !== a.id; }).concat([{ type: LINK_INVERSE[type], taskId: a.id }]);
  a.updatedAt = b.updatedAt = nowISO();
  log(a.id, "link", { field: type, to: b.id });
  save();
}
function removeLink(a, b) {
  a.links = (a.links || []).filter(function (l) { return l.taskId !== b.id; });
  b.links = (b.links || []).filter(function (l) { return l.taskId !== a.id; });
  save();
}
function openBlockers(t) { return (t.links || []).filter(function (l) { if (l.type !== "is blocked by") return false; var o = byId(db.tasks, l.taskId); return o && o.status !== "Done"; }); }

/* Saved views that point at a deleted client/project lose that filter; views left with nothing are removed. */
function cleanViews(kind, id) {
  var changed = 0, removed = 0;
  db.views = db.views.filter(function (v) {
    var f = v.filters || {};
    if ((kind === "client" && f.clientId === id) || (kind === "project" && f.projectId === id)) {
      delete f[kind === "client" ? "clientId" : "projectId"];
      if (kind === "client") delete f.projectId;
      changed++;
      if (!Object.keys(f).length) { removed++; return false; }
    }
    return true;
  });
  return { changed: changed, removed: removed };
}

/* ================= WorkDesk import =================
   Reads people, clients and projects from WorkDesk (same browser, or one of its backup files)
   and merges them by id. Tasks are untouched. */
function workdeskData(o) {
  if (!isObj(o)) return null;
  var d = o.app === "galil-workdesk" && isObj(o.data) ? o.data : o;
  return Array.isArray(d.users) && Array.isArray(d.clients) && Array.isArray(d.projects) ? d : null;
}
var WD_ROLE = { CEO: "Admin", OPS: "Admin", PM: "Manager", TL: "Manager", VIEW: "Viewer", FIN: "Viewer", EXT: "External" };
function importWorkdesk(d) {
  var stats = { users: 0, clients: 0, projects: 0 };
  d.users.forEach(function (u) {
    if (!u.id || !u.fullName) return;
    var mine = byId(db.users, u.id) || (function () { var x = { id: u.id, role: WD_ROLE[u.role] || "Member" }; db.users.push(x); stats.users++; return x; })();
    Object.assign(mine, { fullName: u.fullName, email: u.email || mine.email || "", jobTitle: u.jobTitle || mine.jobTitle || "", department: u.department || mine.department || "", isActive: u.isActive !== false && !u.pendingActivation });
  });
  d.clients.forEach(function (c) {
    if (!c.id || !c.name) return;
    var mine = byId(db.clients, c.id);
    if (!mine) { mine = { id: c.id, industry: c.isInternal ? "Internal" : "" }; db.clients.push(mine); stats.clients++; }
    var code = (c.initials || c.name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "CL";
    Object.assign(mine, { name: c.name, code: mine.code || code, contactName: c.contactName || "", contactEmail: c.contactEmail || "", notes: mine.notes || c.notes || "" });
  });
  var used = {}; db.projects.forEach(function (p) { used[p.key] = p.id; });
  d.projects.forEach(function (p) {
    if (!p.id || !p.name || !byId(db.clients, p.clientId)) return;
    var mine = byId(db.projects, p.id);
    if (!mine) {
      var base = p.name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join("").toUpperCase().replace(/^[^A-Z]+/, "").slice(0, 4) || "PRJ";
      if (base.length < 2) base = (base + "PR").slice(0, 2);
      var key = base, i = 2; while (used[key]) key = base.slice(0, 4) + i++;
      used[key] = p.id;
      mine = { id: p.id, key: key, docType: "Other", description: p.notes || "", nextNum: 1 }; db.projects.push(mine); stats.projects++;
    }
    var st = /closed|complete|done/i.test(p.status || "") ? "Completed" : /hold|pause/i.test(p.status || "") ? "On Hold" : /archiv/i.test(p.status || "") ? "Archived" : "Active";
    Object.assign(mine, { clientId: p.clientId, name: p.name, status: st, leadUserId: byId(db.users, p.ownerUserId) ? p.ownerUserId : (mine.leadUserId || null), startDate: p.startDate || null, dueDate: p.endDate || null });
  });
  save();
  return stats;
}
