/* =====================================================================
   GALIL HR — start-up, the top bar, the section tabs and the routes.
   Who may open HR is the person's portal access (shared/portal.js): the
   portal sign-in, and an HR role (Admin or Member) in their access — by
   default everyone but external contractors; the CEO and Operations
   Managers are HR admins. The page follows the portal's language and theme.
   ===================================================================== */
"use strict";

var TABS = [
  ["", "Home", "home"], ["news", "News", "news"], ["events", "Events", "calendar"], ["surveys", "Surveys", "survey"],
  ["reviews", "Reviews", "review"], ["people", "People", "people"], ["kudos", "Recognition", "kudos"]];
function route() { return (location.hash || "").replace(/^#\/?/, "").replace(/\/$/, ""); }
function go(hash) { if (location.hash === hash) rerender(); else location.hash = hash; }

function page(r) {
  var p = r.split("/");
  switch (p[0]) {
    case "": case "home": return pageHome();
    case "news": return p[1] ? pageNewsItem(p[1]) : pageNews();
    case "events": return p[1] === "calendar" ? pageEvents("calendar", p[2]) : p[1] ? pageEvent(p[1]) : pageEvents("list");
    case "surveys": return !p[1] ? pageSurveys() : p[2] === "edit" ? pageSurveyEdit(p[1]) : p[2] === "results" ? pageSurveyResults(p[1]) : pageSurvey(p[1]);
    case "reviews": return p[1] === "cycle" ? pageCycle(p[2]) : p[1] ? pageReview(p[1]) : pageReviews();
    case "people": return pageDirectory();
    case "kudos": return pageKudos();
    default: return notFound(tr("There's no such page."), "#/");
  }
}
var main = null, lastRoute = null;
/* draw the page for the address; on a background refresh, leave a page being filled in alone */
function render(background) {
  var r = route();
  if (background && (openModals.length || (main.firstChild && main.firstChild.getAttribute && main.firstChild.getAttribute("data-keep")))) { paintNav(); return; }
  var y = window.scrollY, el;
  try { el = page(r); } catch (e) { console.error(e); el = notFound(tr("Something went wrong on this page.") + " " + e.message, "#/"); }
  main.innerHTML = ""; main.appendChild(el);
  paintNav();
  var tab = TABS.filter(function (t) { return t[0] === r.split("/")[0]; })[0];
  document.title = (tab && tab[0] ? tr(tab[1]) + " · " : "") + tr("GALIL HR");
  if (r === lastRoute) window.scrollTo(0, y); else { window.scrollTo(0, 0); lastRoute = r; }
}
function rerender() { render(false); }
/* other people's changes arrived */
function refresh() { if (main) render(true); }

function paintNav() {
  var nav = document.getElementById("tabs"), cur = route().split("/")[0];
  if (cur === "home") cur = "";
  var badges = { surveys: surveysWaiting().length, reviews: reviewTodo().length };
  nav.innerHTML = "";
  TABS.forEach(function (t) {
    nav.appendChild(h("a", { href: "#/" + t[0], class: "tab" + (cur === t[0] ? " on" : ""), "aria-current": cur === t[0] ? "page" : null, id: "tab-" + (t[0] || "home") },
      icon(t[2], 17), h("span", null, tr(t[1])), badges[t[0]] ? h("span", { class: "badge", "aria-label": tr("{n} waiting", { n: badges[t[0]] }) }, String(badges[t[0]])) : null));
  });
}
function paintSync() {
  var el = document.getElementById("sync"); if (!el) return;
  var st = Store.state, label = !REMOTE ? tr("Data: this browser (demo)")
    : st === "saving" ? tr("Saving…") : st === "loading" ? tr("Loading…") : st === "offline" ? tr("Offline — changes are kept and sent later")
    : st === "error" ? tr("Not saved: {m}", { m: Store.error }) : st === "token" ? tr("GitHub token needed") : tr("Saved to {w}", { w: Store.label() });
  el.className = "sync " + (REMOTE ? st : "local"); el.title = label; el.setAttribute("aria-label", label);
  el.innerHTML = ""; el.appendChild(icon("sync", 15)); el.appendChild(h("span", null, REMOTE ? (st === "saved" ? Store.label() : label) : tr("Demo")));
}

/* the GitHub data needs this device's access token (the same one WorkDesk and Taskana use) */
function tokenScreen() {
  var tok = input({ type: "password", id: "gh-token", placeholder: "github_pat_…", dir: "ltr", autocomplete: "off" });
  return h("div", { class: "reader" }, h("div", { class: "card post" },
    h("h1", null, tr("Connect HR to its data")),
    h("p", null, tr("HR keeps its data in {r} on GitHub. Paste the GitHub access token you use for WorkDesk and Taskana; it stays in this browser.", { r: CONFIG.github.owner + "/" + CONFIG.github.repo })),
    Store.error ? h("p", { class: "note err" }, Store.error) : null,
    field(tr("GitHub access token"), tok),
    h("div", { class: "form-f" }, btn(tr("Connect"), { kind: "primary", id: "gh-connect", onclick: function () { if (need(tok)) saveGithubToken(tok.value); } }))));
}

(function boot() {
  ME = GalilPortal.gate("hr");
  if (!ME) return;
  main = document.getElementById("main");
  /* top bar: who, language, theme */
  document.getElementById("who").innerHTML = "";
  document.getElementById("who").appendChild(h("span", null, tr("Signed in as"), " ", h("b", null, nameOf(ME)), isAdmin() ? h("span", { class: "chip pink sm" }, tr("HR admin")) : null));
  var lb = document.getElementById("langbtn"), he = LANG === "he";
  lb.textContent = he ? "English" : "עברית"; lb.lang = he ? "en" : "he"; lb.title = he ? "English — אנגלית" : "עברית — Hebrew";
  lb.addEventListener("click", function () { GalilPortal.setLang(he ? "en" : "he"); });
  var tb = document.getElementById("themebtn");
  var paintTheme = function () { var dark = GalilPortal.theme() === "dark"; tb.innerHTML = ""; tb.appendChild(icon(dark ? "sun" : "moon", 14)); tb.title = dark ? tr("Switch to the light theme") : tr("Switch to the dark theme"); tb.setAttribute("aria-label", tb.title); };
  tb.addEventListener("click", function () { GalilPortal.setTheme(GalilPortal.theme() === "dark" ? "light" : "dark"); paintTheme(); });
  paintTheme();
  document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = tr(el.getAttribute("data-t")); });
  document.querySelectorAll("[data-tip]").forEach(function (el) { el.title = tr(el.getAttribute("data-tip")); el.setAttribute("aria-label", el.title); });
  document.getElementById("app").hidden = false;
  main.appendChild(h("div", { class: "loading", role: "status" }, h("span", { class: "spinner", "aria-hidden": "true" }), tr("Loading…")));
  storeInit().then(function () {
    paintSync();
    if (Store.state === "token") { main.innerHTML = ""; main.appendChild(tokenScreen()); paintNav(); return; }
    window.addEventListener("hashchange", rerender);
    rerender();
  });
})();
