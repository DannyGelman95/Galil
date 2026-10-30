/* =====================================================================
   GALIL HR — performance reviews.
   An HR admin opens a review cycle (a period, due dates and the
   competencies to rate); each person in it gets a review with their
   manager (WorkDesk's "reports to") as the reviewer. Then:
     self      the employee rates themselves and writes about the period
     manager   the manager rates, writes strengths, areas to develop, an
               overall rating and the goals agreed for the next period
     shared    the employee reads it and acknowledges it, with a comment
     done
   The self-assessment stays private until it is sent; the manager's
   review until it is shared. HR admins see every review.
   ===================================================================== */
"use strict";

var STEP_LABEL = { self: "Self-assessment", manager: "Manager review", shared: "Waiting for acknowledgement", done: "Completed" };
var STEP_CHIP = { self: "amber", manager: "blue", shared: "pink", done: "ok" };
var DEFAULT_COMPETENCIES = [
  { en: "Quality of work", he: "איכות העבודה" }, { en: "Communication", he: "תקשורת" }, { en: "Teamwork", he: "עבודת צוות" },
  { en: "Ownership and reliability", he: "אחריות ואמינות" }, { en: "Client focus", he: "שירותיות ומיקוד בלקוח" }, { en: "Learning and growth", he: "למידה והתפתחות" }];

/* the written questions of each part — set per cycle by HR; these are the ones a cycle starts with.
   An answer is kept on the review under its question's id. */
var DEFAULT_SELF_Q = [
  { id: "achievements", name: { en: "What went well this period — achievements you're proud of", he: "מה הלך טוב בתקופה — הישגים שאת/ה גאה בהם" } },
  { id: "goals", name: { en: "What you'd like to learn or take on next", he: "מה היית רוצה ללמוד או לקחת על עצמך בהמשך" } }];
var DEFAULT_MGR_Q = [
  { id: "strengths", name: { en: "Strengths", he: "חוזקות" } },
  { id: "develop", name: { en: "Areas to develop", he: "תחומים לפיתוח" } },
  { id: "goals", name: { en: "Goals agreed for the next period", he: "היעדים שסוכמו לתקופה הבאה" } }];
function selfQuestions(c) { return c.selfQuestions || DEFAULT_SELF_Q; }
function mgrQuestions(c) { return c.mgrQuestions || DEFAULT_MGR_Q; }
/* lines typed in the cycle editor → questions; a line that stays keeps its id, so its answers stay with it */
function linesToQuestions(text, old) {
  return text.split("\n").map(function (s) { return s.trim(); }).filter(Boolean).map(function (n) {
    var o = old.filter(function (q) { return L(q.name) === n; })[0];
    return o || { id: uid("q"), name: n };
  });
}

function reviewRow(r, as) {
  var c = byId(db.cycles, r.cycleId);
  var who = as === "mine" ? tr("Reviewer: {name}", { name: nameOf(r.managerId) }) : nameOf(r.employeeId);
  return h("a", { class: "row-card", href: "#/reviews/" + r.id },
    as === "mine" ? h("div", { class: "rc-icon" }, icon("review", 22)) : avatar(r.employeeId, 38),
    h("div", { class: "rc-main" },
      h("div", { class: "rc-top" }, chip(tr(STEP_LABEL[r.status]), STEP_CHIP[r.status]), c.status === "closed" ? chip(tr("Cycle closed"), "mut") : null),
      h("b", null, as === "mine" ? L(c.title) : who),
      h("div", { class: "rc-meta" }, as === "mine" ? who : L(c.title), " · ", stepDue(r, c))));
}
function stepDue(r, c) {
  if (r.status === "self" && c.selfDue) return tr("self-assessment due {d}", { d: shortDate(c.selfDue) });
  if (r.status === "manager" && c.managerDue) return tr("manager review due {d}", { d: shortDate(c.managerDue) });
  if (r.status === "done" && r.ack) return tr("acknowledged {d}", { d: shortDate(r.ack.at.slice(0, 10)) });
  return tr("{a} – {b}", { a: shortDate(c.from), b: shortDate(c.to) });
}
function pageReviews() {
  var vis = visibleReviews().filter(function (r) { var c = byId(db.cycles, r.cycleId); return c && !c.deleted; });
  var mine = vis.filter(function (r) { return r.employeeId === ME.id; });
  var team = vis.filter(function (r) { return r.managerId === ME.id; });
  var order = function (a, b) { return REVIEW_STEPS.indexOf(a.status) - REVIEW_STEPS.indexOf(b.status) || nameOf(a.employeeId).localeCompare(nameOf(b.employeeId)); };
  return h("div", null,
    pageHead(tr("Performance reviews"), tr("A look back at the period, and goals for the next one — written by you and your manager.")),
    section(tr("My reviews"), null, mine.length ? h("div", { class: "list", id: "my-reviews" }, mine.sort(order).map(function (r) { return reviewRow(r, "mine"); })) : empty(tr("You're not in a review cycle right now."))),
    team.length ? section(tr("My team"), h("span", { class: "muted" }, tr("{n} to review", { n: team.filter(function (r) { return r.status === "manager"; }).length })),
      h("div", { class: "list", id: "team-reviews" }, team.sort(order).map(function (r) { return reviewRow(r, "team"); }))) : null,
    isAdmin() ? section(tr("Review cycles"), btn(tr("New cycle"), { kind: "primary", sm: true, icon: "plus", id: "cycle-new", onclick: function () { editCycle(null); } }),
      cyclesList().length ? h("div", { class: "list", id: "cycles" }, cyclesList().map(cycleRow)) : empty(tr("No review cycles yet."))) : null);
}
function cycleRow(c) {
  var rs = reviewsOf(c.id), done = rs.filter(function (r) { return r.status === "done"; }).length;
  return h("a", { class: "row-card", href: "#/reviews/cycle/" + c.id },
    h("div", { class: "rc-icon" }, icon("calendar", 22)),
    h("div", { class: "rc-main" },
      h("div", { class: "rc-top" }, chip(c.status === "closed" ? tr("Closed") : tr("Open"), c.status === "closed" ? "mut" : "ok")),
      h("b", null, L(c.title)),
      h("div", { class: "rc-meta" }, shortDate(c.from) + " – " + shortDate(c.to), " · ", tr("{n} of {t} completed", { n: done, t: rs.length })),
      progress(rs)));
}
function progress(rs) {
  var total = rs.length || 1;
  return h("div", { class: "stack", "aria-hidden": "true" }, REVIEW_STEPS.map(function (st) {
    var n = rs.filter(function (r) { return r.status === st; }).length;
    return n ? h("span", { class: "st-" + st, style: { width: (n * 100 / total) + "%" }, title: tr(STEP_LABEL[st]) + ": " + n }) : null;
  }));
}

/* ---------- a cycle (HR admins) ---------- */
function pageCycle(id) {
  if (!isAdmin()) return notFound(tr("Review cycles are for HR admins."), "#/reviews");
  var c = byId(db.cycles, id);
  if (!c || c.deleted) return notFound(tr("This cycle was removed."), "#/reviews");
  var rs = reviewsOf(c.id).sort(function (a, b) { return nameOf(a.employeeId).localeCompare(nameOf(b.employeeId)); });
  var managers = people().filter(function (u) { return u.role !== "EXT"; }).sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
  var counts = REVIEW_STEPS.map(function (st) { return chip(tr(STEP_LABEL[st]) + ": " + rs.filter(function (r) { return r.status === st; }).length, STEP_CHIP[st]); });
  return h("div", { class: "reader wide" },
    h("a", { class: "back", href: "#/reviews" }, icon("back", 15), tr("Performance reviews")),
    pageHead(L(c.title), shortDate(c.from) + " – " + shortDate(c.to) + (c.selfDue ? " · " + tr("self-assessment due {d}", { d: shortDate(c.selfDue) }) : "") + (c.managerDue ? " · " + tr("manager review due {d}", { d: shortDate(c.managerDue) }) : ""),
      [btn(tr("Edit"), { sm: true, icon: "edit", onclick: function () { editCycle(c); } }),
        btn(tr("Add people"), { sm: true, icon: "plus", id: "cycle-add", onclick: function () { addToCycle(c); } }),
        btn(c.status === "closed" ? tr("Reopen") : tr("Close the cycle"), { sm: true, id: "cycle-close", onclick: function () { c.status = c.status === "closed" ? "open" : "closed"; put("cycles", c); rerender(); } }),
        btn(tr("Download (CSV)"), { sm: true, icon: "download", id: "cycle-csv", onclick: function () { download(safeFile(L(c.title)) + ".csv", cycleCsv(c), "text/csv"); } }),
        btn(tr("Delete"), { sm: true, kind: "danger-t", icon: "trash", onclick: function () { confirmBox(tr("Delete this cycle?"), tr("Every review in it is deleted too."), tr("Delete"), function () { rs.forEach(function (r) { remove("reviews", r.id); }); remove("cycles", c.id); go("#/reviews"); }); } })]),
    h("div", { class: "card" }, h("div", { class: "chips" }, counts), progress(rs)),
    h("div", { class: "card tablewrap" }, h("table", { class: "tbl", id: "cycle-table" },
      h("thead", null, h("tr", null, h("th", null, tr("Employee")), h("th", null, tr("Reviewer")), h("th", null, tr("Step")), h("th", null, tr("Overall")), h("th", null, ""))),
      h("tbody", null, rs.map(function (r) {
        var sel = select([["", "—"]].concat(managers.filter(function (u) { return u.id !== r.employeeId; }).map(function (u) { return [u.id, nameOf(u)]; })), r.managerId || "",
          { "aria-label": tr("Reviewer for {name}", { name: nameOf(r.employeeId) }), class: "inp sm", onchange: function (e) { r.managerId = e.target.value || null; put("reviews", r); toast(tr("Reviewer changed."), "ok"); } });
        return h("tr", null,
          h("td", null, h("span", { class: "who" }, avatar(r.employeeId, 26), nameOf(r.employeeId))),
          h("td", null, sel),
          h("td", null, chip(tr(STEP_LABEL[r.status]), STEP_CHIP[r.status])),
          h("td", null, r.status === "shared" || r.status === "done" ? ratingLabel(r.mgr && r.mgr.overall) : "—"),
          h("td", { class: "end" }, link(tr("Open"), "#/reviews/" + r.id, { sm: true }),
            h("button", { type: "button", class: "linklike", onclick: function () { confirmBox(tr("Take {name} out of this cycle?", { name: nameOf(r.employeeId) }), tr("Their review is deleted."), tr("Remove"), function () { remove("reviews", r.id); rerender(); }); } }, tr("Remove"))));
      })))));
}
function cycleCsv(c) {
  var comps = c.competencies || [];
  var sq = selfQuestions(c), mq = mgrQuestions(c);
  var head = ["Employee", "Email", "Reviewer", "Step"].concat(comps.map(function (k) { return "Self: " + L(k.name); }), sq.map(function (q) { return "Self: " + L(q.name); }),
    comps.map(function (k) { return "Manager: " + L(k.name); }), mq.map(function (q) { return "Manager: " + L(q.name); }), ["Overall", "Acknowledged"]);
  var rows = reviewsOf(c.id).map(function (r) {
    var u = person(r.employeeId), s = r.status !== "self" ? (r.self || {}) : {}, m = r.status === "shared" || r.status === "done" ? (r.mgr || {}) : {};
    return [u ? u.fullName : r.employeeId, u ? u.email : "", r.managerId ? (person(r.managerId) || {}).fullName : "", STEP_LABEL[r.status]]
      .concat(comps.map(function (k) { return (s.ratings || {})[k.id] || ""; }), sq.map(function (q) { return s[q.id] || ""; }),
        comps.map(function (k) { return (m.ratings || {})[k.id] || ""; }), mq.map(function (q) { return m[q.id] || ""; }),
        [m.overall ? RATING[m.overall - 1] : "", r.ack ? r.ack.at.slice(0, 10) : ""]);
  });
  return "﻿" + [head].concat(rows).map(function (r) { return r.map(csvCell).join(","); }).join("\n");
}
/* the people a new cycle starts with: everyone with a manager, contractors aside */
function cycleCandidates() { return people().filter(function (u) { return u.role !== "EXT" && u.managerId; }).sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); }); }
function newReview(c, u) { return { id: uid("rv"), cycleId: c.id, employeeId: u.id, managerId: u.managerId || null, status: "self", self: { ratings: {}, notes: {} }, mgr: { ratings: {}, notes: {} } }; }
function editCycle(c) {
  var isNew = !c, y = new Date().getFullYear();
  c = c ? JSON.parse(JSON.stringify(c)) : { id: uid("cy"), status: "open", from: y + "-01-01", to: y + "-12-31", selfDue: addDays(today(), 14), managerDue: addDays(today(), 30),
    competencies: DEFAULT_COMPETENCIES.map(function (k) { return { id: uid("k"), name: k }; }), createdBy: ME.id };
  var title = input({ value: L(c.title) || tr("{y} annual review", { y: y }), id: "cy-title" });
  var from = input({ type: "date", value: c.from, id: "cy-from" }), to = input({ type: "date", value: c.to, id: "cy-to" });
  var selfDue = input({ type: "date", value: c.selfDue || "", id: "cy-self" }), mgrDue = input({ type: "date", value: c.managerDue || "", id: "cy-mgr" });
  var comps = textarea({ rows: 6, id: "cy-comps", value: c.competencies.map(function (k) { return L(k.name); }).join("\n") });
  var oldSelf = selfQuestions(c), oldMgr = mgrQuestions(c);
  var selfQ = textarea({ rows: 3, id: "cy-self-q", value: oldSelf.map(function (q) { return L(q.name); }).join("\n") });
  var mgrQ = textarea({ rows: 4, id: "cy-mgr-q", value: oldMgr.map(function (q) { return L(q.name); }).join("\n") });
  var picks = [];
  var who = isNew ? h("div", { class: "field" }, h("label", null, tr("People in the cycle")),
    h("div", { class: "picklist" }, cycleCandidates().map(function (u) {
      var cb = checkbox(nameOf(u) + " — " + tr("reviewer: {name}", { name: nameOf(u.managerId) }), true, { value: u.id });
      picks.push(cb.input); return cb.el;
    })), h("div", { class: "hint" }, tr("Everyone with a manager in WorkDesk, contractors aside. The reviewer is the person they report to; you can change it later."))) : null;
  var m = modal(isNew ? tr("New review cycle") : tr("Edit review cycle"), h("div", { class: "form" },
    field(tr("Name"), title),
    h("div", { class: "row2" }, field(tr("Period from"), from), field(tr("Period to"), to)),
    h("div", { class: "row2" }, field(tr("Self-assessments due"), selfDue), field(tr("Manager reviews due"), mgrDue)),
    field(tr("Competencies — one per line"), comps, isNew ? null : tr("Ratings already given stay with the competencies they were given for.")),
    field(tr("Self-assessment questions — one per line"), selfQ, tr("Each one is answered in writing. Answers already given stay with their questions.")),
    field(tr("Manager review questions — one per line"), mgrQ, tr("Written answers, before the overall rating.")),
    who), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    btn(isNew ? tr("Start the cycle") : tr("Save"), { kind: "primary", id: "cy-save", onclick: function () {
      if (!need(title) || !need(from) || !need(to)) return;
      if (to.value < from.value) { toast(tr("The period ends before it starts."), "err"); return; }
      var names = comps.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      if (!names.length) { toast(tr("Add at least one competency."), "err"); comps.focus(); return; }
      /* keep the ids of the competencies that stay, so their ratings stay with them */
      c.competencies = names.map(function (n) { var old = c.competencies.filter(function (k) { return L(k.name) === n; })[0]; return old || { id: uid("k"), name: n }; });
      c.selfQuestions = linesToQuestions(selfQ.value, oldSelf); c.mgrQuestions = linesToQuestions(mgrQ.value, oldMgr);
      c.title = title.value.trim(); c.from = from.value; c.to = to.value; c.selfDue = selfDue.value || null; c.managerDue = mgrDue.value || null;
      put("cycles", c);
      if (isNew) picks.filter(function (p) { return p.checked; }).forEach(function (p) { put("reviews", newReview(c, person(p.value))); });
      m.close();
      if (isNew) { go("#/reviews/cycle/" + c.id); toast(tr("The cycle has started."), "ok"); } else { rerender(); toast(tr("Saved."), "ok"); }
    } })], { wide: true });
}
function addToCycle(c) {
  var inIt = reviewsOf(c.id).map(function (r) { return r.employeeId; });
  var rest = people().filter(function (u) { return u.role !== "EXT" && inIt.indexOf(u.id) < 0; }).sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
  var picks = [];
  var m = modal(tr("Add people"), rest.length ? h("div", { class: "picklist" }, rest.map(function (u) { var cb = checkbox(nameOf(u), false, { value: u.id }); picks.push(cb.input); return cb.el; }))
    : empty(tr("Everyone is in this cycle already.")), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    rest.length ? btn(tr("Add"), { kind: "primary", id: "cycle-add-save", onclick: function () {
      picks.filter(function (p) { return p.checked; }).forEach(function (p) { put("reviews", newReview(c, person(p.value))); });
      m.close(); rerender();
    } }) : null]);
}

/* ---------- one review ---------- */
function pageReview(id) {
  var r = byId(db.reviews, id);
  if (!r || r.deleted) return notFound(tr("This review was removed."), "#/reviews");
  var c = byId(db.cycles, r.cycleId);
  if (!c || c.deleted) return notFound(tr("This review was removed."), "#/reviews");
  var isEmp = r.employeeId === ME.id, isMgr = r.managerId === ME.id, admin = isAdmin();
  if (!isEmp && !isMgr && !admin) return notFound(tr("This review isn't yours to see."), "#/reviews");
  var open = c.status !== "closed";
  r = JSON.parse(JSON.stringify(r));
  r.self = r.self || { ratings: {}, notes: {} }; r.mgr = r.mgr || { ratings: {}, notes: {} };
  var comps = c.competencies || [];
  var showSelf = isEmp || r.status !== "self";
  var showMgr = (isMgr && r.status !== "self") || admin && r.status !== "self" || ((r.status === "shared" || r.status === "done") && isEmp);
  var editSelf = isEmp && open && r.status === "self";
  var editMgr = isMgr && open && r.status === "manager";

  var steps = h("ol", { class: "steps" }, REVIEW_STEPS.map(function (st, i) {
    var cur = REVIEW_STEPS.indexOf(r.status);
    return h("li", { class: i < cur ? "past" : i === cur ? "cur" : "" }, h("span", null, String(i + 1)), tr(STEP_LABEL[st]));
  }));
  var save = function (msg, next) {
    var stored = byId(db.reviews, r.id);
    if (next) r.status = next;
    put("reviews", Object.assign({}, stored, { status: r.status, self: r.self, mgr: r.mgr, ack: r.ack, selfAt: r.selfAt, sharedAt: r.sharedAt }));
    toast(msg, "ok"); rerender();
  };
  var ratingsBlock = function (part, editable, prefix) {
    return h("div", { class: "comps" }, comps.map(function (k) {
      var note = editable ? textarea({ rows: 2, value: part.notes[k.id] || "", "aria-label": L(k.name) + " — " + tr("comment"), placeholder: tr("An example or two (optional)"),
        oninput: function (e) { part.notes[k.id] = e.target.value; } }) : h("div", { class: "readonly" }, paragraphs(part.notes[k.id]));
      return h("div", { class: "comp", id: prefix + "-" + k.id },
        h("div", { class: "comp-h" }, h("b", null, L(k.name)), editable ? null : h("span", { class: "muted" }, ratingLabel(part.ratings[k.id]))),
        scale(L(k.name), part.ratings[k.id] || null, RATING.map(tr), function (v) { part.ratings[k.id] = v; }, !editable),
        editable || part.notes[k.id] ? note : null);
    }));
  };
  var longText = function (label, part, key, editable, id) {
    if (!editable && !part[key]) return null;
    if (!editable) return h("div", { class: "field" }, h("label", null, label), h("div", { class: "readonly", id: id }, paragraphs(part[key])));
    return field(label, textarea({ rows: 4, id: id, value: part[key] || "", oninput: function (e) { part[key] = e.target.value; } }));
  };
  var missing = function (part) { return comps.filter(function (k) { return !part.ratings[k.id]; }).length; };

  var selfSec = showSelf ? h("section", { class: "card", id: "self-section" },
    h("div", { class: "sec-h" }, h("h2", null, tr("Self-assessment")), r.selfAt ? h("span", { class: "muted" }, tr("sent {d}", { d: shortDate(r.selfAt.slice(0, 10)) })) : null),
    editSelf ? h("p", { class: "muted" }, tr("Only you see this until you send it to {name}.", { name: nameOf(r.managerId) })) : null,
    ratingsBlock(r.self, editSelf, "self"),
    selfQuestions(c).map(function (q) { return longText(L(q.name), r.self, q.id, editSelf, "self-" + q.id); }),
    editSelf ? h("div", { class: "form-f" },
      btn(tr("Save draft"), { id: "self-save", onclick: function () { save(tr("Draft saved.")); } }),
      btn(tr("Send to my manager"), { kind: "primary", id: "self-submit", onclick: function () {
        if (missing(r.self)) { toast(tr("Rate every competency first."), "err"); return; }
        confirmBox(tr("Send your self-assessment?"), tr("{name} will see it, and you can't change it afterwards.", { name: nameOf(r.managerId) }), tr("Send"), function () { r.selfAt = nowISO(); save(tr("Sent to {name}.", { name: nameOf(r.managerId) }), "manager"); });
      } })) : null) : h("section", { class: "card muted-card" }, icon("lock", 18), h("p", null, tr("{name} is still writing their self-assessment.", { name: firstName(r.employeeId) })));

  var mgrSec = showMgr ? h("section", { class: "card", id: "manager-section" },
    h("div", { class: "sec-h" }, h("h2", null, tr("Manager review")), h("span", { class: "muted" }, nameOf(r.managerId), r.sharedAt ? " · " + tr("shared {d}", { d: shortDate(r.sharedAt.slice(0, 10)) }) : "")),
    editMgr ? h("p", { class: "muted" }, tr("{name} sees this once you share it.", { name: firstName(r.employeeId) })) : null,
    ratingsBlock(r.mgr, editMgr, "mgr"),
    mgrQuestions(c).map(function (q) { return longText(L(q.name), r.mgr, q.id, editMgr, "mgr-" + q.id); }),
    h("div", { class: "field" }, h("label", null, tr("Overall rating")), scale(tr("Overall rating"), r.mgr.overall || null, RATING.map(tr), function (v) { r.mgr.overall = v; }, !editMgr),
      !editMgr ? h("div", { class: "hint" }, ratingLabel(r.mgr.overall)) : null),
    editMgr ? h("div", { class: "form-f" },
      btn(tr("Save draft"), { id: "mgr-save", onclick: function () { save(tr("Draft saved.")); } }),
      btn(tr("Share with {name}", { name: firstName(r.employeeId) }), { kind: "primary", id: "mgr-share", onclick: function () {
        if (missing(r.mgr) || !r.mgr.overall) { toast(tr("Rate every competency and the overall rating first."), "err"); return; }
        confirmBox(tr("Share the review?"), tr("{name} will read it and acknowledge it. It can't change afterwards.", { name: firstName(r.employeeId) }), tr("Share"), function () { r.sharedAt = nowISO(); save(tr("Shared with {name}.", { name: firstName(r.employeeId) }), "shared"); });
      } })) : null) : (r.status === "self" ? null : h("section", { class: "card muted-card" }, icon("lock", 18), h("p", null, tr("{name} is writing the manager review.", { name: nameOf(r.managerId) }))));

  var ackText = textarea({ rows: 3, id: "ack-text", placeholder: tr("Anything you'd like to add (optional)") });
  var ackSec = r.status === "shared" && isEmp && open ? h("section", { class: "card", id: "ack-section" },
    h("h2", null, tr("Acknowledge")), h("p", { class: "muted" }, tr("Acknowledging says you've read the review and talked it over — not that you agree with every word.")), ackText,
    h("div", { class: "form-f" }, btn(tr("Acknowledge the review"), { kind: "primary", id: "ack-submit", onclick: function () { r.ack = { at: nowISO(), comment: ackText.value.trim() }; save(tr("Thank you. The review is complete."), "done"); } })))
    : r.ack ? h("section", { class: "card", id: "ack-section" }, h("h2", null, tr("Acknowledged")), h("p", { class: "muted" }, longDate(r.ack.at.slice(0, 10))), r.ack.comment ? h("div", { class: "body" }, paragraphs(r.ack.comment)) : null) : null;

  return h("div", { class: "reader wide", "data-keep": editSelf || editMgr || (r.status === "shared" && isEmp) ? "1" : null },
    h("a", { class: "back", href: "#/reviews" }, icon("back", 15), tr("Performance reviews")),
    h("div", { class: "card rv-head" },
      avatar(r.employeeId, 52),
      h("div", { class: "grow" }, h("h1", null, nameOf(r.employeeId)), h("p", { class: "muted" }, L(c.title), " · ", shortDate(c.from) + " – " + shortDate(c.to), " · ", tr("Reviewer: {name}", { name: nameOf(r.managerId) }))),
      admin && r.status !== "self" && open ? btn(tr("Return to the previous step"), { sm: true, id: "rv-back", onclick: function () {
        confirmBox(tr("Return the review to the previous step?"), tr("Whoever wrote the last step can change it again."), tr("Return"), function () { if (r.status === "done") r.ack = null; save(tr("Returned."), REVIEW_STEPS[REVIEW_STEPS.indexOf(r.status) - 1]); });
      } }) : null),
    steps,
    !open ? h("p", { class: "note" }, icon("lock", 14), " " + tr("This cycle is closed; the review can't change.")) : null,
    selfSec, mgrSec, ackSec);
}
