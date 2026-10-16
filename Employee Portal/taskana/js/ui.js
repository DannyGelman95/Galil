/* =====================================================================
   Taskana — UI framework: DOM builder, icons, routing, shell, filters,
   accessible dialogs, tooltips, toasts and pointer drag-and-drop.
   ===================================================================== */
"use strict";

/* tiny DOM builder: h(tag, props, ...children) — text is always set as text, never HTML */
function h(tag, props) {
  var el = document.createElement(tag);
  if (props) for (var k in props) {
    var v = props[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "value") el.value = v;
    else if (k === "checked" || k === "selected" || k === "disabled" || k === "hidden") el[k] = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
  el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
}

/* ================= icons (24px stroke set) ================= */
var ICONS = {
  home: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  me: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  board: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  folder: "M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z",
  people: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20a7 7 0 0114 0M16 4a3.5 3.5 0 010 7M18 14a6 6 0 014 6",
  bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
  question: "M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 4M12 17h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  comment: "M4 5h16v11H9l-5 4z",
  check: "M5 12l5 5 9-10",
  checklist: "M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 13A9 9 0 1111 3a7 7 0 0010 10z",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  clip: "M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.3 3.3 0 014.7 4.7l-8.6 8.6a1.7 1.7 0 01-2.4-2.4L15 7.5",
  sub: "M6 4v10a3 3 0 003 3h9M14 13l4 4-4 4",
  repeat: "M17 2l3 3-3 3M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 01-4 4H4",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  move: "M5 12h14M13 6l6 6-6 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  block: "M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8",
  ext: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  copy: "M8 8h12v12H8zM4 16V4h12",
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3",
  download: "M12 4v12M7 11l5 5 5-5M5 20h14",
  upload: "M12 20V8M7 13l5-5 5 5M5 4h14",
  logout: "M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11",
  cloud: "M7 18a5 5 0 01-.5-10A6 6 0 0118 9a4.5 4.5 0 01-1 9z"
};
function icon(name, label) {
  var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ico");
  if (label) { s.setAttribute("role", "img"); s.setAttribute("aria-label", label); } else s.setAttribute("aria-hidden", "true");
  var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", ICONS[name] || ""); s.appendChild(p);
  return s;
}
/* the GALIL mark: a "G" between square brackets */
function logo(size) {
  var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 240 240"); s.setAttribute("width", size); s.setAttribute("height", size); s.setAttribute("aria-hidden", "true");
  [["M78 34H42a10 10 0 00-10 10v152a10 10 0 0010 10h36M162 34h36a10 10 0 0110 10v152a10 10 0 01-10 10h-36", "var(--brand)", 18],
   ["M148 92A44 44 0 10152 148V122H122", "var(--leaf)", 20]].forEach(function (d) {
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", d[0]); p.setAttribute("fill", "none"); p.setAttribute("stroke", d[1]); p.setAttribute("stroke-width", d[2]);
    p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round"); s.appendChild(p);
  });
  return s;
}

/* ================= UI state ================= */
var EMPTY_FILTERS = { q: "", clientId: "", projectId: "", assigneeId: "", type: "", priority: "", status: "", overdue: "", questions: "" };
var ui = {
  route: [], bg: ["board"], sideOpen: false, filtersOpen: false,
  filters: Object.assign({}, EMPTY_FILTERS), viewFilters: null,
  sort: { k: "updatedAt", dir: -1 },
  insights: { period: "90", clientId: "", projectId: "" },
  openTask: null, taskTab: "comments", composerKind: "comment",
  editingDesc: false, descDraft: null, editingCommentId: null, commentDraft: null,
  drafts: {}, mentionPicks: {}, selected: {},
  modal: null, modalStack: [], returnFocus: null
};

/* ================= routing =================
   #/board, #/tasks, #/view/<id>, #/task/<KEY>, … A task opens over the page it was opened from
   (ui.bg), so the browser's Back button simply closes it. */
function go(path) { location.hash = "#/" + path; }
function parseRoute() { ui.route = (location.hash.replace(/^#\/?/, "") || "home").split("/").map(function (s) { try { return decodeURIComponent(s); } catch (e) { return s; } }); }
function onRouteChange(prev) {
  var r = ui.route;
  /* leaving a saved view drops the filters it applied, unless the person changed them */
  if (prev && prev[0] === "view" && r[0] !== "view" && r[0] !== "task" && ui.viewFilters) {
    if (JSON.stringify(currentFilters()) === JSON.stringify(ui.viewFilters)) clearFilters();
    ui.viewFilters = null;
  }
  if (r[0] === "view") { var v = byId(db.views, r[1]); if (v && !(prev && prev[0] === "task" && ui.bg[0] === "view" && ui.bg[1] === v.id)) applyView(v); }
  if (r[0] === "task") {
    var t = taskByKey(r[1]);
    if (!t || !canSee(t)) { ui.openTask = null; if (prev && prev[0] !== "task") ui.bg = prev; return; }
    if (ui.openTask !== t.id) { ui.openTask = t.id; ui.taskTab = "comments"; ui.editingDesc = false; ui.editingCommentId = null; }
    if (prev && prev[0] !== "task") ui.bg = prev;
  } else {
    ui.openTask = null; ui.editingDesc = false; ui.editingCommentId = null;
    ui.bg = r;
  }
  ui.sideOpen = false;
}
var lastRoute = null;
window.addEventListener("hashchange", function () {
  var prev = lastRoute; parseRoute(); lastRoute = ui.route.slice();
  if (ui.modal) { ui.modal = null; ui.modalStack = []; }
  onRouteChange(prev); render();
});
function setHash(hs) { try { history.replaceState(null, "", hs); } catch (e) {} }

/* ================= rendering ================= */
var root;
function render() {
  hideTip();
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";
  if (db.settings.theme) document.documentElement.setAttribute("data-theme", db.settings.theme);
  else document.documentElement.removeAttribute("data-theme");
  /* not signed in, waiting for activation, or the shared data still opening: a screen of its own */
  var gate = authGate();
  if (gate) {
    var gf = document.activeElement && document.activeElement.id;
    root.replaceChildren(gate);
    if (gf && document.getElementById(gf)) document.getElementById(gf).focus({ preventScroll: true });
    if (ui.openTask) ui.openTask = null;
    renderOverlay(); return;
  }
  /* keep keyboard focus (and caret) on the same control across a redraw */
  var ae = document.activeElement, fid = ae && ae.id && !(overlay && overlay.contains(ae)) ? ae.id : null, sel = null;
  if (!fid && ae === document.body && !overlay && lastTab && Date.now() - lastTab.at < 400 && lastTab.id) fid = lastTab.id;
  try { if (fid && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) {}
  var scroll = root.querySelector(".content"), st = scroll ? scroll.scrollTop : 0;
  var r = ui.route[0] === "task" ? ui.bg : ui.route;
  var page = pageFor(r);
  if (ui.route[0] === "task" && !ui.openTask) page = notFound(tr("Task not found"), tr("There is no task {k}. It may have been deleted or its key changed.", { k: ui.route[1] || "" }));
  root.replaceChildren.apply(root, sidebar().concat([h("main", { class: "main", id: "main" },
    h("header", { class: "top" },
      h("button", { class: "btn ghost menu-btn", onclick: function () { ui.sideOpen = !ui.sideOpen; render(); }, "aria-label": tr("Menu"), "aria-expanded": ui.sideOpen ? "true" : "false" }, icon("menu")),
      h("div", { style: { minWidth: 0 } }, page.crumbs ? h("div", { class: "crumbs" }, page.crumbs) : null, h("h1", null, page.title)),
      h("div", { class: "sp" }), page.actions || null),
    h("div", { class: "content" }, page.body))]));
  var c = root.querySelector(".content"); if (c && page.keepScroll) c.scrollTop = st;
  if (fid) { var n = document.getElementById(fid); if (n) { n.focus({ preventScroll: true }); try { if (sel) n.setSelectionRange(sel[0], sel[1]); } catch (e) {} } finishTab(function () { return null; }); }
  renderOverlay();
}
function notFound(title, text) {
  return { title: title, body: h("div", { class: "card empty" }, h("p", null, text), h("button", { class: "btn", onclick: function () { go("board"); } }, tr("Go to the board"))) };
}

function sidebar() {
  var r = ui.route[0] === "task" ? ui.bg[0] : ui.route[0], u = me();
  var mine = db.tasks.filter(function (t) { return t.assigneeId === u.id && t.status !== "Done"; }).length;
  var unread = unreadCount(), all = can.seeEverything();
  var waiting = can.managePeople() ? db.users.filter(function (x) { return x.pendingActivation && !x.declined; }).length : 0;
  var item = function (k, ic, label, count, countLabel) {
    return h("button", { class: r === k ? "on" : "", "aria-current": r === k ? "page" : null, onclick: function () { go(k); } },
      icon(ic), h("span", { class: "lbl" }, label), count ? h("span", { class: "count", "aria-label": countLabel }, count) : null);
  };
  var views = visibleViews();
  return [h("aside", { class: "side" + (ui.sideOpen ? " open" : ""), "aria-label": tr("Main menu") },
    h("div", { class: "brand" }, logo(34), h("div", null, h("b", null, "Taskana"), h("small", null, tr("by GALIL")))),
    h("nav", { class: "nav", "aria-label": tr("Pages") },
      item("home", "home", tr("Overview")),
      item("inbox", "bell", tr("Inbox"), unread, trn(unread, "{n} unread", "{n} unread")),
      item("my", "me", tr("My work"), mine, trn(mine, "{n} open task", "{n} open tasks")),
      item("board", "board", tr("Board")),
      item("tasks", "list", tr("All tasks")),
      all ? item("insights", "chart", tr("Insights")) : null,
      all ? item("clients", "folder", tr("Clients & projects")) : null,
      all ? item("people", "people", tr("People"), waiting, trn(waiting, "{n} waiting for activation", "{n} waiting for activation")) : null),
    h("div", { class: "nav-h", id: "views-h" }, tr("Saved views"), h("span", { class: "small" }, views.length || "")),
    h("nav", { class: "nav", "aria-labelledby": "views-h" }, views.length ? views.map(function (v) {
      var on = (ui.route[0] === "view" || (ui.route[0] === "task" && ui.bg[0] === "view")) && (ui.route[1] === v.id || ui.bg[1] === v.id);
      return h("button", { class: "vw" + (on ? " on" : ""), title: v.name + " · " + (v.shared ? tr("shared with everyone") : tr("only you")), onclick: function () { go("view/" + v.id); } },
        h("span", { class: "star" + (v.ownerId === u.id ? " mine" : "") }, icon("star")), h("span", { class: "lbl" }, v.name),
        h("span", { class: "who" }, icon(v.mode === "board" ? "board" : "list", v.mode === "board" ? tr("Board") : tr("List"))));
    }) : h("div", { class: "small hint" }, tr("Filter the board or task list, then choose Save view."))),
    h("div", { class: "grow" }),
    h("div", { class: "me" },
      h("div", { class: "who-am-i" }, avatar(u.id),
        h("div", { class: "grow" }, h("b", { class: "ellipsis" }, u.fullName), h("span", { class: "ellipsis" }, tr(u.role || "Member") + (u.employment === "Outsourced" ? " · " + tr("Outsourced") : ""))),
        h("button", { id: "sign-out", class: "out", title: tr("Sign out"), "aria-label": tr("Sign out"), onclick: signOut }, icon("logout"))),
      syncStatus(),
      h("div", { class: "row" },
        h("button", { onclick: function () { db.settings.theme = isDark() ? "light" : "dark"; save(); render(); } }, icon(isDark() ? "sun" : "moon"), isDark() ? tr("Light") : tr("Dark")),
        h("button", { lang: LANG === "he" ? "en" : "he", onclick: function () { setLang(LANG === "he" ? "en" : "he"); } }, icon("globe"), LANG === "he" ? "English" : "עברית"),
        h("button", { onclick: function () { openModal({ kind: "data" }); } }, icon("data"), tr("Data"))))),
    h("div", { class: "scrim-side", onclick: function () { ui.sideOpen = false; render(); } })];
}
function isDark() { return db.settings.theme ? db.settings.theme === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
function setLang(l) { LANG = l; db.settings.lang = l; save(); render(); }
if (window.matchMedia) try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (!db.settings.theme) render(); }); } catch (e) {}

/* ---------- shared bits ---------- */
function avatar(userId, big) {
  var u = userId && byId(db.users, userId);
  if (!u) return h("span", { class: "avatar none" + (big ? " lg" : ""), title: tr("Unassigned"), role: "img", "aria-label": tr("Unassigned") }, "?");
  return h("span", { class: "avatar" + (big ? " lg" : ""), style: { background: colorFor(u.id) }, title: u.fullName, role: "img", "aria-label": u.fullName }, initials(u.fullName));
}
function statusChip(s) { return h("span", { class: "chip " + statusOf(s).chip }, h("i", { class: "dot", style: { background: statusOf(s).color } }), tr(s)); }
function typeChip(ty) { return h("span", { class: "chip " + (TYPE_CHIP[ty] || "") }, tr(ty)); }
function prio(p) { var o = prioOf(p); return h("span", { class: "prio" }, h("i", { style: { background: o.color } }), tr(p)); }
function due(t) { return t.dueDate ? h("span", { class: isOverdue(t) ? "overdue" : "" }, isOverdue(t) ? icon("alert", tr("Overdue")) : null, " " + fmtDate(t.dueDate)) : h("span", { class: "muted" }, tr("No due date")); }
function newTaskBtn(defaults) {
  if (!can.createTask()) return null;
  return h("button", { class: "btn primary", onclick: function () { openModal({ kind: "task", defaults: defaults || {} }); } }, icon("plus"), tr("New task"));
}
/* clickable, keyboard-reachable block (card, row, list item) */
function clickable(props, fn) {
  var own = props.onkeydown;
  return Object.assign(props, { tabindex: "0", role: props.role || "button", onclick: fn,
    onkeydown: own || function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); fn(e); } } });
}

/* ================= filters ================= */
function clearFilters() { Object.keys(EMPTY_FILTERS).forEach(function (k) { ui.filters[k] = ""; }); }
function currentFilters() { var o = {}; Object.keys(ui.filters).forEach(function (k) { if (ui.filters[k]) o[k] = ui.filters[k]; }); return o; }
function activeFilterCount() { return Object.keys(currentFilters()).length; }
function filteredTasks(extra) {
  var f = ui.filters, q = f.q.trim().toLowerCase(), meId = me().id;
  return visibleTasks().filter(function (t) {
    var p = projectOf(t);
    if (!p) return false;
    if (extra && !extra(t)) return false;
    if (f.clientId && p.clientId !== f.clientId) return false;
    if (f.projectId && t.projectId !== f.projectId) return false;
    var who = f.assigneeId === "me" ? meId : f.assigneeId;
    if (who === "none" ? t.assigneeId : (who && t.assigneeId !== who)) return false;
    if (f.type && t.type !== f.type) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.overdue && !isOverdue(t)) return false;
    if (f.questions && !openQuestions(t.id).length) return false;
    if (q && (taskKey(t) + " " + (t.aliases || []).join(" ") + " " + t.title + " " + t.description + " " + (t.deliverable || "") + " " + (t.labels || []).join(" ")).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function filterBar(opts) {
  opts = opts || {};
  var f = ui.filters, n = activeFilterCount();
  var set = function (k) { return function (e) { f[k] = e.target.value; if (k === "clientId") f.projectId = ""; render(); }; };
  var sel = function (k, label, options) {
    return h("select", { id: "f-" + k, onchange: set(k), "aria-label": label }, h("option", { value: "" }, label), options.map(function (o) { return h("option", { value: o.value, selected: f[k] === o.value }, o.label); }));
  };
  var projects = db.projects.filter(function (p) { return !f.clientId || p.clientId === f.clientId; });
  var search = h("input", { id: "f-q", type: "search", placeholder: tr("Search tasks…"), "aria-label": tr("Search tasks"), value: f.q, oninput: function (e) { f.q = e.target.value; render(); } });
  var tog = function (k, ic, label) {
    return h("button", { id: "f-" + k, class: "tog" + (f[k] ? " on" : ""), "aria-pressed": f[k] ? "true" : "false", onclick: function () { f[k] = f[k] ? "" : "1"; render(); } }, icon(ic), label);
  };
  return h("div", { class: "filters-wrap" + (ui.filtersOpen ? " open" : "") },
    h("div", { class: "filters-top" }, search,
      h("button", { class: "btn sm filters-btn", "aria-expanded": ui.filtersOpen ? "true" : "false", onclick: function () { ui.filtersOpen = !ui.filtersOpen; render(); } }, icon("filter"), n ? tr("Filters ({n})", { n: n }) : tr("Filters"))),
    h("div", { class: "filters", role: "group", "aria-label": tr("Filters") },
      opts.noClient || !can.seeEverything() ? null : sel("clientId", tr("All clients"), db.clients.map(function (c) { return { value: c.id, label: c.name }; })),
      opts.noProject ? null : sel("projectId", tr("All projects"), projects.map(function (p) { return { value: p.id, label: p.key + " · " + p.name }; })),
      sel("assigneeId", tr("Anyone"), [{ value: "me", label: tr("Me (whoever is working)") }, { value: "none", label: tr("Unassigned") }].concat(db.users.map(function (u) { return { value: u.id, label: u.fullName + (u.isActive ? "" : " (" + tr("inactive") + ")") }; }))),
      sel("type", tr("All types"), TYPES.map(function (ty) { return { value: ty, label: tr(ty) }; })),
      sel("priority", tr("Any priority"), PRIORITIES.map(function (p) { return { value: p.k, label: tr(p.k) }; })),
      opts.status ? sel("status", tr("Any status"), STATUSES.map(function (s) { return { value: s.k, label: tr(s.k) }; })) : null,
      tog("overdue", "alert", tr("Overdue")),
      tog("questions", "question", tr("Open questions")),
      n ? h("button", { class: "btn ghost sm", onclick: function () { clearFilters(); render(); } }, icon("x"), tr("Clear")) : null,
      h("span", { class: "sp" }),
      opts.mode ? h("button", { class: "btn sm", disabled: !n, title: n ? tr("Save these filters as a view") : tr("Set some filters first"), onclick: function () { openModal({ kind: "view", defaults: { mode: opts.mode } }); } }, icon("star"), tr("Save view")) : null),
    n && !opts.view ? h("div", { class: "filtered-note", role: "status" }, icon("filter"), trn(n, "{n} filter is on — some tasks are hidden.", "{n} filters are on — some tasks are hidden."), h("button", { class: "linklike", onclick: function () { clearFilters(); render(); } }, tr("Show everything"))) : null);
}

/* ================= overlays (dialogs) ================= */
var overlay = null;
function renderOverlay() {
  var key = ui.modal ? "m:" + ui.modal.kind : ui.openTask;
  var keep = overlay && overlay.dataset.for === key ? overlay.scrollTop : 0;
  var hadFocus = overlay && overlay.contains(document.activeElement) ? document.activeElement.id : null;
  if (!hadFocus && overlay && document.activeElement === document.body && lastTab && Date.now() - lastTab.at < 400 && lastTab.id && overlay.querySelector("#" + CSS.escape(lastTab.id))) hadFocus = lastTab.id;
  if (overlay) { overlay.remove(); overlay = null; }
  var content = null;
  if (ui.modal) content = modalView(ui.modal);
  else if (ui.openTask) { var t = byId(db.tasks, ui.openTask); if (t) content = taskView(t); else ui.openTask = null; }
  if (!content) { document.getElementById("main") && document.getElementById("main").removeAttribute("aria-hidden"); restoreFocus(); return; }
  if (!ui.returnFocus) ui.returnFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
  content.setAttribute("role", content.getAttribute("role") || "dialog");
  content.setAttribute("aria-modal", "true");
  var hd = content.querySelector("h2"); if (hd) { hd.id = hd.id || "dlg-title"; content.setAttribute("aria-labelledby", hd.id); }
  overlay = h("div", { class: "scrim", onmousedown: function (e) { if (e.target === overlay) dismissTop(); } }, content);
  overlay.dataset.for = key;
  overlay.addEventListener("keydown", trapFocus);
  document.body.appendChild(overlay);
  var main = document.getElementById("main"); if (main) main.setAttribute("aria-hidden", "true");
  overlay.scrollTop = keep;
  var target = (hadFocus && document.getElementById(hadFocus)) || overlay.querySelector("[data-autofocus]") || content.querySelector("button, [href], input, select, textarea");
  if (target) { target.focus({ preventScroll: !!hadFocus }); if (hadFocus && target.setSelectionRange && pendingSel) try { target.setSelectionRange(pendingSel[0], pendingSel[1]); } catch (e) {} }
  pendingSel = null;
  if (hadFocus) finishTab(function () { return overlay; });
}
var pendingSel = null;
/* A change event fired by Tab redraws the screen before the browser moves focus, which would drop
   focus to the page. Remember the Tab and finish the move on the redrawn controls. */
var lastTab = null;
document.addEventListener("keydown", function (e) { if (e.key === "Tab") lastTab = { id: document.activeElement && document.activeElement.id, back: e.shiftKey, at: Date.now() }; }, true);
function finishTab(scope) {
  var lt = lastTab;
  if (!lt || !lt.id || Date.now() - lt.at > 400) return;
  setTimeout(function () {
    var a = document.activeElement;
    if (a && a !== document.body && a.id !== lt.id) return;      // the browser managed it
    var from = document.getElementById(lt.id); if (!from) return;
    var box = scope() || document;
    var els = [].slice.call(box.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, [tabindex='0']")).filter(function (x) { return x.offsetParent !== null; });
    var i = els.indexOf(from), next = els[i + (lt.back ? -1 : 1)];
    if (next) next.focus();
  }, 0);
}
function restoreFocus() {
  var r = ui.returnFocus; ui.returnFocus = null;
  if (r && document.contains(r)) r.focus({ preventScroll: true });
}
function trapFocus(e) {
  if (e.key !== "Tab") return;
  var els = [].slice.call(overlay.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, [tabindex='0']")).filter(function (x) { return x.offsetParent !== null; });
  if (!els.length) return;
  var first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function openModal(m) { if (ui.modal) ui.modalStack.push(ui.modal); ui.modal = m; renderOverlay(); }
function closeModal() { ui.modal = ui.modalStack.pop() || null; renderOverlay(); }
function confirmBox(title, text, okLabel, onOk, danger) { openModal({ kind: "confirm", title: title, text: text, okLabel: okLabel, onOk: onOk, danger: danger !== false }); }
/* Esc / clicking outside: the innermost thing closes first, and unsaved text is never dropped silently */
function dismissTop() {
  if (ui.modal) { closeModal(); return; }
  if (!ui.openTask) return;
  var t = byId(db.tasks, ui.openTask);
  if (ui.editingDesc) {
    if (ui.descDraft != null && ui.descDraft !== (t.description || "")) confirmBox(tr("Discard your changes to the description?"), "", tr("Discard"), function () { ui.editingDesc = false; ui.descDraft = null; renderOverlay(); });
    else { ui.editingDesc = false; ui.descDraft = null; renderOverlay(); }
    return;
  }
  if (ui.editingCommentId) {
    var c = byId(db.comments, ui.editingCommentId);
    if (c && ui.commentDraft != null && ui.commentDraft !== decodeMentions(c.body)) confirmBox(tr("Discard your changes to the comment?"), "", tr("Discard"), function () { ui.editingCommentId = null; ui.commentDraft = null; renderOverlay(); });
    else { ui.editingCommentId = null; ui.commentDraft = null; renderOverlay(); }
    return;
  }
  closeTask();
}

/* ================= tooltip / toast / clipboard / files ================= */
var tipEl = null;
function showTip(e, content) {
  if (!tipEl) { tipEl = h("div", { class: "tip", role: "tooltip" }); document.body.appendChild(tipEl); }
  tipEl.replaceChildren(content); tipEl.hidden = false;
  var x = e.clientX + 14, y = e.clientY + 14, r = tipEl.getBoundingClientRect();
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
  if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
  tipEl.style.left = Math.max(4, x) + "px"; tipEl.style.top = Math.max(4, y) + "px";
}
function hideTip() { if (tipEl) tipEl.hidden = true; }
var toastTimer;
function toast(msg, action) {
  var old = document.querySelector(".toast"); if (old) old.remove();
  var el = h("div", { class: "toast", role: "status" }, h("span", null, msg),
    action ? h("button", { class: "linklike", onclick: function () { el.remove(); action.fn(); } }, action.label) : null);
  document.body.appendChild(el);
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.remove(); }, action ? 6000 : 3000);
}
function copy(text, okMsg) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast(okMsg || tr("Copied")); }, function () { toast(text); });
  else toast(text);
}
var EMBEDDED = (function () { try { return window.top !== window.self; } catch (e) { return true; } })();
function saveFile(name, text, type, what) {
  if (EMBEDDED) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast(tr("{what} copied to the clipboard — paste it into a file.", { what: what })); }, function () { toast(tr("Couldn't copy here — open Taskana directly to download.")); });
    return;
  }
  var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: type })), download: name }); document.body.appendChild(a); a.click(); a.remove();
}

/* ================= pointer drag-and-drop =================
   Works with mouse, pen and touch. Touch needs a short press first so the board still scrolls. */
var drag = null;
function draggable(el, payload, onDrop) {
  el.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || e.target.closest("button, select, input, a")) return;
    var start = { x: e.clientX, y: e.clientY }, touch = e.pointerType === "touch", armed = !touch, timer = null;
    if (touch) timer = setTimeout(function () { armed = true; el.classList.add("armed"); if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) {} }, 300);
    function move(ev) {
      if (!drag) {
        var dist = Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y);
        if (!armed) { if (dist > 8) cleanup(); return; }
        if (dist < 6) return;
        var r = el.getBoundingClientRect();
        drag = { payload: payload, onDrop: onDrop, ghost: el.cloneNode(true), dx: start.x - r.left, dy: start.y - r.top, src: el };
        drag.ghost.className += " ghost"; drag.ghost.style.width = r.width + "px";
        document.body.appendChild(drag.ghost); el.classList.add("dragging");
        try { el.setPointerCapture(ev.pointerId); } catch (x) {}
      }
      ev.preventDefault();
      drag.ghost.style.left = (ev.clientX - drag.dx) + "px"; drag.ghost.style.top = (ev.clientY - drag.dy) + "px";
      var over = document.elementFromPoint(ev.clientX, ev.clientY), zone = over && over.closest("[data-drop]");
      document.querySelectorAll("[data-drop].drop").forEach(function (z) { if (z !== zone) z.classList.remove("drop"); });
      if (zone) zone.classList.add("drop");
      drag.zone = zone;
      /* auto-scroll the board near its edges */
      var sc = el.closest(".board");
      if (sc) { var br = sc.getBoundingClientRect(); if (ev.clientX > br.right - 40) sc.scrollLeft += 12; else if (ev.clientX < br.left + 40) sc.scrollLeft -= 12; }
    }
    function detach() {
      clearTimeout(timer); el.classList.remove("armed");
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
    }
    function cleanup() { detach(); }
    function up() {
      detach();
      var d = drag; drag = null;
      if (!d) return;
      d.src.classList.remove("dragging"); d.ghost.remove();
      document.querySelectorAll("[data-drop].drop").forEach(function (z) { z.classList.remove("drop"); });
      suppressClick = true; setTimeout(function () { suppressClick = false; }, 50);
      if (d.zone) d.onDrop(d.payload, d.zone.getAttribute("data-drop"));
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
  });
  /* stop the touch from scrolling once a press has armed the drag */
  el.addEventListener("touchmove", function (e) { if (el.classList.contains("armed") || drag) e.preventDefault(); }, { passive: false });
  el.addEventListener("click", function (e) { if (suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
var suppressClick = false;
