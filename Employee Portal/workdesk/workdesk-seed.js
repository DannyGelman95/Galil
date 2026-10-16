/* =====================================================================
   GALIL WorkDesk — the real GALIL team and the demo-data generator.
   Loaded after the app's main script: seed() here replaces the old
   fictional seed. seed(false) is the team only; seed() / seed(true) adds
   random demo work (clients, projects, work orders, budgets, tasks, time
   entries, plans, expenses, notes, approvals). Every demo record carries
   demo: true so removeDemo() can take it out without touching real work.
   ===================================================================== */
"use strict";

/* id, full name, Hebrew name, email, role, job title, department, team, reports to */
var WD_TEAM = [
  ["u-tamir",    "Tamir Nisman",    "תמיר ניסמן",     "tamir@galiltc.co.il",         "CEO", "CEO",                                          "Management",       null,         null],
  ["u-inon",     "Inon Kanner",     "ינון כנר",       "inon.kanner@galiltc.co.il",   "OPS", "Deputy CEO, Operations · Head of the Defense Division", "Management", null,     "u-tamir"],
  ["u-kfir",     "Kfir Hodara",     "כפיר חודרה",     "kfir@galiltc.co.il",          "PM",  "Client Manager",                               "Civil Division",   "team-kfir",  "u-inon"],
  ["u-dennis",   "Dennis Sablin",   "דניס סבלין",     "dennis.sablin@galiltc.co.il", "EMP", "Technical Writer",                             "Civil Division",   "team-kfir",  "u-kfir"],
  ["u-shoshana", "Shoshana Axtell", "שושנה אקסל",     "shoshana.a@galiltc.co.il",    "EMP", "Technical Writer",                             "Civil Division",   "team-kfir",  "u-kfir"],
  ["u-suzanne",  "Suzanne Musin",   "סוזאן מוסין",    "suzanne.m@galiltc.co.il",     "EMP", "Technical Writer",                             "Civil Division",   "team-kfir",  "u-kfir"],
  ["u-ranit",    "Ranit Schnall",   "רנית שנאל",      "ranit@galiltc.co.il",         "PM",  "Client Manager",                               "Civil Division",   "team-ranit", "u-inon"],
  ["u-inbar",    "Inbar Azulay",    "ענבר אזולאי",    "inbar@galiltc.co.il",         "EMP", "Technical Writer",                             "Civil Division",   "team-ranit", "u-ranit"],
  ["u-paul",     "Paul Schnall",    "פול שנאל",       "paul@galiltc.co.il",          "EMP", "Technical Writer",                             "Civil Division",   "team-ranit", "u-ranit"],
  ["u-jeremie",  "Jeremie De Bock", "ג'רמי דה-בוק",   "jeremie@galiltc.co.il",       "EMP", "Technical Writer",                             "Civil Division",   "team-ranit", "u-ranit"],
  ["u-reuben",   "Reuben Politi",   "ראובן פוליטי",   "reuben@galiltc.co.il",        "PM",  "Client Manager",                               "Civil Division",   "team-reuben","u-inon"],
  ["u-amy",      "Amy di Nardo",    "איימי די נרדו",  "amy@galiltc.co.il",           "EMP", "Technical Writer",                             "Civil Division",   "team-reuben","u-reuben"],
  ["u-niv",      "Niv Passy",       "ניב פסי",        "niv.passy@galiltc.co.il",     "PM",  "Client Manager",                               "Civil Division",   "team-niv",   "u-inon"],
  ["u-penina",   "Penina Smith",    "פנינה סמית'",    "penina@galiltc.co.il",        "EMP", "Technical Writer",                             "Civil Division",   "team-niv",   "u-niv"],
  ["u-yosi",     "Yosi Francos",    "יוסי פרנקוס",    "yosi.f@galiltc.co.il",        "EMP", "Technical Writer",                             "Civil Division",   "team-niv",   "u-niv"],
  ["u-danny",    "Danny Gelman",    "דני גלמן",       "danny.gelman@galiltc.co.il",  "PM",  "Defense Sector Project Manager",               "Defense Division", "team-def",   "u-inon"],
  ["u-eitan",    "Eitan Fisch",     "איתן פיש",       "eitan.f@galiltc.co.il",       "EMP", "Technical Writer",                             "Defense Division", "team-def",   "u-danny"],
  ["u-daniel",   "Daniel Barak",    "דניאל ברק",      "daniel.barak@galiltc.co.il",  "EMP", "Technical Writer",                             "Defense Division", "team-def",   "u-danny"],
  ["u-gil",      "Gil Hadar",       "גיל הדר",        "gil.hadar@galiltc.co.il",     "EXT", "Engineer (outsourced)",                        "Engineering",      null,         "u-inon"],
  ["u-ofir",     "Ofir Abutbul",    "אופיר אבוטבול",  "ofir.abutbul@galiltc.co.il",  "EXT", "Engineer (outsourced)",                        "Engineering",      null,         "u-inon"],
  ["u-ronen",    "Ronen Nachum",    "רונן נחום",      "ronen.nachum@galiltc.co.il",  "EXT", "Engineer (outsourced)",                        "Engineering",      null,         "u-inon"],
  ["u-office",   "Galil TC Office", "משרד גליל",      "office@galiltc.co.il",        "EMP", "Office management, administration & HR",       "Office & HR",      null,         "u-tamir"]
];
var WD_TEAMS = [
  ["team-kfir",   "Civil — Kfir Hodara",   "u-kfir",   "Civil Division",   "#5C8B22", "CKH"],
  ["team-ranit",  "Civil — Ranit Schnall", "u-ranit",  "Civil Division",   "#3B7DD8", "CRS"],
  ["team-reuben", "Civil — Reuben Politi", "u-reuben", "Civil Division",   "#B0661C", "CRP"],
  ["team-niv",    "Civil — Niv Passy",     "u-niv",    "Civil Division",   "#6250D6", "CNP"],
  ["team-def",    "Defense",               "u-danny",  "Defense Division", "#1F7F72", "DEF"]
];

function wdTeamUsers() {
  return WD_TEAM.map(function (r) {
    var u = mkUser(r[0], r[1], r[2], r[4], r[5], r[6], r[7], r[8], true);
    u.email = r[3];
    u.employmentType = r[4] === "EXT" ? "contractor" : "full-time";
    u.startDate = "2024-01-01";
    return u;
  });
}
function wdBase() {
  var db = emptyDB();
  db.users = wdTeamUsers();
  db.teams = WD_TEAMS.map(function (t) {
    return { id: t[0], name: t[1], leadUserId: t[2], department: t[3], color: t[4], code: t[5], description: "", contact: "", location: "", clientIds: [] };
  });
  db.clients = [{ id: "c-gal", name: "GALIL (internal)", initials: "GAL", isInternal: true, contactName: "", contactEmail: "", notes: "Red hours", isVerified: true }];
  db.projects = [
    { id: "p-int1", clientId: "c-gal", name: "Internal — Administration", status: "Active", ownerUserId: "u-inon", startDate: "2024-01-01", endDate: null, isWoTracked: false, notes: "", isVerified: true },
    { id: "p-int2", clientId: "c-gal", name: "Internal — Business Development", status: "Active", ownerUserId: "u-tamir", startDate: "2024-01-01", endDate: null, isWoTracked: false, notes: "", isVerified: true },
    { id: "p-int3", clientId: "c-gal", name: "Internal — Recruiting & HR", status: "Active", ownerUserId: "u-tamir", startDate: "2024-01-01", endDate: null, isWoTracked: false, notes: "", isVerified: true }
  ];
  db.expenseTypes = [
    { id: "et-1", name: "Meal", requiresEvidence: true, ceiling: 120 },
    { id: "et-2", name: "Travel — fuel", requiresEvidence: false, ceiling: 400 },
    { id: "et-3", name: "Travel — public", requiresEvidence: false, ceiling: 200 },
    { id: "et-4", name: "Parking", requiresEvidence: false, ceiling: 80 },
    { id: "et-5", name: "Accommodation", requiresEvidence: true, ceiling: 700 },
    { id: "et-6", name: "Software / tools", requiresEvidence: true, ceiling: 300 },
    { id: "et-7", name: "Other", requiresEvidence: true, ceiling: 100 }
  ];
  db.settings = { dailySoftLimit: 9, dailyHardLimit: 12, weeklyHours: 42, closedMonths: [], language: "en" };
  db.audit = [{ id: uid("au"), actorId: "system", action: "GALIL team created", entityTable: "-", entityId: "-", before: null, after: null, ip: "local", userAgent: (navigator.userAgent || "").slice(0, 80), at: nowISO() }];
  return db;
}
function seed(withDemo) {
  var db = wdBase();
  if (withDemo !== false) addDemo(db);
  return db;
}

var WD_DEMO_KEYS = ["clients", "projects", "workOrders", "budgets", "tasks", "taskAssignees", "assignments", "entries", "planned", "expenses", "attachments", "library", "approvals", "teamRequests"];
function hasDemo(db) { return WD_DEMO_KEYS.some(function (k) { return (db[k] || []).some(function (x) { return x.demo; }); }); }
function removeDemo(db) {
  WD_DEMO_KEYS.forEach(function (k) { db[k] = (db[k] || []).filter(function (x) { return !x.demo; }); });
  /* a real record that pointed at demo work keeps working without it */
  db.teams.forEach(function (t) { t.clientIds = (t.clientIds || []).filter(function (c) { return byId(db.clients, c); }); });
  return db;
}

/* Adds a fresh, random set of demo work for the team (any earlier demo work is replaced). */
function addDemo(db) {
  removeDemo(db);
  var rnd = Math.random;
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var between = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
  var T = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d2s(d); };
  var active = db.users.filter(function (u) { return u.isActive; });
  var spare = 0;
  var who = function (id) { var u = byId(db.users, id); if (u && u.isActive) return id; return active.length ? active[spare++ % active.length].id : null; };
  var D = function (o) { o.demo = true; return o; };

  var clients = [
    ["c-iai", "IAI", "IAI", "Ilan Barak", "ilan@iai.example"],
    ["c-elb", "Elbit Systems", "ELB", "Rita Gold", "rita@elbit.example"],
    ["c-mob", "Mobileye", "MOB", "Sagi Peer", "sagi@mobileye.example"],
    ["c-cmd", "Carmel Medical Devices", "CMD", "Hila Mor", "hila@carmel-med.example"],
    ["c-gws", "Galilee Water Systems", "GWS", "Omer Tal", "omer@galilee-water.example"],
    ["c-hft", "Haifa FinTech", "HFT", "Lior Ben-David", "lior@haifa-fintech.example"]
  ];
  clients.forEach(function (c) {
    if (!byId(db.clients, c[0])) db.clients.push(D({ id: c[0], name: c[1], initials: c[2], isInternal: false, contactName: c[3], contactEmail: c[4], notes: "", isVerified: true }));
  });
  /* project id, client, name, status, owner (manager), team, WO code prefix, budget basis, writers */
  var P = [
    ["p-iai1", "c-iai", "Radar Suite — Operator Manual", "Active", "u-danny", "team-def", "WO-IAI-0041", "Money", ["u-eitan", "u-daniel"], ["Vol 1 Ch 3 — Track modes", "Vol 1 Ch 4 — Display console", "Vol 2 — Maintenance procedures", "Illustration pass — chapter 3", "Peer review — chapter 2"]],
    ["p-elb1", "c-elb", "Avionics Help System", "WIP", "u-danny", "team-def", "WO-ELB-0007", "Hours", ["u-eitan", "u-daniel", "u-gil"], ["Help topic migration — batch 2", "Fix broken cross-references", "Release 5 publish", "SME review — radio panel"]],
    ["p-mob1", "c-mob", "SDK Documentation Refresh", "Active", "u-kfir", "team-kfir", "WO-MOB-0011", "Words", ["u-dennis", "u-shoshana", "u-suzanne"], ["API reference — endpoints A–F", "API reference — endpoints G–M", "Getting-started guide rewrite", "Code sample review"]],
    ["p-cmd1", "c-cmd", "Infusion Pump — IFU & Service Manual", "Active", "u-ranit", "team-ranit", "WO-CMD-0003", "Pages", ["u-inbar", "u-paul", "u-jeremie", "u-ronen"], ["IFU — setup and alarms", "IFU — cleaning", "Service manual — calibration", "Regulatory review fixes"]],
    ["p-gws1", "c-gws", "Irrigation Controller — User Guide", "Pending Review", "u-reuben", "team-reuben", "WO-GWS-0002", "Hours", ["u-amy", "u-ofir"], ["Quick start", "Chapter 2 — programs", "Troubleshooting chapter", "Spanish localisation hand-off"]],
    ["p-hft1", "c-hft", "Banking App — Online Help", "Active", "u-niv", "team-niv", "WO-HFT-0005", "Money", ["u-penina", "u-yosi"], ["Payments topics", "Cards topics", "Loans topics", "Legal review of fee wording"]]
  ];
  var DESCS = ["Drafting", "Source review with the SME", "Screenshots and figures", "Peer review comments", "Style-guide pass", "Client call and follow-up", "Reworking review feedback", "Publishing build"];
  var TASK_ST = ["To do", "In progress", "In progress", "In review", "Blocked", "Done"];
  P.forEach(function (r) {
    var pid = r[0], cid = r[1], owner = who(r[4]), writers = r[8].map(who).filter(Boolean);
    var team = byId(db.teams, r[5]); if (team && (team.clientIds || []).indexOf(cid) < 0) team.clientIds = (team.clientIds || []).concat([cid]);
    db.projects.push(D({ id: pid, clientId: cid, name: r[2], status: r[3], ownerUserId: owner, startDate: T(-between(60, 200)), endDate: T(between(30, 150)), isWoTracked: true, notes: "", isVerified: true }));
    var woIds = [];
    for (var w = 0; w < 2; w++) {
      var wid = pid + "-w" + (w + 1);
      woIds.push(wid);
      db.workOrders.push(D({ id: wid, projectId: pid, code: r[6] + (w + 1) + between(10, 99), title: w ? "Phase 2 — update" : "Phase 1 — main deliverable", status: "Active", contractRef: "PO-" + between(80000, 89999), startDate: T(-between(40, 120)), endDate: T(between(20, 120)), notes: "" }));
      var hrs = between(200, 600), basis = w ? "Hours" : r[7];
      db.budgets.push(D({ id: "b-" + wid, clientId: cid, projectId: pid, workOrderId: wid, basis: basis, currency: "₪",
        amount: basis === "Money" ? hrs * 300 : null, rate: basis === "Money" ? 300 : null, hours: hrs,
        units: basis === "Pages" ? between(250, 500) : basis === "Words" ? between(40000, 80000) : null,
        unitName: basis === "Pages" ? "pages" : basis === "Words" ? "words" : "", notes: "", history: [],
        produced: basis === "Pages" ? between(60, 200) : basis === "Words" ? between(8000, 30000) : undefined }));
    }
    writers.concat([owner]).forEach(function (u, i) {
      db.assignments.push(D({ id: uid("a"), userId: u, projectId: pid, workOrderId: u === owner ? null : woIds[i % 2], allowanceHours: u === owner ? null : between(40, 160), grantedBy: owner, grantedAt: nowISO() }));
    });
    r[9].forEach(function (title, i) {
      var st = pick(TASK_ST), tid = pid + "-t" + (i + 1), start = between(-30, 5);
      db.tasks.push(D({ id: tid, projectId: pid, workOrderId: woIds[i % 2], title: title, description: "", status: st, priority: pick(["Low", "Normal", "Normal", "High", "Critical"]),
        allowanceHours: between(8, 40), startDate: T(start), dueDate: T(start + between(7, 30)), parentTaskId: null, dependencies: [], comments: [], attachments: [] }));
      db.taskAssignees.push(D({ id: uid("ta"), taskId: tid, userId: writers[i % writers.length], allowanceHours: between(8, 40) }));
    });
    r.push(woIds);
  });

  /* time entries for the last 40 days — registered, as if migrated */
  var mk = function (o) {
    return D({ id: uid("e"), date: o.d, type: o.type || "Work", start: o.s || "", end: o.e || "", red: o.red || 0, yellow: o.yellow || 0, blue: o.blue || 0, day: o.day || 0,
      assignee: o.u, clientId: o.c || null, projectId: o.p || null, workOrderId: o.w || null, taskId: o.t || null, client: "", project: "", workOrder: "", task: "",
      projectStatus: "", description: o.desc || "", notes: "", status: "registered", statusReason: "", submittedAt: null, approvedBy: null, approvedAt: null, decisionNote: "", migrated: true, softFlag: false });
  };
  var projOf = {};
  P.forEach(function (r) { r[8].forEach(function (u) { (projOf[u] = projOf[u] || []).push(r); }); (projOf[r[4]] = projOf[r[4]] || []).push(r); });
  var hh = function (n) { return (n < 10 ? "0" : "") + n + ":00"; };
  for (var k = 1; k <= 40; k++) {
    var dt = new Date(); dt.setDate(dt.getDate() - k);
    if (dt.getDay() === 5 || dt.getDay() === 6) continue;
    var ds = d2s(dt);
    Object.keys(projOf).forEach(function (u) {
      if (!byId(db.users, u) || rnd() < 0.06) return;                 // the odd day off
      var rows = projOf[u], r = pick(rows), first = between(4, 6), isMgr = r[4] === u;
      var tsk = db.tasks.filter(function (t) { return t.projectId === r[0]; });
      if (isMgr) {
        db.entries.push(mk({ d: ds, u: u, s: "09:00", e: hh(9 + first), blue: first, c: r[1], p: r[0], desc: "Project management — " + pick(["client sync", "planning", "budget review", "team review"]) }));
        if (rnd() < 0.5) db.entries.push(mk({ d: ds, u: u, s: hh(10 + first), e: hh(12 + first), red: 2, c: "c-gal", p: "p-int1", desc: "Team administration" }));
      } else {
        var t1 = pick(tsk);
        db.entries.push(mk({ d: ds, u: u, s: "09:00", e: hh(9 + first), yellow: first, c: r[1], p: r[0], w: t1 ? t1.workOrderId : r[10][0], t: t1 ? t1.id : null, desc: pick(DESCS) + (t1 ? " — " + t1.title : "") }));
        var r2 = pick(rows), t2 = pick(db.tasks.filter(function (t) { return t.projectId === r2[0]; })), rest = 9 - first - between(0, 1);
        if (rest > 0) db.entries.push(mk({ d: ds, u: u, s: hh(10 + first), e: hh(10 + first + rest), yellow: rest, c: r2[1], p: r2[0], w: t2 ? t2.workOrderId : r2[10][0], t: t2 ? t2.id : null, desc: pick(DESCS) }));
      }
    });
    ["u-tamir", "u-inon"].forEach(function (u) {
      if (!byId(db.users, u) || rnd() < 0.3) return;
      db.entries.push(mk({ d: ds, u: u, s: "09:00", e: "13:00", red: 4, c: "c-gal", p: u === "u-tamir" ? "p-int2" : "p-int1", desc: u === "u-tamir" ? "Business development" : "Operations and division management" }));
    });
  }
  ["u-dennis", "u-paul", "u-eitan"].forEach(function (u, i) {
    if (!byId(db.users, u)) return;
    var sd = new Date(); sd.setDate(sd.getDate() - (8 + i * 5));
    if (sd.getDay() === 5 || sd.getDay() === 6) sd.setDate(sd.getDate() - 2);
    db.entries = db.entries.filter(function (e) { return !(e.assignee === u && e.date === d2s(sd)); });
    db.entries.push(mk({ d: d2s(sd), u: u, type: i === 1 ? "Vacation" : "Sick", day: 1, desc: i === 1 ? "Annual leave." : "Sick day." }));
  });

  /* live requests, so Approvals has something to decide */
  var yd = new Date(); yd.setDate(yd.getDate() - 1); if (yd.getDay() === 5 || yd.getDay() === 6) yd.setDate(yd.getDate() - 2);
  var reqs = [
    ["u-eitan", "u-danny", P[0], "17:00", "20:00", "Overtime on chapter 3 to make the review date.", "Allowance exceeded"],
    ["u-inbar", "u-ranit", P[3], "17:00", "19:00", "Extra regulatory review round.", "Allowance exceeded"],
    ["u-amy", "u-reuben", null, "09:00", "11:00", "Scoping call for a possible new user guide.", "Unlisted item"]
  ];
  reqs.forEach(function (q) {
    if (!byId(db.users, q[0])) return;
    var e = mk({ d: d2s(yd), u: q[0], s: q[3], e: q[4], yellow: 2 + (q[2] ? 1 : 0), c: q[2] ? q[2][1] : null, p: q[2] ? q[2][0] : null, w: q[2] ? q[2][10][0] : null, desc: q[5] });
    e.status = "pending"; e.statusReason = q[6]; e.submittedAt = nowISO(); e.migrated = false;
    if (!q[2]) { e.client = "Galilee Water Systems"; e.project = "New user guide (proposal)"; }
    db.entries.push(e);
    db.approvals.push(D({ id: uid("ar"), type: "Time entry", entityTable: "entries", entityId: e.id, requesterId: q[0], assignedTo: who(q[1]), status: "pending", reason: q[6], payloadBefore: null, payloadAfter: null, decidedBy: null, decidedAt: null, decisionNote: "", thread: [], createdAt: nowISO() }));
  });

  /* plans for next week */
  var mon = new Date(); mon.setDate(mon.getDate() + (7 - mon.getDay()));
  P.forEach(function (r) {
    r[8].slice(0, 2).forEach(function (u) {
      if (!byId(db.users, u)) return;
      for (var q = 0; q < 5; q++) {
        var pd = new Date(mon); pd.setDate(mon.getDate() + q);
        db.planned.push(D({ id: uid("pl"), userId: u, date: d2s(pd), start: "09:00", end: "17:00", red: 0, yellow: 8, clientId: r[1], projectId: r[0], workOrderId: r[10][0], taskId: null, description: "Planned work on " + r[2] }));
      }
    });
  });

  /* expenses */
  var ex = [["u-eitan", "Travel — fuel", 240, P[0], "Drive to the client site for the source review.", "Submitted"],
    ["u-inbar", "Meal", 68, P[3], "Working lunch at the client.", "Approved"],
    ["u-yosi", "Parking", 45, P[5], "Parking at the client's offices.", "Submitted"],
    ["u-danny", "Accommodation", 820, P[1], "Overnight before the delivery workshop.", "Submitted"]];
  ex.forEach(function (x, i) {
    if (!byId(db.users, x[0])) return;
    var d = new Date(); d.setDate(d.getDate() - (2 + i));
    db.expenses.push(D({ id: uid("x"), userId: x[0], date: d2s(d), time: "12:" + (10 + i * 7), etype: x[1], vkind: "money", currency: "₪", amount: x[2], hours: 0, clientId: x[3][1], projectId: x[3][0], workOrderId: x[3][10][0], description: x[4], notes: x[2] > 700 ? "Above the ceiling" : "", attachments: x[1] === "Accommodation" || x[1] === "Meal" ? [{ name: "receipt.pdf" }] : [], status: x[5] }));
  });

  db.library.push(
    D({ id: uid("l"), title: "GALIL house style — quick rules", body: "Sentence case for headings. Second person for procedures. No future tense in steps. Israeli date format everywhere.", authorUserId: who("u-kfir"), isPrivate: false, tags: ["style", "writing"], projectId: null, taskId: null, link: "", createdAt: nowISO() }),
    D({ id: uid("l"), title: "Screenshot capture checklist", body: "1366×768 window. Hide personal data. PNG, 96 dpi. Crop to the control plus one container.", authorUserId: who("u-danny"), isPrivate: false, tags: ["images", "checklist"], projectId: "p-iai1", taskId: null, link: "", createdAt: nowISO() }),
    D({ id: uid("l"), title: "IFU wording — regulatory notes", body: "Use the client's approved warning phrases verbatim. Every change to an alarm description goes through regulatory review.", authorUserId: who("u-ranit"), isPrivate: false, tags: ["medical", "regulatory"], projectId: "p-cmd1", taskId: null, link: "", createdAt: nowISO() }));
  return db;
}
