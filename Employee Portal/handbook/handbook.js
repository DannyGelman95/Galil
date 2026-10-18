/* =====================================================================
   GALIL Employee Portal Handbook — shared script for the English
   (index.html) and Hebrew (he.html) pages: the permission model, the
   topic cards and one-chapter reader, the matrix, the per-chapter permission strips, the
   role filter, the lightbox, the theme and the language switch.
   ===================================================================== */
"use strict";
var HE = document.documentElement.lang === "he";
function L(en, he) { return HE ? he : en; }

/* ---- permission model — the single source for the matrices, the chips and the role filter ---- */
var ROLE_ORDER = ["EMP","SEN","TL","PM","OPS","FIN","CEO","EXT","VIEW"];
var ROLE_NAME = HE
  ? {EMP:"עובד/ת",SEN:"עובד/ת בכיר/ה",TL:"ראש צוות",PM:"מנהל/ת פרויקט",OPS:"מנהל/ת תפעול",FIN:"כספים",CEO:"מנכ\"ל / בעלים",EXT:"קבלן/ית חיצוני/ת",VIEW:"צופה"}
  : {EMP:"Employee",SEN:"Senior Employee",TL:"Team Lead",PM:"Project Manager",OPS:"Operations Manager",FIN:"Finance",CEO:"CEO / Owner",EXT:"External Contractor",VIEW:"Viewer"};

/* WorkDesk — the same matrix as the application (Management → ⚙ → Roles & permissions) */
var PERM = {
  reportOwnTime:         ["Y","Y","Y","Y","Y","-","Y","Y","-"],
  reportBlueTime:        ["-","-","Y","Y","Y","-","Y","-","-"],
  viewOthersTime:        ["-","-","T","P","Y","Y","Y","-","Y"],
  editOthersTime:        ["-","-","T","P","Y","-","Y","-","-"],
  approveTime:           ["-","-","T","P","Y","-","Y","-","-"],
  planOwnWeek:           ["Y","Y","Y","Y","Y","-","Y","Y","-"],
  planOthersWeek:        ["-","-","T","P","Y","-","Y","-","-"],
  reportExpenses:        ["Y","Y","Y","Y","Y","-","Y","Y","-"],
  approveExpenses:       ["-","-","T","P","Y","-","Y","-","-"],
  viewBudgets:           ["-","-","-","P","Y","Y","Y","-","-"],
  editBudgets:           ["-","-","-","P","Y","-","Y","-","-"],
  createWorkOrders:      ["-","-","-","P","Y","-","Y","-","-"],
  assignPeople:          ["-","-","T","P","Y","-","Y","-","-"],
  manageClientsProjects: ["-","-","-","P","Y","-","Y","-","-"],
  manageEmployeesRoles:  ["-","-","-","-","Y","-","Y","-","-"],
  dashboardOwn:          ["Y","Y","Y","Y","Y","Y","Y","-","Y"],
  dashboardCompany:      ["-","-","T","P","Y","Y","Y","-","Y"],
  excelExport:           ["O","O","T","P","Y","Y","Y","O","Y"],
  backupRestore:         ["-","-","-","-","Y","-","Y","-","-"],
  viewAuditLog:          ["-","-","-","-","Y","Y","Y","-","-"],
  manageTeams:           ["-","-","Y","Y","Y","-","Y","-","-"]
};
/* the Employee Portal and Taskana — the defaults each WorkDesk role brings (portal access can change them per person) */
var PORTAL_PERM = {
  openWorkdesk:     ["Y","Y","Y","Y","Y","Y","Y","Y","Y"],
  openTaskana:      ["Y","Y","Y","Y","Y","Y","Y","Y","Y"],
  openHandbook:     ["Y","Y","Y","Y","Y","Y","Y","Y","Y"],
  openKb:           ["Y","Y","Y","Y","Y","Y","Y","-","-"],
  setPortalAccess:  ["-","-","-","-","Y","-","Y","-","-"],
  tkSeeAll:         ["Y","Y","Y","Y","Y","Y","Y","O","Y"],
  tkWorkTasks:      ["Y","Y","Y","Y","Y","-","Y","O","-"],
  tkDeleteTasks:    ["O","O","Y","Y","Y","-","Y","O","-"],
  tkComment:        ["Y","Y","Y","Y","Y","Y","Y","O","Y"],
  tkProjectSettings:["-","-","Y","Y","Y","-","Y","-","-"],
  tkBudgets:        ["-","-","Y","Y","Y","-","Y","-","-"],
  tkOwnBank:        ["Y","Y","Y","Y","Y","-","Y","Y","-"],
  tkLibraryRead:    ["Y","Y","Y","Y","Y","Y","Y","-","Y"],
  tkLibraryWrite:   ["Y","Y","Y","Y","Y","-","Y","-","-"],
  tkData:           ["-","-","-","-","Y","-","Y","-","-"]
};
var LABEL = HE ? {
  reportOwnTime:"דיווח שעות עצמי", reportBlueTime:"דיווח שעות כחולות · ניהול", viewOthersTime:"צפייה בשעות של אחרים", editOthersTime:"עריכת שעות של אחרים",
  approveTime:"אישור בקשות שעות", planOwnWeek:"תכנון השבוע שלי", planOthersWeek:"תכנון השבוע של אחרים",
  reportExpenses:"דיווח הוצאות", approveExpenses:"אישור הוצאות", viewBudgets:"צפייה בתקציבים",
  editBudgets:"יצירה / עריכה של תקציבים", createWorkOrders:"יצירת הזמנות עבודה", assignPeople:"שיבוץ אנשים לפרויקטים",
  manageClientsProjects:"ניהול לקוחות ופרויקטים", manageEmployeesRoles:"ניהול עובדים ותפקידים",
  dashboardOwn:"לוח מחוונים — נתונים אישיים", dashboardCompany:"לוח מחוונים — נתוני החברה",
  excelExport:"ייצוא לאקסל",
  backupRestore:"גיבוי / שחזור", viewAuditLog:"צפייה ביומן הביקורת", manageTeams:"הקמת צוותים ומנהלים",
  openWorkdesk:"פתיחת WorkDesk", openTaskana:"פתיחת Taskana", openHandbook:"פתיחת המדריך", openKb:"פתיחת מאגר הידע",
  setPortalAccess:"הגדרת הרשאות פורטל לאנשים",
  tkSeeAll:"Taskana — צפייה בכל המשימות", tkWorkTasks:"Taskana — יצירה ועריכה של משימות", tkDeleteTasks:"Taskana — מחיקת משימות",
  tkComment:"Taskana — תגובות ושאלות", tkProjectSettings:"Taskana — הגדרות פרויקט (מפתח, סוג מסמך)",
  tkBudgets:"Taskana — מחווני תקציב ובנק שעות של אחרים", tkOwnBank:"Taskana — בנק השעות שלי", tkLibraryRead:"Taskana — קריאה בספרייה", tkLibraryWrite:"Taskana — כתיבה ועריכה בספרייה", tkData:"Taskana — נתונים, גיבוי ושחזור"
} : {
  reportOwnTime:"Report own time", reportBlueTime:"Report Blue · management hours", viewOthersTime:"View others' time", editOthersTime:"Edit others' time",
  approveTime:"Approve time requests", planOwnWeek:"Plan own week", planOthersWeek:"Plan others' week",
  reportExpenses:"Report expenses", approveExpenses:"Approve expenses", viewBudgets:"View budgets",
  editBudgets:"Create / edit budgets", createWorkOrders:"Create work orders", assignPeople:"Assign people to projects",
  manageClientsProjects:"Manage clients & projects", manageEmployeesRoles:"Manage employees & roles",
  dashboardOwn:"Dashboard — own figures", dashboardCompany:"Dashboard — company figures",
  excelExport:"Excel export",
  backupRestore:"Backup / restore", viewAuditLog:"View audit log", manageTeams:"Set up teams & managers",
  openWorkdesk:"Open WorkDesk", openTaskana:"Open Taskana", openHandbook:"Open the Handbook", openKb:"Open the Knowledge Base",
  setPortalAccess:"Set people's portal access",
  tkSeeAll:"Taskana — see every task", tkWorkTasks:"Taskana — create and edit tasks", tkDeleteTasks:"Taskana — delete tasks",
  tkComment:"Taskana — comments and questions", tkProjectSettings:"Taskana — project settings (key, document type)",
  tkBudgets:"Taskana — budget and others' hours-bank indicators", tkOwnBank:"Taskana — my hours bank", tkLibraryRead:"Taskana — read the Library", tkLibraryWrite:"Taskana — write and edit in the Library", tkData:"Taskana — data, backup and restore"
};
var SCOPE_WORD = HE ? {Y:"", O:"עצמי", T:"צוות", P:"פרויקטים"} : {Y:"", O:"own", T:"team", P:"projects"};
var SCOPE_LETTER = {O:"O", T:"T", P:"P"};

function rowOf(cap) { return PERM[cap] || PORTAL_PERM[cap] || null; }
function scopeOf(role, cap) {
  var row = rowOf(cap); if (!row) return "-";
  var i = ROLE_ORDER.indexOf(role); return i < 0 ? "-" : row[i];
}

/* ---- topic cards and the one-chapter reader ----
   The home screen is a search box and the chapters as cards, grouped by part;
   opening one shows that chapter alone with Back, Previous and Next. Links to
   #ch-… or to any id inside a chapter (#workdesk, #taskana…) open that chapter. */
var CH_ICON = {
  "ch-portal": '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  "ch-signin": '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  "ch-access": '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  "ch-basics": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  "ch-model": '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
  "ch-roles": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  "ch-screen": '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  "ch-time": '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
  "ch-planner": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  "ch-expenses": '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  "ch-budgets": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  "ch-approvals": '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
  "ch-dashboard": '<path d="M3 3v18h18"/><path d="M8 17V11M13 17V7M18 17v-4"/>',
  "ch-mywork": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  "ch-admin": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  "ch-data": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
  "ch-export": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  "ch-tk-basics": '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  "ch-tk-tasks": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  "ch-tk-wd": '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  "ch-tk-hours": '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
  "ch-tk-roles": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  "ch-tk-library": '<path d="M16 6l4 14M12 6v14M8 8v12M4 4v16"/>',
  "ch-tk-lib-write": '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  "ch-tk-lib-tools": '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  "ch-ref": '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'
};
var svgOf = function (body) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (body || CH_ICON["ch-ref"]) + "</svg>"; };
var hbEsc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
var chapters = Array.prototype.slice.call(document.querySelectorAll(".ch"));
var homeEl = document.getElementById("home"), qEl = document.getElementById("q");

/* parts: a chapter without data-part belongs to the part before it */
(function () {
  var part = "";
  chapters.forEach(function (ch, i) {
    if (ch.dataset.part) part = ch.dataset.part;
    ch.dataset.group = part;
    var num = ch.querySelector(".ch-num"); if (num) num.textContent = String(i + 1).padStart(2, "0");
  });
})();
var minutesOf = function (ch) { return Math.max(1, Math.round((ch.textContent || "").split(/\s+/).length / 200)); };
var summaryOf = function (ch) {
  var l = ch.querySelector(".lede"); var t = l ? l.textContent.trim() : "";
  var m = t.match(/^.*?[.!?](\s|$)/); var first = m ? m[0].trim() : t;
  return first.length > 120 ? first.slice(0, 117).replace(/\s+\S*$/, "") + "…" : first;
};

/* every chapter gets a Back bar on top and Previous / Next at the bottom */
chapters.forEach(function (ch, i) {
  var prev = chapters[i - 1], next = chapters[i + 1];
  var bar = document.createElement("div");
  bar.className = "chbar";
  bar.innerHTML = '<a class="backbtn" href="#">' + svgOf('<path d="M19 12H5M12 19l-7-7 7-7"/>') + L("All topics", "כל הנושאים") +
    '</a><span class="crumbs"><a href="#">' + L("Handbook", "המדריך") + "</a> › " + hbEsc(ch.dataset.group) + "</span>";
  ch.insertBefore(bar, ch.firstChild);
  var pg = document.createElement("div");
  pg.className = "pager";
  pg.innerHTML = (prev ? '<a href="#' + prev.id + '"><small>' + L("‹ Previous", "הקודם ›") + "</small>" + hbEsc(prev.dataset.title) + "</a>" : "") +
    (next ? '<a class="next" href="#' + next.id + '"><small>' + L("Next ›", "‹ הבא") + "</small>" + hbEsc(next.dataset.title) + "</a>" : "");
  ch.appendChild(pg);
});

function cardOf(ch) {
  var i = chapters.indexOf(ch), locked = ch.classList.contains("is-locked");
  var role = document.documentElement.getAttribute("data-role");
  return '<a class="tcard' + (locked ? " locked" : "") + '" href="#' + ch.id + '"><span class="top">' + svgOf(CH_ICON[ch.id]) +
    '<span class="n">' + String(i + 1).padStart(2, "0") + '</span></span><b>' + hbEsc(ch.dataset.title) + '</b><span class="s">' + hbEsc(summaryOf(ch)) + "</span>" +
    "<em>" + (locked ? L("Not available to ", "לא זמין ל") + hbEsc(ROLE_NAME[role] || role) : minutesOf(ch) + L(" min read", " דק׳ קריאה")) + "</em></a>";
}
function hbCards() {
  var term = (qEl.value || "").trim().toLowerCase();
  if (term) {
    var hits = chapters.filter(function (ch) { return (ch.dataset.title + " " + ch.textContent).toLowerCase().indexOf(term) >= 0; });
    homeEl.innerHTML = '<h2 class="home-h">' + (HE ? hits.length + " פרקים מזכירים “" + hbEsc(qEl.value.trim()) + "”"
        : hits.length + " chapter" + (hits.length === 1 ? "" : "s") + " mention “" + hbEsc(qEl.value.trim()) + "”") + "</h2>" +
      (hits.length ? '<p class="home-sub"><a href="#" data-clear>' + L("Clear the search", "ניקוי החיפוש") + '</a></p><div class="tcards">' + hits.map(cardOf).join("") + "</div>"
        : '<p class="home-sub">' + L("Nothing matches. Try another word, or ", "אין תוצאות. נסו מילה אחרת, או ") + '<a href="#" data-clear>' + L("browse all topics", "עיינו בכל הנושאים") + "</a>.</p>");
    return;
  }
  var groups = [];
  chapters.forEach(function (ch) { var g = groups[groups.length - 1]; if (!g || g.title !== ch.dataset.group) groups.push(g = { title: ch.dataset.group, chs: [] }); g.chs.push(ch); });
  homeEl.innerHTML = '<h2 class="home-h">' + L("What do you need to do?", "במה אפשר לעזור?") + '</h2><p class="home-sub">' +
    L("Pick a topic, or search above. Choose your role in the bar above to see what applies to you.", "בחרו נושא, או חפשו למעלה. בחרו את התפקיד שלכם בסרגל שלמעלה כדי לראות מה רלוונטי לכם.") + "</p>" +
    groups.map(function (g) { return '<section class="group"><h2 class="group-h">' + hbEsc(g.title) + '</h2><div class="tcards">' + g.chs.map(cardOf).join("") + "</div></section>"; }).join("");
}
function hbRoute() {
  var id = decodeURIComponent((location.hash || "").replace(/^#\/?/, ""));
  var target = id ? document.getElementById(id) : null;
  var ch = target ? (target.classList.contains("ch") ? target : target.closest(".ch")) : null;
  chapters.forEach(function (c) { c.hidden = c !== ch; });
  homeEl.hidden = !!ch;
  document.body.classList.toggle("reading", !!ch);
  document.title = (ch ? ch.dataset.title + " · " : "") + L("GALIL Employee Portal Handbook", "המדריך לפורטל העובדים של גליל");
  if (!ch) hbCards();
  if (ch && target !== ch) target.scrollIntoView(); else window.scrollTo(0, 0);
}
window.addEventListener("hashchange", hbRoute);
window.addEventListener("popstate", hbRoute);
qEl.addEventListener("input", function () {
  if (location.hash && location.hash !== "#") history.replaceState(null, "", location.pathname + location.search);
  hbRoute();
});
homeEl.addEventListener("click", function (e) {
  if (e.target.closest("[data-clear]")) { e.preventDefault(); qEl.value = ""; hbRoute(); }
});
document.addEventListener("click", function (e) {
  /* "All topics" and the crumb go home even when the address already reads # */
  var a = e.target.closest('a[href="#"]');
  if (a && !a.hasAttribute("data-clear")) { e.preventDefault(); history.pushState(null, "", location.pathname + location.search); hbRoute(); }
});
hbRoute();

/* ---- interface icons named in the text: <i class="ui-ic" data-ic="edit"></i> draws WorkDesk's own icon ---- */
(function () {
  var I = {
    edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="M15 5l4 4"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    assignments: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
    clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    widths: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18"/>',
    order: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>'
  };
  I["star-on"] = I.star;
  document.querySelectorAll("i.ui-ic").forEach(function (el) {
    var k = el.getAttribute("data-ic");
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="' + (k === "star-on" ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[k] || "") + "</svg>";
    el.setAttribute("role", "img"); el.setAttribute("aria-label", k.replace("-on", ""));
  });
})();

/* ---- the matrices ---- */
function drawMatrix(id, model) {
  var t = document.getElementById(id); if (!t) return;
  var head = "<thead><tr><th>" + L("Capability", "יכולת") + "</th>" +
    ROLE_ORDER.map(function (r) { return '<th class="rolecol" data-role="' + r + '" title="' + ROLE_NAME[r] + '">' + r + "</th>"; }).join("") +
    "</tr></thead>";
  var body = "<tbody>" + Object.keys(model).map(function (cap) {
    return "<tr><td>" + LABEL[cap] + "</td>" + model[cap].map(function (v, i) {
      return '<td class="num" data-v="' + v + '" data-role="' + ROLE_ORDER[i] + '">' + (v === "-" ? "–" : v) + "</td>";
    }).join("") + "</tr>";
  }).join("") + "</tbody>";
  t.innerHTML = head + body;
}
drawMatrix("matrix", PERM);
drawMatrix("portal-matrix", PORTAL_PERM);

/* ---- per-chapter permission strips ---- */
(function () {
  document.querySelectorAll("[data-perm]").forEach(function (box) {
    var caps = box.dataset.perm.split(",");
    var html = "<h4>" + L("Who can do this", "מי רשאי לעשות זאת") + '</h4><div class="caps">';
    caps.forEach(function (cap) {
      html += '<div class="cap-row"><span class="cap-name">' + LABEL[cap] + '</span><span class="cap-chips">';
      ROLE_ORDER.forEach(function (r) {
        var v = scopeOf(r, cap), w = SCOPE_WORD[v];
        html += '<span class="rc" data-scope="' + v + '" data-role="' + r + '" title="' + ROLE_NAME[r] +
          (v === "-" ? L(" — not permitted", " — אסור") : w ? L(" — " + w + " only", " — " + w + " בלבד") : L(" — permitted", " — מותר")) + '">' + r +
          (w ? '<span class="sc">' + SCOPE_LETTER[v] + "</span>" : "") + "</span>";
      });
      html += "</span></div>";
    });
    box.innerHTML = html + "</div>";
  });
})();

/* ---- role filter ---- */
(function () {
  var set = document.getElementById("roleset");
  var note = document.getElementById("rolenote");
  var current = null;
  var ALL_NOTE = L("Showing every role. Choose one to highlight what it may do and flag the chapters it cannot reach.",
    "מוצגים כל התפקידים. בחרו תפקיד כדי לסמן מה מותר לו ולסמן את הפרקים שאינם זמינים לו.");

  var all = document.createElement("button");
  all.className = "rolebtn clear"; all.type = "button"; all.textContent = L("All roles", "כל התפקידים");
  all.setAttribute("aria-pressed", "true"); all.dataset.role = "";
  set.appendChild(all);
  ROLE_ORDER.forEach(function (r) {
    var b = document.createElement("button");
    b.className = "rolebtn"; b.type = "button"; b.textContent = r;
    b.title = ROLE_NAME[r]; b.dataset.role = r; b.setAttribute("aria-pressed", "false");
    set.appendChild(b);
  });

  function apply(role) {
    current = role || null;
    if (current) document.documentElement.setAttribute("data-role", current);
    else document.documentElement.removeAttribute("data-role");
    set.querySelectorAll(".rolebtn").forEach(function (b) {
      b.setAttribute("aria-pressed", (b.dataset.role || "") === (current || "") ? "true" : "false");
    });
    document.querySelectorAll(".rc").forEach(function (c) { c.classList.toggle("hit", !!current && c.dataset.role === current); });
    document.querySelectorAll(".matrix td.num, .matrix th.rolecol").forEach(function (c) { c.classList.toggle("hl", !!current && c.dataset.role === current); });
    document.querySelectorAll(".ch").forEach(function (ch) {
      var caps = ch.dataset.caps, n = ch.querySelector(".locked-note");
      if (!caps || !current) { ch.classList.remove("is-locked"); return; }
      var reach = caps.split(",").some(function (cap) { return scopeOf(current, cap) !== "-"; });
      ch.classList.toggle("is-locked", !reach);
      if (!reach && n) n.textContent = L("Not available to " + ROLE_NAME[current] + " — this chapter is here for reference.",
        "לא זמין ל" + ROLE_NAME[current] + " — הפרק מופיע לעיון בלבד.");
    });
    note.innerHTML = current
      ? L("Reading as <b>" + ROLE_NAME[current] + " (" + current + ")</b>. Your chip is ringed on every capability — struck through where the answer is no. Chapters this role cannot reach are flagged.",
          "קריאה בתור <b>" + ROLE_NAME[current] + " (" + current + ")</b>. התג שלכם מוקף בכל יכולת — ומחוק היכן שהתשובה היא לא. פרקים שהתפקיד אינו מגיע אליהם מסומנים.")
      : ALL_NOTE;
    try { current ? localStorage.setItem("wd-handbook-role", current) : localStorage.removeItem("wd-handbook-role"); } catch (e) {}
    if (!homeEl.hidden) hbCards();
  }
  set.addEventListener("click", function (e) { var b = e.target.closest(".rolebtn"); if (b) apply(b.dataset.role); });
  note.textContent = ALL_NOTE;

  /* the signed-in person's WorkDesk role is the starting point, then the last role chosen here */
  var saved = null;
  try { saved = localStorage.getItem("wd-handbook-role"); } catch (e) {}
  if (!saved && window.GalilPortal) { var u = GalilPortal.sessionUser(); if (u && u.role) saved = u.role; }
  if (saved && ROLE_ORDER.indexOf(saved) >= 0) apply(saved);
})();

/* ---- figure lightbox — click any screenshot to view it full size ---- */
(function () {
  var box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = '<button type="button" class="lightbox-close" aria-label="' + L("Close", "סגירה") + '" title="' + L("Close", "סגירה") + '">×</button><img alt="">';
  document.body.appendChild(box);
  var img = box.querySelector("img");
  function open(src, alt) { img.src = src; img.alt = alt || ""; box.classList.add("on"); document.body.style.overflow = "hidden"; }
  function close() { box.classList.remove("on"); img.src = ""; document.body.style.overflow = ""; }
  document.querySelectorAll("figure img").forEach(function (el) {
    el.addEventListener("click", function () { open(el.getAttribute("src"), el.getAttribute("alt")); });
  });
  box.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("on")) close(); });
})();

/* ---- light / dark theme — the Employee Portal's, so it matches every part of the portal ---- */
(function () {
  var btn = document.getElementById("themebtn");
  if (!btn) return;
  function systemDark() { try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; } }
  function current() { return document.documentElement.getAttribute("data-theme") || (systemDark() ? "dark" : "light"); }
  function paint(t) {
    document.documentElement.setAttribute("data-theme", t);
    var dark = t === "dark";
    btn.innerHTML = dark
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>';
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? L("Switch to the light theme", "מעבר לערכת הנושא הבהירה") : L("Switch to the dark theme", "מעבר לערכת הנושא הכהה"));
    btn.title = btn.getAttribute("aria-label");
  }
  paint(current());
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    if (window.GalilPortal) GalilPortal.setTheme(next);
    else try { localStorage.setItem("galil-workdesk-theme", next); } catch (e) {}
    paint(next);
  });
})();

/* ---- language — the portal's: switching it here switches WorkDesk, Taskana and the Knowledge Base too ---- */
(function () {
  var btn = document.getElementById("langbtn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var next = HE ? "en" : "he";
    try { localStorage.setItem("galil-portal-lang", next); } catch (e) {}
    location.replace((HE ? "index.html" : "he.html") + location.hash);
  });
})();

/* ---- the portal gate: the Handbook opens for signed-in people whose access includes it ---- */
if (window.GalilPortal) GalilPortal.gate("handbook");
