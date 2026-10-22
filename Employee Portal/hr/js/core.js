/* =====================================================================
   GALIL HR — core: settings, words, the data and who may do what.
   (Hebrew: he.js; demo content: seed.js; data files: store.js; the
   screens: pages.js; start-up and routes: app.js.)
   Classic script: everything here is a global used by the other files.

   The data is one JSON document of collections. Every record has an id
   and an updatedAt; a deleted record stays as { id, deleted: true } so a
   deletion reaches everyone. Two copies merge record by record — the
   newer updatedAt wins — which is all a save conflict needs.
   ===================================================================== */
"use strict";

/* ---------- settings: config.js, optionally overridden in this browser ---------- */
var CONFIG_KEY = "galil-hr-config", WD_CONFIG_KEY = "galil-workdesk-config";
var CONFIG = (function () {
  var base = window.HR_CONFIG || {}, o = null, wd = null;
  try { o = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"); } catch (e) {}
  /* the portal's connection settings (chosen on its sign-in screen) apply here too, unless HR has its own */
  try { wd = JSON.parse(localStorage.getItem(WD_CONFIG_KEY) || "null"); } catch (e) {}
  var c = { domain: base.domain || "@galiltc.co.il", storage: base.storage || "", entra: Object.assign({ clientId: "", tenantId: "" }, base.entra),
    github: Object.assign({ owner: "", repo: "", branch: "hr-data", path: "hr" }, base.github),
    onedrive: Object.assign({ folderLink: "", folderName: "HR", fileName: "hr-data.json" }, base.onedrive), override: false };
  if (o && typeof o === "object") {
    if (o.storage != null) c.storage = o.storage;
    ["entra", "github", "onedrive"].forEach(function (k) { c[k] = Object.assign(c[k], o[k] || {}); });
    c.override = true;
  } else if (wd && typeof wd === "object") {
    if (wd.storage != null) c.storage = wd.storage;
    if (wd.entra) c.entra = Object.assign(c.entra, wd.entra);
    if (wd.github) { if (wd.github.owner) c.github.owner = wd.github.owner; if (wd.github.repo) c.github.repo = wd.github.repo; }
    c.override = true;
  }
  return c;
})();
var ENTRA = !!CONFIG.entra.clientId;
var STORAGE = (function () {
  var s = CONFIG.storage || (ENTRA ? "onedrive" : "local");
  if (s === "onedrive" && !ENTRA) s = "local";
  if (s === "github" && !(CONFIG.github.owner && CONFIG.github.repo)) s = "local";
  return /^(local|github|onedrive)$/.test(s) ? s : "local";
})();
var REMOTE = STORAGE !== "local";
var LOCAL_KEY = "galil-hr-v1", CACHE_KEY = "galil-hr-cache";
var APP = "galil-hr", APP_VERSION = 1;
var COLLECTIONS = ["news", "comments", "reactions", "events", "rsvps", "surveys", "responses", "taken", "cycles", "reviews", "kudos"];

/* ---------- words ---------- */
var LANG = GalilPortal.applyLang();
/* tr("English text {x}", { x: … }) — the Hebrew from he.js when the portal is in Hebrew */
function tr(s, vars) {
  var out = LANG === "he" && window.HR_HE && HR_HE[s] ? HR_HE[s] : s;
  if (vars) Object.keys(vars).forEach(function (k) { out = out.split("{" + k + "}").join(vars[k]); });
  return out;
}
/* content written in both languages ({ en, he }) or in one (a string) */
function L(v) { return v && typeof v === "object" ? (LANG === "he" && v.he ? v.he : v.en || v.he || "") : (v || ""); }

/* ---------- small helpers ---------- */
function uid(p) { return (p || "x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function nowISO() { return new Date().toISOString(); }
function pad(n) { return (n < 10 ? "0" : "") + n; }
function d2s(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function s2d(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function today() { return d2s(new Date()); }
function addDays(s, n) { var d = s2d(s) || new Date(); d.setDate(d.getDate() + n); return d2s(d); }
function daysBetween(a, b) { return Math.round((s2d(b) - s2d(a)) / 864e5); }
var MONTHS = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  he: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"] };
var WEEKDAYS = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], he: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] };
function monthName(m) { return MONTHS[LANG][m]; }
/* 22 October 2026 · 22 באוקטובר 2026 */
function longDate(s) { var d = s2d(s); if (!d) return ""; return LANG === "he" ? d.getDate() + " ב" + monthName(d.getMonth()) + " " + d.getFullYear() : d.getDate() + " " + monthName(d.getMonth()) + " " + d.getFullYear(); }
function shortDate(s) { var d = s2d(s); if (!d) return ""; return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
function weekday(s) { var d = s2d(s); return d ? WEEKDAYS[LANG][d.getDay()] : ""; }
function ago(iso) {
  var t = new Date(iso).getTime(); if (!t) return "";
  var m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return tr("just now");
  if (m < 60) return tr("{n} min ago", { n: m });
  if (m < 60 * 24) return tr("{n} h ago", { n: Math.round(m / 60) });
  var d = Math.round(m / 1440);
  return d < 14 ? tr("{n} days ago", { n: d }) : shortDate(iso.slice(0, 10));
}
function inDays(n) { return n === 0 ? tr("Today") : n === 1 ? tr("Tomorrow") : n < 0 ? tr("{n} days ago", { n: -n }) : tr("In {n} days", { n: n }); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function byId(list, id) { for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }
function live(list) { return (list || []).filter(function (r) { return !r.deleted; }); }
function initials(n) { return String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase(); }
function download(name, text, type) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function csvCell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

/* ---------- DOM ---------- */
/* h("div", { class: "x", onclick: fn }, child, [children], "text") */
function h(tag, attrs) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    if (k === "class") e.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "html") e.innerHTML = v;
    else if (k === "value") e.value = v;
    else if (k === "checked" || k === "selected" || k === "disabled" || k === "hidden" || k === "required" || k === "multiple") e[k] = !!v;
    else e.setAttribute(k, v === true ? "" : v);
  });
  (function add(c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(add); return; }
    e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  })(Array.prototype.slice.call(arguments, 2));
  return e;
}
var ICONS = {
  home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7.5 9h6M7.5 12.5h6M7.5 16h4"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  survey: '<rect x="5" y="3.5" width="14" height="18" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11.5l1.5 1.5 2.5-2.5M8.5 16.5l1.5 1.5 2.5-2.5M14.5 12h1.5M14.5 17h1.5"/>',
  review: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
  people: '<circle cx="9" cy="8" r="3.3"/><path d="M3 20c.5-3.6 2.9-5.5 6-5.5s5.5 1.9 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.2 1.9 4.5 4.6"/>',
  kudos: '<path d="M12 20.5l-1.3-1.2C5.9 15 3 12.3 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3.3-2.9 6-7.7 10.3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="M15 5l4 4"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  pin: '<path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3z"/>',
  heart: '<path d="M12 20.5l-1.3-1.2C5.9 15 3 12.3 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3.3-2.9 6-7.7 10.3z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
  pinmap: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cake: '<path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16c2 1.3 4 1.3 6 0s4-1.3 6 0 3 1.3 4 0M12 12V8M12 5.5a1.2 1.2 0 0 1-1.2-1.2C10.8 3.4 12 2 12 2s1.2 1.4 1.2 2.3A1.2 1.2 0 0 1 12 5.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  chevl: '<path d="M15 18l-6-6 6-6"/>', chevr: '<path d="M9 18l6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
};
function icon(k, size) {
  var s = document.createElement("span");
  s.className = "ic"; s.setAttribute("aria-hidden", "true");
  s.innerHTML = '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[k] || "") + "</svg>";
  return s;
}

/* ---------- people: WorkDesk's records, read through the portal ---------- */
function people() {
  var d = GalilPortal.workdesk();
  return (d ? d.users : []).filter(function (u) { return u.isActive && !u.pendingActivation; });
}
function person(id) { var d = GalilPortal.workdesk(); return d ? byId(d.users, id) : null; }
function nameOf(u) { if (typeof u === "string") u = person(u); return u ? (LANG === "he" && u.fullNameHe ? u.fullNameHe : u.fullName) : tr("Someone"); }
function firstName(u) { return nameOf(u).split(/\s+/)[0]; }
function avatar(u, size) {
  if (typeof u === "string") u = person(u);
  var el = h("span", { class: "av", style: { width: (size || 32) + "px", height: (size || 32) + "px", fontSize: Math.round((size || 32) * 0.38) + "px" }, "aria-hidden": "true" });
  if (u && u.photoUrl) { el.style.backgroundImage = "url(" + u.photoUrl + ")"; } else el.textContent = initials(u ? u.fullName : "?");
  return el;
}
function teams() { var d = GalilPortal.workdesk(); return d && d.teams ? d.teams : []; }
/* the people who report to someone, directly */
function reportsOf(id) { return people().filter(function (u) { return u.managerId === id; }); }

/* ---------- who may do what ---------- */
var ME = null;
function me() { return ME; }
function hrRole() { return GalilPortal.access(ME).hr; }
function isAdmin() { return hrRole() === "Admin"; }
function isManagerOf(empId) { var u = person(empId); return !!u && !!ME && u.managerId === ME.id; }

/* ---------- the data ---------- */
var db = null;
function emptyData() { var d = { app: APP, version: APP_VERSION }; COLLECTIONS.forEach(function (k) { d[k] = []; }); return d; }
function normalize(o) {
  var d = emptyData();
  if (o && typeof o === "object") COLLECTIONS.forEach(function (k) { if (Array.isArray(o[k])) d[k] = o[k]; });
  if (o && o.seededAt) d.seededAt = o.seededAt;
  return d;
}
function isHrData(o) { return !!o && typeof o === "object" && o.app === APP; }
/* both copies, record by record: the newer updatedAt wins */
function mergeData(a, b) {
  var out = emptyData();
  COLLECTIONS.forEach(function (k) {
    var map = {}, order = [];
    [a[k] || [], b[k] || []].forEach(function (list) {
      list.forEach(function (r) {
        if (!r || !r.id) return;
        var cur = map[r.id];
        if (!cur) { map[r.id] = r; order.push(r.id); }
        else if ((r.updatedAt || "") > (cur.updatedAt || "")) map[r.id] = r;
      });
    });
    out[k] = order.map(function (id) { return map[id]; });
  });
  out.seededAt = a.seededAt || b.seededAt;
  return out;
}
/* every change goes through here: stamp it, keep it, send it */
function put(coll, rec) {
  rec.updatedAt = nowISO();
  var list = db[coll], i = -1;
  for (var j = 0; j < list.length; j++) if (list[j].id === rec.id) { i = j; break; }
  if (i >= 0) list[i] = rec; else list.push(rec);
  Store.changed();
  return rec;
}
function remove(coll, id) { put(coll, { id: id, deleted: true }); }

/* ---------- reading the data ---------- */
function newsList() {
  return live(db.news).filter(function (n) { return isAdmin() || !n.publishAt || n.publishAt <= today(); })
    .sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.publishedAt || "").localeCompare(a.publishedAt || ""); });
}
function reactionsOf(newsId) { return live(db.reactions).filter(function (r) { return r.newsId === newsId; }); }
function commentsOf(newsId) { return live(db.comments).filter(function (c) { return c.newsId === newsId; }).sort(function (a, b) { return a.at.localeCompare(b.at); }); }
function eventsList() { return live(db.events).sort(function (a, b) { return (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")); }); }
function upcomingEvents() { var t = today(); return eventsList().filter(function (e) { return (e.endDate || e.date) >= t; }); }
function rsvpsOf(eventId) { return live(db.rsvps).filter(function (r) { return r.eventId === eventId; }); }
function myRsvp(eventId) { return byId(db.rsvps, eventId + ":" + ME.id); }
function going(eventId) { return rsvpsOf(eventId).filter(function (r) { return r.status === "going"; }); }

function surveyState(s) { return s.status === "open" && s.closes && s.closes < today() ? "closed" : s.status; }
function surveysList() {
  return live(db.surveys).filter(function (s) { return isAdmin() || surveyState(s) !== "draft"; })
    .sort(function (a, b) { var o = { open: 0, draft: 1, closed: 2 }; return o[surveyState(a)] - o[surveyState(b)] || (b.createdAt || "").localeCompare(a.createdAt || ""); });
}
function hasTaken(surveyId, userId) { return !!byId(db.taken, surveyId + ":" + (userId || ME.id)); }
function responsesOf(surveyId) { return live(db.responses).filter(function (r) { return r.surveyId === surveyId; }); }
function takenCount(surveyId) { return live(db.taken).filter(function (t) { return t.surveyId === surveyId; }).length; }
function canSeeResults(s) { return isAdmin() || (s.showResults && (hasTaken(s.id) || surveyState(s) === "closed")); }
function surveysWaiting() { return surveysList().filter(function (s) { return surveyState(s) === "open" && !hasTaken(s.id); }); }

var REVIEW_STEPS = ["self", "manager", "shared", "done"];
function cyclesList() { return live(db.cycles).sort(function (a, b) { return (b.from || "").localeCompare(a.from || ""); }); }
function reviewsOf(cycleId) { return live(db.reviews).filter(function (r) { return r.cycleId === cycleId; }); }
/* the reviews this person may open: their own, their direct reports', and — for HR admins — everyone's */
function visibleReviews() {
  return live(db.reviews).filter(function (r) { return isAdmin() || r.employeeId === ME.id || r.managerId === ME.id; });
}
function reviewTodo() {
  return live(db.reviews).filter(function (r) {
    var c = byId(db.cycles, r.cycleId); if (!c || c.deleted || c.status === "closed") return false;
    return (r.employeeId === ME.id && (r.status === "self" || r.status === "shared")) || (r.managerId === ME.id && r.status === "manager");
  });
}
function kudosList() { return live(db.kudos).sort(function (a, b) { return b.at.localeCompare(a.at); }); }

/* ---------- birthdays and work anniversaries (from WorkDesk) ---------- */
function nextOccurrence(ymd) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || ""); if (!m) return null;
  var mo = +m[2] - 1, da = +m[3], t = new Date(); t.setHours(0, 0, 0, 0);
  var on = function (y) { var d = new Date(y, mo, da); if (d.getMonth() !== mo) d = new Date(y, mo + 1, 0); return d; };
  var next = on(t.getFullYear()); if (next < t) next = on(t.getFullYear() + 1);
  return { date: d2s(next), days: Math.round((next - t) / 864e5), years: next.getFullYear() - +m[1] };
}
function celebrations(days) {
  var out = [];
  people().forEach(function (u) {
    var b = !u.hideBirthday && nextOccurrence(u.dob);
    if (b && b.days <= days) out.push({ kind: "birthday", u: u, days: b.days, date: b.date });
    var a = u.employmentType !== "contractor" && nextOccurrence(u.startDate);
    if (a && a.days <= days && a.years > 0) out.push({ kind: "anniversary", u: u, days: a.days, date: a.date, years: a.years });
  });
  return out.sort(function (x, y) { return x.days - y.days || nameOf(x.u).localeCompare(nameOf(y.u)); });
}
