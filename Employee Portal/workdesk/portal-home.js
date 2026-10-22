"use strict";
/* =====================================================================
   GALIL Employee Portal — the home page.

   After signing in, everyone lands here: one tile per product — WorkDesk,
   Taskana, the Handbook, the Knowledge Base and Model Studio — opened according to the
   person's portal access (shared/portal.js). This file also holds the
   language switch, the portal-access editor used under Management →
   People, and the portal's own styles (including the right-to-left
   adjustments for Hebrew).
   ===================================================================== */

var PORTAL_CSS = [
/* Hebrew text in the same face family */
":root{--font:'Noto Sans','Noto Sans Hebrew','Segoe UI',Arial,sans-serif}",

/* ---- home ---- */
".hub{height:100%;overflow:auto;background:radial-gradient(1100px 520px at 85% -10%,rgba(240,138,36,.22),transparent 60%),var(--paper)}",
".hubtop{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:12px;padding:10px 22px;background:var(--chrome);color:var(--chrometx)}",
".hubtop .brand small{font-size:11px}",
".hubwrap{max-width:1180px;margin:0 auto;padding:28px 22px 40px;display:flex;flex-direction:column;gap:22px}",
".hello{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap}",
".hello h1{font:700 clamp(24px,3.2vw,34px)/1.15 var(--font);margin:0;letter-spacing:-.01em}",
".hello .cap{font-size:13.5px;margin-top:6px}",
".tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}",
".tile{position:relative;display:flex;flex-direction:column;gap:12px;padding:20px 20px 18px;border-radius:20px;background:var(--surface);border:1px solid var(--line);",
"box-shadow:0 1px 2px var(--shadow),0 10px 30px -18px var(--shadow2);text-decoration:none;color:var(--ink);cursor:pointer;text-align:start;font:inherit;min-height:250px;",
"transition:transform .2s,box-shadow .2s,border-color .2s}",
".tile:hover{transform:translateY(-3px);border-color:var(--tc,var(--deep));box-shadow:0 1px 2px var(--shadow),0 22px 40px -20px var(--shadow2)}",
".tile:focus-visible{outline:3px solid var(--tc,var(--deep));outline-offset:3px}",
".tile{overflow:hidden}",
".tile::before{content:'';position:absolute;inset:0 0 auto 0;height:5px;background:var(--tc,var(--green))}",
".tile .ticon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:var(--tbg,var(--wash));color:var(--tc,var(--deep));flex:0 0 auto}",
".tile .ticon svg{width:30px;height:30px}",
/* the Handbook's deep purple, lifted in the dark theme so it reads on the dark tile */
":root[data-theme=\"dark\"] #tile-handbook{--tc:#B48CE6!important;--tbg:rgba(180,140,230,.16)!important}",
/* Model Studio's yellow: a bright band, and a darker gold for the text so it reads on white */
"#tile-studio::before{background:#F5C400}",
":root[data-theme=\"dark\"] #tile-studio{--tc:#F5C84C!important;--tbg:rgba(245,200,76,.16)!important}",
".tile .tname{font:700 19px/1.2 var(--font)}",
".tile .tdesc{font-size:13.5px;color:var(--muted);line-height:1.5}",
".tile .tstats{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}",
".tile .tstats .chip{white-space:normal}",
".tile .tgo{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13.5px;color:var(--tc,var(--deep))}",
".tile.off{cursor:not-allowed;opacity:.62;filter:grayscale(.6)}",
".tile.off:hover{transform:none}",
".quick{display:flex;flex-wrap:wrap;gap:8px}",
".quick a,.quick button{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);",
"font:600 13px var(--font);text-decoration:none;cursor:pointer;min-height:38px}",
".quick a:hover,.quick button:hover{border-color:var(--deep);background:var(--wash)}",
".hubfoot{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:16px}",
".hubfoot a{color:var(--muted)}",
/* language switch */
".langsw{display:inline-flex;border:1px solid rgba(255,255,255,.25);border-radius:999px;overflow:hidden}",
".langsw button{border:0;background:transparent;color:var(--chromedim);font:700 12px var(--font);padding:6px 11px;cursor:pointer;min-height:32px}",
".langsw button.on{background:var(--green);color:var(--onlight)}",
".langsw.light{border-color:var(--line)}",
".langsw.light button{color:var(--muted)}",
".langsw.light button.on{color:var(--onlight)}",
/* portal-access chips in Management → People */
".iconbtn.who{display:flex;align-items:center}",
".acc{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center}",
".acc .chip{font-size:11px;padding:1px 7px}",
".hubwrap{padding-left:max(22px,env(safe-area-inset-left));padding-right:max(22px,env(safe-area-inset-right));padding-bottom:calc(40px + env(safe-area-inset-bottom))}",
"@media(max-width:680px){.hubwrap{padding:18px max(16px,env(safe-area-inset-right)) calc(70px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}.hubtop{padding:max(8px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left))}.tile{min-height:0}.hubtop .brand small{display:none}}"
].join("\n");

/* Hebrew: the layout mirrors. Most of the stylesheet already lays out with flex and
   grid, which follow the document direction; these rules flip what is drawn with
   physical left / right. */
var RTL_CSS = [
"[dir=rtl] body{font-family:var(--font)}",
"[dir=rtl] .tbl th{text-align:right;border-right:0;border-left:1px solid rgba(255,255,255,.18)}",
"[dir=rtl] .tbl td{border-right:0;border-left:1px solid var(--line)}",
"[dir=rtl] .tbl th:last-child,[dir=rtl] .tbl td:last-child{border-left:0}",
"[dir=rtl] .tbl th:first-child{border-radius:0 10px 0 0}",
"[dir=rtl] .tbl th:last-child{border-radius:10px 0 0 0}",
"[dir=rtl] .tbl tbody tr:last-child td:first-child{border-radius:0 0 10px 0}",
"[dir=rtl] .tbl tbody tr:last-child td:last-child{border-radius:0 0 0 10px}",
"[dir=rtl] .tbl .num{text-align:left}",
"[dir=rtl] .tbl .hrs,[dir=rtl] .tbl th.hrs{text-align:right}",
"[dir=rtl] .tbl th .sa{margin-left:0;margin-right:5px}",
"[dir=rtl] .tbl th .rz{right:auto;left:0}",
"[dir=rtl] .tbl th.dragover{box-shadow:inset -3px 0 0 var(--green)}",
"[dir=rtl] .tbl tr.pend td:first-child{box-shadow:inset -3px 0 0 var(--amber)}",
"[dir=rtl] .tbl tr.canc td:first-child{box-shadow:inset -3px 0 0 var(--err)}",
"[dir=rtl] select{background-position:left 9px center}",
"[dir=rtl] .fld select{padding-right:9px;padding-left:28px}",
"[dir=rtl] .minisel{padding:4px 8px 4px 24px;background-position:left 7px center}",
"[dir=rtl] .timefld select{padding:7px 8px 7px 18px;background-position:left 5px center}",
"[dir=rtl] .miniinp{text-align:left}",
"[dir=rtl] input[type=file]::file-selector-button{margin-right:0;margin-left:10px}",
"[dir=rtl] .seg button+button{border-left:0;border-right:1px solid var(--line)}",
"[dir=rtl] .pk{padding:3px 4px 3px 11px}",
"[dir=rtl] .pk.plain{padding-left:11px;padding-right:11px}",
"[dir=rtl] .tab{border-radius:10px 10px 0 0}",
"[dir=rtl] .tbg .tbl-l{margin-right:0;margin-left:2px}",
"[dir=rtl] .copy,[dir=rtl] .msacc,[dir=rtl] .ms-opt,[dir=rtl] .pop button{text-align:right}",
"[dir=rtl] .pop{right:auto;left:0}",
"[dir=rtl] .pcard{border-left:0;border-right:3px solid var(--teal)}",
"[dir=rtl] .pill .badge{margin-left:0;margin-right:5px}",
"[dir=rtl] .att{padding:2px 10px 2px 4px}",
"[dir=rtl] .mnav .badge{right:auto;left:calc(50% - 20px)}",
"[dir=rtl] .he{text-align:right}",
/* numbers, codes, emails and times keep their own left-to-right order */
/* times, dates and figures read left to right; a phrase that starts in Hebrew stays right to left */
"[dir=rtl] .tnum,[dir=rtl] .mono,[dir=rtl] td.num{unicode-bidi:plaintext}",
"[dir=rtl] input[type=number],[dir=rtl] input[type=date],[dir=rtl] input[type=month],[dir=rtl] input[type=time]{unicode-bidi:isolate}",
"[dir=rtl] input[type=email],[dir=rtl] input[type=password]{direction:ltr;text-align:right}",
"[dir=rtl] .ltr{direction:ltr;unicode-bidi:isolate}"
].join("\n");

/* ---------- small pieces ---------- */
function LangSwitch(p) {
  var cur = WDI18N.lang;
  return h("div", { className: "langsw" + (p.light ? " light" : ""), role: "group", "aria-label": "Language" },
    [["en", "EN"], ["he", "עב"]].map(function (o) {
      return h("button", {
        key: o[0], type: "button", className: cur === o[0] ? "on" : "", lang: o[0], "aria-pressed": cur === o[0] ? "true" : "false",
        title: o[0] === "he" ? "עברית" : "English",
        onClick: function () { if (cur !== o[0]) GalilPortal.setLang(o[0]); }
      }, o[1]);
    }));
}

var APP_GLYPHS = {
  workdesk: [["circle", { cx: 12, cy: 10, r: 6.5 }], ["path", { d: "M12 6.8V10l2.4 1.6" }], ["path", { d: "M4 20c2.3-2.2 4.7-2.2 8 0s5.7 2.2 8 0" }]],
  taskana: [["rect", { x: 3.5, y: 4, width: 5, height: 15, rx: 1.5 }], ["rect", { x: 10, y: 4, width: 5, height: 10, rx: 1.5 }], ["rect", { x: 16.5, y: 4, width: 4, height: 7, rx: 1.5 }], ["path", { d: "M11.2 17.5l1.6 1.6 3.2-3.4" }]],
  handbook: [["path", { d: "M4 4.5h6a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H4z" }], ["path", { d: "M20 4.5h-4.5A2.5 2.5 0 0 0 13 7v13a2.5 2.5 0 0 1 2.5-2.5H20z" }], ["path", { d: "M6.5 8.5h3.5M6.5 11.5h3.5" }]],
  kb: [["path", { d: "M9 18h6M10 21h4" }], ["path", { d: "M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" }], ["path", { d: "M12 7v3.5M10.4 9h3.2" }]],
  studio: [["path", { d: "M12 2.8l8 4.5v9.4l-8 4.5-8-4.5V7.3z" }], ["path", { d: "M4 7.3l8 4.5 8-4.5M12 11.8v9.4" }]],
  install: [["rect", { x: 7, y: 2.5, width: 10, height: 19, rx: 2.5 }], ["path", { d: "M12 7v7M9.3 11.5L12 14.2l2.7-2.7M10.5 18.5h3" }]]
};
function AppGlyph(p) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: p.style },
    (APP_GLYPHS[p.kind] || []).map(function (g, i) { return h(g[0], Object.assign({ key: i }, g[1])); }));
}

/* the person's name in the interface language */
function displayName(u) { return u ? (WDI18N.he && u.fullNameHe ? u.fullNameHe : u.fullName) : ""; }
function firstName(u) { return displayName(u).split(/\s+/)[0] || ""; }

/* registered hours this week (Sunday to today) */
function weekHours(db, userId) {
  var d = new Date(); d.setDate(d.getDate() - d.getDay());
  var from = d2s(d);
  return db.entries.filter(function (e) { return e.assignee === userId && e.date >= from && (e.status === "registered" || e.status === "locked"); })
    .reduce(function (a, e) { return a + (Number(e.red) || 0) + (Number(e.yellow) || 0) + (Number(e.blue) || 0); }, 0);
}
/* what Taskana last stored in this browser, seen from this person */
function taskanaSummary(user) {
  var t = GalilPortal.taskana(); if (!t) return null;
  var me = (t.users || []).filter(function (u) { return u.id === user.id || (u.email || "").toLowerCase() === (user.email || "").toLowerCase(); })[0];
  if (!me) return { open: 0, overdue: 0, review: 0 };
  var today = todayStr(), open = 0, overdue = 0, review = 0;
  (t.tasks || []).forEach(function (k) {
    if (k.assigneeId !== me.id || k.status === "Done") return;
    open++; if (k.dueDate && k.dueDate < today) overdue++;
    if (k.status === "Peer Review" || k.status === "SME Review") review++;
  });
  return { open: open, overdue: overdue, review: review };
}

/* ---------- the home page ---------- */
function PortalHome(p) {
  var db = p.db, user = p.user, acc = GalilPortal.access(user);
  var hour = new Date().getHours();
  var greet = hour < 12 ? "Good morning, {name}" : hour < 18 ? "Good afternoon, {name}" : "Good evening, {name}";
  var wk = weekHours(db, user.id);
  var myPending = db.entries.filter(function (e) { return e.assignee === user.id && e.status === "pending"; }).length;
  var tk = acc.taskana !== "none" ? taskanaSummary(user) : null;
  var go = function (href) { return function () { location.href = href; }; };

  var tiles = [
    {
      k: "workdesk", name: "WorkDesk", on: acc.workdesk, color: "#B5600E", bg: "rgba(240,138,36,.16)",
      desc: "Report work, sick and vacation time and expenses. Managers follow budgets against recorded hours and run clients, projects and work orders.",
      stats: [h(Chip, { key: "w", k: "gr" }, tr("{n} h this week", { n: num(wk) })),
        p.approvals ? h(Chip, { key: "a", k: "amber" }, tr("{n} waiting for your approval", { n: p.approvals })) : null,
        myPending ? h(Chip, { key: "p", k: "mut" }, tr("{n} of your entries in approval", { n: myPending })) : null],
      open: function () { p.onOpen("time"); }
    },
    {
      k: "taskana", name: "Taskana", on: acc.taskana !== "none", color: "#2F7FD0", bg: "rgba(59,125,216,.13)",
      desc: "Tasks, boards and reviews for every client project. People, clients, projects and work orders come straight from WorkDesk.",
      stats: acc.taskana === "none" ? [] : [h(Chip, { key: "r", k: "blue" }, tr(acc.taskana)),
        tk ? h(Chip, { key: "o", k: "gr" }, tr("{n} open tasks", { n: tk.open })) : h(Chip, { key: "o", k: "mut" }, "Open Taskana to see your tasks"),
        tk && tk.overdue ? h(Chip, { key: "d", k: "err" }, tr("{n} overdue", { n: tk.overdue })) : null,
        tk && tk.review ? h(Chip, { key: "v", k: "teal" }, tr("{n} in review", { n: tk.review })) : null],
      open: go("taskana/index.html")
    },
    {
      k: "handbook", name: "Handbook", on: acc.handbook, color: "#5B2A86", bg: "rgba(91,42,134,.13)",
      desc: "Step-by-step guides to the Employee Portal, WorkDesk and Taskana — what each role does, screen by screen.",
      stats: [h(Chip, { key: "c", k: "mut" }, "WorkDesk · Taskana · Portal")],
      open: go("handbook/index.html")
    },
    {
      k: "kb", name: "Knowledge Base", on: acc.kb, color: "#1F7F72", bg: "rgba(23,163,184,.14)",
      desc: "Onboarding, company rules and policies, security and training how-to's for every GALIL employee.",
      stats: [h(Chip, { key: "c", k: "mut" }, "Onboarding · Rules · Training")],
      open: go("kb/index.html")
    },
    {
      k: "studio", name: "Model Studio", on: acc.studio, desktopOnly: true, color: "#946C00", bg: "rgba(245,196,0,.24)",
      desc: "Open CAD and 3D models, write assembly and disassembly procedures, animate them, build illustrated parts catalogues and publish interactive manuals.",
      stats: [h(Chip, { key: "c", k: "mut" }, "STEP · IGES · glTF · OBJ · STL"), h(Chip, { key: "p", k: "amber" }, "Procedures · IPC · IETM")],
      open: go("studio/index.html")
    }
  ];

  return h("div", { className: "hub" },
    h("div", { className: "hubtop" },
      h("div", { className: "brand" }, h(Mark, null), h("div", null, "GALIL", h("small", null, tr("Employee Portal"))),
        WDCloud.remote ? h("span", { className: "syncdock", ref: dockSync }) : null),
      h("div", { className: "spacer" }),
      h(LangSwitch, null),
      h("button", {
        className: "iconbtn", onClick: function () { p.setTheme(p.theme === "dark" ? "light" : "dark"); },
        title: p.theme === "dark" ? "Switch to the light theme" : "Switch to the dark theme",
        "aria-label": p.theme === "dark" ? "Switch to the light theme" : "Switch to the dark theme"
      }, h(Icon, { n: p.theme === "dark" ? "sun" : "moon" })),
      h("button", { className: "who iconbtn", style: { minWidth: 0, padding: "0 8px", gap: 9 }, onClick: p.onProfile, title: "My profile" },
        h("span", { className: "avatar", style: user.photoUrl ? { backgroundImage: "url(" + user.photoUrl + ")", backgroundSize: "cover" } : null }, user.photoUrl ? "" : initialsOf(user.fullName)),
        h("span", { className: "nm col", style: { alignItems: "center", gap: 0 } },
          h("span", { style: { fontWeight: 600 } }, displayName(user)),
          h("span", { className: "rolechip" }, roleName(user.role))))),

    h("main", { className: "hubwrap", id: "portal-home" },
      h("div", { className: "hello" },
        h("div", null,
          h("h1", null, tr(greet, { name: firstName(user) })),
          h("div", { className: "cap" }, ilLong(todayStr()), " · ", "Where would you like to start?")),
        h(Btn, { kind: "t", onClick: p.onSignOut }, "Sign out")),

      /* birthday reminders: colleagues' birthdays this week (people may keep theirs private) */
      h(BirthdayBanner, { db: db, days: 7, id: "home-birthdays", title: "Birthdays this week", mb: 0 }),

      /* Model Studio is for computers: no tile on phones and tablets */
      h("div", { className: "tiles", role: "list" }, tiles.filter(function (t) { return !(t.desktopOnly && GalilPortal.isMobileDevice()); }).map(function (t) {
        return h("button", {
          key: t.k, type: "button", role: "listitem", id: "tile-" + t.k, className: "tile" + (t.on ? "" : " off"),
          style: { "--tc": t.color, "--tbg": t.bg }, "aria-disabled": t.on ? null : "true",
          onClick: function () { if (t.on) t.open(); else toast("Your account doesn't include {app}. Ask an Operations Manager or the CEO.".replace("{app}", t.name), ""); }
        },
          h("div", { className: "row", style: { gap: 12, flexWrap: "nowrap" } },
            h("span", { className: "ticon" }, h(AppGlyph, { kind: t.k })),
            h("div", { className: "tname" }, t.name)),
          h("div", { className: "tdesc" }, t.desc),
          h("div", { className: "tstats" }, t.on ? t.stats : h(Chip, { k: "mut" }, h(Icon, { n: "lock", size: 12, style: { display: "inline-block", verticalAlign: "-1px", marginInlineEnd: 4 } }), "No access")),
          t.on ? h("span", { className: "tgo" }, tr("Open {app}", { app: tr(t.name) }), h("span", { "aria-hidden": "true" }, WDI18N.he ? "←" : "→")) : null);
      })),

      h("div", { className: "quick", "aria-label": "Shortcuts" },
        acc.workdesk && can(user, "reportOwnTime") ? h("button", { type: "button", onClick: function () { p.onOpen("time"); } }, h(Icon, { n: "timer", size: 16 }), "Report time") : null,
        acc.workdesk && can(user, "reportOwnTime") ? h("button", { type: "button", onClick: function () { p.onOpen("time"); } }, h(Icon, { n: "leave", size: 16 }), "Request sick or vacation days") : null,
        acc.workdesk && (can(user, "reportExpenses") || can(user, "approveExpenses")) ? h("button", { type: "button", onClick: function () { p.onOpen("expenses"); } }, h(Icon, { n: "receipt", size: 16 }), "Expenses") : null,
        acc.workdesk && p.approvals ? h("button", { type: "button", onClick: function () { p.onOpen("approvals"); } }, h(Icon, { n: "approve", size: 16 }), "Approvals") : null,
        acc.taskana !== "none" ? h("a", { href: "taskana/index.html#/my" }, h(Icon, { n: "tasks", size: 16 }), "My tasks") : null,
        h("a", { href: "install/index.html" }, h(AppGlyph, { kind: "install", style: { width: 16, height: 16 } }), "Install on your phone")),

      h("div", { className: "hubfoot" },
        h("span", null, "GALIL Employee Portal · WorkDesk · Taskana · Handbook · Knowledge Base · Model Studio"),
        h("span", null, WDCloud.remote ? (WDCloud.storage === "github" ? "Data: GitHub" : "Data: OneDrive") : "Data: this browser (demo)"))));
}

/* ---------- Management → People: portal access ---------- */
function AccessChips(p) {
  var a = GalilPortal.access(p.user);
  return h("span", { className: "acc" },
    a.workdesk ? h(Chip, { k: "gr", title: "WorkDesk" }, "WorkDesk") : null,
    a.taskana !== "none" ? h(Chip, { k: "blue", title: "Taskana" }, "Taskana · ", tr(a.taskana)) : null,
    a.handbook ? h(Chip, { k: "mut", title: "Handbook" }, "Handbook") : null,
    a.kb ? h(Chip, { k: "teal", title: "Knowledge Base" }, "KB") : null,
    a.studio ? h(Chip, { k: "amber", title: "Model Studio" }, "Studio") : null,
    !a.workdesk && a.taskana === "none" && !a.handbook && !a.kb && !a.studio ? h("span", { className: "cap" }, "No access") : null);
}
function AccessModal(p) {
  var person = p.person, cur = GalilPortal.access(Object.assign({}, person, { isActive: true, pendingActivation: false }));
  var def = GalilPortal.defaultAccess(person.role);
  var s = useState(cur), f = s[0], set = s[1];
  var up = function (k, v) { var n = Object.assign({}, f); n[k] = v; set(n); };
  var check = function (k, label, hint) {
    return h("label", { className: "panel pad row", style: { gap: 10, cursor: "pointer", alignItems: "flex-start" } },
      h("input", { type: "checkbox", checked: !!f[k], onChange: function (e) { up(k, e.target.checked); }, style: { marginTop: 3 } }),
      h("div", { className: "grow col", style: { gap: 2 } }, h("b", null, label), h("span", { className: "cap" }, hint)));
  };
  function save() {
    var same = f.workdesk === def.workdesk && f.taskana === def.taskana && f.handbook === def.handbook && f.kb === def.kb && f.studio === def.studio;
    p.mutate(function (d) {
      var t = byId(d.users, person.id); if (!t) return;
      var before = t.access || null;
      if (same) delete t.access; else t.access = { workdesk: f.workdesk, taskana: f.taskana, handbook: f.handbook, kb: f.kb, studio: f.studio };
      audit(d, p.user.id, "Portal access changed for " + t.fullName, "users", t.id, before, t.access || null);
    });
    toast("Portal access saved.", "ok");
    p.onClose();
  }
  return h(Modal, { title: tr("Portal access — {name}", { name: displayName(person) }), size: "sm", onClose: p.onClose,
    footer: [
      h(Btn, { key: "r", kind: "t", onClick: function () { set(def); } }, "Use the role defaults"),
      h("div", { key: "g", className: "grow" }),
      h(Btn, { key: "c", onClick: p.onClose }, "Cancel"),
      h(Btn, { key: "s", kind: "p", onClick: save }, "Save")] },
    h("div", { className: "col", style: { gap: 9 } },
      h("div", { className: "cap" }, tr("What {name} can open from the Employee Portal home page. Without a choice here, access follows the WorkDesk role ({role}).", { name: firstName(person), role: tr(roleName(person.role)) })),
      check("workdesk", "WorkDesk", "Time, sick and vacation reporting, expenses — and, by WorkDesk role, budgets, clients, projects and approvals."),
      h("div", { className: "panel pad col", style: { gap: 6 } },
        h("b", null, "Taskana"),
        h("span", { className: "cap" }, "Tasks and boards. The Taskana role decides what the person may change there."),
        h(Sel, {
          label: "Taskana role", id: "acc-taskana", value: f.taskana,
          options: [{ value: "none", label: "No access" }].concat(GalilPortal.TASKANA_ROLES.map(function (r) { return { value: r, label: r }; })),
          onChange: function (e) { up("taskana", e.target.value); }
        }),
        h("div", { className: "cap" }, "Admin: everything · Manager: any task, project settings · Member: tasks · External: only their own tasks · Viewer: read and comment.")),
      check("handbook", "Handbook", "The user guide to the portal, WorkDesk and Taskana."),
      check("kb", "Knowledge Base", "Onboarding, company rules and training material."),
      check("studio", "Model Studio", "CAD and 3D models: procedures, animations, illustrated parts catalogues and interactive manuals."),
      h("div", { className: "cap" }, tr("Role defaults for {role}: WorkDesk {wd} · Taskana {tk} · Handbook {hb} · Knowledge Base {kb} · Model Studio {ms}.", {
        role: tr(roleName(person.role)), wd: tr(def.workdesk ? "yes" : "no"), tk: tr(def.taskana), hb: tr(def.handbook ? "yes" : "no"), kb: tr(def.kb ? "yes" : "no"), ms: tr(def.studio ? "yes" : "no")
      }))));
}
