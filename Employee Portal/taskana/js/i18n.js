/* =====================================================================
   Taskana — interface language (English / Hebrew).
   tr("English text", {name: value}) returns the text in the current
   language; English is the key. Data the team types stays as typed.
   ===================================================================== */
"use strict";
var LANG = "en";
var HE = {};   /* filled in by he.js */
function tr(s, params) {
  var out = LANG === "he" && HE[s] ? HE[s] : s;
  if (params) out = out.replace(/\{(\w+)\}/g, function (_, k) { return params[k] == null ? "" : params[k]; });
  return out;
}
/* plural helper: tr1(n, "{n} task", "{n} tasks") */
function trn(n, one, many) { return tr(n === 1 ? one : many, { n: n }); }
function locale() { return LANG === "he" ? "he-IL" : "en-GB"; }
function fmtDate(s, opts) {
  if (!s) return "—";
  var d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  return d.toLocaleDateString(locale(), opts || { day: "numeric", month: "short", year: "numeric" });
}
function fmtShort(s) { return s ? fmtDate(s, { day: "numeric", month: "short" }) : "—"; }
function fmtWhen(iso) {
  var d = new Date(iso), diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return tr("just now");
  if (diff < 3600) return tr("{n} min ago", { n: Math.floor(diff / 60) });
  if (diff < 86400) return tr("{n} h ago", { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return tr("{n} d ago", { n: Math.floor(diff / 86400) });
  return fmtDate(iso);
}
