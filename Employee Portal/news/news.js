/* =====================================================================
   GALIL Defense News — the press on Israel's defense industry.

   Reads feed.json beside this page: headlines about IAI, Elbit Systems,
   Rafael, Aeronautics, Controp and the rest, from Google News in English
   and Hebrew. tools/defense-news.js builds the file; the Pages deployment
   runs it on every deploy and every two hours.

   Filters (company, language, search) live in the address
   (#c=elbit&l=he&q=…), so a filtered view can be shared.
   ===================================================================== */
"use strict";

var LANG = GalilPortal.applyLang();
var HE = {
  "Employee Portal · Defense News": "פורטל העובדים · חדשות ביטחוניות",
  "Defense industry news": "חדשות התעשייה הביטחונית",
  "Search headlines and sources": "חיפוש בכותרות ובמקורות",
  "Employee Portal home": "דף הבית של פורטל העובדים",
  "Companies": "חברות",
  "Language of the article": "שפת הכתבה",
  "All": "הכול",
  "All companies": "כל החברות",
  "English": "אנגלית",
  "Hebrew": "עברית",
  "Signed in as": "מחובר/ת בתור",
  "Switch to the light theme": "מעבר לערכת נושא בהירה",
  "Switch to the dark theme": "מעבר לערכת נושא כהה",
  "Loading…": "טוען…",
  "Today": "היום",
  "Yesterday": "אתמול",
  "Show more": "הצגת עוד",
  "{n} stories · last {d} days · updated {ago}": "{n} כתבות · {d} הימים האחרונים · עודכן {ago}",
  "just now": "עכשיו",
  "{n} min ago": "לפני {n} דק׳",
  "{n} h ago": "לפני {n} שע׳",
  "{n} days ago": "לפני {n} ימים",
  "No stories match": "אין כתבות מתאימות",
  "Try another company, language or search.": "נסו חברה, שפה או חיפוש אחרים.",
  "The news feed isn't here yet": "עדכון החדשות עדיין לא כאן",
  "The feed is built when the portal is published to GitHub Pages and refreshed every two hours. Open the portal from its published address to read it.":
    "העדכון נבנה כשהפורטל מתפרסם ב-GitHub Pages ומתרענן כל שעתיים. פתחו את הפורטל מהכתובת המפורסמת שלו כדי לקרוא.",
  "Headlines from Google News, in English and Hebrew. Each link opens the publisher's article; GALIL does not check or endorse the reporting.":
    "כותרות מ-Google News, באנגלית ובעברית. כל קישור פותח את הכתבה באתר המפרסם; גליל אינה בודקת את הדיווח ואינה עומדת מאחוריו.",
  "Opens the article on {site}": "פתיחת הכתבה ב-{site}"
};
function tr(s, v) {
  var o = LANG === "he" && HE[s] ? HE[s] : s;
  if (v) Object.keys(v).forEach(function (k) { o = o.split("{" + k + "}").join(v[k]); });
  return o;
}

/* a tiny element builder: h("a", { class: "x", href: "…" }, child, …) */
function h(tag, attrs) {
  var el = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    var v = attrs[k]; if (v == null || v === false) return;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  });
  for (var i = 2; i < arguments.length; i++) {
    var c = arguments[i]; if (c == null || c === false) continue;
    (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === "string" || typeof x === "number" ? document.createTextNode(String(x)) : x); });
  }
  return el;
}

var FEED = null, SHOWN = 60, PAGE = 60;
var listEl, cosEl, langsEl, qEl, metaEl;

/* ---------- filters in the address ---------- */
function readState() {
  var p = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
  return { c: p.get("c") || "", l: p.get("l") || "", q: p.get("q") || "" };
}
function writeState(s) {
  var p = new URLSearchParams();
  if (s.c) p.set("c", s.c); if (s.l) p.set("l", s.l); if (s.q) p.set("q", s.q);
  var hash = p.toString();
  history.replaceState(null, "", location.pathname + location.search + (hash ? "#" + hash : ""));
  SHOWN = PAGE; render();
}
function setFilter(k, v) { var s = readState(); s[k] = v; writeState(s); }

/* ---------- dates ---------- */
function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function dayLabel(d) {
  var now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return tr("Today");
  if (dayKey(d) === dayKey(y)) return tr("Yesterday");
  return d.toLocaleDateString(LANG === "he" ? "he-IL" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
}
function ago(iso) {
  var m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 2) return tr("just now");
  if (m < 60) return tr("{n} min ago", { n: m });
  if (m < 48 * 60) return tr("{n} h ago", { n: Math.round(m / 60) });
  return tr("{n} days ago", { n: Math.round(m / 1440) });
}
function timeOf(d) { return d.toLocaleTimeString(LANG === "he" ? "he-IL" : "en-GB", { hour: "2-digit", minute: "2-digit" }); }

/* ---------- drawing ---------- */
function companyName(c) { return LANG === "he" && c.he ? c.he : c.name; }
function byId(id) { return (FEED.companies || []).filter(function (c) { return c.id === id; })[0]; }

function matches(n, s, skip) {
  if (skip !== "c" && s.c && n.companies.indexOf(s.c) < 0) return false;
  if (skip !== "l" && s.l && n.lang !== s.l) return false;
  if (s.q) {
    var q = s.q.toLowerCase();
    if ((n.title + " " + (n.source || "")).toLowerCase().indexOf(q) < 0) return false;
  }
  return true;
}

function renderFilters(s) {
  /* the counts follow the language and search already chosen */
  var pool = FEED.items.filter(function (n) { return matches(n, s, "c"); });
  var count = function (id) { return pool.filter(function (n) { return n.companies.indexOf(id) >= 0; }).length; };
  cosEl.innerHTML = "";
  cosEl.appendChild(h("button", { type: "button", class: "co", id: "co-all", "aria-pressed": s.c ? "false" : "true", onclick: function () { setFilter("c", ""); } },
    tr("All companies"), h("span", { class: "n" }, String(pool.length))));
  FEED.companies.forEach(function (c) {
    var n = count(c.id);
    if (!n && s.c !== c.id) return;
    cosEl.appendChild(h("button", { type: "button", class: "co", id: "co-" + c.id, title: c.full, "aria-pressed": s.c === c.id ? "true" : "false", style: "--c:" + c.color,
      onclick: function () { setFilter("c", s.c === c.id ? "" : c.id); } },
      h("span", { class: "dot", "aria-hidden": "true" }), companyName(c), h("span", { class: "n" }, String(n))));
  });
  langsEl.innerHTML = "";
  [["", "All"], ["en", "English"], ["he", "Hebrew"]].forEach(function (o) {
    langsEl.appendChild(h("button", { type: "button", id: "lang-" + (o[0] || "all"), "aria-pressed": s.l === o[0] ? "true" : "false", onclick: function () { setFilter("l", o[0]); } }, tr(o[1])));
  });
}

function itemEl(n) {
  var d = new Date(n.date), site = n.source || "";
  return h("li", { class: "item" },
    h("a", { class: "t", href: n.url, target: "_blank", rel: "noopener noreferrer", dir: "auto", lang: n.lang, title: site ? tr("Opens the article on {site}", { site: site }) : null }, n.title),
    h("div", { class: "m" },
      site ? h("span", { class: "src", dir: "auto" }, site) : null,
      h("time", { datetime: n.date }, timeOf(d)),
      n.companies.map(function (id) {
        var c = byId(id); if (!c) return null;
        return h("button", { type: "button", class: "tag", style: "--c:" + c.color, title: c.full, onclick: function () { setFilter("c", id); window.scrollTo(0, 0); } },
          h("span", { class: "dot", "aria-hidden": "true" }), companyName(c));
      })));
}

function render() {
  if (!FEED) return;
  var s = readState();
  if (qEl.value !== s.q && document.activeElement !== qEl) qEl.value = s.q;
  metaEl.textContent = tr("{n} stories · last {d} days · updated {ago}", { n: FEED.items.length, d: FEED.days || 30, ago: ago(FEED.updated) });
  renderFilters(s);
  var list = FEED.items.filter(function (n) { return matches(n, s); });
  listEl.innerHTML = "";
  if (!list.length) {
    listEl.appendChild(h("div", { class: "empty", id: "news-empty" }, h("b", null, tr("No stories match")), tr("Try another company, language or search.")));
  } else {
    var ul = null, last = "";
    list.slice(0, SHOWN).forEach(function (n) {
      var d = new Date(n.date), k = dayKey(d);
      if (k !== last) { last = k; listEl.appendChild(h("h2", { class: "day" }, dayLabel(d))); ul = h("ul", { class: "items" }); listEl.appendChild(ul); }
      ul.appendChild(itemEl(n));
    });
    if (list.length > SHOWN) listEl.appendChild(h("button", { type: "button", class: "more", id: "news-more", onclick: function () { SHOWN += PAGE; render(); } }, tr("Show more")));
  }
  listEl.appendChild(h("p", { class: "foot" }, tr("Headlines from Google News, in English and Hebrew. Each link opens the publisher's article; GALIL does not check or endorse the reporting.")));
}

function notYet() {
  metaEl.textContent = "";
  listEl.innerHTML = "";
  listEl.appendChild(h("div", { class: "empty", id: "news-missing" },
    h("b", null, tr("The news feed isn't here yet")),
    tr("The feed is built when the portal is published to GitHub Pages and refreshed every two hours. Open the portal from its published address to read it.")));
}

/* ---------- start ---------- */
(function boot() {
  var me = GalilPortal.gate("news");
  if (!me) return;
  listEl = document.getElementById("list"); cosEl = document.getElementById("cos"); langsEl = document.getElementById("langs");
  qEl = document.getElementById("q"); metaEl = document.getElementById("meta");

  /* top bar: who, language, theme */
  var who = document.getElementById("who");
  who.appendChild(h("span", null, tr("Signed in as"), " ", h("b", null, LANG === "he" && me.fullNameHe ? me.fullNameHe : me.fullName)));
  var lb = document.getElementById("langbtn"), he = LANG === "he";
  lb.textContent = he ? "English" : "עברית"; lb.lang = he ? "en" : "he"; lb.title = he ? "English — אנגלית" : "עברית — Hebrew";
  lb.addEventListener("click", function () { GalilPortal.setLang(he ? "en" : "he"); });
  var tb = document.getElementById("themebtn");
  var paintTheme = function () { var dark = GalilPortal.theme() === "dark"; tb.textContent = dark ? "☀" : "☾"; tb.title = tr(dark ? "Switch to the light theme" : "Switch to the dark theme"); tb.setAttribute("aria-label", tb.title); };
  tb.addEventListener("click", function () { GalilPortal.setTheme(GalilPortal.theme() === "dark" ? "light" : "dark"); paintTheme(); });
  paintTheme();
  document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = tr(el.getAttribute("data-t")); });
  document.querySelectorAll("[data-tip]").forEach(function (el) { el.title = tr(el.getAttribute("data-tip")); el.setAttribute("aria-label", el.title); });
  document.querySelectorAll("[data-label]").forEach(function (el) { el.setAttribute("aria-label", tr(el.getAttribute("data-label"))); });
  document.querySelectorAll("[data-ph]").forEach(function (el) { el.placeholder = tr(el.getAttribute("data-ph")); el.setAttribute("aria-label", el.placeholder); });
  document.title = tr("Defense industry news") + " · GALIL";
  document.getElementById("app").hidden = false;

  var timer = 0;
  qEl.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { setFilter("q", qEl.value.trim()); }, 180); });
  window.addEventListener("hashchange", function () { SHOWN = PAGE; render(); });

  listEl.appendChild(h("p", { class: "muted", role: "status" }, tr("Loading…")));
  fetch("feed.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (f) {
      if (!f || !Array.isArray(f.items) || !Array.isArray(f.companies)) throw new Error("not a feed");
      FEED = f; render();
    })
    .catch(notYet);
})();
