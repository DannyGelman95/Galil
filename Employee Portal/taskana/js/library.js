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
var lib = { q: "", kind: "", status: "", clientId: "", side: "outline", ed: null, edFor: null, timer: null, findOpen: false, linkOpen: false, savedRange: null };

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

/* ---------- HTML safety: only the structure the editor makes is kept ---------- */
var LIB_TAGS = { P: 1, BR: 1, H1: 1, H2: 1, H3: 1, H4: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, STRIKE: 1, CODE: 1, PRE: 1, BLOCKQUOTE: 1,
  UL: 1, OL: 1, LI: 1, A: 1, IMG: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, HR: 1, MARK: 1, SPAN: 1, DIV: 1, SUP: 1, SUB: 1, NAV: 1 };
var LIB_CLASSES = { q: 1, a: 1, qa: 1, toc: 1, toc0: 1, toc1: 1, toc2: 1, callout: 1, note: 1, warn: 1, caution: 1, fu: 1, done: 1, term: 1, check: 1, ts: 1, "lang-json": 1, "lang-xml": 1, "lang-code": 1, "lang-shell": 1, "lang-sql": 1 };
function libEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function libClean(html) {
  var tpl = document.createElement("template");
  tpl.innerHTML = String(html || "");
  (function walk(node) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      var tag = c.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME" || tag === "OBJECT" || tag === "EMBED" || tag === "META" || tag === "LINK" || tag === "TEMPLATE") { c.remove(); return; }
      if (!LIB_TAGS[tag]) {                       // unknown wrapper (Word's <o:p>, <font>, …): keep its contents
        walk(c);
        var frag = document.createDocumentFragment(); while (c.firstChild) frag.appendChild(c.firstChild);
        c.replaceWith(frag); return;
      }
      [].slice.call(c.attributes).forEach(function (a) {
        var n = a.name.toLowerCase(), v = a.value;
        var ok = (n === "href" && tag === "A" && /^(https?:|mailto:|#)/i.test(v.trim())) ||
          (n === "src" && tag === "IMG" && /^(data:image\/(png|jpe?g|gif|webp);|https:)/i.test(v.trim())) ||
          (n === "alt" && tag === "IMG") || (n === "title") ||
          ((n === "colspan" || n === "rowspan") && /^\d{1,2}$/.test(v)) ||
          (n === "id" && /^h-[\w-]{1,40}$/.test(v)) ||
          (n === "data-def" && tag === "SPAN") ||
          (n === "dir" && /^(auto|ltr|rtl)$/.test(v)) ||
          (n === "style" && /^\s*text-align:\s*(left|right|center|justify|start|end);?\s*$/i.test(v)) ||
          (n === "class");
        if (!ok) c.removeAttribute(a.name);
        else if (n === "class") {
          var keep = v.split(/\s+/).filter(function (x) { return LIB_CLASSES[x]; }).join(" ");
          if (keep) c.setAttribute("class", keep); else c.removeAttribute("class");
        }
      });
      /* every block takes the direction of its own text, so English notes read right in the Hebrew interface and vice versa */
      if (/^(P|LI|H1|H2|H3|H4|TD|TH|BLOCKQUOTE)$/.test(tag) && !c.hasAttribute("dir")) c.setAttribute("dir", "auto");
      if (tag === "A" && !/^#/.test(c.getAttribute("href") || "")) { c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener noreferrer"); }
      walk(c);
    });
  })(tpl.content);
  return tpl.innerHTML;
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
function pageLibrary(id) {
  if (!libCanRead()) return notFound(tr("No access"), tr("Outsourced accounts see the tasks they work on. Ask a Manager if you need more."));
  libInit();
  var docs = libDocs(), doc = id ? byId(docs, id) : null;
  if (id && !doc) return notFound(tr("Document not found"), tr("It may have been deleted, or it is private."));
  var list = libList(docs, doc);
  return {
    title: doc ? doc.title || tr("Untitled") : tr("Library"),
    crumbs: doc ? h("span", null, h("a", { href: "#/library" }, tr("Library")), " · ", tr(doc.kind || "Other")) : tr("Research from subject-matter experts, site visits and walkthroughs"),
    actions: h("div", { class: "row" }, libCanWrite() ? libNewBtn() : null),
    body: h("div", { class: "lib" + (doc ? " has-doc" : "") }, list, doc ? libDocView(doc) : libEmpty(docs))
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
  var redraw = function () { render(); var s = document.getElementById("lib-q"); if (s && document.activeElement !== s) {} };
  var clients = db.clients.filter(function (c) { return docs.some(function (d) { return d.clientId === c.id; }); });
  return h("aside", { class: "card lib-list", "aria-label": tr("Documents") },
    h("div", { class: "lib-search" },
      h("input", { id: "lib-q", type: "search", placeholder: tr("Search the library…"), value: lib.q, "aria-label": tr("Search the library"),
        oninput: function (e) { lib.q = e.target.value; redraw(); } }),
      h("div", { class: "row" },
        h("select", { "aria-label": tr("Kind"), onchange: function (e) { lib.kind = e.target.value; redraw(); } },
          [h("option", { value: "" }, tr("All kinds"))].concat(LIB_KINDS.map(function (k) { return h("option", { value: k, selected: lib.kind === k }, tr(k)); }))),
        h("select", { "aria-label": tr("Status"), onchange: function (e) { lib.status = e.target.value; redraw(); } },
          [h("option", { value: "" }, tr("Any status"))].concat(LIB_STATUS.map(function (k) { return h("option", { value: k, selected: lib.status === k }, tr(k)); }))),
        clients.length ? h("select", { "aria-label": tr("Client"), onchange: function (e) { lib.clientId = e.target.value; redraw(); } },
          [h("option", { value: "" }, tr("All clients"))].concat(clients.map(function (c) { return h("option", { value: c.id, selected: lib.clientId === c.id }, c.name); }))) : null)),
    h("div", { class: "lib-items" }, rows.length ? rows.map(function (d) {
      var fu = (String(d.html).match(/class="fu"/g) || []).length;
      var p = byId(db.projects, d.projectId), c = byId(db.clients, d.clientId);
      return h("a", { class: "lib-item" + (cur && cur.id === d.id ? " on" : ""), href: "#/library/" + d.id },
        h("b", { class: "ellipsis" }, d.title || tr("Untitled")),
        h("span", { class: "row", style: { gap: "5px" } },
          h("span", { class: "chip teal" }, tr(d.kind || "Other")),
          h("span", { class: "chip " + (LIB_STATUS_CHIP[d.status] || "") }, tr(d.status || "Draft")),
          fu ? h("span", { class: "chip amber", title: tr("Open follow-ups") }, "? " + fu) : null,
          d.private ? h("span", { class: "chip" }, tr("Private")) : null),
        h("span", { class: "muted small ellipsis" }, [c ? c.name : "", p ? p.name : "", d.sme].filter(Boolean).join(" · ") || "—"),
        h("span", { class: "muted small" }, userName(d.updatedBy || d.authorId), " · ", fmtWhen(d.updatedAt)));
    }) : h("div", { class: "muted small", style: { padding: "12px" } }, tr("Nothing matches."))));
}

/* plain text of a document, for search and word count */
function libText(html) { var t = document.createElement("template"); t.innerHTML = html || ""; return t.content.textContent || ""; }

/* ---------- one document ---------- */
function libDocView(d) {
  var canW = libCanWrite(d);
  /* the editor element survives redraws, so typing, the caret and undo are never lost */
  if (lib.edFor !== d.id || !lib.ed) {
    libFlush();
    lib.ed = h("div", { class: "lib-doc", id: "lib-ed", spellcheck: "true", "aria-label": tr("Document text"), role: "textbox", "aria-multiline": "true" });
    lib.ed.innerHTML = libClean(d.html);
    lib.edFor = d.id;
    libWire(lib.ed);
    lib.findOpen = false; lib.linkOpen = false;
  }
  lib.ed.contentEditable = canW ? "true" : "false";
  lib.ed.classList.toggle("numbered", !!d.numbered);
  var side = h("div", { class: "lib-sidebody", id: "lib-side" });
  var view = h("section", { class: "lib-main" },
    canW ? libToolbar(d) : h("div", { class: "lib-ro muted small" }, tr("Read only")),
    h("div", { class: "lib-bars", id: "lib-bars" }),
    h("div", { class: "card lib-paper" }, lib.ed),
    h("div", { class: "lib-foot muted small", id: "lib-foot" }));
  var tabs = [["outline", tr("Outline")], ["followups", tr("Follow-ups")], ["terms", tr("Terms")], ["details", tr("Details")]];
  var aside = h("aside", { class: "card lib-side" },
    h("div", { class: "seg lib-tabs", role: "tablist" }, tabs.map(function (t) {
      return h("button", { role: "tab", "aria-selected": lib.side === t[0] ? "true" : "false", class: lib.side === t[0] ? "on" : "", onclick: function () { lib.side = t[0]; libSide(d); this.parentNode.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === this); b.setAttribute("aria-selected", b === this ? "true" : "false"); }, this); } }, t[1]);
    })), side);
  setTimeout(function () { libSide(d); libFootUpdate(); libBars(d); }, 0);
  return h("div", { class: "lib-docwrap" }, view, aside);
}
function libCur() { return lib.edFor ? byId(db.library || [], lib.edFor) : null; }

/* save what is in the editor — debounced while typing */
function libDirty() {
  clearTimeout(lib.timer);
  lib.timer = setTimeout(libFlush, 700);
  libFootUpdate(true);
}
function libFlush() {
  clearTimeout(lib.timer); lib.timer = null;
  var d = libCur(); if (!d || !lib.ed) return;
  var html = libClean(lib.ed.innerHTML);
  if (html === d.html) return;
  d.html = html; d.updatedAt = nowISO(); d.updatedBy = me().id;
  save(true);
  libFootUpdate(false);
  if (lib.side !== "details") libSide(d);
}
window.addEventListener("beforeunload", function () { if (lib.timer) libFlush(); });
window.addEventListener("hashchange", function () { if (lib.timer) libFlush(); }, true);

function libFootUpdate(pending) {
  var el = document.getElementById("lib-foot"), d = libCur(); if (!el || !d || !lib.ed) return;
  var words = (lib.ed.textContent.match(/[\w֐-׿][\w֐-׿'’-]*/g) || []).length;
  libFill(el,
    h("span", null, trn(words, "{n} word", "{n} words"), " · ", tr("about {n} min to read", { n: Math.max(1, Math.round(words / 200)) })),
    h("span", { class: "sp" }),
    h("span", null, pending || lib.timer ? tr("Saving…") : tr("Saved") + " · " + userName(d.updatedBy || d.authorId) + " · " + fmtWhen(d.updatedAt)));
}

/* ---------- editing behaviour ---------- */
function libExec(cmd, val) { lib.ed.focus(); document.execCommand(cmd, false, val == null ? null : val); libDirty(); }
function libBlockOf(node) {
  while (node && node !== lib.ed) {
    if (node.nodeType === 1 && /^(P|H1|H2|H3|H4|PRE|BLOCKQUOTE|LI|DIV|TD|TH)$/.test(node.tagName)) return node;
    node = node.parentNode;
  }
  return null;
}
function libSelBlock() { var s = getSelection(); return s.rangeCount ? libBlockOf(s.getRangeAt(0).startContainer) : null; }
function libWire(ed) {
  ed.addEventListener("input", libDirty);
  ed.addEventListener("blur", function () { if (lib.timer) libFlush(); });
  ed.addEventListener("keydown", function (e) {
    var k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === "s") { e.preventDefault(); libFlush(); toast(tr("Saved")); return; }
    if (mod && k === "k") { e.preventDefault(); libLinkBar(); return; }
    if (mod && k === "f") { e.preventDefault(); libFindBar(); return; }
    if (mod && e.shiftKey && k === "7") { e.preventDefault(); libExec("insertOrderedList"); return; }
    if (mod && e.shiftKey && k === "8") { e.preventDefault(); libExec("insertUnorderedList"); return; }
    if (mod && e.altKey && /^[123]$/.test(k)) { e.preventDefault(); libExec("formatBlock", "H" + k); return; }
    if (mod && e.altKey && k === "0") { e.preventDefault(); libExec("formatBlock", "P"); return; }
    var blk = libSelBlock();
    /* Tab: indent inside a code block, nest inside a list */
    if (e.key === "Tab") {
      if (blk && blk.tagName === "PRE") { e.preventDefault(); libExec("insertText", "  "); return; }
      if (blk && blk.tagName === "LI") { e.preventDefault(); libExec(e.shiftKey ? "outdent" : "indent"); return; }
    }
    /* Enter at the end of a code block twice leaves it */
    if (e.key === "Enter" && blk && blk.tagName === "PRE" && !e.shiftKey) {
      if (/\n\n?$/.test(blk.textContent) && libAtEnd(blk)) { e.preventDefault(); blk.textContent = blk.textContent.replace(/\n+$/, ""); var p = document.createElement("p"); p.innerHTML = "<br>"; blk.after(p); libCaret(p); libDirty(); return; }
      e.preventDefault(); libExec("insertText", "\n"); return;
    }
    /* Markdown-style shortcuts at the start of a line: "# ", "## ", "- ", "1. ", "> ", "```", "[] " */
    if (e.key === " " && blk && /^(P|DIV)$/.test(blk.tagName) && libAtEnd(blk)) {
      var t = blk.textContent, map = { "#": "H1", "##": "H2", "###": "H3", ">": "BLOCKQUOTE", "```": "PRE" };
      if (map[t] || t === "-" || t === "*" || t === "1." || t === "[]") {
        e.preventDefault(); blk.textContent = ""; blk.innerHTML = "<br>"; libCaret(blk);
        if (map[t]) libExec("formatBlock", map[t]);
        else if (t === "1.") libExec("insertOrderedList");
        else { libExec("insertUnorderedList"); if (t === "[]") { var ul = libClosest(libSelBlock(), "UL"); if (ul) ul.classList.add("check"); } }
        libDirty();
      }
    }
  });
  /* checklist: clicking the box ticks the item */
  ed.addEventListener("click", function (e) {
    var li = e.target.closest && e.target.closest("ul.check > li");
    if (li && ed.isContentEditable) {
      var r = li.getBoundingClientRect(), rtl = getComputedStyle(li).direction === "rtl";
      var x = rtl ? r.right - e.clientX : e.clientX - r.left;
      if (x < 0) { li.classList.toggle("done"); libDirty(); }
    }
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && /^#/.test(a.getAttribute("href"))) { e.preventDefault(); var to = ed.querySelector(a.getAttribute("href").replace(/[^#\w\u0590-\u05FF-]/g, "")); if (to) to.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (a && (e.ctrlKey || e.metaKey || !ed.isContentEditable)) { e.preventDefault(); window.open(a.href, "_blank", "noopener"); }
  });
  /* pasting: Word, web pages and plain text arrive clean */
  ed.addEventListener("paste", function (e) {
    var cd = e.clipboardData; if (!cd) return;
    var img = [].slice.call(cd.files || []).filter(function (f) { return /^image\//.test(f.type); })[0];
    if (img) { e.preventDefault(); libInsertImageFile(img); return; }
    var html = cd.getData("text/html"), text = cd.getData("text/plain");
    e.preventDefault();
    var blk = libSelBlock();
    if (blk && blk.tagName === "PRE") { document.execCommand("insertText", false, text); libDirty(); return; }
    if (html) document.execCommand("insertHTML", false, libClean(html.replace(/<!--[\s\S]*?-->/g, "")));
    else if (text) document.execCommand("insertHTML", false, text.split(/\r?\n/).map(function (l) { return "<p>" + (libEsc(l) || "<br>") + "</p>"; }).join(""));
    libDirty();
  });
  ed.addEventListener("drop", function (e) {
    var f = e.dataTransfer && [].slice.call(e.dataTransfer.files || []).filter(function (x) { return /^image\//.test(x.type); })[0];
    if (f) { e.preventDefault(); libInsertImageFile(f); }
  });
}
function libClosest(n, tag) { while (n && n !== lib.ed) { if (n.tagName === tag) return n; n = n.parentNode; } return null; }
function libAtEnd(el) {
  var s = getSelection(); if (!s.rangeCount) return false;
  var r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(el); r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return !r.toString().length;
}
function libCaret(el, atStart) { var r = document.createRange(); r.selectNodeContents(el); r.collapse(!!atStart); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
function libSaveSel() { var s = getSelection(); lib.savedRange = s.rangeCount && lib.ed.contains(s.getRangeAt(0).commonAncestorContainer) ? s.getRangeAt(0).cloneRange() : null; }
function libRestoreSel() { if (!lib.savedRange) return; lib.ed.focus(); var s = getSelection(); s.removeAllRanges(); s.addRange(lib.savedRange); }
/* wrap the selection in an inline element (code, mark, span.term) — or unwrap it when already inside one */
function libWrap(tag, cls) {
  var s = getSelection(); if (!s.rangeCount) return;
  var r = s.getRangeAt(0);
  var inside = libClosest(r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode, tag.toUpperCase());
  if (inside && (!cls || inside.classList.contains(cls))) {
    var f = document.createDocumentFragment(); while (inside.firstChild) f.appendChild(inside.firstChild); inside.replaceWith(f); libDirty(); return;
  }
  if (r.collapsed) { toast(tr("Select some text first.")); return; }
  var el = document.createElement(tag); if (cls) el.className = cls;
  try { r.surroundContents(el); } catch (x) { el.appendChild(r.extractContents()); r.insertNode(el); }
  s.removeAllRanges(); var nr = document.createRange(); nr.selectNodeContents(el); s.addRange(nr);
  libDirty();
  return el;
}
function libInsertHTML(html) { lib.ed.focus(); if (lib.savedRange) libRestoreSel(); document.execCommand("insertHTML", false, libClean(html)); libDirty(); }
function libInsertImageFile(file) {
  if (file.size > MAX_ATTACHMENT_BYTES) { toast(tr("Images up to {n}.", { n: fmtBytes(MAX_ATTACHMENT_BYTES) })); return; }
  var fr = new FileReader();
  fr.onload = function () { libInsertHTML('<p><img src="' + fr.result + '" alt="' + libEsc(file.name) + '"></p>'); };
  fr.readAsDataURL(file);
}

/* ---------- toolbar ---------- */
var LIB_IC = {
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3", redo: "M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3",
  bold: "M7 4h6a4 4 0 010 8H7zM7 12h7a4 4 0 010 8H7z", italic: "M14 4h-4M14 20h-4M14 4l-4 16", under: "M7 4v7a5 5 0 0010 0V4M5 21h14",
  strike: "M5 12h14M16 7a4 4 0 00-4-3c-2.5 0-4 1.3-4 3s1.5 2.5 4 3M8 17a4 4 0 004 3c2.5 0 4-1.3 4-3", code: "M9 8l-5 4 5 4M15 8l5 4-5 4",
  mark: "M4 20h7M14 4l6 6-9 9H6v-5z", clear: "M5 5l14 14M9 4h9M13 4l-3 8M4 20h7",
  ul: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01", ol: "M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3M3 11c0-1 3-1 3 0s-3 2-3 3h3",
  check: "M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9",
  indent: "M4 6h16M10 12h10M4 18h16M4 10l3 2-3 2", outdent: "M4 6h16M10 12h10M4 18h16M7 10l-3 2 3 2",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01", table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14", hr: "M4 12h16",
  quote: "M7 7h4v5H6M6 12c0 3 1 4 4 5M15 7h4v5h-5M14 12c0 3 1 4 4 5", find: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  tools: "M14 7l3-3 3 3-3 3M17 4l-9 9M4 20l4-1 9-9-3-3-9 9z", down: "M12 4v12M7 11l5 5 5-5M5 20h14"
};
function libIcon(n) {
  var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ico"); s.setAttribute("aria-hidden", "true");
  var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", LIB_IC[n] || ""); s.appendChild(p);
  return s;
}
function libToolbar(d) {
  var b = function (ic, label, fn, keys) {
    return h("button", { type: "button", class: "tb", title: label + (keys ? " (" + keys + ")" : ""), "aria-label": label,
      onmousedown: function (e) { e.preventDefault(); }, onclick: function () { libSaveSel(); fn(); } }, libIcon(ic));
  };
  var style = h("select", { class: "tb-sel", "aria-label": tr("Paragraph style"), onmousedown: libSaveSel, onchange: function (e) {
    var v = e.target.value; libRestoreSel();
    if (v === "CALLOUT-note" || v === "CALLOUT-warn" || v === "CALLOUT-caution") libCallout(v.slice(8));
    else libExec("formatBlock", v);
    e.target.value = "";
  } }, h("option", { value: "" }, tr("Style…")),
    [["P", "Normal text"], ["H1", "Heading 1"], ["H2", "Heading 2"], ["H3", "Heading 3"], ["BLOCKQUOTE", "Quote"], ["PRE", "Code block"],
     ["CALLOUT-note", "Note callout"], ["CALLOUT-warn", "Warning callout"], ["CALLOUT-caution", "Caution callout"]].map(function (o) { return h("option", { value: o[0] }, tr(o[1])); }));
  var tools = libMenu(libIcon("tools"), tr("Writer tools"), [
    [tr("Organize pasted notes into a document"), function () { libOrganize(); }],
    [tr("Insert / update table of contents"), function () { libToc(); }],
    [tr("Tidy code blocks"), function () { libTidyCode(); }],
    [tr("Turn selection into a code block"), function () { libToCode(); }],
    [d.numbered ? tr("Stop numbering headings") : tr("Number the headings (1, 1.1, 1.2…)"), function () { d.numbered = !d.numbered; lib.ed.classList.toggle("numbered", d.numbered); d.updatedAt = nowISO(); save(true); render(); }],
    ["—"],
    [tr("Insert question and answer"), function () { libInsertHTML('<div class="qa"><p class="q">' + libEsc(tr("Question")) + '</p><p class="a">' + libEsc(tr("Answer")) + "</p></div><p><br></p>"); }],
    [tr("Insert time stamp"), function () { var n = new Date(); libInsertHTML('<span class="ts">[' + String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0") + "]</span>&nbsp;"); }],
    [tr("Mark selection as a follow-up"), function () { libRestoreSel(); libWrap("mark", "fu"); libSide(d); }],
    [tr("Mark selection as a term"), function () { libRestoreSel(); libWrap("span", "term"); libSide(d); }],
    [tr("Insert glossary from terms"), function () { libGlossary(); }],
    ["—"],
    [tr("Find and replace"), function () { libFindBar(); }],
    [tr("Clean up formatting (whole document)"), function () { lib.ed.innerHTML = libClean(lib.ed.innerHTML.replace(/<span>([\s\S]*?)<\/span>/g, "$1")); libMergeEmpty(); libDirty(); toast(tr("Formatting cleaned up.")); }]
  ]);
  var exp = libMenu(libIcon("down"), tr("Export"), [
    [tr("Word document (.doc)"), function () { libExport("doc"); }],
    [tr("Web page (.html)"), function () { libExport("html"); }],
    [tr("Markdown (.md)"), function () { libExport("md"); }],
    [tr("Copy as Markdown"), function () { libFlush(); copy(libMarkdown(lib.ed), tr("Markdown copied")); }],
    [tr("Print or save as PDF"), function () { libExport("print"); }]
  ]);
  var imgIn = h("input", { type: "file", accept: "image/*", hidden: true, onchange: function (e) { var f = e.target.files && e.target.files[0]; if (f) libInsertImageFile(f); e.target.value = ""; } });
  return h("div", { class: "lib-tb card", role: "toolbar", "aria-label": tr("Formatting") },
    b("undo", tr("Undo"), function () { libExec("undo"); }, "Ctrl+Z"), b("redo", tr("Redo"), function () { libExec("redo"); }, "Ctrl+Y"),
    h("i", { class: "tb-sep" }), style,
    h("i", { class: "tb-sep" }),
    b("bold", tr("Bold"), function () { libExec("bold"); }, "Ctrl+B"), b("italic", tr("Italic"), function () { libExec("italic"); }, "Ctrl+I"),
    b("under", tr("Underline"), function () { libExec("underline"); }, "Ctrl+U"), b("strike", tr("Strikethrough"), function () { libExec("strikeThrough"); }),
    b("code", tr("Inline code"), function () { libWrap("code"); }), b("mark", tr("Highlight"), function () { libWrap("mark"); }),
    b("clear", tr("Clear formatting"), function () { libExec("removeFormat"); var s = getSelection(); if (s.rangeCount) { var n = s.getRangeAt(0).commonAncestorContainer; var c = libClosest(n.nodeType === 1 ? n : n.parentNode, "CODE") || libClosest(n.nodeType === 1 ? n : n.parentNode, "MARK"); if (c) { var f = document.createDocumentFragment(); while (c.firstChild) f.appendChild(c.firstChild); c.replaceWith(f); libDirty(); } } }),
    h("i", { class: "tb-sep" }),
    b("ul", tr("Bulleted list"), function () { libExec("insertUnorderedList"); }, "Ctrl+Shift+8"), b("ol", tr("Numbered list"), function () { libExec("insertOrderedList"); }, "Ctrl+Shift+7"),
    b("check", tr("Checklist"), function () { var blk = libSelBlock(); var ul = libClosest(blk, "UL"); if (!ul) { libExec("insertUnorderedList"); ul = libClosest(libSelBlock(), "UL"); } if (ul) { ul.classList.toggle("check"); libDirty(); } }),
    b("indent", tr("Indent"), function () { libExec("indent"); }), b("outdent", tr("Outdent"), function () { libExec("outdent"); }),
    h("i", { class: "tb-sep" }),
    b("link", tr("Link"), function () { libLinkBar(); }, "Ctrl+K"), b("image", tr("Image"), function () { imgIn.click(); }), imgIn,
    b("table", tr("Table"), function () { libTableAsk(); }), b("hr", tr("Divider"), function () { libExec("insertHorizontalRule"); }),
    h("i", { class: "tb-sep" }),
    b("find", tr("Find and replace"), function () { libFindBar(); }, "Ctrl+F"),
    h("span", { class: "sp" }), tools, exp);
}
function libMenu(ic, label, items) {
  var wrap = h("div", { class: "lib-new" });
  var menu = h("div", { class: "lib-menu end", hidden: true, role: "menu" }, items.map(function (it) {
    if (it[0] === "—") return h("hr");
    return h("button", { role: "menuitem", onmousedown: function (e) { e.preventDefault(); }, onclick: function () { menu.hidden = true; it[1](); } }, it[0]);
  }));
  var btn = h("button", { type: "button", class: "btn sm", "aria-haspopup": "true", onmousedown: function (e) { e.preventDefault(); libSaveSel(); },
    onclick: function (e) {
      e.stopPropagation(); var open = menu.hidden;
      document.querySelectorAll(".lib-menu").forEach(function (m) { m.hidden = true; });
      menu.hidden = !open;
      if (open) setTimeout(function () { document.addEventListener("click", function () { menu.hidden = true; }, { once: true }); }, 0);
    } }, ic, label);
  wrap.append(btn, menu);
  return wrap;
}
function libCallout(kind) {
  var blk = libSelBlock(); if (!blk) return;
  if (blk.tagName === "LI" || blk.tagName === "TD" || blk.tagName === "TH") { toast(tr("Put the caret in a paragraph first.")); return; }
  var box = document.createElement("div"); box.className = "callout " + kind;
  blk.replaceWith(box); box.appendChild(blk.tagName === "DIV" ? (function () { var p = document.createElement("p"); p.innerHTML = blk.innerHTML; return p; })() : blk);
  libCaret(box); libDirty();
}

/* small bars above the page: link, find and replace */
function libBars(d) {
  var el = document.getElementById("lib-bars"); if (!el) return;
  el.replaceChildren();
  if (lib.linkOpen) {
    var inp = h("input", { type: "url", placeholder: "https://…", "aria-label": tr("Link address"), value: lib.linkOpen.href || "" });
    var apply = function () {
      var v = inp.value.trim(); lib.linkOpen = false; libRestoreSel();
      if (!v) libExec("unlink");
      else if (!/^(https?:|mailto:|#)/i.test(v)) v = "https://" + v;
      if (v) { if (getSelection().isCollapsed) libInsertHTML('<a href="' + libEsc(v) + '">' + libEsc(v) + "</a>"); else libExec("createLink", v); }
      libBars(d);
    };
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } if (e.key === "Escape") { lib.linkOpen = false; libBars(d); libRestoreSel(); } });
    el.append(h("div", { class: "lib-bar" }, libIcon("link"), inp,
      h("button", { class: "btn sm primary", onclick: apply }, tr("Apply")),
      h("button", { class: "btn sm", onclick: function () { lib.linkOpen = false; libRestoreSel(); libExec("unlink"); libBars(d); } }, tr("Remove link")),
      h("button", { class: "btn sm ghost", onclick: function () { lib.linkOpen = false; libBars(d); } }, tr("Close"))));
    setTimeout(function () { inp.focus(); }, 0);
  }
  if (lib.findOpen) {
    var f = h("input", { type: "search", placeholder: tr("Find"), "aria-label": tr("Find"), value: lib.findOpen.q || "" });
    var r = h("input", { type: "text", placeholder: tr("Replace with"), "aria-label": tr("Replace with"), value: lib.findOpen.r || "" });
    var cnt = h("span", { class: "muted small" });
    var count = function () { lib.findOpen.q = f.value; lib.findOpen.r = r.value; var n = f.value ? libFindAll(f.value).length : 0; cnt.textContent = f.value ? trn(n, "{n} match", "{n} matches") : ""; };
    f.addEventListener("input", count); r.addEventListener("input", count);
    f.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); libFindNext(f.value); } if (e.key === "Escape") { lib.findOpen = false; libBars(d); } });
    el.append(h("div", { class: "lib-bar" }, libIcon("find"), f, r, cnt,
      h("button", { class: "btn sm", onclick: function () { libFindNext(f.value); } }, tr("Next")),
      h("button", { class: "btn sm", onclick: function () { libReplace(f.value, r.value, false); count(); } }, tr("Replace")),
      h("button", { class: "btn sm primary", onclick: function () { var n = libReplace(f.value, r.value, true); toast(trn(n, "{n} replaced", "{n} replaced")); count(); } }, tr("Replace all")),
      h("button", { class: "btn sm ghost", onclick: function () { lib.findOpen = false; libBars(d); } }, tr("Close"))));
    count(); setTimeout(function () { f.focus(); f.select(); }, 0);
  }
}
function libLinkBar() {
  libSaveSel();
  var s = getSelection(), a = s.rangeCount ? libClosest(s.getRangeAt(0).startContainer.parentNode, "A") : null;
  lib.linkOpen = { href: a ? a.getAttribute("href") : "" };
  libBars(libCur());
}
function libFindBar() { var s = String(getSelection()); lib.findOpen = { q: s && s.length < 80 ? s : (lib.findOpen && lib.findOpen.q) || "", r: "" }; libBars(libCur()); }
function libFindAll(q) {
  var out = [], walker = document.createTreeWalker(lib.ed, NodeFilter.SHOW_TEXT), n, ql = q.toLowerCase();
  while ((n = walker.nextNode())) { var t = n.nodeValue.toLowerCase(), i = t.indexOf(ql); while (i >= 0) { out.push([n, i]); i = t.indexOf(ql, i + ql.length); } }
  return out;
}
function libFindNext(q) {
  if (!q) return; var all = libFindAll(q); if (!all.length) { toast(tr("Not found.")); return; }
  var s = getSelection(), after = 0;
  if (s.rangeCount) { var r0 = s.getRangeAt(0); for (var i = 0; i < all.length; i++) { var rr = document.createRange(); rr.setStart(all[i][0], all[i][1]); if (rr.compareBoundaryPoints(Range.START_TO_END, r0) > 0) { after = i; break; } after = 0; } }
  var m = all[after], r = document.createRange(); r.setStart(m[0], m[1]); r.setEnd(m[0], m[1] + q.length);
  s.removeAllRanges(); s.addRange(r);
  var el = m[0].parentNode; if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" });
}
function libReplace(q, rep, all) {
  if (!q) return 0;
  var s = getSelection(), n = 0;
  if (!all) {
    if (s.rangeCount && String(s).toLowerCase() === q.toLowerCase()) { lib.ed.focus(); document.execCommand("insertText", false, rep); n = 1; libDirty(); }
    libFindNext(q); return n;
  }
  libFindAll(q).reverse().forEach(function (m) { var v = m[0].nodeValue; m[0].nodeValue = v.slice(0, m[1]) + rep + v.slice(m[1] + q.length); n++; });
  if (n) libDirty();
  return n;
}
function libTableAsk() {
  libSaveSel();
  openModal({ kind: "libtable" });
}
FORMS.libtable = function () {
  return {
    title: tr("Insert a table"), createLabel: tr("Insert"),
    fields: [
      { k: "rows", label: tr("Rows"), t: "number", def: "3", min: 1, maxv: 40, half: true, first: true },
      { k: "cols", label: tr("Columns"), t: "number", def: "3", min: 1, maxv: 12, half: true },
      { k: "head", label: tr("Header row"), t: "select", def: "yes", options: function () { return [{ value: "yes", label: tr("Yes") }, { value: "no", label: tr("No") }]; } }
    ],
    save: function (v) {
      var R = Math.min(40, Math.max(1, Number(v.rows) || 3)), Cc = Math.min(12, Math.max(1, Number(v.cols) || 3)), html = "<table>";
      if (v.head === "yes") { html += "<thead><tr>"; for (var c = 0; c < Cc; c++) html += "<th>" + libEsc(tr("Heading")) + "</th>"; html += "</tr></thead>"; }
      html += "<tbody>"; for (var r = 0; r < R; r++) { html += "<tr>"; for (var c2 = 0; c2 < Cc; c2++) html += "<td><br></td>"; html += "</tr>"; } html += "</tbody></table><p><br></p>";
      closeModal(); libInsertHTML(html);
    }
  };
};

/* ---------- writer tools ---------- */
function libSlug(t, used) { var b = "h-" + (String(t).toLowerCase().replace(/[^\w֐-׿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "s"), s = b, i = 2; while (used[s]) s = b + "-" + i++; used[s] = 1; return s; }
function libHeadings() { return [].slice.call(lib.ed.querySelectorAll("h1, h2, h3")).filter(function (x) { return !x.closest("nav.toc, div.toc") && x.textContent.trim(); }); }
/* a table of contents from the headings, at the top (or where the old one was) */
function libToc() {
  var hs = libHeadings();
  if (!hs.length) { toast(tr("Add some headings first — or use Organize on pasted notes.")); return; }
  var used = {};
  hs.forEach(function (x) { x.id = libSlug(x.textContent, used); });
  var nums = [0, 0, 0], items = hs.map(function (x) {
    var lv = Number(x.tagName[1]) - 1; nums[lv]++; for (var j = lv + 1; j < 3; j++) nums[j] = 0;
    return '<p class="toc' + lv + '"><a href="#' + x.id + '">' + libEsc(x.textContent.trim()) + "</a></p>";
  });
  var html = '<h4>' + libEsc(tr("Contents")) + "</h4>" + items.join("");
  var old = lib.ed.querySelector("div.toc");
  if (old) old.innerHTML = libClean(html);
  else { var box = document.createElement("div"); box.className = "toc"; box.innerHTML = libClean(html); lib.ed.insertBefore(box, lib.ed.firstChild); }
  libDirty(); toast(tr("Table of contents updated."));
}
/* turn a raw dump into structure: headings, lists, Q&A, code, callouts — then a table of contents */
function libOrganize() {
  var s = getSelection(), scope = null;
  if (lib.savedRange && !lib.savedRange.collapsed) { libRestoreSel(); s = getSelection(); }
  var blocks = [].slice.call(lib.ed.children);
  if (s.rangeCount && !s.isCollapsed) blocks = blocks.filter(function (b) { return s.containsNode(b, true); });
  /* only plain paragraphs are reorganised; headings, tables and lists stay as they are */
  var lines = [];
  blocks.forEach(function (b) {
    if (/^(P|DIV)$/.test(b.tagName) && !b.className) b.innerHTML.split(/<br\s*\/?>/i).forEach(function (part) { var t = document.createElement("div"); t.innerHTML = part; lines.push({ b: b, html: part, text: (t.textContent || "").replace(/ /g, " ") }); });
  });
  if (!lines.length) { toast(tr("Paste your notes as plain paragraphs, then run Organize.")); return; }
  var out = [], list = null, code = null, flush = function () { if (list) { out.push("<" + list.t + (list.check ? ' class="check"' : "") + ">" + list.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</" + list.t + ">"); list = null; } if (code) { out.push("<pre>" + libEsc(code.join("\n")) + "</pre>"); code = null; } };
  var codeish = function (t) { return /^\s{2,}\S/.test(t) || /[{};]\s*$/.test(t) || /^\s*(\$|#!|<\?xml|<\w+[^>]*>|SELECT |INSERT |UPDATE |def |function |class |import |public |private |var |const |let )/i.test(t); };
  lines.forEach(function (ln) {
    var t = ln.text, tt = t.trim(), m;
    if (code && (codeish(t) || /^\s*[}\])]/.test(t) || (tt === "" && code.length))) { code.push(t.replace(/\s+$/, "")); return; }
    if (codeish(t) && !/^\s*[-*•]\s/.test(t)) { if (list) flush(); code = code || []; code.push(t.replace(/\s+$/, "")); return; }
    if (!tt) { flush(); return; }
    if ((m = /^(#{1,3})\s+(.+)$/.exec(tt))) { flush(); out.push("<h" + m[1].length + ">" + libEsc(m[2]) + "</h" + m[1].length + ">"); return; }
    /* "1.2 Title" or "1.2.3 Title" is a numbered heading; "3 Title" (no full stop) a chapter; "1. Do this" a step */
    if ((m = /^(\d+\.\d+(?:\.\d+)?)\.?\s+(.{2,80})$/.exec(tt)) && !/[.;,:]$/.test(tt)) { flush(); var dep = Math.min(3, m[1].split(".").length); out.push("<h" + dep + ">" + libEsc(m[2]) + "</h" + dep + ">"); return; }
    if ((m = /^(\d{1,2})\s+([A-Z\u0590-\u05FF].{1,60})$/.exec(tt)) && !/[.;,:]$/.test(tt)) { flush(); out.push("<h1>" + libEsc(m[2]) + "</h1>"); return; }
    if (tt.length <= 70 && /:$/.test(tt) && !/^(q|a|question|answer|ש|ת)\s*[:.]/i.test(tt)) { flush(); out.push("<h2>" + libEsc(tt.replace(/:$/, "")) + "</h2>"); return; }
    if (tt.length <= 60 && tt === tt.toUpperCase() && /[A-Z]{3}/.test(tt)) { flush(); out.push("<h1>" + libEsc(tt.charAt(0) + tt.slice(1).toLowerCase()) + "</h1>"); return; }
    if ((m = /^(?:q|question|שאלה|ש)\s*[:.\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="qa"><p class="q">' + libEsc(m[1]) + "</p>"); return; }
    if ((m = /^(?:a|answer|תשובה|ת)\s*[:.\-]\s*(.+)$/i.exec(tt))) { flush(); if (out.length && /^<div class="qa">/.test(out[out.length - 1]) && !/<\/div>$/.test(out[out.length - 1])) out[out.length - 1] += '<p class="a">' + libEsc(m[1]) + "</p></div>"; else out.push('<div class="qa"><p class="a">' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:note|הערה)\s*[:\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="callout note"><p>' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:warning|caution|important|אזהרה|זהירות)\s*[:\-]\s*(.+)$/i.exec(tt))) { flush(); out.push('<div class="callout warn"><p>' + libEsc(m[1]) + "</p></div>"); return; }
    if ((m = /^(?:todo|follow[- ]?up|tbd|\?\?|לבדוק|המשך)\s*[:\-]?\s*(.+)$/i.exec(tt))) { flush(); out.push('<p><mark class="fu">' + libEsc(m[1]) + "</mark></p>"); return; }
    if ((m = /^\[( |x)?\]\s*(.+)$/i.exec(tt))) { if (!list || list.t !== "ul" || !list.check) { flush(); list = { t: "ul", check: true, items: [] }; } list.items.push(libEsc(m[2])); return; }
    if ((m = /^[-*•–]\s+(.+)$/.exec(tt))) { if (!list || list.t !== "ul" || list.check) { flush(); list = { t: "ul", items: [] }; } list.items.push(libEsc(m[1])); return; }
    if ((m = /^(?:\d+|[a-z])[.)]\s+(.+)$/i.exec(tt))) { if (!list || list.t !== "ol") { flush(); list = { t: "ol", items: [] }; } list.items.push(libEsc(m[1])); return; }
    flush(); out.push("<p>" + ln.html.trim() + "</p>");
  });
  flush();
  var first = lines[0].b, holder = document.createElement("div"); holder.innerHTML = libClean(out.join(""));
  var frag = document.createDocumentFragment(); while (holder.firstChild) frag.appendChild(holder.firstChild);
  first.before(frag);
  var seen = []; lines.forEach(function (l) { if (seen.indexOf(l.b) < 0) { seen.push(l.b); l.b.remove(); } });
  libTidyCode(true);
  if (libHeadings().length >= 2) libToc();
  libDirty(); toast(tr("Notes organised: headings, lists, Q&A and code found."));
}
/* pretty-print the code blocks: JSON, XML / HTML, and brace-based languages */
function libTidyCode(quiet) {
  var n = 0;
  [].slice.call(lib.ed.querySelectorAll("pre")).forEach(function (pre) {
    var src = pre.textContent.replace(/ /g, " "), out = src, lang = "lang-code";
    var t = src.trim();
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
  if (n) libDirty();
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
  libRestoreSel();
  var s = getSelection(); if (!s.rangeCount || s.isCollapsed) { libExec("formatBlock", "PRE"); return; }
  var text = String(s);
  libInsertHTML("<pre>" + libEsc(text) + "</pre><p><br></p>");
  libTidyCode(true);
}
function libGlossary() {
  var terms = libTerms();
  if (!terms.length) { toast(tr("Mark some terms first (select a word, then Writer tools → Mark as a term).")); return; }
  var html = "<h2>" + libEsc(tr("Glossary")) + "</h2><table><thead><tr><th>" + libEsc(tr("Term")) + "</th><th>" + libEsc(tr("Meaning")) + "</th></tr></thead><tbody>" +
    terms.map(function (t) { return "<tr><td>" + libEsc(t.term) + "</td><td>" + (t.def ? libEsc(t.def) : "<br>") + "</td></tr>"; }).join("") + "</tbody></table>";
  var old = [].slice.call(lib.ed.querySelectorAll("h2")).filter(function (x) { return x.textContent.trim() === tr("Glossary"); })[0];
  if (old && old.nextElementSibling && old.nextElementSibling.tagName === "TABLE") { old.nextElementSibling.remove(); old.remove(); }
  lib.ed.focus(); var r = document.createRange(); r.selectNodeContents(lib.ed); r.collapse(false); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  document.execCommand("insertHTML", false, libClean(html)); libDirty();
}
function libTerms() {
  var seen = {}, out = [];
  [].slice.call(lib.ed.querySelectorAll("span.term")).forEach(function (x) {
    var t = x.textContent.trim(); if (!t || seen[t.toLowerCase()]) return; seen[t.toLowerCase()] = 1;
    out.push({ term: t, def: x.getAttribute("data-def") || "", el: x });
  });
  return out.sort(function (a, b) { return a.term.localeCompare(b.term); });
}
function libMergeEmpty() { [].slice.call(lib.ed.querySelectorAll("p")).forEach(function (p, i, all) { if (!p.textContent.trim() && !p.querySelector("img") && p.nextElementSibling && p.nextElementSibling.tagName === "P" && !p.nextElementSibling.textContent.trim() && !p.nextElementSibling.querySelector("img")) p.remove(); }); }

/* ---------- the side panel ---------- */
function libFill(el) { var kids = [].slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; }); el.replaceChildren.apply(el, kids); }
function libSide(d) {
  var box = document.getElementById("lib-side"); if (!box || !lib.ed) return;
  var canW = libCanWrite(d);
  if (lib.side === "outline") {
    var hs = libHeadings();
    libFill(box, hs.length ? h("nav", { class: "lib-outline", "aria-label": tr("Outline") }, hs.map(function (x) {
      return h("button", { class: "o" + x.tagName[1], dir: "auto", onclick: function () { x.scrollIntoView({ behavior: "smooth", block: "start" }); libCaret(x, true); } }, x.textContent.trim());
    })) : h("p", { class: "muted small" }, tr("Headings appear here. Type # and a space for a heading, or run Organize on pasted notes.")));
    return;
  }
  if (lib.side === "followups") {
    var fus = [].slice.call(lib.ed.querySelectorAll("mark.fu"));
    var open = [].slice.call(lib.ed.querySelectorAll("ul.check > li")).filter(function (li) { return !li.classList.contains("done") && li.textContent.trim(); });
    libFill(box, 
      h("p", { class: "muted small" }, tr("Select text, then Writer tools → Mark as a follow-up. Unticked checklist items are listed too.")),
      fus.length || open.length ? h("div", { class: "lib-fu" },
        fus.map(function (m) {
          return h("div", { class: "fu-item" + (m.classList.contains("done") ? " done" : "") },
            canW ? h("input", { type: "checkbox", checked: m.classList.contains("done"), "aria-label": tr("Resolved"), onchange: function (e) { m.classList.toggle("done", e.target.checked); libDirty(); libSide(d); } }) : null,
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
          h("input", { class: "f", value: t.def, placeholder: tr("What it means"), disabled: !canW, oninput: function (e) {
            lib.ed.querySelectorAll("span.term").forEach(function (x) { if (x.textContent.trim().toLowerCase() === t.term.toLowerCase()) x.setAttribute("data-def", e.target.value); });
            libDirty();
          } }));
      })) : h("p", { class: "muted" }, tr("No terms yet.")),
      canW && terms.length ? h("button", { class: "btn sm", onclick: libGlossary }, tr("Insert glossary from terms")) : null);
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
    h("label", { class: "row small", style: { margin: "4px 0 12px" } }, h("input", { type: "checkbox", checked: !!d.private, disabled: !(canW && d.authorId === me().id), onchange: function (e) { set("private", e.target.checked); render(); } }), tr("Private — only I can see it")),
    h("p", { class: "muted small" }, tr("Created by {n}", { n: userName(d.authorId) }), " · ", fmtDate(d.createdAt)),
    libCanDelete(d) ? h("button", { class: "btn sm danger", onclick: function () {
      confirmBox(tr("Delete this document?"), d.title, tr("Delete"), function () {
        var copyOf = JSON.parse(JSON.stringify(d)), at = db.library.indexOf(d);
        db.library = db.library.filter(function (x) { return x.id !== d.id; }); lib.ed = null; lib.edFor = null; save(true); go("library");
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
  var body = libClean(lib.ed.innerHTML), title = d.title || tr("Untitled"), dir = LANG === "he" ? "rtl" : "ltr";
  var css = "body{font-family:Calibri,'Noto Sans',Arial,sans-serif;font-size:11pt;line-height:1.5;color:#1b2a18;max-width:780px;margin:24px auto;padding:0 16px}" +
    "h1{font-size:18pt;color:#1F3D24;border-bottom:1px solid #cfe0bd;padding-bottom:2pt}h2{font-size:14pt;color:#2f5a1a}h3{font-size:12pt}" +
    "table{border-collapse:collapse;width:100%}th,td{border:1px solid #bfcfb0;padding:4pt 6pt;vertical-align:top;text-align:start}th{background:#eef5e5}" +
    "pre{background:#f4f6f2;border:1px solid #dde6d5;padding:8pt;font-family:Consolas,monospace;font-size:9.5pt;white-space:pre-wrap;direction:ltr;text-align:left}" +
    "code{font-family:Consolas,monospace;background:#f4f6f2;padding:0 2pt}blockquote{border-inline-start:3pt solid #8CC63E;margin-inline-start:0;padding-inline-start:10pt;color:#4a5a46}" +
    ".q{font-weight:bold;margin-bottom:0}.a{margin-top:2pt;padding-inline-start:12pt}.callout{border:1px solid #cfe0bd;background:#f6faf0;padding:4pt 10pt;margin:8pt 0}" +
    ".callout.warn,.callout.caution{border-color:#f0c36d;background:#fff7e6}mark.fu{background:#ffe9a8}mark.fu.done{background:none;text-decoration:line-through}.term{border-bottom:1px dotted #555}" +
    "ul.check{list-style:none;padding-inline-start:4pt}ul.check li:before{content:'\\2610  '}ul.check li.done:before{content:'\\2611  '}ul.check li.done{color:#777;text-decoration:line-through}" +
    ".toc{border:1px solid #dde6d5;padding:6pt 12pt;margin-bottom:12pt}.toc p{margin:2pt 0}.toc .toc1{padding-inline-start:14pt}.toc .toc2{padding-inline-start:28pt}img{max-width:100%}";
  var meta = [byId(db.clients, d.clientId), byId(db.projects, d.projectId)].filter(Boolean).map(function (x) { return x.name; });
  if (d.sme) meta.push(d.sme + (d.smeRole ? " (" + d.smeRole + ")" : ""));
  if (d.date) meta.push(fmtDate(d.date));
  var doc = "<!doctype html><html dir=\"" + dir + "\"><head><meta charset=\"utf-8\"><title>" + libEsc(title) + "</title><style>" + css + "</style></head><body>" +
    "<h1 style=\"border:0;font-size:22pt\">" + libEsc(title) + "</h1>" + (meta.length ? "<p style=\"color:#5f6e62\">" + libEsc(meta.join(" · ")) + "</p>" : "") +
      body + "</body></html>";
  var name = (title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document").slice(0, 80);
  if (kind === "doc") saveFile(name + ".doc", "﻿" + doc.replace("<html", "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:w=\"urn:schemas-microsoft-com:office:word\""), "application/msword", tr("Word document"));
  else if (kind === "html") saveFile(name + ".html", doc, "text/html", tr("Web page"));
  else if (kind === "md") saveFile(name + ".md", "# " + title + "\n\n" + libMarkdown(lib.ed), "text/markdown", "Markdown");
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
