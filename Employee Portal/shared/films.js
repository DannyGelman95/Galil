/* =====================================================================
   GALIL Employee Portal — tutorial films in the Handbook and the
   Knowledge Base. The films themselves are in handbook/films/, made by
   tools/tutorials/ (each with a poster .jpg and its captions as .vtt).

   A page marks where films go with
     <div class="films" data-films="workdesk-timelog-desktop workdesk-time-phone"></div>
   and calls GalilFilms.fill(root, base), base being the path to
   handbook/films/ from that page. A computer film plays wide; a phone
   film stands beside it, phone-shaped.
   ===================================================================== */
"use strict";
var GalilFilms = (function () {
  /* id → [English title, Hebrew title, minutes] */
  var FILMS = {
    "portal-home-desktop":                ["The Employee Portal home page", "דף הבית של פורטל העובדים"],
    "portal-home-phone":                  ["The portal on a phone", "הפורטל בטלפון"],
    "portal-signin-desktop":              ["Signing in and signing up", "כניסה והרשמה"],
    "workdesk-timelog-desktop":           ["The Time Log", "יומן השעות"],
    "workdesk-time-phone":                ["Reporting time on a phone", "דיווח שעות בטלפון"],
    "workdesk-planner-desktop":           ["The Week Planner", "מתכנן השבוע"],
    "workdesk-plan-phone":                ["Planning on a phone", "תכנון בטלפון"],
    "workdesk-expenses-desktop":          ["Expenses", "הוצאות"],
    "workdesk-expenses-phone":            ["Expenses on a phone", "הוצאות בטלפון"],
    "workdesk-approvals-desktop":         ["Approvals", "אישורים"],
    "workdesk-dashboard-desktop":         ["The Dashboard", "לוח המחוונים"],
    "workdesk-management-people-desktop": ["Management · people and teams", "ניהול · אנשים וצוותים"],
    "workdesk-management-work-desktop":   ["Management · clients and budgets", "ניהול · לקוחות ותקציבים"],
    "workdesk-mywork-desktop":            ["My assignments and my profile", "השיוכים והפרופיל שלי"],
    "workdesk-more-phone":                ["More, on a phone", "עוד, בטלפון"],
    "workdesk-admin-desktop":             ["System administration", "ניהול מערכת"],
    "taskana-tasks-desktop":              ["Taskana — boards and tasks", "Taskana — לוחות ומשימות"],
    "taskana-phone":                      ["Taskana on a phone", "Taskana בטלפון"],
    "taskana-library-desktop":            ["The Library", "הספרייה"]
  };
  /* each film's length, in whole minutes */
  var MINUTES = { "portal-home-desktop": 2,
    "portal-home-phone": 1,
    "portal-signin-desktop": 2,
    "taskana-library-desktop": 2,
    "taskana-phone": 1,
    "taskana-tasks-desktop": 2,
    "workdesk-admin-desktop": 1,
    "workdesk-approvals-desktop": 2,
    "workdesk-dashboard-desktop": 2,
    "workdesk-expenses-desktop": 2,
    "workdesk-expenses-phone": 1,
    "workdesk-management-people-desktop": 2,
    "workdesk-management-work-desktop": 2,
    "workdesk-more-phone": 1,
    "workdesk-mywork-desktop": 1,
    "workdesk-plan-phone": 1,
    "workdesk-planner-desktop": 4,
    "workdesk-time-phone": 1,
    "workdesk-timelog-desktop": 3 };

  var css = [
    ".films{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin:20px 0 28px;max-width:100%}",
    "article > .films{max-width:min(100%,960px)}",
    ".films.pair{grid-template-columns:minmax(0,1fr) minmax(150px,230px);align-items:start}",
    ".film{margin:0;display:flex;flex-direction:column;gap:7px}",
    ".film video{display:block;width:100%;height:auto;border-radius:10px;background:#14284A;border:1px solid var(--line,#C4D1E7);box-shadow:0 8px 26px -14px rgba(20,40,74,.45)}",
    ".film.phone video{aspect-ratio:390/844;border-radius:18px;border-width:3px;border-color:#1F3A66}",
    ".film figcaption{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font:600 12.5px/1.35 'Noto Sans','Segoe UI',Arial,sans-serif;color:var(--muted,#575E6B)}",
    ".film figcaption .play{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#F08A24;color:#fff;font-size:9px;flex:0 0 auto}",
    ".film figcaption b{color:var(--ink,#1C2D4A);font-weight:700}",
    "@media(max-width:640px){.films.pair{grid-template-columns:minmax(0,1fr)}.film.phone{max-width:260px;justify-self:center}}"
  ].join("\n");

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function figure(id, base, he) {
    var f = FILMS[id]; if (!f) return "";
    var phone = /-phone$/.test(id), src = base + id + ".en";
    var mins = MINUTES[id] ? (he ? MINUTES[id] + " דק׳" : MINUTES[id] + " min") : "";
    var where = phone ? (he ? "בטלפון" : "On a phone") : (he ? "במחשב" : "On a computer");
    return '<figure class="film' + (phone ? " phone" : "") + '">' +
      '<video controls preload="none" playsinline poster="' + src + '.jpg" aria-label="' + esc(he ? f[1] : f[0]) + '">' +
      '<source src="' + src + '.mp4" type="video/mp4">' +
      '<track kind="captions" src="' + src + '.vtt" srclang="en" label="English">' +
      '</video>' +
      '<figcaption><span class="play" aria-hidden="true">▶</span><b>' + esc(he ? f[1] : f[0]) + '</b>' +
      '<span>' + [where, mins, he ? "באנגלית" : ""].filter(Boolean).join(" · ") + '</span></figcaption></figure>';
  }
  function fill(root, base) {
    if (!document.getElementById("galil-films-css")) {
      var st = document.createElement("style"); st.id = "galil-films-css"; st.textContent = css; document.head.appendChild(st);
    }
    var he = (document.documentElement.getAttribute("lang") || "").indexOf("he") === 0;
    (root || document).querySelectorAll(".films[data-films]").forEach(function (el) {
      var ids = el.getAttribute("data-films").split(/\s+/).filter(function (k) { return FILMS[k]; });
      el.classList.toggle("pair", ids.length === 2 && /-phone$/.test(ids[1]) && !/-phone$/.test(ids[0]));
      el.innerHTML = ids.map(function (k) { return figure(k, base, he); }).join("");
      /* one film plays at a time */
      el.querySelectorAll("video").forEach(function (v) {
        v.addEventListener("play", function () { document.querySelectorAll(".film video").forEach(function (o) { if (o !== v) o.pause(); }); });
      });
    });
  }
  return { FILMS: FILMS, MINUTES: MINUTES, fill: fill };
})();
