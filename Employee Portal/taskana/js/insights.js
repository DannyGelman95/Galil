/* =====================================================================
   Taskana — Insights: delivery metrics and charts.
   Metrics use the recorded history: who a task was assigned to and when,
   when work started, when it was finished and by whom.
   ===================================================================== */
"use strict";

var DAY = 86400000;
function daysBetween(a, b) { return (new Date(b) - new Date(a)) / DAY; }
function pct(n, d) { return d ? Math.round(n / d * 100) : null; }
function fmtPct(v) { return v == null ? "—" : v + "%"; }
function fmt1(v) { return v == null || isNaN(v) ? "—" : (Math.round(v * 10) / 10).toLocaleString(locale()); }
function avg(arr) { return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : null; }
/* finished on or before the due date, both as calendar days in the viewer's time zone */
function onTime(t) { return t.dueDate ? localDate(t.completedAt) <= t.dueDate : null; }
function leadDays(t) { return daysBetween(t.createdAt, t.completedAt); }
function cycleDays(t) { return daysBetween(t.startedAt || t.createdAt, t.completedAt); }
function finisher(t) { return t.completedBy !== undefined ? t.completedBy : t.assigneeId; }

/* every assignment in the history: a task created with an assignee, or a later change of assignee */
function assignmentEvents(taskIds) {
  return db.activity.filter(function (a) {
    return taskIds[a.taskId] && a.to && ((a.kind === "created") || (a.kind === "field" && a.field === "assigneeId"));
  });
}

function pageInsights() {
  var I = ui.insights, P = I.period === "all" ? null : +I.period, now = Date.now();
  var from = P ? new Date(now - P * DAY).toISOString() : "";
  var prevFrom = P ? new Date(now - 2 * P * DAY).toISOString() : "";
  var inP = function (iso) { return !!iso && iso >= from; };
  var inPrev = function (iso) { return !!iso && !!P && iso >= prevFrom && iso < from; };
  var scope = db.tasks.filter(function (t) {
    var p = projectOf(t); if (!p) return false;
    if (I.clientId && p.clientId !== I.clientId) return false;
    if (I.projectId && t.projectId !== I.projectId) return false;
    return true;
  });
  var ids = {}; scope.forEach(function (t) { ids[t.id] = 1; });
  var open = scope.filter(function (t) { return t.status !== "Done"; });
  var done = scope.filter(function (t) { return t.status === "Done"; });
  var created = scope.filter(function (t) { return inP(t.createdAt); });
  var closed = done.filter(function (t) { return inP(t.completedAt); });
  var closedPrev = done.filter(function (t) { return inPrev(t.completedAt); });
  var withDue = closed.filter(function (t) { return t.dueDate; });
  var ontime = withDue.filter(onTime);
  var lead = avg(closed.map(leadDays)), cycle = avg(closed.map(cycleDays));
  var assigns = assignmentEvents(ids).filter(function (a) { return inP(a.at); });
  var perPerson = {}; assigns.forEach(function (a) { perPerson[a.to] = (perPerson[a.to] || 0) + 1; });
  var nPeople = Object.keys(perPerson).length;
  var openAssigned = {}; open.forEach(function (t) { if (t.assigneeId) openAssigned[t.assigneeId] = (openAssigned[t.assigneeId] || 0) + 1; });
  var overdue = open.filter(isOverdue);
  var qs = db.comments.filter(function (c) { return c.kind === "question" && ids[c.taskId] && inP(c.createdAt); });
  var answered = qs.filter(function (c) { return c.resolved; });
  var answerHrs = avg(answered.filter(function (c) { return c.resolvedAt; }).map(function (c) { return daysBetween(c.createdAt, c.resolvedAt) * 24; }));
  var periodLabel = P ? tr("last {n} days", { n: P }) : tr("all time");

  var delta = null;
  if (P) { var dd = closed.length - closedPrev.length; delta = h("span", { class: "delta " + (dd > 0 ? "up" : dd < 0 ? "down" : "") }, (dd > 0 ? "▲ " : dd < 0 ? "▼ " : "± ") + Math.abs(dd)); }
  var kpi = function (label, val, unit, sub) { return h("div", { class: "kpi" }, h("div", { class: "lbl" }, label), h("div", { class: "val" }, val, unit && val !== "—" ? h("small", null, unit) : null), h("div", { class: "sub" }, sub)); };
  var closeRate = pct(closed.length, created.length);

  var set = function (k) { return function (e) { I[k] = e.target.value; if (k === "clientId") I.projectId = ""; render(); }; };
  var controls = h("div", { class: "filters ins-controls" },
    h("div", { class: "seg2", role: "group", "aria-label": tr("Period") }, [["30", tr("30 days")], ["90", tr("90 days")], ["180", tr("6 months")], ["all", tr("All time")]].map(function (o) {
      return h("button", { class: I.period === o[0] ? "on" : "", "aria-pressed": I.period === o[0] ? "true" : "false", onclick: function () { I.period = o[0]; render(); } }, o[1]);
    })),
    h("select", { id: "ins-client", "aria-label": tr("Client"), onchange: set("clientId") }, h("option", { value: "" }, tr("All clients")), db.clients.map(function (c) { return h("option", { value: c.id, selected: I.clientId === c.id }, c.name); })),
    h("select", { id: "ins-project", "aria-label": tr("Project"), onchange: set("projectId") }, h("option", { value: "" }, tr("All projects")),
      db.projects.filter(function (p) { return !I.clientId || p.clientId === I.clientId; }).map(function (p) { return h("option", { value: p.id, selected: I.projectId === p.id }, p.key + " · " + p.name); })));

  return {
    title: tr("Insights"), crumbs: tr("Delivery metrics") + " · " + periodLabel,
    body: [controls,
      h("div", { class: "kpis" },
        kpi(tr("Closed"), closed.length, null, P ? h("span", null, delta, " " + tr("vs previous {n} days", { n: P })) : tr("tasks completed")),
        kpi(tr("Closing rate"), closeRate == null ? "—" : closeRate, "%", tr("{c} closed / {o} opened", { c: closed.length, o: created.length }) + (closeRate != null ? " · " + (closeRate >= 100 ? tr("backlog shrinking") : tr("backlog growing")) : "")),
        kpi(tr("Completion"), fmtPct(pct(done.length, scope.length)), null, tr("{d} of {n} tasks done overall", { d: done.length, n: scope.length })),
        kpi(tr("On-time delivery"), withDue.length ? pct(ontime.length, withDue.length) : "—", "%", tr("{a} of {b} closed by their due date", { a: ontime.length, b: withDue.length })),
        kpi(tr("Cycle time"), fmt1(cycle), " " + tr("days"), tr("from work starting to done · lead time {n} days", { n: fmt1(lead) })),
        kpi(tr("Tasks per person"), fmt1(nPeople ? assigns.length / nPeople : null), null, tr("assigned on average to {p} people · {o} open each now", { p: nPeople, o: fmt1(avg(Object.keys(openAssigned).map(function (k) { return openAssigned[k]; }))) })),
        kpi(tr("Overdue now"), overdue.length, null, tr("{p} of {n} open tasks", { p: fmtPct(pct(overdue.length, open.length)), n: open.length })),
        kpi(tr("Questions answered"), qs.length ? pct(answered.length, qs.length) : "—", "%", tr("{a} of {q} asked", { a: answered.length, q: qs.length }) + (answerHrs != null ? " · " + tr("~{n} h to answer", { n: fmt1(answerHrs) }) : ""))),
      h("div", { class: "grid g2", style: { marginBottom: "16px" } },
        h("section", { class: "chart-card" }, throughputSection(scope, P)),
        h("section", { class: "chart-card" }, h("h2", null, tr("Where the work is")), h("div", { class: "cap" }, tr("Every task in scope by workflow stage, right now.")), statusBreakdown(scope))),
      h("section", { class: "chart-card", style: { marginBottom: "16px" } }, h("h2", null, tr("People")),
        h("div", { class: "cap" }, tr("Assigned counts every time a task was given to the person in the period, including reassignments. Closed and the rates credit whoever finished the task.")),
        peopleTable(scope, inP, assigns)),
      h("div", { class: "grid g2" },
        h("section", { class: "chart-card" }, h("h2", null, tr("Projects")), h("div", { class: "cap" }, tr("Share of each project's tasks that are done.")), projectBars(scope)),
        h("section", { class: "chart-card" }, h("h2", null, tr("Closed by task type")), h("div", { class: "cap" }, tr("Tasks closed in the period, with their average cycle time.")), typeBars(closed)))
    ]
  };
}

/* svg helpers */
var SVGNS = "http://www.w3.org/2000/svg";
function sv(tag, attrs, kids) {
  var el = document.createElementNS(SVGNS, tag);
  for (var k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return el;
}
/* bar rising from the baseline with a 4px-rounded data end */
function barPath(x, y, w, hgt) {
  if (hgt <= 0) return "";
  var r = Math.min(4, w / 2, hgt);
  return "M" + x + "," + (y + hgt) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + hgt) + "Z";
}
function niceMax(v) { if (v <= 4) return 4; var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function tipRows(title, rows) {
  return h("div", null, h("b", null, title), rows.map(function (r) { return h("div", null, h("i", { style: { background: r[0] } }), r[1] + ": ", h("b", { style: { display: "inline" } }, r[2])); }));
}
/* GALIL's week starts on Sunday */
function weekStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; }
function monthStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(1); return x; }

function throughputSection(scope, P) {
  /* weekly buckets up to 6 months; whole history by month */
  var monthly = false, buckets = [], i;
  if (P) {
    var nW = Math.min(26, Math.max(4, Math.ceil(P / 7)));
    var ws = weekStart(new Date()); ws.setDate(ws.getDate() - 7 * (nW - 1));
    for (i = 0; i < nW; i++) { var a = new Date(ws); a.setDate(a.getDate() + 7 * i); var b = new Date(a); b.setDate(b.getDate() + 7); buckets.push({ s: a, e: b, o: 0, c: 0 }); }
  } else {
    var first = scope.reduce(function (m, t) { return t.createdAt < m ? t.createdAt : m; }, nowISO());
    var weeks = Math.ceil(daysBetween(weekStart(first), new Date()) / 7) + 1;
    if (weeks > 26) {
      monthly = true;
      var ms = monthStart(first), end = new Date();
      while (ms <= end) { var nx = new Date(ms); nx.setMonth(nx.getMonth() + 1); buckets.push({ s: new Date(ms), e: nx, o: 0, c: 0 }); ms = nx; }
    } else {
      var w0 = weekStart(first);
      for (i = 0; i < Math.max(4, weeks); i++) { var a2 = new Date(w0); a2.setDate(a2.getDate() + 7 * i); var b2 = new Date(a2); b2.setDate(b2.getDate() + 7); buckets.push({ s: a2, e: b2, o: 0, c: 0 }); }
    }
  }
  var find = function (iso) { var d = new Date(iso); for (var k = 0; k < buckets.length; k++) if (d >= buckets[k].s && d < buckets[k].e) return k; return -1; };
  scope.forEach(function (t) { var x = find(t.createdAt); if (x >= 0) buckets[x].o++; if (t.completedAt) { var y = find(t.completedAt); if (y >= 0) buckets[y].c++; } });
  return [h("h2", null, monthly ? tr("Opened vs closed per month") : tr("Opened vs closed per week")),
    h("div", { class: "cap" }, tr("When the closed bar is taller, the team is getting through the backlog.") + (monthly ? "" : " " + tr("Weeks start on Sunday."))),
    h("div", { class: "legend" }, h("span", null, h("i", { style: { background: "var(--s-created)" } }), tr("Opened")), h("span", null, h("i", { style: { background: "var(--s-closed)" } }), tr("Closed"))),
    h("div", { class: "chart", dir: "ltr" }, throughputChart(buckets, monthly)),
    h("details", { class: "datatable" }, h("summary", null, tr("Show as a table")),
      h("table", { class: "st-table" }, h("thead", null, h("tr", null, h("th", null, monthly ? tr("Month") : tr("Week of")), h("th", { class: "n" }, tr("Opened")), h("th", { class: "n" }, tr("Closed")))),
        h("tbody", null, buckets.map(function (b) { return h("tr", null, h("td", null, monthly ? fmtDate(d2s(b.s), { month: "short", year: "numeric" }) : fmtShort(d2s(b.s))), h("td", { class: "n" }, b.o), h("td", { class: "n" }, b.c)); }))))];
}
function throughputChart(buckets, monthly) {
  var n = buckets.length;
  var max = niceMax(Math.max(1, Math.max.apply(null, buckets.map(function (w) { return Math.max(w.o, w.c); }))));
  var W = 640, H = 220, L = 30, R = 8, T = 10, B = 26, iw = W - L - R, ih = H - T - B, band = iw / n, bw = Math.max(3, Math.min(16, (band - 8) / 2));
  var y = function (v) { return T + ih - v / max * ih; };
  var g = [], steps = max <= 4 ? max : max % 4 === 0 ? 4 : 5;
  for (var k = 0; k <= steps; k++) { var v = max / steps * k, yy = y(v); g.push(sv("line", { class: k ? "gl" : "base", x1: L, x2: W - R, y1: yy, y2: yy })); g.push(sv("text", { x: L - 6, y: yy + 4, "text-anchor": "end" }, [String(Math.round(v))])); }
  var every = n > 14 ? 3 : n > 8 ? 2 : 1;
  buckets.forEach(function (w, i) {
    var cx = L + band * i + band / 2;
    var label = monthly ? fmtDate(d2s(w.s), { month: "short", year: "2-digit" }) : fmtShort(d2s(w.s));
    var grp = sv("g", { class: "bar-g" }, [
      sv("path", { class: "mk", d: barPath(cx - bw - 1, y(w.o), bw, ih + T - y(w.o)), fill: "var(--s-created)" }),
      sv("path", { class: "mk", d: barPath(cx + 1, y(w.c), bw, ih + T - y(w.c)), fill: "var(--s-closed)" }),
      sv("rect", { class: "hit", x: L + band * i, y: T, width: band, height: ih })
    ]);
    var tipT = monthly ? fmtDate(d2s(w.s), { month: "long", year: "numeric" }) : tr("Week of {d}", { d: label });
    grp.addEventListener("mousemove", function (e) { showTip(e, tipRows(tipT, [["var(--s-created)", tr("Opened"), w.o], ["var(--s-closed)", tr("Closed"), w.c]])); });
    grp.addEventListener("mouseleave", hideTip);
    g.push(grp);
    if (i % every === 0) g.push(sv("text", { x: cx, y: H - 8, "text-anchor": "middle" }, [label]));
  });
  return sv("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", style: "min-width:520px", role: "img", "aria-label": tr("Tasks opened and closed per period") }, g);
}

function statusBreakdown(scope) {
  var total = scope.length;
  var rows = STATUSES.map(function (s) { return { s: s, n: scope.filter(function (t) { return t.status === s.k; }).length }; });
  return h("div", null,
    h("div", { class: "stack", role: "img", "aria-label": rows.map(function (r) { return tr(r.s.k) + " " + r.n; }).join(", ") }, rows.filter(function (r) { return r.n; }).map(function (r) {
      var el = h("span", { style: { width: (r.n / total * 100) + "%", background: r.s.color } });
      el.addEventListener("mousemove", function (e) { showTip(e, tipRows(tr(r.s.k), [[r.s.color, tr("Tasks"), r.n + " (" + pct(r.n, total) + "%)"]])); });
      el.addEventListener("mouseleave", hideTip);
      return el;
    })),
    h("table", { class: "st-table" }, h("tbody", null, rows.map(function (r) {
      return h("tr", null, h("td", null, h("span", { class: "legend", style: { margin: 0 } }, h("span", null, h("i", { style: { background: r.s.color } }), tr(r.s.k)))),
        h("td", { class: "n" }, r.n), h("td", { class: "n" }, total ? pct(r.n, total) + "%" : "—"));
    }))));
}

function peopleTable(scope, inP, assigns) {
  var rows = db.users.map(function (u) {
    var open = scope.filter(function (t) { return t.status !== "Done" && t.assigneeId === u.id; });
    var closed = scope.filter(function (t) { return t.status === "Done" && inP(t.completedAt) && finisher(t) === u.id; });
    var withDue = closed.filter(function (t) { return t.dueDate; });
    return { u: u, assigned: assigns.filter(function (a) { return a.to === u.id; }).length, open: open.length, closed: closed.length,
      rate: pct(closed.length, closed.length + open.length), ontime: pct(withDue.filter(onTime).length, withDue.length),
      cycle: avg(closed.map(cycleDays)), overdue: open.filter(isOverdue).length };
  }).filter(function (r) { return r.assigned || r.open || r.closed; }).sort(function (a, b) { return (b.open + b.closed) - (a.open + a.closed); });
  if (!rows.length) return h("div", { class: "empty" }, tr("No assigned tasks in this scope."));
  var max = Math.max.apply(null, rows.map(function (r) { return r.open + r.closed; })) || 1;
  var avgAssigned = avg(rows.map(function (r) { return r.assigned; }));
  return h("div", null,
    h("div", { class: "legend" }, h("span", null, h("i", { style: { background: "var(--s-created)" } }), tr("Open now")), h("span", null, h("i", { style: { background: "var(--s-closed)" } }), tr("Closed in period")),
      h("span", null, tr("Team average: {n} tasks assigned per person · ▲ well above average", { n: fmt1(avgAssigned) }))),
    h("div", { class: "tbl-wrap" }, h("table", { class: "t" },
      h("caption", { class: "sr" }, tr("Workload by person")),
      h("thead", null, h("tr", null, ["Person", "Workload", "Assigned", "Open", "Closed", "Completion", "On time", "Cycle time", "Overdue"].map(function (x, i) { return h("th", { class: i > 1 ? "num" : "" }, tr(x)); }))),
      h("tbody", null, rows.map(function (r) {
        var trk = h("div", { class: "trk", style: { width: Math.max(8, (r.open + r.closed) / max * 100) + "%" } },
          r.open ? h("span", { style: { flex: r.open, background: "var(--s-created)" } }) : null, r.closed ? h("span", { style: { flex: r.closed, background: "var(--s-closed)" } }) : null);
        trk.addEventListener("mousemove", function (e) { showTip(e, tipRows(r.u.fullName, [["var(--s-created)", tr("Open now"), r.open], ["var(--s-closed)", tr("Closed in period"), r.closed]])); });
        trk.addEventListener("mouseleave", hideTip);
        var high = avgAssigned && r.assigned > avgAssigned * 1.5;
        return h("tr", clickable({ class: "click", role: "row" }, function () { go("people/" + r.u.id); }),
          h("td", null, h("span", { class: "row nowrap" }, avatar(r.u.id), h("span", null, r.u.fullName, h("div", { class: "muted small" }, r.u.jobTitle)))),
          h("td", { style: { minWidth: "140px", width: "24%" } }, h("div", { class: "hbar", role: "img", "aria-label": tr("{o} open, {c} closed", { o: r.open, c: r.closed }) }, h("div", { style: { flex: 1, display: "flex" } }, trk))),
          h("td", { class: "num" }, r.assigned, high ? h("span", { title: tr("well above average"), "aria-label": tr("well above average") }, " ▲") : null),
          h("td", { class: "num" }, r.open), h("td", { class: "num" }, r.closed),
          h("td", { class: "num" }, fmtPct(r.rate)), h("td", { class: "num" }, fmtPct(r.ontime)),
          h("td", { class: "num" }, r.cycle == null ? "—" : tr("{n} d", { n: fmt1(r.cycle) })),
          h("td", { class: "num" + (r.overdue ? " overdue" : "") }, r.overdue));
      })))));
}

function projectBars(scope) {
  var ps = db.projects.map(function (p) {
    var ts = scope.filter(function (t) { return t.projectId === p.id; });
    var d = ts.filter(function (t) { return t.status === "Done"; }).length;
    return { p: p, n: ts.length, d: d, r: pct(d, ts.length) };
  }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.r - a.r; });
  if (!ps.length) return h("div", { class: "empty" }, tr("No projects in this scope."));
  return h("div", { style: { display: "grid", gap: "10px" } }, ps.map(function (x) {
    var trk = h("div", { class: "trk" }, h("span", { class: "fill", style: { width: x.r + "%", background: "var(--s-closed)" } }));
    trk.addEventListener("mousemove", function (e) { showTip(e, tipRows(x.p.name, [["var(--s-closed)", tr("Done"), tr("{d} of {n}", { d: x.d, n: x.n })]])); });
    trk.addEventListener("mouseleave", hideTip);
    return h("div", clickable({ class: "projbar", "aria-label": x.p.name + ": " + x.r + "% " + tr("done") }, function () { go("project/" + x.p.id); }),
      h("div", { class: "row small between nowrap" }, h("span", { class: "ellipsis" }, h("span", { class: "key" }, x.p.key), " " + x.p.name),
        h("span", { class: "num" }, h("b", null, x.r + "%"), h("span", { class: "muted" }, " · " + tr("{n} open", { n: x.n - x.d })))),
      h("div", { class: "hbar", style: { marginTop: "4px" } }, trk));
  }));
}

function typeBars(closed) {
  var rows = TYPES.map(function (ty) {
    var ts = closed.filter(function (t) { return t.type === ty; });
    return { ty: ty, n: ts.length, c: avg(ts.map(cycleDays)) };
  }).filter(function (r) { return r.n; }).sort(function (a, b) { return b.n - a.n; });
  if (!rows.length) return h("div", { class: "empty" }, tr("Nothing closed in this period."));
  var max = rows[0].n;
  return h("div", { style: { display: "grid", gap: "9px" } }, rows.map(function (r) {
    var trk = h("div", { class: "trk", style: { background: "none" } }, h("span", { class: "fill", style: { width: (r.n / max * 100) + "%", background: "var(--s-closed)" } }));
    trk.addEventListener("mousemove", function (e) { showTip(e, tipRows(tr(r.ty), [["var(--s-closed)", tr("Closed"), r.n], ["transparent", tr("Cycle time"), tr("{n} days", { n: fmt1(r.c) })]])); });
    trk.addEventListener("mouseleave", hideTip);
    return h("div", { class: "typebar small" },
      h("span", null, tr(r.ty)), h("div", { class: "hbar" }, trk), h("span", { class: "num muted" }, h("b", { class: "ink" }, r.n), " · " + tr("{n} d", { n: fmt1(r.c) })));
  }));
}
