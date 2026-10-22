/* =====================================================================
   GALIL HR — surveys: HR admins build them, everyone answers once, the
   results add up by question.
   An anonymous survey keeps who answered (to ask each person once) apart
   from what they answered: the answers carry no name and no time.
   ===================================================================== */
"use strict";

var Q_TYPES = [["rating", "Rating 1–5"], ["nps", "0–10 scale (would you recommend…)"], ["choice", "One choice"], ["multi", "Several choices"], ["text", "Written answer"]];
var RATE5 = ["Very poor", "Poor", "OK", "Good", "Excellent"];
var STATE_LABEL = { draft: "Draft", open: "Open", closed: "Closed" };
var STATE_CHIP = { draft: "amber", open: "ok", closed: "mut" };

function surveyRow(s) {
  var st = surveyState(s), taken = hasTaken(s.id), n = takenCount(s.id), total = people().length;
  return h("a", { class: "row-card", href: "#/surveys/" + s.id },
    h("div", { class: "rc-icon" }, icon("survey", 22)),
    h("div", { class: "rc-main" },
      h("div", { class: "rc-top" }, chip(tr(STATE_LABEL[st]), STATE_CHIP[st]), s.anonymous ? chip(tr("Anonymous"), "mut") : null,
        st === "open" ? chip(taken ? tr("You answered") : tr("Waiting for your answer"), taken ? "ok" : "pink") : null),
      h("b", null, L(s.title)),
      s.description ? h("p", null, excerpt(L(s.description), 140)) : null,
      h("div", { class: "rc-meta" }, tr("{n} questions", { n: s.questions.length }),
        s.closes ? " · " + (st === "closed" ? tr("closed {d}", { d: shortDate(s.closes) }) : tr("closes {d}", { d: shortDate(s.closes) })) : "",
        isAdmin() || canSeeResults(s) ? " · " + tr("{n} of {t} answered", { n: n, t: total }) : "")));
}
function pageSurveys() {
  var list = surveysList();
  return h("div", null,
    pageHead(tr("Surveys"), tr("Tell us what you think. Anonymous surveys never show who said what."),
      isAdmin() ? btn(tr("New survey"), { kind: "primary", icon: "plus", id: "survey-new", onclick: function () { go("#/surveys/new/edit"); } }) : null),
    list.length ? h("div", { class: "list" }, list.map(surveyRow)) : empty(tr("No surveys yet.")));
}

/* ---------- answering ---------- */
function pageSurvey(id) {
  var s = byId(db.surveys, id);
  if (!s || s.deleted) return notFound(tr("This survey was removed."), "#/surveys");
  var st = surveyState(s), taken = hasTaken(s.id);
  var adminBar = isAdmin() ? h("div", { class: "post-actions" },
    st === "draft" ? btn(tr("Open the survey"), { kind: "primary", sm: true, id: "survey-open", onclick: function () { s.status = "open"; if (s.closes && s.closes < today()) s.closes = null; put("surveys", s); toast(tr("The survey is open."), "ok"); rerender(); } }) : null,
    st === "open" ? btn(tr("Close now"), { sm: true, id: "survey-close", onclick: function () { s.status = "closed"; put("surveys", s); toast(tr("The survey is closed."), "ok"); rerender(); } }) : null,
    st === "closed" ? btn(tr("Reopen"), { sm: true, onclick: function () { s.status = "open"; if (s.closes && s.closes < today()) s.closes = null; put("surveys", s); rerender(); } }) : null,
    link(tr("Results"), "#/surveys/" + s.id + "/results", { sm: true, icon: "chart", id: "survey-results" }),
    link(tr("Edit"), "#/surveys/" + s.id + "/edit", { sm: true, icon: "edit", id: "survey-edit" }),
    btn(tr("Delete"), { sm: true, kind: "danger-t", icon: "trash", onclick: function () {
      confirmBox(tr("Delete this survey?"), tr("Its answers are deleted too."), tr("Delete"), function () {
        remove("surveys", s.id);
        responsesOf(s.id).forEach(function (r) { remove("responses", r.id); });
        live(db.taken).filter(function (t) { return t.surveyId === s.id; }).forEach(function (t) { remove("taken", t.id); });
        go("#/surveys"); toast(tr("Survey deleted."));
      });
    } })) : null;
  var head = [h("a", { class: "back", href: "#/surveys" }, icon("back", 15), tr("All surveys")),
    h("div", { class: "card post" },
      h("div", { class: "rc-top" }, chip(tr(STATE_LABEL[st]), STATE_CHIP[st]), s.anonymous ? chip(tr("Anonymous"), "mut") : null),
      h("h1", null, L(s.title)),
      s.description ? h("div", { class: "body" }, paragraphs(L(s.description))) : null,
      h("p", { class: "muted" }, s.anonymous ? tr("Anonymous: your answers are saved without your name.") : tr("Not anonymous: HR sees who gave each answer."),
        s.closes ? " " + tr("Open until {d}.", { d: longDate(s.closes) }) : ""),
      adminBar)];
  if (taken) return h("div", { class: "reader" }, head, h("div", { class: "card done", id: "survey-thanks" }, icon("check", 26), h("h2", null, tr("Thank you — your answers are in.")),
    canSeeResults(s) ? link(tr("See the results"), "#/surveys/" + s.id + "/results", { kind: "primary", icon: "chart" }) : h("p", { class: "muted" }, tr("HR will share what comes out of it."))));
  if (st !== "open") return h("div", { class: "reader" }, head, empty(st === "draft" ? tr("This survey isn't open yet.") : tr("This survey is closed."),
    canSeeResults(s) ? link(tr("See the results"), "#/surveys/" + s.id + "/results", { kind: "primary", icon: "chart" }) : null));

  var answers = {};
  var form = h("form", { class: "card survey-form", id: "survey-form", onsubmit: function (ev) { ev.preventDefault(); } },
    s.questions.map(function (q, i) {
      var block = h("fieldset", { class: "q", "data-q": q.id }, h("legend", null, h("span", { class: "qn" }, String(i + 1)), L(q.text), q.required ? h("span", { class: "req", title: tr("Required") }, " *") : null));
      if (q.type === "rating") block.appendChild(scale(L(q.text), null, RATE5.map(tr), function (v) { answers[q.id] = v; }));
      else if (q.type === "nps") block.appendChild(h("div", null, scale(L(q.text), null, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String), function (v) { answers[q.id] = v; }),
        h("div", { class: "scale-ends" }, h("span", null, tr("Not at all likely")), h("span", null, tr("Extremely likely")))));
      else if (q.type === "choice" || q.type === "multi") block.appendChild(h("div", { class: "opts" }, q.options.map(function (o, k) {
        var c = h("input", { type: q.type === "choice" ? "radio" : "checkbox", name: "q-" + q.id, value: k, onchange: function () {
          if (q.type === "choice") answers[q.id] = k;
          else answers[q.id] = Array.prototype.map.call(block.querySelectorAll("input:checked"), function (x) { return +x.value; });
        } });
        return h("label", { class: "check" }, c, h("span", null, L(o)));
      })));
      else block.appendChild(textarea({ rows: 3, "aria-label": L(q.text), oninput: function (ev) { answers[q.id] = ev.target.value; } }));
      return block;
    }),
    h("div", { class: "form-f" }, btn(tr("Send my answers"), { kind: "primary", id: "survey-submit", onclick: function () {
      var missing = s.questions.filter(function (q) {
        var a = answers[q.id];
        return q.required && (a == null || a === "" || (Array.isArray(a) && !a.length) || (typeof a === "string" && !a.trim()));
      })[0];
      if (missing) {
        var el = form.querySelector('[data-q="' + missing.id + '"]');
        el.classList.add("bad"); el.scrollIntoView({ block: "center" }); toast(tr("Please answer every question marked *."), "err");
        setTimeout(function () { el.classList.remove("bad"); }, 2500); return;
      }
      var clean = {};
      Object.keys(answers).forEach(function (k) { var a = answers[k]; if (typeof a === "string") a = a.trim(); if (a !== "" && a != null) clean[k] = a; });
      var resp = { id: uid("rs"), surveyId: s.id, answers: clean };
      if (!s.anonymous) { resp.userId = ME.id; resp.at = nowISO(); } else resp.month = today().slice(0, 7);
      put("responses", resp);
      put("taken", { id: s.id + ":" + ME.id, surveyId: s.id, userId: ME.id });
      toast(tr("Thank you — your answers are in."), "ok"); rerender();
    } })));
  return h("div", { class: "reader" }, head, form);
}

/* ---------- results ---------- */
function pageSurveyResults(id) {
  var s = byId(db.surveys, id);
  if (!s || s.deleted) return notFound(tr("This survey was removed."), "#/surveys");
  if (!canSeeResults(s)) return notFound(tr("The results of this survey are for HR only."), "#/surveys/" + id);
  var rs = responsesOf(s.id), total = people().length, n = takenCount(s.id);
  var blocks = s.questions.map(function (q, i) {
    var vals = rs.map(function (r) { return r.answers ? r.answers[q.id] : null; }).filter(function (v) { return v != null && v !== ""; });
    var body;
    if (q.type === "rating" || q.type === "nps") {
      var max = q.type === "nps" ? 10 : 5, min = q.type === "nps" ? 0 : 1, counts = [];
      for (var v = min; v <= max; v++) counts.push(vals.filter(function (x) { return x === v; }).length);
      var avg = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : 0;
      var extra = null;
      if (q.type === "nps" && vals.length) {
        var pro = vals.filter(function (x) { return x >= 9; }).length, det = vals.filter(function (x) { return x <= 6; }).length;
        extra = h("span", { class: "chip " + (pro >= det ? "ok" : "amber") }, tr("Net score {n}", { n: Math.round((pro - det) * 100 / vals.length) }));
      }
      body = h("div", null,
        h("div", { class: "kpi" }, h("b", null, vals.length ? avg.toFixed(1) : "—"), h("span", { class: "muted" }, tr("average of {n} answers", { n: vals.length })), extra),
        h("div", { class: "bars" }, counts.map(function (c, k) { return bar(c, vals.length, q.type === "rating" ? (k + 1) + " · " + tr(RATE5[k]) : String(k)); })));
    } else if (q.type === "choice" || q.type === "multi") {
      var cs = q.options.map(function (o, k) { return vals.filter(function (x) { return Array.isArray(x) ? x.indexOf(k) >= 0 : x === k; }).length; });
      body = h("div", { class: "bars" }, q.options.map(function (o, k) { return bar(cs[k], vals.length, L(o)); }),
        q.type === "multi" ? h("p", { class: "muted" }, tr("People could choose several.")) : null);
    } else {
      body = vals.length ? h("ul", { class: "texts" }, vals.map(function (t, k) {
        var r = rs.filter(function (x) { return x.answers && x.answers[q.id] === t; })[0];
        return h("li", null, t, !s.anonymous && r && r.userId && isAdmin() ? h("span", { class: "muted" }, " — " + nameOf(r.userId)) : null);
      })) : h("p", { class: "muted" }, tr("No written answers yet."));
    }
    return h("section", { class: "card q-res" }, h("h3", null, h("span", { class: "qn" }, String(i + 1)), L(q.text)), body);
  });
  return h("div", { class: "reader wide" },
    h("a", { class: "back", href: "#/surveys/" + s.id }, icon("back", 15), L(s.title)),
    pageHead(tr("Results: {t}", { t: L(s.title) }), tr("{n} of {t} people answered ({p}%).", { n: n, t: total, p: total ? Math.round(n * 100 / total) : 0 }),
      isAdmin() ? btn(tr("Download the answers (CSV)"), { icon: "download", id: "survey-csv", onclick: function () { download(safeFile(L(s.title)) + ".csv", surveyCsv(s), "text/csv"); } }) : null),
    h("div", { class: "card" }, bar(n, total, tr("Participation"))),
    rs.length ? blocks : empty(tr("No answers yet.")));
}
function surveyCsv(s) {
  var head = (s.anonymous ? [] : ["Name", "Email", "Answered"]).concat(s.questions.map(function (q) { return L(q.text); }));
  var rows = responsesOf(s.id).map(function (r) {
    var u = r.userId ? person(r.userId) : null;
    return (s.anonymous ? [] : [u ? u.fullName : "", u ? u.email : "", (r.at || "").slice(0, 10)]).concat(s.questions.map(function (q) {
      var a = r.answers ? r.answers[q.id] : null;
      if (a == null) return "";
      if (q.type === "choice") return L(q.options[a]);
      if (q.type === "multi") return a.map(function (k) { return L(q.options[k]); }).join("; ");
      return a;
    }));
  });
  return "﻿" + [head].concat(rows).map(function (r) { return r.map(csvCell).join(","); }).join("\n");
}

/* ---------- building a survey (HR admins) ---------- */
function pageSurveyEdit(id) {
  if (!isAdmin()) return notFound(tr("Only HR admins build surveys."), "#/surveys");
  var orig = id === "new" ? null : byId(db.surveys, id);
  if (id !== "new" && (!orig || orig.deleted)) return notFound(tr("This survey was removed."), "#/surveys");
  var s = orig ? JSON.parse(JSON.stringify(orig)) : { id: uid("sv"), status: "draft", anonymous: true, showResults: false, createdBy: ME.id, createdAt: nowISO(),
    questions: [{ id: uid("q"), type: "rating", text: "", required: true, options: [] }] };
  var locked = orig && responsesOf(orig.id).length > 0;
  var title = input({ value: L(s.title), id: "sv-title" }), desc = textarea({ rows: 3, value: L(s.description), id: "sv-desc" });
  var closes = input({ type: "date", value: s.closes || "", id: "sv-closes" });
  var anon = checkbox(tr("Anonymous — answers are saved without names"), !!s.anonymous, { id: "sv-anon", disabled: locked });
  var show = checkbox(tr("People see the results after answering"), !!s.showResults, { id: "sv-show" });
  var qwrap = h("div", { class: "qlist", id: "sv-questions" });
  var draw = function () {
    qwrap.innerHTML = "";
    s.questions.forEach(function (q, i) {
      var text = input({ value: L(q.text), "aria-label": tr("Question {n}", { n: i + 1 }), class: "inp q-text", disabled: locked, oninput: function (e) { q.text = e.target.value; } });
      var type = select(trList(Q_TYPES), q.type, { class: "inp q-type", "aria-label": tr("Kind of answer"), disabled: locked, onchange: function (e) { q.type = e.target.value; if (/choice|multi/.test(q.type) && !q.options.length) q.options = ["", ""]; draw(); } });
      var opts = /choice|multi/.test(q.type) ? field(tr("Choices — one per line"), textarea({ rows: Math.max(3, q.options.length), class: "inp q-opts", value: q.options.map(L).join("\n"), disabled: locked,
        oninput: function (e) { q.options = e.target.value.split("\n"); } })) : null;
      var req = checkbox(tr("Required"), q.required !== false, { disabled: locked, onchange: function (e) { q.required = e.target.checked; } });
      var move = function (d) { var j = i + d; if (j < 0 || j >= s.questions.length) return; var t = s.questions[i]; s.questions[i] = s.questions[j]; s.questions[j] = t; draw(); };
      qwrap.appendChild(h("div", { class: "card qedit" },
        h("div", { class: "qe-top" }, h("span", { class: "qn" }, String(i + 1)), text, type),
        opts,
        h("div", { class: "qe-foot" }, req.el, h("span", { class: "grow" }),
          locked ? null : [btn("", { sm: true, kind: "ghost icon", icon: "chevl", title: tr("Move up"), onclick: function () { move(-1); } }),
            btn("", { sm: true, kind: "ghost icon", icon: "chevr", title: tr("Move down"), onclick: function () { move(1); } }),
            btn(tr("Remove"), { sm: true, kind: "danger-t", disabled: s.questions.length < 2, onclick: function () { s.questions.splice(i, 1); draw(); } })])));
    });
  };
  draw();
  function save(status) {
    if (!need(title)) return;
    for (var i = 0; i < s.questions.length; i++) {
      var q = s.questions[i];
      if (!String(L(q.text)).trim()) { toast(tr("Question {n} has no text.", { n: i + 1 }), "err"); qwrap.querySelectorAll(".q-text")[i].focus(); return; }
      if (/choice|multi/.test(q.type)) {
        q.options = q.options.map(function (o) { return typeof o === "string" ? o.trim() : o; }).filter(function (o) { return L(o); });
        if (q.options.length < 2) { toast(tr("Question {n} needs at least two choices.", { n: i + 1 }), "err"); return; }
      } else q.options = [];
    }
    if (status === "open" && closes.value && closes.value < today()) { toast(tr("The closing date has passed."), "err"); closes.focus(); return; }
    s.title = title.value.trim(); s.description = desc.value.trim(); s.closes = closes.value || null;
    s.anonymous = anon.input.checked; s.showResults = show.input.checked;
    if (status) s.status = status;
    put("surveys", s);
    toast(status === "open" ? tr("The survey is open.") : tr("Saved."), "ok");
    go("#/surveys/" + s.id);
  }
  return h("div", { class: "reader wide", "data-keep": "1" },
    h("a", { class: "back", href: orig ? "#/surveys/" + s.id : "#/surveys" }, icon("back", 15), tr("Back")),
    pageHead(orig ? tr("Edit survey") : tr("New survey"), locked ? tr("People have already answered, so the questions can't change any more.") : null),
    h("div", { class: "card form" }, field(tr("Title"), title), field(tr("Introduction"), desc),
      h("div", { class: "row2" }, field(tr("Open until"), closes, tr("Empty: until HR closes it.")), h("div", { class: "field" }, anon.el, show.el)),
      orig && orig.anonymous && locked ? h("p", { class: "hint" }, icon("lock", 13), " " + tr("Anonymity can't be changed once people have answered.")) : null),
    h("h2", { class: "month-h" }, tr("Questions")),
    qwrap,
    locked ? null : btn(tr("Add a question"), { icon: "plus", id: "sv-add", onclick: function () { s.questions.push({ id: uid("q"), type: "rating", text: "", required: true, options: [] }); draw(); var all = qwrap.querySelectorAll(".q-text"); all[all.length - 1].focus(); } }),
    h("div", { class: "form-f sticky" },
      link(tr("Cancel"), orig ? "#/surveys/" + s.id : "#/surveys"),
      btn(tr("Save"), { id: "sv-save", onclick: function () { save(null); } }),
      surveyState(s) === "draft" ? btn(tr("Save and open"), { kind: "primary", id: "sv-publish", onclick: function () { save("open"); } }) : null));
}
