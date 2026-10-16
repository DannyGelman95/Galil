/* =====================================================================
   Taskana — the GALIL team and demo data.
   TEAM is the real company roster (org chart and company accounts, autumn 2026). Demo data is
   made-up work (random each time) for those people; every demo record is
   flagged demo: true so it can be removed again without touching real work.
   ===================================================================== */
"use strict";

/* id, full name, company email, job title, department, Taskana role, reports to, employment */
var TEAM = [
  ["u-tamir",    "Tamir Nisman",     "tamir@galiltc.co.il",         "CEO",                                                   "Management",       "Admin",   null],
  ["u-yinon",    "Inon Kanner",      "inon.kanner@galiltc.co.il",   "Deputy CEO, Operations · Head of the Defense Division", "Management",       "Admin",   "u-tamir"],
  ["u-kfir",     "Kfir Hodara",      "kfir@galiltc.co.il",          "Client Manager",                                        "Civil Division",   "Manager", "u-yinon"],
  ["u-denis",    "Dennis Sablin",    "dennis.sablin@galiltc.co.il", "Technical Writer",                                      "Civil Division",   "Member",  "u-kfir"],
  ["u-shoshana", "Shoshana Axtell",  "shoshana.a@galiltc.co.il",    "Technical Writer",                                      "Civil Division",   "Member",  "u-kfir"],
  ["u-suzan",    "Suzanne Musin",    "suzanne.m@galiltc.co.il",     "Technical Writer",                                      "Civil Division",   "Member",  "u-kfir"],
  ["u-ranit",    "Ranit Schnall",    "ranit@galiltc.co.il",         "Client Manager",                                        "Civil Division",   "Manager", "u-yinon"],
  ["u-inbar",    "Inbar Azulay",     "inbar@galiltc.co.il",         "Technical Writer",                                      "Civil Division",   "Member",  "u-ranit"],
  ["u-paul",     "Paul Schnall",     "paul@galiltc.co.il",          "Technical Writer",                                      "Civil Division",   "Member",  "u-ranit"],
  ["u-jeremy",   "Jeremie De Bock",  "jeremie@galiltc.co.il",       "Technical Writer",                                      "Civil Division",   "Member",  "u-ranit"],
  ["u-reuven",   "Reuben Politi",    "reuben@galiltc.co.il",        "Client Manager",                                        "Civil Division",   "Manager", "u-yinon"],
  ["u-amy",      "Amy di Nardo",     "amy@galiltc.co.il",           "Technical Writer",                                      "Civil Division",   "Member",  "u-reuven"],
  ["u-niv",      "Niv Passy",        "niv.passy@galiltc.co.il",     "Client Manager",                                        "Civil Division",   "Manager", "u-yinon"],
  ["u-pnina",    "Penina Smith",     "penina@galiltc.co.il",        "Technical Writer",                                      "Civil Division",   "Member",  "u-niv"],
  ["u-yossi",    "Yosi Francos",     "yosi.f@galiltc.co.il",        "Technical Writer",                                      "Civil Division",   "Member",  "u-niv"],
  ["u-danny",    "Danny Gelman",     "danny.gelman@galiltc.co.il",  "Defense Sector Project Manager",                        "Defense Division", "Admin",   "u-yinon"],
  ["u-eitan",    "Eitan Fisch",      "eitan.f@galiltc.co.il",       "Technical Writer",                                      "Defense Division", "Member",  "u-danny"],
  ["u-daniel",   "Daniel Barak",     "daniel.barak@galiltc.co.il",  "Technical Writer",                                      "Defense Division", "Member",  "u-danny"],
  /* outsourced engineers with a GALIL account, and the company's main mailbox */
  ["u-gil",      "Gil Hadar",        "gil.hadar@galiltc.co.il",     "Engineer (outsourced)",                                 "Engineering",      "External", "u-yinon", "Outsourced"],
  ["u-ofir",     "Ofir Abutbul",     "ofir.abutbul@galiltc.co.il",  "Engineer (outsourced)",                                 "Engineering",      "External", "u-yinon", "Outsourced"],
  ["u-ronen",    "Ronen Nachum",     "ronen.nachum@galiltc.co.il",  "Engineer (outsourced)",                                 "Engineering",      "External", "u-yinon", "Outsourced"],
  ["u-office",   "Galil TC Office",  "office@galiltc.co.il",        "Office management, administration & HR",                "Office & HR",      "Member",   "u-tamir"]
];
function emailFor(name) { var r = TEAM.filter(function (x) { return x[1] === name; })[0]; return r ? r[2] : name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + DOMAIN; }
function teamUsers() {
  return TEAM.map(function (r) {
    return { id: r[0], fullName: r[1], email: r[2], jobTitle: r[3], department: r[4], role: r[5], managerId: r[6], employment: r[7] || "Employee", isActive: true, pendingActivation: false };
  });
}

/* A fresh workspace: the team only, or the team plus demo work. */
function seed(withDemo) {
  var d = emptyDB();
  d.users = teamUsers();
  if (withDemo !== false) addDemo(d);
  return d;
}

/* ================= demo data ================= */
function removeDemo(d) {
  var gone = {};
  d.tasks.forEach(function (t) { if (t.demo) gone[t.id] = 1; });
  d.tasks = d.tasks.filter(function (t) { return !gone[t.id]; });
  d.tasks.forEach(function (t) { if (t.parentId && gone[t.parentId]) t.parentId = null; t.links = (t.links || []).filter(function (l) { return !gone[l.taskId]; }); });
  ["comments", "activity", "notifications", "attachments"].forEach(function (k) { d[k] = d[k].filter(function (x) { return !x.demo && !gone[x.taskId]; }); });
  var used = {}; d.tasks.forEach(function (t) { used[t.projectId] = 1; });
  d.projects = d.projects.filter(function (p) { return !p.demo || used[p.id]; });
  var cUsed = {}; d.projects.forEach(function (p) { cUsed[p.clientId] = 1; });
  d.clients = d.clients.filter(function (c) { return !c.demo || cUsed[c.id]; });
  d.views = d.views.filter(function (v) { return !v.demo; });
  return d;
}
function hasDemo(d) { return d.tasks.some(function (t) { return t.demo; }) || d.clients.some(function (c) { return c.demo; }); }

/* Adds a fresh, random set of demo work for the team to d (replacing any earlier demo work). */
function addDemo(d) {
  removeDemo(d);
  var rnd = Math.random;
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var between = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
  var T = function (n_) { var x = new Date(); x.setDate(x.getDate() + n_); return d2s(x); };
  var A = function (daysAgo, hr) { var x = new Date(); x.setDate(x.getDate() - daysAgo); x.setHours(hr || 10, (daysAgo * 7) % 60, 0, 0); return x.toISOString(); };
  var workday = function (s) { return isWeekend(s) ? addDays(s, parseDay(s).getDay() === 5 ? -1 : 1) : s; };

  /* people: the roster ids, or whoever is active when the roster has changed */
  var active = d.users.filter(function (u) { return u.isActive; });
  var spare = 0;
  var who = function (id) { if (!id) return null; var u = byId(d.users, id); if (u && u.isActive) return id; return active.length ? active[spare++ % active.length].id : null; };

  /* fixed ids (t-1, p-iai1, …) keep demo keys stable; any already taken by real records get a fresh id */
  var taken = {};
  ["tasks", "projects", "comments", "views", "attachments"].forEach(function (k) { d[k].forEach(function (x) { taken[x.id] = 1; }); });
  var idm = {};
  var X = function (id) { if (!(id in idm)) idm[id] = taken[id] ? uid(id.split("-")[0]) : id; return idm[id]; };

  var clients = [
    { id: "c-iai", name: "IAI", code: "IAI", industry: "Aerospace & Defence", contactName: "Ilan Barak", contactEmail: "ilan@iai.example", notes: "Style guide: IAI-TW-SG rev F. All deliverables in S1000D-lite Word templates." },
    { id: "c-elb", name: "Elbit Systems", code: "ELB", industry: "Defence Electronics", contactName: "Rita Gold", contactEmail: "rita@elbit.example", notes: "Help authored in DITA, published via the client's CCMS." },
    { id: "c-mob", name: "Mobileye", code: "MOB", industry: "Automotive", contactName: "Sagi Peer", contactEmail: "sagi@mobileye.example", notes: "Developer docs in Markdown, reviewed through the client's Git." },
    { id: "c-cmd", name: "Carmel Medical Devices", code: "CMD", industry: "Medical Devices", contactName: "Hila Mor", contactEmail: "hila@carmel-med.example", notes: "IEC 62366 usability wording. Every IFU change goes through the client's regulatory review." },
    { id: "c-gws", name: "Galilee Water Systems", code: "GWS", industry: "Agritech", contactName: "Omer Tal", contactEmail: "omer@galilee-water.example", notes: "Guides ship in English, Hebrew and Spanish. Screenshots from the field-test controller only." },
    { id: "c-hft", name: "Haifa FinTech", code: "HFT", industry: "Financial Services", contactName: "Lior Ben-David", contactEmail: "lior@haifa-fintech.example", notes: "Online help in MadCap Flare. Legal review for anything that mentions fees." },
    { id: "c-gal", name: "GALIL (internal)", code: "GAL", industry: "Internal", contactName: "", contactEmail: "", notes: "Internal templates, style guide, finance, HR and recruiting." }
  ];
  /* id, client, key, name, deliverable type, status, lead, team, start (days from today), delivery, description, sections */
  var projects = [
    ["p-iai1", "c-iai", "RSOM", "Radar Suite — Operator Manual", "Operator Manual", "Active", "u-danny", ["u-eitan", "u-daniel", "u-ofir"], -120, 90, "Two-volume operator manual for the radar suite (Vol 1 Operation, Vol 2 Maintenance).", ["Vol 1 · Ch 4", "Vol 1 · Ch 5", "Vol 2 · Ch 1", "Vol 2 · Ch 2", "Vol 2 · Ch 6"]],
    ["p-iai2", "c-iai", "MTP", "Maintenance Training Package", "Training Courseware", "Active", "u-danny", ["u-eitan", "u-daniel"], -60, 120, "Instructor guide, student handbook and slides for the level-2 maintenance course.", ["Module 2", "Module 5", "Module 6", "Final exam"]],
    ["p-elb1", "c-elb", "AVH", "Avionics Help System", "Online Help", "Active", "u-yinon", ["u-eitan", "u-daniel", "u-danny", "u-gil"], -200, 30, "Migration of the legacy CHM help to DITA, then content refresh for release 5.", ["Release 5 · Nav", "Release 5 · Radio", "Release 5 · Alerts"]],
    ["p-mob1", "c-mob", "SDK", "SDK Documentation Refresh", "API Reference", "Active", "u-kfir", ["u-denis", "u-shoshana", "u-suzan"], -40, 60, "Rewrite the getting-started guide and regenerate the API reference for SDK 4.x.", ["SDK 4.0", "SDK 4.1", "Samples", "Migration guide"]],
    ["p-cmd1", "c-cmd", "IFU", "Infusion Pump — IFU & Service Manual", "User Manual", "Active", "u-ranit", ["u-inbar", "u-paul", "u-jeremy", "u-ronen"], -90, 75, "Instructions for use (clinical staff) and the field-service manual for the IP-300 pump.", ["IFU · Setup", "IFU · Alarms", "IFU · Cleaning", "Service · Calibration", "Service · Parts"]],
    ["p-gws1", "c-gws", "IRC", "Irrigation Controller — User Guide", "User Manual", "Active", "u-reuven", ["u-amy"], -50, 45, "User guide and quick start for the IC-8 field controller, in three languages.", ["Quick start", "Ch 2 · Programs", "Ch 3 · Sensors", "Troubleshooting"]],
    ["p-hft1", "c-hft", "BOH", "Banking App — Online Help", "Online Help", "Active", "u-niv", ["u-pnina", "u-yossi"], -70, 55, "Context-sensitive help for the retail banking app, release 7.", ["Payments", "Cards", "Loans", "Settings"]],
    ["p-gal1", "c-gal", "STY", "GALIL Style Guide 2027", "Other", "On Hold", "u-yinon", ["u-kfir", "u-ranit", "u-danny"], -20, 150, "Refresh of the house style guide and Word/FrameMaker templates.", ["Word templates", "Terminology"]],
    ["p-gal2", "c-gal", "OPS", "Finance, HR & recruiting", "Other", "Active", "u-tamir", ["u-tamir", "u-yinon"], -30, 300, "Internal company work: bookkeeping with the outsourced accountant, HR, and hiring the open writer positions.", []]
  ];
  var used = {}; d.projects.forEach(function (p) { used[p.key] = 1; });
  var cHave = {}; d.clients.forEach(function (c) { cHave[c.id] = 1; });
  clients.forEach(function (c) { if (!cHave[c.id]) d.clients.push(Object.assign({ demo: true }, c)); });
  var team = {};
  projects.forEach(function (r) {
    var key = r[2], i = 2; while (used[key]) key = r[2].slice(0, 4) + i++;
    used[key] = 1;
    team[X(r[0])] = r[7].map(who).filter(Boolean);
    r[0] = X(r[0]);
    d.projects.push({ id: r[0], demo: true, clientId: r[1], key: key, name: r[3], docType: r[4], status: r[5], leadUserId: who(r[6]), startDate: T(r[8]), dueDate: workday(T(r[9])), description: r[10], nextNum: 1 });
  });
  var proj = function (id) { return byId(d.projects, id); };
  var lead = function (pid) { return proj(pid).leadUserId; };

  var newTask = function (o) {
    var p = proj(o.projectId);
    var t = Object.assign({ id: uid("t"), demo: true, num: p.nextNum++, type: "Writing", priority: "Medium", status: "To Do", assigneeId: null, reporterId: lead(o.projectId),
      startDate: null, dueDate: null, estimateHours: null, deliverable: "", description: "", labels: [], checklist: [], links: [], aliases: [], parentId: null, recurrence: "",
      startedAt: null, completedAt: null, completedBy: null }, o);
    d.tasks.push(t);
    return t;
  };

  /* hand-written tasks first, so their keys are stable (RSOM-1, RSOM-2, …) */
  var rows = [
    ["t-1", "p-iai1", "Draft chapter 3 — Track modes", "Writing", "Writing", "High", "u-eitan", "u-danny", 6, 24, "Vol 1 · Ch 3", "Full draft with screenshots placed, ready for peer review.\n\nSource: SRS v2.3 §4.1–4.6 and the recorded walkthrough from 12 Sep.", ["vol1"], [["Outline approved", true], ["Screenshots captured", true], ["Draft written", false], ["Self-check against style guide", false]], 10],
    ["t-2", "p-iai1", "Illustration pass — chapter 3", "Illustration", "To Do", "Medium", "u-daniel", "u-danny", 12, 16, "Vol 1 · Ch 3", "Redraw 12 figures to the client style sheet (line weights 0.5/1 pt, callouts in Arial 8).", ["vol1", "figures"], [], 7],
    ["t-3", "p-iai1", "Maintenance procedures — outline", "Research", "Backlog", "Medium", "u-daniel", "u-danny", 20, 8, "Vol 2", "Agree the task breakdown with the client SME before writing starts.", ["vol2"], [], 3],
    ["t-4", "p-iai1", "SME interview — antenna alignment", "SME Interview", "To Do", "High", "u-daniel", "u-danny", 3, 3, "Vol 2 · Ch 5", "Book 1 h with the field engineer. Prepare questions from the alignment test report.", ["vol2", "sme"], [["Questions sent in advance", false], ["Interview recorded", false]], 2],
    ["t-5", "p-iai1", "Peer review — chapter 2", "Review", "Peer Review", "Medium", "u-danny", "u-eitan", 1, 6, "Vol 1 · Ch 2", "Review for accuracy, terminology and style-guide compliance. Use tracked changes.", ["vol1"], [], 5],
    ["t-6", "p-iai2", "Build module 4 slides", "Writing", "Writing", "Medium", "u-eitan", "u-danny", 9, 20, "Module 4", "Slides plus facilitator notes for the hydraulics module.", ["courseware"], [], 12],
    ["t-7", "p-iai2", "Student handbook — module 3 edit", "Editing", "SME Review", "Medium", "u-daniel", "u-danny", -2, 10, "Module 3", "Copy-edit pass done; with the client SME for technical sign-off.", ["courseware"], [], 15],
    ["t-8", "p-iai2", "Translate module 1 to Hebrew", "Translation", "Backlog", "Low", null, "u-danny", 45, 30, "Module 1", "Send to the translation vendor once module 1 is signed off. Glossary attached in the project share.", ["he"], [], 1],
    ["t-9", "p-elb1", "Help topic migration — batch 2", "Writing", "Peer Review", "Critical", "u-eitan", "u-yinon", -1, 40, "Release 5", "Convert 80 topics to the new DITA map. Keep the old topic IDs as aliases so context-sensitive links keep working.", ["dita", "migration"], [["Topics converted", true], ["Map validated", true], ["Broken links fixed", false]], 21],
    ["t-10", "p-elb1", "Fix broken cross-references in nav topics", "Doc Defect", "To Do", "High", "u-eitan", "u-yinon", 4, 4, "Release 5", "QA found 14 xrefs pointing at removed topics (see the link report in the CCMS).", ["defect"], [], 4],
    ["t-11", "p-elb1", "Publish release 5 help to staging", "Publishing", "Backlog", "Medium", "u-danny", "u-yinon", 25, 2, "Release 5", "Run the publish job and send the staging URL to Rita.", ["publish"], [], 1],
    ["t-12", "p-mob1", "API reference — endpoints A–F", "Writing", "Done", "Medium", "u-denis", "u-kfir", -8, 30, "SDK 4.0", "Generate and hand-edit reference pages.", ["api"], [], 30],
    ["t-13", "p-mob1", "Getting-started guide rewrite", "Writing", "Writing", "High", "u-shoshana", "u-kfir", 14, 18, "SDK 4.0", "New quick start for SDK 4: install, auth, first call, troubleshooting.", ["guide"], [["Install section", true], ["Auth section", false], ["First call sample", false], ["Troubleshooting", false]], 9],
    ["t-14", "p-mob1", "API reference — endpoints G–M", "Writing", "To Do", "Medium", "u-suzan", "u-kfir", 28, 30, "SDK 4.0", "Same approach as A–F.", ["api"], [], 2],
    ["t-15", "p-gal1", "Collect style-guide change requests", "Research", "Backlog", "Low", "u-yinon", "u-tamir", 40, 6, "", "Survey the writers for pain points with the current guide.", [], [], 20],
    ["t-16", "p-gal2", "Recruit a technical writer — Defense Division", "Research", "Writing", "High", "u-danny", "u-tamir", 30, 20, "Open position", "Third writer for Danny's team. Job ad is on the website Careers page; shortlist and first interviews.", ["hiring"], [["Job ad published", true], ["Shortlist of 5", false], ["First interviews", false]], 12],
    ["t-17", "p-gal2", "Recruit a technical writer — Ranit's team", "Research", "To Do", "Medium", "u-ranit", "u-tamir", 45, 16, "Open position", "Fourth writer for the Carmel Medical account.", ["hiring"], [], 6],
    ["t-18", "p-gal2", "Recruit a technical writer — Reuven's team", "Research", "To Do", "Medium", "u-reuven", "u-tamir", 45, 16, "Open position", "Second writer for the Galilee Water account; Spanish a plus.", ["hiring"], [], 6],
    ["t-19", "p-gal2", "Monthly hours report to the outsourced accountant", "Publishing", "To Do", "Medium", "u-yinon", "u-tamir", 5, 2, "Finance", "Export the month's billable hours per client and send them with the invoices.", ["finance"], [], 25]
  ];
  rows.forEach(function (r) {
    var st = r[4], created = A(r[14], 9), updated = A(Math.max(0, r[14] - 3), 14);
    newTask({ id: X(r[0]), projectId: X(r[1]), title: r[2], type: r[3], status: st, priority: r[5], assigneeId: who(r[6]), reporterId: who(r[7]),
      dueDate: workday(T(r[8])), estimateHours: r[9], deliverable: r[10], description: r[11], labels: r[12],
      checklist: r[13].map(function (c) { return { id: uid("ck"), text: c[0], done: c[1] }; }),
      createdAt: created, updatedAt: updated, startedAt: NOT_STARTED[st] ? null : A(Math.max(0, r[14] - 1), 9),
      completedAt: st === "Done" ? updated : null, completedBy: st === "Done" ? who(r[6]) : null });
  });
  var t = function (id) { return byId(d.tasks, X(id)); };
  t("t-2").parentId = X("t-1");
  t("t-1").links = [{ type: "is blocked by", taskId: X("t-4") }]; t("t-4").links = [{ type: "blocks", taskId: X("t-1") }];
  t("t-15").recurrence = "Monthly"; t("t-19").recurrence = "Monthly";

  /* random open work for every project's team */
  var OPEN = [
    ["Draft {s}", "Writing"], ["Peer review — {s}", "Review"], ["Copy-edit {s}", "Editing"], ["Screenshots for {s}", "Illustration"],
    ["SME review of {s}", "SME Interview"], ["Figures for {s}", "Illustration"], ["Translate {s}", "Translation"], ["Incorporate review comments — {s}", "Editing"],
    ["Publish {s} draft to the client", "Publishing"], ["Index and cross-references — {s}", "Editing"], ["Style-guide check — {s}", "Review"], ["Fix reported defects in {s}", "Doc Defect"],
    ["Localize UI strings in {s}", "Localization"], ["Collect source material for {s}", "Research"]
  ];
  var OPS = [["Collect supplier invoices for the accountant", "Research"], ["Update the employee onboarding pack", "Writing"], ["Renew software licences (Flare, Oxygen, Office)", "Research"],
    ["Quarterly VAT report — send documents", "Publishing"], ["Plan the team training day", "Research"], ["Update the holiday calendar", "Editing"]];
  var STEPS = ["Backlog", "To Do", "To Do", "Writing", "Writing", "Peer Review", "SME Review"];
  var PRIOS = ["Low", "Medium", "Medium", "Medium", "High", "High", "Critical"];
  projects.forEach(function (r) {
    var pid = r[0], people = team[pid], sections = r[11], seen = {};
    d.tasks.forEach(function (x) { if (x.projectId === pid) seen[x.title] = 1; });
    for (var k = 0, n = between(3, 6); k < n; k++) {
      var tpl = sections.length ? pick(OPEN) : pick(OPS), sec = sections.length ? pick(sections) : "";
      var title = tpl[0].replace("{s}", sec);
      if (seen[title]) continue; seen[title] = 1;
      var st = pick(STEPS), age = between(2, 40), dueIn = between(-6, 35);
      newTask({ projectId: pid, title: title, type: tpl[1], status: st, priority: pick(PRIOS), assigneeId: rnd() < 0.08 ? null : pick(people),
        dueDate: workday(T(dueIn)), estimateHours: between(2, 32), deliverable: sec, labels: [],
        createdAt: A(age, 9), updatedAt: A(Math.max(0, age - between(0, age)), 15), startedAt: NOT_STARTED[st] ? null : A(Math.max(0, age - between(0, 3)), 9) });
    }
  });

  /* closed work from the last few months, so Insights has history to show */
  var DONE = [["Outline for {s}", "Research"], ["First draft — {s}", "Writing"], ["Peer review — {s}", "Review"], ["Copy-edit {s}", "Editing"], ["Figures for {s}", "Illustration"],
    ["Publish {s}", "Publishing"], ["Translate {s}", "Translation"], ["Terminology list for {s}", "Research"], ["Fix QA findings in {s}", "Doc Defect"], ["SME walkthrough — {s}", "SME Interview"]];
  var OPS_DONE = [["Send last month's hours to the accountant", "Publishing"], ["Onboard the new writer", "Writing"], ["Order laptops for the defense team", "Research"], ["Interview round — writers", "Research"]];
  projects.forEach(function (r) {
    var pid = r[0], people = team[pid], sections = r[11].length ? r[11].concat(["Ch 1", "Ch 2", "Front matter"]) : [""], seen = {};
    for (var k = 0, n = between(5, 10); k < n; k++) {
      var tpl = r[11].length ? pick(DONE) : pick(OPS_DONE), sec = pick(sections), title = tpl[0].replace("{s}", sec);
      if (seen[title]) title += " (" + (k + 1) + ")"; seen[title] = 1;
      var age = between(10, 160), wait = between(0, 5), cycle = between(3, 21), doneAgo = Math.max(1, age - wait - cycle);
      var due = workday(T(-(doneAgo + between(-3, 5)))), by = pick(people);
      newTask({ projectId: pid, title: title, type: tpl[1], status: "Done", priority: pick(PRIOS), assigneeId: by, dueDate: due, estimateHours: between(3, 30), deliverable: sec,
        createdAt: A(age, 9), updatedAt: A(doneAgo, 15), startedAt: A(age - wait, 9), completedAt: A(doneAgo, 15), completedBy: by });
    }
  });

  /* conversations */
  var C = function (id, taskId, author, kind, body, ago, hr, extra) {
    d.comments.push(Object.assign({ id: X(id), demo: true, taskId: X(taskId), authorId: who(author), kind: kind, body: body, createdAt: A(ago, hr), resolved: kind === "question" ? false : undefined }, extra || {}));
  };
  C("cm-1", "t-1", "u-eitan", "question", "@[" + who("u-danny") + "] the SRS lists five track modes but the UI only shows four — is \"Silent track\" still in scope for this release?", 2, 11);
  C("cm-2", "t-1", "u-danny", "comment", "Checking with Ilan at IAI, will update by Thursday.", 2, 15);
  C("cm-3", "t-1", "u-eitan", "comment", "Screenshots are on the share under /RSOM/Vol1/Ch3/img (build 2.3.114).", 1, 10);
  C("cm-4", "t-2", "u-daniel", "question", "Do the callouts need to be in Hebrew as well, or English only?", 3, 9, { resolved: true, resolvedBy: who("u-danny"), resolvedAt: A(3, 12) });
  C("cm-5", "t-2", "u-danny", "comment", "English only for this volume.", 3, 12);
  C("cm-6", "t-9", "u-yinon", "comment", "Batch looks good overall. 6 topics still have hard-coded product names — please switch them to the keyref.", 1, 16);
  C("cm-7", "t-9", "u-eitan", "question", "@[" + who("u-yinon") + "] should the alias IDs go in the map or in each topic's prolog?", 0, 9);
  C("cm-8", "t-7", "u-daniel", "comment", "Sent to the SME for sign-off. They asked for 3 working days.", 4, 13);
  C("cm-9", "t-13", "u-shoshana", "question", "Is there a sandbox API key we can use in the code samples?", 1, 11);
  C("cm-10", "t-16", "u-danny", "comment", "Two strong CVs from the Careers page so far. Booking interviews for next week.", 2, 12);
  /* a random question on a few open tasks, addressed to the project lead */
  var Q = ["is the latest build available for screenshots?", "can you confirm the terminology for this section?", "who signs off on this one at the client?", "is the template in the share the current revision?"];
  d.tasks.filter(function (x) { return x.demo && x.status !== "Done" && x.assigneeId && !rows.some(function (r) { return X(r[0]) === x.id; }); }).slice(0, 6).forEach(function (x, i) {
    var l = lead(x.projectId);
    if (!l || l === x.assigneeId || rnd() < 0.4) return;
    C(uid("cm"), x.id, x.assigneeId, "question", "@[" + l + "] " + pick(Q), between(0, 6), 10 + i);
  });
  d.comments.forEach(function (c) { c.mentions = mentionIds(c.body); if (c.resolved === undefined) delete c.resolved; });

  d.attachments.push({ id: X("at-1"), demo: true, taskId: X("t-1"), kind: "link", name: "SRS v2.3 (client portal)", url: "https://example.com/iai/srs-2.3", addedBy: who("u-eitan"), at: A(9, 10) });
  d.tasks.forEach(function (x) { if (x.demo) d.activity.push({ id: uid("a"), demo: true, taskId: x.id, userId: x.reporterId, at: x.createdAt, kind: "created", to: x.assigneeId }); });
  d.comments.forEach(function (c) {
    if (!c.demo) return;
    var x = byId(d.tasks, c.taskId);
    (c.mentions || []).forEach(function (m) { d.notifications.push({ id: uid("n"), demo: true, userId: m, kind: "mention", taskId: c.taskId, byId: c.authorId, at: c.createdAt, read: false }); });
    if (c.kind === "question" && x && x.reporterId && x.reporterId !== c.authorId && (c.mentions || []).indexOf(x.reporterId) < 0)
      d.notifications.push({ id: uid("n"), demo: true, userId: x.reporterId, kind: "question", taskId: c.taskId, byId: c.authorId, at: c.createdAt, read: false });
  });
  d.views.push(
    { id: X("v-1"), demo: true, name: "My overdue work", ownerId: who("u-danny"), shared: true, mode: "tasks", filters: { assigneeId: "me", overdue: "1" }, sort: { k: "dueDate", dir: 1 } },
    { id: X("v-2"), demo: true, name: "Waiting on SME", ownerId: who("u-danny"), shared: true, mode: "tasks", filters: { status: "SME Review" }, sort: { k: "dueDate", dir: 1 } },
    { id: X("v-3"), demo: true, name: "IAI board", ownerId: who("u-danny"), shared: true, mode: "board", filters: { clientId: "c-iai" } },
    { id: X("v-4"), demo: true, name: "Unanswered questions", ownerId: who("u-yinon"), shared: true, mode: "tasks", filters: { questions: "1" }, sort: { k: "updatedAt", dir: -1 } });
  return d;
}
