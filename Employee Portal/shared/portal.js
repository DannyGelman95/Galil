/* =====================================================================
   GALIL Employee Portal — what every part of the portal shares.

   The portal is one application: the Employee Portal home (index.html,
   which also runs WorkDesk), Taskana, the Handbook, the Knowledge Base,
   Model Studio and HR.
   People sign in once, on the portal home. This file lets the other pages
   read that sign-in, the person's access to each app, the interface
   language (English / Hebrew) and the light / dark theme.

   Access per person lives in WorkDesk's People records (user.access), set
   by an Operations Manager or the CEO under Management → People → Portal
   access. Without an explicit setting, access follows the WorkDesk role.
   ===================================================================== */
"use strict";
/* the portal's pages don't zoom: no pinch (Safari ignores user-scalable=no in the browser), no double-tap zoom */
(function () {
  try {
    var st = document.createElement("style");
    st.textContent = "html,body{touch-action:pan-x pan-y;-webkit-text-size-adjust:100%;text-size-adjust:100%}";
    (document.head || document.documentElement).appendChild(st);
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
    document.addEventListener("touchmove", function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  } catch (e) {}
})();

var GalilPortal = (function () {
  var LANG_KEY = "galil-portal-lang", THEME_KEY = "galil-workdesk-theme", SESSION_KEY = "galil-workdesk-session",
      WD_KEY = "galil-workdesk-v1", TK_LOCAL_KEY = "galil-taskana-v1", TK_CACHE_KEY = "galil-taskana-cache:data";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function json(k) { try { return JSON.parse(get(k) || "null"); } catch (e) { return null; } }

  /* ---------- language ---------- */
  function lang() { var v = get(LANG_KEY); return v === "he" ? "he" : "en"; }
  function setLang(l, noReload) { put(LANG_KEY, l === "he" ? "he" : "en"); if (!noReload) location.reload(); }
  function applyLang() {
    var l = lang();
    try { document.documentElement.lang = l; document.documentElement.dir = l === "he" ? "rtl" : "ltr"; } catch (e) {}
    return l;
  }
  /* pick the text for the current language: t("English", "עברית") */
  function t(en, he) { return lang() === "he" && he ? he : en; }

  /* ---------- theme ---------- */
  function systemTheme() { try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { return "light"; } }
  function theme() { var v = get(THEME_KEY); return v === "dark" || v === "light" ? v : systemTheme(); }
  function setTheme(v) { put(THEME_KEY, v === "dark" ? "dark" : "light"); try { document.documentElement.setAttribute("data-theme", theme()); } catch (e) {} }

  /* ---------- people and access ---------- */
  /* WorkDesk's data as this browser last saw it (the portal keeps it up to date) */
  function workdesk() { var o = json(WD_KEY); return o && o.data && Array.isArray(o.data.users) ? o.data : null; }
  function sessionUser() {
    var id = get(SESSION_KEY), d = workdesk();
    if (!id || !d) return null;
    for (var i = 0; i < d.users.length; i++) if (d.users[i].id === id) return d.users[i];
    return null;
  }
  var TASKANA_ROLES = ["Admin", "Manager", "Member", "External", "Viewer"];
  /* HR: Admin publishes news, events and surveys and runs review cycles; Member takes part */
  var HR_ROLES = ["Admin", "Member"];
  var DEFAULT_HR = { CEO: "Admin", OPS: "Admin", EXT: "none" };
  var DEFAULT_TASKANA = { CEO: "Admin", OPS: "Admin", PM: "Manager", TL: "Manager", SEN: "Member", EMP: "Member", EXT: "External", FIN: "Viewer", VIEW: "Viewer" };
  function defaultAccess(role) {
    return { workdesk: true, taskana: DEFAULT_TASKANA[role] || "Viewer", handbook: true, kb: role !== "EXT" && role !== "VIEW", studio: role !== "VIEW", hr: DEFAULT_HR[role] || "Member" };
  }
  /* { workdesk: bool, taskana: "Admin"…"Viewer" | "none", handbook: bool, kb: bool, studio: bool (Model Studio), hr: "Admin" | "Member" | "none" } */
  function access(u) {
    if (!u) return { workdesk: false, taskana: "none", handbook: false, kb: false, studio: false, hr: "none" };
    var d = defaultAccess(u.role), a = u.access || {};
    var out = {
      workdesk: a.workdesk == null ? d.workdesk : !!a.workdesk,
      taskana: a.taskana == null ? d.taskana : (TASKANA_ROLES.indexOf(a.taskana) >= 0 ? a.taskana : "none"),
      handbook: a.handbook == null ? d.handbook : !!a.handbook,
      kb: a.kb == null ? d.kb : !!a.kb,
      studio: a.studio == null ? d.studio : !!a.studio,
      hr: a.hr == null ? d.hr : (HR_ROLES.indexOf(a.hr) >= 0 ? a.hr : "none")
    };
    if (!u.isActive || u.pendingActivation) { out.workdesk = false; out.taskana = "none"; out.kb = false; out.handbook = false; out.studio = false; out.hr = "none"; }
    return out;
  }

  /* Taskana's data as this browser last saw it (standalone copy, or the cache of the shared file) */
  function taskana() {
    var o = json(TK_CACHE_KEY);
    if (!(o && Array.isArray(o.tasks))) o = json(TK_LOCAL_KEY);
    return o && Array.isArray(o.tasks) ? o : null;
  }

  /* ---------- phones and tablets ---------- */
  /* True on a phone or tablet (not on a computer with a narrow window): the
     browser says it is mobile, or it is an iPad (which reports itself as a
     Mac), or it has only a touch screen, and a small one. Model Studio is not
     offered there. */
  function isMobileDevice() {
    try {
      var ua = navigator.userAgent || "";
      if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
      if (/Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|Opera Mini/i.test(ua)) return true;
      if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
      return !window.matchMedia("(any-pointer: fine)").matches && Math.min(screen.width, screen.height) < 900;
    } catch (e) { return false; }
  }

  /* ---------- pages other than the portal home ---------- */
  function hubUrl(base) { return (base || "../") + "index.html"; }
  function signOut(base) { location.href = hubUrl(base) + "#signout"; }

  /* A blocking screen for pages that need a signed-in person with access.
     Returns the person when they may continue; otherwise draws the screen and returns null.
     opts.desktopOnly: also refused on phones and tablets. */
  function gate(app, opts) {
    opts = opts || {};
    applyLang(); setTheme(theme());
    var u = sessionUser(), a = access(u), ok = !!u && (app === "taskana" || app === "hr" ? a[app] !== "none" : !!a[app]);
    var mobile = ok && opts.desktopOnly && isMobileDevice();
    if (ok && !mobile) return u;
    var en = { workdesk: "WorkDesk", taskana: "Taskana", handbook: "the Handbook", kb: "the Knowledge Base", studio: "Model Studio", hr: "HR" }[app];
    var he = { workdesk: "ל-WorkDesk", taskana: "ל-Taskana", handbook: "למדריך למשתמש", kb: "למאגר הידע", studio: "לסטודיו המודלים", hr: "למשאבי אנוש" }[app];
    var heIn = { workdesk: "ב-WorkDesk", taskana: "ב-Taskana", handbook: "במדריך למשתמש", kb: "במאגר הידע", studio: "בסטודיו המודלים", hr: "במשאבי אנוש" }[app];
    var title = mobile ? t(en + " is for computers", en === "Model Studio" ? "סטודיו המודלים מיועד למחשבים" : "מיועד למחשבים")
      : !u ? t("Sign in to the Employee Portal first", "יש להתחבר קודם לפורטל העובדים")
      : t("No access to " + en, "אין לך גישה " + he);
    var msg = mobile ? t(en + " is not available on phones and tablets. Open it from the Employee Portal on a computer.",
                         "אי אפשר להשתמש " + heIn + " בטלפון או בטאבלט. פתחו אותו מפורטל העובדים במחשב.")
      : !u ? t("Open the Employee Portal, sign in with your GALIL account, and choose " + en + " from the home page.",
                     "פתחו את פורטל העובדים, התחברו עם חשבון גליל ובחרו " + heIn + " בדף הבית.")
      : t("Your account (" + u.email + ") doesn't include " + en + ". Ask an Operations Manager or the CEO if you need it.",
          "החשבון שלך (" + u.email + ") לא כולל גישה " + he + ". אם צריך גישה, פנו למנהל/ת התפעול או למנכ\"ל.");
    var css = "position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:var(--gp-bg,#F0F3F7);font:15px/1.55 'Noto Sans','Noto Sans Hebrew',system-ui,sans-serif;color:#1C2D4A";
    if (theme() === "dark") css = css.replace("#F0F3F7", "#0E131B").replace("color:#1C2D4A", "color:#E0E6EF");
    var box = document.createElement("div");
    box.id = "portal-gate"; box.setAttribute("role", "alert"); box.style.cssText = css;
    var card = document.createElement("div");
    card.style.cssText = "max-width:440px;width:100%;border-radius:18px;padding:28px 26px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.18);background:" + (theme() === "dark" ? "#171C25" : "#fff");
    var h1 = document.createElement("div"); h1.style.cssText = "font-weight:800;letter-spacing:.14em;font-size:13px;color:#B5600E;margin-bottom:10px"; h1.textContent = t("GALIL EMPLOYEE PORTAL", "פורטל העובדים · גליל");
    var h2 = document.createElement("h1"); h2.style.cssText = "font-size:21px;margin:0 0 8px"; h2.textContent = title;
    var p = document.createElement("p"); p.style.cssText = "margin:0 0 18px;opacity:.8"; p.textContent = msg;
    var go = document.createElement("a"); go.href = hubUrl(opts.base); go.id = "portal-gate-go";
    go.style.cssText = "display:inline-block;background:#B5600E;color:#fff;font-weight:700;text-decoration:none;border-radius:10px;padding:11px 20px";
    go.textContent = u ? t("Back to the Employee Portal", "חזרה לפורטל העובדים") : t("Go to the Employee Portal", "מעבר לפורטל העובדים");
    card.appendChild(h1); card.appendChild(h2); card.appendChild(p); card.appendChild(go); box.appendChild(card);
    var mount = function () { document.body.appendChild(box); };
    if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
    return null;
  }

  return {
    LANG_KEY: LANG_KEY, THEME_KEY: THEME_KEY, SESSION_KEY: SESSION_KEY, GITHUB_TOKEN_KEY: "galil-portal-github-token",
    TASKANA_ROLES: TASKANA_ROLES, HR_ROLES: HR_ROLES,
    lang: lang, setLang: setLang, applyLang: applyLang, t: t,
    theme: theme, setTheme: setTheme,
    workdesk: workdesk, sessionUser: sessionUser, access: access, defaultAccess: defaultAccess, taskana: taskana,
    isMobileDevice: isMobileDevice,
    hubUrl: hubUrl, signOut: signOut, gate: gate
  };
})();
