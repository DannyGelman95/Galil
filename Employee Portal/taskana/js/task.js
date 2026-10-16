/* =====================================================================
   Taskana — task detail: fields, description, checklist, sub-tasks,
   linked tasks, attachments, comments & questions, history.
   ===================================================================== */
"use strict";

function openTask(t) {
  if (!t) return;
  ui.drafts[t.id] = ui.drafts[t.id] || "";
  ui.openedHere = true;
  location.hash = "#/task/" + encodeURIComponent(taskKey(t));
}
function closeTask() {
  ui.editingDesc = false; ui.descDraft = null; ui.editingCommentId = null; ui.commentDraft = null;
  if (ui.openedHere && history.length > 1) { ui.openedHere = false; history.back(); return; }
  ui.openedHere = false;
  location.hash = "#/" + (ui.bg || ["board"]).map(encodeURIComponent).join("/");
}
/* after a change that can alter the key (moving project), keep the address in step */
function syncTaskHash(t) {
  if (ui.openTask !== t.id) return;
  var k = taskKey(t);
  if (ui.route[1] !== k) { setHash("#/task/" + encodeURIComponent(k)); ui.route = ["task", k]; lastRoute = ui.route.slice(); }
}

var FIELD_LABELS = { status: "status", priority: "priority", type: "type", assigneeId: "assignee", dueDate: "due date", startDate: "start date", estimateHours: "estimate",
  deliverable: "deliverable", projectId: "project", title: "title", description: "description", labels: "labels", recurrence: "repeat", parentId: "parent task" };
function fmtVal(k, v) {
  if (k === "assigneeId") return v ? userName(v) : tr("Unassigned");
  if (k === "dueDate" || k === "startDate") return v ? fmtDate(v) : tr("none");
  if (k === "projectId") { var p = byId(db.projects, v); return p ? p.key : "?"; }
  if (k === "parentId") { var t = byId(db.tasks, v); return t ? taskKey(t) : tr("none"); }
  if (k === "estimateHours") return v != null ? tr("{n} h", { n: v }) : tr("none");
  if (k === "labels") return (v || []).join(", ") || tr("none");
  if (k === "status" || k === "priority" || k === "type" || k === "recurrence") return v ? tr(v) : tr("none");
  return v || tr("none");
}
function activityText(a, short) {
  switch (a.kind) {
    case "created": return tr("created the task");
    case "field":
      if (a.field === "description") return tr("updated the description");
      if (a.field === "title") return tr("renamed the task to “{v}”", { v: a.to });
      if (short) return tr("changed the {f}", { f: tr(FIELD_LABELS[a.field] || a.field) });
      return tr("changed the {f} from {a} to {b}", { f: tr(FIELD_LABELS[a.field] || a.field), a: fmtVal(a.field, a.from), b: fmtVal(a.field, a.to) });
    case "check": return tr(a.to ? "checked “{v}”" : "unchecked “{v}”", { v: a.field });
    case "link": { var o = byId(db.tasks, a.to); return tr("linked {k} ({type})", { k: o ? taskKey(o) : "?", type: tr(a.field) }); }
    case "recurred": { var n = byId(db.tasks, a.to); return tr("finished a repeating task; next one is {k}", { k: n ? taskKey(n) : "?" }); }
    case "question": return tr(a.to ? "marked a question answered" : "reopened a question");
    case "attach": return tr("attached “{v}”", { v: a.field });
    case "asked": return tr("asked a question");
    case "commented": return tr("commented");
    default: return a.text || tr("updated the task");
  }
}

/* ---------- task detail ---------- */
function taskView(t) {
  var p = projectOf(t), c = clientOf(p), u = me(), ro = !can.editTask();
  var change = function (k, v) { if (setField(t, k, v)) { syncTaskHash(t); render(); } };
  var sel = function (k, options, label) {
    return h("select", { id: "tf-" + k, disabled: ro, "aria-label": label, onchange: function (e) { change(k, e.target.value || null); } },
      options.map(function (o) { return h("option", { value: o.value, selected: (t[k] || "") === o.value }, o.label); }));
  };
  var prop = function (label, ctl, forId, extra) { return h("div", { class: "prop" }, h("label", { for: forId }, label), h("div", null, ctl, extra || null)); };

  var title = h("input", { id: "tf-title", class: "td-title", dir: "auto", value: t.title, "aria-label": tr("Title"), readonly: ro ? "" : null, maxlength: 200,
    onkeydown: function (e) { if (e.key === "Enter") e.target.blur(); },
    onblur: function (e) { var v = e.target.value.trim(); if (v && v !== t.title) change("title", v); else e.target.value = t.title; } });

  /* description: the draft survives redraws until saved or cancelled */
  var desc;
  if (ui.editingDesc) {
    if (ui.descDraft == null) ui.descDraft = t.description || "";
    desc = h("div", null, h("textarea", { class: "f", id: "desc-ed", rows: 8, "data-autofocus": true, "aria-label": tr("Description"), oninput: function (e) { ui.descDraft = e.target.value; } }, ui.descDraft),
      h("div", { class: "row", style: { marginTop: "6px" } },
        h("button", { class: "btn primary sm", onclick: function () { var v = ui.descDraft; ui.editingDesc = false; ui.descDraft = null; if (!setField(t, "description", v)) renderOverlay(); else render(); } }, tr("Save")),
        h("button", { class: "btn sm", onclick: function () { dismissTop(); } }, tr("Cancel")), h("span", { class: "muted small" }, tr("Esc cancels"))));
  } else {
    desc = h("div", ro ? { class: "desc ro" } : clickable({ class: "desc", title: tr("Click to edit"), "aria-label": tr("Edit description") }, function () { ui.editingDesc = true; ui.descDraft = null; renderOverlay(); }),
      t.description ? richText(t.description) : h("span", { class: "muted" }, ro ? tr("No description.") : tr("Add a description — scope, sources, style notes…")));
  }

  var ck = t.checklist || [];
  var checklist = h("div", { class: "checklist" },
    ck.map(function (it, i) {
      return h("div", { class: "ck-row" + (it.done ? " done" : "") },
        h("input", { type: "checkbox", id: "ck-" + it.id, checked: it.done, disabled: ro, onchange: function () { it.done = !it.done; t.updatedAt = nowISO(); log(t.id, "check", { field: it.text, to: it.done }); save(); render(); } }),
        h("label", { for: "ck-" + it.id }, it.text),
        ro ? null : h("button", { class: "x sm", "aria-label": tr("Remove “{v}”", { v: it.text }), onclick: function () { t.checklist = ck.filter(function (x) { return x !== it; }); save(); render(); } }, icon("x")));
    }),
    ro ? null : h("form", { class: "row", style: { marginTop: "6px" }, onsubmit: function (e) {
      e.preventDefault(); var i = document.getElementById("ck-new"), v = i.value.trim(); if (!v) return;
      t.checklist = ck.concat([{ id: uid("ck"), text: v, done: false }]); t.updatedAt = nowISO(); save(); i.value = ""; render();
    } }, h("input", { class: "f", id: "ck-new", placeholder: tr("Add a checklist item…"), "aria-label": tr("New checklist item"), style: { flex: 1 } }), h("button", { class: "btn sm" }, tr("Add"))));

  var comments = commentsOf(t.id), qCount = openQuestions(t.id).length;
  var acts = db.activity.filter(function (a) { return a.taskId === t.id; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  var tabBody;
  if (ui.taskTab === "comments") tabBody = h("div", { id: "tab-comments", role: "tabpanel" }, comments.length ? comments.map(function (cm) { return commentView(t, cm); }) : h("div", { class: "muted small", style: { marginBottom: "12px" } }, tr("No comments yet. Ask a question, share a source, or add notes for the reviewer.")), composer(t));
  else tabBody = h("div", { id: "tab-history", role: "tabpanel" }, acts.map(function (a) { return h("div", { class: "act-item" }, avatar(a.userId), h("div", null, h("b", null, userName(a.userId)), " " + activityText(a), h("div", { class: "muted small" }, fmtWhen(a.at)))); }));

  var weekendWarn = isWeekend(t.dueDate) ? h("div", { class: "warn small" }, icon("alert"), " " + tr("Falls on a weekend (Fri–Sat).")) : null;
  var parent = t.parentId && byId(db.tasks, t.parentId);
  var tab = function (k, label) { return h("button", { role: "tab", id: "t-" + k, "aria-selected": ui.taskTab === k ? "true" : "false", "aria-controls": "tab-" + k, class: ui.taskTab === k ? "on" : "", onclick: function () { ui.taskTab = k; renderOverlay(); } }, label); };

  return h("div", { class: "modal wide" },
    h("div", { class: "modal-h" },
      h("span", { class: "key" }, taskKey(t)), h("h2", { class: "sr" }, taskKey(t) + " " + t.title), h("span", { class: "muted small ellipsis" }, c.name + " / " + p.name),
      h("span", { class: "sp" }),
      h("button", { class: "btn ghost sm", onclick: function () { copy(location.href.split("#")[0] + "#/task/" + encodeURIComponent(taskKey(t)), tr("Link copied")); } }, icon("link"), h("span", { class: "hide-sm" }, tr("Copy link"))),
      can.deleteTask(t) ? h("button", { class: "btn ghost sm danger", onclick: function () {
        var kids = childrenOf(t.id).length;
        confirmBox(tr("Delete {k}?", { k: taskKey(t) }), tr("The task, its comments, attachments and history are removed for good.") + (kids ? " " + trn(kids, "Its {n} sub-task becomes a regular task.", "Its {n} sub-tasks become regular tasks.") : ""), tr("Delete"), function () {
          var k = taskKey(t); deleteTasks([t.id]); toast(tr("{k} deleted", { k: k })); closeTask();
        });
      } }, icon("trash"), h("span", { class: "hide-sm" }, tr("Delete"))) : null,
      h("button", { class: "x", onclick: dismissTop, "aria-label": tr("Close") }, icon("x"))),
    h("div", { class: "td" },
      h("div", { class: "td-main" },
        parent ? h("a", { class: "parent-link small", href: "#/task/" + encodeURIComponent(taskKey(parent)) }, icon("sub"), " " + tr("Sub-task of {k}", { k: taskKey(parent) + " " + parent.title })) : null,
        title,
        h("div", { class: "row", style: { marginBottom: "14px" } }, statusChip(t.status), typeChip(t.type), prio(t.priority),
          t.recurrence ? h("span", { class: "chip" }, icon("repeat"), tr(t.recurrence)) : null,
          openBlockers(t).length ? h("span", { class: "chip red" }, icon("block"), tr("Blocked")) : null,
          (t.labels || []).map(function (l) { return h("span", { class: "chip" }, "#" + l); })),
        h("h3", null, tr("Description")), desc,
        h("h3", { style: { marginTop: "18px" } }, tr("Checklist") + (ck.length ? " (" + ck.filter(function (x) { return x.done; }).length + "/" + ck.length + ")" : "")), checklist,
        subtasksSection(t, ro),
        linksSection(t, ro),
        attachmentsSection(t, ro),
        h("div", { class: "tabs", role: "tablist" },
          tab("comments", [tr("Comments ({n})", { n: comments.length }), qCount ? h("span", { class: "chip amber", style: { marginInlineStart: "6px" } }, trn(qCount, "{n} open question", "{n} open questions")) : null]),
          tab("history", tr("History"))),
        tabBody),
      h("div", { class: "td-side" },
        ro ? h("div", { class: "note small" }, icon("alert"), " " + tr("You can view and comment on this task, but your role ({r}) can't change it.", { r: tr(roleOf()) })) : null,
        prop(tr("Status"), sel("status", STATUSES.map(function (s) { return { value: s.k, label: tr(s.k) }; })), "tf-status"),
        prop(tr("Assignee"), sel("assigneeId", [{ value: "", label: tr("Unassigned") }].concat(db.users.filter(function (x) { return x.isActive || x.id === t.assigneeId; }).map(function (x) { return { value: x.id, label: x.fullName }; }))), "tf-assigneeId",
          !ro && t.assigneeId !== u.id ? h("button", { class: "linklike small", onclick: function () { change("assigneeId", u.id); } }, tr("Assign to me")) : null),
        prop(tr("Type"), sel("type", TYPES.map(function (x) { return { value: x, label: tr(x) }; })), "tf-type"),
        prop(tr("Priority"), sel("priority", PRIORITIES.map(function (x) { return { value: x.k, label: tr(x.k) }; })), "tf-priority"),
        prop(tr("Start date"), h("input", { id: "tf-startDate", type: "date", disabled: ro, value: t.startDate || "", onchange: function (e) {
          var v = e.target.value || null; if (v && t.dueDate && v > t.dueDate) { toast(tr("The start date can't be after the due date.")); e.target.value = t.startDate || ""; return; } change("startDate", v); } }), "tf-startDate"),
        prop(tr("Due date"), h("input", { id: "tf-dueDate", type: "date", disabled: ro, value: t.dueDate || "", onchange: function (e) {
          var v = e.target.value || null; if (v && t.startDate && v < t.startDate) { toast(tr("The due date can't be before the start date.")); e.target.value = t.dueDate || ""; return; } change("dueDate", v); } }), "tf-dueDate", weekendWarn),
        prop(tr("Estimate (h)"), h("input", { id: "tf-estimateHours", type: "number", min: 0, max: 2000, step: 0.5, disabled: ro, value: t.estimateHours == null ? "" : t.estimateHours, onchange: function (e) {
          var raw = e.target.value, v = raw === "" ? null : +raw;
          if (v != null && (isNaN(v) || v < 0 || v > 2000)) { toast(tr("Enter an estimate between 0 and 2000 hours.")); e.target.value = t.estimateHours == null ? "" : t.estimateHours; return; }
          change("estimateHours", v); } }), "tf-estimateHours"),
        prop(tr("Deliverable"), h("input", { id: "tf-deliverable", disabled: ro, value: t.deliverable || "", placeholder: tr("e.g. Vol 1 · Ch 3"), onchange: function (e) { change("deliverable", e.target.value.trim()); } }), "tf-deliverable"),
        prop(tr("Labels"), h("input", { id: "tf-labels", disabled: ro, value: (t.labels || []).join(", "), placeholder: tr("comma, separated"), onchange: function (e) { change("labels", e.target.value.split(",").map(function (s) { return s.trim().replace(/^#/, ""); }).filter(Boolean)); } }), "tf-labels"),
        prop(tr("Repeats"), sel("recurrence", RECURRENCES.map(function (r) { return { value: r, label: r ? tr(r) : tr("Doesn't repeat") }; })), "tf-recurrence",
          t.recurrence ? h("div", { class: "muted small" }, tr("Moving it to Done creates the next one.")) : null),
        prop(tr("Project"), sel("projectId", db.projects.filter(function (x) { return x.status !== "Archived" || x.id === t.projectId; }).map(function (x) { return { value: x.id, label: x.key + " · " + x.name }; })), "tf-projectId",
          (t.aliases || []).length ? h("div", { class: "muted small" }, tr("Previously {k}", { k: t.aliases.join(", ") })) : null),
        h("div", { class: "prop" }, h("span", null, tr("Reporter")), h("span", { class: "row" }, avatar(t.reporterId), userName(t.reporterId))),
        h("hr"),
        h("div", { class: "muted small" }, tr("Created {w}", { w: fmtWhen(t.createdAt) })),
        t.startedAt ? h("div", { class: "muted small" }, tr("Work started {w}", { w: fmtWhen(t.startedAt) })) : null,
        t.completedAt ? h("div", { class: "muted small" }, tr("Done {w}", { w: fmtWhen(t.completedAt) })) : null,
        h("div", { class: "muted small" }, tr("Updated {w}", { w: fmtWhen(t.updatedAt) })))));
}

/* ---------- sub-tasks ---------- */
function subtasksSection(t, ro) {
  var kids = childrenOf(t.id);
  if (t.parentId && !kids.length) return null;      /* one level deep keeps things simple */
  return [h("h3", { style: { marginTop: "18px" } }, tr("Sub-tasks") + (kids.length ? " (" + kids.filter(function (k) { return k.status === "Done"; }).length + "/" + kids.length + ")" : "")),
    h("div", { class: "subtasks" }, kids.map(function (k) {
      return h("div", clickable({ class: "list-item" }, function () { openTask(k); }), h("span", { class: "key" }, taskKey(k)), h("div", { class: "grow" }, k.title), statusChip(k.status), avatar(k.assigneeId));
    }),
    ro || t.parentId ? null : h("form", { class: "row", style: { marginTop: "6px" }, onsubmit: function (e) {
      e.preventDefault(); var i = document.getElementById("sub-new"), v = i.value.trim(); if (!v) return;
      var k = createTask({ projectId: t.projectId, title: v, parentId: t.id, type: t.type, priority: t.priority, deliverable: t.deliverable, status: "To Do" });
      i.value = ""; toast(tr("{k} added", { k: taskKey(k) })); render();
    } }, h("input", { class: "f", id: "sub-new", placeholder: tr("Add a sub-task…"), "aria-label": tr("New sub-task title"), style: { flex: 1 } }), h("button", { class: "btn sm" }, tr("Add"))))];
}

/* ---------- linked tasks ---------- */
function linksSection(t, ro) {
  var links = (t.links || []).map(function (l) { return { l: l, o: byId(db.tasks, l.taskId) }; }).filter(function (x) { return x.o; });
  return [h("h3", { style: { marginTop: "18px" } }, tr("Linked tasks")),
    h("div", { class: "links" }, links.length ? links.map(function (x) {
      return h("div", { class: "list-item static" }, h("span", { class: "chip" + (x.l.type === "is blocked by" && x.o.status !== "Done" ? " red" : "") }, tr(x.l.type)),
        h("a", { class: "key", href: "#/task/" + encodeURIComponent(taskKey(x.o)) }, taskKey(x.o)), h("div", { class: "grow" }, x.o.title), statusChip(x.o.status),
        ro ? null : h("button", { class: "x sm", "aria-label": tr("Remove link to {k}", { k: taskKey(x.o) }), onclick: function () { removeLink(t, x.o); render(); } }, icon("x")));
    }) : h("div", { class: "muted small" }, tr("No linked tasks.")),
    ro ? null : h("form", { class: "row", style: { marginTop: "6px" }, onsubmit: function (e) {
      e.preventDefault();
      var type = document.getElementById("link-type").value, key = document.getElementById("link-key").value.trim().toUpperCase();
      var o = taskByKey(key);
      if (!o) { toast(tr("No task with the key {k}.", { k: key || "…" })); return; }
      if (o.id === t.id) { toast(tr("A task can't be linked to itself.")); return; }
      addLink(t, type, o); render();
    } },
      h("select", { id: "link-type", class: "f", style: { width: "auto" }, "aria-label": tr("Link type") }, LINK_TYPES.map(function (x) { return h("option", { value: x }, tr(x)); })),
      h("input", { id: "link-key", class: "f", list: "task-keys", placeholder: tr("Task key, e.g. RSOM-4"), "aria-label": tr("Task key"), style: { flex: 1, minWidth: "120px" } }),
      h("datalist", { id: "task-keys" }, visibleTasks().filter(function (x) { return x.id !== t.id; }).slice(0, 300).map(function (x) { return h("option", { value: taskKey(x) }, x.title); })),
      h("button", { class: "btn sm" }, tr("Link"))))];
}

/* ---------- attachments ---------- */
function attachmentsSection(t, ro) {
  var list = attachmentsOf(t.id);
  var addFile = function (file) {
    if (!file) return;
    if (Store.remote) {
      /* shared storage: the file goes to the attachments folder next to the data */
      var max = backend().maxAttachment;
      if (file.size > max) { toast(tr("“{n}” is {s}. Files up to {m} can be attached — add a link to larger files instead.", { n: file.name, s: fmtBytes(file.size), m: fmtBytes(max) })); return; }
      var id = uid("at");
      toast(tr("Uploading “{n}” to {w}…", { n: file.name, w: whereName() }));
      uploadAttachment(file, id).then(function (it) {
        db.attachments.push(Object.assign({ id: id, taskId: t.id, kind: "file", name: file.name, size: file.size, type: file.type, addedBy: me().id, at: nowISO() }, it));
        log(t.id, "attach", { field: file.name }); t.updatedAt = nowISO(); save(); toast(tr("“{n}” attached", { n: file.name })); refreshUI();
      }, function (e) { toast(tr("Couldn't upload “{n}”: {m}", { n: file.name, m: e.message })); });
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) { toast(tr("“{n}” is {s}. Files up to 1 MB can be stored here — add a link to larger files instead.", { n: file.name, s: fmtBytes(file.size) })); return; }
    var r = new FileReader();
    r.onload = function () {
      db.attachments.push({ id: uid("at"), taskId: t.id, kind: "file", name: file.name, size: file.size, type: file.type, data: r.result, addedBy: me().id, at: nowISO() });
      log(t.id, "attach", { field: file.name }); t.updatedAt = nowISO(); save();
      if (!storageOK) { db.attachments.pop(); save(true); }
      render();
    };
    r.readAsDataURL(file);
  };
  return [h("h3", { style: { marginTop: "18px" } }, tr("Attachments & links")),
    h("div", { class: "attachments" }, list.length ? list.map(function (a) {
      var mayRemove = !ro && (a.addedBy === me().id || isManager());
      return h("div", { class: "list-item static" }, icon(a.kind === "link" ? "link" : "clip"),
        a.kind === "link" ? h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", class: "grow ellipsis" }, a.name || a.url)
          : a.driveItemId || a.ghPath ? h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", class: "grow ellipsis", title: tr("Opens in {w}", { w: a.ghPath ? "GitHub" : "OneDrive" }) }, a.name)
          : h("a", { href: a.data, download: a.name, class: "grow ellipsis" }, a.name),
        h("span", { class: "muted small" }, (a.kind === "file" ? fmtBytes(a.size) + " · " : "") + userName(a.addedBy)),
        mayRemove ? h("button", { class: "x sm", "aria-label": tr("Remove {n}", { n: a.name }), onclick: function () { db.attachments = db.attachments.filter(function (x) { return x !== a; }); deleteAttachmentFile(a); save(); render(); } }, icon("x")) : null);
    }) : h("div", { class: "muted small" }, tr("Nothing attached. Link to drafts, source documents or SME notes, or attach a small file.")),
    ro ? null : h("form", { class: "row wrap", style: { marginTop: "6px" }, onsubmit: function (e) {
      e.preventDefault();
      var url = document.getElementById("att-url").value.trim(), name = document.getElementById("att-name").value.trim();
      if (!/^https?:\/\/\S+$/i.test(url)) { toast(tr("Enter a web address that starts with http:// or https://")); return; }
      db.attachments.push({ id: uid("at"), taskId: t.id, kind: "link", name: name || url, url: url, addedBy: me().id, at: nowISO() });
      log(t.id, "attach", { field: name || url }); t.updatedAt = nowISO(); save(); render();
    } },
      h("input", { id: "att-url", class: "f", type: "url", placeholder: "https://…", "aria-label": tr("Link address"), style: { flex: "2 1 180px" } }),
      h("input", { id: "att-name", class: "f", placeholder: tr("Name (optional)"), "aria-label": tr("Link name"), style: { flex: "1 1 120px" } }),
      h("button", { class: "btn sm" }, icon("link"), tr("Add link")),
      h("label", { class: "btn sm" }, icon("clip"), tr("Attach file"), h("input", { type: "file", class: "sr", onchange: function (e) { addFile(e.target.files[0]); } }))))];
}

/* ---------- comments ---------- */
function richText(text) {
  var frag = document.createDocumentFragment(), last = 0, m;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text))) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    var u = byId(db.users, m[1]);
    frag.appendChild(h("span", { class: "mention" }, "@" + (u ? u.fullName : tr("removed person"))));
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}
function postComment(t, text, kind, picks) {
  var body = encodeMentions(text, picks), mentioned = mentionIds(body);
  var c = { id: uid("cm"), taskId: t.id, authorId: me().id, kind: kind, body: body, mentions: mentioned, createdAt: nowISO(), resolved: false };
  db.comments.push(c);
  notify(mentioned, "mention", t.id);
  notify([t.assigneeId, t.reporterId].filter(function (x) { return mentioned.indexOf(x) < 0; }), kind === "question" ? "question" : "comment", t.id);
  t.updatedAt = nowISO(); save();
  return c;
}
function commentView(t, cm) {
  var u = me(), isQ = cm.kind === "question", editing = ui.editingCommentId === cm.id;
  return h("div", { class: "comment" + (isQ ? " q" : "") + (cm.resolved ? " resolved" : "") },
    avatar(cm.authorId),
    h("div", { class: "body" },
      h("div", { class: "row small" }, h("b", null, userName(cm.authorId)), h("span", { class: "muted" }, fmtWhen(cm.createdAt) + (cm.editedAt ? " · " + tr("edited") : "")),
        isQ ? h("span", { class: "chip " + (cm.resolved ? "green" : "amber") }, icon(cm.resolved ? "check" : "question"), cm.resolved ? tr("Answered") : tr("Question")) : null),
      editing
        ? h("div", null, h("textarea", { class: "f", id: "cm-ed", "data-autofocus": true, "aria-label": tr("Edit comment"), style: { marginTop: "4px" }, oninput: function (e) { ui.commentDraft = e.target.value; } },
            ui.commentDraft != null ? ui.commentDraft : (ui.commentDraft = decodeMentions(cm.body, ui.mentionPicks[t.id] = ui.mentionPicks[t.id] || {}))),
            h("div", { class: "row", style: { marginTop: "6px" } },
              h("button", { class: "btn primary sm", onclick: function () {
                var v = (ui.commentDraft || "").trim();
                if (v) { cm.body = encodeMentions(v, ui.mentionPicks[t.id]); var before = cm.mentions || []; cm.mentions = mentionIds(cm.body); notify(cm.mentions.filter(function (x) { return before.indexOf(x) < 0; }), "mention", t.id); cm.editedAt = nowISO(); save(); }
                ui.editingCommentId = null; ui.commentDraft = null; render(); } }, tr("Save")),
              h("button", { class: "btn sm", onclick: dismissTop }, tr("Cancel"))))
        : h("div", { class: "bubble" }, richText(cm.body)),
      cm.resolved && cm.resolvedBy ? h("div", { class: "muted small", style: { marginTop: "3px" } }, tr("Marked answered by {n} · {w}", { n: userName(cm.resolvedBy), w: fmtWhen(cm.resolvedAt) })) : null,
      editing ? null : h("div", { class: "acts" },
        h("button", { onclick: function () { ui.composerKind = "comment"; var name = userName(cm.authorId); ui.drafts[t.id] = "@" + name + " " + (ui.drafts[t.id] || ""); (ui.mentionPicks[t.id] = ui.mentionPicks[t.id] || {})[name] = cm.authorId; renderOverlay(); var ta = document.getElementById("composer"); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } } }, tr("Reply")),
        isQ && can.resolveQuestion(cm, t) ? h("button", { onclick: function () {
          cm.resolved = !cm.resolved; cm.resolvedBy = cm.resolved ? u.id : null; cm.resolvedAt = cm.resolved ? nowISO() : null;
          log(t.id, "question", { to: cm.resolved });
          if (cm.resolved) notify([cm.authorId], "answered", t.id);
          save(); render();
        } }, cm.resolved ? tr("Reopen") : tr("Mark answered")) : null,
        can.editComment(cm) ? h("button", { onclick: function () { ui.editingCommentId = cm.id; ui.commentDraft = null; renderOverlay(); } }, tr("Edit")) : null,
        can.deleteComment(cm) ? h("button", { onclick: function () { confirmBox(tr("Delete this comment?"), isQ ? tr("It also stops counting in the question statistics.") : "", tr("Delete"), function () { db.comments = db.comments.filter(function (x) { return x !== cm; }); save(); render(); }); } }, tr("Delete")) : null)));
}

function composer(t) {
  var u = me(), picks = ui.mentionPicks[t.id] = ui.mentionPicks[t.id] || {};
  var hint = h("div", { class: "mention-hint", role: "listbox", "aria-label": tr("People to mention") });
  var ta = h("textarea", { id: "composer", "aria-label": ui.composerKind === "question" ? tr("Your question") : tr("Your comment"),
    placeholder: ui.composerKind === "question" ? tr("Ask a question — type @ to mention someone so they're notified…") : tr("Add a comment, a source link, review notes… Type @ to mention someone. Ctrl+Enter posts."),
    onkeydown: function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); post(); } },
    oninput: function () { ui.drafts[t.id] = ta.value; mentionHint(); } }, ui.drafts[t.id] || "");
  function mentionHint() {
    hint.replaceChildren();
    var m = /@([^\s@]{0,20}(?: [^\s@]{0,20})?)$/.exec(ta.value.slice(0, ta.selectionStart));
    if (!m) return;
    var q = m[1].toLowerCase();
    db.users.filter(function (x) { return x.isActive && x.fullName.toLowerCase().indexOf(q) === 0; }).slice(0, 6).forEach(function (x) {
      hint.appendChild(h("button", { class: "btn sm", role: "option", onmousedown: function (e) {
        e.preventDefault();
        var pos = ta.selectionStart, before = ta.value.slice(0, pos).replace(/@([^\s@]{0,20}(?: [^\s@]{0,20})?)$/, "@" + x.fullName + " ");
        ta.value = ui.drafts[t.id] = before + ta.value.slice(pos); picks[x.fullName] = x.id;
        ta.focus(); ta.setSelectionRange(before.length, before.length); hint.replaceChildren();
      } }, avatar(x.id), x.fullName, h("span", { class: "muted" }, " · " + x.jobTitle)));
    });
  }
  function post() {
    var v = ta.value.trim(); if (!v) return;
    postComment(t, v, ui.composerKind, picks);
    ui.drafts[t.id] = ""; ui.mentionPicks[t.id] = {}; ui.composerKind = "comment"; render();
    var n = document.getElementById("composer"); if (n) n.focus();
  }
  var kindBtn = function (k, ic, label) {
    return h("button", { class: ui.composerKind === k ? "on" : "", "aria-pressed": ui.composerKind === k ? "true" : "false", onclick: function () { ui.composerKind = k; renderOverlay(); var n = document.getElementById("composer"); if (n) n.focus(); } }, icon(ic), label);
  };
  return h("div", { class: "composer" }, ta, hint,
    h("div", { class: "bar2" }, avatar(u.id), h("span", { class: "small muted" }, tr("as {n}", { n: u.fullName })),
      h("span", { class: "sp" }),
      h("div", { class: "seg", role: "group", "aria-label": tr("Post as") }, kindBtn("comment", "comment", tr("Comment")), kindBtn("question", "question", tr("Question"))),
      h("button", { class: "btn primary sm", onclick: post }, ui.composerKind === "question" ? tr("Ask") : tr("Post"))));
}
