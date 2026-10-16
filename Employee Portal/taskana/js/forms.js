/* =====================================================================
   Taskana — dialogs: forms (task, client, project, person, saved view),
   confirmations and the Data window.
   ===================================================================== */
"use strict";

function modalView(m) {
  if (m.kind === "confirm") return shell(m.title, h("div", null, m.text || ""), [
    h("button", { class: "btn", onclick: closeModal }, tr("Cancel")),
    h("button", { class: "btn " + (m.danger ? "danger-solid" : "primary"), "data-autofocus": true, onclick: function () { var f = m.onOk; closeModal(); f(); } }, m.okLabel || tr("OK"))]);
  if (m.kind === "data") return dataModal();
  if (m.kind === "connection") return connectionModal();
  var spec = FORMS[m.kind](m), vals = {}, errs = m.errs || {};
  var fields = spec.fields.map(function (f) {
    var v = m.values && f.k in m.values ? m.values[f.k] : (m.item ? m.item[f.k] : (m.defaults && m.defaults[f.k] != null && m.defaults[f.k] !== "" ? m.defaults[f.k] : f.def));
    if (f.k === "labels" && Array.isArray(v)) v = v.join(", ");
    var id = "fm-" + f.k, input, help = typeof f.help === "function" ? f.help(v) : f.help;
    var described = errs[f.k] || help ? id + "-msg" : null;
    var common = { class: "f", id: id, name: f.k, "aria-invalid": errs[f.k] ? "true" : null, "aria-describedby": described, disabled: f.disabled ? true : null };
    if (f.t === "select") input = h("select", common, (f.blank ? [h("option", { value: "" }, f.blank)] : []).concat(f.options().map(function (o) { return h("option", { value: o.value, selected: (v == null ? "" : String(v)) === String(o.value) }, o.label); })));
    else if (f.t === "textarea") input = h("textarea", Object.assign(common, { rows: 4, placeholder: f.ph || "" }), v || "");
    else input = h("input", Object.assign(common, { type: f.t || "text", value: v == null ? "" : v, placeholder: f.ph || "", maxlength: f.max || null, min: f.min, max: f.maxv, step: f.step, list: f.list ? id + "-list" : null, style: f.upper ? { textTransform: "uppercase" } : null }));
    if (f.list) input = [input, h("datalist", { id: id + "-list" }, f.list.map(function (o) { return h("option", { value: o }); }))];
    if (f.first) (Array.isArray(input) ? input[0] : input).setAttribute("data-autofocus", "");
    vals[f.k] = Array.isArray(input) ? input[0] : input;
    return h("div", { class: "field" + (f.half ? " half" : "") },
      h("label", { class: "l", for: id }, f.label, f.req ? h("span", { class: "req", "aria-hidden": "true" }, " *") : null, f.req ? h("span", { class: "sr" }, " (" + tr("required") + ")") : null), input,
      errs[f.k] ? h("div", { class: "err-msg", id: id + "-msg" }, errs[f.k]) : help ? h("div", { class: "muted small", id: id + "-msg", style: { marginTop: "3px" } }, help) : null);
  });
  var submit = function (e) {
    if (e) e.preventDefault();
    var out = {};
    Object.keys(vals).forEach(function (k) { out[k] = vals[k].value.trim(); });
    var e2 = {};
    spec.fields.forEach(function (f) { if (f.req && !out[f.k]) e2[f.k] = tr("Required"); });
    if (spec.validate) spec.validate(out, e2);
    if (Object.keys(e2).length) {
      m.values = out; m.errs = e2; renderOverlay();
      var first = overlay && overlay.querySelector("[aria-invalid=true]"); if (first) first.focus();
      return;
    }
    spec.save(out);
  };
  var foot = [];
  if (m.item && spec.remove) foot.push(h("button", { type: "button", class: "btn danger", style: { marginInlineEnd: "auto" }, onclick: spec.remove }, icon("trash"), tr("Delete")));
  foot.push(h("button", { type: "button", class: "btn", onclick: closeModal }, tr("Cancel")), h("button", { class: "btn primary", type: "submit" }, m.item ? tr("Save") : spec.createLabel || tr("Create")));
  return h("form", { class: "modal", onsubmit: submit, novalidate: true },
    h("div", { class: "modal-h" }, h("h2", null, spec.title), h("button", { type: "button", class: "x", onclick: closeModal, "aria-label": tr("Close") }, icon("x"))),
    h("div", { class: "modal-b" }, spec.intro || null, h("div", { class: "fields" }, fields)), h("div", { class: "modal-f" }, foot));
}
function shell(title, body, foot) {
  return h("div", { class: "modal" }, h("div", { class: "modal-h" }, h("h2", null, title), h("button", { class: "x", onclick: closeModal, "aria-label": tr("Close") }, icon("x"))), h("div", { class: "modal-b" }, body), foot ? h("div", { class: "modal-f" }, foot) : null);
}
function finish() { ui.modal = null; ui.modalStack = []; }
var userOpts = function () { return db.users.filter(function (u) { return u.isActive; }).map(function (u) { return { value: u.id, label: u.fullName + " — " + u.jobTitle }; }); };
var opts = function (arr) { return function () { return arr.map(function (x) { var k = x.k || x; return { value: k, label: tr(k) }; }); }; };
var parseLabels = function (s) { return s.split(",").map(function (x) { return x.trim().replace(/^#/, ""); }).filter(Boolean); };
var weekendHelp = function (v) { return isWeekend(v) ? tr("Falls on a weekend (Fri–Sat).") : null; };

var FORMS = {
  task: function (m) {
    var noProjects = !db.projects.some(function (p) { return p.status !== "Archived"; });
    return {
      title: tr("New task"),
      intro: noProjects ? h("div", { class: "note" }, tr("There are no projects yet. Create a client and a project first, under Clients & projects.")) : null,
      fields: [
        { k: "projectId", label: tr("Project"), req: true, t: "select", blank: tr("Select a project…"), options: function () { return db.projects.filter(function (p) { return p.status !== "Archived"; }).map(function (p) { return { value: p.id, label: (clientOf(p) || {}).name + " · " + p.key + " · " + p.name }; }); } },
        { k: "title", label: tr("Title"), req: true, first: true, max: 200, ph: tr("e.g. Draft chapter 4 — Calibration") },
        { k: "type", label: tr("Type"), t: "select", options: opts(TYPES), def: "Writing", half: 1 },
        { k: "priority", label: tr("Priority"), t: "select", options: opts(PRIORITIES), def: "Medium", half: 2 },
        { k: "assigneeId", label: tr("Assignee"), t: "select", blank: tr("Unassigned"), options: userOpts, half: 1 },
        { k: "status", label: tr("Status"), t: "select", options: opts(STATUSES), def: "To Do", half: 2 },
        { k: "startDate", label: tr("Start date"), t: "date", half: 1 },
        { k: "dueDate", label: tr("Due date"), t: "date", half: 2, help: weekendHelp },
        { k: "estimateHours", label: tr("Estimate (hours)"), t: "number", min: 0, maxv: 2000, step: 0.5, half: 1 },
        { k: "recurrence", label: tr("Repeats"), t: "select", options: function () { return RECURRENCES.map(function (r) { return { value: r, label: r ? tr(r) : tr("Doesn't repeat") }; }); }, half: 2 },
        { k: "deliverable", label: tr("Deliverable / section"), ph: tr("e.g. Vol 1 · Ch 4, Module 2, Release 5") },
        { k: "labels", label: tr("Labels"), ph: tr("comma, separated") },
        { k: "description", label: tr("Description"), t: "textarea", ph: tr("Scope, source material, style notes, acceptance criteria…") }
      ],
      validate: function (v, e) {
        if (v.estimateHours !== "" && (isNaN(+v.estimateHours) || +v.estimateHours < 0 || +v.estimateHours > 2000)) e.estimateHours = tr("Enter a number of hours between 0 and 2000.");
        if (v.startDate && v.dueDate && v.dueDate < v.startDate) e.dueDate = tr("The due date is before the start date.");
      },
      save: function (v) {
        var t = createTask({ projectId: v.projectId, title: v.title, type: v.type, priority: v.priority, status: v.status, assigneeId: v.assigneeId || null,
          startDate: v.startDate || null, dueDate: v.dueDate || null, estimateHours: v.estimateHours === "" ? null : +v.estimateHours, recurrence: v.recurrence,
          deliverable: v.deliverable, description: v.description, labels: parseLabels(v.labels) });
        finish(); toast(tr("{k} created", { k: taskKey(t) })); openTask(t);
      }
    };
  },
  client: function (m) {
    var c = m.item;
    return {
      title: c ? tr("Edit client") : tr("New client"),
      fields: [
        { k: "name", label: tr("Client name"), req: true, first: true, max: 120 },
        { k: "code", label: tr("Short code"), req: true, max: 5, upper: true, ph: tr("e.g. IAI"), half: 1 },
        { k: "industry", label: tr("Industry"), half: 2 },
        { k: "contactName", label: tr("Contact person"), half: 1 },
        { k: "contactEmail", label: tr("Contact email"), t: "email", half: 2 },
        { k: "notes", label: tr("Notes & style requirements"), t: "textarea", ph: tr("Style guide, templates, authoring tool, review process…") }
      ],
      validate: function (v, e) {
        v.code = v.code.toUpperCase();
        if (v.code && !/^[A-Z0-9]{2,5}$/.test(v.code)) e.code = tr("2–5 letters or digits.");
        else if (db.clients.some(function (x) { return x.code === v.code && x !== c; })) e.code = tr("Another client already uses this code.");
        if (v.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.contactEmail)) e.contactEmail = tr("Not a valid email address.");
      },
      save: function (v) {
        if (c) Object.assign(c, v); else { c = Object.assign({ id: uid("c") }, v); db.clients.push(c); }
        save(); finish(); go("clients/" + c.id); render();
      },
      remove: c ? function () {
        var n = db.projects.filter(function (p) { return p.clientId === c.id; }).length;
        if (n) { toast(trn(n, "Move or delete this client's {n} project first.", "Move or delete this client's {n} projects first.")); return; }
        confirmBox(tr("Delete {n}?", { n: c.name }), "", tr("Delete"), function () {
          db.clients = db.clients.filter(function (x) { return x !== c; });
          var r = cleanViews("client", c.id);
          if (ui.filters.clientId === c.id) clearFilters(); if (ui.insights.clientId === c.id) ui.insights.clientId = "";
          save(); finish(); toast(viewsMsg(r) || tr("Client deleted")); go("clients");
        });
      } : null
    };
  },
  project: function (m) {
    var p = m.item, nTasks = p ? db.tasks.filter(function (t) { return t.projectId === p.id; }).length : 0;
    return {
      title: p ? tr("Edit project") : tr("New project"),
      fields: [
        { k: "clientId", label: tr("Client"), req: true, t: "select", blank: tr("Select a client…"), options: function () { return db.clients.map(function (c) { return { value: c.id, label: c.name }; }); } },
        { k: "name", label: tr("Project name"), req: true, first: true, max: 160, ph: tr("e.g. Radar Suite — Operator Manual") },
        { k: "key", label: tr("Project key"), req: true, max: 6, upper: true, ph: tr("e.g. RSOM"), half: 1,
          help: nTasks ? tr("Changing it renames its {n} tasks; their old keys keep working.", { n: nTasks }) : tr("Prefix for task keys (RSOM-12). Letters and digits.") },
        { k: "docType", label: tr("Deliverable type"), t: "select", options: opts(DOC_TYPES), def: "User Manual", half: 2 },
        { k: "status", label: tr("Status"), t: "select", options: opts(PROJECT_STATUSES), def: "Active", half: 1 },
        { k: "leadUserId", label: tr("Project lead"), t: "select", blank: "—", options: userOpts, half: 2 },
        { k: "startDate", label: tr("Start date"), t: "date", half: 1 },
        { k: "dueDate", label: tr("Delivery date"), t: "date", half: 2, help: weekendHelp },
        { k: "description", label: tr("Description"), t: "textarea" }
      ],
      validate: function (v, e) {
        v.key = v.key.toUpperCase();
        if (v.key && !/^[A-Z][A-Z0-9]{1,5}$/.test(v.key)) e.key = tr("2–6 letters/digits, starting with a letter.");
        else if (db.projects.some(function (x) { return x.key === v.key && x !== p; })) e.key = tr("Another project already uses this key.");
        else if (db.tasks.some(function (t) { return (!p || t.projectId !== p.id) && (t.aliases || []).some(function (al) { return al.indexOf(v.key + "-") === 0; }); })) e.key = tr("Old task keys still point to {k}. Choose a different key.", { k: v.key });
        if (v.startDate && v.dueDate && v.dueDate < v.startDate) e.dueDate = tr("Delivery is before the start date.");
      },
      save: function (v) {
        v.leadUserId = v.leadUserId || null;
        if (p) {
          if (v.key !== p.key) db.tasks.forEach(function (t) { if (t.projectId === p.id) t.aliases = (t.aliases || []).concat([p.key + "-" + t.num]); });
          Object.assign(p, v);
        } else { p = Object.assign({ id: uid("p"), nextNum: 1 }, v); db.projects.push(p); }
        save(); finish(); go("project/" + p.id); render();
      },
      remove: p ? function () {
        confirmBox(tr("Delete {n}?", { n: p.name }), nTasks ? trn(nTasks, "Its {n} task and its comments are deleted too.", "Its {n} tasks and their comments are deleted too.") : "", tr("Delete"), function () {
          deleteTasks(db.tasks.filter(function (t) { return t.projectId === p.id; }).map(function (t) { return t.id; }));
          db.projects = db.projects.filter(function (x) { return x !== p; });
          var r = cleanViews("project", p.id);
          if (ui.filters.projectId === p.id) ui.filters.projectId = ""; if (ui.insights.projectId === p.id) ui.insights.projectId = "";
          save(); finish(); toast(viewsMsg(r) || tr("Project deleted")); go("clients/" + p.clientId);
        });
      } : null
    };
  },
  person: function (m) {
    var u = m.item, self = u && u.id === me().id;
    if (u && !m.values) m.values = Object.assign({}, u, { isActive: u.isActive ? "yes" : "no", managerId: u.managerId || "", employment: u.employment || "Employee" });
    var admins = db.users.filter(function (x) { return x.isActive && x.role === "Admin"; });
    return {
      title: u ? tr("Edit person") : tr("Add a person"),
      fields: [
        { k: "fullName", label: tr("Full name"), req: true, first: true, max: 120 },
        { k: "email", label: tr("Email"), req: true, t: "email", ph: "name" + DOMAIN, help: tr("Their {d} account — they sign in with it (Microsoft or email).", { d: DOMAIN }) },
        { k: "jobTitle", label: tr("Job title"), req: true, half: 1, ph: tr("e.g. Technical Writer") },
        { k: "department", label: tr("Department"), half: 2, list: DEPARTMENTS, ph: tr("e.g. Civil Division") },
        { k: "employment", label: tr("Employment"), t: "select", options: opts(EMPLOYMENT), def: "Employee", half: 1, help: tr("Outsourced: finance, HR or contractors with a company account.") },
        { k: "managerId", label: tr("Reports to"), t: "select", blank: "—", options: function () { return userOpts().filter(function (o) { return !u || o.value !== u.id; }); }, half: 2 },
        { k: "role", label: tr("Role in Taskana"), t: "select", options: opts(ROLES), def: "Member", half: 1,
          help: tr("Admin: everything. Manager: clients, projects, any task. Member: tasks. External: only the tasks they work on (for outsourced staff). Viewer: read and comment.") },
        { k: "isActive", label: tr("Status"), t: "select", half: 2, disabled: self, help: self ? tr("You can't deactivate yourself.") : null,
          options: function () { return [{ value: "yes", label: tr("Active") }, { value: "no", label: tr("Inactive (can't be assigned new tasks)") }]; }, def: "yes" }
      ],
      validate: function (v, e) {
        v.email = v.email.toLowerCase();
        if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = tr("Not a valid email address.");
        else if (v.email && !domainOK(v.email)) e.email = tr("Use the person's {d} address.", { d: DOMAIN });
        else if (db.users.some(function (x) { return (x.email || "").toLowerCase() === v.email && x !== u; })) e.email = tr("Someone already has this email.");
        if (u && u.role === "Admin" && admins.length === 1 && admins[0] === u && (v.role !== "Admin" || v.isActive === "no")) e.role = tr("Taskana needs at least one active Admin.");
      },
      save: function (v) {
        v.isActive = self ? true : v.isActive !== "no";
        v.managerId = v.managerId || null;
        if (v.isActive) { v.pendingActivation = false; v.declined = false; }
        if (u) Object.assign(u, v); else { u = Object.assign({ id: uid("u"), pendingActivation: false }, v); db.users.push(u); }
        save(); finish(); go("people/" + u.id); render();
      }
    };
  },
  view: function (m) {
    var v = m.item;
    if (!m.values) m.values = v ? { name: v.name, mode: v.mode, shared: v.shared ? "yes" : "no" } : { name: "", mode: (m.defaults && m.defaults.mode) || "tasks", shared: "no" };
    return {
      title: v ? tr("Edit saved view") : tr("Save view"), createLabel: tr("Save"),
      fields: [
        { k: "name", label: tr("Name"), req: true, first: true, max: 60, ph: tr("e.g. IAI — waiting on SME"), help: v ? tr("Shows: {f}", { f: describeFilters(v.filters || {}) }) : tr("Saves the current filters: {f}", { f: describeFilters(currentFilters()) }) },
        { k: "mode", label: tr("Open as"), t: "select", options: function () { return [{ value: "tasks", label: tr("Task list") }, { value: "board", label: tr("Board") }]; }, half: 1 },
        { k: "shared", label: tr("Who sees it"), t: "select", options: function () { return [{ value: "yes", label: tr("Everyone") }, { value: "no", label: tr("Only me") }]; }, half: 2 }
      ],
      validate: function (val, e) { if (db.views.some(function (x) { return x !== v && x.ownerId === me().id && x.name.toLowerCase() === val.name.toLowerCase(); })) e.name = tr("You already have a view with this name."); },
      save: function (val) {
        var shared = val.shared === "yes";
        if (v) { v.name = val.name; v.mode = val.mode; v.shared = shared; }
        else { v = { id: uid("v"), name: val.name, mode: val.mode, shared: shared, ownerId: me().id, filters: currentFilters(), sort: { k: ui.sort.k, dir: ui.sort.dir } }; db.views.push(v); }
        save(); finish(); toast(tr("View saved")); go("view/" + v.id); render();
      },
      remove: v ? function () { confirmBox(tr("Delete “{n}”?", { n: v.name }), tr("Only the saved view is removed. The tasks stay as they are."), tr("Delete"), function () { db.views = db.views.filter(function (x) { return x !== v; }); save(); finish(); clearFilters(); go(v.mode === "board" ? "board" : "tasks"); }); } : null
    };
  }
};
function viewsMsg(r) { return r.changed ? tr("{c} saved view(s) updated, {r} removed because nothing was left to filter.", { c: r.changed - r.removed, r: r.removed }) : ""; }

/* ---------- CSV: plain text only, so spreadsheet apps don't run cell contents as formulas ---------- */
function csvCell(v) {
  var s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function tasksCSV() {
  var rows = [["Key", "Title", "Client", "Project", "Type", "Status", "Priority", "Assignee", "Reporter", "Start", "Due", "Estimate (h)", "Deliverable", "Labels", "Parent", "Repeats", "Open questions", "Created", "Started", "Completed", "Updated"]];
  db.tasks.forEach(function (t) {
    var p = projectOf(t), par = t.parentId && byId(db.tasks, t.parentId);
    rows.push([taskKey(t), t.title, (clientOf(p) || {}).name, p ? p.name : "", t.type, t.status, t.priority, t.assigneeId ? userName(t.assigneeId) : "", userName(t.reporterId), t.startDate || "", t.dueDate || "",
      t.estimateHours == null ? "" : t.estimateHours, t.deliverable || "", (t.labels || []).join(" "), par ? taskKey(par) : "", t.recurrence || "", openQuestions(t.id).length,
      localDate(t.createdAt), localDate(t.startedAt) || "", localDate(t.completedAt) || "", localDate(t.updatedAt)]);
  });
  return "﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
}

/* ---------- Data window ---------- */
function restoreFrom(o, label) {
  var err = validateBackup(o);
  if (err) { toast(err); return; }
  confirmBox(tr("Replace all data?"), (Store.remote ? tr("Everyone's Taskana data on {w} is replaced with {l} ({t} tasks, {p} projects). You can undo this from the Data window.", { w: whereName(), l: label, t: o.tasks.length, p: o.projects.length }) : tr("Everything in this browser is replaced with {l} ({t} tasks, {p} projects). You can undo this from the Data window.", { l: label, t: o.tasks.length, p: o.projects.length })), tr("Restore"), function () {
    try { localStorage.setItem(BEFORE_RESTORE_KEY, sharedText(db)); } catch (e) { toast(tr("There's no room to keep a copy of the current data, so the restore was cancelled. Download a backup first.")); return; }
    replaceData(upgrade(Object.assign(emptyDB(), JSON.parse(JSON.stringify(o)))));
    finish(); ui.openTask = null; clearFilters(); toast(tr("Backup restored")); go("home"); render();
  });
}
/* swap in a whole new data set, keeping this device's settings and the signed-in person */
function replaceData(o) {
  var keep = db.settings, meId = me().id;
  COLLECTIONS.forEach(function (k) { db[k] = o[k] || []; }); db.rosterVersion = o.rosterVersion || 1; db.settings = keep;
  if (ENTRA && !byId(db.users, meId)) bindAccount(true);
  if (!ENTRA && !byId(db.users, meId)) { var t = db.users.filter(function (x) { return x.isActive && x.role === "Admin"; })[0]; if (t) { db.settings.currentUserId = t.id; writeSession({ userId: t.id, provider: "password", at: nowISO() }); } }
  save();
}
function dataModal() {
  var admin = can.manageData(), remote = Store.remote, f = Store.folder || {};
  var hasUndo = false; try { hasUndo = !!localStorage.getItem(BEFORE_RESTORE_KEY); } catch (e) {}
  var used = storageSize(), quota = 5 * 1024 * 1024, files = db.attachments.filter(function (a) { return a.kind === "file"; });
  var readFile = function (file, fn) {
    var r = new FileReader();
    r.onload = function () { var o; try { o = JSON.parse(r.result); } catch (e) { toast(tr("That file isn't valid JSON.")); return; } fn(o); };
    r.readAsText(file);
  };
  var wdLocal = null; try { wdLocal = workdeskData(JSON.parse(localStorage.getItem(WORKDESK_KEY) || "null")); } catch (e) {}
  var runImport = function (d, label) {
    confirmBox(tr("Import from WorkDesk?"), tr("People, clients and projects from {l} are added or updated by their WorkDesk id. Tasks and comments aren't touched.", { l: label }), tr("Import"), function () {
      var s = importWorkdesk(d); finish(); toast(tr("Imported: {u} new people, {c} new clients, {p} new projects.", { u: s.users, c: s.clients, p: s.projects })); render();
    }, false);
  };
  var keepUndo = function () { try { localStorage.setItem(BEFORE_RESTORE_KEY, sharedText(db)); } catch (e) {} };
  var where = remote
    ? h("div", { class: "where" }, icon("cloud"), h("div", { class: "grow" },
        h("b", null, STORAGE === "github" ? tr("GitHub repository") : tr("OneDrive folder")), " ", f.webUrl ? h("a", { href: f.webUrl, target: "_blank", rel: "noopener noreferrer" }, f.name || whereName()) : (f.name || whereName()),
        h("div", { class: "small muted" }, CONFIG.onedrive.fileName + " · " + fmtBytes(Store.size || sharedText(db).length) + (files.length ? " · " + trn(files.length, "{n} attached file", "{n} attached files") : "") + " · " +
          (STORAGE === "github" ? tr("every save is a commit, so the branch history is the backup") : tr("a dated copy goes to backups/ once a day"))),
        h("div", { class: "small" }, syncStatus()),
        STORAGE === "github" ? h("button", { class: "linklike small", onclick: function () { confirmBox(tr("Remove the GitHub token from this browser?"), tr("Taskana asks for a token again before it can open the data."), tr("Remove"), forgetGithubToken); } }, tr("Remove the GitHub token from this browser")) : null))
    : h("div", null,
        h("p", { class: "muted", style: { marginTop: 0 } }, tr("Standalone demo: Taskana keeps its data in this browser only. Choose a shared location under Connection settings. Download a backup to move it to another browser or keep a copy.")),
        h("div", { class: "meter-row" }, h("span", { class: "small" }, tr("Browser storage used: {u} of about {q}", { u: fmtBytes(used), q: fmtBytes(quota) }) + (files.length ? " · " + trn(files.length, "{n} attached file", "{n} attached files") : "")),
          h("div", { class: "trk meter", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.min(100, Math.round(used / quota * 100)) }, h("span", { class: "fill", style: { width: Math.min(100, used / quota * 100) + "%", background: used / quota > .8 ? "var(--err)" : "var(--s-closed)" } }))));
  return shell(tr("Data & backup"), h("div", { class: "data-modal" },
    where,
    STORAGE === "onedrive" && admin && !f.shared ? h("div", { class: "note" }, tr("This folder is in your own OneDrive. Share it with the company, then put the link in config.js (onedrive.folderLink) so everyone uses the same files."), " ",
      h("button", { class: "btn sm", onclick: function () { shareFolder().then(function (link) { copy(link, tr("Sharing link copied — paste it into config.js")); }, function (e) { toast(e.message); }); } }, icon("link"), tr("Share folder and copy link"))) : null,
    can.exportData() ? [h("h3", null, tr("Export")),
      h("div", { class: "row wrap" },
        h("button", { class: "btn primary", onclick: function () { saveFile("taskana-backup-" + today() + ".json", JSON.stringify(Object.assign(JSON.parse(sharedText(db)), { exported: nowISO() }), null, 2), "application/json", tr("Backup")); } }, icon(EMBEDDED ? "copy" : "download"), EMBEDDED ? tr("Copy backup") : tr("Download backup")),
        h("button", { class: "btn", onclick: function () { saveFile("taskana-tasks-" + today() + ".csv", tasksCSV(), "text/csv", tr("Task CSV")); } }, icon(EMBEDDED ? "copy" : "download"), EMBEDDED ? tr("Copy tasks (CSV)") : tr("Export tasks (CSV)")))] : null,
    admin ? [h("h3", null, tr("Import from WorkDesk")),
      h("p", { class: "small muted" }, tr("Bring in WorkDesk's people, clients and projects so both apps use the same records.")),
      h("div", { class: "row wrap" },
        wdLocal ? h("button", { class: "btn", onclick: function () { runImport(wdLocal, tr("WorkDesk in this browser")); } }, icon("upload"), tr("From WorkDesk in this browser")) : h("span", { class: "small muted" }, tr("WorkDesk hasn't been used in this browser.")),
        h("label", { class: "btn" }, icon("upload"), tr("From a WorkDesk backup file…"), h("input", { type: "file", class: "sr", accept: "application/json,.json", onchange: function (e) {
          var fl = e.target.files[0]; if (fl) readFile(fl, function (o) { var d = workdeskData(o); if (!d) toast(tr("This file isn't a WorkDesk backup with people, clients and projects.")); else runImport(d, fl.name); });
        } }))),
      h("h3", null, tr("Restore")),
      h("div", { class: "row wrap" },
        h("label", { class: "btn" }, icon("upload"), tr("Restore from a backup…"), h("input", { type: "file", class: "sr", accept: "application/json,.json", onchange: function (e) { var fl = e.target.files[0]; if (fl) readFile(fl, function (o) { restoreFrom(o, fl.name); }); } })),
        hasUndo ? h("button", { class: "btn", onclick: function () {
          var prev = null; try { prev = JSON.parse(localStorage.getItem(BEFORE_RESTORE_KEY)); } catch (e) {}
          if (!prev) { toast(tr("There's nothing to undo.")); return; }
          confirmBox(tr("Undo the last restore?"), tr("Brings back the data from before the last restore or reset. Changes made since then are lost."), tr("Undo restore"), function () {
            replaceData(upgrade(prev)); try { localStorage.removeItem(BEFORE_RESTORE_KEY); } catch (e) {} finish(); toast(tr("Previous data is back")); go("home"); render();
          });
        } }, icon("undo"), tr("Undo last restore")) : null),
      h("h3", null, tr("Demo data")),
      h("p", { class: "small muted" }, tr("Made-up clients, projects and tasks for the real GALIL team — different every time. Demo records are marked, so removing them leaves real work alone.")),
      h("div", { class: "row wrap" },
        h("button", { class: "btn", id: "demo-fill", onclick: function () {
          confirmBox(tr("Fill with demo data?"), tr("Adds random demo tasks for the team (replacing earlier demo data). Real clients, projects and tasks stay as they are."), tr("Fill"), function () {
            keepUndo(); addDemo(db); save(); finish(); ui.openTask = null; clearFilters(); toast(tr("Demo data added")); go("home"); render();
          }, false);
        } }, icon("plus"), tr("Fill with demo data")),
        hasDemo(db) ? h("button", { class: "btn", id: "demo-remove", onclick: function () {
          confirmBox(tr("Remove the demo data?"), tr("Demo clients, projects, tasks and their comments are removed. Real work and people stay."), tr("Remove"), function () {
            keepUndo(); removeDemo(db); save(); finish(); ui.openTask = null; clearFilters(); toast(tr("Demo data removed")); go("home"); render();
          });
        } }, icon("trash"), tr("Remove demo data")) : null,
        h("button", { class: "btn danger", onclick: function () {
          confirmBox(tr("Reset to the demo data?"), remote ? tr("Everything on {w} is replaced with the GALIL team and fresh demo data. You can undo this from the Data window.", { w: whereName() }) : tr("All clients, projects, tasks and comments in this browser are replaced with the sample data. You can undo this from the Data window."), tr("Reset"), function () {
            keepUndo(); replaceData(seed(true)); finish(); ui.openTask = null; clearFilters(); go("home"); render();
          });
        } }, icon("undo"), tr("Reset everything to demo data")))
    ] : h("p", { class: "small muted" }, tr("Only Admins can import, restore or change the demo data.")),
    admin ? h("p", { class: "small", style: { marginTop: "14px" } }, h("button", { class: "linklike", onclick: function () { openModal({ kind: "connection" }); } }, tr("Connection settings…"))) : null), null);
}
