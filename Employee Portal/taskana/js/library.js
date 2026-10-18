/* =====================================================================
   Taskana — Library: the team's research notebook. Rich documents for
   gathering and working through what subject-matter experts say in
   interviews, site visits and walkthroughs at the client: headings,
   lists, checklists, tables, images, code, callouts, Q&A, follow-ups and
   terms, with tools that turn a raw dump of notes into a structured
   document (outline, table of contents, tidy code) and export it to Word,
   HTML, Markdown or print.
   Documents live in Taskana's data (db.library) as sanitised HTML.
   ===================================================================== */
"use strict";

var LIB_KINDS = ["SME interview", "Site visit", "Walkthrough", "Research notes", "Meeting notes", "Other"];
var LIB_STATUS = ["Draft", "In review", "Final"];
var LIB_STATUS_CHIP = { "Draft": "", "In review": "amber", "Final": "green" };
var lib = { q: "", kind: "", status: "", clientId: "", side: "outline", timer: null, anchor: null, listOpen: false };

/* ---------- data ---------- */
function libDocs() {
  if (!db.library) db.library = [];
  var u = me();
  return db.library.filter(function (d) { return !d.private || d.authorId === u.id; });
}
function libCanRead() { return can.seeEverything(); }
function libCanWrite(d) { return roleOf() !== "Viewer" && (!d || !d.private || d.authorId === me().id); }
function libCanDelete(d) { return d.authorId === me().id || isManager(); }

/* once: bring in the items WorkDesk's old Library tab kept, and a worked example on demo data */
function libInit() {
  if (!db.library) db.library = [];
  if (db.libraryImported) return;
  var wd = wdData(), n = 0;
  ((wd && wd.library) || []).forEach(function (l) {
    if (byId(db.library, l.id)) return;
    var html = String(l.body || "").split(/\n{2,}/).map(function (p) { return "<p>" + libEsc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
    if (l.link) html += '<p><a href="' + libEsc(l.link) + '">' + libEsc(l.link) + "</a></p>";
    if (l.imageUrl && /^data:image\//.test(l.imageUrl)) html += '<p><img src="' + l.imageUrl + '" alt=""></p>';
    db.library.push({ id: l.id, title: l.title || tr("Untitled"), kind: "Research notes", status: "Final", html: libClean(html),
      tags: l.tags || [], projectId: l.projectId || "", clientId: (byId(db.projects, l.projectId || "") || {}).clientId || "",
      taskId: "", sme: "", smeRole: "", date: String(l.createdAt || nowISO()).slice(0, 10), place: "",
      private: !!l.isPrivate, authorId: l.authorUserId || me().id, createdAt: l.createdAt || nowISO(), updatedAt: l.createdAt || nowISO(), updatedBy: l.authorUserId || me().id });
    n++;
  });
  if (!db.library.some(function (d) { return d.kind === "SME interview"; }) && db.projects.some(function (p) { return /^p-(iai|elb|mob|cmd|gws|hft)1$/.test(p.id); })) db.library.push(libSample());
  db.libraryImported = true;
  save(true);
}
function libSample() {
  var p = db.projects.filter(function (x) { return /^p-iai1$/.test(x.id); })[0] || db.projects[0] || {};
  var t = nowISO();
  return { id: uid("lib"), title: "SME interview — radar power-up and self-test", kind: "SME interview", status: "Draft",
    clientId: p.clientId || "", projectId: p.id || "", taskId: "", sme: "Yossi Levi", smeRole: "Senior systems engineer",
    date: today(), place: "Client site — integration lab", tags: ["power-up", "BIT"], private: false,
    authorId: me().id, createdAt: t, updatedAt: t, updatedBy: me().id,
    html: libClean(libTemplate("SME interview")
      .replace("<p>What we need to learn in this session.</p>", "<p>Confirm the power-up sequence and the built-in test (BIT) the operator sees, for chapter 3 of the Operator Manual.</p>")
      .replace('<p class="q">Question</p><p class="a">Answer</p>', '<p class="q">What does the operator do first when powering up?</p><p class="a">Main breaker on the rack, then the console switch. The console shows the boot screen for about 40 seconds before BIT starts.</p><p class="q">Which BIT results stop the operator?</p><p class="a">Any red result on the transmitter or the cooling loop. Amber results are logged and the operator may continue. <mark class="fu">Get the full list of amber codes from Yossi.</mark></p>'))
  };
}

/* ---------- templates ---------- */
function libTemplate(kind) {
  var he = LANG === "he";
  var T = function (en, hb) { return he ? hb : en; };
  var details = function (rows) {
    return "<table><tbody>" + rows.map(function (r) { return "<tr><th>" + r + "</th><td><br></td></tr>"; }).join("") + "</tbody></table>";
  };
  if (kind === "SME interview") return "<h1>" + T("Interview details", "פרטי הראיון") + "</h1>" +
    details([T("Subject-matter expert", "מומחה/ית תוכן"), T("Role", "תפקיד"), T("Date and place", "תאריך ומקום"), T("Attendees", "משתתפים"), T("Recording", "הקלטה")]) +
    "<h1>" + T("Goals", "מטרות") + "</h1><p>" + T("What we need to learn in this session.", "מה צריך ללמוד בפגישה הזו.") + "</p>" +
    "<h1>" + T("Questions and answers", "שאלות ותשובות") + "</h1><div class=\"qa\"><p class=\"q\">" + T("Question", "שאלה") + "</p><p class=\"a\">" + T("Answer", "תשובה") + "</p></div>" +
    "<h1>" + T("Procedures described", "נהלים שתוארו") + "</h1><ol><li><br></li></ol>" +
    "<h1>" + T("Terminology", "מונחים") + "</h1><p><br></p>" +
    "<h1>" + T("Follow-ups", "המשך טיפול") + "</h1><ul class=\"check\"><li><br></li></ul>";
  if (kind === "Site visit") return "<h1>" + T("Visit details", "פרטי הביקור") + "</h1>" +
    details([T("Site", "אתר"), T("Date", "תאריך"), T("Hosted by", "מארח/ת"), T("Equipment and versions", "ציוד וגרסאות")]) +
    "<h1>" + T("What we observed", "מה ראינו") + "</h1><p><br></p>" +
    "<h1>" + T("Procedures observed", "נהלים שנצפו") + "</h1><ol><li><br></li></ol>" +
    "<h1>" + T("Photos and screens", "תמונות ומסכים") + "</h1><p><br></p>" +
    "<div class=\"callout warn\"><p>" + T("Safety notes", "הערות בטיחות") + "</p></div>" +
    "<h1>" + T("Follow-ups", "המשך טיפול") + "</h1><ul class=\"check\"><li><br></li></ul>";
  if (kind === "Walkthrough") return "<h1>" + T("System and version", "מערכת וגרסה") + "</h1><p><br></p>" +
    "<h1>" + T("Steps shown", "השלבים שהוצגו") + "</h1><ol><li><br></li></ol>" +
    "<h1>" + T("Screens and messages", "מסכים והודעות") + "</h1><table><thead><tr><th>" + T("Screen", "מסך") + "</th><th>" + T("What it does", "מה הוא עושה") + "</th><th>" + T("Notes", "הערות") + "</th></tr></thead><tbody><tr><td><br></td><td><br></td><td><br></td></tr></tbody></table>" +
    "<h1>" + T("Follow-ups", "המשך טיפול") + "</h1><ul class=\"check\"><li><br></li></ul>";
  if (kind === "Research notes") return "<h1>" + T("Sources", "מקורות") + "</h1><ul><li><br></li></ul>" +
    "<h1>" + T("Findings", "ממצאים") + "</h1><p><br></p>" +
    "<h1>" + T("Open questions", "שאלות פתוחות") + "</h1><ul class=\"check\"><li><br></li></ul>";
  if (kind === "Meeting notes") return "<h1>" + T("Agenda", "סדר יום") + "</h1><ol><li><br></li></ol>" +
    "<h1>" + T("Decisions", "החלטות") + "</h1><ul><li><br></li></ul>" +
    "<h1>" + T("Action items", "משימות") + "</h1><ul class=\"check\"><li><br></li></ul>";
  return "<p><br></p>";
}

/* ---------- the page ---------- */
function pageLibrary(id, anchor) {
  if (!libCanRead()) return notFound(tr("No access"), tr("Outsourced accounts see the tasks they work on. Ask a Manager if you need more."));
  libInit();
  var docs = libDocs(), doc = id ? byId(docs, id) : null;
  if (id && !doc) return notFound(tr("Document not found"), tr("It may have been deleted, or it is private."));
  if (anchor) lib.anchor = anchor;
  var list = libList(docs, doc);
  return {
    title: doc ? doc.title || tr("Untitled") : tr("Library"),
    crumbs: doc ? h("span", null, h("a", { href: "#/library" }, tr("Library")), " · ", tr(doc.kind || "Other")) : tr("Research from subject-matter experts, site visits and walkthroughs"),
    actions: h("div", { class: "row" },
      doc ? h("button", { class: "btn" + (lib.listOpen ? " on" : ""), "aria-pressed": lib.listOpen ? "true" : "false", title: tr("Show or hide the list of documents"),
        onclick: function () { lib.listOpen = !lib.listOpen; var b = document.querySelector(".lib"); if (b) b.classList.toggle("list-open", lib.listOpen); this.classList.toggle("on", lib.listOpen); this.setAttribute("aria-pressed", lib.listOpen ? "true" : "false"); } }, icon("list"), tr("Documents")) : null,
      libCanWrite() ? libNewBtn() : null),
    body: h("div", { class: "lib" + (doc ? " has-doc" : " list-open") + (doc && lib.listOpen ? " list-open" : "") }, list, doc ? libDocView(doc) : libEmpty(docs))
  };
}
function libNewBtn() {
  var wrap = h("div", { class: "lib-new" });
  var menu = h("div", { class: "lib-menu", hidden: true }, LIB_KINDS.concat(["Blank"]).map(function (k) {
    return h("button", { onclick: function () { menu.hidden = true; libCreate(k); } }, k === "Blank" ? tr("Blank document") : tr(k));
  }));
  wrap.append(h("button", { class: "btn primary", "aria-haspopup": "true", onclick: function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; } }, icon("plus"), tr("New document")), menu);
  document.addEventListener("click", function () { menu.hidden = true; }, { once: true });
  return wrap;
}
function libCreate(kind) {
  var t = nowISO(), f = ui.filters || {};
  var d = { id: uid("lib"), title: kind === "Blank" ? tr("Untitled") : tr(kind) + " — " + fmtDate(today()), kind: kind === "Blank" ? "Other" : kind, status: "Draft",
    clientId: lib.clientId || f.clientId || "", projectId: "", taskId: "", sme: "", smeRole: "", date: today(), place: "", tags: [], private: false,
    html: libClean(libTemplate(kind)), authorId: me().id, createdAt: t, updatedAt: t, updatedBy: me().id };
  db.library.unshift(d); save(true);
  lib.side = "details";
  go("library/" + d.id);
}
function libEmpty(docs) {
  return h("div", { class: "card lib-empty" },
    h("h2", null, tr("Collect what the experts tell you")),
    h("p", { class: "muted" }, tr("Start from a template for an SME interview, a site visit or a walkthrough, or paste a raw dump of notes and let Organize turn it into headings, lists and a table of contents.")),
    docs.length ? h("p", { class: "muted small" }, tr("Pick a document on the left to open it.")) : null);
}
function libList(docs, cur) {
  var items = h("div", { class: "lib-items" });
  /* filtering redraws only the list, never the open document */
  var fill = function () {
    var q = lib.q.trim().toLowerCase();
    var rows = docs.filter(function (d) {
      if (lib.kind && d.kind !== lib.kind) return false;
      if (lib.status && d.status !== lib.status) return false;
      if (lib.clientId && d.clientId !== lib.clientId) return false;
      if (q) {
        var hay = [d.title, d.sme, d.smeRole, d.place, (d.tags || []).join(" "), libText(d.html)].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
    items.replaceChildren.apply(items, rows.length ? rows.map(function (d) {
      var fu = (String(d.html).match(/class="fu"/g) || []).length;
      var p = byId(db.projects, d.projectId), c = byId(db.clients, d.clientId);
      return h("a", { class: "lib-item" + (cur && cur.id === d.id ? " on" : ""), href: "#/library/" + d.id },
        h("b", { class: "ellipsis", dir: "auto" }, d.locked ? "🔒 " : "", d.title || tr("Untitled")),
        h("span", { class: "row", style: { gap: "5px" } },
          h("span", { class: "chip teal" }, tr(d.kind || "Other")),
          h("span", { class: "chip " + (LIB_STATUS_CHIP[d.status] || "") }, tr(d.status || "Draft")),
          fu ? h("span", { class: "chip amber", title: tr("Open follow-ups") }, "? " + fu) : null,
          d.private ? h("span", { class: "chip" }, tr("Private")) : null),
        h("span", { class: "muted small ellipsis" }, [c ? c.name : "", p ? p.name : "", d.sme].filter(Boolean).join(" · ") || "—"),
        h("span", { class: "muted small" }, userName(d.updatedBy || d.authorId), " · ", fmtWhen(d.updatedAt)));
    }) : [h("div", { class: "muted small", style: { padding: "12px" } }, tr("Nothing matches."))]);
  };
  fill();
  var clients = db.clients.filter(function (c) { return docs.some(function (d) { return d.clientId === c.id; }); });
  return h("aside", { class: "card lib-list", "aria-label": tr("Documents") },
    h("div", { class: "lib-search" },
      h("input", { id: "lib-q", type: "search", placeholder: tr("Search the library…"), value: lib.q, "aria-label": tr("Search the library"),
        oninput: function (e) { lib.q = e.target.value; fill(); } }),
      h("div", { class: "row" },
        h("select", { "aria-label": tr("Kind"), onchange: function (e) { lib.kind = e.target.value; fill(); } },
          [h("option", { value: "" }, tr("All kinds"))].concat(LIB_KINDS.map(function (k) { return h("option", { value: k, selected: lib.kind === k }, tr(k)); }))),
        h("select", { "aria-label": tr("Status"), onchange: function (e) { lib.status = e.target.value; fill(); } },
          [h("option", { value: "" }, tr("Any status"))].concat(LIB_STATUS.map(function (k) { return h("option", { value: k, selected: lib.status === k }, tr(k)); }))),
        clients.length ? h("select", { "aria-label": tr("Client"), onchange: function (e) { lib.clientId = e.target.value; fill(); } },
          [h("option", { value: "" }, tr("All clients"))].concat(clients.map(function (c) { return h("option", { value: c.id, selected: lib.clientId === c.id }, c.name); }))) : null)),
    items);
}

/* plain text of a document, for search and word count */
function libText(html) { var t = document.createElement("template"); t.innerHTML = html || ""; return t.content.textContent || ""; }

/* ---------- one document ---------- */
function libDocView(d) {
  var wrap = edMount(d);
  if (lib.anchor) { ED.anchor = lib.anchor; lib.anchor = null; }   /* the frame scrolls there once it has (re)loaded */
  var tools = h("div", { class: "lib-tools", id: "lib-tools" });
  var view = h("section", { class: "lib-main" }, tools, wrap, h("div", { class: "lib-foot muted small", id: "lib-foot" }));
  var tabs = [["outline", tr("Outline")], ["followups", tr("Follow-ups")], ["terms", tr("Terms")], ["links", tr("Links")], ["details", tr("Details")]];
  var aside = h("aside", { class: "card lib-side" },
    h("div", { class: "seg lib-tabs", role: "tablist" }, tabs.map(function (t) {
      return h("button", { role: "tab", "aria-selected": lib.side === t[0] ? "true" : "false", class: lib.side === t[0] ? "on" : "", onclick: function () { lib.side = t[0]; libSide(d); this.parentNode.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === this); b.setAttribute("aria-selected", b === this ? "true" : "false"); }, this); } }, t[1]);
    })), h("div", { class: "lib-sidebody", id: "lib-side" }));
  setTimeout(function () { libRenderTools(); libSide(d); libFootUpdate(); }, 0);
  return h("div", { class: "lib-docwrap" }, view, aside);
}
function libCur() { return ED.d && db.library ? byId(db.library, ED.d.id) : null; }
function libCanEditNow() { var d = libCur(); return !!d && libCanWrite(d) && !d.locked; }
/* reading is the default: editing is switched on, and off, on purpose */
function libEditMode(on) {
  var d = libCur(); if (!d) return;
  if (on && !libCanWrite(d)) { toast(tr("You can read this document, not edit it.")); return; }
  if (on && d.locked) { toast(tr("This document is locked. Unlock it under Details to edit.")); return; }
  if (!on) { if (ED.mode === "html") edHtmlMode(false); if (ED.pend) edHistPush(); libFlush(); edCloseBar(); }
  ED.editing = !!on; edEditable(); libRenderTools();
  if (on) setTimeout(function () { if (ED.root) { ED.win.focus(); ED.root.focus(); } }, 0);
}
function libRenderTools() {
  var host = document.getElementById("lib-tools"), d = libCur(); if (!host || !d) return;
  if (!ED.editing) {
    var lockMsg = d.locked ? tr("Locked — unlock it under Details to edit.") : !libCanWrite(d) ? tr("Read only") : "";
    host.replaceChildren(h("div", { class: "lib-readbar card" },
      libCanWrite(d) ? h("button", { class: "btn primary sm", id: "lib-edit", disabled: d.locked || null, title: lockMsg || tr("Edit this document (Ctrl+E, or double-click the text)"), onclick: function () { libEditMode(true); } }, icon("edit"), tr("Edit document")) : null,
      d.locked ? h("span", { class: "chip amber" }, "🔒 ", tr("Locked")) : null,
      lockMsg && !d.locked ? h("span", { class: "muted small" }, lockMsg) : null,
      h("span", { class: "sp" }),
      h("button", { class: "btn sm ghost", onclick: edFindBar, title: tr("Find") + " (Ctrl+F)" }, libIcon("find"), tr("Find")),
      libExportMenu()));
    return;
  }
  var right = h("div", { class: "row lib-moderow" },
    h("div", { class: "seg2", role: "group", "aria-label": tr("View") },
      h("button", { class: ED.mode === "visual" ? "on" : "", onclick: function () { edHtmlMode(false); } }, tr("Visual")),
      h("button", { class: ED.mode === "html" ? "on" : "", title: tr("Edit the document as HTML and CSS"), onclick: function () { edHtmlMode(true); } }, "HTML")),
    h("span", { class: "muted small", id: "lib-savestate" }),
    h("button", { class: "btn primary sm", id: "lib-done", title: tr("Stop editing (Ctrl+E)"), onclick: function () { libEditMode(false); } }, icon("check"), tr("Done editing")));
  host.replaceChildren(ED.mode === "visual" ? edToolbar(d) : h("div", { class: "lib-readbar card" }, h("b", { class: "small" }, tr("HTML mode — the preview updates as you type")), h("span", { class: "sp" })), right);
}
function libToolsMenu(d) {
  return edMenu(h("span", { class: "row", style: { gap: "4px" } }, libIcon("tools"), h("span", { class: "lbl" }, tr("Writer tools"))), tr("Writer tools"), function () { return [
    { label: tr("Organize pasted notes into a document"), fn: libOrganize },
    { label: tr("Insert / update table of contents"), fn: libToc },
    { label: tr("Tidy code blocks"), fn: function () { libTidyCode(); } },
    { label: tr("Turn selection into a code block"), fn: libToCode },
    { label: d.numbered ? tr("Stop numbering headings") : tr("Number the headings (1, 1.1, 1.2…)"), fn: function () { d.numbered = !d.numbered; ED.root.classList.toggle("numbered", d.numbered); d.updatedAt = nowISO(); save(true); } },
    "—",
    { label: tr("Insert question and answer"), fn: function () { edInsertHTML('<div class="qa"><p class="q" dir="auto">' + libEsc(tr("Question")) + '</p><p class="a" dir="auto">' + libEsc(tr("Answer")) + '</p></div><p dir="auto"><br></p>'); } },
    { label: tr("Mark selection as a follow-up"), fn: function () { edRestore(); edWrap("mark", "fu"); } },
    { label: tr("Mark selection as a term"), fn: function () { edRestore(); edWrap("span", "term"); } },
    { label: tr("Insert glossary from terms"), fn: libGlossary },
    { label: tr("Custom class…"), fn: edClassBar },
    "—",
    { label: tr("Clean up formatting (whole document)"), fn: function () { edChange(function () { ED.root.innerHTML = libClean(ED.root.innerHTML.replace(/<span>([\s\S]*?)<\/span>/g, "$1")); libMergeEmpty(); }); toast(tr("Formatting cleaned up.")); } },
    { label: tr("Edit the document's CSS…"), fn: function () { ED.srcTab = "css"; edHtmlMode(true); } }]; }, { wide: true, end: true });
}
function libExportMenu() {
  return edMenu(h("span", { class: "row", style: { gap: "4px" } }, libIcon("down"), h("span", { class: "lbl" }, tr("Export"))), tr("Export"), [
    { label: tr("Word document (.doc)"), fn: function () { libExport("doc"); } },
    { label: tr("Web page (.html)"), fn: function () { libExport("html"); } },
    { label: tr("Markdown (.md)"), fn: function () { libExport("md"); } },
    { label: tr("Copy as Markdown"), fn: function () { libFlush(); copy(libMarkdown(ED.root), tr("Markdown copied")); } },
    { label: tr("Print or save as PDF"), keys: "Ctrl+P", fn: function () { libExport("print"); } }], { wide: true, end: true });
}

/* save what is in the editor — debounced while typing */
function libDirty() { clearTimeout(lib.timer); lib.timer = setTimeout(libFlush, 700); libFootUpdate(true); }
function libFlush() {
  clearTimeout(lib.timer); lib.timer = null;
  var d = libCur(); if (!d || !ED.root) return;
  var html = libClean(ED.root.innerHTML);
  if (html !== d.html) { d.html = html; d.updatedAt = nowISO(); d.updatedBy = me().id; save(true); }
  libFootUpdate(false);
}
window.addEventListener("beforeunload", function () { if (lib.timer) libFlush(); });
window.addEventListener("hashchange", function () { if (lib.timer) libFlush(); }, true);
var libSideT = null;
function libAfterChange(now) { if (now) { var d = libCur(); if (d && lib.side !== "details") libSide(d); libFootUpdate(); return; } libAfterChangeSoon(); }
function libAfterChangeSoon() { clearTimeout(libSideT); libSideT = setTimeout(function () { var d = libCur(); if (d && lib.side !== "details") libSide(d); libFootUpdate(); }, 600); }
function libFootUpdate(pending) {
  var el = document.getElementById("lib-foot"), d = libCur(); if (!el || !d || !ED.root) return;
  var words = (ED.root.textContent.match(/[\w֐-׿][\w֐-׿'’-]*/g) || []).length;
  var state = pending || lib.timer ? tr("Saving…") : tr("Saved") + " · " + userName(d.updatedBy || d.authorId) + " · " + fmtWhen(d.updatedAt);
  libFill(el, h("span", null, trn(words, "{n} word", "{n} words"), " · ", tr("about {n} min to read", { n: Math.max(1, Math.round(words / 200)) })),
    ED.editing ? h("span", null, " · ", tr("Editing")) : h("span", null, " · ", tr("Reading")),
    h("span", { class: "sp" }), h("span", null, state));
  var ss = document.getElementById("lib-savestate"); if (ss) ss.textContent = pending || lib.timer ? tr("Saving…") : tr("All changes saved");
}

/* ---------- writer tools ---------- */
function libSlug(t, used) { var b = "h-" + (String(t).toLowerCase().replace(/[^\w֐-׿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "s"), s = b, i = 2; while (used[s]) s = b + "-" + i++; used[s] = 1; return s; }
function libHeadings() { return ED.root ? [].slice.call(ED.root.querySelectorAll("h1, h2, h3, h4")).filter(function (x) { return !x.closest(".toc") && x.textContent.trim(); }) : []; }
function libNeedEdit() { if (!ED.editing) { toast(tr("Switch on editing first.")); return true; } return false; }
/* a table of contents from the headings, at the top (or where the old one was) */
function libToc() {
  if (libNeedEdit()) return;
  var hs = libHeadings();
  if (!hs.length) { toast(tr("Add some headings first — or use Organize on pasted notes.")); return; }
  edChange(function () {
    var used = {};
    [].slice.call(ED.root.querySelectorAll("[id]")).forEach(function (x) { if (hs.indexOf(x) < 0) used[x.id] = 1; });
    hs.forEach(function (x) { x.id = libSlug(x.textContent, used); });
    var html = "<h4>" + libEsc(tr("Contents")) + "</h4>" + hs.map(function (x) { return '<p class="toc' + (Number(x.tagName[1]) - 1) + '" dir="auto"><a href="#' + x.id + '">' + libEsc(x.textContent.trim()) + "</a></p>"; }).join("");
    var old = ED.root.querySelector("div.toc");
    if (old) old.innerHTML = libClean(html);
    else { var box = ED.doc.createElement("div"); box.className = "toc"; box.innerHTML = libClean(html); ED.root.insertBefore(box, ED.root.firstChild); }
  });
  toast(tr("Table of contents updated."));
}
/* turn a raw dump into structure: headings, lists, Q&A, code, callouts — then a table of contents */
function libOrganize() {
  if (libNeedEdit()) return;
  if (ED.saved) edRestore();
  var s = edSel(), blocks = [].slice.call(ED.root.children);
  if (s && s.rangeCount && !s.isCollapsed) blocks = blocks.filter(function (b) { return s.containsNode(b, true); });
  var lines = [];
  blocks.forEach(function (b) {
    if (/^(P|DIV)$/.test(b.tagName) && !/\b(qa|callout|toc|cols|procedure|prereq)\b/.test(b.className)) b.innerHTML.split(/<br\s*\/?>/i).forEach(function (part) { var t = document.createElement("div"); t.innerHTML = part; lines.push({ b: b, html: part, text: (t.textContent || "").replace(/ /g, " ") }); });
  });
  if (!lines.length) { toast(tr("Paste your notes as plain paragraphs, then run Organize.")); return; }
  var out = [], list = null, code = null, flush = function () { if (list) { out.push("<" + list.t + (list.check ? ' class="check"' : "") + ">" + list.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</" + list.t + ">"); list = null; } if (code) { out.push("<pre>" + libEsc(code.join("\n")) + "</pre>"); code = null; } };
  var codeish = function (t) { return /^\s{2,}\S/.test(t) || /[{};]\s*$/.test(t) || /^\s*(\$|#!|<\?xml|<\w+[^>]*>|SELECT |INSERT |UPDATE |def |function |class |import |public |private |var |const |let )/i.test(t); };
  lines.forEach(function (ln) {
    var t = ln.text, tt = t.trim(), m;
    if (code && (codeish(t) || /^\s*[}\])]/.test(t) || (tt === "" && code.length))) { code.push(t.replace(/\s+$/, "")); return; }
    if (codeish(t) && !/^\s*[-*•]\s/.test(t)) { if (list) flush(); code = code || []; code.push(t.replace(/\s+$/, "")); return; }
    if (!tt) { flush(); return; }
    if ((m = /^(#{1,4})\s+(.+)$/.exec(tt))) { flush(); out.push("<h" + m[1].length + ">" + libEsc(m[2]) + "</h" + m[1].length + ">"); return; }
    if ((m = /^(\d+\.\d+(?:\.\d+)?)\.?\s+(.{2,80})$/.exec(tt)) && !/[.;,:]$/.test(tt)) { flush(); var dep = Math.min(3, m[1].split(".").length); out.push("<h" + dep + ">" + libEsc(m[2]) + "</h" + dep + ">"); return; }
    if ((m = /^(\d{1,2})\s+([A-Z֐-׿].{1,60})$/.exec(tt)) && !/[.;,:]$/.test(tt)) { flush(); out.push("<h1>" + libEsc(m[2]) + "</h1>"); return; }
    if (tt.length <= 70 && /:$/.test(tt) && !/^(q|a|question|answer|ש|ת)\s*[:.]/i.test(tt)) { flush(); out.push("<h2>" + libEsc(tt.replace(/:$/, "")) + "</h2>"); return; }
    if (tt.length <= 60 && tt === tt.toUpperCase() && /[A-Z]{3}/.test(tt)) { flush(); out.push("<h1>" + libEsc(tt.charAt(0) + tt.slice(1).toLowerCase()) + "</h1>"); return; }
    if ((m = /^(?:q|question|שאלה|ש)\s*[:.\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="qa"><p class="q">' + libEsc(m[1]) + "</p>"); return; }
    if ((m = /^(?:a|answer|תשובה|ת)\s*[:.\-]\s*(.+)$/i.exec(tt))) { flush(); if (out.length && /^<div class="qa">/.test(out[out.length - 1]) && !/<\/div>$/.test(out[out.length - 1])) out[out.length - 1] += '<p class="a">' + libEsc(m[1]) + "</p></div>"; else out.push('<div class="qa"><p class="a">' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:note|הערה)\s*[:\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="callout note"><p>' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:tip|טיפ)\s*[:\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="callout tip"><p>' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:warning|caution|important|אזהרה|זהירות)\s*[:\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="callout warn"><p>' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:todo|follow[- ]?up|tbd|\?\?|לבדוק|המשך)\s*[:\-]?\s*(.+)$/i.exec(tt))) { flush(); out.push('<p><mark class="fu">' + libEsc(m[1]) + "</mark></p>"); return; }
    if ((m = /^\[( |x)?\]\s*(.+)$/i.exec(tt))) { if (!list || list.t !== "ul" || !list.check) { flush(); list = { t: "ul", check: true, items: [] }; } list.items.push(libEsc(m[2])); return; }
    if ((m = /^[-*•–]\s+(.+)$/.exec(tt))) { if (!list || list.t !== "ul" || list.check) { flush(); list = { t: "ul", items: [] }; } list.items.push(libEsc(m[1])); return; }
    if ((m = /^(?:\d+|[a-z])[.)]\s+(.+)$/i.exec(tt))) { if (!list || list.t !== "ol") { flush(); list = { t: "ol", items: [] }; } list.items.push(libEsc(m[1])); return; }
    flush(); out.push("<p>" + ln.html.trim() + "</p>");
  });
  flush();
  edChange(function () {
    var first = lines[0].b, holder = ED.doc.createElement("div"); holder.innerHTML = libClean(out.join(""));
    var frag = ED.doc.createDocumentFragment(); while (holder.firstChild) frag.appendChild(holder.firstChild);
    first.before(frag);
    var seen = []; lines.forEach(function (l) { if (seen.indexOf(l.b) < 0) { seen.push(l.b); l.b.remove(); } });
    libTidyCode(true, true);
  });
  if (libHeadings().length >= 2) libToc();
  toast(tr("Notes organised: headings, lists, Q&A and code found."));
}
/* pretty-print the code blocks: JSON, XML / HTML, SQL, shell and brace-based languages */
function libTidyCode(quiet, inside) {
  if (!inside && libNeedEdit()) return;
  var n = 0, run = function () {
    [].slice.call(ED.root.querySelectorAll("pre")).forEach(function (pre) {
      var src = pre.textContent.replace(/ /g, " "), out = src, lang = "lang-code", t = src.trim();
      try {
        if (/^[\[{]/.test(t)) { out = JSON.stringify(JSON.parse(t), null, 2); lang = "lang-json"; }
        else if (/^</.test(t)) { out = libXml(t); lang = "lang-xml"; }
        else if (/^\s*(select|insert|update|delete|create|with)\b/i.test(t)) { out = t.replace(/\s+(from|where|and|or|group by|order by|having|join|left join|inner join|values|set)\b/gi, "\n$1"); lang = "lang-sql"; }
        else if (/^\s*(\$|sudo |cd |ls |git |npm |pip |curl )/m.test(t)) { out = t.split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n"); lang = "lang-shell"; }
        else out = libBraces(t);
      } catch (e) { out = libBraces(t); }
      pre.className = lang;
      if (out !== src) { pre.textContent = out; n++; }
    });
  };
  if (inside) run(); else edChange(run);
  if (!quiet) toast(n ? trn(n, "{n} code block tidied", "{n} code blocks tidied") : tr("The code blocks are already tidy."));
}
function libBraces(t) {
  var lv = 0;
  return t.split("\n").map(function (l) {
    var s = l.trim(); if (!s) return "";
    if (/^[}\])]/.test(s)) lv = Math.max(0, lv - 1);
    var o = "  ".repeat(lv) + s;
    var opens = (s.match(/[{[(]/g) || []).length, closes = (s.match(/[}\])]/g) || []).length - (/^[}\])]/.test(s) ? 1 : 0);
    lv = Math.max(0, lv + opens - closes);
    return o;
  }).join("\n");
}
function libXml(t) {
  var lv = 0;
  return t.replace(/>\s*</g, ">\n<").split("\n").map(function (l) {
    var s = l.trim();
    if (/^<\//.test(s)) lv = Math.max(0, lv - 1);
    var o = "  ".repeat(lv) + s;
    if (/^<[^!?/][^>]*[^/]>$/.test(s) && !/<\/[^>]+>$/.test(s.slice(1))) lv++;
    return o;
  }).join("\n");
}
function libToCode() {
  if (libNeedEdit()) return;
  if (ED.saved) edRestore();
  var s = edSel(); if (!s || !s.rangeCount || s.isCollapsed) { edCmd("formatBlock", "PRE"); return; }
  edInsertHTML("<pre>" + libEsc(String(s)) + '</pre><p dir="auto"><br></p>');
  libTidyCode(true);
}
function libGlossary() {
  if (libNeedEdit()) return;
  var terms = libTerms();
  if (!terms.length) { toast(tr("Mark some terms first (select a word, then Writer tools → Mark as a term).")); return; }
  edChange(function () {
    var html = "<h2>" + libEsc(tr("Glossary")) + "</h2><table class=\"t-firstcol\"><thead><tr><th>" + libEsc(tr("Term")) + "</th><th>" + libEsc(tr("Meaning")) + "</th></tr></thead><tbody>" +
      terms.map(function (t) { return "<tr><td>" + libEsc(t.term) + "</td><td>" + (t.def ? libEsc(t.def) : "<br>") + "</td></tr>"; }).join("") + "</tbody></table>";
    var old = [].slice.call(ED.root.querySelectorAll("h2")).filter(function (x) { return x.textContent.trim() === tr("Glossary"); })[0];
    if (old && old.nextElementSibling && old.nextElementSibling.tagName === "TABLE") { old.nextElementSibling.remove(); old.remove(); }
    var box = ED.doc.createElement("div"); box.innerHTML = libClean(html);
    while (box.firstChild) ED.root.appendChild(box.firstChild);
  });
}
function libTerms() {
  var seen = {}, out = [];
  if (!ED.root) return out;
  [].slice.call(ED.root.querySelectorAll("span.term")).forEach(function (x) {
    var t = x.textContent.trim(); if (!t || seen[t.toLowerCase()]) return; seen[t.toLowerCase()] = 1;
    out.push({ term: t, def: x.getAttribute("data-def") || "", el: x });
  });
  return out.sort(function (a, b) { return a.term.localeCompare(b.term); });
}
function libMergeEmpty() { [].slice.call(ED.root.querySelectorAll("p")).forEach(function (p) { var n = p.nextElementSibling; if (!p.textContent.trim() && !p.querySelector("img") && n && n.tagName === "P" && !n.textContent.trim() && !n.querySelector("img")) p.remove(); }); }

/* ---------- the side panel ---------- */
function libFill(el) { var kids = [].slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; }); el.replaceChildren.apply(el, kids); }
function libSide(d) {
  var box = document.getElementById("lib-side"); if (!box || !ED.root) return;
  var canW = libCanWrite(d);
  if (lib.side === "outline") {
    var hs = libHeadings();
    libFill(box, hs.length ? h("nav", { class: "lib-outline", "aria-label": tr("Outline") }, hs.map(function (x) {
      return h("button", { class: "o" + x.tagName[1], dir: "auto", onclick: function () { x.scrollIntoView({ behavior: "smooth", block: "start" }); if (ED.editing) { ED.win.focus(); edCaret(x, true); } } }, x.textContent.trim());
    })) : h("p", { class: "muted small" }, tr("Headings appear here. Type # and a space for a heading, or run Organize on pasted notes.")));
    return;
  }
  if (lib.side === "followups") {
    var fus = [].slice.call(ED.root.querySelectorAll("mark.fu"));
    var open = [].slice.call(ED.root.querySelectorAll("ul.check > li")).filter(function (li) { return !li.classList.contains("done") && li.textContent.trim(); });
    libFill(box, 
      h("p", { class: "muted small" }, tr("Select text, then Writer tools → Mark as a follow-up. Unticked checklist items are listed too.")),
      fus.length || open.length ? h("div", { class: "lib-fu" },
        fus.map(function (m) {
          return h("div", { class: "fu-item" + (m.classList.contains("done") ? " done" : "") },
            canW ? h("input", { type: "checkbox", checked: m.classList.contains("done"), "aria-label": tr("Resolved"), onchange: function (e) { edChange(function () { m.classList.toggle("done", e.target.checked); }); libSide(d); } }) : null,
            h("button", { class: "linklike", onclick: function () { m.scrollIntoView({ block: "center", behavior: "smooth" }); } }, m.textContent.trim()));
        }),
        open.map(function (li) {
          return h("div", { class: "fu-item" }, h("span", { class: "chip" }, "☐"),
            h("button", { class: "linklike", onclick: function () { li.scrollIntoView({ block: "center", behavior: "smooth" }); } }, li.textContent.trim()));
        }),
        canW && fus.length ? h("button", { class: "btn sm", style: { marginTop: "8px" }, onclick: function () { libFuToTasks(d, fus.filter(function (m) { return !m.classList.contains("done"); })); } }, icon("plus"), tr("Create tasks from open follow-ups")) : null)
        : h("p", { class: "muted" }, tr("No follow-ups.")));
    return;
  }
  if (lib.side === "terms") {
    var terms = libTerms();
    libFill(box, 
      h("p", { class: "muted small" }, tr("Select a word, then Writer tools → Mark as a term. Add the meaning here; Insert glossary builds a table.")),
      terms.length ? h("div", { class: "lib-terms" }, terms.map(function (t) {
        return h("div", { class: "field" }, h("label", { class: "l" }, t.term),
          h("input", { class: "f", value: t.def, placeholder: tr("What it means"), disabled: !canW, onchange: function (e) {
            edChange(function () { ED.root.querySelectorAll("span.term").forEach(function (x) { if (x.textContent.trim().toLowerCase() === t.term.toLowerCase()) x.setAttribute("data-def", e.target.value); }); });
          } }));
      })) : h("p", { class: "muted" }, tr("No terms yet.")),
      canW && terms.length ? h("button", { class: "btn sm", onclick: libGlossary }, tr("Insert glossary from terms")) : null);
    return;
  }
  if (lib.side === "links") {
    var out = [], seen = {};
    [].slice.call(ED.root.querySelectorAll("a[href]")).forEach(function (a) {
      var href = a.getAttribute("href"); if (seen[href]) return; seen[href] = 1;
      var m = /^#\/library\/([\w-]+)/.exec(href), t2 = /^#\/task\/([\w-]+)/.exec(href), other = m ? byId(db.library, m[1]) : null;
      out.push(h("div", { class: "lk" }, h("span", { class: "chip " + (m ? "teal" : t2 ? "violet" : /^#/.test(href) ? "" : "blue") }, m ? tr("Document") : t2 ? tr("Task") : /^#/.test(href) ? tr("Heading") : tr("Web")),
        h("a", { href: /^#\//.test(href) ? href : /^#/.test(href) ? null : href, target: /^https?:/.test(href) ? "_blank" : null, rel: "noopener", dir: "auto", onclick: /^#[^/]/.test(href) ? function (e) { e.preventDefault(); edScrollTo(href.slice(1)); } : null }, m ? (other ? other.title : tr("Deleted document")) : a.textContent.trim() || href)));
    });
    var back = libDocs().filter(function (x) { return x.id !== d.id && String(x.html).indexOf("#/library/" + d.id) >= 0; });
    libFill(box,
      h("h4", { class: "lib-h4" }, tr("Links in this document")),
      out.length ? h("div", { class: "lib-links" }, out) : h("p", { class: "muted small" }, tr("None yet. Insert → Link to a document, heading or task.")),
      h("h4", { class: "lib-h4" }, tr("Linked from")),
      back.length ? h("div", { class: "lib-links" }, back.map(function (x) { return h("div", { class: "lk" }, h("span", { class: "chip teal" }, tr("Document")), h("a", { href: "#/library/" + x.id, dir: "auto" }, x.title || tr("Untitled"))); })) : h("p", { class: "muted small" }, tr("No other document links here yet.")));
    return;
  }
  /* details */
  var set = function (k, v) { d[k] = v; d.updatedAt = nowISO(); d.updatedBy = me().id; save(true); };
  var inp = function (k, label, ph, type) { return h("div", { class: "field" }, h("label", { class: "l", for: "lib-" + k }, label), h("input", { class: "f", id: "lib-" + k, type: type || "text", value: d[k] || "", placeholder: ph || "", disabled: !canW, onchange: function (e) { set(k, e.target.value.trim()); if (k === "title") render(); } })); };
  var sel = function (k, label, opts, blank) { return h("div", { class: "field" }, h("label", { class: "l", for: "lib-" + k }, label), h("select", { class: "f", id: "lib-" + k, disabled: !canW, onchange: function (e) { set(k, e.target.value); if (k === "clientId") { d.projectId = ""; d.taskId = ""; } if (k === "projectId") d.taskId = ""; render(); } }, (blank ? [h("option", { value: "" }, blank)] : []).concat(opts.map(function (o) { return h("option", { value: o.value, selected: String(d[k] || "") === String(o.value) }, o.label); })))); };
  var task = d.taskId ? byId(db.tasks, d.taskId) : null;
  libFill(box, 
    inp("title", tr("Title")),
    h("div", { class: "fields" },
      h("div", { class: "field half" }, sel("kind", tr("Kind"), LIB_KINDS.map(function (k) { return { value: k, label: tr(k) }; }))),
      h("div", { class: "field half" }, sel("status", tr("Status"), LIB_STATUS.map(function (k) { return { value: k, label: tr(k) }; })))),
    sel("clientId", tr("Client"), db.clients.map(function (c) { return { value: c.id, label: c.name }; }), "—"),
    sel("projectId", tr("Project"), db.projects.filter(function (p) { return !d.clientId || p.clientId === d.clientId; }).map(function (p) { return { value: p.id, label: p.key + " · " + p.name }; }), "—"),
    sel("taskId", tr("Task"), db.tasks.filter(function (t) { return (!d.projectId || t.projectId === d.projectId) && canSee(t); }).slice(0, 300).map(function (t) { return { value: t.id, label: taskKey(t) + " · " + t.title }; }), "—"),
    task ? h("p", { class: "small" }, h("a", { href: "#/task/" + taskKey(task) }, icon("ext"), " ", tr("Open {k}", { k: taskKey(task) }))) : null,
    inp("sme", tr("Subject-matter expert"), tr("Name")), inp("smeRole", tr("Their role"), tr("e.g. Maintenance lead")),
    h("div", { class: "fields" },
      h("div", { class: "field half" }, inp("date", tr("Date"), "", "date")),
      h("div", { class: "field half" }, inp("place", tr("Where"), tr("Client site, Teams…")))),
    h("div", { class: "field" }, h("label", { class: "l", for: "lib-tags" }, tr("Tags")), h("input", { class: "f", id: "lib-tags", value: (d.tags || []).join(", "), placeholder: tr("comma, separated"), disabled: !canW, onchange: function (e) { set("tags", e.target.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean)); } })),
    h("label", { class: "row small", style: { margin: "4px 0 6px" } }, h("input", { type: "checkbox", checked: !!d.private, disabled: !(canW && d.authorId === me().id), onchange: function (e) { set("private", e.target.checked); render(); } }), tr("Private — only I can see it")),
    h("label", { class: "row small", style: { margin: "0 0 12px" }, title: tr("Nobody can edit a locked document until its author or a manager unlocks it.") },
      h("input", { type: "checkbox", checked: !!d.locked, disabled: !(d.authorId === me().id || isManager()), onchange: function (e) { if (e.target.checked && ED.editing) libEditMode(false); set("locked", e.target.checked); libRenderTools(); } }), "🔒 ", tr("Locked — no editing until unlocked")),
    h("p", { class: "muted small" }, tr("Created by {n}", { n: userName(d.authorId) }), " · ", fmtDate(d.createdAt)),
    libCanDelete(d) ? h("button", { class: "btn sm danger", onclick: function () {
      confirmBox(tr("Delete this document?"), d.title, tr("Delete"), function () {
        var copyOf = JSON.parse(JSON.stringify(d)), at = db.library.indexOf(d);
        db.library = db.library.filter(function (x) { return x.id !== d.id; }); ED.d = null; ED.wrap = null; save(true); go("library");
        toast(tr("Document deleted."), { label: tr("Undo"), fn: function () { db.library.splice(Math.max(0, at), 0, copyOf); save(true); go("library/" + copyOf.id); } });
      });
    } }, icon("trash"), tr("Delete document")) : null);
}
/* each open follow-up becomes a task on the document's project */
function libFuToTasks(d, marks) {
  if (!d.projectId) { toast(tr("Choose the document's project under Details first.")); lib.side = "details"; libSide(d); return; }
  if (!marks.length) { toast(tr("No open follow-ups.")); return; }
  if (typeof createTask !== "function") { toast(tr("Tasks can't be created from here.")); return; }
  var made = 0;
  marks.forEach(function (m) {
    var t = createTask({ projectId: d.projectId, title: m.textContent.trim().slice(0, 140), type: "Research", priority: "Medium", status: "To Do", assigneeId: me().id,
      description: tr("Follow-up from the library document “{t}”.", { t: d.title }) });
    if (t) { m.classList.add("done"); m.setAttribute("title", taskKey(t)); made++; }
  });
  libDirty(); libFlush(); libSide(d);
  toast(trn(made, "{n} task created", "{n} tasks created"));
}

/* ---------- export ---------- */
function libExport(kind) {
  libFlush();
  var d = libCur(); if (!d) return;
  var body = libClean(ED.root.innerHTML), title = d.title || tr("Untitled"), dir = LANG === "he" ? "rtl" : "ltr";
  /* the same look as in the editor, plus the document's own stylesheet */
  var css = ED_CSS.replace("min-height:calc(100vh - 114px);", "") + "\n#doc{max-width:820px;margin:0 auto}\n" + libCleanCss(d.css || "");
  var link = /^https:\/\//i.test(d.cssUrl || "") ? '<link rel="stylesheet" href="' + libEsc(d.cssUrl) + '">' : "";
  var meta = [byId(db.clients, d.clientId), byId(db.projects, d.projectId)].filter(Boolean).map(function (x) { return x.name; });
  if (d.sme) meta.push(d.sme + (d.smeRole ? " (" + d.smeRole + ")" : ""));
  if (d.date) meta.push(fmtDate(d.date));
  var doc = "<!doctype html><html dir=\"" + dir + "\"><head><meta charset=\"utf-8\"><title>" + libEsc(title) + "</title><style>" + css + "</style>" + link + "</head><body><main id=\"doc\">" +
    "<h1 class=\"doc-title\" style=\"border:0;font-size:26px\">" + libEsc(title) + "</h1>" + (meta.length ? "<p class=\"doc-meta\" style=\"color:#5f6e62\">" + libEsc(meta.join(" · ")) + "</p>" : "") +
    body + "</main></body></html>";
  var name = (title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document").slice(0, 80);
  if (kind === "doc") saveFile(name + ".doc", "﻿" + doc.replace("<html", "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:w=\"urn:schemas-microsoft-com:office:word\""), "application/msword", tr("Word document"));
  else if (kind === "html") saveFile(name + ".html", doc, "text/html", tr("Web page"));
  else if (kind === "md") saveFile(name + ".md", "# " + title + "\n\n" + libMarkdown(ED.root), "text/markdown", "Markdown");
  else {
    var w = window.open("", "_blank");
    if (!w) { toast(tr("Allow pop-ups to print.")); return; }
    w.document.open(); w.document.write(doc); w.document.close(); setTimeout(function () { w.focus(); w.print(); }, 300);
  }
}
function libMarkdown(root) {
  var inl = function (n) {
    if (n.nodeType === 3) return n.nodeValue.replace(/ /g, " ");
    if (n.nodeType !== 1) return "";
    var c = [].slice.call(n.childNodes).map(inl).join(""), t = n.tagName;
    if (t === "STRONG" || t === "B") return c.trim() ? "**" + c + "**" : c;
    if (t === "EM" || t === "I") return c.trim() ? "_" + c + "_" : c;
    if (t === "S" || t === "STRIKE") return "~~" + c + "~~";
    if (t === "CODE") return "`" + c + "`";
    if (t === "A") return "[" + c + "](" + n.getAttribute("href") + ")";
    if (t === "IMG") return "![" + (n.getAttribute("alt") || "") + "](" + (/^data:/.test(n.getAttribute("src")) ? "image" : n.getAttribute("src")) + ")";
    if (t === "BR") return "  \n";
    if (t === "MARK" && n.classList.contains("fu")) return "**[?]** " + c;
    return c;
  };
  var blk = function (n, depth) {
    if (n.nodeType === 3) return n.nodeValue.trim() ? n.nodeValue.trim() + "\n\n" : "";
    if (n.nodeType !== 1) return "";
    var t = n.tagName;
    if (/^H[1-4]$/.test(t)) return "#".repeat(Number(t[1]) + 1) + " " + inl(n).trim() + "\n\n";
    if (t === "P") return inl(n).trim() ? inl(n).trim() + "\n\n" : "";
    if (t === "PRE") return "```\n" + n.textContent.replace(/\n$/, "") + "\n```\n\n";
    if (t === "BLOCKQUOTE") return inl(n).trim().split("\n").map(function (l) { return "> " + l; }).join("\n") + "\n\n";
    if (t === "HR") return "---\n\n";
    if (t === "UL" || t === "OL") {
      var i = 0, chk = n.classList.contains("check");
      return [].slice.call(n.children).map(function (li) {
        var sub = [].slice.call(li.children).filter(function (x) { return x.tagName === "UL" || x.tagName === "OL"; });
        var own = [].slice.call(li.childNodes).filter(function (x) { return sub.indexOf(x) < 0; }).map(inl).join("").trim();
        var mark = chk ? (li.classList.contains("done") ? "- [x] " : "- [ ] ") : t === "OL" ? (++i) + ". " : "- ";
        return "  ".repeat(depth || 0) + mark + own + "\n" + sub.map(function (s) { return blk(s, (depth || 0) + 1).replace(/\n\n$/, "\n"); }).join("");
      }).join("") + (depth ? "" : "\n");
    }
    if (t === "TABLE") {
      var rows = [].slice.call(n.querySelectorAll("tr")).map(function (tr0) { return [].slice.call(tr0.children).map(function (c) { return inl(c).trim().replace(/\|/g, "\\|").replace(/\n/g, " "); }); });
      if (!rows.length) return "";
      var w = Math.max.apply(null, rows.map(function (r) { return r.length; }));
      var line = function (r) { while (r.length < w) r.push(""); return "| " + r.join(" | ") + " |"; };
      return line(rows[0]) + "\n|" + " --- |".repeat(w) + "\n" + rows.slice(1).map(line).join("\n") + "\n\n";
    }
    if (t === "DIV" && n.classList.contains("qa")) return [].slice.call(n.children).map(function (p) { return (p.classList.contains("q") ? "**Q:** " : "**A:** ") + inl(p).trim(); }).join("  \n") + "\n\n";
    if (t === "DIV" && n.classList.contains("callout")) return "> **" + (n.classList.contains("note") ? "Note" : n.classList.contains("caution") ? "Caution" : "Warning") + ":** " + inl(n).trim() + "\n\n";
    return [].slice.call(n.childNodes).map(function (x) { return blk(x, depth); }).join("");
  };
  return [].slice.call(root.childNodes).map(function (x) { return blk(x, 0); }).join("").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
