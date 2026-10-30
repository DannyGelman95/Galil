/* =====================================================================
   GALIL HR — the home page, company news, events, the people directory
   and recognition. (Surveys: surveys.js; performance reviews: reviews.js.)
   Each page function returns the page's element; app.js puts it in place.
   ===================================================================== */
"use strict";

var NEWS_CATS = [["company", "Company"], ["hr", "HR & benefits"], ["people", "People"], ["achievement", "Achievements"], ["events", "Events"]];
var EVENT_CATS = [["company", "Company"], ["social", "Social"], ["training", "Training"], ["wellbeing", "Wellbeing"], ["holiday", "Holiday"]];
var KUDOS_VALUES = [["teamwork", "Teamwork"], ["ownership", "Ownership"], ["quality", "Quality"], ["customer", "Customer focus"], ["helping", "Helping hand"], ["innovation", "Innovation"]];
function catName(list, k) { for (var i = 0; i < list.length; i++) if (list[i][0] === k) return tr(list[i][1]); return k || ""; }
function trList(list) { return list.map(function (x) { return [x[0], tr(x[1])]; }); }
function pageHead(title, sub, actions) {
  return h("div", { class: "phead" }, h("div", null, h("h1", null, title), sub ? h("p", { class: "sub" }, sub) : null), actions ? h("div", { class: "pactions" }, actions) : null);
}

/* =========================== home =========================== */
function pageHome() {
  var hour = new Date().getHours();
  var greet = hour < 12 ? "Good morning, {name}" : hour < 18 ? "Good afternoon, {name}" : "Good evening, {name}";
  var surveys = surveysWaiting(), todo = reviewTodo(), events = upcomingEvents().slice(0, 4), cel = celebrations(30), news = newsList().slice(0, 3);
  var stat = function (id, n, label, href, ic) { return h("a", { class: "stat", href: href, id: id }, icon(ic, 22), h("b", null, String(n)), h("span", null, label)); };
  return h("div", { class: "home" },
    pageHead(tr(greet, { name: firstName(ME) }), longDate(today()) + " · " + tr("Everything people-related at GALIL, in one place.")),
    h("div", { class: "stats" },
      stat("stat-surveys", surveys.length, tr("surveys waiting for you"), "#/surveys", "survey"),
      stat("stat-reviews", todo.length, tr("reviews to complete"), "#/reviews", "review"),
      stat("stat-events", upcomingEvents().length, tr("upcoming events"), "#/events", "calendar"),
      stat("stat-celebrations", cel.length, tr("celebrations in the next 30 days"), "#/people", "cake")),
    isAdmin() ? h("div", { class: "card admin-create", id: "home-create" },
      h("h2", null, tr("HR admin — create")),
      h("div", { class: "create-btns" },
        btn(tr("New survey"), { icon: "survey", id: "create-survey", onclick: function () { go("#/surveys/new/edit"); } }),
        btn(tr("New review cycle"), { icon: "review", id: "create-cycle", onclick: function () { editCycle(null); } }),
        btn(tr("New post"), { icon: "news", id: "create-post", onclick: function () { editNews(null); } }),
        btn(tr("New event"), { icon: "calendar", id: "create-event", onclick: function () { editEvent(null); } })),
      h("p", { class: "muted" }, tr("A review cycle carries its own form: the competencies to rate and the written questions for the self-assessment and the manager review."))) : null,
    surveys.length || todo.length ? h("div", { class: "todo card", id: "home-todo" },
      h("h2", null, tr("Waiting for you")),
      h("ul", null,
        surveys.map(function (s) { return h("li", null, icon("survey", 16), h("a", { href: "#/surveys/" + s.id }, L(s.title)), s.closes ? h("span", { class: "muted" }, " · " + tr("closes {d}", { d: shortDate(s.closes) })) : null); }),
        todo.map(function (r) {
          var c = byId(db.cycles, r.cycleId);
          var what = r.employeeId === ME.id ? (r.status === "self" ? tr("Your self-assessment") : tr("Read and acknowledge your review")) : tr("Review {name}", { name: nameOf(r.employeeId) });
          return h("li", null, icon("review", 16), h("a", { href: "#/reviews/" + r.id }, what), h("span", { class: "muted" }, " · " + L(c.title)));
        }))) : null,
    h("div", { class: "grid2" },
      section(tr("Latest news"), h("a", { href: "#/news", class: "more" }, tr("All news")),
        news.length ? h("div", { class: "list" }, news.map(newsRow)) : empty(tr("No news yet."))),
      h("div", { class: "col" },
        section(tr("Coming up"), h("a", { href: "#/events", class: "more" }, tr("All events")),
          events.length ? h("div", { class: "list" }, events.map(eventRow)) : empty(tr("Nothing planned yet."))),
        section(tr("Celebrations"), null,
          cel.length ? h("ul", { class: "cel" }, cel.slice(0, 6).map(celebrationRow)) : empty(tr("No birthdays or work anniversaries in the next 30 days."))),
        section(tr("Recent recognition"), h("a", { href: "#/kudos", class: "more" }, tr("Say thanks")),
          kudosList().length ? h("div", { class: "list" }, kudosList().slice(0, 3).map(kudosCard)) : empty(tr("No kudos yet — be the first.")))))
  );
}
function celebrationRow(c) {
  return h("li", null, avatar(c.u, 30),
    h("div", null, h("b", null, nameOf(c.u)), h("span", { class: "muted" },
      c.kind === "birthday" ? "🎂 " + tr("Birthday") : "🎉 " + tr(c.years === 1 ? "1 year at GALIL" : "{n} years at GALIL", { n: c.years }))),
    h("span", { class: "when" + (c.days === 0 ? " today" : "") }, inDays(c.days)));
}

/* =========================== news =========================== */
function newsRow(n) {
  var reacts = reactionsOf(n.id).length, comments = commentsOf(n.id).length;
  return h("a", { class: "row-card news-row", href: "#/news/" + n.id },
    h("div", { class: "rc-main" },
      h("div", { class: "rc-top" }, n.pinned ? chip(tr("Pinned"), "pink") : null, chip(catName(NEWS_CATS, n.category), "mut"),
        n.publishAt && n.publishAt > today() ? chip(tr("Scheduled for {d}", { d: shortDate(n.publishAt) }), "amber") : null),
      h("b", null, L(n.title)),
      h("p", null, excerpt(L(n.body), 160)),
      h("div", { class: "rc-meta" }, nameOf(n.authorId), " · ", ago(n.publishedAt), " · ", icon("heart", 13), " " + reacts, " · ", icon("chat", 13), " " + comments)));
}
function excerpt(t, n) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; }
var newsFilter = "";
function pageNews() {
  var list = newsList().filter(function (n) { return !newsFilter || n.category === newsFilter; });
  var filters = h("div", { class: "filters", role: "group", "aria-label": tr("Category") },
    [["", tr("All")]].concat(trList(NEWS_CATS)).map(function (c) {
      return btn(c[1], { kind: "pill", sm: true, pressed: newsFilter === c[0], onclick: function () { newsFilter = c[0]; rerender(); } });
    }));
  return h("div", null,
    pageHead(tr("Company news"), tr("Announcements, updates and stories from around GALIL."),
      isAdmin() ? btn(tr("New post"), { kind: "primary", icon: "plus", id: "news-new", onclick: function () { editNews(null); } }) : null),
    filters,
    list.length ? h("div", { class: "list" }, list.map(newsRow)) : empty(tr("No news here yet.")));
}
function pageNewsItem(id) {
  var n = byId(db.news, id);
  if (!n || n.deleted) return notFound(tr("This post was removed."), "#/news");
  var mine = byId(db.reactions, n.id + ":" + ME.id), liked = mine && !mine.deleted, reacts = reactionsOf(n.id);
  var box = textarea({ rows: 2, placeholder: tr("Write a comment…"), id: "comment-text", "aria-label": tr("Write a comment…") });
  return h("div", { class: "reader" },
    h("a", { class: "back", href: "#/news" }, icon("back", 15), tr("All news")),
    h("article", { class: "card post" },
      h("div", { class: "rc-top" }, n.pinned ? chip(tr("Pinned"), "pink") : null, chip(catName(NEWS_CATS, n.category), "mut")),
      h("h1", null, L(n.title)),
      h("div", { class: "byline" }, avatar(n.authorId, 28), h("span", null, nameOf(n.authorId), " · ", longDate((n.publishAt || n.publishedAt).slice(0, 10)))),
      h("div", { class: "body" }, paragraphs(L(n.body))),
      h("div", { class: "post-actions" },
        btn(liked ? tr("Liked") : tr("Like"), { kind: "pill" + (liked ? " on" : ""), icon: "heart", id: "news-like", pressed: liked, onclick: function () {
          put("reactions", { id: n.id + ":" + ME.id, newsId: n.id, userId: ME.id, deleted: liked ? true : undefined, at: nowISO() }); rerender();
        } }),
        reacts.length ? h("span", { class: "muted", title: reacts.map(function (r) { return nameOf(r.userId); }).join(", ") }, tr(reacts.length === 1 ? "1 like" : "{n} likes", { n: reacts.length })) : null,
        h("span", { class: "grow" }),
        isAdmin() ? [
          btn(n.pinned ? tr("Unpin") : tr("Pin"), { sm: true, icon: "pin", onclick: function () { n.pinned = !n.pinned; put("news", n); rerender(); } }),
          btn(tr("Edit"), { sm: true, icon: "edit", id: "news-edit", onclick: function () { editNews(n); } }),
          btn(tr("Delete"), { sm: true, kind: "danger-t", icon: "trash", onclick: function () { confirmBox(tr("Delete this post?"), tr("It disappears for everyone, with its likes and comments."), tr("Delete"), function () { remove("news", n.id); go("#/news"); toast(tr("Post deleted.")); }); } })] : null)),
    h("section", { class: "card comments", id: "comments" },
      h("h2", null, tr("Comments ({n})", { n: commentsOf(n.id).length })),
      commentsOf(n.id).map(function (c) {
        return h("div", { class: "comment" }, avatar(c.userId, 30), h("div", { class: "grow" },
          h("div", { class: "c-meta" }, h("b", null, nameOf(c.userId)), h("span", { class: "muted" }, ago(c.at)),
            c.userId === ME.id || isAdmin() ? h("button", { type: "button", class: "linklike", onclick: function () { remove("comments", c.id); rerender(); } }, tr("Delete")) : null),
          h("div", null, paragraphs(c.text))));
      }),
      h("div", { class: "comment new" }, avatar(ME, 30), h("div", { class: "grow col" }, box,
        h("div", null, btn(tr("Post comment"), { kind: "primary", sm: true, id: "comment-post", onclick: function () {
          if (!need(box, tr("Write something first."))) return;
          put("comments", { id: uid("cm"), newsId: n.id, userId: ME.id, text: box.value.trim(), at: nowISO() }); rerender();
        } }))))));
}
function editNews(n) {
  var isNew = !n;
  n = n ? JSON.parse(JSON.stringify(n)) : { id: uid("news"), category: "company", authorId: ME.id };
  var title = input({ value: L(n.title), id: "news-title", maxlength: 160 });
  var cat = select(trList(NEWS_CATS), n.category, { id: "news-cat" });
  var body = textarea({ value: L(n.body), rows: 10, id: "news-body" });
  var when = input({ type: "date", value: n.publishAt || "", id: "news-when" });
  var pin = checkbox(tr("Pin to the top"), !!n.pinned);
  var m = modal(isNew ? tr("New post") : tr("Edit post"), h("div", { class: "form" },
    field(tr("Title"), title), field(tr("Category"), cat),
    field(tr("Text"), body, tr("Leave a blank line between paragraphs.")),
    h("div", { class: "row2" }, field(tr("Publish on"), when, tr("Empty: now. A later date keeps the post hidden until then.")), h("div", { class: "field" }, h("label", null, "\u00a0"), pin.el))), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    btn(isNew ? tr("Publish") : tr("Save"), { kind: "primary", id: "news-save", onclick: function () {
      if (!need(title) || !need(body)) return;
      n.title = title.value.trim(); n.body = body.value.trim(); n.category = cat.value; n.pinned = pin.input.checked;
      n.publishAt = when.value || null;
      if (isNew) n.publishedAt = when.value ? when.value + "T08:00:00.000Z" : nowISO();
      put("news", n); m.close();
      if (isNew) go("#/news/" + n.id); else rerender();
      toast(isNew ? tr("Post published.") : tr("Saved."), "ok");
    } })], { wide: true });
}

/* =========================== events =========================== */
function timeText(e) {
  if (e.allDay) return tr("All day");
  return (e.start || "") + (e.end ? "–" + e.end : "");
}
function dateBlock(s) {
  var d = s2d(s);
  return h("div", { class: "dateblock", "aria-hidden": "true" }, h("small", null, monthName(d.getMonth()).slice(0, LANG === "he" ? 10 : 3)), h("b", null, String(d.getDate())), h("small", null, weekday(s)));
}
function eventRow(e) {
  var r = myRsvp(e.id), n = going(e.id).length;
  return h("a", { class: "row-card ev-row", href: "#/events/" + e.id },
    dateBlock(e.date),
    h("div", { class: "rc-main" },
      h("div", { class: "rc-top" }, chip(catName(EVENT_CATS, e.category), "mut"), r && !r.deleted ? chip(tr(RSVP_LABEL[r.status]), r.status === "going" ? "ok" : r.status === "maybe" ? "amber" : "mut") : null),
      h("b", null, L(e.title)),
      h("div", { class: "rc-meta" }, icon("clock", 13), " ", timeText(e), e.endDate && e.endDate !== e.date ? " · " + tr("until {d}", { d: shortDate(e.endDate) }) : "",
        e.location ? [" · ", icon("pinmap", 13), " ", L(e.location)] : null, " · ", tr(n === 1 ? "1 going" : "{n} going", { n: n }))));
}
var RSVP_LABEL = { going: "Going", maybe: "Maybe", no: "Can't go" };
function rsvpButtons(e) {
  var r = myRsvp(e.id), cur = r && !r.deleted ? r.status : "", n = going(e.id).length, full = e.capacity && n >= e.capacity && cur !== "going";
  var past = (e.endDate || e.date) < today();
  return h("div", { class: "rsvp", role: "group", "aria-label": tr("Will you come?") },
    ["going", "maybe", "no"].map(function (st) {
      return btn(tr(RSVP_LABEL[st]), { kind: "pill" + (cur === st ? " on" : ""), pressed: cur === st, id: "rsvp-" + st, disabled: past || (st === "going" && full),
        title: st === "going" && full ? tr("The event is full.") : null,
        onclick: function () {
          put("rsvps", { id: e.id + ":" + ME.id, eventId: e.id, userId: ME.id, status: st, at: nowISO() });
          toast(st === "going" ? tr("See you there!") : st === "maybe" ? tr("Marked as maybe.") : tr("Thanks for letting us know."), "ok"); rerender();
        } });
    }));
}
var eventsView = "list";
function pageEvents(view, month) {
  eventsView = view || "list";
  var head = pageHead(tr("Events"), tr("Company gatherings, training, wellbeing and holidays — say whether you're coming."),
    [h("div", { class: "seg", role: "group", "aria-label": tr("View") },
      link(tr("List"), "#/events", { sm: true, kind: eventsView === "list" ? "on" : "" }),
      link(tr("Calendar"), "#/events/calendar", { sm: true, kind: eventsView === "calendar" ? "on" : "", id: "events-calendar" })),
    isAdmin() ? btn(tr("New event"), { kind: "primary", icon: "plus", id: "event-new", onclick: function () { editEvent(null); } }) : null]);
  if (eventsView === "calendar") return h("div", null, head, calendar(month));
  var up = upcomingEvents(), past = eventsList().filter(function (e) { return (e.endDate || e.date) < today(); }).reverse();
  var groups = [], cur = null;
  up.forEach(function (e) {
    var k = e.date.slice(0, 7);
    if (!cur || cur.k !== k) { cur = { k: k, items: [] }; groups.push(cur); }
    cur.items.push(e);
  });
  return h("div", null, head,
    groups.length ? groups.map(function (g) {
      var d = s2d(g.k + "-01");
      return h("div", { class: "month" }, h("h2", { class: "month-h" }, monthName(d.getMonth()) + " " + d.getFullYear()), h("div", { class: "list" }, g.items.map(eventRow)));
    }) : empty(tr("Nothing planned yet.")),
    past.length ? h("details", { class: "past" }, h("summary", null, tr("Past events ({n})", { n: past.length })), h("div", { class: "list" }, past.slice(0, 30).map(eventRow))) : null);
}
function calendar(month) {
  var m = /^\d{4}-\d{2}$/.test(month || "") ? month : today().slice(0, 7);
  var first = s2d(m + "-01"), start = new Date(first); start.setDate(1 - first.getDay());
  var prev = new Date(first); prev.setMonth(prev.getMonth() - 1);
  var next = new Date(first); next.setMonth(next.getMonth() + 1);
  var ev = eventsList(), cells = [];
  for (var i = 0; i < 42; i++) {
    var d = new Date(start); d.setDate(start.getDate() + i);
    var ds = d2s(d), on = ev.filter(function (e) { return e.date <= ds && (e.endDate || e.date) >= ds; });
    cells.push(h("div", { class: "cal-cell" + (d.getMonth() !== first.getMonth() ? " out" : "") + (ds === today() ? " today" : "") },
      h("span", { class: "cal-d" }, String(d.getDate())),
      on.map(function (e) { return h("a", { class: "cal-ev c-" + e.category, href: "#/events/" + e.id, title: L(e.title) }, e.allDay ? "" : (e.start || "") + " ", L(e.title)); })));
  }
  return h("div", { class: "card cal" },
    h("div", { class: "cal-h" },
      link("", "#/events/calendar/" + d2s(prev).slice(0, 7), { sm: true, icon: LANG === "he" ? "chevr" : "chevl" }),
      h("h2", { id: "cal-title" }, monthName(first.getMonth()) + " " + first.getFullYear()),
      link("", "#/events/calendar/" + d2s(next).slice(0, 7), { sm: true, icon: LANG === "he" ? "chevl" : "chevr" }),
      h("span", { class: "grow" }), link(tr("Today"), "#/events/calendar", { sm: true })),
    h("div", { class: "cal-grid" }, WEEKDAYS[LANG].map(function (w) { return h("div", { class: "cal-wd" }, w); }), cells));
}
function pageEvent(id) {
  var e = byId(db.events, id);
  if (!e || e.deleted) return notFound(tr("This event was removed."), "#/events");
  var rs = rsvpsOf(e.id), by = function (st) { return rs.filter(function (r) { return r.status === st; }); };
  var who = function (list) { return list.length ? h("div", { class: "people-chips" }, list.map(function (r) { return h("span", { class: "pchip" }, avatar(r.userId, 22), nameOf(r.userId)); })) : h("p", { class: "muted" }, "—"); };
  var n = by("going").length;
  return h("div", { class: "reader" },
    h("a", { class: "back", href: "#/events" }, icon("back", 15), tr("All events")),
    h("article", { class: "card post event" },
      h("div", { class: "ev-head" }, dateBlock(e.date), h("div", null,
        h("div", { class: "rc-top" }, chip(catName(EVENT_CATS, e.category), "mut")),
        h("h1", null, L(e.title)))),
      h("dl", { class: "facts" },
        h("dt", null, tr("When")), h("dd", null, longDate(e.date), e.endDate && e.endDate !== e.date ? " – " + longDate(e.endDate) : "", " · ", timeText(e)),
        e.location ? [h("dt", null, tr("Where")), h("dd", null, L(e.location))] : null,
        e.link ? [h("dt", null, tr("Online")), h("dd", null, h("a", { href: e.link, target: "_blank", rel: "noopener noreferrer" }, tr("Join link")))] : null,
        h("dt", null, tr("Places")), h("dd", null, e.capacity ? tr("{n} of {c} taken", { n: n, c: e.capacity }) : tr("No limit")),
        h("dt", null, tr("Organizer")), h("dd", null, nameOf(e.createdBy))),
      h("div", { class: "body" }, paragraphs(L(e.description))),
      h("div", { class: "post-actions" }, rsvpButtons(e), h("span", { class: "grow" }),
        btn(tr("Add to my calendar"), { sm: true, icon: "download", id: "event-ics", onclick: function () { download(safeFile(L(e.title)) + ".ics", ics(e), "text/calendar"); } }),
        isAdmin() ? [
          btn(tr("Edit"), { sm: true, icon: "edit", id: "event-edit", onclick: function () { editEvent(e); } }),
          btn(tr("Delete"), { sm: true, kind: "danger-t", icon: "trash", onclick: function () { confirmBox(tr("Delete this event?"), tr("It disappears for everyone, with the replies."), tr("Delete"), function () { remove("events", e.id); go("#/events"); toast(tr("Event deleted.")); }); } })] : null)),
    h("section", { class: "card", id: "attendees" },
      h("h2", null, tr("Going ({n})", { n: n })), who(by("going")),
      h("h3", null, tr("Maybe ({n})", { n: by("maybe").length })), who(by("maybe")),
      isAdmin() ? [h("h3", null, tr("Can't go ({n})", { n: by("no").length })), who(by("no")),
        btn(tr("Download the list (CSV)"), { sm: true, icon: "download", onclick: function () {
          download(safeFile(L(e.title)) + ".csv", "\ufeff" + [["Name", "Email", "Reply"].join(",")].concat(rs.map(function (r) { var u = person(r.userId); return [csvCell(u ? u.fullName : r.userId), csvCell(u ? u.email : ""), r.status].join(","); })).join("\n"), "text/csv");
        } })] : null));
}
function safeFile(s) { return String(s || "event").replace(/[\\/:*?"<>|]+/g, "").slice(0, 60) || "event"; }
/* an iCalendar file: Outlook, Google and Apple calendars open it */
function ics(e) {
  var dt = function (d, t) { return d.replace(/-/g, "") + (t ? "T" + t.replace(":", "") + "00" : ""); };
  var txt = function (s) { return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&"); };
  var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GALIL//Employee Portal HR//EN", "BEGIN:VEVENT", "UID:" + e.id + "@galiltc.co.il", "DTSTAMP:" + nowISO().replace(/[-:]/g, "").replace(/\.\d+/, "")];
  if (e.allDay || !e.start) lines.push("DTSTART;VALUE=DATE:" + dt(e.date), "DTEND;VALUE=DATE:" + dt(addDays(e.endDate || e.date, 1)));
  else lines.push("DTSTART:" + dt(e.date, e.start), "DTEND:" + dt(e.endDate || e.date, e.end || e.start));
  lines.push("SUMMARY:" + txt(L(e.title)), "DESCRIPTION:" + txt(L(e.description) + (e.link ? "\n" + e.link : "")), "LOCATION:" + txt(L(e.location)), "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
function editEvent(e) {
  var isNew = !e;
  e = e ? JSON.parse(JSON.stringify(e)) : { id: uid("ev"), category: "company", date: addDays(today(), 7), start: "09:00", end: "10:00", createdBy: ME.id };
  var title = input({ value: L(e.title), id: "ev-title" });
  var cat = select(trList(EVENT_CATS), e.category, { id: "ev-cat" });
  var date = input({ type: "date", value: e.date, id: "ev-date" }), endDate = input({ type: "date", value: e.endDate || "", id: "ev-end-date" });
  var allDay = checkbox(tr("All day"), !!e.allDay, { id: "ev-allday" });
  var start = input({ type: "time", value: e.start || "", id: "ev-start" }), end = input({ type: "time", value: e.end || "", id: "ev-end" });
  var times = h("div", { class: "row2" }, field(tr("Starts"), start), field(tr("Ends"), end));
  var sync = function () { times.hidden = allDay.input.checked; };
  allDay.input.addEventListener("change", sync); sync();
  var loc = input({ value: L(e.location), id: "ev-loc" }), lk = input({ type: "url", value: e.link || "", id: "ev-link", placeholder: "https://", dir: "ltr" });
  var cap = input({ type: "number", min: 0, value: e.capacity || "", id: "ev-cap" });
  var desc = textarea({ value: L(e.description), rows: 6, id: "ev-desc" });
  var m = modal(isNew ? tr("New event") : tr("Edit event"), h("div", { class: "form" },
    field(tr("Title"), title),
    h("div", { class: "row2" }, field(tr("Category"), cat), field(tr("Places"), cap, tr("Empty: no limit."))),
    h("div", { class: "row2" }, field(tr("Date"), date), field(tr("Last day"), endDate, tr("For events of more than one day."))),
    allDay.el, times,
    h("div", { class: "row2" }, field(tr("Where"), loc), field(tr("Online meeting link"), lk)),
    field(tr("Description"), desc)), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    btn(isNew ? tr("Create event") : tr("Save"), { kind: "primary", id: "ev-save", onclick: function () {
      if (!need(title) || !need(date)) return;
      if (endDate.value && endDate.value < date.value) { toast(tr("The last day comes before the first."), "err"); endDate.focus(); return; }
      e.title = title.value.trim(); e.category = cat.value; e.date = date.value; e.endDate = endDate.value || null;
      e.allDay = allDay.input.checked; e.start = e.allDay ? "" : start.value; e.end = e.allDay ? "" : end.value;
      e.location = loc.value.trim(); e.link = lk.value.trim(); e.capacity = Number(cap.value) || 0; e.description = desc.value.trim();
      put("events", e); m.close();
      if (isNew) go("#/events/" + e.id); else rerender();
      toast(isNew ? tr("Event created.") : tr("Saved."), "ok");
    } })], { wide: true });
}

/* =========================== people =========================== */
var peopleQuery = "", peopleDept = "";
function pageDirectory() {
  var all = people().sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
  var depts = all.map(function (u) { return u.department; }).filter(function (d, i, a) { return d && a.indexOf(d) === i; }).sort();
  var q = input({ type: "search", value: peopleQuery, placeholder: tr("Search by name, role or department"), id: "people-q", "aria-label": tr("Search by name, role or department") });
  var dsel = select([["", tr("Every department")]].concat(depts.map(function (d) { return [d, d]; })), peopleDept, { id: "people-dept", "aria-label": tr("Department") });
  var grid = h("div", { class: "people", id: "people-grid" });
  var fill = function () {
    var t = q.value.trim().toLowerCase();
    peopleQuery = q.value; peopleDept = dsel.value;
    var list = all.filter(function (u) {
      return (!dsel.value || u.department === dsel.value) && (!t || [u.fullName, u.fullNameHe, u.jobTitle, u.department, u.email].join(" ").toLowerCase().indexOf(t) >= 0);
    });
    grid.innerHTML = "";
    if (!list.length) grid.appendChild(empty(tr("No one matches.")));
    list.forEach(function (u) { grid.appendChild(personCard(u)); });
  };
  q.addEventListener("input", fill); dsel.addEventListener("change", fill); fill();
  var cel = celebrations(30);
  return h("div", null,
    pageHead(tr("People"), tr("{n} people at GALIL. Names, roles and how to reach them come from WorkDesk.", { n: all.length })),
    cel.length ? section(tr("Celebrations in the next 30 days"), null, h("ul", { class: "cel row" }, cel.map(celebrationRow))) : null,
    h("div", { class: "filters" }, q, dsel), grid);
}
function personCard(u) {
  var mgr = u.managerId ? person(u.managerId) : null, b = !u.hideBirthday && /^\d{4}-(\d{2})-(\d{2})$/.exec(u.dob || "");
  return h("div", { class: "card pcard" },
    h("div", { class: "pc-top" }, avatar(u, 46), h("div", null, h("b", null, nameOf(u)), h("span", { class: "muted" }, u.jobTitle || ""))),
    h("dl", { class: "facts sm" },
      u.department ? [h("dt", null, tr("Department")), h("dd", null, u.department)] : null,
      mgr ? [h("dt", null, tr("Reports to")), h("dd", null, nameOf(mgr))] : null,
      h("dt", null, tr("Email")), h("dd", null, h("a", { href: "mailto:" + u.email, dir: "ltr" }, u.email)),
      u.mobile ? [h("dt", null, tr("Mobile")), h("dd", null, h("a", { href: "tel:" + u.mobile, dir: "ltr" }, u.mobile))] : null,
      b ? [h("dt", null, tr("Birthday")), h("dd", null, b[2] + "/" + b[1])] : null,
      u.startDate && u.employmentType !== "contractor" ? [h("dt", null, tr("At GALIL since")), h("dd", null, shortDate(u.startDate))] : null),
    u.id !== ME.id ? btn(tr("Say thanks"), { sm: true, icon: "kudos", onclick: function () { giveKudos(u.id); } }) : null);
}

/* =========================== recognition =========================== */
var kudosFilter = "all";
function kudosCard(k) {
  return h("div", { class: "kudos" },
    h("div", { class: "kd-top" }, avatar(k.from, 28), h("span", null, h("b", null, nameOf(k.from)), " → ", h("b", null, nameOf(k.to))), chip(catName(KUDOS_VALUES, k.value), "pink")),
    h("p", null, k.text),
    h("div", { class: "rc-meta" }, ago(k.at),
      k.from === ME.id || isAdmin() ? h("button", { type: "button", class: "linklike", onclick: function () { confirmBox(tr("Remove these kudos?"), tr("They disappear for everyone."), tr("Remove"), function () { remove("kudos", k.id); rerender(); }); } }, tr("Remove")) : null));
}
function pageKudos() {
  var all = kudosList(), list = all.filter(function (k) { return kudosFilter === "all" || (kudosFilter === "mine" ? k.to === ME.id : k.from === ME.id); });
  var month = today().slice(0, 7), thisMonth = all.filter(function (k) { return k.at.slice(0, 7) === month; });
  var counts = {};
  thisMonth.forEach(function (k) { counts[k.to] = (counts[k.to] || 0) + 1; });
  var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
  return h("div", null,
    pageHead(tr("Recognition"), tr("Thank a colleague for their help — everyone sees it."),
      btn(tr("Give kudos"), { kind: "primary", icon: "kudos", id: "kudos-new", onclick: function () { giveKudos(null); } })),
    h("div", { class: "grid2 wide-first" },
      h("div", null,
        h("div", { class: "filters", role: "group" }, [["all", tr("Everyone")], ["mine", tr("For me")], ["sent", tr("From me")]].map(function (f) {
          return btn(f[1], { kind: "pill", sm: true, pressed: kudosFilter === f[0], onclick: function () { kudosFilter = f[0]; rerender(); } });
        })),
        list.length ? h("div", { class: "list", id: "kudos-list" }, list.map(kudosCard)) : empty(tr("No kudos yet — be the first."))),
      section(tr("This month"), null, h("div", null,
        h("p", { class: "big" }, String(thisMonth.length)), h("p", { class: "muted" }, tr("kudos given this month")),
        top.length ? h("ol", { class: "top" }, top.map(function (id) { return h("li", null, avatar(id, 24), h("span", { class: "grow" }, nameOf(id)), h("b", null, String(counts[id]))); })) : null))));
}
function giveKudos(toId) {
  var others = people().filter(function (u) { return u.id !== ME.id; }).sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
  var to = select([["", tr("Choose a colleague")]].concat(others.map(function (u) { return [u.id, nameOf(u)]; })), toId || "", { id: "kd-to" });
  var val = select(trList(KUDOS_VALUES), "teamwork", { id: "kd-value" });
  var text = textarea({ rows: 4, id: "kd-text", placeholder: tr("What did they do, and how did it help?") });
  var m = modal(tr("Give kudos"), h("div", { class: "form" }, field(tr("To"), to), field(tr("For"), val), field(tr("Message"), text)), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    btn(tr("Send"), { kind: "primary", id: "kd-send", onclick: function () {
      if (!need(to, tr("Choose a colleague.")) || !need(text, tr("Write a short message."))) return;
      put("kudos", { id: uid("kd"), from: ME.id, to: to.value, value: val.value, text: text.value.trim(), at: nowISO() });
      m.close(); toast(tr("Kudos sent to {name}.", { name: nameOf(to.value) }), "ok");
      if (route().split("/")[0] === "kudos" || route() === "") rerender(); else go("#/kudos");
    } })]);
}

function notFound(text, back) { return h("div", { class: "reader" }, h("a", { class: "back", href: back }, icon("back", 15), tr("Back")), empty(text)); }
