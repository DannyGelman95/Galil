/* =====================================================================
   Taskana — the Library's document editor.
   The document is edited inside a sandboxed frame (no scripts can run in
   it), so a document can carry its own stylesheet — a linked CSS file and
   CSS of its own — without touching Taskana's look, and HTML pasted in
   HTML mode renders as it would on a page. Everything typed or pasted is
   sanitised (libClean) before it is kept.
   ===================================================================== */
"use strict";

var ED = { d: null, wrap: null, frame: null, win: null, doc: null, root: null, html: "", editing: false, mode: "visual",
  hist: [], hi: -1, pend: null, saved: null, bars: null, src: null, anchor: null, rz: null, img: null, tb: null };

/* ---------- sanitising ---------- */
var LIB_TAGS = ("P BR H1 H2 H3 H4 H5 H6 STRONG B EM I U S STRIKE DEL INS CODE PRE KBD SAMP VAR BLOCKQUOTE Q CITE ABBR DFN SMALL SUP SUB MARK SPAN DIV " +
  "SECTION ARTICLE ASIDE HEADER FOOTER NAV MAIN FIGURE FIGCAPTION DETAILS SUMMARY UL OL LI DL DT DD A IMG TABLE CAPTION COLGROUP COL THEAD TBODY TFOOT TR TH TD HR TIME ADDRESS")
  .split(" ").reduce(function (o, t) { o[t] = 1; return o; }, {});
var LIB_DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, FRAME: 1, OBJECT: 1, EMBED: 1, META: 1, LINK: 1, TEMPLATE: 1, BASE: 1, FORM: 1, INPUT: 1, BUTTON: 1, SELECT: 1, TEXTAREA: 1, SVG: 1, MATH: 1, NOSCRIPT: 1, AUDIO: 1, VIDEO: 1, SOURCE: 1, CANVAS: 1, TITLE: 1, HEAD: 1 };
function libEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function libCleanStyle(v) {
  return String(v || "").split(";").map(function (d) {
    var i = d.indexOf(":"); if (i < 1) return "";
    var p = d.slice(0, i).trim().toLowerCase(), val = d.slice(i + 1).trim();
    if (!/^-?[a-z][a-z-]*$/.test(p) || /expression|javascript:|behavior|binding|@import|<\/|\\/i.test(val)) return "";
    if (/url\s*\(/i.test(val) && !/url\(\s*["']?(data:image\/(png|jpe?g|gif|webp);|https:)/i.test(val)) return "";
    return p + ": " + val;
  }).filter(Boolean).join("; ");
}
function libCleanCss(css) {
  return String(css || "").replace(/<\/?style[^>]*>/gi, "").replace(/@import[^;]*;?/gi, "")
    .replace(/expression\s*\(|javascript:|behavior\s*:|-moz-binding/gi, "/*removed*/");
}
function libClean(html) {
  var tpl = document.createElement("template");
  tpl.innerHTML = String(html || "").replace(/<!--[\s\S]*?-->/g, "");
  (function walk(node) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { c.remove(); return; }
      var tag = c.tagName.toUpperCase();
      if (LIB_DROP[tag] || /:/.test(c.tagName)) { if (/:/.test(c.tagName) && !LIB_DROP[tag]) { walk(c); var f0 = document.createDocumentFragment(); while (c.firstChild) f0.appendChild(c.firstChild); c.replaceWith(f0); } else c.remove(); return; }
      if (!LIB_TAGS[tag]) { walk(c); var frag = document.createDocumentFragment(); while (c.firstChild) frag.appendChild(c.firstChild); c.replaceWith(frag); return; }
      [].slice.call(c.attributes).forEach(function (a) {
        var n = a.name.toLowerCase(), v = a.value, ok = false;
        if (n === "class") { var k = v.split(/\s+/).filter(function (x) { return /^[\w-]{1,60}$/.test(x); }).join(" "); if (k) { c.setAttribute("class", k); } else c.removeAttribute(a.name); return; }
        if (n === "style") { var st = libCleanStyle(v); if (st) c.setAttribute("style", st); else c.removeAttribute(a.name); return; }
        ok = (n === "href" && tag === "A" && /^\s*(https?:|mailto:|tel:|#)/i.test(v)) ||
          (n === "src" && tag === "IMG" && /^\s*(data:image\/(png|jpe?g|gif|webp);|https?:)/i.test(v)) ||
          /^(alt|title|dir|lang|datetime|scope|headers|abbr)$/.test(n) ||
          ((n === "colspan" || n === "rowspan" || n === "span") && /^\d{1,2}$/.test(v)) ||
          ((n === "width" || n === "height") && /^\d{1,4}%?$/.test(v)) ||
          (n === "id" && /^[\w-]{1,60}$/.test(v)) ||
          (n === "start" && /^-?\d{1,4}$/.test(v)) || (n === "type" && tag === "OL" && /^[1aAiI]$/.test(v)) ||
          (n === "reversed" && tag === "OL") || (n === "open" && tag === "DETAILS") ||
          (/^data-[\w-]{1,30}$/.test(n) && v.length < 500);
        if (!ok) c.removeAttribute(a.name);
      });
      if (tag === "IMG" && !c.getAttribute("src")) { c.remove(); return; }
      if (tag === "A") { if (/^\s*#/.test(c.getAttribute("href") || "")) c.removeAttribute("target"); else { c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener noreferrer"); } }
      /* every block takes the direction of its own text */
      if (/^(P|LI|H1|H2|H3|H4|H5|H6|TD|TH|BLOCKQUOTE|DT|DD|FIGCAPTION|SUMMARY)$/.test(tag) && !c.hasAttribute("dir")) c.setAttribute("dir", "auto");
      walk(c);
    });
  })(tpl.content);
  return tpl.innerHTML;
}

/* ---------- the frame ---------- */
var ED_CSS = [
  "html{background:#fff}body{margin:0;font:15px/1.65 'Noto Sans','Noto Sans Hebrew','Segoe UI',system-ui,Arial,sans-serif;color:#1C2D4A}",
  "#doc{outline:none;padding:34px 44px 80px;min-height:calc(100vh - 114px);overflow-wrap:anywhere;caret-color:#B5600E}",
  "#doc[contenteditable=true]{cursor:text}",
  "#doc>:first-child{margin-top:0}",
  "h1,h2,h3,h4{color:#1F3A66;line-height:1.3}h1{font-size:24px;margin:24px 0 10px;padding-bottom:5px;border-bottom:1px solid #D5DBE6}h2{font-size:19px;margin:20px 0 8px}h3{font-size:16px;margin:16px 0 6px}h4{font-size:13.5px;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em;color:#5F656E}",
  "p{margin:0 0 9px}a{color:#0E7F91}a.doclink{text-decoration:none;border-bottom:1px dashed #0E7F91}a.tasklink{text-decoration:none;border-bottom:1px dashed #6250D6;color:#45379A}",
  "[dir]{text-align:start}",
  "ul,ol{margin:0 0 10px;padding-inline-start:28px}li{margin:2px 0}li>ul,li>ol,ol>ol,ul>ul,ol>ul,ul>ol{margin:2px 0}",
  "ul ul{list-style-type:circle}ul ul ul{list-style-type:square}ol ol{list-style-type:lower-alpha}ol ol ol{list-style-type:lower-roman}",
  "ul.b-disc{list-style-type:disc}ul.b-circle{list-style-type:circle}ul.b-square{list-style-type:square}ul.b-dash{list-style-type:'– '}ul.b-arrow{list-style-type:'➔ '}ul.b-none{list-style-type:none}",
  "ol.l-dec{list-style-type:decimal}ol.l-la{list-style-type:lower-alpha}ol.l-ua{list-style-type:upper-alpha}ol.l-lr{list-style-type:lower-roman}ol.l-ur{list-style-type:upper-roman}",
  /* multilevel 1 / 1.1 / 1.1.1 */
  "ol.l-ml,ol.l-ml ol{list-style:none;counter-reset:ml;padding-inline-start:0}ol.l-ml ol{padding-inline-start:26px}",
  "ol.l-ml li{counter-increment:ml;display:block}ol.l-ml li:before{content:counters(ml,'.') '. ';font-weight:650;color:#B5600E;margin-inline-end:6px}",
  /* outline 1 / a / i */
  "ol.l-out{list-style-type:decimal}ol.l-out ol{list-style-type:lower-alpha}ol.l-out ol ol{list-style-type:lower-roman}",
  "ul.check{list-style:none;padding-inline-start:4px}ul.check>li{position:relative;padding-inline-start:26px}",
  "ul.check>li:before{content:'';position:absolute;inset-inline-start:0;top:.35em;width:15px;height:15px;border:1.5px solid #5F656E;border-radius:4px;background:#fff}",
  "#doc[contenteditable=true] ul.check>li:before{cursor:pointer}ul.check>li.done{color:#7b877a;text-decoration:line-through}ul.check>li.done:before{background:#B5600E;border-color:#B5600E;box-shadow:inset 0 0 0 2px #fff}",
  "blockquote{margin:10px 0;padding:4px 16px;border-inline-start:3px solid #F08A24;color:#464D5A}",
  "pre{direction:ltr;text-align:left;background:#F0F3F7;border:1px solid #D5DBE6;border-radius:9px;padding:11px 13px;font:13px/1.5 'Noto Sans Mono',ui-monospace,Consolas,monospace;white-space:pre-wrap;margin:8px 0 12px;position:relative;tab-size:2}",
  "pre[class*=lang-]:after{position:absolute;top:4px;inset-inline-end:9px;font:600 10px sans-serif;color:#858B95;text-transform:uppercase;letter-spacing:.05em}",
  "pre.lang-json:after{content:'JSON'}pre.lang-xml:after{content:'XML'}pre.lang-sql:after{content:'SQL'}pre.lang-shell:after{content:'Shell'}pre.lang-code:after{content:'Code'}",
  "code{font:13px 'Noto Sans Mono',ui-monospace,Consolas,monospace;background:#F0F3F7;border:1px solid #D5DBE6;border-radius:4px;padding:0 3px}pre code{border:0;padding:0;background:none}",
  "kbd{font:12px 'Noto Sans Mono',ui-monospace,monospace;border:1px solid #C2C8D3;border-bottom-width:2px;border-radius:4px;padding:0 5px;background:#F9FAFC}",
  "mark{background:#FFF1A8;color:inherit}mark.fu{background:#FEF6E7;box-shadow:inset 0 -2px 0 #EDA100}mark.fu.done{background:none;box-shadow:none;text-decoration:line-through;color:#7b877a}",
  ".term{border-bottom:1.5px dotted #0E7F91;cursor:help}.ts{font:12px ui-monospace,monospace;color:#0E7F91}",
  "table{border-collapse:collapse;margin:10px 0 14px;font-size:14px}table.t-wide,table:not([style*=width]):not(.t-auto){width:100%}table.t-fixed{table-layout:fixed}",
  "th,td{border:1px solid #C4CDDC;padding:6px 9px;vertical-align:top;min-width:30px}th{background:#E5EBF5;font-weight:650}",
  "table.t-plain th,table.t-plain td{border:0;border-bottom:1px solid #DBE0EA}table.t-plain th{background:none}",
  "table.t-striped tbody tr:nth-child(even) td{background:#F1F4FA}table.t-compact th,table.t-compact td{padding:2px 6px;font-size:13px}",
  "table.t-dark thead th{background:#1F3A66;color:#fff}table.t-firstcol td:first-child{font-weight:650;background:#F0F3F7}",
  "caption{caption-side:top;text-align:start;font-weight:650;color:#5F656E;padding:0 0 4px}",
  ".va-m{vertical-align:middle}.va-b{vertical-align:bottom}",
  ".sh-1{background:#FFF7D6!important}.sh-2{background:#E4F5F2!important}.sh-3{background:#E8F1FC!important}.sh-4{background:#FBEBE9!important}.sh-5{background:#EFECFB!important}.sh-6{background:#EBEDF1!important}",
  "td.ed-sel,th.ed-sel{outline:2px solid #F08A24;outline-offset:-2px}",
  "img{max-width:100%;height:auto;border-radius:6px}img.ed-on{outline:3px solid #F08A24}img.im-left{float:left;margin:0 14px 8px 0}img.im-right{float:right;margin:0 0 8px 14px}img.im-center{display:block;margin:8px auto}",
  "hr{border:0;border-top:1px solid #D5DBE6;margin:18px 0}hr.pagebreak{border-top:2px dashed #ADB6C6;margin:26px 0;position:relative}hr.pagebreak:after{content:'⤓';position:absolute;top:-11px;left:50%;background:#fff;padding:0 6px;color:#858B95}",
  "@media print{hr.pagebreak{border:0;page-break-after:always;break-after:page}hr.pagebreak:after{content:none}}",
  ".qa{border:1px solid #D5DBE6;border-radius:10px;padding:8px 12px;margin:8px 0}.qa .q{font-weight:650;margin:0 0 2px;position:relative;padding-inline-start:20px}.qa .a{margin:0 0 6px;position:relative;padding-inline-start:20px}",
  ".qa .q:before,.qa .a:before{position:absolute;inset-inline-start:0;font-weight:800}.qa .q:before{content:'Q';color:#0E7F91}.qa .a:before{content:'A';color:#B5600E}",
  ":lang(he) .qa .q:before{content:'ש'}:lang(he) .qa .a:before{content:'ת'}",
  ".callout{border-radius:10px;padding:9px 14px;padding-inline-start:42px;margin:12px 0;border:1px solid #D5DBE6;background:#F0F3F7;position:relative}.callout:before{position:absolute;inset-inline-start:14px;top:9px;font-weight:800}",
  ".callout>:last-child{margin-bottom:0}.callout.note{background:#E4F5F2;border-color:#bfe5df}.callout.note:before{content:'ℹ';color:#1F9A8A}",
  ".callout.tip{background:#FEF3E7;border-color:#F7D3AE}.callout.tip:before{content:'✓';color:#B5600E}.callout.important{background:#E8F1FC;border-color:#c5dbf6}.callout.important:before{content:'!';color:#2A78D6}",
  ".callout.warn{background:#FEF6E7;border-color:#f7dfad}.callout.warn:before{content:'⚠';color:#B07800}.callout.caution{background:#FBEBE9;border-color:#f2c8c2}.callout.caution:before{content:'✕';color:#C0392B}",
  ".procedure{border-inline-start:3px solid #F08A24;padding:2px 0 2px 14px;padding-inline-start:14px;margin:12px 0}.procedure>h4{margin-top:0}.procedure .result{color:#B5600E}",
  ".prereq{background:#F0F3F7;border-radius:10px;padding:8px 14px;margin:10px 0}.prereq>h4{margin-top:0}",
  "dl{margin:8px 0 12px}dt{font-weight:650}dd{margin:0 0 6px;margin-inline-start:22px}",
  "figure{margin:12px 0;text-align:center}figure img{display:block;margin:0 auto}figcaption{font-size:13px;color:#5F656E;margin-top:4px}",
  ".cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:10px 0}.cols.c3{grid-template-columns:repeat(3,minmax(0,1fr))}.cols>div{min-width:0;border:1px dashed transparent}#doc[contenteditable=true] .cols>div{border-color:#D5DBE6;border-radius:6px;padding:4px}",
  "details{border:1px solid #D5DBE6;border-radius:10px;padding:6px 12px;margin:10px 0}summary{font-weight:650;cursor:pointer}",
  ".toc{border:1px solid #D5DBE6;border-radius:10px;padding:10px 16px;margin:0 0 18px;background:#F3F6FA}.toc h4{margin:0 0 6px}.toc p{margin:1px 0;font-size:14px}.toc a{color:#1F3A66;text-decoration:none}.toc .toc1{padding-inline-start:16px}.toc .toc2{padding-inline-start:32px;color:#5F656E}.toc .toc3{padding-inline-start:48px;color:#5F656E}",
  ".lead{font-size:17px;color:#2D3747}.small{font-size:12.5px;color:#5F656E}.caption{font-size:13px;color:#5F656E;font-style:italic}",
  ".fs-s{font-size:.85em}.fs-l{font-size:1.2em}.fs-xl{font-size:1.5em}",
  ".tc-1{color:#C0392B}.tc-2{color:#B06A00}.tc-3{color:#4E7A1C}.tc-4{color:#1F9A8A}.tc-5{color:#2A78D6}.tc-6{color:#6250D6}.tc-7{color:#A0326A}.tc-8{color:#5F656E}",
  ".hl-1{background:#FFF1A8}.hl-2{background:#D9F2C4}.hl-3{background:#CDEFF0}.hl-4{background:#DCE8FB}.hl-5{background:#F7D9E6}.hl-6{background:#FFE0C2}",
  ".al-c{text-align:center}.al-e{text-align:end}.al-j{text-align:justify}",
  ".ind-1{margin-inline-start:2em}.ind-2{margin-inline-start:4em}.ind-3{margin-inline-start:6em}.ind-4{margin-inline-start:8em}.ind-5{margin-inline-start:10em}.ind-6{margin-inline-start:12em}",
  ".fl{text-indent:2em}.hg{padding-inline-start:2em;text-indent:-2em}",
  ".lh-10{line-height:1.25}.lh-115{line-height:1.45}.lh-15{line-height:1.8}.lh-20{line-height:2.2}.sa-0{margin-bottom:0}.sa-2{margin-bottom:18px}",
  "#doc.numbered{counter-reset:h1}#doc.numbered h1{counter-reset:h2;counter-increment:h1}#doc.numbered h2{counter-reset:h3;counter-increment:h2}#doc.numbered h3{counter-increment:h3}",
  "#doc.numbered h1:before{content:counter(h1) '  ';color:#B5600E}#doc.numbered h2:before{content:counter(h1) '.' counter(h2) '  ';color:#B5600E}#doc.numbered h3:before{content:counter(h1) '.' counter(h2) '.' counter(h3) '  ';color:#B5600E}",
  ".ed-find{background:#FFE08A;outline:1px solid #EDA100}"
].join("\n");
function edSrcdoc() {
  return "<!doctype html><html lang=\"" + LANG + "\" dir=\"" + (LANG === "he" ? "rtl" : "ltr") + "\"><head><meta charset=\"utf-8\">" +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'self' 'unsafe-inline' https:; img-src data: https:; font-src 'self' https: data:\">" +
    "<link rel=\"stylesheet\" href=\"../shared/fonts/fonts.css\"><style id=\"ed-base\">" + ED_CSS + "</style><link id=\"ed-ext\" rel=\"stylesheet\"><style id=\"ed-user\"></style></head>" +
    "<body><main id=\"doc\" spellcheck=\"true\"></main></body></html>";
}
/* the editor for document d: the same element across redraws (the frame reloads when it is moved, and refills itself) */
function edMount(d) {
  if (ED.d && ED.d.id === d.id && ED.wrap) return ED.wrap;
  if (ED.d) libFlush();
  ED.d = d; ED.html = libClean(d.html); ED.hist = []; ED.hi = -1; ED.editing = false; ED.mode = "visual"; ED.img = null;
  ED.frame = h("iframe", { class: "ed-frame", title: tr("Document text"), sandbox: "allow-same-origin" });
  ED.frame.addEventListener("load", edOnLoad);
  ED.frame.srcdoc = edSrcdoc();
  ED.bars = h("div", { class: "ed-bars", id: "ed-bars" });
  ED.src = h("div", { class: "ed-src", hidden: true });
  ED.wrap = h("div", { class: "ed-wrap" }, ED.bars, h("div", { class: "ed-panes" }, ED.src, h("div", { class: "card ed-paper" }, ED.frame)));
  return ED.wrap;
}
function edOnLoad() {
  ED.win = ED.frame.contentWindow; ED.doc = ED.frame.contentDocument; ED.root = ED.doc && ED.doc.getElementById("doc");
  if (!ED.root) return;
  ED.root.innerHTML = ED.html;
  ED.root.classList.toggle("numbered", !!(ED.d && ED.d.numbered));
  edApplyStyles();
  edEditable();
  edWire();
  if (!ED.hist.length) edHistPush();
  if (ED.anchor) { var a = ED.anchor; ED.anchor = null; setTimeout(function () { edScrollTo(a); }, 50); }
  libAfterChange(true);
}
function edEditable() {
  if (!ED.root) return;
  ED.root.contentEditable = ED.editing && ED.mode === "visual" ? "true" : "false";
  if (ED.wrap) ED.wrap.classList.toggle("editing", ED.editing);
}
function edScrollTo(id) { var el = ED.root && ED.root.querySelector("#" + CSS.escape(id)); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }

/* ---------- selection ---------- */
function edSel() { return ED.win ? ED.win.getSelection() : null; }
function edRange() { var s = edSel(); if (!s || !s.rangeCount) return null; var r = s.getRangeAt(0); return ED.root.contains(r.commonAncestorContainer) ? r : null; }
function edFocus() { if (ED.root) { ED.win.focus(); if (!edRange()) { ED.root.focus(); } } }
function edSave() { var r = edRange(); ED.saved = r ? r.cloneRange() : null; }
function edRestore() { if (!ED.saved || !ED.root) return; ED.win.focus(); ED.root.focus(); var s = edSel(); s.removeAllRanges(); s.addRange(ED.saved); }
function edCaret(el, atStart) { var r = ED.doc.createRange(); r.selectNodeContents(el); r.collapse(!!atStart); var s = edSel(); s.removeAllRanges(); s.addRange(r); }
function edClosest(n, sel) { if (!n) return null; if (n.nodeType !== 1) n = n.parentNode; var x = n && n.closest ? n.closest(sel) : null; return x && ED.root.contains(x) && x !== ED.root ? x : null; }
var ED_BLOCK = "p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,dt,dd,figcaption,summary,td,th";
function edBlock() { var r = edRange(); return r ? edClosest(r.startContainer, ED_BLOCK) : null; }
/* the blocks the selection touches (the innermost ones) */
function edBlocks() {
  var r = edRange(); if (!r) return [];
  var all = [].slice.call(ED.root.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,dt,dd,figcaption,summary"));
  var hit = all.filter(function (b) { return r.intersectsNode(b); });
  hit = hit.filter(function (b) { return !hit.some(function (o) { return o !== b && b.contains(o) && o.tagName !== "LI"; }) || b.tagName === "LI"; });
  if (!hit.length) { var b0 = edBlock(); if (b0) hit = [b0]; }
  return hit;
}
function edOffsets() {
  var r = edRange(); if (!r) return null;
  var pos = function (n, o) { var x = ED.doc.createRange(); x.setStart(ED.root, 0); try { x.setEnd(n, o); } catch (e) { return 0; } return x.toString().length; };
  return [pos(r.startContainer, r.startOffset), pos(r.endContainer, r.endOffset)];
}
function edSetOffsets(o) {
  if (!o || !ED.root) return;
  var w = ED.doc.createTreeWalker(ED.root, NodeFilter.SHOW_TEXT), n, at = 0, r = ED.doc.createRange(), set = [false, false], last = null;
  while ((n = w.nextNode())) {
    var len = n.nodeValue.length; last = n;
    if (!set[0] && o[0] <= at + len) { r.setStart(n, o[0] - at); set[0] = true; }
    if (!set[1] && o[1] <= at + len) { r.setEnd(n, o[1] - at); set[1] = true; break; }
    at += len;
  }
  if (!set[0]) { if (!last) return; r.setStart(last, last.nodeValue.length); }
  if (!set[1]) r.collapse(true);
  var s = edSel(); s.removeAllRanges(); s.addRange(r);
}

/* ---------- history: our own, so undo and redo cover every change, ours and the browser's ---------- */
function edHistPush() {
  clearTimeout(ED.pend); ED.pend = null;
  if (!ED.root) return;
  var s = { html: ED.root.innerHTML, sel: edOffsets() }, top = ED.hist[ED.hi];
  if (top && top.html === s.html) { top.sel = s.sel || top.sel; return; }
  ED.hist = ED.hist.slice(0, ED.hi + 1); ED.hist.push(s);
  if (ED.hist.length > 400) ED.hist.shift();
  ED.hi = ED.hist.length - 1;
  edToolState();
}
function edHistSoon() { clearTimeout(ED.pend); ED.pend = setTimeout(edHistPush, 500); }
/* every change made by a button goes through here: one undo step each */
function edChange(fn) {
  if (!ED.root) return;
  if (ED.pend) edHistPush();
  var out = fn();
  ED.html = ED.root.innerHTML;
  edHistPush(); libDirty(); libAfterChange();
  return out;
}
function edUndo() { if (ED.pend) edHistPush(); if (ED.hi <= 0) return; ED.hi--; edBack(ED.hist[ED.hi]); }
function edRedo() { if (ED.pend) edHistPush(); if (ED.hi >= ED.hist.length - 1) return; ED.hi++; edBack(ED.hist[ED.hi]); }
function edBack(s) { ED.root.innerHTML = s.html; ED.html = s.html; ED.win.focus(); edSetOffsets(s.sel); libDirty(); libAfterChange(); edToolState(); }
function edCmd(cmd, val) { edFocus(); return edChange(function () { return ED.doc.execCommand(cmd, false, val == null ? null : val); }); }
function edInsertHTML(html) { if (ED.saved) edRestore(); edFocus(); edChange(function () { ED.doc.execCommand("insertHTML", false, libClean(html)); }); ED.saved = null; }

/* ---------- inline formatting that never breaks the lines: each text piece is wrapped on its own ---------- */
function edTextNodes(r) {
  var out = [], w = ED.doc.createTreeWalker(r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) if (r.intersectsNode(n) && n.nodeValue.length) out.push(n);
  return out;
}
function edMatches(el, tag, cls) { return el && el.nodeType === 1 && el.tagName === tag.toUpperCase() && (!cls || el.classList.contains(cls)); }
/* wrap (or, when every piece is already wrapped, unwrap) the selected text in <tag class=cls> */
function edWrap(tag, cls, opts) {
  opts = opts || {};
  var r = edRange(); if (!r) return null;
  if (r.collapsed) { toast(tr("Select some text first.")); return null; }
  return edChange(function () {
    var sc = r.startContainer, so = r.startOffset, ec = r.endContainer, eo = r.endOffset;
    /* split the end text node first, then the start one */
    if (ec.nodeType === 3 && eo < ec.nodeValue.length) ec.splitText(eo);
    if (sc.nodeType === 3 && so > 0) { var after = sc.splitText(so); if (ec === sc) { ec = after; } sc = after; so = 0; }
    var rr = ED.doc.createRange(); rr.setStart(sc, so);
    if (ec.nodeType === 3) rr.setEnd(ec, ec.nodeValue.length); else rr.setEnd(ec, eo);
    var nodes = edTextNodes(rr).filter(function (t) { return t.nodeValue.trim() || /\S/.test(t.parentNode.textContent); });
    var inside = function (t) { var p = t.parentNode; while (p && p !== ED.root) { if (edMatches(p, tag, cls)) return p; p = p.parentNode; } return null; };
    var made = [];
    if (!opts.force && nodes.length && nodes.every(inside)) {
      nodes.forEach(function (t) { var w = inside(t); if (w && w.parentNode) { var f = ED.doc.createDocumentFragment(); while (w.firstChild) f.appendChild(w.firstChild); w.replaceWith(f); } });
    } else {
      nodes.forEach(function (t) {
        if (inside(t) && !opts.force) return;
        if (!t.nodeValue.trim() && /^(TR|TBODY|THEAD|TABLE|UL|OL)$/.test(t.parentNode.tagName)) return;
        var w = ED.doc.createElement(tag); if (cls) w.className = cls;
        if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { w.setAttribute(k, opts.attrs[k]); });
        t.parentNode.insertBefore(w, t); w.appendChild(t); made.push(w);
      });
    }
    /* neighbours with the same wrapper become one */
    made.forEach(function (w) { var p = w.previousSibling; if (p && p.nodeType === 1 && p.tagName === w.tagName && p.className === w.className && p !== w) { while (w.firstChild) p.appendChild(w.firstChild); w.remove(); } });
    ED.root.normalize();
    var live = made.filter(function (w) { return w.isConnected; });
    if (live.length) { var nr = ED.doc.createRange(); nr.setStartBefore(live[0]); nr.setEndAfter(live[live.length - 1]); var s = edSel(); s.removeAllRanges(); s.addRange(nr); }
    return live;
  });
}
/* remove every span with one of these classes inside the selection, then wrap with the new one */
function edSpanClass(prefix, cls) {
  var r = edRange(); if (!r) return;
  if (r.collapsed) { toast(tr("Select some text first.")); return; }
  edChange(function () {
    [].slice.call(ED.root.querySelectorAll("span")).forEach(function (s) {
      if (!r.intersectsNode(s)) return;
      var keep = s.className.split(/\s+/).filter(function (c) { return c && c.indexOf(prefix) !== 0; });
      if (keep.length) s.className = keep.join(" ");
      else if (!s.attributes.length || (s.attributes.length === 1 && s.hasAttribute("class"))) { var f = ED.doc.createDocumentFragment(); while (s.firstChild) f.appendChild(s.firstChild); s.replaceWith(f); }
      else s.removeAttribute("class");
    });
  });
  if (cls) edWrap("span", cls, { force: true });
}
/* a class on every block in the selection; same-prefix classes are replaced */
function edBlockClass(prefix, cls, blocks) {
  edChange(function () {
    (blocks || edBlocks()).forEach(function (b) {
      b.className.split(/\s+/).forEach(function (c) { if (c && new RegExp("^(" + prefix + ")").test(c)) b.classList.remove(c); });
      if (cls) b.classList.add(cls);
      if (!b.className) b.removeAttribute("class");
    });
  });
}

/* ---------- events in the frame ---------- */
function edWire() {
  var d = ED.doc, root = ED.root;
  root.addEventListener("input", function () { ED.html = root.innerHTML; edHistSoon(); libDirty(); libAfterChangeSoon(); });
  root.addEventListener("beforeinput", function (e) {
    if (e.inputType === "historyUndo") { e.preventDefault(); edUndo(); }
    if (e.inputType === "historyRedo") { e.preventDefault(); edRedo(); }
  });
  root.addEventListener("blur", function () { if (ED.pend) edHistPush(); libFlush(); });
  d.addEventListener("selectionchange", function () { clearTimeout(ED.selT); ED.selT = setTimeout(edToolState, 80); });
  d.addEventListener("keydown", edKeys);
  d.addEventListener("mousedown", function () { edCloseMenus(); });
  root.addEventListener("paste", edPaste);
  root.addEventListener("drop", function (e) {
    if (!ED.editing) { e.preventDefault(); return; }
    var f = e.dataTransfer && [].slice.call(e.dataTransfer.files || []).filter(function (x) { return /^image\//.test(x.type); })[0];
    if (f) { e.preventDefault(); edImageFile(f); }
  });
  root.addEventListener("click", edClick);
  root.addEventListener("dblclick", function () { if (!ED.editing && libCanEditNow()) libEditMode(true); });
  root.addEventListener("mousemove", edTableHover);
  root.addEventListener("mousedown", edTableDown);
}
function edKeys(e) {
  var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (e.key === "Escape" && ED_MENUS.length) { e.preventDefault(); edCloseMenus(); return; }
  if (e.key === "Escape" && ED.barKind) { e.preventDefault(); edCloseBar(); return; }
  if (mod && k === "f") { e.preventDefault(); edFindBar(); return; }
  if (mod && k === "s") { e.preventDefault(); libFlush(); toast(tr("Saved")); return; }
  if (mod && k === "p") { e.preventDefault(); libExport("print"); return; }
  if (!ED.editing) { if (mod && k === "e") { e.preventDefault(); libEditMode(true); } return; }
  if (mod && !e.shiftKey && k === "z") { e.preventDefault(); edUndo(); return; }
  if (mod && (k === "y" || (e.shiftKey && k === "z"))) { e.preventDefault(); edRedo(); return; }
  if (mod && k === "e") { e.preventDefault(); libEditMode(false); return; }
  if (mod && k === "k") { e.preventDefault(); edLinkBar(); return; }
  if (mod && e.shiftKey && k === "7") { e.preventDefault(); edList("ol", "l-dec"); return; }
  if (mod && e.shiftKey && k === "8") { e.preventDefault(); edList("ul", "b-disc"); return; }
  if (mod && e.altKey && /^[1-4]$/.test(k)) { e.preventDefault(); edCmd("formatBlock", "H" + k); return; }
  if (mod && e.altKey && k === "0") { e.preventDefault(); edCmd("formatBlock", "P"); return; }
  if (mod && (k === "b" || k === "i" || k === "u")) { e.preventDefault(); edCmd(k === "b" ? "bold" : k === "i" ? "italic" : "underline"); return; }
  if (mod && k === "`") { e.preventDefault(); edWrap("code"); return; }
  /* word by word undo: each space or new line closes a step */
  if ((e.key === " " || e.key === "Enter") && ED.pend) edHistPush();
  var blk = edBlock();
  if (e.key === "Tab") {
    var cell = edClosest(edRange() && edRange().startContainer, "td,th");
    if (blk && blk.tagName === "PRE") { e.preventDefault(); edCmd("insertText", "  "); return; }
    if (edClosest(edRange() && edRange().startContainer, "li")) { e.preventDefault(); edCmd(e.shiftKey ? "outdent" : "indent"); return; }
    if (cell) { e.preventDefault(); edCellMove(cell, e.shiftKey ? -1 : 1); return; }
    e.preventDefault(); edIndent(e.shiftKey ? -1 : 1); return;
  }
  if (e.key === "Enter" && blk && blk.tagName === "PRE" && !e.shiftKey) {
    e.preventDefault();
    if (/\n\n$/.test(blk.textContent) && edAtEnd(blk)) { edChange(function () { blk.textContent = blk.textContent.replace(/\n+$/, ""); var p = ED.doc.createElement("p"); p.innerHTML = "<br>"; blk.after(p); edCaret(p); }); return; }
    edCmd("insertText", "\n"); return;
  }
  /* Markdown-style shortcuts at the start of a line */
  if (e.key === " " && blk && blk.tagName === "P" && edAtEnd(blk)) {
    var t = blk.textContent, map = { "#": "H1", "##": "H2", "###": "H3", "####": "H4", ">": "BLOCKQUOTE", "```": "PRE" };
    if (map[t] || t === "-" || t === "*" || t === "1." || t === "a." || t === "[]" || t === "---") {
      e.preventDefault();
      edChange(function () { blk.innerHTML = "<br>"; edCaret(blk); });
      if (t === "---") { edChange(function () { var hr = ED.doc.createElement("hr"); blk.before(hr); }); return; }
      if (map[t]) edCmd("formatBlock", map[t]);
      else if (t === "1.") edList("ol", "l-dec"); else if (t === "a.") edList("ol", "l-la");
      else edList("ul", t === "[]" ? "check" : "b-disc");
    }
  }
}
function edAtEnd(el) { var r = edRange(); if (!r) return false; var x = ED.doc.createRange(); x.selectNodeContents(el); x.setStart(r.endContainer, r.endOffset); return !x.toString().length; }
function edPaste(e) {
  if (!ED.editing) { e.preventDefault(); return; }
  var cd = e.clipboardData; if (!cd) return;
  var img = [].slice.call(cd.files || []).filter(function (f) { return /^image\//.test(f.type); })[0];
  if (img) { e.preventDefault(); edImageFile(img); return; }
  var html = cd.getData("text/html"), text = cd.getData("text/plain");
  e.preventDefault();
  var blk = edBlock();
  if (blk && blk.tagName === "PRE") { edCmd("insertText", text); return; }
  /* pasted as plain text (Ctrl+Shift+V lands here with no HTML) or as clean HTML */
  if (html) edChange(function () { ED.doc.execCommand("insertHTML", false, libClean(html.replace(/<\/?(font|o:p)[^>]*>/gi, "").replace(/\s(mso-[\w-]+|class="Mso\w+")/g, " "))); });
  else if (text) edChange(function () { ED.doc.execCommand("insertHTML", false, text.split(/\r?\n/).map(function (l) { return "<p dir=\"auto\">" + (libEsc(l) || "<br>") + "</p>"; }).join("")); });
}
function edClick(e) {
  var a = e.target.closest && e.target.closest("a[href]");
  if (a && (!ED.editing || e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    var href = a.getAttribute("href");
    if (/^#\//.test(href)) { libFlush(); location.hash = href; return; }
    if (/^#/.test(href)) { edScrollTo(href.slice(1)); return; }
    window.open(a.href, "_blank", "noopener"); return;
  }
  if (!ED.editing) return;
  /* checklist: clicking the box ticks the item */
  var li = e.target.closest && e.target.closest("ul.check > li");
  if (li) { var r = li.getBoundingClientRect(), rtl = ED.win.getComputedStyle(li).direction === "rtl", x = rtl ? r.right - e.clientX : e.clientX - r.left; if (x < 22) edChange(function () { li.classList.toggle("done"); }); }
  /* an image is selected by clicking it */
  [].slice.call(ED.root.querySelectorAll("img.ed-on")).forEach(function (i) { i.classList.remove("ed-on"); });
  ED.img = e.target.tagName === "IMG" ? e.target : null;
  if (ED.img) { ED.img.classList.add("ed-on"); edImageBar(); } else if (ED.barKind === "image") edCloseBar();
}

/* ---------- tables ---------- */
function edCellMove(cell, dir) {
  var cells = [].slice.call(cell.closest("table").querySelectorAll("th,td")), i = cells.indexOf(cell) + dir;
  if (i >= cells.length) { edTable("rowBelow"); cells = [].slice.call(cell.closest("table").querySelectorAll("th,td")); i = cells.indexOf(cell) + 1; }
  if (i >= 0 && cells[i]) edCaret(cells[i], false);
}
function edCurCell() { var r = edRange(); return r ? edClosest(r.startContainer, "td,th") : null; }
function edGrid(table) {
  /* a rectangular map of the table, spans included: grid[row][col] = cell */
  var grid = [], rows = [].slice.call(table.rows);
  rows.forEach(function (tr0, ri) {
    grid[ri] = grid[ri] || [];
    var ci = 0;
    [].slice.call(tr0.cells).forEach(function (c) {
      while (grid[ri][ci]) ci++;
      var cs = c.colSpan || 1, rs = c.rowSpan || 1;
      for (var y = 0; y < rs; y++) for (var x = 0; x < cs; x++) { grid[ri + y] = grid[ri + y] || []; grid[ri + y][ci + x] = c; }
      ci += cs;
    });
  });
  return grid;
}
function edColIndex(grid, cell) { for (var y = 0; y < grid.length; y++) for (var x = 0; x < (grid[y] || []).length; x++) if (grid[y][x] === cell) return [y, x]; return [0, 0]; }
function edNewCell(tag) { var c = ED.doc.createElement(tag); c.innerHTML = "<br>"; c.setAttribute("dir", "auto"); return c; }
function edTable(op, arg) {
  var cell = edCurCell(); if (!cell) { toast(tr("Put the caret in a table first.")); return; }
  var table = cell.closest("table");
  edChange(function () {
    var grid = edGrid(table), pos = edColIndex(grid, cell), ri = pos[0], ci = pos[1], tr0 = cell.parentNode, ncols = Math.max.apply(null, grid.map(function (r) { return r.length; }));
    if (op === "rowAbove" || op === "rowBelow") {
      var nr = ED.doc.createElement("tr"), tag = tr0.parentNode.tagName === "THEAD" && op === "rowAbove" ? "th" : "td";
      for (var i = 0; i < ncols; i++) nr.appendChild(edNewCell(tag));
      if (op === "rowAbove") tr0.before(nr);
      else if (tr0.parentNode.tagName === "THEAD") { var tb = table.tBodies[0] || table.appendChild(ED.doc.createElement("tbody")); tb.insertBefore(nr, tb.firstChild); }
      else tr0.after(nr);
      edCaret(nr.cells[0], true);
    }
    if (op === "colLeft" || op === "colRight") {
      var at = op === "colLeft" ? ci : ci + (cell.colSpan || 1), done = [];
      [].slice.call(table.rows).forEach(function (row, y) {
        var ref = grid[y] && grid[y][at];
        if (ref && done.indexOf(ref) >= 0) return;
        var c = edNewCell(row.parentNode.tagName === "THEAD" ? "th" : "td");
        if (ref && ref.parentNode === row) row.insertBefore(c, ref);
        else if (ref) { ref.colSpan = (ref.colSpan || 1) + 1; done.push(ref); }
        else row.appendChild(c);
      });
      var cg = table.querySelector("colgroup"); if (cg) cg.remove(); table.style.width = ""; table.classList.remove("t-fixed");
    }
    if (op === "delRow") {
      if (table.rows.length <= 1) { table.remove(); return; }
      var next = tr0.nextElementSibling || tr0.previousElementSibling; tr0.remove();
      if (tr0.parentNode && !tr0.parentNode.rows.length) tr0.parentNode.remove();
      if (next && next.cells[0]) edCaret(next.cells[0], true);
    }
    if (op === "delCol") {
      if (ncols <= 1) { table.remove(); return; }
      var gone = [];
      grid.forEach(function (row) { var c = row[ci]; if (!c || gone.indexOf(c) >= 0) return; gone.push(c); if ((c.colSpan || 1) > 1) c.colSpan--; else c.remove(); });
      var cg2 = table.querySelector("colgroup"); if (cg2) cg2.remove(); table.style.width = ""; table.classList.remove("t-fixed");
    }
    if (op === "mergeRight") {
      var right = grid[ri][ci + (cell.colSpan || 1)];
      if (!right || right.parentNode !== tr0 || (right.rowSpan || 1) !== (cell.rowSpan || 1)) { toast(tr("There is no cell to the right to merge with.")); return; }
      if (right.textContent.trim()) { cell.appendChild(ED.doc.createTextNode(" ")); while (right.firstChild) cell.appendChild(right.firstChild); }
      cell.colSpan = (cell.colSpan || 1) + (right.colSpan || 1); right.remove();
    }
    if (op === "mergeDown") {
      var below = grid[ri + (cell.rowSpan || 1)] && grid[ri + (cell.rowSpan || 1)][ci];
      if (!below || (below.colSpan || 1) !== (cell.colSpan || 1)) { toast(tr("There is no cell below to merge with.")); return; }
      if (below.textContent.trim()) { cell.appendChild(ED.doc.createElement("br")); while (below.firstChild) cell.appendChild(below.firstChild); }
      cell.rowSpan = (cell.rowSpan || 1) + (below.rowSpan || 1); below.remove();
    }
    if (op === "split") {
      var cs = cell.colSpan || 1, rs = cell.rowSpan || 1;
      if (cs === 1 && rs === 1) { toast(tr("Only merged cells can be split.")); return; }
      for (var x = 1; x < cs; x++) cell.after(edNewCell(cell.tagName.toLowerCase()));
      cell.colSpan = 1;
      for (var y2 = 1; y2 < rs; y2++) {
        var row2 = table.rows[tr0.rowIndex + y2]; if (!row2) break;
        var g2 = edGrid(table), refc = null;
        for (var xx = ci + cs; xx < (g2[tr0.rowIndex + y2] || []).length; xx++) { var cc = g2[tr0.rowIndex + y2][xx]; if (cc && cc.parentNode === row2) { refc = cc; break; } }
        for (var x2 = 0; x2 < cs; x2++) { var nc = edNewCell("td"); if (refc) row2.insertBefore(nc, refc); else row2.appendChild(nc); }
      }
      cell.rowSpan = 1;
    }
    if (op === "header") {
      var head = table.tHead;
      if (head) {   /* header row back to a normal row */
        var tb2 = table.tBodies[0] || table.appendChild(ED.doc.createElement("tbody"));
        [].slice.call(head.rows).reverse().forEach(function (r) { [].slice.call(r.cells).forEach(function (c) { var td = ED.doc.createElement("td"); td.innerHTML = c.innerHTML; td.colSpan = c.colSpan; c.replaceWith(td); }); tb2.insertBefore(r, tb2.firstChild); });
        head.remove();
      } else {
        var first = table.rows[0]; if (!first) return;
        var th = table.createTHead();
        [].slice.call(first.cells).forEach(function (c) { var t2 = ED.doc.createElement("th"); t2.innerHTML = c.innerHTML; t2.colSpan = c.colSpan; t2.setAttribute("dir", "auto"); c.replaceWith(t2); });
        th.appendChild(first);
      }
    }
    if (op === "firstCol") table.classList.toggle("t-firstcol");
    if (op === "style") { ["t-grid", "t-plain", "t-striped", "t-compact", "t-dark"].forEach(function (c) { if (c !== arg || arg === "t-grid") table.classList.remove(c); }); if (arg !== "t-grid") table.classList.toggle(arg); }
    if (op === "fitContents") { var c1 = table.querySelector("colgroup"); if (c1) c1.remove(); table.style.width = ""; table.removeAttribute("width"); table.classList.remove("t-fixed", "t-wide"); table.classList.add("t-auto"); [].slice.call(table.querySelectorAll("th,td")).forEach(function (c) { c.style.width = ""; if (!c.getAttribute("style")) c.removeAttribute("style"); }); }
    if (op === "fitWindow") { var c2 = table.querySelector("colgroup"); if (c2) c2.remove(); table.style.width = "100%"; table.classList.remove("t-fixed", "t-auto"); }
    if (op === "fixed") { edFixCols(table); }
    if (op === "even") { edFixCols(table, true); }
    if (op === "valign") { [].slice.call(edSelCells(table, cell)).forEach(function (c) { c.classList.remove("va-m", "va-b"); if (arg) c.classList.add(arg); if (!c.className) c.removeAttribute("class"); }); }
    if (op === "halign") { [].slice.call(edSelCells(table, cell)).forEach(function (c) { c.classList.remove("al-c", "al-e", "al-j"); if (arg) c.classList.add(arg); if (!c.className) c.removeAttribute("class"); }); }
    if (op === "shade") { [].slice.call(edSelCells(table, cell)).forEach(function (c) { c.className.split(/\s+/).forEach(function (x) { if (/^sh-/.test(x)) c.classList.remove(x); }); if (arg) c.classList.add(arg); if (!c.className) c.removeAttribute("class"); }); }
    if (op === "caption") { var cap = table.caption; if (cap) cap.remove(); else { cap = table.createCaption(); cap.textContent = tr("Table caption"); } }
    if (op === "delete") { var p = ED.doc.createElement("p"); p.innerHTML = "<br>"; table.replaceWith(p); edCaret(p); }
  });
}
function edSelCells(table, cell) { var r = edRange(); var all = [].slice.call(table.querySelectorAll("th,td")).filter(function (c) { return r && r.intersectsNode(c); }); return all.length ? all : [cell]; }
function edFixCols(table, even) {
  var first = table.rows[0]; if (!first) return;
  var grid = edGrid(table), n = Math.max.apply(null, grid.map(function (r) { return r.length; }));
  var widths = [];
  for (var x = 0; x < n; x++) { var c = (grid[0] || [])[x]; widths.push(c ? c.getBoundingClientRect().width / (c.colSpan || 1) : 80); }
  var total = widths.reduce(function (a, b) { return a + b; }, 0);
  if (even) widths = widths.map(function () { return total / n; });
  var cg = table.querySelector("colgroup"); if (cg) cg.remove();
  cg = ED.doc.createElement("colgroup");
  widths.forEach(function (w) { var col = ED.doc.createElement("col"); col.style.width = Math.round(w) + "px"; cg.appendChild(col); });
  table.insertBefore(cg, table.firstChild);
  table.style.width = Math.round(total) + "px"; table.classList.add("t-fixed"); table.classList.remove("t-auto");
}
/* drag a column's edge to size it */
function edTableHover(e) {
  if (!ED.editing || ED.rz) return;
  var c = e.target.closest && e.target.closest("td,th"); ED.root.style.cursor = "";
  if (!c) { ED.rzAt = null; return; }
  var r = c.getBoundingClientRect(), rtl = ED.win.getComputedStyle(c).direction === "rtl" || ED.win.getComputedStyle(c.closest("table")).direction === "rtl";
  var edge = rtl ? e.clientX - r.left : r.right - e.clientX;
  if (edge >= -2 && edge <= 5) { ED.root.style.cursor = "col-resize"; ED.rzAt = { cell: c, rtl: rtl }; } else ED.rzAt = null;
}
function edTableDown(e) {
  if (!ED.editing || !ED.rzAt || e.button !== 0) return;
  e.preventDefault();
  var cell = ED.rzAt.cell, table = cell.closest("table"), rtl = ED.rzAt.rtl;
  if (ED.pend) edHistPush();
  edFixCols(table);
  var grid = edGrid(table), x = edColIndex(grid, cell)[1] + (cell.colSpan || 1) - 1, cols = table.querySelectorAll("colgroup col"), col = cols[x];
  if (!col) return;
  var start = e.clientX, w0 = parseFloat(col.style.width) || 80, t0 = parseFloat(table.style.width) || table.getBoundingClientRect().width;
  ED.rz = true;
  var move = function (ev) { var dx = (ev.clientX - start) * (rtl ? -1 : 1), w = Math.max(30, w0 + dx); col.style.width = Math.round(w) + "px"; table.style.width = Math.round(t0 + (w - w0)) + "px"; };
  var up = function () { ED.doc.removeEventListener("mousemove", move); ED.doc.removeEventListener("mouseup", up); ED.rz = null; ED.root.style.cursor = ""; ED.html = ED.root.innerHTML; edHistPush(); libDirty(); };
  ED.doc.addEventListener("mousemove", move); ED.doc.addEventListener("mouseup", up);
}

/* ---------- lists and indents ---------- */
function edList(kind, cls) {
  edFocus();
  var li = edClosest(edRange() && edRange().startContainer, "li"), list = li && li.parentNode;
  edChange(function () {
    if (!list || list.tagName.toLowerCase() !== kind) {
      ED.doc.execCommand(kind === "ol" ? "insertOrderedList" : "insertUnorderedList");
      li = edClosest(edRange() && edRange().startContainer, "li"); list = li && li.parentNode;
    }
    if (!list) return;
    /* a multilevel style belongs to the whole list family: the outermost list takes it */
    var target = list;
    if (/^(l-ml|l-out)$/.test(cls)) { var p = list.parentNode; while (p && p !== ED.root) { if (p.tagName === "OL" || p.tagName === "UL") target = p; p = p.parentNode; } }
    target.className.split(/\s+/).forEach(function (c) { if (/^(l-|b-|check$)/.test(c)) target.classList.remove(c); });
    if (cls) target.classList.add(cls);
    if (!target.className) target.removeAttribute("class");
  });
}
function edListOff() { var li = edClosest(edRange() && edRange().startContainer, "li"); if (!li) return; edCmd(li.parentNode.tagName === "OL" ? "insertOrderedList" : "insertUnorderedList"); }
function edIndent(dir) {
  var li = edClosest(edRange() && edRange().startContainer, "li");
  if (li) { edCmd(dir > 0 ? "indent" : "outdent"); return; }
  edChange(function () {
    edBlocks().forEach(function (b) {
      var m = /(?:^|\s)ind-(\d)(?:\s|$)/.exec(b.className), n = Math.max(0, Math.min(6, (m ? Number(m[1]) : 0) + dir));
      if (m) b.classList.remove("ind-" + m[1]);
      if (n) b.classList.add("ind-" + n);
      if (!b.className) b.removeAttribute("class");
    });
  });
}

/* ---------- images and links ---------- */
function edImageFile(file) {
  if (file.size > MAX_ATTACHMENT_BYTES) { toast(tr("Images up to {n}.", { n: fmtBytes(MAX_ATTACHMENT_BYTES) })); return; }
  var fr = new FileReader();
  fr.onload = function () { edInsertHTML('<p dir="auto"><img src="' + fr.result + '" alt="' + libEsc(file.name.replace(/\.\w+$/, "")) + '"></p>'); };
  fr.readAsDataURL(file);
}

/* ---------- the bar under the toolbar (link, find, image, snippets, …) ---------- */
function edCloseBar() { ED.barKind = null; if (ED.bars) ED.bars.replaceChildren(); }
function edBar(kind, kids, focusEl) {
  ED.barKind = kind;
  ED.bars.replaceChildren(h("div", { class: "lib-bar" }, kids, h("button", { class: "btn sm ghost", title: tr("Close"), "aria-label": tr("Close"), onclick: function () { edCloseBar(); edRestore(); } }, icon("x"))));
  if (focusEl) setTimeout(function () { focusEl.focus(); if (focusEl.select) focusEl.select(); }, 0);
}
function edLinkBar() {
  edSave();
  var r = edRange(), a = r ? edClosest(r.startContainer, "a") : null;
  var inp = h("input", { type: "url", placeholder: "https://…  /  #heading", "aria-label": tr("Link address"), value: a ? a.getAttribute("href") : "" });
  var apply = function () {
    var v = inp.value.trim(); edCloseBar(); edRestore();
    if (a) { edChange(function () { if (v) a.setAttribute("href", /^(https?:|mailto:|tel:|#)/i.test(v) ? v : "https://" + v); else { var f = ED.doc.createDocumentFragment(); while (a.firstChild) f.appendChild(a.firstChild); a.replaceWith(f); } }); return; }
    if (!v) return;
    if (!/^(https?:|mailto:|tel:|#)/i.test(v)) v = "https://" + v;
    if (edSel().isCollapsed) edInsertHTML('<a href="' + libEsc(v) + '">' + libEsc(v) + "</a>");
    else edCmd("createLink", v);
  };
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } if (e.key === "Escape") { edCloseBar(); edRestore(); } });
  edBar("link", [libIcon("link"), inp, h("button", { class: "btn sm primary", onclick: apply }, tr("Apply")),
    a ? h("button", { class: "btn sm", onclick: function () { inp.value = ""; apply(); } }, tr("Remove link")) : null,
    h("button", { class: "btn sm", onclick: function () { edCloseBar(); edDocLinkBar(); } }, tr("Link to a document…"))], inp);
}
/* links between documents, to a heading in one, or to a task */
function edDocLinkBar(kindStart) {
  if (!ED.barKind) edSave();
  var kind = kindStart || "docs";
  var q = h("input", { type: "search", placeholder: tr("Search documents, headings and tasks…"), "aria-label": tr("Search") });
  var list = h("div", { class: "ed-pick" });
  var seg = h("div", { class: "seg2" });
  var draw = function () {
    seg.replaceChildren.apply(seg, [["docs", tr("Documents")], ["here", tr("This document")], ["tasks", tr("Tasks")]].map(function (k) { return h("button", { class: kind === k[0] ? "on" : "", onclick: function () { kind = k[0]; draw(); } }, k[1]); }));
    var s = q.value.trim().toLowerCase(), rows = [];
    var pick = function (href, text, cls) {
      return function () {
        edCloseBar(); edRestore();
        if (edSel().isCollapsed) edInsertHTML('<a class="' + cls + '" href="' + libEsc(href) + '">' + libEsc(text) + "</a>&nbsp;");
        else edChange(function () { ED.doc.execCommand("createLink", false, href); var a = edClosest(edRange().startContainer, "a") || ED.root.querySelector('a[href="' + href + '"]'); if (a) a.className = cls; });
      };
    };
    if (kind === "docs") libDocs().filter(function (x) { return x.id !== ED.d.id; }).forEach(function (x) {
      var hs = (String(x.html).match(/<h[1-3][^>]*id="([\w-]+)"[^>]*>([\s\S]*?)<\/h[1-3]>/g) || []).map(function (m0) { var mm = /id="([\w-]+)"[^>]*>([\s\S]*?)<\/h/.exec(m0); return { id: mm[1], t: libText(mm[2]) }; });
      if (!s || (x.title || "").toLowerCase().indexOf(s) >= 0) rows.push(h("button", { class: "pk", onclick: pick("#/library/" + x.id, x.title || tr("Untitled"), "doclink") }, libIcon("doc"), h("b", null, x.title || tr("Untitled")), h("span", { class: "muted small" }, tr(x.kind || "Other"))));
      hs.filter(function (hh) { return s && hh.t.toLowerCase().indexOf(s) >= 0; }).forEach(function (hh) {
        rows.push(h("button", { class: "pk sub", onclick: pick("#/library/" + x.id + "/" + hh.id, hh.t, "doclink") }, "#", h("span", null, hh.t), h("span", { class: "muted small" }, x.title)));
      });
    });
    if (kind === "here") [].slice.call(ED.root.querySelectorAll("h1,h2,h3,h4")).forEach(function (x) {
      var t = x.textContent.trim(); if (!t || (s && t.toLowerCase().indexOf(s) < 0)) return;
      rows.push(h("button", { class: "pk o" + x.tagName[1], onclick: function () { if (!x.id) edChange(function () { x.id = libSlug(t, edIds()); }); pick("#" + x.id, t, "")(); } }, "#", h("span", null, t)));
    });
    if (kind === "tasks") visibleTasks().filter(function (t) { return !s || (taskKey(t) + " " + t.title).toLowerCase().indexOf(s) >= 0; }).slice(0, 60).forEach(function (t) {
      rows.push(h("button", { class: "pk", onclick: pick("#/task/" + taskKey(t), taskKey(t) + " " + t.title, "tasklink") }, h("span", { class: "key" }, taskKey(t)), h("span", null, t.title)));
    });
    list.replaceChildren.apply(list, rows.length ? rows.slice(0, 80) : [h("div", { class: "muted small", style: { padding: "6px" } }, tr("Nothing matches."))]);
  };
  q.addEventListener("input", draw);
  edBar("doclink", [libIcon("link"), seg, q, list], q);
  draw();
}
function edIds() { var u = {}; [].slice.call(ED.root.querySelectorAll("[id]")).forEach(function (x) { u[x.id] = 1; }); return u; }
function edImageBar() {
  var img = ED.img; if (!img) return;
  var alt = h("input", { type: "text", value: img.getAttribute("alt") || "", placeholder: tr("Alternative text"), "aria-label": tr("Alternative text"), onchange: function (e) { edChange(function () { img.setAttribute("alt", e.target.value); }); } });
  var size = function (w) { return h("button", { class: "btn sm", onclick: function () { edChange(function () { if (w) img.style.width = w; else img.style.width = ""; if (!img.getAttribute("style")) img.removeAttribute("style"); }); } }, w || tr("Original")); };
  var place = function (cls, label) { return h("button", { class: "btn sm", onclick: function () { edChange(function () { img.classList.remove("im-left", "im-right", "im-center"); if (cls) img.classList.add(cls); }); } }, label); };
  edBar("image", [libIcon("image"), h("span", { class: "small" }, tr("Image")), size("25%"), size("50%"), size("75%"), size("100%"), size(""),
    h("i", { class: "tb-sep" }), place("im-left", tr("Wrap left")), place("im-center", tr("Centre")), place("im-right", tr("Wrap right")), place("", tr("In line")),
    alt, h("button", { class: "btn sm", onclick: function () { edChange(function () { var f = ED.doc.createElement("figure"), c = ED.doc.createElement("figcaption"); c.textContent = img.getAttribute("alt") || tr("Caption"); c.setAttribute("dir", "auto"); img.replaceWith(f); f.append(img, c); }); } }, tr("Add caption")),
    h("button", { class: "btn sm danger", onclick: function () { edChange(function () { img.remove(); }); ED.img = null; edCloseBar(); } }, icon("trash"))]);
}

/* ---------- find and replace ---------- */
function edFindBar() {
  var s0 = edSel() ? String(edSel()) : "";
  var f = h("input", { type: "search", placeholder: tr("Find"), "aria-label": tr("Find"), value: s0 && s0.length < 80 ? s0 : (ED.findQ || "") });
  var r = h("input", { type: "text", placeholder: tr("Replace with"), "aria-label": tr("Replace with"), value: ED.findR || "" });
  var cs = h("input", { type: "checkbox", title: tr("Match case") });
  var cnt = h("span", { class: "muted small" });
  var count = function () { ED.findQ = f.value; ED.findR = r.value; var n = f.value ? edFindAll(f.value, cs.checked).length : 0; cnt.textContent = f.value ? trn(n, "{n} match", "{n} matches") : ""; };
  f.addEventListener("input", count); cs.addEventListener("change", count);
  f.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); edFindNext(f.value, cs.checked, e.shiftKey); } if (e.key === "Escape") edCloseBar(); });
  edBar("find", [libIcon("find"), f, ED.editing ? r : null, h("label", { class: "row small" }, cs, "Aa"), cnt,
    h("button", { class: "btn sm", onclick: function () { edFindNext(f.value, cs.checked, true); } }, "↑"),
    h("button", { class: "btn sm", onclick: function () { edFindNext(f.value, cs.checked); } }, "↓"),
    ED.editing ? h("button", { class: "btn sm", onclick: function () { edReplace(f.value, r.value, false, cs.checked); count(); } }, tr("Replace")) : null,
    ED.editing ? h("button", { class: "btn sm primary", onclick: function () { var n = edReplace(f.value, r.value, true, cs.checked); toast(trn(n, "{n} replaced", "{n} replaced")); count(); } }, tr("Replace all")) : null], f);
  count();
}
function edFindAll(q, mc) {
  var out = [], w = ED.doc.createTreeWalker(ED.root, NodeFilter.SHOW_TEXT), n, ql = mc ? q : q.toLowerCase();
  while ((n = w.nextNode())) { var t = mc ? n.nodeValue : n.nodeValue.toLowerCase(), i = t.indexOf(ql); while (i >= 0) { out.push([n, i]); i = t.indexOf(ql, i + ql.length); } }
  return out;
}
function edFindNext(q, mc, back) {
  if (!q) return; var all = edFindAll(q, mc); if (!all.length) { toast(tr("Not found.")); return; }
  var s = edSel(), cur = s.rangeCount ? s.getRangeAt(0) : null, idx = back ? all.length - 1 : 0;
  if (cur) for (var i = 0; i < all.length; i++) {
    var rr = ED.doc.createRange(); rr.setStart(all[i][0], all[i][1]);
    var cmp = rr.compareBoundaryPoints(Range.START_TO_START, cur);
    if (!back && cmp > 0) { idx = i; break; }
    if (back && cmp < 0) idx = i;
  }
  var m = all[idx], r = ED.doc.createRange(); r.setStart(m[0], m[1]); r.setEnd(m[0], m[1] + q.length);
  ED.win.focus(); s.removeAllRanges(); s.addRange(r);
  if (m[0].parentNode && m[0].parentNode.scrollIntoView) m[0].parentNode.scrollIntoView({ block: "center" });
}
function edReplace(q, rep, all, mc) {
  if (!q || !ED.editing) return 0;
  var s = edSel(), n = 0;
  if (!all) {
    var sel = String(s);
    if (s.rangeCount && (mc ? sel === q : sel.toLowerCase() === q.toLowerCase())) { edCmd("insertText", rep); n = 1; }
    edFindNext(q, mc); return n;
  }
  edChange(function () { edFindAll(q, mc).reverse().forEach(function (m) { var v = m[0].nodeValue; m[0].nodeValue = v.slice(0, m[1]) + rep + v.slice(m[1] + q.length); n++; }); });
  return n;
}

/* ---------- snippets: reusable pieces the team saves ---------- */
function edSnippets() { if (!db.snippets) db.snippets = []; return db.snippets; }
function edSaveSnippetBar() {
  var r = edRange();
  if (!r || r.collapsed) { toast(tr("Select what to save as a snippet first.")); return; }
  edSave();
  var box = ED.doc.createElement("div"); box.appendChild(r.cloneContents());
  var html = libClean(box.innerHTML);
  var name = h("input", { type: "text", placeholder: tr("Snippet name"), "aria-label": tr("Snippet name") });
  var save1 = function () {
    var n = name.value.trim(); if (!n) { name.focus(); return; }
    edSnippets().push({ id: uid("snip"), name: n, html: html, authorId: me().id, createdAt: nowISO() }); save(true);
    edCloseBar(); toast(tr("Snippet saved — find it under Insert → Snippets."));
  };
  name.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); save1(); } });
  edBar("snippet", [libIcon("snippet"), h("span", { class: "small" }, tr("Save the selection as a snippet")), name, h("button", { class: "btn sm primary", onclick: save1 }, tr("Save"))], name);
}
function edManageSnippets() {
  var rows = edSnippets().map(function (s) {
    var nm = h("input", { type: "text", value: s.name, "aria-label": tr("Snippet name"), onchange: function (e) { s.name = e.target.value.trim() || s.name; save(true); } });
    return h("div", { class: "row" }, nm, h("span", { class: "muted small" }, userName(s.authorId)),
      h("button", { class: "btn sm", onclick: function () { edCloseBar(); edInsertHTML(s.html); } }, tr("Insert")),
      (s.authorId === me().id || isManager()) ? h("button", { class: "btn sm danger", onclick: function () { db.snippets = edSnippets().filter(function (x) { return x !== s; }); save(true); edManageSnippets(); } }, icon("trash")) : null);
  });
  edBar("snippets", [libIcon("snippet"), h("div", { class: "ed-snips" }, rows.length ? rows : h("span", { class: "muted small" }, tr("No snippets yet. Select something in a document, then Insert → Snippets → Save the selection.")))]);
}

/* ---------- HTML mode: the document as HTML and CSS, with a live preview ---------- */
function edPretty(html) {
  var box = document.createElement("template"); box.innerHTML = html;
  var BLK = /^(P|H[1-6]|UL|OL|LI|TABLE|THEAD|TBODY|TFOOT|TR|TH|TD|CAPTION|COLGROUP|COL|PRE|BLOCKQUOTE|DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|NAV|FIGURE|FIGCAPTION|DETAILS|SUMMARY|DL|DT|DD|HR)$/;
  var out = [];
  (function walk(node, depth) {
    [].slice.call(node.childNodes).forEach(function (c) {
      var pad0 = "  ".repeat(depth);
      if (c.nodeType === 3) { var t = c.nodeValue; if (t.trim()) out.push(pad0 + libEsc(t).replace(/&quot;/g, '"').trim()); return; }
      if (c.nodeType !== 1) return;
      var tag = c.tagName.toLowerCase(), open = c.outerHTML.slice(0, c.outerHTML.indexOf(">") + 1);
      var inlineOnly = ![].slice.call(c.children).some(function (k) { return BLK.test(k.tagName); });
      if (!BLK.test(c.tagName) || c.tagName === "PRE" || (inlineOnly && c.outerHTML.length < 160)) { out.push(pad0 + c.outerHTML); return; }
      if (c.tagName === "HR" || c.tagName === "COL") { out.push(pad0 + open); return; }
      if (inlineOnly) { out.push(pad0 + open); out.push("  ".repeat(depth + 1) + c.innerHTML.trim()); out.push(pad0 + "</" + tag + ">"); return; }
      out.push(pad0 + open); walk(c, depth + 1); out.push(pad0 + "</" + tag + ">");
    });
  })(box.content, 0);
  return out.join("\n");
}
function edHtmlMode(on) {
  if (on === (ED.mode === "html")) return;
  if (on) {
    if (ED.pend) edHistPush();
    ED.mode = "html"; edEditable(); libFlush();
    var d = ED.d, tab = ED.srcTab || "html";
    var ta = h("textarea", { class: "ed-code", spellcheck: "false", "aria-label": tr("Document HTML"), wrap: "off" });
    var css = h("textarea", { class: "ed-code", spellcheck: "false", "aria-label": tr("Document CSS"), wrap: "off", placeholder: tr("CSS for this document, e.g.\n.callout.note { background: #eef; }\ntable { font-size: 13px; }") });
    ta.value = edPretty(ED.root.innerHTML); css.value = d.css || "";
    var url = h("input", { type: "url", class: "f", placeholder: "https://example.com/styles/manual.css", value: d.cssUrl || "", "aria-label": tr("Linked stylesheet") });
    var timer = null;
    var applyHtml = function () { var clean = libClean(ta.value); if (clean !== ED.root.innerHTML) { edChange(function () { ED.root.innerHTML = clean; }); } };
    var applyCss = function () { d.css = css.value; d.updatedAt = nowISO(); d.updatedBy = me().id; edApplyStyles(); save(true); libFootUpdate(false); };
    [ta, css].forEach(function (x) {
      x.addEventListener("keydown", function (e) {
        if (e.key === "Tab") { e.preventDefault(); var s = x.selectionStart; x.setRangeText("  ", s, x.selectionEnd, "end"); x.dispatchEvent(new Event("input")); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); applyHtml(); applyCss(); libFlush(); toast(tr("Saved")); }
      });
    });
    ta.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(applyHtml, 600); libFootUpdate(true); });
    css.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(applyCss, 400); libFootUpdate(true); });
    url.addEventListener("change", function () {
      var v = url.value.trim();
      if (v && !/^https:\/\//i.test(v)) { toast(tr("Link a stylesheet by its https:// address.")); return; }
      d.cssUrl = v; d.updatedAt = nowISO(); d.updatedBy = me().id; edApplyStyles(); save(true);
    });
    var tabs = h("div", { class: "seg2" });
    var body = h("div", { class: "ed-codebox" });
    var show = function (t) {
      ED.srcTab = t; tabs.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
      body.replaceChildren(t === "html" ? ta : h("div", { class: "ed-cssbox" }, h("label", { class: "l small" }, tr("Linked stylesheet (.css file)")), url,
        h("label", { class: "l small" }, tr("CSS of this document")), css,
        h("p", { class: "muted small" }, tr("Classes you use in the HTML can be styled here or in the linked file. The styles apply only inside this document."))));
    };
    tabs.append(h("button", { "data-t": "html", onclick: function () { show("html"); } }, "HTML"), h("button", { "data-t": "css", onclick: function () { show("css"); } }, "CSS"));
    ED.src.replaceChildren(h("div", { class: "ed-srchead row" }, tabs,
      h("button", { class: "btn sm", onclick: function () { ta.value = edPretty(libClean(ta.value)); } }, tr("Format HTML")),
      h("button", { class: "btn sm", title: tr("Replace the document with HTML from the clipboard"), onclick: function () {
        if (!navigator.clipboard || !navigator.clipboard.readText) { toast(tr("Paste into the HTML box with Ctrl+V.")); ta.focus(); return; }
        navigator.clipboard.readText().then(function (t) { ta.value = t; applyHtml(); ta.value = edPretty(ED.root.innerHTML); }, function () { toast(tr("Paste into the HTML box with Ctrl+V.")); ta.focus(); });
      } }, tr("Paste HTML")),
      h("span", { class: "sp" }), h("span", { class: "muted small" }, tr("Scripts and event handlers are removed; everything else is kept."))), body);
    show(tab);
    ED.src.hidden = false; ED.wrap.classList.add("html-mode");
    ED.htmlSync = function () { applyHtml(); applyCss(); };
  } else {
    if (ED.htmlSync) ED.htmlSync(); ED.htmlSync = null;
    ED.mode = "visual"; ED.src.hidden = true; ED.wrap.classList.remove("html-mode"); edEditable();
    libFlush();
  }
  edToolState();
  libRenderTools();
}

/* ---------- toolbar ---------- */
var LIB_IC = {
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3", redo: "M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3",
  bold: "M7 4h6a4 4 0 010 8H7zM7 12h7a4 4 0 010 8H7z", italic: "M14 4h-4M14 20h-4M14 4l-4 16", under: "M7 4v7a5 5 0 0010 0V4M5 21h14",
  strike: "M5 12h14M16 7a4 4 0 00-4-3c-2.5 0-4 1.3-4 3s1.5 2.5 4 3M8 17a4 4 0 004 3c2.5 0 4-1.3 4-3", code: "M9 8l-5 4 5 4M15 8l5 4-5 4",
  mark: "M4 20h7M14 4l6 6-9 9H6v-5z", clear: "M5 5l14 14M9 4h9M13 4l-3 8M4 20h7", color: "M6 20l6-16 6 16M8.5 14h7",
  ul: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01", ol: "M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3M3 11c0-1 3-1 3 0s-3 2-3 3h3",
  check: "M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9",
  indent: "M4 6h16M10 12h10M4 18h16M4 10l3 2-3 2", outdent: "M4 6h16M10 12h10M4 18h16M7 10l-3 2 3 2",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01", table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14", hr: "M4 12h16",
  find: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4", tools: "M14 7l3-3 3 3-3 3M17 4l-9 9M4 20l4-1 9-9-3-3-9 9z", down: "M12 4v12M7 11l5 5 5-5M5 20h14",
  alignL: "M4 6h16M4 10h10M4 14h16M4 18h10", alignC: "M4 6h16M7 10h10M4 14h16M7 18h10", alignR: "M4 6h16M10 10h10M4 14h16M10 18h10", alignJ: "M4 6h16M4 10h16M4 14h16M4 18h16",
  spacing: "M8 6h12M8 12h12M8 18h12M4 4v16M2.5 6L4 4l1.5 2M2.5 18L4 20l1.5-2", plus: "M12 5v14M5 12h14", block: "M4 4h16v6H4zM4 14h7v6H4zM15 14h5v6h-5z",
  snippet: "M8 4H5v16h3M16 4h3v16h-3M10 9l-2 3 2 3M14 9l2 3-2 3", doc: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7", chev: "M9 6l6 6-6 6",
  html: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z", sup: "M4 18l8-10M4 8l8 10M16 9c0-1.5 3-1.5 3 0s-3 2-3 3h3", omega: "M5 20h4v-2a7 7 0 116 0v2h4"
};
function libIcon(n) {
  var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ico"); s.setAttribute("aria-hidden", "true");
  var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", LIB_IC[n] || ""); s.appendChild(p);
  return s;
}
/* menus: { label, fn, icon, keys, on(), off(), sub: [...], el } or "—" */
/* menus float above the page (fixed, in <body>), so neither the toolbar nor a scrolling
   menu can clip them; each submenu opens beside its item and stays inside the window */
var ED_MENUS = [];
function edCloseMenus(level) {
  level = level || 0;
  while (ED_MENUS.length > level) { var m = ED_MENUS.pop(); m.el.remove(); if (m.btn) m.btn.classList.remove("open"); }
}
document.addEventListener("mousedown", function (e) { if (ED_MENUS.length && !(e.target.closest && e.target.closest(".ed-menu, .ed-mbtn"))) edCloseMenus(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ED_MENUS.length) { edCloseMenus(); e.stopPropagation(); } }, true);
window.addEventListener("resize", function () { edCloseMenus(); });
document.addEventListener("scroll", function (e) { if (ED_MENUS.length && !(e.target.closest && e.target.closest(".ed-menu"))) edCloseMenus(); }, true);
function edPlace(el, rect, side) {
  /* side: "below" (a toolbar menu) or "beside" (a submenu) */
  el.style.left = "0px"; el.style.top = "0px"; el.style.maxHeight = "";
  var rtl = document.documentElement.dir === "rtl", w = el.offsetWidth, hgt = el.offsetHeight, vw = innerWidth, vh = innerHeight, x, y;
  if (side === "beside") {
    x = rtl ? rect.left - w + 2 : rect.right - 2;
    if (x + w > vw - 6) x = rect.left - w + 2;
    if (x < 6) x = Math.min(vw - w - 6, rect.right - 2);
    y = rect.top - 6;
  } else {
    x = (rtl || el.classList.contains("end")) ? rect.right - w : rect.left;
    y = rect.bottom + 4;
  }
  x = Math.max(6, Math.min(x, vw - w - 6));
  if (y + hgt > vh - 6) {
    if (side !== "beside" && rect.top - hgt - 4 > 6) y = rect.top - hgt - 4;
    else { y = Math.max(6, vh - hgt - 6); if (hgt > vh - 12) { el.style.maxHeight = (vh - 12) + "px"; y = 6; } }
  }
  el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
}
function edMenuEl(items, level, cls) {
  var m = h("div", { class: "ed-menu" + (cls ? " " + cls : ""), role: "menu" });
  items.forEach(function (it) {
    if (!it) return;
    if (it === "—") { m.appendChild(h("hr")); return; }
    if (it.head) { m.appendChild(h("div", { class: "ed-mhead" }, it.head)); return; }
    if (it.el) { m.appendChild(it.el); return; }
    var off = it.off && it.off(), on = it.on && it.on();
    var b = h("button", { type: "button", role: "menuitem", class: (on ? "on " : "") + (it.sub ? "has-sub" : "") + (it.cls ? " " + it.cls : ""), disabled: off || null, style: it.style || null,
      onmousedown: function (e) { e.preventDefault(); } },
      it.icon ? libIcon(it.icon) : h("i", { class: "ico-sp" }), h("span", { class: "lbl", style: it.lblStyle || null }, it.label), it.keys ? h("span", { class: "keys" }, it.keys) : null, it.sub ? libIcon("chev") : null);
    if (it.sub) {
      var open = function () {
        if (ED_MENUS[level + 1] && ED_MENUS[level + 1].from === b) return;
        edCloseMenus(level + 1);
        var sm = edMenuEl(typeof it.sub === "function" ? it.sub() : it.sub, level + 1, "sub");
        document.body.appendChild(sm); ED_MENUS.push({ el: sm, from: b });
        m.querySelectorAll("button.open").forEach(function (x) { x.classList.remove("open"); }); b.classList.add("open");
        edPlace(sm, b.getBoundingClientRect(), "beside");
      };
      b.addEventListener("mouseenter", function () { clearTimeout(ED.subT); ED.subT = setTimeout(open, 120); });
      b.addEventListener("click", open);
    } else {
      b.addEventListener("mouseenter", function () { clearTimeout(ED.subT); ED.subT = setTimeout(function () { if (ED_MENUS.length > level + 1) { edCloseMenus(level + 1); m.querySelectorAll("button.open").forEach(function (x) { x.classList.remove("open"); }); } }, 160); });
      b.addEventListener("click", function () { edCloseMenus(); it.fn(); });
    }
    m.appendChild(b);
  });
  return m;
}
function edMenu(content, title, items, opts) {
  opts = opts || {};
  var btn = h("button", { type: "button", class: (opts.btnClass || "tb") + " ed-mbtn" + (opts.wide ? " wide" : ""), title: title, "aria-label": title, "aria-haspopup": "true",
    onmousedown: function (e) { e.preventDefault(); edSave(); },
    onclick: function () {
      var mine = ED_MENUS[0] && ED_MENUS[0].btn === btn;
      edCloseMenus();
      if (mine) return;
      var m = edMenuEl(typeof items === "function" ? items() : items, 0, opts.end ? "end" : "");
      document.body.appendChild(m); ED_MENUS.push({ el: m, btn: btn }); btn.classList.add("open");
      edPlace(m, btn.getBoundingClientRect(), "below");
    } }, content, opts.noCaret ? null : h("span", { class: "caret" }, "▾"));
  if (opts.disabled) btn.disabled = true;
  return btn;
}
function edBtn(ic, label, fn, keys, cmd) {
  return h("button", { type: "button", class: "tb", "data-cmd": cmd || null, title: label + (keys ? " (" + keys + ")" : ""), "aria-label": label,
    onmousedown: function (e) { e.preventDefault(); }, onclick: function () { fn(); } }, libIcon(ic));
}
function edSwatches(list, apply, none) {
  return h("div", { class: "ed-sw" }, list.map(function (c, i) {
    return h("button", { type: "button", class: "sw", style: { background: c }, title: c, onmousedown: function (e) { e.preventDefault(); }, onclick: function () { edCloseMenus(); apply(i + 1, c); } });
  }), h("button", { type: "button", class: "btn sm", onmousedown: function (e) { e.preventDefault(); }, onclick: function () { edCloseMenus(); apply(0); } }, none));
}
function edTableGrid() {
  var label = h("div", { class: "small muted" }, tr("Insert a table"));
  var g = h("div", { class: "ed-tgrid" });
  for (var r = 1; r <= 8; r++) for (var c = 1; c <= 8; c++) (function (r, c) {
    g.appendChild(h("button", { type: "button", "data-r": r, "data-c": c, onmousedown: function (e) { e.preventDefault(); },
      onmouseenter: function () { label.textContent = c + " × " + r; g.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.r <= r && b.dataset.c <= c); }); },
      onclick: function () { edCloseMenus(); edInsertTable(r, c, true); } }));
  })(r, c);
  return h("div", { class: "ed-tpick" }, label, g);
}
function edInsertTable(rows, cols, head) {
  var html = '<table class="t-grid">';
  if (head) { html += "<thead><tr>"; for (var c = 0; c < cols; c++) html += '<th dir="auto">' + libEsc(tr("Heading")) + "</th>"; html += "</tr></thead>"; }
  html += "<tbody>"; for (var r = 0; r < Math.max(1, rows - (head ? 1 : 0)); r++) { html += "<tr>"; for (var c2 = 0; c2 < cols; c2++) html += '<td dir="auto"><br></td>'; html += "</tr>"; }
  html += '</tbody></table><p dir="auto"><br></p>';
  edInsertHTML(html);
}
var ED_COLORS = ["#C0392B", "#B06A00", "#4E7A1C", "#1F9A8A", "#2A78D6", "#6250D6", "#A0326A", "#5F656E"];
var ED_HIGHLIGHTS = ["#FFF1A8", "#D9F2C4", "#CDEFF0", "#DCE8FB", "#F7D9E6", "#FFE0C2"];
var ED_SHADES = ["#FFF7D6", "#E4F5F2", "#E8F1FC", "#FBEBE9", "#EFECFB", "#EBEDF1"];
var ED_CHARS = "→ ← ↑ ↓ ↔ ⇒ • · … – — ° ± × ÷ ≤ ≥ ≠ ≈ ∞ µ Ω Δ ∑ √ © ® ™ € ₪ $ £ § ¶ ✓ ✗ ⚠ ℹ ★ ☐ ☑ ½ ¼ ¾ ² ³ ‰ ″ ′ « » „ “ ”".split(" ");
function edBlocksMenu() {
  var t = function (k) { return libEsc(tr(k)); };
  var B = {
    note: '<div class="callout note"><p dir="auto"><strong>' + t("Note") + ":</strong> " + t("Text of the note.") + "</p></div>",
    tip: '<div class="callout tip"><p dir="auto"><strong>' + t("Tip") + ":</strong> " + t("A helpful shortcut or good practice.") + "</p></div>",
    important: '<div class="callout important"><p dir="auto"><strong>' + t("Important") + ":</strong> " + t("Something the reader must not miss.") + "</p></div>",
    warn: '<div class="callout warn"><p dir="auto"><strong>' + t("Warning") + ":</strong> " + t("A risk of damage to equipment or data.") + "</p></div>",
    caution: '<div class="callout caution"><p dir="auto"><strong>' + t("Caution") + ":</strong> " + t("A risk of injury.") + "</p></div>",
    procedure: '<div class="procedure"><h4 dir="auto">' + t("To do this") + '</h4><ol class="l-dec"><li dir="auto">' + t("First step.") + '</li><li dir="auto">' + t("Second step.") + '</li></ol><p class="result" dir="auto"><em>' + t("Result:") + "</em> " + t("what the reader sees.") + "</p></div>",
    prereq: '<div class="prereq"><h4 dir="auto">' + t("Before you begin") + '</h4><ul class="check"><li dir="auto">' + t("Prerequisite") + "</li></ul></div>",
    qa: '<div class="qa"><p class="q" dir="auto">' + t("Question") + '</p><p class="a" dir="auto">' + t("Answer") + "</p></div>",
    dl: '<dl><dt dir="auto">' + t("Term") + '</dt><dd dir="auto">' + t("Definition") + "</dd></dl>",
    figure: '<figure><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" alt="" style="width: 50%"><figcaption dir="auto">' + t("Figure caption") + "</figcaption></figure>",
    cols2: '<div class="cols"><div><p dir="auto">' + t("Left column") + '</p></div><div><p dir="auto">' + t("Right column") + "</p></div></div>",
    cols3: '<div class="cols c3"><div><p dir="auto">1</p></div><div><p dir="auto">2</p></div><div><p dir="auto">3</p></div></div>',
    details: '<details open><summary dir="auto">' + t("Section title (click to fold)") + '</summary><p dir="auto">' + t("Hidden until opened.") + "</p></details>",
    code: '<pre class="lang-code">' + t("code") + "</pre>",
    kv: '<table class="t-firstcol t-plain"><tbody><tr><td dir="auto">' + t("Field") + '</td><td dir="auto"><br></td></tr><tr><td dir="auto">' + t("Field") + '</td><td dir="auto"><br></td></tr></tbody></table>'
  };
  var it = function (k, label, ic) { return { label: tr(label), icon: ic, fn: function () { edInsertHTML(B[k] + '<p dir="auto"><br></p>'); } }; };
  return [{ head: tr("Admonitions") }, it("note", "Note", "block"), it("tip", "Tip", "block"), it("important", "Important", "block"), it("warn", "Warning", "block"), it("caution", "Caution", "block"),
    "—", { head: tr("Structure") }, it("procedure", "Procedure (numbered steps)"), it("prereq", "Before you begin"), it("qa", "Question and answer"), it("dl", "Definition list"), it("kv", "Field / value table"),
    "—", it("figure", "Figure with caption", "image"), it("cols2", "Two columns"), it("cols3", "Three columns"), it("details", "Collapsible section"), it("code", "Code block", "code")];
}
function edSnippetMenu() {
  var list = edSnippets().slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (s) { return { label: s.name, icon: "snippet", fn: function () { edInsertHTML(s.html); } }; });
  return (list.length ? list : [{ label: tr("No snippets yet"), off: function () { return true; }, fn: function () {} }]).concat(["—",
    { label: tr("Save the selection as a snippet…"), fn: edSaveSnippetBar }, { label: tr("Manage snippets…"), fn: edManageSnippets }]);
}
function edClassBar() {
  edSave();
  var b = edBlock(); if (!b) { toast(tr("Put the caret in a paragraph first.")); return; }
  /* classes the document's CSS defines, offered as one-click choices */
  var known = {}; String((ED.d && ED.d.css) || "").replace(/\.([A-Za-z][\w-]*)/g, function (_, c) { if (!/^(ed-|ps-|cs-)/.test(c)) known[c] = 1; });
  var cur = b.className.split(/\s+/).filter(function (c) { return c && !/^(ed-|ps-|cs-)/.test(c); });
  var inp = h("input", { type: "text", value: cur.join(" "), placeholder: "class-name other-class", "aria-label": tr("Classes") });
  var apply = function () {
    var v = inp.value.split(/\s+/).filter(function (x) { return /^[\w-]+$/.test(x); });
    var keep = b.className.split(/\s+/).filter(function (c) { return /^(ps-|cs-)/.test(c); });
    edCloseBar(); edRestore();
    edChange(function () { var all = keep.concat(v).join(" "); if (all) b.className = all; else b.removeAttribute("class"); });
    toast(v.length ? tr("Classes on this {t}: {c}", { t: b.tagName.toLowerCase(), c: v.join(" ") }) : tr("Classes removed."));
  };
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  var chips = Object.keys(known).slice(0, 24).map(function (k) { return h("button", { type: "button", class: "chip" + (cur.indexOf(k) >= 0 ? " green" : ""), onclick: function () { var list = inp.value.split(/\s+/).filter(Boolean), i = list.indexOf(k); if (i >= 0) list.splice(i, 1); else list.push(k); inp.value = list.join(" "); this.classList.toggle("green"); } }, "." + k); });
  edBar("class", [h("b", { class: "small" }, tr("Classes on this {t}", { t: b.tagName.toLowerCase() })), inp, h("button", { class: "btn sm primary", onclick: apply }, tr("Apply")),
    chips.length ? h("div", { class: "row", style: { gap: "4px", width: "100%" } }, h("span", { class: "muted small" }, tr("Defined in this document's CSS:")), chips)
      : h("span", { class: "muted small", style: { width: "100%" } }, tr("A class does nothing until CSS styles it: add rules in HTML mode → CSS, or use Styles to make a named style."))], inp);
}
function edStartAtBar() {
  edSave();
  var li = edClosest(edRange() && edRange().startContainer, "li"), ol = li && li.closest("ol");
  if (!ol) { toast(tr("Put the caret in a numbered list first.")); return; }
  var inp = h("input", { type: "number", min: 0, value: ol.getAttribute("start") || "1", style: { width: "80px", flex: "none" }, "aria-label": tr("Start at") });
  var apply = function () { edCloseBar(); edRestore(); edChange(function () { var v = parseInt(inp.value, 10); if (v && v !== 1) ol.setAttribute("start", v); else ol.removeAttribute("start"); }); };
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  edBar("start", [h("span", { class: "small" }, tr("Start numbering at")), inp, h("button", { class: "btn sm primary", onclick: apply }, tr("Apply"))], inp);
}
function edTableBar() {
  edSave();
  var r = h("input", { type: "number", min: 1, max: 60, value: 4, style: { width: "70px", flex: "none" }, "aria-label": tr("Rows") });
  var c = h("input", { type: "number", min: 1, max: 15, value: 3, style: { width: "70px", flex: "none" }, "aria-label": tr("Columns") });
  var hd = h("input", { type: "checkbox", checked: true });
  edBar("table", [libIcon("table"), h("span", { class: "small" }, tr("Rows")), r, h("span", { class: "small" }, tr("Columns")), c, h("label", { class: "row small" }, hd, tr("Header row")),
    h("button", { class: "btn sm primary", onclick: function () { edCloseBar(); edRestore(); edInsertTable(Math.min(60, +r.value || 4), Math.min(15, +c.value || 3), hd.checked); } }, tr("Insert"))], r);
}
function edToolbar(d) {
  var inTable = function () { return !edCurCell(); };
  var tb = h("div", { class: "lib-tb card", role: "toolbar", "aria-label": tr("Formatting") },
    edBtn("undo", tr("Undo"), edUndo, "Ctrl+Z", "undo"), edBtn("redo", tr("Redo"), edRedo, "Ctrl+Y", "redo"),
    h("i", { class: "tb-sep" }),
    edMenu(h("span", { class: "st-label", id: "ed-style" }, tr("Normal text")), tr("Paragraph style"), edStyleMenu, { wide: true }),
    edMenu(h("span", { class: "st-label ff", id: "ed-font" }, tr("Font")), tr("Font"), edFontMenu, { wide: true }),
    edMenu(h("span", { class: "st-label fz", id: "ed-size" }, "—"), tr("Font size"), edSizeMenu, { wide: true }),
    h("i", { class: "tb-sep" }),
    edBtn("bold", tr("Bold"), function () { edCmd("bold"); }, "Ctrl+B", "bold"), edBtn("italic", tr("Italic"), function () { edCmd("italic"); }, "Ctrl+I", "italic"),
    edBtn("under", tr("Underline"), function () { edCmd("underline"); }, "Ctrl+U", "underline"), edBtn("strike", tr("Strikethrough"), function () { edCmd("strikeThrough"); }, "", "strikeThrough"),
    edMenu(libIcon("sup"), tr("More formatting"), function () { return [
      { label: tr("Superscript"), fn: function () { edCmd("superscript"); }, on: function () { return ED.doc.queryCommandState("superscript"); } },
      { label: tr("Subscript"), fn: function () { edCmd("subscript"); }, on: function () { return ED.doc.queryCommandState("subscript"); } },
      { label: tr("Inline code"), icon: "code", keys: "Ctrl+`", fn: function () { edRestore(); edWrap("code"); } },
      { label: tr("Keyboard key"), fn: function () { edRestore(); edWrap("kbd"); } },
      { label: tr("Text size"), sub: [["", "Normal"], ["fs-s", "Small"], ["fs-l", "Large"], ["fs-xl", "Huge"]].map(function (x) { return { label: tr(x[1]), fn: function () { edRestore(); edSpanClass("fs-", x[0]); } }; }) },
      "—", { label: tr("Clear formatting"), icon: "clear", fn: function () { edRestore(); edCmd("removeFormat"); edSpanClass("tc-|hl-|fs-", ""); } }]; }, { noCaret: true }),
    edMenu(libIcon("color"), tr("Text colour"), function () { return [{ el: edSwatches(ED_COLORS, function (i) { edRestore(); edSpanClass("tc-", i ? "tc-" + i : ""); }, tr("Automatic")) }]; }),
    edMenu(libIcon("mark"), tr("Highlight"), function () { return [{ el: edSwatches(ED_HIGHLIGHTS, function (i) { edRestore(); edSpanClass("hl-", i ? "hl-" + i : ""); }, tr("No highlight")) }]; }),
    h("i", { class: "tb-sep" }),
    edMenu(libIcon("alignL"), tr("Alignment"), function () { return [["", "Align to start", "alignL"], ["al-c", "Centre", "alignC"], ["al-e", "Align to end", "alignR"], ["al-j", "Justify", "alignJ"]].map(function (x) { return { label: tr(x[1]), icon: x[2], fn: function () { edRestore(); edBlockClass("al-", x[0]); } }; }); }),
    edMenu(libIcon("ul"), tr("Bullets"), function () { return [["b-disc", "• Bullets"], ["b-circle", "◦ Circles"], ["b-square", "▪ Squares"], ["b-dash", "– Dashes"], ["b-arrow", "➔ Arrows"], ["check", "☐ Checklist"]].map(function (x) { return { label: tr(x[1]), fn: function () { edRestore(); edList("ul", x[0]); } }; }).concat(["—", { label: tr("Remove the list"), fn: function () { edRestore(); edListOff(); } }]); }),
    edMenu(libIcon("ol"), tr("Numbering"), function () { return [["l-dec", "1. 2. 3."], ["l-la", "a. b. c."], ["l-ua", "A. B. C."], ["l-lr", "i. ii. iii."], ["l-ur", "I. II. III."], "—", ["l-ml", "Multilevel 1 · 1.1 · 1.1.1"], ["l-out", "Outline 1 · a · i"]].map(function (x) { return x === "—" ? x : { label: tr(x[1]), fn: function () { edRestore(); edList("ol", x[0]); } }; }).concat(["—", { label: tr("Start at…"), fn: edStartAtBar }, { label: tr("Remove the list"), fn: function () { edRestore(); edListOff(); } }]); }),
    edBtn("outdent", tr("Decrease indent"), function () { edIndent(-1); }, "Shift+Tab"), edBtn("indent", tr("Increase indent"), function () { edIndent(1); }, "Tab"),
    edMenu(libIcon("spacing"), tr("Spacing and indents"), function () { return [{ head: tr("Line spacing") }].concat([["lh-10", "1.0"], ["", "1.15 — normal"], ["lh-15", "1.5"], ["lh-20", "2.0"]].map(function (x) { return { label: x[1], fn: function () { edRestore(); edBlockClass("lh-", x[0]); } }; }),
      ["—", { head: tr("Space after paragraphs") }], [["sa-0", "None"], ["", "Normal"], ["sa-2", "Large"]].map(function (x) { return { label: tr(x[1]), fn: function () { edRestore(); edBlockClass("sa-", x[0]); } }; }),
      ["—", { head: tr("Special indent") }], [["", "None"], ["fl", "First line"], ["hg", "Hanging"]].map(function (x) { return { label: tr(x[1]), fn: function () { edRestore(); edBlockClass("fl$|hg$", x[0]); } }; })); }),
    h("i", { class: "tb-sep" }),
    edMenu(h("span", { class: "row", style: { gap: "4px" } }, libIcon("plus"), h("span", { class: "lbl" }, tr("Insert"))), tr("Insert"), function () { return [
      { label: tr("Link…"), icon: "link", keys: "Ctrl+K", fn: edLinkBar },
      { label: tr("Link to a document, heading or task…"), icon: "doc", fn: function () { edDocLinkBar(); } },
      { label: tr("Image…"), icon: "image", fn: function () { var i = h("input", { type: "file", accept: "image/*" }); i.onchange = function () { if (i.files[0]) { edRestore(); edImageFile(i.files[0]); } }; i.click(); } },
      { label: tr("Table"), icon: "table", sub: [{ el: edTableGrid() }, "—", { label: tr("Custom size…"), fn: edTableBar }] },
      { label: tr("Content block"), icon: "block", sub: edBlocksMenu() },
      { label: tr("Snippet"), icon: "snippet", sub: edSnippetMenu() },
      { label: tr("Special character"), icon: "omega", sub: [{ el: h("div", { class: "ed-chars" }, ED_CHARS.map(function (ch) { return h("button", { type: "button", onmousedown: function (e) { e.preventDefault(); }, onclick: function () { edCloseMenus(); edRestore(); edCmd("insertText", ch); } }, ch); })) }] },
      "—",
      { label: tr("Divider"), icon: "hr", fn: function () { edRestore(); edCmd("insertHorizontalRule"); } },
      { label: tr("Page break (print and Word)"), fn: function () { edInsertHTML('<hr class="pagebreak"><p dir="auto"><br></p>'); } },
      { label: tr("Table of contents"), fn: function () { libToc(); } },
      { label: tr("Today's date"), fn: function () { edRestore(); edCmd("insertText", fmtDate(today())); } },
      { label: tr("Time stamp"), fn: function () { var n = new Date(); edInsertHTML('<span class="ts">[' + String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0") + "]</span>&nbsp;"); } }]; }, { wide: true }),
    edMenu(libIcon("table"), tr("Table"), function () { var off = inTable; return [
      { label: tr("Insert row above"), fn: function () { edRestore(); edTable("rowAbove"); }, off: off }, { label: tr("Insert row below"), fn: function () { edRestore(); edTable("rowBelow"); }, off: off },
      { label: tr("Insert column before"), fn: function () { edRestore(); edTable("colLeft"); }, off: off }, { label: tr("Insert column after"), fn: function () { edRestore(); edTable("colRight"); }, off: off },
      { label: tr("Delete row"), fn: function () { edRestore(); edTable("delRow"); }, off: off }, { label: tr("Delete column"), fn: function () { edRestore(); edTable("delCol"); }, off: off },
      "—",
      { label: tr("Merge with the cell to the right"), fn: function () { edRestore(); edTable("mergeRight"); }, off: off }, { label: tr("Merge with the cell below"), fn: function () { edRestore(); edTable("mergeDown"); }, off: off },
      { label: tr("Split merged cell"), fn: function () { edRestore(); edTable("split"); }, off: off },
      "—",
      { label: tr("Header row"), fn: function () { edRestore(); edTable("header"); }, off: off, on: function () { var c = edCurCell(); return !!(c && c.closest("table").tHead); } },
      { label: tr("First column as labels"), fn: function () { edRestore(); edTable("firstCol"); }, off: off },
      { label: tr("Caption"), fn: function () { edRestore(); edTable("caption"); }, off: off },
      { label: tr("Autofit"), sub: [{ label: tr("Fit to contents"), fn: function () { edRestore(); edTable("fitContents"); } }, { label: tr("Fit to page width"), fn: function () { edRestore(); edTable("fitWindow"); } },
        { label: tr("Fixed column widths"), fn: function () { edRestore(); edTable("fixed"); } }, { label: tr("Distribute columns evenly"), fn: function () { edRestore(); edTable("even"); } }], off: off },
      { label: tr("Cell alignment"), sub: [["valign", "va-", "Top"], ["valign", "va-m", "Middle"], ["valign", "va-b", "Bottom"], "—", ["halign", "", "Start"], ["halign", "al-c", "Centre"], ["halign", "al-e", "End"]].map(function (x) { return x === "—" ? x : { label: tr(x[2]), fn: function () { edRestore(); edTable(x[0], x[1] === "va-" ? "" : x[1]); } }; }), off: off },
      { label: tr("Cell shading"), sub: [{ el: edSwatches(ED_SHADES, function (i) { edRestore(); edTable("shade", i ? "sh-" + i : ""); }, tr("No shading")) }], off: off },
      { label: tr("Table style"), sub: [["t-grid", "Grid"], ["t-striped", "Striped rows"], ["t-plain", "Plain lines"], ["t-compact", "Compact"], ["t-dark", "Dark header"]].map(function (x) { return { label: tr(x[1]), fn: function () { edRestore(); edTable("style", x[0]); } }; }), off: off },
      "—", { label: tr("Delete table"), fn: function () { edRestore(); edTable("delete"); }, off: off, cls: "danger" },
      "—", { label: tr("Drag a column's edge to size it."), off: function () { return true; }, fn: function () {} }]; }),
    edBtn("link", tr("Link"), edLinkBar, "Ctrl+K"),
    edBtn("find", tr("Find and replace"), edFindBar, "Ctrl+F"),
    h("span", { class: "sp" }),
    libToolsMenu(d));
  ED.tb = tb;
  setTimeout(edToolState, 0);
  return tb;
}
/* which buttons are on, which style the caret is in */
function edToolState() {
  if (!ED.tb || !ED.doc || !ED.tb.isConnected) return;
  ["bold", "italic", "underline", "strikeThrough"].forEach(function (c) {
    var b = ED.tb.querySelector('[data-cmd="' + c + '"]'); if (!b) return;
    var on = false; try { on = ED.doc.queryCommandState(c); } catch (e) {}
    b.classList.toggle("on", !!on && !!edRange());
  });
  var u = ED.tb.querySelector('[data-cmd="undo"]'), r = ED.tb.querySelector('[data-cmd="redo"]');
  if (u) u.disabled = ED.hi <= 0 && !ED.pend; if (r) r.disabled = ED.hi >= ED.hist.length - 1;
  var lab = document.getElementById("ed-style"), b0 = edBlock();
  if (lab) {
    var t = b0 ? b0.tagName : "P", names = { P: "Normal text", H1: "Heading 1", H2: "Heading 2", H3: "Heading 3", H4: "Heading 4", BLOCKQUOTE: "Quote", PRE: "Code block", LI: "List item", TD: "Table cell", TH: "Table heading" };
    if (b0 && t === "P" && b0.classList.contains("lead")) t = "lead";
    lab.textContent = tr(names[t] || (t === "lead" ? "Lead paragraph" : "Normal text"));
    var own = b0 && /(?:^|\s)ps-([\w-]+)/.exec(b0.className), cs0 = own && (ED.d.cstyles || []).filter(function (x) { return x.id === own[1]; })[0];
    if (cs0) lab.textContent = cs0.name;
  }
  var r0 = edRange(), el0 = r0 && (r0.startContainer.nodeType === 3 ? r0.startContainer.parentNode : r0.startContainer), fl = document.getElementById("ed-font"), zl = document.getElementById("ed-size");
  if (el0 && ED.root.contains(el0) && fl && zl) { var cs1 = ED.win.getComputedStyle(el0); fl.textContent = cs1.fontFamily.split(",")[0].replace(/["']/g, ""); zl.textContent = Math.round(parseFloat(cs1.fontSize)); }
}

/* =====================================================================
   Fonts and styles of a document.
   d.fonts  — [{ name, kind: "google" | "file", data? }] fonts the document uses
   d.styles — { key: props } changes to the built-in styles (Normal, Heading 1, …)
   d.cstyles — [{ id, name, kind: "para" | "char", base, props }] the document's own styles
   They become CSS inside the document (and in its exports).
   ===================================================================== */
var ED_BUILTIN = [
  ["p", "Normal text", "#doc p, #doc li, #doc td, #doc dd"], ["h1", "Heading 1", "#doc h1"], ["h2", "Heading 2", "#doc h2"], ["h3", "Heading 3", "#doc h3"], ["h4", "Heading 4", "#doc h4"],
  ["lead", "Lead paragraph", "#doc p.lead"], ["small", "Small print", "#doc p.small"], ["caption", "Caption", "#doc p.caption, #doc figcaption, #doc caption"],
  ["blockquote", "Quote", "#doc blockquote"], ["pre", "Code block", "#doc pre"], ["th", "Table heading", "#doc th"], ["toc", "Table of contents", "#doc .toc"]
];
var ED_SYSFONTS = ["Arial", "Calibri", "Cambria", "Candara", "Consolas", "Courier New", "David", "Georgia", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"];
var ED_GFONTS = ["Assistant", "Alef", "Frank Ruhl Libre", "Heebo", "IBM Plex Sans", "IBM Plex Sans Hebrew", "IBM Plex Mono", "Inter", "JetBrains Mono", "Lato", "Merriweather", "Montserrat", "Noto Sans", "Noto Sans Hebrew", "Noto Serif", "Noto Serif Hebrew", "Open Sans", "Poppins", "Roboto", "Roboto Mono", "Rubik", "Secular One", "Source Sans 3", "Source Code Pro", "Varela Round"];
var ED_PROPS = [
  ["fontFamily", "font-family"], ["fontSize", "font-size", "px"], ["fontWeight", "font-weight"], ["fontStyle", "font-style"], ["color", "color"], ["background", "background-color"],
  ["textAlign", "text-align"], ["lineHeight", "line-height"], ["marginTop", "margin-top", "px"], ["marginBottom", "margin-bottom", "px"], ["textIndent", "text-indent", "px"],
  ["letterSpacing", "letter-spacing", "px"], ["textTransform", "text-transform"], ["textDecoration", "text-decoration"], ["borderBottom", "border-bottom"], ["fontVariant", "font-variant"]
];
function edSlug(n) { return String(n).toLowerCase().replace(/[^\w֐-׿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "style"; }
function edFontStack(name) { return /[\s\d]/.test(name) ? "'" + name.replace(/'/g, "") + "'" : name; }
function edPropsCss(p) {
  return ED_PROPS.map(function (x) {
    var v = p && p[x[0]]; if (v === undefined || v === null || v === "") return "";
    if (x[0] === "fontFamily") v = edFontStack(v) + ", sans-serif";
    else if (x[2] && /^-?\d+(\.\d+)?$/.test(String(v))) v = v + x[2];
    if (x[0] === "borderBottom") v = v === "line" ? "1px solid currentColor" : "0";
    return x[1] + ": " + String(v).replace(/[;{}<>]/g, "") + " !important";
  }).filter(Boolean).join("; ");
}
function edStylesCss(d) {
  if (!d) return "";
  var out = [], st = d.styles || {};
  (d.fonts || []).forEach(function (f) { if (f.kind === "file" && f.data) out.push("@font-face{font-family:" + edFontStack(f.name) + ";src:url(" + f.data + ");font-display:swap}"); });
  if (d.baseFont) out.push("#doc{font-family:" + edFontStack(d.baseFont) + ", sans-serif}");
  ED_BUILTIN.forEach(function (b) { var c = edPropsCss(st[b[0]]); if (c) out.push(b[2] + "{" + c + "}"); });
  (d.cstyles || []).forEach(function (cs) { var c = edPropsCss(cs.props); if (c) out.push((cs.kind === "char" ? "#doc span.cs-" : "#doc .ps-") + cs.id + "{" + c + "}"); });
  return out.join("\n");
}
function edFontLinks(d) {
  var g = (d && d.fonts || []).filter(function (f) { return f.kind === "google"; }).map(function (f) { return "family=" + encodeURIComponent(f.name).replace(/%20/g, "+") + ":ital,wght@0,400;0,600;0,700;1,400"; });
  return g.length ? "https://fonts.googleapis.com/css2?" + g.join("&") + "&display=swap" : "";
}
/* the document's fonts, styles and own CSS, in that order (its own CSS wins) */
function edApplyStyles() {
  if (!ED.doc || !ED.d) return;
  var d = ED.d, head = ED.doc.head;
  var gl = ED.doc.getElementById("ed-gfonts"); if (!gl) { gl = ED.doc.createElement("link"); gl.id = "ed-gfonts"; gl.rel = "stylesheet"; head.insertBefore(gl, ED.doc.getElementById("ed-ext")); }
  var fl = edFontLinks(d); if (fl) gl.setAttribute("href", fl); else gl.removeAttribute("href");
  var ext = ED.doc.getElementById("ed-ext"), u = (d.cssUrl || "").trim();
  if (/^https:\/\//i.test(u)) ext.setAttribute("href", u); else ext.removeAttribute("href");
  var ss = ED.doc.getElementById("ed-styles"); if (!ss) { ss = ED.doc.createElement("style"); ss.id = "ed-styles"; head.insertBefore(ss, ED.doc.getElementById("ed-user")); }
  ss.textContent = edStylesCss(d);
  ED.doc.getElementById("ed-user").textContent = libCleanCss(d.css || "");
}
function edAllFonts(d) {
  var mine = (d && d.fonts || []).map(function (f) { return f.name; });
  return { mine: mine, system: ED_SYSFONTS.filter(function (f) { return mine.indexOf(f) < 0; }) };
}
/* a style (font-family, font-size, …) on the selected text, replacing the same style inside it */
function edSpanStyle(prop, value) {
  var r = edRange(); if (!r) return;
  if (r.collapsed) { toast(tr("Select some text first.")); return; }
  edChange(function () {
    [].slice.call(ED.root.querySelectorAll("span[style]")).forEach(function (s) {
      if (!r.intersectsNode(s)) return;
      s.style.removeProperty(prop);
      if (!s.getAttribute("style")) { s.removeAttribute("style"); if (!s.attributes.length) { var f = ED.doc.createDocumentFragment(); while (s.firstChild) f.appendChild(s.firstChild); s.replaceWith(f); } }
    });
  });
  if (value) edWrap("span", null, { force: true, attrs: { style: prop + ": " + value } });
}
function edFontMenu() {
  var d = ED.d, f = edAllFonts(d), it = function (n) { return { label: n, lblStyle: { fontFamily: edFontStack(n) }, fn: function () { edRestore(); edSpanStyle("font-family", edFontStack(n) + ", sans-serif"); } }; };
  return [{ label: tr("Document font (default)"), fn: function () { edRestore(); edSpanStyle("font-family", ""); } }]
    .concat(f.mine.length ? ["—", { head: tr("This document's fonts") }].concat(f.mine.map(it)) : [])
    .concat(["—", { head: tr("Installed on most computers") }], f.system.map(it))
    .concat(["—", { label: tr("Add fonts…"), icon: "plus", fn: function () { libOpenStyles("fonts"); } }]);
}
function edSizeMenu() {
  return [{ label: tr("Default size"), fn: function () { edRestore(); edSpanStyle("font-size", ""); } }, "—"].concat([9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40, 48].map(function (n) {
    return { label: String(n), fn: function () { edRestore(); edSpanStyle("font-size", n + "px"); } };
  }));
}
/* apply a paragraph style (built-in or the document's own) to the blocks of the selection */
function edApplyPara(key) {
  var d = ED.d, b0;
  if (ED.saved) edRestore();
  var cs = (d.cstyles || []).filter(function (x) { return x.id === key; })[0];
  var tagOf = { p: "P", h1: "H1", h2: "H2", h3: "H3", h4: "H4", lead: "P", small: "P", caption: "P", blockquote: "BLOCKQUOTE", pre: "PRE" };
  var tag = cs ? (tagOf[cs.base] || "P") : tagOf[key] || "P";
  edFocus();
  edChange(function () { ED.doc.execCommand("formatBlock", false, tag); });
  edChange(function () {
    edBlocks().forEach(function (b) {
      b.className.split(/\s+/).forEach(function (c) { if (/^(ps-|lead$|small$|caption$)/.test(c)) b.classList.remove(c); });
      if (cs) { b.classList.add("ps-" + cs.id); if (/^(lead|small|caption)$/.test(cs.base)) b.classList.add(cs.base); }
      else if (/^(lead|small|caption)$/.test(key)) b.classList.add(key);
      if (!b.className) b.removeAttribute("class");
    });
  });
}
function edStyleMenu() {
  var d = ED.d, st = d.styles || {}, cs = d.cstyles || [];
  var prev = function (key, props) { var p = props || st[key] || {}; return { fontFamily: p.fontFamily ? edFontStack(p.fontFamily) : null, color: p.color || null, fontStyle: p.fontStyle || null }; };
  var built = ED_BUILTIN.filter(function (b) { return !/^(th|toc)$/.test(b[0]); }).map(function (b) {
    return { label: tr(b[1]), cls: "st-" + b[0], lblStyle: prev(b[0]), fn: function () { edApplyPara(b[0]); } };
  });
  var paras = cs.filter(function (x) { return x.kind !== "char"; }).map(function (x) { return { label: x.name, cls: "st-" + (x.base || "p"), lblStyle: prev(null, x.props), fn: function () { edApplyPara(x.id); } }; });
  var chars = cs.filter(function (x) { return x.kind === "char"; }).map(function (x) { return { label: x.name, lblStyle: prev(null, x.props), fn: function () { edRestore(); edSpanClass("cs-", "cs-" + x.id); } }; });
  return built.slice(0, 5).concat(["—"], built.slice(5))
    .concat(paras.length ? ["—", { head: tr("This document's styles") }].concat(paras) : [])
    .concat(chars.length ? ["—", { head: tr("Character styles") }].concat(chars) : [])
    .concat(["—", { label: tr("Update the style to match the selection"), fn: function () { edMatchStyle(); } },
      { label: tr("New style from the selection…"), icon: "plus", fn: function () { libOpenStyles("new"); } },
      { label: tr("Manage styles and fonts…"), fn: function () { libOpenStyles("styles"); } },
      { label: tr("Custom class…"), fn: edClassBar }]);
}
/* the style the caret is in: its key (built-in) or the document's own style id */
function edStyleKeyAt(b) {
  if (!b) return "p";
  var m = /(?:^|\s)ps-([\w-]+)/.exec(b.className); if (m) return m[1];
  if (b.tagName === "P") return b.classList.contains("lead") ? "lead" : b.classList.contains("small") ? "small" : b.classList.contains("caption") ? "caption" : "p";
  var t = b.tagName.toLowerCase(); return /^(h1|h2|h3|h4|blockquote|pre|th)$/.test(t) ? t : "p";
}
function edReadProps(el) {
  var cs = ED.win.getComputedStyle(el), fs = parseFloat(cs.fontSize);
  var fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
  return { fontFamily: fam, fontSize: Math.round(fs), fontWeight: cs.fontWeight >= 600 ? "bold" : "normal", fontStyle: cs.fontStyle === "italic" ? "italic" : "",
    color: cs.color, textAlign: /center|justify|right|left|end/.test(cs.textAlign) && cs.textAlign !== "start" ? cs.textAlign : "",
    lineHeight: cs.lineHeight !== "normal" ? Math.round(parseFloat(cs.lineHeight) / fs * 100) / 100 : "", marginTop: Math.round(parseFloat(cs.marginTop)), marginBottom: Math.round(parseFloat(cs.marginBottom)) };
}
/* Word's "update to match selection": the look of the selected text becomes the style's look */
function edMatchStyle() {
  if (ED.saved) edRestore();
  var b = edBlock(); if (!b) { toast(tr("Put the caret in a paragraph first.")); return; }
  var r = edRange(), el = r && r.startContainer.nodeType === 3 ? r.startContainer.parentNode : b;
  var props = edReadProps(el && b.contains(el) ? el : b), key = edStyleKeyAt(b), d = ED.d;
  var own = (d.cstyles || []).filter(function (x) { return x.id === key; })[0];
  edChange(function () {   /* the direct formatting is now part of the style */
    [].slice.call(b.querySelectorAll("span[style]")).forEach(function (s) { s.style.removeProperty("font-family"); s.style.removeProperty("font-size"); if (!s.getAttribute("style")) { var f = ED.doc.createDocumentFragment(); while (s.firstChild) f.appendChild(s.firstChild); s.replaceWith(f); } });
  });
  if (own) own.props = Object.assign({}, own.props, props);
  else { d.styles = d.styles || {}; d.styles[key] = Object.assign({}, d.styles[key], props); }
  libStylesChanged(d);
  toast(tr("“{s}” now looks like the selection.", { s: own ? own.name : tr((ED_BUILTIN.filter(function (x) { return x[0] === key; })[0] || [0, "Normal text"])[1]) }));
}
