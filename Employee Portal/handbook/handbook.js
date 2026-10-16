/* =====================================================================
   GALIL Employee Portal Handbook — shared script for the English
   (index.html) and Hebrew (he.html) pages: the permission model, the
   contents list, the matrix, the per-chapter permission strips, the
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
  libraryRead:           ["Y","Y","Y","Y","Y","Y","Y","-","-"],
  libraryWrite:          ["Y","Y","Y","Y","Y","-","Y","-","-"],
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
  tkData:           ["-","-","-","-","Y","-","Y","-","-"]
};
var LABEL = HE ? {
  reportOwnTime:"דיווח שעות עצמי", reportBlueTime:"דיווח שעות כחולות · ניהול", viewOthersTime:"צפייה בשעות של אחרים", editOthersTime:"עריכת שעות של אחרים",
  approveTime:"אישור בקשות שעות", planOwnWeek:"תכנון השבוע שלי", planOthersWeek:"תכנון השבוע של אחרים",
  reportExpenses:"דיווח הוצאות", approveExpenses:"אישור הוצאות", viewBudgets:"צפייה בתקציבים",
  editBudgets:"יצירה / עריכה של תקציבים", createWorkOrders:"יצירת הזמנות עבודה", assignPeople:"שיבוץ אנשים לפרויקטים",
  manageClientsProjects:"ניהול לקוחות ופרויקטים", manageEmployeesRoles:"ניהול עובדים ותפקידים",
  dashboardOwn:"לוח מחוונים — נתונים אישיים", dashboardCompany:"לוח מחוונים — נתוני החברה",
  libraryRead:"ספרייה — קריאה", libraryWrite:"ספרייה — כתיבה", excelExport:"ייצוא לאקסל",
  backupRestore:"גיבוי / שחזור", viewAuditLog:"צפייה ביומן הביקורת", manageTeams:"הקמת צוותים ומנהלים",
  openWorkdesk:"פתיחת WorkDesk", openTaskana:"פתיחת Taskana", openHandbook:"פתיחת המדריך", openKb:"פתיחת מאגר הידע",
  setPortalAccess:"הגדרת הרשאות פורטל לאנשים",
  tkSeeAll:"Taskana — צפייה בכל המשימות", tkWorkTasks:"Taskana — יצירה ועריכה של משימות", tkDeleteTasks:"Taskana — מחיקת משימות",
  tkComment:"Taskana — תגובות ושאלות", tkProjectSettings:"Taskana — הגדרות פרויקט (מפתח, סוג מסמך)",
  tkBudgets:"Taskana — מחווני תקציב ובנק שעות של אחרים", tkOwnBank:"Taskana — בנק השעות שלי", tkData:"Taskana — נתונים, גיבוי ושחזור"
} : {
  reportOwnTime:"Report own time", reportBlueTime:"Report Blue · management hours", viewOthersTime:"View others' time", editOthersTime:"Edit others' time",
  approveTime:"Approve time requests", planOwnWeek:"Plan own week", planOthersWeek:"Plan others' week",
  reportExpenses:"Report expenses", approveExpenses:"Approve expenses", viewBudgets:"View budgets",
  editBudgets:"Create / edit budgets", createWorkOrders:"Create work orders", assignPeople:"Assign people to projects",
  manageClientsProjects:"Manage clients & projects", manageEmployeesRoles:"Manage employees & roles",
  dashboardOwn:"Dashboard — own figures", dashboardCompany:"Dashboard — company figures",
  libraryRead:"Library — read", libraryWrite:"Library — write", excelExport:"Excel export",
  backupRestore:"Backup / restore", viewAuditLog:"View audit log", manageTeams:"Set up teams & managers",
  openWorkdesk:"Open WorkDesk", openTaskana:"Open Taskana", openHandbook:"Open the Handbook", openKb:"Open the Knowledge Base",
  setPortalAccess:"Set people's portal access",
  tkSeeAll:"Taskana — see every task", tkWorkTasks:"Taskana — create and edit tasks", tkDeleteTasks:"Taskana — delete tasks",
  tkComment:"Taskana — comments and questions", tkProjectSettings:"Taskana — project settings (key, document type)",
  tkBudgets:"Taskana — budget and others' hours-bank indicators", tkOwnBank:"Taskana — my hours bank", tkData:"Taskana — data, backup and restore"
};
var SCOPE_WORD = HE ? {Y:"", O:"עצמי", T:"צוות", P:"פרויקטים"} : {Y:"", O:"own", T:"team", P:"projects"};
var SCOPE_LETTER = {O:"O", T:"T", P:"P"};

function rowOf(cap) { return PERM[cap] || PORTAL_PERM[cap] || null; }
function scopeOf(role, cap) {
  var row = rowOf(cap); if (!row) return "-";
  var i = ROLE_ORDER.indexOf(role); return i < 0 ? "-" : row[i];
}

/* ---- contents, grouped by part ---- */
(function () {
  var list = document.getElementById("toclist");
  var chs = document.querySelectorAll(".ch");
  var lastPart = null;
  chs.forEach(function (ch, i) {
    if (ch.dataset.part && ch.dataset.part !== lastPart) {
      lastPart = ch.dataset.part;
      var p = document.createElement("li"); p.className = "toc-part"; p.textContent = lastPart; list.appendChild(p);
    }
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + ch.id;
    a.innerHTML = '<span class="n">' + String(i + 1).padStart(2, "0") + "</span><span>" + ch.dataset.title + "</span>";
    li.appendChild(a); list.appendChild(li);
    var num = ch.querySelector(".ch-num"); if (num) num.textContent = String(i + 1).padStart(2, "0");
  });
  if ("IntersectionObserver" in window) {
    var links = list.querySelectorAll("a");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-70px 0px -70% 0px" });
    chs.forEach(function (c) { io.observe(c); });
  }
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
    btn.textContent = dark ? "☀" : "◐";
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
