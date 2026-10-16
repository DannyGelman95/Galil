/* =====================================================================
   Taskana — pages: overview, inbox, my work, board, task list,
   clients, projects, people and saved views.
   ===================================================================== */
"use strict";

function pageFor(r) {
  if (!can.seeEverything() && /^(insights|clients|project|people)$/.test(r[0])) return notFound(tr("No access"), tr("Outsourced accounts see the tasks they work on. Ask a Manager if you need more."));
  switch (r[0]) {
    case "inbox": return pageInbox();
    case "my": return pageMy();
    case "board": return pageBoard();
    case "tasks": return pageTasks();
    case "insights": return pageInsights();
    case "view": return pageView(r[1]);
    case "clients": return r[1] ? pageClient(r[1]) : pageClients();
    case "project": return pageProject(r[1]);
    case "people": return r[1] ? pagePerson(r[1]) : pagePeople();
    default: return pageHome();
  }
}

/* ---------- saved views ---------- */
function visibleViews() { var u = me(); return (db.views || []).filter(function (v) { return v.ownerId === u.id || v.shared; }); }
function applyView(v) {
  clearFilters(); Object.keys(v.filters || {}).forEach(function (k) { if (k in ui.filters) ui.filters[k] = v.filters[k]; });
  if (v.sort) ui.sort = { k: v.sort.k, dir: v.sort.dir };
  ui.viewFilters = currentFilters();
}
function viewChanged(v) {
  var a = currentFilters(), b = v.filters || {};
  var keys = Object.keys(a).concat(Object.keys(b));
  if (keys.some(function (k) { return (a[k] || "") !== (b[k] || ""); })) return true;
  return v.mode === "tasks" && !!v.sort && (v.sort.k !== ui.sort.k || v.sort.dir !== ui.sort.dir);
}
function viewCrumb(v, kind) { return tr("Saved view") + " · " + kind + " · " + (v.shared ? tr("shared") : tr("private")) + (v.ownerId !== me().id ? " · " + tr("by {name}", { name: userName(v.ownerId) }) : ""); }
function describeFilters(f) {
  var out = [];
  if (f.q) out.push("“" + f.q + "”");
  if (f.clientId) out.push((byId(db.clients, f.clientId) || {}).name || tr("deleted client"));
  if (f.projectId) out.push((byId(db.projects, f.projectId) || {}).key || tr("deleted project"));
  if (f.assigneeId) out.push(f.assigneeId === "me" ? tr("assigned to me") : f.assigneeId === "none" ? tr("unassigned") : userName(f.assigneeId));
  ["type", "priority", "status"].forEach(function (k) { if (f[k]) out.push(tr(f[k])); });
  if (f.overdue) out.push(tr("overdue")); if (f.questions) out.push(tr("open questions"));
  return out.join(" · ") || tr("everything");
}
function pageView(id) {
  var v = byId(db.views, id);
  if (!v) return notFound(tr("View not found"), tr("This saved view was deleted."));
  return v.mode === "board" ? pageBoard(v) : pageTasks(v);
}
function viewBar(v) {
  var mine = can.editView(v), changed = viewChanged(v);
  return h("div", { class: "viewbar" },
    h("span", { class: "star mine" }, icon("star")), h("span", null, h("b", null, v.name), " — " + describeFilters(v.filters || {})),
    changed ? h("span", { class: "chip amber" }, tr("Filters changed")) : null,
    h("span", { class: "sp" }),
    changed ? h("button", { class: "btn sm", onclick: function () { applyView(v); render(); } }, icon("undo"), tr("Reset")) : null,
    changed && mine ? h("button", { class: "btn sm primary", onclick: function () { v.filters = currentFilters(); v.sort = { k: ui.sort.k, dir: ui.sort.dir }; ui.viewFilters = currentFilters(); save(); toast(tr("“{name}” updated", { name: v.name })); render(); } }, tr("Update view")) : null,
    mine ? h("button", { class: "btn sm", onclick: function () { openModal({ kind: "view", item: v }); } }, icon("edit"), tr("Edit")) : null);
}

/* ---------- Overview ---------- */
function pageHome() {
  var u = me(), all = can.seeEverything(), open = visibleTasks().filter(function (t) { return t.status !== "Done"; });
  var overdue = open.filter(isOverdue);
  var qs = db.comments.filter(function (c) { return c.kind === "question" && !c.resolved && byId(db.tasks, c.taskId) && canSee(byId(db.tasks, c.taskId)); });
  var inReview = open.filter(function (t) { return t.status === "Peer Review" || t.status === "SME Review"; });
  var stat = function (n, label, fn, cls) { return h("div", clickable({ class: "card pad stat" }, fn), h("b", { class: cls || null }, n), h("span", null, label)); };
  var mine = open.filter(function (t) { return t.assigneeId === u.id; }).sort(function (a, b) { return (a.dueDate || "9") < (b.dueDate || "9") ? -1 : 1; });
  var forMe = function (c) { var t = byId(db.tasks, c.taskId) || {}; return (c.mentions || []).indexOf(u.id) >= 0 || (c.authorId !== u.id && (t.assigneeId === u.id || t.reporterId === u.id)); };
  var recent = db.activity.concat(db.comments.map(function (c) { return { taskId: c.taskId, userId: c.authorId, at: c.createdAt, kind: c.kind === "question" ? "asked" : "commented" }; }))
    .filter(function (a) { var t = byId(db.tasks, a.taskId); return t && canSee(t); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 12);
  var hr = new Date().getHours();
  return {
    title: tr(hr < 12 ? "Good morning, {name}" : hr < 18 ? "Good afternoon, {name}" : "Good evening, {name}", { name: u.fullName.split(" ")[0] }),
    crumbs: tr("Overview"), actions: newTaskBtn(),
    body: [
      h("div", { class: "grid g4", style: { marginBottom: "16px" } },
        stat(open.length, tr("Open tasks"), function () { clearFilters(); go("tasks"); }),
        all ? stat(db.projects.filter(function (p) { return p.status === "Active"; }).length, tr("Active projects"), function () { go("clients"); }) : stat(open.filter(function (t) { return t.assigneeId === u.id; }).length, tr("Assigned to me"), function () { go("my"); }),
        stat(inReview.length, tr("In review (peer + SME)"), function () { clearFilters(); go("board"); }),
        stat(overdue.length, tr("Overdue"), function () { clearFilters(); ui.filters.overdue = "1"; ui.sort = { k: "dueDate", dir: 1 }; go("tasks"); }, overdue.length ? "overdue" : "")),
      h("div", { class: "grid g2" },
        h("div", { class: "grid", style: { alignContent: "start" } },
          h("section", { class: "card pad" }, h("h2", null, tr("My open tasks")),
            mine.length ? mine.slice(0, 8).map(taskRow) : h("div", { class: "empty" }, tr("Nothing assigned to you."))),
          all ? h("section", { class: "card pad" }, h("h2", null, tr("Projects")),
            db.projects.filter(function (p) { return p.status === "Active"; }).map(projectRow)) : null),
        h("div", { class: "grid", style: { alignContent: "start" } },
          h("section", { class: "card pad" }, h("h2", null, tr("Open questions") + " ", h("span", { class: "chip amber" }, qs.length)),
            qs.length ? qs.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 8).map(function (c) {
              var t = byId(db.tasks, c.taskId);
              return h("div", clickable({ class: "list-item" }, function () { openTask(t); }), avatar(c.authorId),
                h("div", { class: "grow" }, h("div", { class: "small" }, h("span", { class: "key" }, taskKey(t)), " · ", userName(c.authorId), forMe(c) ? h("span", { class: "chip blue", style: { marginInlineStart: "6px" } }, tr("for you")) : null),
                  h("div", { class: "ellipsis" }, decodeMentions(c.body))));
            }) : h("div", { class: "empty" }, tr("No open questions."))),
          h("section", { class: "card pad" }, h("h2", null, tr("Recent activity")),
            recent.map(function (a) {
              var t = byId(db.tasks, a.taskId);
              return h("div", clickable({ class: "act-item" }, function () { openTask(t); }), avatar(a.userId),
                h("div", null, h("b", null, userName(a.userId)), " ", activityText(a, true), " · ", h("span", { class: "key" }, taskKey(t)), h("div", { class: "muted small" }, fmtWhen(a.at))));
            }))))
    ]
  };
}
function taskRow(t) {
  return h("div", clickable({ class: "list-item" }, function () { openTask(t); }),
    h("span", { class: "key", style: { minWidth: "62px" } }, taskKey(t)),
    h("div", { class: "grow" }, t.title), statusChip(t.status), h("span", { class: "small" }, due(t)));
}
function projectRow(p) {
  var ts = db.tasks.filter(function (t) { return t.projectId === p.id; });
  var c = clientOf(p);
  return h("div", clickable({ class: "list-item" }, function () { go("project/" + p.id); }),
    h("span", { class: "chip green" }, p.key),
    h("div", { class: "grow" }, h("div", { class: "ellipsis" }, p.name), h("div", { class: "muted small" }, (c ? c.name : "") + " · " + tr(p.docType))),
    h("div", { style: { width: "120px", flex: "none" } }, progress(ts), h("div", { class: "muted small", style: { textAlign: "end" } }, tr("{d}/{n} done", { d: ts.filter(function (t) { return t.status === "Done"; }).length, n: ts.length }))));
}
function progress(ts) {
  var bar = h("div", { class: "bar", role: "img", "aria-label": STATUSES.map(function (s) { return tr(s.k) + ": " + ts.filter(function (t) { return t.status === s.k; }).length; }).join(", ") });
  if (!ts.length) return bar;
  STATUSES.forEach(function (s) {
    var n = ts.filter(function (t) { return t.status === s.k; }).length;
    if (n) bar.appendChild(h("span", { style: { width: (n / ts.length * 100) + "%", background: s.color } }));
  });
  return bar;
}

/* ---------- Inbox ---------- */
var NOTE_TEXT = {
  mention: "mentioned you on {k}", assigned: "assigned you {k}", comment: "commented on {k}", question: "asked a question on {k}",
  answered: "marked your question on {k} answered", done: "moved {k} to Done"
};
function pageInbox() {
  var u = me();
  var list = db.notifications.filter(function (n) { return n.userId === u.id && byId(db.tasks, n.taskId); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  var unread = list.filter(function (n) { return !n.read; }).length;
  return {
    title: tr("Inbox"), crumbs: trn(unread, "{n} unread", "{n} unread"),
    actions: unread ? h("button", { class: "btn", onclick: function () { list.forEach(function (n) { n.read = true; }); save(); render(); } }, icon("check"), tr("Mark all read")) : null,
    body: h("section", { class: "card pad" }, list.length ? list.slice(0, 100).map(function (n) {
      var t = byId(db.tasks, n.taskId);
      return h("div", clickable({ class: "list-item" + (n.read ? " read" : " unread") }, function () { n.read = true; save(); openTask(t); }),
        h("span", { class: "unread-dot", "aria-label": n.read ? null : tr("Unread") }), avatar(n.byId),
        h("div", { class: "grow" }, h("div", null, h("b", null, userName(n.byId)), " ", tr(NOTE_TEXT[n.kind] || "updated {k}", { k: taskKey(t) })),
          h("div", { class: "muted small ellipsis" }, t.title + " · " + fmtWhen(n.at))));
    }) : h("div", { class: "empty" }, tr("You're all caught up. Mentions, assignments and replies to your tasks show up here.")))
  };
}

/* ---------- My work ---------- */
function pageMy() {
  var u = me();
  var mine = db.tasks.filter(function (t) { return t.assigneeId === u.id && t.status !== "Done"; });
  var reported = db.tasks.filter(function (t) { return t.reporterId === u.id && t.assigneeId !== u.id && t.status !== "Done"; });
  var groups = STATUSES.filter(function (s) { return s.k !== "Done"; }).map(function (s) { return { s: s, ts: mine.filter(function (t) { return t.status === s.k; }) }; }).filter(function (g) { return g.ts.length; });
  return {
    title: tr("My work"), crumbs: u.fullName + " · " + u.jobTitle, actions: newTaskBtn({ assigneeId: u.id }),
    body: h("div", { class: "grid g2" },
      h("section", { class: "card pad" }, h("h2", null, tr("Assigned to me")),
        groups.length ? groups.map(function (g) { return [h("h3", { style: { marginTop: "12px" } }, tr(g.s.k) + " (" + g.ts.length + ")"), g.ts.map(taskRow)]; }) : h("div", { class: "empty" }, tr("Nothing assigned to you."))),
      h("section", { class: "card pad", style: { alignSelf: "start" } }, h("h2", null, tr("Reported by me")),
        reported.length ? reported.map(function (t) {
          return h("div", clickable({ class: "list-item" }, function () { openTask(t); }), h("span", { class: "key" }, taskKey(t)), h("div", { class: "grow" }, t.title), avatar(t.assigneeId));
        }) : h("div", { class: "empty" }, tr("No open tasks you reported for others."))))
  };
}

/* ---------- Board ---------- */
function moveTask(t, status) {
  if (!can.editTask() || t.status === status) return;
  setField(t, "status", status);
  toast(tr("{k} moved to {s}", { k: taskKey(t), s: tr(status) }));
  render();
}
function pageBoard(view) {
  var ts = filteredTasks();
  var pr = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return {
    title: view ? view.name : tr("Board"), crumbs: view ? viewCrumb(view, tr("Board")) : tr("All projects"), keepScroll: true, actions: newTaskBtn({ projectId: ui.filters.projectId }),
    body: [view ? viewBar(view) : null, filterBar({ mode: "board", view: view }),
      can.editTask() ? h("p", { class: "muted small hint-line" }, tr("Drag a card to another column (press and hold on touch screens), or use its Move menu.")) : null,
      h("div", { class: "board" }, STATUSES.map(function (s) {
        var col = ts.filter(function (t) { return t.status === s.k; }).sort(function (a, b) { return (pr[a.priority] - pr[b.priority]) || ((a.dueDate || "9") < (b.dueDate || "9") ? -1 : 1); });
        return h("section", { class: "col", "data-drop": s.k, "aria-label": tr(s.k) },
          h("div", { class: "col-h" }, h("span", { class: "dot", style: { background: s.color } }), h("span", null, tr(s.k)), h("span", { class: "muted" }, col.length),
            h("span", { class: "sp" }), can.createTask() ? h("button", { class: "btn ghost sm icon-only", "aria-label": tr("Add a task to {s}", { s: tr(s.k) }), onclick: function () { openModal({ kind: "task", defaults: { status: s.k, projectId: ui.filters.projectId } }); } }, icon("plus")) : null),
          h("div", { class: "col-b" }, col.length ? col.map(card) : h("div", { class: "col-empty" }, tr("No tasks"))));
      }))]
  };
}
function card(t) {
  var p = projectOf(t), nC = commentsOf(t.id).length, nQ = openQuestions(t.id).length;
  var ck = t.checklist || [], ckDone = ck.filter(function (c) { return c.done; }).length;
  var kids = childrenOf(t.id), blockers = openBlockers(t), parent = t.parentId && byId(db.tasks, t.parentId);
  var el = h("article", clickable({ class: "tcard", "aria-label": taskKey(t) + " " + t.title + ", " + tr(t.status),
      onkeydown: function (e) {
        if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft") && can.editTask()) {
          e.preventDefault();
          var i = STATUSES.indexOf(statusOf(t.status)) + ((e.key === "ArrowRight") !== (LANG === "he") ? 1 : -1);
          if (i >= 0 && i < STATUSES.length) { moveTask(t, STATUSES[i].k); var n = document.querySelector('[data-task="' + t.id + '"]'); if (n) n.focus(); }
        } else if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); openTask(t); }
      } }, function () { openTask(t); }),
    h("div", { class: "row between" }, h("span", { class: "key" }, taskKey(t)), typeChip(t.type)),
    parent ? h("div", { class: "muted small parent" }, icon("sub"), taskKey(parent) + " " + parent.title) : null,
    h("div", { class: "t" }, t.title),
    h("div", { class: "muted small", style: { marginBottom: "6px" } }, p.name + (t.deliverable ? " · " + t.deliverable : "")),
    h("div", { class: "meta" }, prio(t.priority),
      t.dueDate ? h("span", { class: isOverdue(t) ? "overdue" : "", title: tr("Due date") }, icon("clock"), " " + fmtShort(t.dueDate)) : null,
      blockers.length ? h("span", { class: "chip red", title: tr("Blocked by {n} open task(s)", { n: blockers.length }) }, icon("block"), blockers.length) : null,
      kids.length ? h("span", { title: tr("Sub-tasks done") }, icon("sub"), " " + kids.filter(function (k) { return k.status === "Done"; }).length + "/" + kids.length) : null,
      ck.length ? h("span", { title: tr("Checklist") }, icon("checklist"), " " + ckDone + "/" + ck.length) : null,
      nC ? h("span", { title: tr("Comments") }, icon("comment"), " " + nC) : null,
      nQ ? h("span", { class: "chip amber", title: tr("Open questions") }, icon("question"), nQ) : null,
      t.recurrence ? h("span", { title: tr(t.recurrence) }, icon("repeat", tr("Repeats {r}", { r: tr(t.recurrence).toLowerCase() }))) : null),
    h("div", { class: "foot" },
      can.editTask() ? h("select", { class: "move", "aria-label": tr("Move {k} to", { k: taskKey(t) }), title: tr("Move to…"),
        onclick: function (e) { e.stopPropagation(); }, onkeydown: function (e) { e.stopPropagation(); },
        onchange: function (e) { moveTask(t, e.target.value); } },
        STATUSES.map(function (s) { return h("option", { value: s.k, selected: s.k === t.status }, tr(s.k)); })) : null,
      h("span", { class: "sp" }), avatar(t.assigneeId)));
  el.setAttribute("data-task", t.id);
  if (can.editTask()) draggable(el, t.id, function (id, status) { var x = byId(db.tasks, id); if (x) moveTask(x, status); });
  return el;
}

/* ---------- Task list (with bulk actions) ---------- */
function pageTasks(view) {
  var ts = filteredTasks(), s = ui.sort;
  var cols = [
    ["key", "Key", function (t) { return taskKey(t); }],
    ["title", "Title", function (t) { return t.title.toLowerCase(); }],
    ["project", "Project", function (t) { return projectOf(t).name; }],
    ["type", "Type", function (t) { return t.type; }],
    ["status", "Status", function (t) { return STATUSES.indexOf(statusOf(t.status)); }],
    ["priority", "Priority", function (t) { return PRIORITIES.indexOf(prioOf(t.priority)); }],
    ["assignee", "Assignee", function (t) { return t.assigneeId ? userName(t.assigneeId) : "~"; }],
    ["dueDate", "Due", function (t) { return t.dueDate || "9999"; }],
    ["updatedAt", "Updated", function (t) { return t.updatedAt; }]
  ];
  var getter = (cols.filter(function (c) { return c[0] === s.k; })[0] || cols[8])[2];
  ts.sort(function (a, b) { var x = getter(a), y = getter(b); return (x < y ? -1 : x > y ? 1 : 0) * s.dir; });
  /* selection only keeps tasks that are still visible */
  var visible = {}; ts.forEach(function (t) { visible[t.id] = 1; });
  Object.keys(ui.selected).forEach(function (id) { if (!visible[id]) delete ui.selected[id]; });
  var selIds = Object.keys(ui.selected), allOn = ts.length && selIds.length === ts.length;
  var editable = can.editTask();
  return {
    title: view ? view.name : tr("All tasks"), crumbs: (view ? viewCrumb(view, tr("List")) + " · " : "") + trn(ts.length, "{n} task", "{n} tasks"), actions: newTaskBtn({ projectId: ui.filters.projectId }),
    body: [view ? viewBar(view) : null, filterBar({ status: true, mode: "tasks", view: view }),
      selIds.length && editable ? bulkBar(selIds) : null,
      ts.length ? h("div", { class: "tbl-wrap" }, h("table", { class: "t" },
        h("caption", { class: "sr" }, tr("Tasks")),
        h("thead", null, h("tr", null,
          editable ? h("th", { class: "chk" }, h("input", { type: "checkbox", "aria-label": tr("Select all"), checked: allOn, onchange: function (e) { ui.selected = {}; if (e.target.checked) ts.forEach(function (t) { ui.selected[t.id] = 1; }); render(); } })) : null,
          cols.map(function (c) {
            var on = s.k === c[0];
            return h("th", { "aria-sort": on ? (s.dir > 0 ? "ascending" : "descending") : null },
              h("button", { class: "sort", onclick: function () { if (on) s.dir = -s.dir; else { s.k = c[0]; s.dir = 1; } render(); } }, tr(c[1]), on ? (s.dir > 0 ? " ▲" : " ▼") : ""));
          }))),
        h("tbody", null, ts.map(function (t) {
          var nQ = openQuestions(t.id).length;
          return h("tr", clickable({ class: "click" + (ui.selected[t.id] ? " sel" : ""), role: "row" }, function () { openTask(t); }),
            editable ? h("td", { class: "chk", onclick: function (e) { e.stopPropagation(); } }, h("input", { type: "checkbox", "aria-label": tr("Select {k}", { k: taskKey(t) }), checked: !!ui.selected[t.id],
              onchange: function (e) { if (e.target.checked) ui.selected[t.id] = 1; else delete ui.selected[t.id]; render(); } })) : null,
            h("td", null, h("span", { class: "key" }, taskKey(t))),
            h("td", null, t.parentId ? icon("sub", tr("Sub-task")) : null, " " + t.title, nQ ? h("span", { class: "chip amber", style: { marginInlineStart: "6px" } }, icon("question"), nQ) : null, openBlockers(t).length ? h("span", { class: "chip red", style: { marginInlineStart: "6px" } }, icon("block"), tr("Blocked")) : null),
            h("td", { class: "small" }, projectOf(t).name, h("div", { class: "muted" }, (clientOf(projectOf(t)) || {}).name)),
            h("td", null, typeChip(t.type)), h("td", null, statusChip(t.status)), h("td", null, prio(t.priority)),
            h("td", null, h("span", { class: "row nowrap" }, avatar(t.assigneeId), h("span", { class: "small" }, userName(t.assigneeId)))),
            h("td", { class: "small nowrap" }, due(t)), h("td", { class: "small muted nowrap" }, fmtWhen(t.updatedAt)));
        })))) : h("div", { class: "card empty" }, tr("No tasks match these filters."))]
  };
}
function bulkBar(ids) {
  var tasks = ids.map(function (id) { return byId(db.tasks, id); }).filter(Boolean);
  var apply = function (k, v, label) {
    if (v === "") return;
    var n = 0; tasks.forEach(function (t) { if (setField(t, k, v === "__none" ? null : v)) n++; });
    toast(trn(n, "{n} task updated", "{n} tasks updated")); render();
  };
  var sel = function (id, label, options, k) {
    return h("select", { id: id, "aria-label": label, onchange: function (e) { apply(k, e.target.value); } }, h("option", { value: "" }, label + "…"), options);
  };
  var deletable = tasks.filter(function (t) { return can.deleteTask(t); });
  return h("div", { class: "bulkbar", role: "region", "aria-label": tr("Bulk actions") },
    h("b", null, trn(tasks.length, "{n} selected", "{n} selected")),
    sel("bulk-status", tr("Status"), STATUSES.map(function (s) { return h("option", { value: s.k }, tr(s.k)); }), "status"),
    sel("bulk-assignee", tr("Assignee"), [h("option", { value: "__none" }, tr("Unassigned"))].concat(db.users.filter(function (u) { return u.isActive; }).map(function (u) { return h("option", { value: u.id }, u.fullName); })), "assigneeId"),
    sel("bulk-priority", tr("Priority"), PRIORITIES.map(function (p) { return h("option", { value: p.k }, tr(p.k)); }), "priority"),
    sel("bulk-project", tr("Move to project"), db.projects.filter(function (p) { return p.status !== "Archived"; }).map(function (p) { return h("option", { value: p.id }, p.key + " · " + p.name); }), "projectId"),
    h("span", { class: "sp" }),
    deletable.length ? h("button", { class: "btn sm danger", onclick: function () {
      confirmBox(trn(deletable.length, "Delete {n} task?", "Delete {n} tasks?"), tr("Their comments, attachments and history are removed for good.") + (deletable.length < tasks.length ? " " + tr("{n} of the selected tasks can't be deleted by you and stay.", { n: tasks.length - deletable.length }) : ""), tr("Delete"), function () {
        deleteTasks(deletable.map(function (t) { return t.id; })); ui.selected = {}; toast(trn(deletable.length, "{n} task deleted", "{n} tasks deleted")); render();
      });
    } }, icon("trash"), tr("Delete")) : null,
    h("button", { class: "btn sm ghost", onclick: function () { ui.selected = {}; render(); } }, tr("Clear selection")));
}

/* ---------- Clients ---------- */
function pageClients() {
  return {
    title: tr("Clients & projects"), crumbs: trn(db.clients.length, "{n} client", "{n} clients") + " · " + trn(db.projects.length, "{n} project", "{n} projects"),
    actions: can.manageClients() ? h("div", { class: "row" }, h("button", { class: "btn", onclick: function () { openModal({ kind: "project", defaults: {} }); } }, icon("plus"), tr("Project")), h("button", { class: "btn primary", onclick: function () { openModal({ kind: "client" }); } }, icon("plus"), tr("Client"))) : null,
    body: db.clients.length ? h("div", { class: "grid g3" }, db.clients.map(function (c) {
      var ps = db.projects.filter(function (p) { return p.clientId === c.id; });
      var ts = db.tasks.filter(function (t) { return ps.some(function (p) { return p.id === t.projectId; }); });
      return h("article", clickable({ class: "card pad clientcard", "aria-label": c.name }, function () { go("clients/" + c.id); }),
        h("div", { class: "row", style: { marginBottom: "8px" } }, h("span", { class: "avatar lg sq", style: { background: colorFor(c.id) } }, (c.code || "?").slice(0, 3)),
          h("div", { style: { flex: 1, minWidth: 0 } }, h("b", null, c.name), h("div", { class: "muted small" }, c.industry || "—"))),
        h("div", { class: "small muted", style: { marginBottom: "10px" } }, trn(ps.length, "{n} project", "{n} projects") + " · " + trn(ts.filter(function (t) { return t.status !== "Done"; }).length, "{n} open task", "{n} open tasks")),
        progress(ts),
        h("div", { style: { marginTop: "10px" } }, ps.map(function (p) {
          return h("div", { class: "row small", style: { padding: "3px 0", flexWrap: "nowrap" } }, h("span", { class: "key" }, p.key), h("span", { class: "ellipsis", style: { flex: 1 } }, p.name), h("span", { class: "chip" + (p.status === "Active" ? " green" : "") }, tr(p.status)));
        })));
    })) : h("div", { class: "card empty" }, tr("No clients yet. Add your first client to get started."))
  };
}
function pageClient(id) {
  var c = byId(db.clients, id);
  if (!c) return notFound(tr("Client not found"), tr("This client no longer exists."));
  var ps = db.projects.filter(function (p) { return p.clientId === c.id; });
  return {
    title: c.name, crumbs: h("span", null, h("a", { href: "#/clients" }, tr("Clients")), " / " + c.code),
    actions: can.manageClients() ? h("div", { class: "row" },
      h("button", { class: "btn", onclick: function () { openModal({ kind: "client", item: c }); } }, icon("edit"), tr("Edit")),
      h("button", { class: "btn primary", onclick: function () { openModal({ kind: "project", defaults: { clientId: c.id } }); } }, icon("plus"), tr("Project"))) : null,
    body: h("div", { class: "grid g2" },
      h("section", { class: "card pad", style: { alignSelf: "start" } }, h("h2", null, tr("Projects")),
        ps.length ? ps.map(projectRow) : h("div", { class: "empty" }, tr("No projects for this client yet."))),
      h("section", { class: "card pad", style: { alignSelf: "start" } }, h("h2", null, tr("Client details")),
        kv(tr("Code"), c.code), kv(tr("Industry"), c.industry), kv(tr("Contact"), c.contactName),
        kv(tr("Email"), c.contactEmail ? h("span", { class: "row nowrap" }, h("span", { class: "sel-text" }, c.contactEmail), h("button", { class: "btn ghost sm icon-only", "aria-label": tr("Copy email"), onclick: function () { copy(c.contactEmail); } }, icon("copy"))) : ""),
        h("h3", { style: { marginTop: "14px" } }, tr("Notes & style requirements")), h("div", { class: "prewrap" }, c.notes || h("span", { class: "muted" }, "—"))))
  };
}
function kv(k, v) { return h("div", { class: "prop" }, h("span", null, k), h("div", null, v || h("span", { class: "muted" }, "—"))); }

/* ---------- Project ---------- */
function pageProject(id) {
  var p = byId(db.projects, id);
  if (!p) return notFound(tr("Project not found"), tr("This project no longer exists."));
  var c = clientOf(p), ts = db.tasks.filter(function (t) { return t.projectId === p.id; });
  var est = ts.reduce(function (s, t) { return s + (+t.estimateHours || 0); }, 0);
  var people = {}; ts.forEach(function (t) { if (t.assigneeId) people[t.assigneeId] = (people[t.assigneeId] || 0) + (t.status !== "Done" ? 1 : 0); });
  var openTs = ts.filter(function (t) { return t.status !== "Done"; });
  return {
    title: p.name, crumbs: h("span", null, h("a", { href: "#/clients" }, tr("Clients")), " / ", h("a", { href: "#/clients/" + c.id }, c.name), " / " + p.key),
    actions: h("div", { class: "row" },
      h("button", { class: "btn", onclick: function () { clearFilters(); ui.filters.projectId = p.id; go("board"); } }, icon("board"), tr("Board")),
      can.manageProjects() ? h("button", { class: "btn", onclick: function () { openModal({ kind: "project", item: p }); } }, icon("edit"), tr("Edit")) : null,
      newTaskBtn({ projectId: p.id })),
    body: [
      h("div", { class: "grid g4", style: { marginBottom: "16px" } },
        h("div", { class: "card pad stat" }, h("b", null, openTs.length), h("span", null, tr("Open tasks"))),
        h("div", { class: "card pad stat" }, h("b", null, ts.filter(function (t) { return t.status === "Done"; }).length), h("span", null, tr("Done"))),
        h("div", { class: "card pad stat" }, h("b", null, est + " " + tr("h")), h("span", null, tr("Estimated effort"))),
        h("div", { class: "card pad stat" }, h("b", { class: p.dueDate && p.dueDate < today() && p.status === "Active" ? "overdue" : "" }, fmtDate(p.dueDate)), h("span", null, tr("Delivery date")))),
      h("div", { class: "grid g2" },
        h("section", { class: "card pad", style: { alignSelf: "start" } }, h("h2", null, tr("Tasks")),
          h("div", { style: { marginBottom: "12px" } }, progress(ts)),
          STATUSES.map(function (s) {
            var g = ts.filter(function (t) { return t.status === s.k; });
            return g.length ? [h("h3", { style: { marginTop: "12px" } }, tr(s.k) + " (" + g.length + ")"), g.map(function (t) {
              return h("div", clickable({ class: "list-item" }, function () { openTask(t); }), h("span", { class: "key", style: { minWidth: "62px" } }, taskKey(t)), h("div", { class: "grow" }, t.title), typeChip(t.type), avatar(t.assigneeId));
            })] : null;
          }), ts.length ? null : h("div", { class: "empty" }, tr("No tasks yet."))),
        h("div", { class: "grid", style: { alignContent: "start" } },
          h("section", { class: "card pad" }, h("h2", null, tr("Details")),
            kv(tr("Client"), c.name), kv(tr("Key"), p.key), kv(tr("Document"), tr(p.docType)), kv(tr("Status"), h("span", { class: "chip" + (p.status === "Active" ? " green" : "") }, tr(p.status))),
            kv(tr("Lead"), p.leadUserId ? h("span", { class: "row" }, avatar(p.leadUserId), userName(p.leadUserId)) : ""), kv(tr("Start"), fmtDate(p.startDate)), kv(tr("Delivery"), fmtDate(p.dueDate)),
            p.description ? h("div", { class: "prewrap", style: { marginTop: "10px" } }, p.description) : null),
          h("section", { class: "card pad" }, h("h2", null, tr("Team on this project")),
            Object.keys(people).length ? Object.keys(people).map(function (pid) {
              return h("div", clickable({ class: "list-item" }, function () { go("people/" + pid); }), avatar(pid), h("div", { class: "grow" }, userName(pid)), h("span", { class: "muted small" }, tr("{n} open", { n: people[pid] })));
            }) : h("div", { class: "empty" }, tr("Nobody assigned yet.")))))
    ]
  };
}

/* ---------- People ---------- */
function activate(u, role) {
  u.role = role || u.role || "Member"; u.isActive = true; u.pendingActivation = false; u.declined = false; u.activatedBy = me().id; u.activatedAt = nowISO();
  save(); toast(tr("{n} can sign in now, as {r}", { n: u.fullName, r: tr(u.role) })); render();
}
function pendingPanel() {
  var list = db.users.filter(function (u) { return u.pendingActivation && !u.declined; });
  if (!list.length || !can.managePeople()) return null;
  return h("section", { class: "card pad pending", style: { marginBottom: "16px" } },
    h("h2", null, tr("Waiting for activation") + " ", h("span", { class: "chip amber" }, list.length)),
    h("p", { class: "muted small", style: { marginTop: 0 } }, tr("These {d} accounts signed in for the first time. Pick a role and let them in — External for outsourced finance, HR or contractors who should see only their own tasks.", { d: DOMAIN })),
    list.map(function (u) {
      var sid = "act-role-" + u.id;
      return h("div", { class: "list-item static wrap" }, avatar(u.id),
        h("div", { class: "grow" }, h("b", null, u.fullName), h("div", { class: "muted small" }, [u.email, u.jobTitle, u.department, u.employment === "Outsourced" ? tr("Outsourced") : "", fmtWhen(u.requestedAt || nowISO())].filter(Boolean).join(" · "))),
        h("select", { id: sid, class: "f", style: { width: "auto" }, "aria-label": tr("Role for {n}", { n: u.fullName }) }, ROLES.map(function (r) { return h("option", { value: r, selected: r === (u.employment === "Outsourced" ? "External" : "Member") }, tr(r)); })),
        h("button", { class: "btn sm primary", onclick: function () { activate(u, document.getElementById(sid).value); } }, icon("check"), tr("Activate")),
        h("button", { class: "btn sm danger", onclick: function () { confirmBox(tr("Decline {n}?", { n: u.fullName }), tr("They stay out of Taskana. You can still activate them later from People."), tr("Decline"), function () { u.pendingActivation = false; u.isActive = false; u.declined = true; save(); render(); }); } }, tr("Decline")));
    }));
}
function pagePeople() {
  return {
    title: tr("People"), crumbs: tr("Anyone in the company can be assigned a task"),
    actions: can.managePeople() ? h("button", { class: "btn primary", onclick: function () { openModal({ kind: "person" }); } }, icon("plus"), tr("Person")) : null,
    body: [pendingPanel(), h("div", { class: "tbl-wrap" }, h("table", { class: "t" },
      h("caption", { class: "sr" }, tr("People")),
      h("thead", null, h("tr", null, [["Name"], ["Title"], ["Department"], ["Role"], ["Open", 1], ["In review", 1], ["Overdue", 1], ["Done", 1]].map(function (x) { return h("th", { class: x[1] ? "num" : "" }, tr(x[0])); }))),
      h("tbody", null, db.users.map(function (u) {
        var ts = db.tasks.filter(function (t) { return t.assigneeId === u.id; });
        var open = ts.filter(function (t) { return t.status !== "Done"; });
        var od = open.filter(isOverdue).length;
        return h("tr", clickable({ class: "click" + (u.isActive ? "" : " inactive"), role: "row" }, function () { go("people/" + u.id); }),
          h("td", null, h("span", { class: "row nowrap" }, avatar(u.id), h("span", null, u.fullName,
            u.pendingActivation && !u.declined ? h("span", { class: "chip amber", style: { marginInlineStart: "6px" } }, tr("Pending")) : u.isActive ? null : h("span", { class: "chip", style: { marginInlineStart: "6px" } }, tr("Inactive")),
            u.employment === "Outsourced" ? h("span", { class: "chip teal", style: { marginInlineStart: "6px" } }, tr("Outsourced")) : null, h("div", { class: "muted small" }, u.email)))),
          h("td", null, u.jobTitle), h("td", null, u.department), h("td", null, tr(u.role || "Member")), h("td", { class: "num" }, open.length),
          h("td", { class: "num" }, open.filter(function (t) { return /Review/.test(t.status); }).length),
          h("td", { class: "num" + (od ? " overdue" : "") }, od), h("td", { class: "num" }, ts.length - open.length));
      }))))]
  };
}
function pagePerson(id) {
  var u = byId(db.users, id);
  if (!u) return notFound(tr("Person not found"), tr("This person no longer exists."));
  var ts = db.tasks.filter(function (t) { return t.assigneeId === u.id; });
  return {
    title: u.fullName, crumbs: h("span", null, h("a", { href: "#/people" }, tr("People")), " / " + u.jobTitle),
    actions: h("div", { class: "row" }, can.managePeople() ? h("button", { class: "btn", onclick: function () { openModal({ kind: "person", item: u }); } }, icon("edit"), tr("Edit")) : null, newTaskBtn({ assigneeId: u.isActive ? u.id : "" })),
    body: h("div", { class: "grid g2" },
      h("section", { class: "card pad" }, h("h2", null, tr("Assigned tasks")),
        STATUSES.map(function (s) {
          var g = ts.filter(function (t) { return t.status === s.k; });
          return g.length ? [h("h3", { style: { marginTop: "12px" } }, tr(s.k) + " (" + g.length + ")"), g.map(taskRow)] : null;
        }), ts.length ? null : h("div", { class: "empty" }, tr("No tasks assigned."))),
      h("section", { class: "card pad", style: { alignSelf: "start" } }, h("div", { class: "row", style: { marginBottom: "12px" } }, avatar(u.id, true), h("div", null, h("b", null, u.fullName), h("div", { class: "muted small" }, u.jobTitle))),
        kv(tr("Email"), h("span", { class: "sel-text" }, u.email)), kv(tr("Department"), u.department), kv(tr("Reports to"), u.managerId ? userName(u.managerId) : ""),
        kv(tr("Employment"), tr(u.employment || "Employee")), kv(tr("Role"), tr(u.role || "Member")),
        kv(tr("Status"), u.pendingActivation && !u.declined ? tr("Waiting for activation") : u.isActive ? tr("Active") : tr("Inactive")),
        kv(tr("Sign-in"), u.lastSignInAt ? (u.authProvider === "microsoft" ? "Microsoft Entra ID" : tr("Email and password")) + " · " + fmtWhen(u.lastSignInAt) : tr("Hasn't signed in yet")),
        u.pendingActivation && !u.declined && can.managePeople() ? h("button", { class: "btn primary sm", style: { marginTop: "10px" }, onclick: function () { activate(u, u.employment === "Outsourced" ? "External" : "Member"); } }, icon("check"), tr("Activate")) : null))
  };
}
