/* =====================================================================
   GALIL HR — the content HR starts with: a few news posts, events in the
   coming weeks, surveys, this year's review cycle and some kudos, in
   English and Hebrew. Ids are fixed, so two devices that start the shared
   file at the same moment add the same records, not twice as many. Dates
   are counted from today. Every record carries demo: true.
   ===================================================================== */
"use strict";

function seedDemo(d) {
  var T0 = "2000-01-01T00:00:00.000Z", t = today(), y = new Date().getFullYear();
  var has = function (id) { var u = person(id); return u && u.isActive; };
  var add = function (coll, rec) { rec.demo = true; rec.updatedAt = T0; d[coll].push(rec); };
  var dayISO = function (n, hh) { return addDays(t, n) + "T" + (hh || "08") + ":30:00.000Z"; };
  var hrId = has("u-office") ? "u-office" : "u-tamir";

  /* ---------- news ---------- */
  add("news", { id: "demo-news-welcome", category: "hr", pinned: true, authorId: hrId, publishedAt: dayISO(-1),
    title: { en: "Welcome to HR in the Employee Portal", he: "ברוכים הבאים למשאבי אנוש בפורטל העובדים" },
    body: { en: "Everything people-related at GALIL now has one home.\n\nHere you'll find company news, upcoming events (tell us if you're coming), surveys, your performance review, the people directory with birthdays and work anniversaries, and a place to thank a colleague.\n\nQuestions or ideas? Write to the office, or leave a comment below.",
      he: "לכל מה שקשור לאנשים בגליל יש עכשיו בית אחד.\n\nכאן תמצאו את חדשות החברה, את האירועים הקרובים (ספרו לנו אם אתם מגיעים), סקרים, את הערכת הביצועים שלכם, את ספר העובדים עם ימי ההולדת ושנות הוותק, ומקום להגיד תודה לעמית.\n\nשאלות או רעיונות? כתבו למשרד, או השאירו תגובה כאן למטה." } });
  add("news", { id: "demo-news-iso", category: "achievement", authorId: has("u-inon") ? "u-inon" : hrId, publishedAt: dayISO(-4),
    title: { en: "ISO 9001 recertification: passed with no findings", he: "חידוש הסמכת ISO 9001: עברנו ללא ממצאים" },
    body: { en: "Last week's external audit of our documentation process ended with no non-conformities — the second year running.\n\nThank you to every writer and client manager who kept the work-order records, reviews and version history in order. It shows.",
      he: "הביקורת החיצונית על תהליך התיעוד שלנו הסתיימה בשבוע שעבר ללא אי־התאמות — זו השנה השנייה ברציפות.\n\nתודה לכל הכותבים ומנהלי הלקוחות ששמרו על רשומות הזמנות העבודה, הסקירות והיסטוריית הגרסאות בסדר מופתי. זה ניכר." } });
  add("news", { id: "demo-news-benefits", category: "hr", authorId: hrId, publishedAt: dayISO(-9),
    title: { en: "Annual benefits review: what's changing in January", he: "סקירת ההטבות השנתית: מה משתנה בינואר" },
    body: { en: "From January, the study fund contribution rises for everyone with two or more years at GALIL, and the yearly professional-development budget goes up to ₪3,000 per person.\n\nThe wellbeing allowance (gym, sport, therapy) stays as it is. The office will send each of you the details by email.",
      he: "מינואר עולה ההפרשה לקרן ההשתלמות לכל מי שנמצא בגליל שנתיים או יותר, ותקציב ההתפתחות המקצועית השנתי עולה ל-3,000 ₪ לאדם.\n\nתקציב הרווחה (חדר כושר, ספורט, טיפולים) נשאר כפי שהוא. המשרד ישלח לכל אחד ואחת את הפרטים במייל." } });
  add("news", { id: "demo-news-quarter", category: "company", authorId: has("u-tamir") ? "u-tamir" : hrId, publishedAt: dayISO(-15),
    title: { en: "From the CEO: a strong quarter, and two new clients", he: "מהמנכ\"ל: רבעון חזק ושני לקוחות חדשים" },
    body: { en: "We closed the quarter ahead of plan, with two new long-term clients in the Defense Division and a busy pipeline in the Civil Division.\n\nMore at the all-hands meeting. Until then — thank you for the care you put into every manual.",
      he: "סגרנו את הרבעון מעל התוכנית, עם שני לקוחות חדשים לטווח ארוך בחטיבת הביטחון וצנרת עבודה עמוסה בחטיבה האזרחית.\n\nעוד פרטים בכנס החברה. עד אז — תודה על ההקפדה שאתם משקיעים בכל מדריך." } });

  add("reactions", { id: "demo-news-welcome:u-danny", newsId: "demo-news-welcome", userId: "u-danny", at: dayISO(-1, "10") });
  add("reactions", { id: "demo-news-welcome:u-kfir", newsId: "demo-news-welcome", userId: "u-kfir", at: dayISO(-1, "11") });
  add("reactions", { id: "demo-news-iso:u-tamir", newsId: "demo-news-iso", userId: "u-tamir", at: dayISO(-4, "09") });
  add("reactions", { id: "demo-news-iso:u-ranit", newsId: "demo-news-iso", userId: "u-ranit", at: dayISO(-4, "10") });
  add("reactions", { id: "demo-news-iso:u-eitan", newsId: "demo-news-iso", userId: "u-eitan", at: dayISO(-3, "10") });
  add("comments", { id: "demo-cm-1", newsId: "demo-news-iso", userId: "u-ranit", text: "Great work, everyone!", at: dayISO(-4, "11") });
  add("comments", { id: "demo-cm-2", newsId: "demo-news-welcome", userId: "u-kfir", text: "Finally — one place for all of it. 👏", at: dayISO(-1, "12") });

  /* ---------- events ---------- */
  var ev = function (id, n, o) { o.id = id; o.date = addDays(t, n); o.createdBy = o.createdBy || hrId; add("events", o); };
  ev("demo-ev-breakfast", 3, { category: "social", start: "08:30", end: "09:30", capacity: 0,
    title: { en: "Team breakfast", he: "ארוחת בוקר צוותית" }, location: { en: "Office kitchen", he: "המטבח במשרד" },
    description: { en: "Shakshuka, fresh bread and coffee. Come say good morning.", he: "שקשוקה, לחם טרי וקפה. בואו להגיד בוקר טוב." } });
  ev("demo-ev-word", 8, { category: "training", start: "10:00", end: "12:00", capacity: 12, link: "https://teams.microsoft.com/",
    title: { en: "Workshop: long documents in Word", he: "סדנה: מסמכים ארוכים ב-Word" }, location: { en: "Meeting room and Teams", he: "חדר הישיבות וב-Teams" },
    description: { en: "Styles, multilevel numbering, captions and cross-references — the Knowledge Base course, hands on. Bring a laptop.", he: "סגנונות, מספור רב־רמות, כיתובים והפניות — הקורס ממאגר הידע, הלכה למעשה. הביאו מחשב נייד." } });
  ev("demo-ev-wellbeing", 14, { category: "wellbeing", start: "16:00", end: "17:00", capacity: 20,
    title: { en: "Back care for desk workers", he: "שמירה על הגב לעובדי משרד" }, location: { en: "Meeting room", he: "חדר הישיבות" },
    description: { en: "A physiotherapist shows simple exercises and how to set up your desk and chair.", he: "פיזיותרפיסטית מראה תרגילים פשוטים ואיך לכוונן נכון שולחן וכיסא." } });
  ev("demo-ev-allhands", 21, { category: "company", start: "15:00", end: "16:30", capacity: 0, link: "https://teams.microsoft.com/",
    title: { en: "Quarterly all-hands", he: "כנס חברה רבעוני" }, location: { en: "Office and Teams", he: "במשרד וב-Teams" },
    description: { en: "The quarter's results, the plan for the next one, and questions to management.", he: "תוצאות הרבעון, התוכנית לרבעון הבא ושאלות להנהלה." } });
  ev("demo-ev-party", 45, { category: "social", start: "19:00", end: "23:00", capacity: 60,
    title: { en: "Year-end party", he: "מסיבת סוף שנה" }, location: { en: "To be announced", he: "יפורסם בהמשך" },
    description: { en: "Partners welcome. Vote for the date in the survey.", he: "בני ובנות זוג מוזמנים. הצביעו על התאריך בסקר." } });
  ev("demo-ev-trip", -20, { category: "social", allDay: true, start: "", end: "", capacity: 0,
    title: { en: "Company trip to the Galilee", he: "טיול חברה לגליל" }, location: { en: "Upper Galilee", he: "הגליל העליון" },
    description: { en: "Hiking, kayaking on the Jordan and dinner together.", he: "הליכה, קיאקים בירדן וארוחת ערב משותפת." } });
  ["u-kfir", "u-ranit", "u-inbar", "u-paul", "u-niv"].forEach(function (u) { add("rsvps", { id: "demo-ev-breakfast:" + u, eventId: "demo-ev-breakfast", userId: u, status: "going", at: dayISO(-1) }); });
  ["u-dennis", "u-shoshana", "u-yosi"].forEach(function (u) { add("rsvps", { id: "demo-ev-word:" + u, eventId: "demo-ev-word", userId: u, status: "going", at: dayISO(-2) }); });
  add("rsvps", { id: "demo-ev-word:u-amy", eventId: "demo-ev-word", userId: "u-amy", status: "maybe", at: dayISO(-2) });
  ["u-tamir", "u-inon", "u-danny", "u-kfir", "u-reuben"].forEach(function (u) { add("rsvps", { id: "demo-ev-allhands:" + u, eventId: "demo-ev-allhands", userId: u, status: "going", at: dayISO(-3) }); });

  /* ---------- surveys ---------- */
  add("surveys", { id: "demo-sv-engagement", status: "open", anonymous: true, showResults: false, closes: addDays(t, 14), createdBy: hrId, createdAt: dayISO(-6),
    title: { en: "Employee engagement survey " + y, he: "סקר מעורבות עובדים " + y },
    description: { en: "Ten minutes, anonymous. Tell us honestly how it is to work at GALIL — we read every answer.", he: "עשר דקות, אנונימי. ספרו לנו בכנות איך זה לעבוד בגליל — אנחנו קוראים כל תשובה." },
    questions: [
      { id: "q1", type: "rating", required: true, text: { en: "How satisfied are you with your work at GALIL?", he: "עד כמה את/ה מרוצה מהעבודה בגליל?" }, options: [] },
      { id: "q2", type: "nps", required: true, text: { en: "How likely are you to recommend GALIL as a place to work?", he: "מה הסיכוי שתמליצ/י על גליל כמקום עבודה?" }, options: [] },
      { id: "q3", type: "choice", required: true, text: { en: "Where do you work best?", he: "איפה את/ה עובד/ת הכי טוב?" },
        options: [{ en: "At the office", he: "במשרד" }, { en: "From home", he: "מהבית" }, { en: "A mix of both", he: "שילוב של השניים" }] },
      { id: "q4", type: "multi", required: false, text: { en: "Which benefits matter most to you?", he: "אילו הטבות הכי חשובות לך?" },
        options: [{ en: "Professional development budget", he: "תקציב להתפתחות מקצועית" }, { en: "Flexible hours", he: "שעות גמישות" }, { en: "Wellbeing allowance", he: "תקציב רווחה" }, { en: "Team events", he: "אירועי צוות" }, { en: "Study fund", he: "קרן השתלמות" }] },
      { id: "q5", type: "text", required: false, text: { en: "If you could change one thing at GALIL, what would it be?", he: "אם היית יכול/ה לשנות דבר אחד בגליל, מה זה היה?" }, options: [] }] });
  [[4, 9, 2, [0, 1], "More time for training."], [5, 10, 2, [1, 4], ""], [4, 8, 0, [0, 3], "A second monitor for everyone."], [3, 6, 1, [1], "Fewer meetings on Sunday."], [5, 9, 2, [0, 2, 4], ""], [4, 7, 2, [1, 3], "Clearer career paths."]].forEach(function (a, i) {
    add("responses", { id: "demo-rs-eng-" + i, surveyId: "demo-sv-engagement", month: t.slice(0, 7), answers: { q1: a[0], q2: a[1], q3: a[2], q4: a[3], q5: a[4] || undefined } });
  });
  ["u-kfir", "u-ranit", "u-inbar", "u-paul", "u-reuben", "u-niv"].forEach(function (u) { add("taken", { id: "demo-sv-engagement:" + u, surveyId: "demo-sv-engagement", userId: u }); });

  add("surveys", { id: "demo-sv-party", status: "open", anonymous: false, showResults: true, closes: addDays(t, 7), createdBy: hrId, createdAt: dayISO(-2),
    title: { en: "Year-end party: pick the evening", he: "מסיבת סוף שנה: בחרו את הערב" },
    description: { en: "One question. The most popular evening wins.", he: "שאלה אחת. הערב הפופולרי ביותר מנצח." },
    questions: [{ id: "q1", type: "choice", required: true, text: { en: "Which evening suits you?", he: "איזה ערב מתאים לך?" },
      options: [{ en: "Wednesday", he: "רביעי" }, { en: "Thursday", he: "חמישי" }, { en: "Either is fine", he: "שניהם מתאימים" }] }] });
  [["u-kfir", 1], ["u-tamir", 1], ["u-amy", 0], ["u-penina", 2]].forEach(function (a) {
    add("responses", { id: "demo-rs-party-" + a[0], surveyId: "demo-sv-party", userId: a[0], at: dayISO(-1), answers: { q1: a[1] } });
    add("taken", { id: "demo-sv-party:" + a[0], surveyId: "demo-sv-party", userId: a[0] });
  });

  add("surveys", { id: "demo-sv-hybrid", status: "closed", anonymous: true, showResults: true, closes: addDays(t, -30), createdBy: hrId, createdAt: dayISO(-60),
    title: { en: "Hybrid work pilot: how did it go?", he: "פיילוט העבודה ההיברידית: איך היה?" },
    description: { en: "Thank you to everyone who answered. The pilot becomes the policy from next month.", he: "תודה לכל מי שענה. הפיילוט הופך למדיניות מהחודש הבא." },
    questions: [{ id: "q1", type: "rating", required: true, text: { en: "How well did two home days a week work for you?", he: "עד כמה התאימו לך יומיים בשבוע מהבית?" }, options: [] }] });
  [5, 4, 4, 5, 3, 5, 4, 4, 5, 2].forEach(function (v, i) { add("responses", { id: "demo-rs-hyb-" + i, surveyId: "demo-sv-hybrid", month: addDays(t, -40).slice(0, 7), answers: { q1: v } }); });
  ["u-tamir", "u-inon", "u-kfir", "u-ranit", "u-danny", "u-eitan", "u-daniel", "u-amy", "u-niv", "u-paul"].forEach(function (u) { add("taken", { id: "demo-sv-hybrid:" + u, surveyId: "demo-sv-hybrid", userId: u }); });

  /* ---------- this year's review cycle ---------- */
  var cyc = { id: "demo-cycle", status: "open", from: y + "-01-01", to: y + "-12-31", selfDue: addDays(t, 14), managerDue: addDays(t, 30), createdBy: hrId,
    title: { en: y + " annual review", he: "הערכה שנתית " + y },
    competencies: DEFAULT_COMPETENCIES.map(function (k, i) { return { id: "k" + (i + 1), name: k }; }) };
  add("cycles", cyc);
  var rate = function (base) { var o = {}; cyc.competencies.forEach(function (k, i) { o[k.id] = Math.max(1, Math.min(5, base + ((i % 3) - 1))); }); return o; };
  people().filter(function (u) { return u.role !== "EXT" && u.managerId; }).forEach(function (u, i) {
    var r = { id: "demo-rv-" + u.id, cycleId: cyc.id, employeeId: u.id, managerId: u.managerId, status: "self", self: { ratings: {}, notes: {} }, mgr: { ratings: {}, notes: {} } };
    /* a few reviews further along, so every step can be seen */
    var stage = u.id === "u-daniel" || u.id === "u-inbar" ? "manager" : u.id === "u-dennis" ? "shared" : u.id === "u-penina" ? "done" : "self";
    if (stage !== "self") {
      r.self = { ratings: rate(4), notes: {}, achievements: "Delivered the client's maintenance manual set on time; mentored a new writer.", goals: "Learn DITA and structured authoring." };
      r.selfAt = dayISO(-5);
    }
    if (stage === "shared" || stage === "done") {
      r.mgr = { ratings: rate(4), notes: {}, strengths: "Careful, reliable and calm under deadline pressure.", develop: "Speak up earlier when a schedule is at risk.", overall: 4, goals: "Lead one client project end to end next year." };
      r.sharedAt = dayISO(-2);
    }
    if (stage === "done") r.ack = { at: dayISO(-1), comment: "Thank you — a fair review." };
    r.status = stage;
    add("reviews", r);
  });

  /* ---------- kudos ---------- */
  add("kudos", { id: "demo-kd-1", from: "u-danny", to: "u-eitan", value: "ownership", text: "Took over the IPC update at a day's notice and delivered it clean. Thank you!", at: dayISO(-2, "14") });
  add("kudos", { id: "demo-kd-2", from: "u-ranit", to: "u-paul", value: "helping", text: "Stayed late to help me get the translation package out to the client.", at: dayISO(-6, "17") });
  add("kudos", { id: "demo-kd-3", from: "u-kfir", to: "u-shoshana", value: "quality", text: "The client said it was the best-structured manual they've received.", at: dayISO(-10, "12") });

  d.seededAt = nowISO();
  /* records for people who aren't in WorkDesk (a smaller team) are left out */
  ["reactions", "comments", "rsvps", "taken", "kudos"].forEach(function (k) {
    d[k] = d[k].filter(function (r) { return [r.userId, r.from, r.to].filter(Boolean).every(function (id) { return person(id); }); });
  });
  d.responses = d.responses.filter(function (r) { return !r.userId || person(r.userId); });
  return d;
}
