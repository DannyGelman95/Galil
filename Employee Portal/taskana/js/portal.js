/* =====================================================================
   Taskana inside the GALIL Employee Portal.

   · Signing in happens once, on the portal home; Taskana reads that
     session (shared/portal.js) and the person's Taskana role from their
     portal access.
   · People, clients, projects and work orders are set in WorkDesk.
     Taskana mirrors them into its own data (so every device sees the
     same names) and never edits them; it keeps only what is its own:
     a project's key, deliverable type and description, and the tasks.
   · Budgets, hours and allowances are WorkDesk's too. Taskana reads them
     straight from WorkDesk's data in this browser and shows them as
     indicators: the project / work-order budget, each person's hours
     bank on the project, and the hours logged against a task.
   ===================================================================== */
"use strict";

/* stable keys for the projects the demo data and the GALIL seed create */
var PORTAL_KEYS = { "p-iai1": "RSOM", "p-elb1": "AVH", "p-mob1": "SDK", "p-cmd1": "IFU", "p-gws1": "IRC", "p-hft1": "BOH", "p-int1": "ADM", "p-int2": "BIZ", "p-int3": "HR" };
var PORTAL_DOCTYPES = { "p-iai1": "Operator Manual", "p-elb1": "Online Help", "p-mob1": "API Reference", "p-cmd1": "User Manual", "p-gws1": "User Manual", "p-hft1": "Online Help" };

function wdData() { return window.GalilPortal ? GalilPortal.workdesk() : null; }
function portalUser() { return window.GalilPortal ? GalilPortal.sessionUser() : null; }
function portalAccess(u) { return GalilPortal.access(u || portalUser()); }

/* ---------- mirror WorkDesk's records into Taskana's data ---------- */
function projectStatusFromWorkdesk(s) {
  s = s || "";
  if (/^done$|closed|complete/i.test(s)) return "Completed";
  if (/hold|pause/i.test(s)) return "On Hold";
  if (/archiv/i.test(s)) return "Archived";
  return "Active";
}
function uniqueKey(d, base, selfId) {
  base = (base || "PRJ").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^[^A-Z]+/, "").slice(0, 5) || "PRJ";
  if (base.length < 2) base = (base + "PR").slice(0, 2);
  var taken = {}; d.projects.forEach(function (p) { if (p.id !== selfId && p.key) taken[p.key] = 1; });
  d.tasks.forEach(function (t) { (t.aliases || []).forEach(function (a) { taken[a.split("-")[0]] = 1; }); });
  var key = base, i = 2; while (taken[key]) key = base.slice(0, 4) + i++;
  return key;
}
/* someone known to Taskana under another id (an older roster) takes their WorkDesk id everywhere */
function remapIds(d, map) {
  var ids = Object.keys(map); if (!ids.length) return d;
  var text = JSON.stringify(Object.assign({}, d, { settings: undefined }));
  ids.forEach(function (from) {
    var to = map[from], esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp('"' + esc + '"', "g"), '"' + to + '"').replace(new RegExp("@\\[" + esc + "\\]", "g"), "@[" + to + "]");
  });
  var o = JSON.parse(text), keep = d.settings;
  Object.keys(o).forEach(function (k) { d[k] = o[k]; }); d.settings = keep;
  if (d.settings && map[d.settings.currentUserId]) d.settings.currentUserId = map[d.settings.currentUserId];
  return d;
}
/* Returns true when anything in d changed. */
function syncFromWorkdesk(d) {
  var wd = wdData(); if (!wd || !d) return false;
  var before = JSON.stringify([d.users, d.clients, d.projects, d.workOrders]);
  if (!d.workOrders) d.workOrders = [];

  /* 1 — same email, different id: adopt WorkDesk's id */
  var byEmail = {}; wd.users.forEach(function (w) { if (w.email) byEmail[w.email.toLowerCase()] = w; });
  var map = {};
  d.users.forEach(function (u) {
    var w = byEmail[(u.email || "").toLowerCase()];
    if (w && w.id !== u.id && !byId(d.users, w.id)) map[u.id] = w.id;
  });
  remapIds(d, map);

  /* 2 — people, with their Taskana role from portal access */
  var inWd = {};
  wd.users.forEach(function (w) {
    inWd[w.id] = 1;
    var a = GalilPortal.access(w), mine = byId(d.users, w.id);
    if (!mine) { mine = { id: w.id }; d.users.push(mine); }
    Object.assign(mine, {
      fullName: w.fullName, fullNameHe: w.fullNameHe || "", email: (w.email || "").toLowerCase(), jobTitle: w.jobTitle || "", department: w.department || "",
      managerId: w.managerId || null, employment: w.role === "EXT" || w.employmentType === "contractor" ? "Outsourced" : "Employee",
      role: a.taskana === "none" ? (mine.role || "Viewer") : a.taskana, isActive: a.taskana !== "none",
      pendingActivation: false, declined: false, fromWorkdesk: true, workdeskRole: w.role
    });
  });
  d.users.forEach(function (u) { if (!inWd[u.id]) { u.isActive = false; u.fromWorkdesk = false; } });

  /* 3 — clients */
  var cIn = {};
  wd.clients.forEach(function (c) {
    cIn[c.id] = 1;
    var mine = byId(d.clients, c.id);
    if (!mine) { mine = { id: c.id, industry: c.isInternal ? "Internal" : "", notes: "" }; d.clients.push(mine); }
    var code = (c.initials || c.name || "CL").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "CL";
    Object.assign(mine, { name: c.name, code: code, contactName: c.contactName || "", contactEmail: c.contactEmail || "", fromWorkdesk: true });
    if (mine.demo) delete mine.demo;
  });
  d.clients.forEach(function (c) { if (!cIn[c.id]) c.fromWorkdesk = false; });

  /* 4 — projects: WorkDesk's fields, Taskana's own key, deliverable type and description */
  var pIn = {};
  wd.projects.forEach(function (p) {
    if (!byId(d.clients, p.clientId)) return;
    pIn[p.id] = 1;
    var mine = byId(d.projects, p.id);
    if (!mine) { mine = { id: p.id, docType: PORTAL_DOCTYPES[p.id] || "Other", description: "", nextNum: 1 }; d.projects.push(mine); }
    if (!mine.key) mine.key = uniqueKey(d, PORTAL_KEYS[p.id] || p.name.split(/\s+/).map(function (w) { return w[0]; }).join(""), mine.id);
    if (mine.nextNum == null) mine.nextNum = 1;
    Object.assign(mine, { clientId: p.clientId, name: p.name, status: projectStatusFromWorkdesk(p.status), workdeskStatus: p.status || "",
      leadUserId: p.ownerUserId || null, startDate: p.startDate || null, dueDate: p.endDate || null, woTracked: !!p.isWoTracked, fromWorkdesk: true });
    if (mine.demo) delete mine.demo;
  });
  d.projects.forEach(function (p) { if (!pIn[p.id]) p.fromWorkdesk = false; });

  /* 5 — work orders (read-only here) */
  d.workOrders = (wd.workOrders || []).filter(function (w) { return pIn[w.projectId]; }).map(function (w) {
    return { id: w.id, projectId: w.projectId, code: w.code, title: w.title || "", status: w.status || "Active", startDate: w.startDate || null, endDate: w.endDate || null };
  });
  return JSON.stringify([d.users, d.clients, d.projects, d.workOrders]) !== before;
}
function workOrderOf(t) { return t && t.workOrderId ? byId(db.workOrders || [], t.workOrderId) : null; }
function workOrdersOf(projectId) { return (db.workOrders || []).filter(function (w) { return w.projectId === projectId; }); }

/* ---------- WorkDesk's figures (budgets, hours banks, hours on a task) ---------- */
function wdHours(e) { return (Number(e.yellow) || 0) + (Number(e.blue) || 0); }
function wdAllHours(e) { return (Number(e.red) || 0) + (Number(e.yellow) || 0) + (Number(e.blue) || 0); }
/* the budget a project's (or work order's) time draws on: the work order's own, else the project's */
function wdBudget(projectId, workOrderId) {
  var wd = wdData(); if (!wd || !projectId) return null;
  var b = (workOrderId && wd.budgets.filter(function (x) { return x.workOrderId === workOrderId; })[0]) ||
          wd.budgets.filter(function (x) { return x.projectId === projectId && !x.workOrderId; })[0] || null;
  if (!b || !b.hours) return null;
  var inScope = function (e) { return b.workOrderId ? e.workOrderId === b.workOrderId : b.projectId ? e.projectId === b.projectId : e.clientId === b.clientId; };
  var used = 0, pending = 0;
  wd.entries.forEach(function (e) { if (!inScope(e)) return; if (e.status === "registered" || e.status === "locked") used += wdHours(e); else if (e.status === "pending") pending += wdHours(e); });
  var wo = b.workOrderId ? (wd.workOrders || []).filter(function (w) { return w.id === b.workOrderId; })[0] : null;
  return { total: Number(b.hours), used: used, pending: pending, label: wo ? wo.code : null, basis: b.basis };
}
/* every budget on a project: the project's own and each work order's */
function wdBudgetsOfProject(projectId) {
  var wd = wdData(); if (!wd) return [];
  var out = [], pb = wdBudget(projectId, null);
  if (pb && wd.budgets.some(function (x) { return x.projectId === projectId && !x.workOrderId; })) out.push(Object.assign({ scope: "project" }, pb));
  (wd.workOrders || []).filter(function (w) { return w.projectId === projectId; }).forEach(function (w) {
    if (!wd.budgets.some(function (x) { return x.workOrderId === w.id; })) return;
    var b = wdBudget(projectId, w.id); if (b) out.push(Object.assign({ scope: "wo", woId: w.id }, b));
  });
  return out;
}
/* a person's hours bank (allowance) on a project or work order */
function wdAllowance(userId, projectId, workOrderId) {
  var wd = wdData(); if (!wd || !userId || !projectId) return null;
  var day = today(), live = function (a) { return (!a.from || a.from <= day) && (!a.until || a.until >= day); };
  var a = (workOrderId && wd.assignments.filter(function (x) { return x.userId === userId && x.projectId === projectId && x.workOrderId === workOrderId && live(x); })[0]) ||
          wd.assignments.filter(function (x) { return x.userId === userId && x.projectId === projectId && !x.workOrderId && live(x); })[0] ||
          (!workOrderId ? wd.assignments.filter(function (x) { return x.userId === userId && x.projectId === projectId && live(x); })[0] : null);
  if (!a) return { assigned: false };
  var used = 0, pending = 0;
  wd.entries.forEach(function (e) {
    if (e.assignee !== userId || e.projectId !== a.projectId) return;
    if (a.workOrderId && e.workOrderId !== a.workOrderId) return;
    if (e.status === "registered" || e.status === "locked") used += wdHours(e); else if (e.status === "pending") pending += wdHours(e);
  });
  var unlimited = a.allowanceHours === null || a.allowanceHours === undefined || a.allowanceHours === "";
  return { assigned: true, unlimited: unlimited, total: unlimited ? null : Number(a.allowanceHours), used: used, pending: pending, workOrderId: a.workOrderId || null };
}
/* hours people reported in WorkDesk against this task */
function wdTaskHours(taskId) {
  var wd = wdData(); if (!wd) return null;
  var total = 0, pending = 0, by = {};
  wd.entries.forEach(function (e) {
    if (e.taskId !== taskId) return;
    if (e.status === "registered" || e.status === "locked") { total += wdAllHours(e); by[e.assignee] = (by[e.assignee] || 0) + wdAllHours(e); }
    else if (e.status === "pending") pending += wdAllHours(e);
  });
  return { total: total, pending: pending, by: by };
}
/* who may see budgets in Taskana: Admins and Managers */
function canSeeBudgets() { return isManager(); }

/* ---------- drawing the indicators ---------- */
function numH(n) { return (Math.round((Number(n) || 0) * 10) / 10).toString(); }
function meterBar(used, pending, total) {
  var pct = total ? Math.min(100, used / total * 100) : 0, pp = total ? Math.min(100 - pct, (pending || 0) / total * 100) : 0;
  var col = pct >= 100 ? "var(--err)" : pct >= 90 ? "var(--amber)" : pct >= 75 ? "var(--yellow, #E3AC35)" : "var(--s-closed)";
  return h("div", { class: "trk meter", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(pct) },
    h("span", { class: "fill", style: { width: pct + "%", background: col } }),
    pp ? h("span", { class: "fill pend", style: { width: pp + "%" } }) : null);
}
function budgetLine(b, label) {
  var left = b.total - b.used, pct = b.total ? Math.round(b.used / b.total * 100) : 0;
  return h("div", { class: "wd-line" },
    h("div", { class: "row between small" }, h("b", null, label), h("span", { class: "mono" + (pct >= 90 ? " overdue" : "") }, tr("{u} of {t} h · {p}%", { u: numH(b.used), t: numH(b.total), p: pct }))),
    meterBar(b.used, b.pending, b.total),
    h("div", { class: "muted small" }, left >= 0 ? tr("{n} h left", { n: numH(left) }) : tr("{n} h over budget", { n: numH(-left) }),
      b.pending ? " · " + tr("{n} h waiting for approval", { n: numH(b.pending) }) : ""));
}
function allowanceLine(a, who) {
  if (!a) return null;
  if (!a.assigned) return h("div", { class: "wd-line" }, h("div", { class: "small" }, h("b", null, who), " · ", h("span", { class: "muted" }, tr("not assigned to this project in WorkDesk"))));
  if (a.unlimited) return h("div", { class: "wd-line" }, h("div", { class: "row between small" }, h("b", null, who), h("span", { class: "mono" }, tr("{u} h used · no limit", { u: numH(a.used) }))));
  var left = a.total - a.used;
  return h("div", { class: "wd-line" },
    h("div", { class: "row between small" }, h("b", null, who), h("span", { class: "mono" + (left < 0 ? " overdue" : "") }, tr("{u} of {t} h", { u: numH(a.used), t: numH(a.total) }))),
    meterBar(a.used, a.pending, a.total),
    h("div", { class: "muted small" }, left >= 0 ? tr("{n} h left in the hours bank", { n: numH(left) }) : tr("{n} h past the allowance", { n: numH(-left) }),
      a.pending ? " · " + tr("{n} h waiting for approval", { n: numH(a.pending) }) : ""));
}
/* "Managed in WorkDesk" note, with a link for people who can open WorkDesk */
function workdeskNote(text, tab) {
  var a = portalAccess();
  return h("div", { class: "note small wd-note" }, icon("ext"), " ", text, " ",
    a.workdesk ? h("a", { href: "../index.html#/workdesk/" + (tab || "management") }, tr("Open WorkDesk")) : null);
}

/* My work: the person's hours banks on every project they're assigned to in WorkDesk */
function myHoursBanks(u) {
  var wd = wdData(); if (!wd) return null;
  var seen = {}, rows = [];
  (wd.assignments || []).forEach(function (a) {
    if (a.userId !== u.id || seen[a.projectId + "|" + (a.workOrderId || "")]) return;
    var p = byId(db.projects, a.projectId); if (!p) return;
    seen[a.projectId + "|" + (a.workOrderId || "")] = 1;
    var wo = a.workOrderId ? byId(db.workOrders || [], a.workOrderId) : null;
    rows.push(allowanceLine(wdAllowance(u.id, a.projectId, a.workOrderId || null), p.key + " · " + p.name + (wo ? " · " + wo.code : "")));
  });
  if (!rows.length) return null;
  return h("section", { class: "card pad", id: "my-banks" }, h("h2", null, tr("My hours banks")),
    h("p", { class: "muted small", style: { marginTop: 0 } }, tr("Your allowance on each project, from WorkDesk. Report time in WorkDesk; it counts here once it's registered.")),
    rows, h("div", { style: { marginTop: "8px" } }, h("a", { class: "btn sm", href: "../index.html#/workdesk/time" }, icon("clock"), tr("Report time in WorkDesk"))));
}
/* task details: hours reported on the task, the assignee's hours bank, the budget it draws on */
function wdTaskSection(t) {
  if (!wdData()) return null;
  var hrs = wdTaskHours(t.id), u = me(), out = [h("hr"), h("h3", { class: "wd-h" }, tr("Hours in WorkDesk"))];
  out.push(h("div", { class: "small", id: "wd-task-hours" }, hrs.total ? tr("{n} h reported on this task", { n: numH(hrs.total) }) : tr("No hours reported on this task yet."),
    hrs.pending ? " · " + tr("{n} h waiting for approval", { n: numH(hrs.pending) }) : ""));
  if (t.estimateHours) out.push(h("div", { class: "wd-line" }, h("div", { class: "row between small" }, h("span", { class: "muted" }, tr("Against the estimate")), h("span", { class: "mono" }, tr("{u} of {t} h", { u: numH(hrs.total), t: numH(t.estimateHours) }))), meterBar(hrs.total, hrs.pending, t.estimateHours)));
  if (t.assigneeId && (isManager() || t.assigneeId === u.id)) out.push(allowanceLine(wdAllowance(t.assigneeId, t.projectId, t.workOrderId || null), tr("Hours bank — {n}", { n: userName(t.assigneeId) })));
  if (canSeeBudgets()) { var b = wdBudget(t.projectId, t.workOrderId || null); if (b) out.push(budgetLine(b, b.label ? tr("Budget · {wo}", { wo: b.label }) : tr("Project budget"))); }
  if (portalAccess().workdesk && t.assigneeId === u.id) out.push(h("a", { class: "linklike small", id: "wd-report", href: "../index.html#/workdesk/time?task=" + encodeURIComponent(t.id) }, tr("Report time on this task in WorkDesk")));
  return out;
}
