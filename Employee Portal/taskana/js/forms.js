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
var userOpts = function () { return db.users.filter(function (u) { return u.isActive; }).map(function (u) { return { value: u.id, label: userName(u.id) + " — " + u.jobTitle }; }); };
var opts = function (arr) { return function () { return arr.map(function (x) { var k = x.k || x; return { value: k, label: tr(k) }; }); }; };
var parseLabels = function (s) { return s.split(",").map(function (x) { return x.trim().replace(/^#/, ""); }).filter(Boolean); };
var weekendHelp = function (v) { return isWeekend(v) ? tr("Falls on a weekend (Fri–Sat).") : null; };

var FORMS = {
  task: function (m) {
    var noProjects = !db.projects.some(function (p) { return p.status !== "Archived"; });
    return {
      title: tr("New task"),
      intro: noProjects ? h("div", { class: "note" }, tr("There are no projects yet. Clients and projects are added in WorkDesk (Management), then appear here.")) : null,
      fields: [
        { k: "projectId", label: tr("Project"), req: true, t: "select", blank: tr("Select a project…"), options: function () { return db.projects.filter(function (p) { return p.status !== "Archived"; }).map(function (p) { return { value: p.id, label: (clientOf(p) || {}).name + " · " + p.key + " · " + p.name }; }); } },
        { k: "workOrderId", label: tr("Work order"), t: "select", blank: tr("— none —"), options: function () { return (db.workOrders || []).map(function (w) { var p = byId(db.projects, w.projectId); return { value: w.id, label: w.code + (w.title ? " · " + w.title : "") + (p ? " (" + p.key + ")" : "") }; }); },
          help: tr("From WorkDesk. The time people report on this task can be logged against it.") },
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
        var wo = v.workOrderId ? byId(db.workOrders || [], v.workOrderId) : null;
        if (wo && v.projectId && wo.projectId !== v.projectId) e.workOrderId = tr("This work order belongs to another project.");
      },
      save: function (v) {
        var t = createTask({ projectId: v.projectId, workOrderId: v.workOrderId || null, title: v.title, type: v.type, priority: v.priority, status: v.status, assigneeId: v.assigneeId || null,
          startDate: v.startDate || null, dueDate: v.dueDate || null, estimateHours: v.estimateHours === "" ? null : +v.estimateHours, recurrence: v.recurrence,
          deliverable: v.deliverable, description: v.description, labels: parseLabels(v.labels) });
        finish(); toast(tr("{k} created", { k: taskKey(t) })); openTask(t);
      }
    };
  },
  /* a project's details are WorkDesk's; Taskana keeps its key, deliverable type and description */
  project: function (m) {
    var p = m.item, nTasks = p ? db.tasks.filter(function (t) { return t.projectId === p.id; }).length : 0;
    return {
      title: tr("Project key & description"),
      intro: h("p", { class: "muted small", style: { marginTop: 0 } }, tr("The name, client, status, lead and dates of {n} are set in WorkDesk.", { n: p.name })),
      fields: [
        { k: "key", label: tr("Project key"), req: true, max: 6, upper: true, ph: tr("e.g. RSOM"), half: 1, first: true,
          help: nTasks ? tr("Changing it renames its {n} tasks; their old keys keep working.", { n: nTasks }) : tr("Prefix for task keys (RSOM-12). Letters and digits.") },
        { k: "docType", label: tr("Deliverable type"), t: "select", options: opts(DOC_TYPES), def: "User Manual", half: 2 },
        { k: "description", label: tr("Description"), t: "textarea" }
      ],
      validate: function (v, e) {
        v.key = v.key.toUpperCase();
        if (v.key && !/^[A-Z][A-Z0-9]{1,5}$/.test(v.key)) e.key = tr("2–6 letters/digits, starting with a letter.");
        else if (db.projects.some(function (x) { return x.key === v.key && x !== p; })) e.key = tr("Another project already uses this key.");
        else if (db.tasks.some(function (t) { return t.projectId !== p.id && (t.aliases || []).some(function (al) { return al.indexOf(v.key + "-") === 0; }); })) e.key = tr("Old task keys still point to {k}. Choose a different key.", { k: v.key });
      },
      save: function (v) {
        if (v.key !== p.key) db.tasks.forEach(function (t) { if (t.projectId === p.id) t.aliases = (t.aliases || []).concat([p.key + "-" + t.num]); });
        Object.assign(p, { key: v.key, docType: v.docType, description: v.description });
        save(); finish(); go("project/" + p.id); render();
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
  var keep = db.settings;
  COLLECTIONS.forEach(function (k) { db[k] = o[k] || []; }); db.rosterVersion = o.rosterVersion || 1; db.settings = keep;
  afterDataLoaded();                                      // WorkDesk's people and projects, and the signed-in person
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
    admin ? [h("h3", null, tr("People, clients and projects")),
      h("p", { class: "small muted" }, tr("They come from WorkDesk and update by themselves whenever WorkDesk changes them. Each person's Taskana role is their portal access, set in WorkDesk.")),
      h("div", { class: "row wrap" }, h("button", { class: "btn", onclick: function () { var ch = syncFromWorkdesk(db); if (ch) save(); finish(); toast(ch ? tr("Updated from WorkDesk") : tr("Already up to date with WorkDesk")); render(); } }, icon("undo"), tr("Update from WorkDesk now"))),
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
      h("p", { class: "small muted" }, tr("Made-up tasks, comments and questions for the real GALIL team on WorkDesk's projects — different every time. Demo records are marked, so removing them leaves real work alone.")),
      h("div", { class: "row wrap" },
        h("button", { class: "btn", id: "demo-fill", onclick: function () {
          confirmBox(tr("Fill with demo data?"), tr("Adds random demo tasks for the team on WorkDesk's projects (replacing earlier demo data). Real tasks stay as they are."), tr("Fill"), function () {
            keepUndo(); addDemo(db); save(); finish(); ui.openTask = null; clearFilters(); toast(tr("Demo data added")); go("home"); render();
          }, false);
        } }, icon("plus"), tr("Fill with demo data")),
        hasDemo(db) ? h("button", { class: "btn", id: "demo-remove", onclick: function () {
          confirmBox(tr("Remove the demo data?"), tr("Demo tasks and their comments are removed. Real work stays."), tr("Remove"), function () {
            keepUndo(); removeDemo(db); save(); finish(); ui.openTask = null; clearFilters(); toast(tr("Demo data removed")); go("home"); render();
          });
        } }, icon("trash"), tr("Remove demo data")) : null,
        h("button", { class: "btn danger", onclick: function () {
          confirmBox(tr("Reset to the demo data?"), remote ? tr("Every task on {w} is replaced with fresh demo tasks. You can undo this from the Data window.", { w: whereName() }) : tr("All tasks and comments in this browser are replaced with fresh demo tasks. You can undo this from the Data window."), tr("Reset"), function () {
            keepUndo(); var fresh = seed(false); syncFromWorkdesk(fresh); addDemo(fresh); replaceData(fresh); finish(); ui.openTask = null; clearFilters(); go("home"); render();
          });
        } }, icon("undo"), tr("Reset everything to demo data")))
    ] : h("p", { class: "small muted" }, tr("Only Admins can restore or change the demo data.")),
    admin ? h("p", { class: "small", style: { marginTop: "14px" } }, h("button", { class: "linklike", onclick: function () { openModal({ kind: "connection" }); } }, tr("Connection settings…"))) : null), null);
}
