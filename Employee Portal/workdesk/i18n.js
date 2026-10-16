/* =====================================================================
   GALIL Employee Portal — interface language for the portal home and
   WorkDesk (English / Hebrew, right to left).

   The interface is written in English; English is the key. In Hebrew,
   every piece of text the interface draws is looked up in the Hebrew
   dictionary (workdesk/he.js) on its way to the screen:
     · text children of elements, and the title, placeholder, aria-label
       and label-like props of every element (WDI18N.h replaces
       React.createElement for the whole app);
     · toasts, confirmations and the Excel export headings.
   A dictionary key may hold {placeholders} for text built from parts,
   e.g. "Signed in as {name} · {role}"; the parts are looked up too.
   Data people type (names, descriptions) has no entry, so it stays as typed.
   ===================================================================== */
"use strict";
var WDI18N = (function () {
  var lang = (window.GalilPortal && GalilPortal.lang()) || "en";
  var he = lang === "he";
  var EXACT = Object.create(null), PATTERNS = [], cache = new Map();
  var LETTER = /[A-Za-z]/;
  /* props that carry interface text, on DOM elements and on the app's own components */
  var PROPS = ["title", "placeholder", "aria-label", "label", "allLabel", "message", "okLabel", "emptyText", "saveLabel", "sub", "hint", "empty", "alt", "head"];

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  /* add({ "English": "עברית", "Hello {name}": "שלום {name}" }) */
  function add(dict) {
    Object.keys(dict).forEach(function (k) {
      var v = dict[k];
      if (/\{\w+\}/.test(k)) {
        var names = [];
        var src = esc(k).replace(/\\\{(\w+)\\\}/g, function (_, n) { names.push(n); return "([\\s\\S]+?)"; });
        PATTERNS.push({ re: new RegExp("^" + src + "$"), out: v, names: names, len: k.length });
      } else EXACT[k] = v;
    });
    /* longer, more specific patterns first */
    PATTERNS.sort(function (a, b) { return b.len - a.len; });
    cache.clear();
  }

  function lookup(core) {
    if (core in EXACT) return EXACT[core];
    for (var i = 0; i < PATTERNS.length; i++) {
      var p = PATTERNS[i], m = p.re.exec(core);
      if (!m) continue;
      var vals = {};
      p.names.forEach(function (n, j) { vals[n] = m[j + 1]; });
      return p.out.replace(/\{(\w+)\}/g, function (_, n) { return vals[n] == null ? "" : t(vals[n]); });
    }
    return null;
  }
  /* translate one piece of interface text (unknown text comes back unchanged) */
  function t(s) {
    if (!he || typeof s !== "string" || !LETTER.test(s)) return s;
    var hit = cache.get(s);
    if (hit !== undefined) return hit;
    var out = s, r = lookup(s);
    if (r != null) out = r;
    else {
      /* keep leading symbols / spaces and trailing punctuation around the words */
      var m = /^([^A-Za-z0-9]*?)([A-Za-z0-9][\s\S]*?)([\s.:…!?]*)$/.exec(s);
      if (m && (m[1] || m[3])) { r = lookup(m[2]); if (r != null) out = m[1] + r + m[3]; }
    }
    if (cache.size > 20000) cache.clear();
    cache.set(s, out);
    return out;
  }
  /* tr("Hello {name}", { name: "Dana" }) — translate, then fill in */
  function tr(s, params) {
    var out = t(s);
    if (params) out = out.replace(/\{(\w+)\}/g, function (_, k) { return params[k] == null ? "" : params[k]; });
    return out;
  }

  function trChild(c) { return typeof c === "string" ? t(c) : Array.isArray(c) ? c.map(trChild) : c; }
  /* React.createElement, translating interface text on the way */
  function hh(type, props) {
    var args = Array.prototype.slice.call(arguments);
    if (!he) return React.createElement.apply(React, args);
    if (props) {
      var np = null;
      for (var i = 0; i < PROPS.length; i++) {
        var k = PROPS[i], v = props[k];
        if (typeof v === "string" && LETTER.test(v)) { if (!np) np = Object.assign({}, props); np[k] = t(v); }
      }
      if (np) args[1] = np;
    }
    for (var j = 2; j < args.length; j++) args[j] = trChild(args[j]);
    return React.createElement.apply(React, args);
  }

  return { lang: lang, he: he, dir: he ? "rtl" : "ltr", add: add, t: t, tr: tr, h: hh, locale: he ? "he-IL" : "en-GB" };
})();
