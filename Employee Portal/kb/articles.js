/* =====================================================================
   GALIL Knowledge Base — the articles, in English and Hebrew.
   Each article: id, cat, updated, and title / summary / body as
   { en, he }. Bodies are HTML. Links between articles use #/<id>.
   Add or edit an entry here to change the content.
   ===================================================================== */
"use strict";
var CATS = [
  { k: "onboarding", icon: "👋", title: { en: "Onboarding", he: "קליטה" }, desc: { en: "Your first days and weeks at GALIL.", he: "הימים והשבועות הראשונים שלך בגליל." } },
  { k: "portal", icon: "🧭", title: { en: "The Employee Portal", he: "פורטל העובדים" }, desc: { en: "WorkDesk, Taskana, the Handbook and this Knowledge Base — one sign-in.", he: "WorkDesk, ‏Taskana, המדריך למשתמש ומאגר הידע הזה — כניסה אחת." } },
  { k: "rules", icon: "📜", title: { en: "Company rules", he: "כללי החברה" }, desc: { en: "Policies every employee is expected to follow.", he: "נהלים שכל עובד ועובדת מצופים לפעול לפיהם." } },
  { k: "training", icon: "🎓", title: { en: "Training & how-to's", he: "הדרכות ומדריכים" }, desc: { en: "Step-by-step guides for the tools we use.", he: "מדריכים צעד אחר צעד לכלים שאנחנו עובדים איתם." } }
];

var ARTICLES = [
/* ======================= Onboarding ======================= */
{ id: "welcome", cat: "onboarding", updated: "16 Oct 2026",
  title: { en: "Welcome to GALIL", he: "ברוכים הבאים לגליל" },
  summary: { en: "Who we are, what we do and how the company is organised.", he: "מי אנחנו, מה אנחנו עושים ואיך החברה בנויה." },
  body: {
  en:
  '<p class="lede">Welcome aboard! This article gives you the big picture — what GALIL does, how we are organised, and where to go for help.</p>' +
  '<h2>What we do</h2>' +
  '<p>GALIL delivers technical documentation, training and instructional content for engineering and technology clients. Our work is organised around <strong>clients</strong>, their <strong>projects</strong>, and the <strong>work orders</strong> that fund them. Day to day, the work itself is broken down into <strong>tasks</strong>.</p>' +
  '<h2>How we are organised</h2>' +
  '<table><thead><tr><th>Role</th><th>What they do</th></tr></thead><tbody>' +
  '<tr><td>CEO / Owner</td><td>Company direction, final approvals and company settings.</td></tr>' +
  '<tr><td>Operations Manager</td><td>Runs day-to-day operations across all clients, people and master lists — and decides who can use which part of the Employee Portal.</td></tr>' +
  '<tr><td>Project Manager</td><td>Owns projects, work orders, budgets and assignments.</td></tr>' +
  '<tr><td>Team Lead</td><td>Leads a team, plans its tasks and approves the team\'s time, leave and expenses.</td></tr>' +
  '<tr><td>Senior Employee / Employee</td><td>Technical writers, trainers and specialists who deliver the work.</td></tr>' +
  '<tr><td>Finance</td><td>Budgets, invoicing, expense reimbursement and payroll inputs.</td></tr>' +
  '</tbody></table>' +
  '<h2>Who to ask</h2>' +
  '<ul><li><strong>Your Team Lead</strong> — your first stop for anything about your work, tasks and schedule.</li>' +
  '<li><strong>Operations</strong> — accounts, portal access, equipment and HR questions.</li>' +
  '<li><strong>Finance</strong> — expenses, reimbursements and payslips.</li></ul>' +
  '<div class="callout tip"><b>Tip:</b> Start with <a href="#/first-week">Your first week checklist</a> — it links to everything else you need.</div>',
  he:
  '<p class="lede">ברוכים הבאים! המאמר הזה נותן את התמונה הכללית — מה גליל עושה, איך אנחנו בנויים ולאן פונים כשצריך עזרה.</p>' +
  '<h2>מה אנחנו עושים</h2>' +
  '<p>גליל מספקת תיעוד טכני, הדרכה ותוכן לימודי ללקוחות בתחומי ההנדסה והטכנולוגיה. העבודה שלנו מאורגנת סביב <strong>לקוחות</strong>, <strong>הפרויקטים</strong> שלהם ו<strong>הזמנות העבודה</strong> שמממנות אותם. ביום־יום, העבודה עצמה מחולקת ל<strong>משימות</strong>.</p>' +
  '<h2>איך אנחנו בנויים</h2>' +
  '<table><thead><tr><th>תפקיד</th><th>מה עושים</th></tr></thead><tbody>' +
  '<tr><td>מנכ"ל / בעלים</td><td>הכוונת החברה, אישורים סופיים והגדרות החברה.</td></tr>' +
  '<tr><td>מנהל/ת תפעול</td><td>מנהל/ת את התפעול השוטף של כל הלקוחות, האנשים והרשימות — ומחליט/ה מי משתמש באיזה חלק של פורטל העובדים.</td></tr>' +
  '<tr><td>מנהל/ת פרויקט</td><td>אחראי/ת על פרויקטים, הזמנות עבודה, תקציבים ושיבוצים.</td></tr>' +
  '<tr><td>ראש צוות</td><td>מוביל/ה צוות, מתכנן/ת את המשימות שלו ומאשר/ת את השעות, ההיעדרויות וההוצאות של הצוות.</td></tr>' +
  '<tr><td>עובד/ת, עובד/ת בכיר/ה</td><td>כותבים טכניים, מדריכים ומומחים שמבצעים את העבודה.</td></tr>' +
  '<tr><td>כספים</td><td>תקציבים, חשבוניות, החזרי הוצאות ונתונים לשכר.</td></tr>' +
  '</tbody></table>' +
  '<h2>למי פונים</h2>' +
  '<ul><li><strong>ראש הצוות שלך</strong> — הכתובת הראשונה לכל שאלה על העבודה, המשימות ולוח הזמנים.</li>' +
  '<li><strong>התפעול</strong> — חשבונות, גישה לפורטל, ציוד ושאלות משאבי אנוש.</li>' +
  '<li><strong>כספים</strong> — הוצאות, החזרים ותלושי שכר.</li></ul>' +
  '<div class="callout tip"><b>טיפ:</b> התחילו ב<a href="#/first-week">רשימת המשימות לשבוע הראשון</a> — יש בה קישורים לכל מה שצריך.</div>'
  } },

{ id: "first-week", cat: "onboarding", updated: "18 Oct 2026",
  title: { en: "Your first week checklist", he: "רשימת משימות לשבוע הראשון" },
  summary: { en: "Everything to set up and read during your first five working days.", he: "כל מה שצריך להגדיר ולקרוא בחמשת ימי העבודה הראשונים." },
  body: {
  en:
  '<p class="lede">Work through this list during your first week. Your Team Lead will check in with you at the end of the week.</p>' +
  '<h2>Day 1 — accounts and equipment</h2>' +
  '<ol class="steps">' +
  '<li>Collect your laptop and accessories from Operations and sign the equipment form.</li>' +
  '<li>Sign in to your <code>@galiltc.co.il</code> Microsoft 365 account and change the temporary password.</li>' +
  '<li>Set up multi-factor authentication — see <a href="#/mfa">Setting up multi-factor authentication</a>.</li>' +
  '<li>Install and connect the company VPN — see <a href="#/vpn">How to set up the VPN</a>.</li>' +
  '<li>Sign in to the Employee Portal — see <a href="#/portal-signin">Signing in to the Employee Portal</a> — and install it on your phone.</li>' +
  '</ol>' +
  '<h2>Days 2–3 — policies</h2>' +
  '<ul><li>Read the <a href="#/code-of-conduct">Code of conduct</a>.</li>' +
  '<li>Read <a href="#/infosec">Information security &amp; acceptable use</a> and <a href="#/confidentiality">Client confidentiality</a>.</li>' +
  '<li>Read <a href="#/hours">Working hours &amp; time reporting</a> and <a href="#/leave">Vacation, sick leave &amp; holidays</a>.</li></ul>' +
  '<h2>Days 4–5 — your work</h2>' +
  '<ul><li>Meet your team and get a walkthrough of your first project from your Team Lead.</li>' +
  '<li>Open <strong>Taskana</strong> and look at your tasks — see <a href="#/taskana-tasks">Working with tasks in Taskana</a>.</li>' +
  '<li>In Taskana, open the <strong>Library</strong> from the sidebar and read your project\'s research notes — see <a href="#/library-start">Getting started with the Library</a>.</li>' +
  '<li>Log your first week of hours in WorkDesk — see <a href="#/workdesk-time">Logging your time</a>.</li>' +
  '<li>Plan next week in the Week Planner — see <a href="#/workdesk-plan">Planning your week</a>.</li></ul>' +
  '<div class="callout note"><b>Note:</b> If any account or access is missing by the end of Day 1, tell Operations straight away — don\'t wait.</div>',
  he:
  '<p class="lede">עברו על הרשימה הזו במהלך השבוע הראשון. ראש הצוות שלך ייפגש איתך בסוף השבוע.</p>' +
  '<h2>יום 1 — חשבונות וציוד</h2>' +
  '<ol class="steps">' +
  '<li>אספו את המחשב הנייד והאביזרים מהתפעול וחתמו על טופס הציוד.</li>' +
  '<li>התחברו לחשבון Microsoft 365 שלכם ב-<code>@galiltc.co.il</code> והחליפו את הסיסמה הזמנית.</li>' +
  '<li>הגדירו אימות דו־שלבי — ראו <a href="#/mfa">הגדרת אימות דו־שלבי</a>.</li>' +
  '<li>התקינו את ה-VPN של החברה והתחברו — ראו <a href="#/vpn">הגדרת ה-VPN</a>.</li>' +
  '<li>התחברו לפורטל העובדים — ראו <a href="#/portal-signin">כניסה לפורטל העובדים</a> — והתקינו אותו בטלפון.</li>' +
  '</ol>' +
  '<h2>ימים 2–3 — נהלים</h2>' +
  '<ul><li>קראו את <a href="#/code-of-conduct">קוד ההתנהגות</a>.</li>' +
  '<li>קראו את <a href="#/infosec">אבטחת מידע ושימוש נאות</a> ואת <a href="#/confidentiality">סודיות מול לקוחות</a>.</li>' +
  '<li>קראו את <a href="#/hours">שעות עבודה ודיווח שעות</a> ואת <a href="#/leave">חופשה, מחלה וחגים</a>.</li></ul>' +
  '<h2>ימים 4–5 — העבודה שלך</h2>' +
  '<ul><li>הכירו את הצוות וקבלו מראש הצוות סקירה של הפרויקט הראשון שלכם.</li>' +
  '<li>פתחו את <strong>Taskana</strong> ועברו על המשימות שלכם — ראו <a href="#/taskana-tasks">עבודה עם משימות ב-Taskana</a>.</li>' +
  '<li>ב-Taskana, פתחו את <strong>הספרייה</strong> מהסרגל הצדדי וקראו את מסמכי התחקיר של הפרויקט שלכם — ראו <a href="#/library-start">צעדים ראשונים בספרייה</a>.</li>' +
  '<li>דווחו את שעות השבוע הראשון ב-WorkDesk — ראו <a href="#/workdesk-time">דיווח שעות</a>.</li>' +
  '<li>תכננו את השבוע הבא במתכנן השבועי — ראו <a href="#/workdesk-plan">תכנון השבוע</a>.</li></ul>' +
  '<div class="callout note"><b>שימו לב:</b> אם עד סוף היום הראשון חסרים לכם חשבון או גישה, הודיעו לתפעול מיד — אל תחכו.</div>'
  } },

{ id: "accounts", cat: "onboarding", updated: "18 Oct 2026",
  title: { en: "Accounts & systems you will use", he: "החשבונות והמערכות שתשתמשו בהם" },
  summary: { en: "The company systems, what each is for and how you get access.", he: "מערכות החברה, למה כל אחת משמשת ואיך מקבלים גישה." },
  body: {
  en:
  '<p class="lede">These are the systems you will use day to day. Operations creates your accounts before your first day.</p>' +
  '<table><thead><tr><th>System</th><th>Used for</th><th>Sign-in</th></tr></thead><tbody>' +
  '<tr><td>Microsoft 365</td><td>Email, calendar, Teams, OneDrive and SharePoint</td><td>Your <code>@galiltc.co.il</code> account + MFA</td></tr>' +
  '<tr><td>Employee Portal</td><td>One home page for WorkDesk, Taskana, the Handbook and the Knowledge Base</td><td>Your <code>@galiltc.co.il</code> account, once</td></tr>' +
  '<tr><td>— WorkDesk</td><td>Time, sick and vacation reporting, expenses; for managers, budgets, clients, projects and work orders</td><td>Through the portal</td></tr>' +
  '<tr><td>— Taskana</td><td>Tasks, boards, reviews and questions on every project, and the Library of research documents</td><td>Through the portal</td></tr>' +
  '<tr><td>— Handbook</td><td>The user guide to the portal, WorkDesk and Taskana</td><td>Through the portal</td></tr>' +
  '<tr><td>— Knowledge Base</td><td>This site — onboarding, rules and training</td><td>Through the portal</td></tr>' +
  '<tr><td>Company VPN</td><td>Access to internal file servers and client environments from outside the office</td><td>Your <code>@galiltc.co.il</code> account + MFA</td></tr>' +
  '</tbody></table>' +
  '<h2>Which parts of the portal you see</h2>' +
  '<p>Your <strong>portal access</strong> decides which tiles you can open on the portal home page, and your role in Taskana. It follows your WorkDesk role unless Operations sets it differently — see <a href="#/portal-access">Portal access and roles</a>.</p>' +
  '<h2>Requesting additional access</h2>' +
  '<p>Some projects need access to a client\'s own systems. Ask your Project Manager — they request it from the client and Operations records it. Never share your credentials with anyone, including colleagues.</p>',
  he:
  '<p class="lede">אלה המערכות שתשתמשו בהן ביום־יום. התפעול פותח לכם את החשבונות לפני היום הראשון.</p>' +
  '<table><thead><tr><th>מערכת</th><th>למה משמשת</th><th>כניסה</th></tr></thead><tbody>' +
  '<tr><td>Microsoft 365</td><td>דוא"ל, יומן, Teams, ‏OneDrive ו-SharePoint</td><td>חשבון <code>@galiltc.co.il</code> + אימות דו־שלבי</td></tr>' +
  '<tr><td>פורטל העובדים</td><td>דף בית אחד ל-WorkDesk, ‏Taskana, המדריך למשתמש ומאגר הידע</td><td>חשבון <code>@galiltc.co.il</code>, פעם אחת</td></tr>' +
  '<tr><td>— WorkDesk</td><td>דיווח שעות, מחלה וחופשה והוצאות; למנהלים גם תקציבים, לקוחות, פרויקטים והזמנות עבודה</td><td>דרך הפורטל</td></tr>' +
  '<tr><td>— Taskana</td><td>משימות, לוחות, סקירות ושאלות בכל פרויקט, וספריית מסמכי התחקיר</td><td>דרך הפורטל</td></tr>' +
  '<tr><td>— מדריך למשתמש</td><td>המדריך לפורטל, ל-WorkDesk ול-Taskana</td><td>דרך הפורטל</td></tr>' +
  '<tr><td>— מאגר ידע</td><td>האתר הזה — קליטה, כללים והדרכה</td><td>דרך הפורטל</td></tr>' +
  '<tr><td>VPN של החברה</td><td>גישה לשרתי קבצים פנימיים ולסביבות לקוחות מחוץ למשרד</td><td>חשבון <code>@galiltc.co.il</code> + אימות דו־שלבי</td></tr>' +
  '</tbody></table>' +
  '<h2>אילו חלקים בפורטל תראו</h2>' +
  '<p><strong>הגישה לפורטל</strong> קובעת אילו אריחים אפשר לפתוח בדף הבית של הפורטל, ומה התפקיד שלכם ב-Taskana. היא נגזרת מהתפקיד שלכם ב-WorkDesk, אלא אם התפעול קבע אחרת — ראו <a href="#/portal-access">גישה לפורטל ותפקידים</a>.</p>' +
  '<h2>בקשת גישה נוספת</h2>' +
  '<p>חלק מהפרויקטים מחייבים גישה למערכות של הלקוח. פנו למנהל/ת הפרויקט — הם מבקשים את הגישה מהלקוח, והתפעול רושם אותה. לעולם אל תשתפו את פרטי הכניסה שלכם עם אף אחד, גם לא עם עמיתים.</p>'
  } },

/* ======================= The Employee Portal ======================= */
{ id: "portal-signin", cat: "portal", updated: "16 Oct 2026",
  title: { en: "Signing in to the Employee Portal", he: "כניסה לפורטל העובדים" },
  summary: { en: "One sign-in for WorkDesk, Taskana, the Handbook and the Knowledge Base.", he: "כניסה אחת ל-WorkDesk, ל-Taskana, למדריך למשתמש ולמאגר הידע." },
  body: {
  en:
  '<p class="lede">The Employee Portal is GALIL\'s single internal application. You sign in once, land on the portal home page, and open WorkDesk, Taskana, the Handbook or the Knowledge Base from there.</p>' +
  '<ol class="steps">' +
  '<li>Open the Employee Portal from the link Operations sends you, or from <a href="../index.html">here</a>.</li>' +
  '<li>Choose <strong>Sign in with Microsoft</strong> and use your <code>@galiltc.co.il</code> account — other domains are not accepted. (While the portal runs as a demo, you can also sign in with your company email and the demo password.)</li>' +
  '<li>First time? Your account waits in <strong>Pending activation</strong> until an Operations Manager or the CEO confirms your role and team.</li>' +
  '<li>Once you\'re in, the home page shows one tile per app. Tiles you don\'t have access to are greyed out.</li>' +
  '</ol>' +
  '<h2>English or Hebrew</h2>' +
  '<p>Use the <strong>EN / עב</strong> switch on the sign-in screen, the home page, in WorkDesk\'s top bar or Taskana\'s menu. The choice applies to the whole portal on that device — WorkDesk, Taskana, the Handbook and this Knowledge Base all switch together, and Hebrew is laid out right to left.</p>' +
  '<h2>Signing out</h2>' +
  '<p>Sign out from the portal home page (or from Taskana\'s menu). It signs you out of every part of the portal on that device.</p>' +
  '<div class="callout tip"><b>Tip:</b> Install the portal on your phone — see <a href="#/portal-install">Installing the portal on your phone</a>.</div>',
  he:
  '<p class="lede">פורטל העובדים הוא היישום הפנימי האחד של גליל. מתחברים פעם אחת, מגיעים לדף הבית של הפורטל, ומשם פותחים את WorkDesk, ‏Taskana, המדריך למשתמש או מאגר הידע.</p>' +
  '<ol class="steps">' +
  '<li>פתחו את פורטל העובדים מהקישור שהתפעול שולח, או <a href="../index.html">מכאן</a>.</li>' +
  '<li>בחרו <strong>כניסה עם Microsoft</strong> והשתמשו בחשבון <code>@galiltc.co.il</code> — כתובות אחרות אינן מתקבלות. (כל עוד הפורטל פועל כהדגמה, אפשר להתחבר גם עם הדוא"ל בחברה וסיסמת ההדגמה.)</li>' +
  '<li>פעם ראשונה? החשבון ממתין <strong>להפעלה</strong> עד שמנהל/ת התפעול או המנכ"ל יאשרו את התפקיד והצוות שלכם.</li>' +
  '<li>אחרי הכניסה, בדף הבית יש אריח לכל יישום. אריחים שאין לכם גישה אליהם מוצגים באפור.</li>' +
  '</ol>' +
  '<h2>אנגלית או עברית</h2>' +
  '<p>השתמשו במתג <strong>EN / עב</strong> במסך הכניסה, בדף הבית, בסרגל העליון של WorkDesk או בתפריט של Taskana. הבחירה חלה על כל הפורטל במכשיר — WorkDesk, ‏Taskana, המדריך למשתמש ומאגר הידע מתחלפים יחד, ובעברית התצוגה מימין לשמאל.</p>' +
  '<h2>התנתקות</h2>' +
  '<p>מתנתקים מדף הבית של הפורטל (או מהתפריט של Taskana). ההתנתקות חלה על כל חלקי הפורטל במכשיר.</p>' +
  '<div class="callout tip"><b>טיפ:</b> התקינו את הפורטל בטלפון — ראו <a href="#/portal-install">התקנת הפורטל בטלפון</a>.</div>'
  } },

{ id: "portal-access", cat: "portal", updated: "17 Oct 2026",
  title: { en: "Portal access and roles", he: "גישה לפורטל ותפקידים" },
  summary: { en: "Who can open which app, and what each person's Taskana role is.", he: "מי יכול לפתוח איזה יישום, ומה התפקיד של כל אחד ב-Taskana." },
  body: {
  en:
  '<p class="lede">Every person has <strong>portal access</strong>: whether they can open WorkDesk, their role in Taskana (or none), and whether they can open the Handbook and the Knowledge Base.</p>' +
  '<h2>Defaults, by WorkDesk role</h2>' +
  '<table><thead><tr><th>WorkDesk role</th><th>WorkDesk</th><th>Taskana role</th><th>Handbook</th><th>Knowledge Base</th></tr></thead><tbody>' +
  '<tr><td>CEO, Operations Manager</td><td>yes</td><td>Admin</td><td>yes</td><td>yes</td></tr>' +
  '<tr><td>Project Manager, Team Lead</td><td>yes</td><td>Manager</td><td>yes</td><td>yes</td></tr>' +
  '<tr><td>Employee, Senior Employee</td><td>yes</td><td>Member</td><td>yes</td><td>yes</td></tr>' +
  '<tr><td>External Contractor</td><td>yes</td><td>External</td><td>yes</td><td>no</td></tr>' +
  '<tr><td>Finance, Viewer</td><td>yes</td><td>Viewer</td><td>yes</td><td>Finance yes, Viewer no</td></tr>' +
  '</tbody></table>' +
  '<h2>Changing someone\'s access (Operations, CEO)</h2>' +
  '<ol class="steps">' +
  '<li>In WorkDesk, open <strong>Management → People</strong>.</li>' +
  '<li>In the person\'s <strong>Portal access</strong> column, click <strong><i class="ui-ic" data-ic="edit"></i></strong>.</li>' +
  '<li>Tick or untick WorkDesk, the Handbook and the Knowledge Base, and choose their Taskana role — or <em>No access</em>.</li>' +
  '<li>Save. <strong>Use the role defaults</strong> puts the person back on the defaults above.</li>' +
  '</ol>' +
  '<h2>Taskana roles</h2>' +
  '<ul><li><strong>Admin</strong> — everything, including data, backups and demo data.</li>' +
  '<li><strong>Manager</strong> — any task, project keys and descriptions; sees budgets and everyone\'s hours banks.</li>' +
  '<li><strong>Member</strong> — creates and works on tasks.</li>' +
  '<li><strong>External</strong> — sees only the tasks they work on, reported or are mentioned in.</li>' +
  '<li><strong>Viewer</strong> — reads and comments.</li></ul>',
  he:
  '<p class="lede">לכל אחד יש <strong>גישה לפורטל</strong>: האם אפשר לפתוח את WorkDesk, מה התפקיד ב-Taskana (או שאין גישה), והאם אפשר לפתוח את המדריך למשתמש ואת מאגר הידע.</p>' +
  '<h2>ברירות מחדל, לפי התפקיד ב-WorkDesk</h2>' +
  '<table><thead><tr><th>תפקיד ב-WorkDesk</th><th>WorkDesk</th><th>תפקיד ב-Taskana</th><th>מדריך למשתמש</th><th>מאגר ידע</th></tr></thead><tbody>' +
  '<tr><td>מנכ"ל, מנהל/ת תפעול</td><td>כן</td><td>מנהל מערכת</td><td>כן</td><td>כן</td></tr>' +
  '<tr><td>מנהל/ת פרויקט, ראש צוות</td><td>כן</td><td>מנהל</td><td>כן</td><td>כן</td></tr>' +
  '<tr><td>עובד/ת, עובד/ת בכיר/ה</td><td>כן</td><td>חבר צוות</td><td>כן</td><td>כן</td></tr>' +
  '<tr><td>קבלן חיצוני</td><td>כן</td><td>חיצוני</td><td>כן</td><td>לא</td></tr>' +
  '<tr><td>כספים, צופה</td><td>כן</td><td>צופה</td><td>כן</td><td>כספים כן, צופה לא</td></tr>' +
  '</tbody></table>' +
  '<h2>שינוי הגישה של מישהו (תפעול, מנכ"ל)</h2>' +
  '<ol class="steps">' +
  '<li>ב-WorkDesk, פתחו את <strong>ניהול ← אנשים</strong>.</li>' +
  '<li>בעמודה <strong>גישה לפורטל</strong> של האדם, לחצו על <strong><i class="ui-ic" data-ic="edit"></i></strong>.</li>' +
  '<li>סמנו או בטלו את WorkDesk, המדריך למשתמש ומאגר הידע, ובחרו את התפקיד ב-Taskana — או <em>אין גישה</em>.</li>' +
  '<li>שמרו. <strong>ברירות המחדל של התפקיד</strong> מחזיר את האדם לברירות המחדל שלמעלה.</li>' +
  '</ol>' +
  '<h2>התפקידים ב-Taskana</h2>' +
  '<ul><li><strong>מנהל מערכת</strong> — הכול, כולל נתונים, גיבויים ונתוני הדגמה.</li>' +
  '<li><strong>מנהל</strong> — כל משימה, מפתחות ותיאורים של פרויקטים; רואה תקציבים ואת בנקי השעות של כולם.</li>' +
  '<li><strong>חבר צוות</strong> — יוצר משימות ועובד עליהן.</li>' +
  '<li><strong>חיצוני</strong> — רואה רק משימות שהוא עובד עליהן, פתח או תויג בהן.</li>' +
  '<li><strong>צופה</strong> — קריאה ותגובות.</li></ul>'
  } },

{ id: "portal-how", cat: "portal", updated: "18 Oct 2026",
  title: { en: "How WorkDesk and Taskana work together", he: "איך WorkDesk ו-Taskana עובדים יחד" },
  summary: { en: "What lives where: records and hours in WorkDesk, tasks in Taskana.", he: "מה נמצא איפה: רשומות ושעות ב-WorkDesk, משימות ב-Taskana." },
  body: {
  en:
  '<p class="lede">WorkDesk and Taskana are two parts of the same portal. Each owns its own kind of work, and each shows what the other one knows.</p>' +
  '<table><thead><tr><th>Set in WorkDesk</th><th>Shown in Taskana</th></tr></thead><tbody>' +
  '<tr><td>People, their manager and team</td><td>Everyone you can assign a task to</td></tr>' +
  '<tr><td>Clients and projects</td><td>Clients &amp; projects (Taskana adds a project key, e.g. <code>RSOM</code>, and a deliverable type)</td></tr>' +
  '<tr><td>Work orders</td><td>A task\'s <strong>Work order</strong> field</td></tr>' +
  '<tr><td>Budgets and registered hours</td><td>The <strong>Budget &amp; hours</strong> card on a project and in a task</td></tr>' +
  '<tr><td>Assignments and allowances</td><td>Each person\'s <strong>hours bank</strong> on a project</td></tr>' +
  '</tbody></table>' +
  '<h2>Tasks live in Taskana</h2>' +
  '<p>WorkDesk no longer has a Tasks tab. Plan, assign, review and discuss tasks in Taskana. When you report time in WorkDesk you can name the Taskana task it went to (optional) — the task then shows those hours under <strong>Hours in WorkDesk</strong>.</p>' +
  '<h2>Hours live in WorkDesk</h2>' +
  '<p>Time, sick and vacation days and expenses are reported in WorkDesk only. From a task in Taskana, <strong>Report time on this task in WorkDesk</strong> opens the Time Log with the project, work order and task already filled in.</p>' +
  '<p>Managers follow the budgets in WorkDesk under <strong>Management → Budgets</strong>: a compact table with one row per budget — client, project, work order, basis, budgeted, a <strong>Used</strong> bar with its percentage, consumed, in approval, remaining, value / output and projected exhaustion. Filter it by search, client, project, basis and how much is used (<em>Under 75%</em>, <em>75–90%</em>, <em>90–100%</em>, <em>Fully consumed</em>); the chips above it add up what is shown. See <a href="../handbook/index.html#h-budget-list">The budgets table</a> in the Handbook.</p>' +
  '<h2>Research documents live in Taskana</h2>' +
  '<p>The <strong>Library</strong> — the team\'s documents from SME interviews, site visits and walkthroughs — is no longer a WorkDesk tab. Open it in Taskana from the sidebar (<strong>Library</strong>), beside the tasks the research is for. See <a href="#/library-start">Getting started with the Library</a>.</p>',
  he:
  '<p class="lede">WorkDesk ו-Taskana הם שני חלקים של אותו פורטל. כל אחד אחראי לסוג עבודה משלו, וכל אחד מציג את מה שהשני יודע.</p>' +
  '<table><thead><tr><th>מוגדר ב-WorkDesk</th><th>מוצג ב-Taskana</th></tr></thead><tbody>' +
  '<tr><td>אנשים, המנהל והצוות שלהם</td><td>כל מי שאפשר להקצות לו משימה</td></tr>' +
  '<tr><td>לקוחות ופרויקטים</td><td>לקוחות ופרויקטים (‏Taskana מוסיפה מפתח פרויקט, למשל <code>RSOM</code>, וסוג תוצר)</td></tr>' +
  '<tr><td>הזמנות עבודה</td><td>השדה <strong>הזמנת עבודה</strong> במשימה</td></tr>' +
  '<tr><td>תקציבים ושעות שנרשמו</td><td>הכרטיס <strong>תקציב ושעות</strong> בפרויקט ובמשימה</td></tr>' +
  '<tr><td>שיבוצים ומכסות</td><td><strong>בנק השעות</strong> של כל אחד בפרויקט</td></tr>' +
  '</tbody></table>' +
  '<h2>המשימות נמצאות ב-Taskana</h2>' +
  '<p>ל-WorkDesk אין יותר לשונית משימות. מתכננים, מקצים, סוקרים ודנים במשימות ב-Taskana. כשמדווחים שעות ב-WorkDesk אפשר לציין את המשימה ב-Taskana שהזמן הוקדש לה (רשות) — והמשימה מציגה את השעות האלה תחת <strong>שעות ב-WorkDesk</strong>.</p>' +
  '<h2>השעות נמצאות ב-WorkDesk</h2>' +
  '<p>שעות, ימי מחלה וחופשה והוצאות מדווחים רק ב-WorkDesk. ממשימה ב-Taskana, <strong>דיווח שעות על המשימה ב-WorkDesk</strong> פותח את יומן השעות כשהפרויקט, הזמנת העבודה והמשימה כבר ממולאים.</p>' +
  '<p>מנהלים עוקבים אחרי התקציבים ב-WorkDesk, ב<strong>ניהול ← תקציבים</strong>: טבלה דחוסה, שורה לכל תקציב — לקוח, פרויקט, הזמנת עבודה, בסיס, מתוקצב, פס <strong>ניצול</strong> עם האחוז, נוצל, באישור, נותר, ערך / תפוקה ומיצוי צפוי. מסננים לפי חיפוש, לקוח, פרויקט, בסיס ומידת הניצול (<em>מתחת ל-75%</em>, <em>75–90%</em>, <em>90–100%</em>, <em>נוצל במלואו</em>); התגיות שמעל הטבלה מסכמות את מה שמוצג. ראו <a href="../handbook/he.html#h-budget-list">טבלת התקציבים</a> במדריך.</p>' +
  '<h2>מסמכי התחקיר נמצאים ב-Taskana</h2>' +
  '<p><strong>הספרייה</strong> — המסמכים של הצוות מראיונות עם מומחי תוכן, מביקורי אתר ומהדגמות — אינה עוד לשונית ב-WorkDesk. פותחים אותה ב-Taskana מהסרגל הצדדי (<strong>ספרייה</strong>), ליד המשימות שהתחקיר נועד להן. ראו <a href="#/library-start">צעדים ראשונים בספרייה</a>.</p>'
  } },

{ id: "portal-around", cat: "portal", updated: "17 Oct 2026",
  title: { en: "Getting around WorkDesk", he: "התמצאות ב-WorkDesk" },
  summary: { en: "The top-bar buttons, the Back button, copying email addresses, and how the Handbook and this Knowledge Base are laid out.", he: "כפתורי הסרגל העליון, כפתור החזרה, העתקת כתובות דוא״ל, ואיך בנויים המדריך ומאגר הידע." },
  body: {
  en:
  '<p class="lede">WorkDesk keeps everything that is not a tab behind a few icon buttons in the dark top bar. This is what each one does.</p>' +
  '<table><thead><tr><th>Button</th><th>What it does</th></tr></thead><tbody>' +
  '<tr><td><i class="ui-ic" data-ic="back"></i> Back</td><td>Steps back to the tab or Management section you were on. An open window closes first; with nothing left, it returns to the portal home page. <code>Alt</code>+<code>←</code> and the mouse\'s back button do the same.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="home"></i> Home</td><td>The Employee Portal home page — Taskana, the Handbook and this Knowledge Base are there.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="moon"></i> / <i class="ui-ic" data-ic="sun"></i></td><td>Dark or light theme, for the whole portal on this device.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="assignments"></i></td><td>My assignments and allowances — your funded work, and <strong>Request hours</strong> when you are running out.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="settings"></i></td><td>System administration (roles, company settings, backup, audit log) — for administrators.</td></tr>' +
  '<tr><td>EN / עב</td><td>English or Hebrew, for the whole portal.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="book"></i> · <i class="ui-ic" data-ic="help"></i></td><td>This Knowledge Base, and the Handbook, each in a new tab.</td></tr>' +
  '</tbody></table>' +
  '<h2>Copying an email address</h2>' +
  '<p>Every email address in WorkDesk — in People, Clients, Teams, Pending activation and your profile — is a link. Click it and the address is copied, ready to paste into a message.</p>' +
  '<h2>Reading the Handbook and this Knowledge Base</h2>' +
  '<ol class="steps"><li>Search at the top, or pick a topic card.</li><li>The chapter or article opens on its own page.</li><li><strong>All topics</strong> takes you back to the cards; <strong>Previous</strong> and <strong>Next</strong> at the bottom move through them in order.</li></ol>' +
  '<div class="callout tip"><b>Tip:</b> In the Handbook, choose your role in the <strong>Read as</strong> bar — the cards you cannot use are dimmed.</div>',
  he:
  '<p class="lede">ב-WorkDesk כל מה שאינו לשונית נמצא מאחורי כמה כפתורי סמל בסרגל העליון הכהה. זה מה שכל אחד עושה.</p>' +
  '<table><thead><tr><th>כפתור</th><th>מה הוא עושה</th></tr></thead><tbody>' +
  '<tr><td><i class="ui-ic" data-ic="back"></i> חזרה</td><td>חוזר ללשונית או לחלק הניהול הקודם. חלון פתוח נסגר קודם; כשאין לאן לחזור, הכפתור מחזיר לדף הבית של הפורטל. <code>Alt</code>+<code>→</code> וכפתור החזרה של העכבר עושים אותו דבר.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="home"></i> בית</td><td>דף הבית של פורטל העובדים — שם נמצאים Taskana, המדריך ומאגר הידע הזה.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="moon"></i> / <i class="ui-ic" data-ic="sun"></i></td><td>ערכת נושא כהה או בהירה, לכל הפורטל במכשיר הזה.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="assignments"></i></td><td>השיבוצים והמכסות שלי — העבודה הממומנת שלכם, ו<strong>בקשת שעות</strong> כשהמכסה עומדת להיגמר.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="settings"></i></td><td>ניהול המערכת (תפקידים, הגדרות החברה, גיבוי, יומן ביקורת) — למנהלי המערכת.</td></tr>' +
  '<tr><td>EN / עב</td><td>אנגלית או עברית, לכל הפורטל.</td></tr>' +
  '<tr><td><i class="ui-ic" data-ic="book"></i> · <i class="ui-ic" data-ic="help"></i></td><td>מאגר הידע הזה והמדריך, כל אחד בלשונית חדשה.</td></tr>' +
  '</tbody></table>' +
  '<h2>העתקת כתובת דוא״ל</h2>' +
  '<p>כל כתובת דוא״ל ב-WorkDesk — באנשים, בלקוחות, בצוותים, בהמתנה להפעלה ובפרופיל שלכם — היא קישור. לחיצה עליה מעתיקה את הכתובת, מוכנה להדבקה בהודעה.</p>' +
  '<h2>קריאה במדריך ובמאגר הידע</h2>' +
  '<ol class="steps"><li>חפשו למעלה, או בחרו כרטיס נושא.</li><li>הפרק או המאמר נפתח בעמוד משלו.</li><li><strong>כל הנושאים</strong> מחזיר לכרטיסים; <strong>הקודם</strong> ו<strong>הבא</strong> בתחתית עוברים ביניהם לפי הסדר.</li></ol>' +
  '<div class="callout tip"><b>טיפ:</b> במדריך, בחרו את התפקיד שלכם בסרגל <strong>קריאה בתור</strong> — הכרטיסים שאינם רלוונטיים לכם מעומעמים.</div>'
  } },

{ id: "portal-install", cat: "portal", updated: "16 Oct 2026",
  title: { en: "Installing the portal on your phone", he: "התקנת הפורטל בטלפון" },
  summary: { en: "Add the Employee Portal to your home screen like an app.", he: "הוספת פורטל העובדים למסך הבית, כמו אפליקציה." },
  body: {
  en:
  '<p class="lede">The Employee Portal installs like an app — one icon for WorkDesk, Taskana, the Handbook and the Knowledge Base.</p>' +
  '<p>Follow the illustrated steps for iPhone, Android and computers on the <a href="../install/index.html">Install on your phone</a> page (also linked from the portal home page). In short: open the portal in Safari (iPhone) or Chrome (Android), then choose <strong>Add to Home Screen</strong> or <strong>Install app</strong>.</p>',
  he:
  '<p class="lede">את פורטל העובדים מתקינים כמו אפליקציה — אייקון אחד ל-WorkDesk, ל-Taskana, למדריך למשתמש ולמאגר הידע.</p>' +
  '<p>השלבים המאוירים לאייפון, לאנדרואיד ולמחשב נמצאים בדף <a href="../install/index.html">התקנה בטלפון</a> (יש אליו קישור גם מדף הבית של הפורטל). בקצרה: פתחו את הפורטל ב-Safari (אייפון) או ב-Chrome (אנדרואיד), ובחרו <strong>הוספה למסך הבית</strong> או <strong>התקנת אפליקציה</strong>.</p>'
  } },

/* ======================= Company rules ======================= */
{ id: "code-of-conduct", cat: "rules", updated: "30 Sep 2026",
  title: { en: "Code of conduct", he: "קוד התנהגות" },
  summary: { en: "How we treat each other, our clients and the company.", he: "איך אנחנו מתנהגים זה לזה, ללקוחות ולחברה." },
  body: {
  en:
  '<p class="lede">GALIL is a small company where trust matters. Everyone is expected to follow these principles.</p>' +
  '<h2>Respect</h2>' +
  '<ul><li>Treat colleagues, clients and partners with courtesy and respect.</li>' +
  '<li>Harassment, discrimination and bullying of any kind are not tolerated.</li>' +
  '<li>Disagree about ideas, never about people.</li></ul>' +
  '<h2>Integrity</h2>' +
  '<ul><li>Report your time and expenses honestly and accurately.</li>' +
  '<li>Declare any conflict of interest to your manager — for example, outside work for a client or competitor.</li>' +
  '<li>Do not accept gifts from clients or suppliers beyond a token value without approval from Operations.</li></ul>' +
  '<h2>Raising a concern</h2>' +
  '<p>If you see something that breaks these rules, raise it with your Team Lead, Operations or the CEO. Concerns raised in good faith will never count against you.</p>',
  he:
  '<p class="lede">גליל היא חברה קטנה שבה אמון חשוב. כולם מצופים לפעול לפי העקרונות האלה.</p>' +
  '<h2>כבוד</h2>' +
  '<ul><li>התייחסו לעמיתים, ללקוחות ולשותפים באדיבות ובכבוד.</li>' +
  '<li>אין סובלנות להטרדה, אפליה או בריונות מכל סוג.</li>' +
  '<li>חלקו על רעיונות, לעולם לא על אנשים.</li></ul>' +
  '<h2>יושרה</h2>' +
  '<ul><li>דווחו את השעות וההוצאות שלכם ביושר ובדיוק.</li>' +
  '<li>הצהירו בפני המנהל/ת על כל ניגוד עניינים — למשל עבודה נוספת עבור לקוח או מתחרה.</li>' +
  '<li>אל תקבלו מתנות מלקוחות או מספקים מעבר לערך סמלי בלי אישור התפעול.</li></ul>' +
  '<h2>העלאת חשש</h2>' +
  '<p>אם אתם רואים משהו שמפר את הכללים האלה, העלו את זה בפני ראש הצוות, התפעול או המנכ"ל. חשש שהועלה בתום לב לעולם לא ייזקף לחובתכם.</p>'
  } },

{ id: "hours", cat: "rules", updated: "16 Oct 2026",
  title: { en: "Working hours & time reporting", he: "שעות עבודה ודיווח שעות" },
  summary: { en: "Standard hours, when to report time and how approvals work.", he: "שעות העבודה, מתי מדווחים ואיך עובדים האישורים." },
  body: {
  en:
  '<p class="lede">Accurate time reporting is how we bill clients and track budgets, so it is a core part of everyone\'s job.</p>' +
  '<h2>Standard hours</h2>' +
  '<ul><li>A full-time week is <strong>42 hours</strong>, typically Sunday to Thursday, 9 hours a day.</li>' +
  '<li>Core hours are agreed with your Team Lead; let your team know in Teams if you will be unavailable.</li></ul>' +
  '<h2>Reporting rules</h2>' +
  '<ul><li>Log your hours in WorkDesk <strong>every day</strong>, and no later than the end of the working week.</li>' +
  '<li>Report every hour against the correct client, project and work order — and, when it helps your team, the Taskana task.</li>' +
  '<li>Hours beyond your hours bank (allowance) on a project need a request that your Team Lead or Project Manager approves. You can see your hours banks in Taskana under <strong>My work</strong>.</li>' +
  '<li>Plan the following week in the Week Planner by Thursday.</li></ul>' +
  '<div class="callout warn"><b>Important:</b> Never log hours you did not work, and never log them against a different work order to stay under budget. Ask your Project Manager instead.</div>' +
  '<p>See <a href="#/workdesk-time">Logging your time in WorkDesk</a> for how to do it.</p>',
  he:
  '<p class="lede">דיווח שעות מדויק הוא הבסיס לחיוב הלקוחות ולמעקב אחר התקציבים, ולכן הוא חלק מרכזי מהעבודה של כולם.</p>' +
  '<h2>שעות עבודה</h2>' +
  '<ul><li>שבוע מלא הוא <strong>42 שעות</strong>, בדרך כלל ראשון עד חמישי, 9 שעות ביום.</li>' +
  '<li>שעות הליבה נקבעות עם ראש הצוות; אם לא תהיו זמינים, עדכנו את הצוות ב-Teams.</li></ul>' +
  '<h2>כללי הדיווח</h2>' +
  '<ul><li>דווחו את השעות ב-WorkDesk <strong>כל יום</strong>, ולא יאוחר מסוף שבוע העבודה.</li>' +
  '<li>דווחו כל שעה על הלקוח, הפרויקט והזמנת העבודה הנכונים — וכשזה עוזר לצוות, גם על המשימה ב-Taskana.</li>' +
  '<li>שעות מעבר לבנק השעות (המכסה) שלכם בפרויקט מחייבות בקשה שראש הצוות או מנהל/ת הפרויקט מאשרים. את בנקי השעות שלכם רואים ב-Taskana, בעמוד <strong>העבודה שלי</strong>.</li>' +
  '<li>תכננו את השבוע הבא במתכנן השבועי עד יום חמישי.</li></ul>' +
  '<div class="callout warn"><b>חשוב:</b> לעולם אל תדווחו שעות שלא עבדתם, ואל תדווחו אותן על הזמנת עבודה אחרת כדי להישאר בתקציב. פנו במקום זה למנהל/ת הפרויקט.</div>' +
  '<p>ראו <a href="#/workdesk-time">דיווח שעות ב-WorkDesk</a> כדי לדעת איך עושים את זה.</p>'
  } },

{ id: "leave", cat: "rules", updated: "30 Sep 2026",
  title: { en: "Vacation, sick leave & holidays", he: "חופשה, מחלה וחגים" },
  summary: { en: "How to request vacation, report sick days and plan around holidays.", he: "איך מבקשים חופשה, מדווחים על ימי מחלה ומתכננים סביב החגים." },
  body: {
  en:
  '<p class="lede">Sick and vacation days are requested in WorkDesk and approved by your manager. See <a href="#/workdesk-leave">Requesting sick and vacation days in WorkDesk</a> for the steps.</p>' +
  '<h2>Vacation</h2>' +
  '<ol class="steps">' +
  '<li>Agree the dates with your manager, at least <strong>two weeks</strong> in advance for anything longer than two days.</li>' +
  '<li>Send a <strong>Vacation</strong> request in WorkDesk for the whole range. Your manager approves or declines it.</li>' +
  '<li>Once approved, set an out-of-office reply in Outlook and hand over any urgent work — reassign your open Taskana tasks if needed.</li>' +
  '</ol>' +
  '<h2>Sick leave</h2>' +
  '<ul><li>Tell your manager as early as possible on the day.</li>' +
  '<li>Send a <strong>Sick</strong> request in WorkDesk covering the days you are off.</li>' +
  '<li>Attach the sick-leave confirmation from the clinic or doctor\'s office to the request (PDF or photo).</li></ul>' +
  '<h2>Public holidays</h2>' +
  '<p>The office is closed on Israeli public holidays. Operations publishes the holiday calendar for the year in Teams each January, including half-days on holiday eves.</p>',
  he:
  '<p class="lede">ימי מחלה וחופשה מבקשים ב-WorkDesk, והמנהל/ת שלכם מאשרים אותם. השלבים מופיעים ב<a href="#/workdesk-leave">בקשת ימי מחלה וחופשה ב-WorkDesk</a>.</p>' +
  '<h2>חופשה</h2>' +
  '<ol class="steps">' +
  '<li>תאמו את התאריכים עם המנהל/ת, לפחות <strong>שבועיים</strong> מראש לכל חופשה ארוכה מיומיים.</li>' +
  '<li>שלחו ב-WorkDesk בקשת <strong>חופשה</strong> לכל הטווח. המנהל/ת מאשרים או דוחים אותה.</li>' +
  '<li>אחרי האישור, הגדירו מענה "מחוץ למשרד" ב-Outlook והעבירו עבודה דחופה — ואם צריך, הקצו מחדש את המשימות הפתוחות שלכם ב-Taskana.</li>' +
  '</ol>' +
  '<h2>מחלה</h2>' +
  '<ul><li>הודיעו למנהל/ת מוקדם ככל האפשר באותו יום.</li>' +
  '<li>שלחו ב-WorkDesk בקשת <strong>מחלה</strong> לימים שבהם אתם לא עובדים.</li>' +
  '<li>צרפו לבקשה את אישור המחלה מהמרפאה או מהרופא (PDF או צילום).</li></ul>' +
  '<h2>חגים</h2>' +
  '<p>המשרד סגור בחגי ישראל. בכל ינואר התפעול מפרסם ב-Teams את לוח החגים לשנה, כולל חצאי ימים בערבי חג.</p>'
  } },

{ id: "expenses-policy", cat: "rules", updated: "30 Sep 2026",
  title: { en: "Expenses policy", he: "נוהל הוצאות" },
  summary: { en: "What you can claim, what evidence you need and how you get reimbursed.", he: "מה אפשר לתבוע, איזו אסמכתה צריך ואיך מקבלים החזר." },
  body: {
  en:
  '<h2>What you can claim</h2>' +
  '<ul><li>Travel to client sites (public transport, taxis when pre-approved, mileage).</li>' +
  '<li>Parking at client sites.</li>' +
  '<li>Equipment or software pre-approved by your Team Lead or Operations.</li></ul>' +
  '<h2>Rules</h2>' +
  '<ul><li>Every claim needs a receipt or invoice attached in WorkDesk.</li>' +
  '<li>Submit expenses within <strong>30 days</strong> of the date they occurred.</li>' +
  '<li>Claims are approved by your Team Lead or Project Manager, then reimbursed by Finance with the next payroll.</li></ul>' +
  '<p>See <a href="#/workdesk-expenses">Reporting expenses in WorkDesk</a> for the steps.</p>',
  he:
  '<h2>מה אפשר לתבוע</h2>' +
  '<ul><li>נסיעות לאתרי לקוחות (תחבורה ציבורית, מוניות באישור מראש, קילומטראז\').</li>' +
  '<li>חניה באתרי לקוחות.</li>' +
  '<li>ציוד או תוכנה שאושרו מראש על ידי ראש הצוות או התפעול.</li></ul>' +
  '<h2>כללים</h2>' +
  '<ul><li>לכל תביעה צריך לצרף ב-WorkDesk קבלה או חשבונית.</li>' +
  '<li>הגישו הוצאות תוך <strong>30 יום</strong> מהתאריך שבו היו.</li>' +
  '<li>ראש הצוות או מנהל/ת הפרויקט מאשרים את התביעה, והכספים מחזירים אותה עם המשכורת הבאה.</li></ul>' +
  '<p>השלבים מופיעים ב<a href="#/workdesk-expenses">דיווח הוצאות ב-WorkDesk</a>.</p>'
  } },

{ id: "infosec", cat: "rules", updated: "30 Sep 2026",
  title: { en: "Information security & acceptable use", he: "אבטחת מידע ושימוש נאות" },
  summary: { en: "Keeping company and client data safe on every device.", he: "שמירה על נתוני החברה והלקוחות בכל מכשיר." },
  body: {
  en:
  '<p class="lede">Our clients trust us with sensitive technical information. Protecting it is everyone\'s responsibility.</p>' +
  '<h2>Devices</h2>' +
  '<ul><li>Lock your screen whenever you step away (<code>Win + L</code> / <code>Ctrl + Cmd + Q</code>).</li>' +
  '<li>Keep your laptop\'s operating system and software up to date.</li>' +
  '<li>Do not install unapproved software. Ask Operations if you need something.</li></ul>' +
  '<h2>Accounts &amp; passwords</h2>' +
  '<ul><li>Use MFA on every company account. Never share passwords or MFA codes.</li>' +
  '<li>Use a unique, long passphrase for your company account.</li>' +
  '<li>Sign out of the Employee Portal on shared or borrowed devices.</li></ul>' +
  '<h2>Networks</h2>' +
  '<ul><li>Always connect through the <a href="#/vpn">company VPN</a> when working outside the office, especially on public Wi-Fi.</li></ul>' +
  '<h2>Reporting an incident</h2>' +
  '<p>Lost a device? Clicked a suspicious link? Report it to Operations <strong>immediately</strong> — speed matters more than blame. See <a href="#/phishing">Spotting and reporting phishing</a>.</p>',
  he:
  '<p class="lede">הלקוחות שלנו מפקידים בידינו מידע טכני רגיש. ההגנה עליו היא האחריות של כולנו.</p>' +
  '<h2>מכשירים</h2>' +
  '<ul><li>נעלו את המסך בכל פעם שאתם מתרחקים (<code>Win + L</code> / <code>Ctrl + Cmd + Q</code>).</li>' +
  '<li>הקפידו על עדכוני מערכת ההפעלה והתוכנות במחשב.</li>' +
  '<li>אל תתקינו תוכנה שלא אושרה. אם צריך משהו, פנו לתפעול.</li></ul>' +
  '<h2>חשבונות וסיסמאות</h2>' +
  '<ul><li>השתמשו באימות דו־שלבי בכל חשבון של החברה. לעולם אל תשתפו סיסמאות או קודי אימות.</li>' +
  '<li>השתמשו במשפט סיסמה ארוך וייחודי לחשבון החברה.</li>' +
  '<li>התנתקו מפורטל העובדים במכשירים משותפים או שאולים.</li></ul>' +
  '<h2>רשתות</h2>' +
  '<ul><li>כשעובדים מחוץ למשרד, ובמיוחד ברשת Wi-Fi ציבורית, התחברו תמיד דרך <a href="#/vpn">ה-VPN של החברה</a>.</li></ul>' +
  '<h2>דיווח על אירוע</h2>' +
  '<p>איבדתם מכשיר? לחצתם על קישור חשוד? דווחו לתפעול <strong>מיד</strong> — מהירות חשובה יותר מאשמה. ראו <a href="#/phishing">זיהוי ודיווח על פישינג</a>.</p>'
  } },

{ id: "confidentiality", cat: "rules", updated: "30 Sep 2026",
  title: { en: "Client confidentiality", he: "סודיות מול לקוחות" },
  summary: { en: "How to handle client documents, data and information.", he: "איך מטפלים במסמכים, בנתונים ובמידע של לקוחות." },
  body: {
  en:
  '<ul><li>Client material stays in the client\'s systems or in the project\'s SharePoint site — never on personal devices or personal cloud storage.</li>' +
  '<li>Do not discuss client projects in public places or on social media.</li>' +
  '<li>Only share client material with colleagues assigned to that project.</li>' +
  '<li>Attach client files to Taskana tasks only on projects that allow it; otherwise link to the client system instead.</li>' +
  '<li>When a project ends, follow the Project Manager\'s instructions for returning or deleting client data.</li></ul>' +
  '<div class="callout warn"><b>Important:</b> Many clients have their own NDA terms, which may be stricter than these rules. Your Project Manager will brief you on them.</div>',
  he:
  '<ul><li>חומרי לקוח נשארים במערכות הלקוח או באתר ה-SharePoint של הפרויקט — לעולם לא במכשירים אישיים או באחסון ענן פרטי.</li>' +
  '<li>אל תדברו על פרויקטים של לקוחות במקומות ציבוריים או ברשתות החברתיות.</li>' +
  '<li>שתפו חומרי לקוח רק עם עמיתים שמשובצים לאותו פרויקט.</li>' +
  '<li>צרפו קבצי לקוח למשימות ב-Taskana רק בפרויקטים שמתירים זאת; אחרת הוסיפו קישור למערכת הלקוח.</li>' +
  '<li>בסיום פרויקט, פעלו לפי הנחיות מנהל/ת הפרויקט להחזרת נתוני הלקוח או למחיקתם.</li></ul>' +
  '<div class="callout warn"><b>חשוב:</b> ללקוחות רבים יש תנאי סודיות משלהם, שעשויים להיות מחמירים יותר מהכללים האלה. מנהל/ת הפרויקט יתדרכו אתכם עליהם.</div>'
  } },

/* ======================= Training ======================= */
{ id: "vpn", cat: "training", updated: "30 Sep 2026",
  title: { en: "How to set up the VPN", he: "הגדרת ה-VPN" },
  summary: { en: "Install the VPN client, connect for the first time and troubleshoot.", he: "התקנת לקוח ה-VPN, התחברות ראשונה ופתרון בעיות." },
  body: {
  en:
  '<p class="lede">The company VPN gives you secure access to internal resources from home, client sites or while travelling.</p>' +
  '<div class="callout note"><b>Before you start:</b> you need your <code>@galiltc.co.il</code> account and <a href="#/mfa">MFA set up</a> on your phone.</div>' +
  '<h2>Windows</h2>' +
  '<ol class="steps">' +
  '<li>Open <strong>Company Portal</strong> from the Start menu and search for <strong>GALIL VPN</strong>.</li>' +
  '<li>Click <strong>Install</strong> and wait for the installation to finish.</li>' +
  '<li>Open the VPN client from the system tray.</li>' +
  '<li>Make sure the server address is <code>vpn.galiltc.co.il</code>.</li>' +
  '<li>Click <strong>Connect</strong> and sign in with your company email and password.</li>' +
  '<li>Approve the sign-in request in the Microsoft Authenticator app.</li>' +
  '</ol>' +
  '<h2>macOS</h2>' +
  '<ol class="steps">' +
  '<li>Open <strong>Self Service</strong> and install <strong>GALIL VPN</strong>.</li>' +
  '<li>Allow the system extension when macOS asks (System Settings → Privacy &amp; Security).</li>' +
  '<li>Open the VPN client from the menu bar, confirm the server is <code>vpn.galiltc.co.il</code>, and click <strong>Connect</strong>.</li>' +
  '<li>Sign in and approve the MFA request.</li>' +
  '</ol>' +
  '<h2>Troubleshooting</h2>' +
  '<table><thead><tr><th>Problem</th><th>Try this</th></tr></thead><tbody>' +
  '<tr><td>No MFA prompt</td><td>Open the Authenticator app manually and check for pending requests; check your phone has internet.</td></tr>' +
  '<tr><td>Connects, but internal sites don\'t load</td><td>Disconnect and reconnect; on hotel Wi-Fi, complete the hotel\'s sign-in page first.</td></tr>' +
  '<tr><td>"Authentication failed"</td><td>Check your password in Outlook on the web; if it works there, contact Operations.</td></tr>' +
  '</tbody></table>',
  he:
  '<p class="lede">ה-VPN של החברה נותן גישה מאובטחת למשאבים פנימיים מהבית, מאתרי לקוחות או בנסיעות.</p>' +
  '<div class="callout note"><b>לפני שמתחילים:</b> צריך חשבון <code>@galiltc.co.il</code> ו<a href="#/mfa">אימות דו־שלבי מוגדר</a> בטלפון.</div>' +
  '<h2>Windows</h2>' +
  '<ol class="steps">' +
  '<li>פתחו את <strong>Company Portal</strong> מתפריט התחל וחפשו <strong>GALIL VPN</strong>.</li>' +
  '<li>לחצו <strong>Install</strong> והמתינו לסיום ההתקנה.</li>' +
  '<li>פתחו את לקוח ה-VPN ממגש המערכת.</li>' +
  '<li>ודאו שכתובת השרת היא <code>vpn.galiltc.co.il</code>.</li>' +
  '<li>לחצו <strong>Connect</strong> והתחברו עם הדוא"ל והסיסמה של החברה.</li>' +
  '<li>אשרו את בקשת הכניסה באפליקציית Microsoft Authenticator.</li>' +
  '</ol>' +
  '<h2>macOS</h2>' +
  '<ol class="steps">' +
  '<li>פתחו את <strong>Self Service</strong> והתקינו את <strong>GALIL VPN</strong>.</li>' +
  '<li>אשרו את הרחבת המערכת כש-macOS מבקשת (הגדרות המערכת ← פרטיות ואבטחה).</li>' +
  '<li>פתחו את לקוח ה-VPN משורת התפריטים, ודאו שהשרת הוא <code>vpn.galiltc.co.il</code> ולחצו <strong>Connect</strong>.</li>' +
  '<li>התחברו ואשרו את בקשת האימות.</li>' +
  '</ol>' +
  '<h2>פתרון בעיות</h2>' +
  '<table><thead><tr><th>בעיה</th><th>מה לנסות</th></tr></thead><tbody>' +
  '<tr><td>לא מגיעה בקשת אימות</td><td>פתחו ידנית את Authenticator ובדקו אם יש בקשות ממתינות; ודאו שיש לטלפון אינטרנט.</td></tr>' +
  '<tr><td>מתחבר, אבל אתרים פנימיים לא נטענים</td><td>התנתקו והתחברו שוב; ב-Wi-Fi של מלון, השלימו קודם את דף הכניסה של המלון.</td></tr>' +
  '<tr><td>"Authentication failed"</td><td>בדקו את הסיסמה ב-Outlook באינטרנט; אם היא עובדת שם, פנו לתפעול.</td></tr>' +
  '</tbody></table>'
  } },

{ id: "mfa", cat: "training", updated: "30 Sep 2026",
  title: { en: "Setting up multi-factor authentication", he: "הגדרת אימות דו־שלבי" },
  summary: { en: "Protect your Microsoft 365 account with the Authenticator app.", he: "הגנה על חשבון Microsoft 365 עם אפליקציית Authenticator." },
  body: {
  en:
  '<ol class="steps">' +
  '<li>Install <strong>Microsoft Authenticator</strong> on your phone from the App Store or Google Play.</li>' +
  '<li>On your laptop, sign in to <code>https://mysignins.microsoft.com/security-info</code> with your company account.</li>' +
  '<li>Choose <strong>Add sign-in method → Authenticator app</strong> and follow the prompts.</li>' +
  '<li>Scan the QR code with the Authenticator app.</li>' +
  '<li>Approve the test notification to finish.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>Tip:</b> Add a phone number as a backup method, in case you lose or replace your phone.</div>' +
  '<p>Getting a new phone? Tell Operations <strong>before</strong> you wipe the old one so they can move your MFA.</p>',
  he:
  '<ol class="steps">' +
  '<li>התקינו את <strong>Microsoft Authenticator</strong> בטלפון מ-App Store או מ-Google Play.</li>' +
  '<li>במחשב, התחברו ל-<code>https://mysignins.microsoft.com/security-info</code> עם חשבון החברה.</li>' +
  '<li>בחרו <strong>Add sign-in method ← Authenticator app</strong> ופעלו לפי ההנחיות.</li>' +
  '<li>סרקו את קוד ה-QR באפליקציית Authenticator.</li>' +
  '<li>אשרו את הודעת הבדיקה כדי לסיים.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>טיפ:</b> הוסיפו מספר טלפון כשיטת גיבוי, למקרה שתאבדו או תחליפו את הטלפון.</div>' +
  '<p>מחליפים טלפון? הודיעו לתפעול <strong>לפני</strong> שאתם מוחקים את הישן, כדי שיעבירו את האימות.</p>'
  } },

{ id: "workdesk-time", cat: "training", updated: "18 Oct 2026",
  title: { en: "Logging your time in WorkDesk", he: "דיווח שעות ב-WorkDesk" },
  summary: { en: "Report hours against the right work order, every day.", he: "דיווח שעות על הזמנת העבודה הנכונה, כל יום." },
  body: {
  en:
  '<p class="lede">The Time Log keeps the report form in a narrow column on the left — about a fifth of the width — and your entries in the table that fills the rest beside it.</p>' +
  '<ol class="steps">' +
  '<li>On the portal home page, open <strong>WorkDesk</strong> (or choose <strong>Report time</strong>). WorkDesk opens on the <strong>Time Log</strong>.</li>' +
  '<li>Work down the form, one field under another. If you report for others, choose the person under <strong>Assignee</strong> first.</li>' +
  '<li>Choose the <strong>Date</strong> (<strong>Today</strong> beside it jumps back to today), the <strong>Type</strong> — <em>Work</em> for hours — and the <strong>Start</strong> and <strong>End</strong> time.</li>' +
  '<li>Choose the <strong>Hour type</strong>: <strong>Red</strong> for company time, <strong>Yellow</strong> for client work, <strong>Blue</strong> for managing a client\'s projects (managers).</li>' +
  '<li>Choose the <strong>Client</strong>, <strong>Project</strong> and <strong>Work order</strong>. Optionally, choose the <strong>Taskana task</strong> the time went to.</li>' +
  '<li>Write what you worked on in <strong>Description</strong> (the bigger box), add any <strong>Notes</strong>, and click <strong>Add entry</strong> — the large button stays in view at the foot of the form. The entry is registered — or sent for approval if it goes past your hours bank or the budget.</li>' +
  '</ol>' +
  '<p>The pill under the form shows whether your data is saved to GitHub; click it for details.</p>' +
  '<h2>When an entry needs approval</h2>' +
  '<p>It reaches your approver in the <strong>Approvals</strong> tab, where requests are shown as tiles side by side. They can <strong>Approve</strong>, <strong>Decline</strong> with a reason, or <strong>Request info</strong> — the entry then stays <em>Pending</em> and you answer their question in a comment on it.</p>' +
  '<h2>Useful shortcuts</h2>' +
  '<ul><li>From a task in Taskana, <strong>Report time on this task in WorkDesk</strong> opens the form with the project, work order and task already filled in.</li>' +
  '<li><strong>Duplicate</strong> an entry with the <i class="ui-ic" data-ic="copy"></i> button — to the previous or next day or week, a number of days back or forward (optionally onto every working day in between), or a specific date.</li>' +
  '<li>Click a work order code anywhere in a table to copy it.</li>' +
  '<li>Click a column heading to sort the table, drag a heading to move it, or drag its edge to resize it — the table stays at full width, and the main column takes up the space. Use <strong>＋ Save</strong> above the table to keep that layout as a view.</li>' +
  '<li>On your phone, use the running timer in the mobile layout. Below it, <strong>‹ ›</strong> change the month and <strong><i class="ui-ic" data-ic="sliders"></i> Filter &amp; sort</strong> narrows and sorts your entries; managers can switch to <strong>Me and my team</strong> to see the time of the people who report to them.</li></ul>' +
  '<div class="callout note"><b>Out of allowance?</b> Use <strong>Request hours</strong> under <i class="ui-ic" data-ic="assignments"></i> My assignments and allowances — your Team Lead or Project Manager approves or declines it.</div>' +
  '<p>Every field and option is described in the Handbook — see <a href="../handbook/index.html#ch-time">The Time Log</a> and <a href="../handbook/index.html#ch-approvals">Approvals</a>.</p>',
  he:
  '<p class="lede">ביומן השעות, טופס הדיווח נמצא בעמודה צרה מימין — כחמישית מהרוחב — והרישומים שלכם בטבלה שממלאת את השאר לצידו.</p>' +
  '<ol class="steps">' +
  '<li>בדף הבית של הפורטל, פתחו את <strong>WorkDesk</strong> (או בחרו <strong>דיווח שעות</strong>). ‏WorkDesk נפתח ב<strong>יומן השעות</strong>.</li>' +
  '<li>מלאו את הטופס מלמעלה למטה, שדה מתחת לשדה. אם אתם מדווחים גם עבור אחרים, בחרו קודם את האדם בשדה <strong>עבור</strong>.</li>' +
  '<li>בחרו <strong>תאריך</strong> (<strong>היום</strong> שלידו מחזיר להיום), <strong>סוג</strong> — <em>עבודה</em> לשעות — ושעת <strong>התחלה</strong> ו<strong>סיום</strong>.</li>' +
  '<li>בחרו <strong>סוג שעות</strong>: <strong>אדום</strong> לזמן חברה, <strong>צהוב</strong> לעבודה ללקוח, <strong>כחול</strong> לניהול פרויקטים של לקוח (מנהלים).</li>' +
  '<li>בחרו <strong>לקוח</strong>, <strong>פרויקט</strong> ו<strong>הזמנת עבודה</strong>. אפשר גם לבחור את <strong>המשימה ב-Taskana</strong> שהזמן הוקדש לה.</li>' +
  '<li>כתבו במה עבדתם ב<strong>תיאור</strong> (התיבה הגדולה), הוסיפו <strong>הערות</strong> אם צריך, ולחצו <strong>הוספת רישום</strong> — הכפתור הגדול נשאר גלוי בתחתית הטופס. הרישום נרשם — או נשלח לאישור אם הוא חורג מבנק השעות שלכם או מהתקציב.</li>' +
  '</ol>' +
  '<p>הכפתור שמתחת לטופס מראה אם הנתונים שלכם נשמרו ב-GitHub; לחיצה עליו מציגה פרטים.</p>' +
  '<h2>כשרישום צריך אישור</h2>' +
  '<p>הוא מגיע למאשר/ת שלכם בלשונית <strong>אישורים</strong>, שבה הבקשות מוצגות כאריחים זה לצד זה. אפשר <strong>לאשר</strong>, <strong>לדחות</strong> עם סיבה, או לבחור <strong>בקשת מידע</strong> — הרישום נשאר <em>ממתין</em>, ואתם עונים על השאלה בתגובה עליו.</p>' +
  '<h2>קיצורי דרך שימושיים</h2>' +
  '<ul><li>ממשימה ב-Taskana, <strong>דיווח שעות על המשימה ב-WorkDesk</strong> פותח את הטופס כשהפרויקט, הזמנת העבודה והמשימה כבר ממולאים.</li>' +
  '<li><strong>שכפלו</strong> רישום עם הכפתור <i class="ui-ic" data-ic="copy"></i> — ליום או לשבוע הקודם או הבא, למספר ימים אחורה או קדימה (ואפשר לכל יום עבודה שביניהם), או לתאריך מסוים.</li>' +
  '<li>לחיצה על קוד הזמנת עבודה בכל טבלה מעתיקה אותו.</li>' +
  '<li>לחצו על כותרת עמודה למיון, גררו כותרת להזזה או גררו את הקצה לשינוי הרוחב — הטבלה נשארת ברוחב מלא, והעמודה הראשית תופסת את המקום. <strong>＋ שמירה</strong> מעל הטבלה שומר את הפריסה כתצוגה.</li>' +
  '<li>בטלפון, השתמשו בטיימר שבתצוגת הטלפון. מתחתיו, <strong>‹ ›</strong> מחליפים חודש ו<strong><i class="ui-ic" data-ic="sliders"></i> סינון ומיון</strong> מצמצם וממיין את הרישומים; מנהלים יכולים לעבור ל<strong>אני והצוות שלי</strong> כדי לראות את השעות של מי שכפוף להם.</li></ul>' +
  '<div class="callout note"><b>נגמרה המכסה?</b> השתמשו ב<strong>בקשת שעות</strong> תחת <i class="ui-ic" data-ic="assignments"></i> השיבוצים והמכסות שלי — ראש הצוות או מנהל/ת הפרויקט מאשרים או דוחים.</div>' +
  '<p>כל שדה ואפשרות מתוארים במדריך — ראו <a href="../handbook/he.html#ch-time">יומן השעות</a> ו<a href="../handbook/he.html#ch-approvals">אישורים</a>.</p>'
  } },

{ id: "workdesk-plan", cat: "training", updated: "16 Oct 2026",
  title: { en: "Planning your week in WorkDesk", he: "תכנון השבוע ב-WorkDesk" },
  summary: { en: "Use the Week Planner to plan next week's hours.", he: "תכנון שעות השבוע הבא במתכנן השבועי." },
  body: {
  en:
  '<ol class="steps">' +
  '<li>Open the <strong>Week Planner</strong> tab and move to next week with the arrows.</li>' +
  '<li>Your open Taskana tasks with a due date appear as suggestions above the week — drag one onto a day to plan it.</li>' +
  '<li>Or click <strong>+ plan</strong> on a day and add planned hours against your assigned project and work order.</li>' +
  '<li>Planning to be away? Request the days as vacation in the Time Log — see <a href="#/workdesk-leave">Requesting sick and vacation days</a>.</li>' +
  '</ol>' +
  '<p>Plans save automatically. Finish next week\'s plan by Thursday.</p>',
  he:
  '<ol class="steps">' +
  '<li>פתחו את לשונית <strong>המתכנן השבועי</strong> ועברו לשבוע הבא עם החצים.</li>' +
  '<li>המשימות הפתוחות שלכם ב-Taskana עם תאריך יעד מופיעות כהצעות מעל השבוע — גררו אחת ליום כדי לתכנן אותה.</li>' +
  '<li>או לחצו <strong>+ תכנון</strong> ביום מסוים והוסיפו שעות מתוכננות על הפרויקט והזמנת העבודה שלכם.</li>' +
  '<li>מתכננים להיעדר? בקשו את הימים כחופשה ביומן השעות — ראו <a href="#/workdesk-leave">בקשת ימי מחלה וחופשה</a>.</li>' +
  '</ol>' +
  '<p>התכנון נשמר אוטומטית. סיימו את תכנון השבוע הבא עד יום חמישי.</p>'
  } },

{ id: "workdesk-dashboard", cat: "training", updated: "18 Oct 2026",
  title: { en: "Customizing your Dashboard", he: "התאמה אישית של לוח הבקרה" },
  summary: { en: "Keep several dashboards and build them from ready-made widgets or your own measures and charts.", he: "כמה לוחות בקרה משלכם, בנויים מרכיבים מוכנים או ממדדים ותרשימים שתבחרו." },
  body: {
  en:
  '<p class="lede">The <strong>Dashboard</strong> tab shows your hours, utilisation, plans and expenses — and, for managers, those of the people they look after. It is yours to shape: keep several dashboards, choose the widgets on each and arrange them the way you read them.</p>' +
  '<h2>What every widget follows</h2>' +
  '<ul><li>The bar at the top sets the period — <strong>This week</strong>, <strong>This month</strong>, <strong>Last month</strong>, <strong>Last 3 months</strong>, <strong>This year</strong> or <strong>All time</strong> — and shows figures as <strong>Values</strong> or <strong>%</strong>.</li>' +
  '<li>The filters under it narrow everything by <strong>Employee</strong> (managers), <strong>Client</strong>, <strong>Project</strong> and <strong>Work order</strong>. <strong>Clear</strong> removes them.</li>' +
  '<li><strong>Export</strong>, when your role allows it, downloads the figures to Excel.</li></ul>' +
  '<h2>Your dashboards</h2>' +
  '<ul><li>Each dashboard is a pill above the widgets — click one to switch. Your first, <em>Overview</em>, comes with a standard set of widgets.</li>' +
  '<li><strong>+ New dashboard</strong> asks for a name and opens an empty dashboard, ready to customize.</li>' +
  '<li>Dashboards are saved with your WorkDesk data, so they follow you to every device. Nobody else sees them.</li></ul>' +
  '<h2>Customize a dashboard</h2>' +
  '<ol class="steps">' +
  '<li>Open the dashboard and click <strong><i class="ui-ic" data-ic="edit"></i> Customize</strong>. The tools appear above the widgets.</li>' +
  '<li>Click <strong>+ Add widget</strong> and pick a ready-made widget from the catalogue — or choose <strong>Build your own…</strong> (see below).</li>' +
  '<li>Move widgets: drag one to its new place, or use <strong>←</strong> and <strong>→</strong> on it. <i class="ui-ic" data-ic="edit"></i> on a widget opens its settings; <strong>×</strong> removes it.</li>' +
  '<li>Click <strong>Done</strong>. The dashboard is saved as it is.</li>' +
  '</ol>' +
  '<table><thead><tr><th>Button</th><th>What it does</th></tr></thead><tbody>' +
  '<tr><td>+ Add widget</td><td>Opens the catalogue of ready-made widgets, and <strong>Build your own…</strong></td></tr>' +
  '<tr><td>Rename</td><td>Gives the dashboard a new name.</td></tr>' +
  '<tr><td>Duplicate</td><td>Makes a copy, named “(copy)”, to vary without losing the original.</td></tr>' +
  '<tr><td>Reset</td><td>Replaces the dashboard\'s widgets with the standard set (it asks first).</td></tr>' +
  '<tr><td>Delete</td><td>Deletes the dashboard and its widgets (it asks first). You always keep at least one.</td></tr>' +
  '<tr><td>Done</td><td>Leaves customizing.</td></tr>' +
  '</tbody></table>' +
  '<h2>The catalogue</h2>' +
  '<p>Ready-made widgets include <em>Total hours</em>, <em>Utilisation</em>, <em>Hours over time</em>, <em>Hours by week</em>, <em>Hours by client</em>, <em>Hours by project</em>, <em>Hours by employee</em>, <em>Utilisation by employee</em> and <em>by team</em>, <em>Hour type split</em>, <em>Actual minus planned by employee</em>, <em>Expenses by employee</em> and <em>by client</em>, <em>Sick and vacation by employee</em>, <em>Hours in approval by employee</em> and <em>Hour split · plan against actual</em>. Managers also get the <em>Manager cockpit</em> and <em>Budgets at risk</em>.</p>' +
  '<h2>Build your own widget</h2>' +
  '<p><strong>Build your own…</strong> opens the widget\'s settings. Fill them in and click <strong>Add to dashboard</strong>; change them later from <i class="ui-ic" data-ic="edit"></i> on the widget.</p>' +
  '<table><thead><tr><th>Setting</th><th>Choices</th></tr></thead><tbody>' +
  '<tr><td>Title</td><td>What the widget is called on the dashboard.</td></tr>' +
  '<tr><td>What to measure</td><td>Total hours; Red, Yellow or Blue hours; Utilisation; Entries reported; People reporting; Planned hours; Actual minus planned; Hours in approval; Sick days; Vacation days; Expenses (₪).</td></tr>' +
  '<tr><td>Group by</td><td>No grouping (one number); Day, Week, Month or Day of the week; Employee or Team; Client, Project or Work order; Hour type; Entry type.</td></tr>' +
  '<tr><td>Show as</td><td><strong>Number</strong> (with no grouping), or <strong>Horizontal bars</strong>, <strong>Columns</strong>, <strong>Line</strong>, <strong>Area</strong>, <strong>Donut</strong> or <strong>Table</strong>.</td></tr>' +
  '<tr><td>Show the top</td><td>5, 10, 20 or all of the groups — for people, clients, projects and work orders.</td></tr>' +
  '<tr><td>Only for employee · client · project</td><td>Narrows this widget further than the dashboard\'s filters.</td></tr>' +
  '<tr><td>Width</td><td>¼, ⅓, ½, ⅔ or the full width of the dashboard.</td></tr>' +
  '<tr><td>Colour</td><td>Teal, Green, Yellow, Red, Blue or Amber — for bars, columns, lines and areas.</td></tr>' +
  '</tbody></table>' +
  '<div class="callout tip"><b>Tip:</b> Keep one dashboard per question — for example <em>My month</em>, <em>Billing</em> or <em>Client X</em> — rather than one crowded page.</div>' +
  '<p>The Handbook describes every widget — see <a href="../handbook/index.html#h-dash-custom">Customizing a dashboard</a>.</p>',
  he:
  '<p class="lede">לשונית <strong>לוח בקרה</strong> מציגה את השעות, הניצולת, התכנון וההוצאות שלכם — ולמנהלים, גם של האנשים שבאחריותם. אתם קובעים איך היא נראית: אפשר להחזיק כמה לוחות, לבחור את הרכיבים בכל אחד ולסדר אותם כמו שנוח לכם לקרוא.</p>' +
  '<h2>מה כל רכיב משקף</h2>' +
  '<ul><li>הסרגל העליון קובע את התקופה — <strong>השבוע</strong>, <strong>החודש</strong>, <strong>החודש שעבר</strong>, <strong>3 החודשים האחרונים</strong>, <strong>השנה</strong> או <strong>כל התקופה</strong> — ומציג נתונים כ<strong>ערכים</strong> או ב-<strong>%</strong>.</li>' +
  '<li>המסננים שמתחתיו מצמצמים הכול לפי <strong>עובד/ת</strong> (מנהלים), <strong>לקוח</strong>, <strong>פרויקט</strong> ו<strong>הזמנת עבודה</strong>. <strong>ניקוי</strong> מבטל אותם.</li>' +
  '<li><strong>ייצוא</strong>, כשהתפקיד שלכם מאפשר, מוריד את הנתונים לאקסל.</li></ul>' +
  '<h2>הלוחות שלכם</h2>' +
  '<ul><li>כל לוח מוצג ככפתור מעל הרכיבים — לחיצה עוברת אליו. הלוח הראשון, <em>סקירה</em>, מגיע עם סט רכיבים רגיל.</li>' +
  '<li><strong>+ לוח חדש</strong> מבקש שם ופותח לוח ריק, מוכן להתאמה.</li>' +
  '<li>הלוחות נשמרים עם הנתונים שלכם ב-WorkDesk, כך שהם זמינים בכל מכשיר. אף אחד אחר לא רואה אותם.</li></ul>' +
  '<h2>התאמה אישית של לוח</h2>' +
  '<ol class="steps">' +
  '<li>פתחו את הלוח ולחצו <strong><i class="ui-ic" data-ic="edit"></i> התאמה אישית</strong>. הכלים מופיעים מעל הרכיבים.</li>' +
  '<li>לחצו <strong>+ הוספת רכיב</strong> ובחרו רכיב מוכן מהקטלוג — או <strong>בנייה עצמית…</strong> (ראו בהמשך).</li>' +
  '<li>הזיזו רכיבים: גררו רכיב למקומו החדש, או השתמשו ב-<strong>→</strong> וב-<strong>←</strong> שעליו. <i class="ui-ic" data-ic="edit"></i> ברכיב פותח את ההגדרות שלו; <strong>×</strong> מסיר אותו.</li>' +
  '<li>לחצו <strong>הושלם</strong>. הלוח נשמר כמו שהוא.</li>' +
  '</ol>' +
  '<table><thead><tr><th>כפתור</th><th>מה הוא עושה</th></tr></thead><tbody>' +
  '<tr><td>+ הוספת רכיב</td><td>פותח את קטלוג הרכיבים המוכנים, ואת <strong>בנייה עצמית…</strong></td></tr>' +
  '<tr><td>שינוי שם</td><td>נותן ללוח שם חדש.</td></tr>' +
  '<tr><td>שכפול</td><td>יוצר עותק, כדי לשנות אותו בלי לאבד את המקור.</td></tr>' +
  '<tr><td>איפוס</td><td>מחליף את הרכיבים בלוח בסט הרגיל (אחרי אישור).</td></tr>' +
  '<tr><td>מחיקה</td><td>מוחק את הלוח ואת הרכיבים שלו (אחרי אישור). תמיד נשאר לפחות לוח אחד.</td></tr>' +
  '<tr><td>הושלם</td><td>יציאה מההתאמה האישית.</td></tr>' +
  '</tbody></table>' +
  '<h2>הקטלוג</h2>' +
  '<p>בין הרכיבים המוכנים: <em>סה"כ שעות</em>, <em>ניצולת</em>, <em>שעות לאורך זמן</em>, <em>שעות לפי שבוע</em>, <em>שעות לפי לקוח</em>, <em>שעות לפי פרויקט</em>, <em>שעות לפי עובד/ת</em>, <em>ניצולת לפי עובד/ת</em> ו<em>לפי צוות</em>, <em>חלוקת סוגי שעות</em>, <em>בפועל פחות מתוכנן לפי עובד/ת</em>, <em>הוצאות לפי עובד/ת</em> ו<em>לפי לקוח</em>, <em>מחלה וחופשה לפי עובד/ת</em>, <em>שעות באישור לפי עובד/ת</em> ו<em>חלוקת שעות · תכנון מול ביצוע</em>. למנהלים יש גם <em>תמונת מצב למנהל</em> ו<em>תקציבים בסיכון</em>.</p>' +
  '<h2>בנייה עצמית של רכיב</h2>' +
  '<p><strong>בנייה עצמית…</strong> פותח את הגדרות הרכיב. מלאו אותן ולחצו <strong>הוספה ללוח</strong>; אפשר לשנות אותן אחר כך דרך <i class="ui-ic" data-ic="edit"></i> ברכיב.</p>' +
  '<table><thead><tr><th>הגדרה</th><th>אפשרויות</th></tr></thead><tbody>' +
  '<tr><td>כותרת</td><td>השם של הרכיב בלוח.</td></tr>' +
  '<tr><td>מה למדוד</td><td>סה"כ שעות; שעות אדומות, צהובות או כחולות; ניצולת; רישומים שדווחו; אנשים שדיווחו; שעות מתוכננות; בפועל פחות מתוכנן; שעות באישור; ימי מחלה; ימי חופשה; הוצאות (₪).</td></tr>' +
  '<tr><td>קיבוץ לפי</td><td>ללא קיבוץ (מספר אחד); יום, שבוע, חודש או יום בשבוע; עובד/ת או צוות; לקוח, פרויקט או הזמנת עבודה; סוג שעות; סוג רישום.</td></tr>' +
  '<tr><td>תצוגה</td><td><strong>מספר</strong> (ללא קיבוץ), או <strong>עמודות אופקיות</strong>, <strong>עמודות</strong>, <strong>קו</strong>, <strong>שטח</strong>, <strong>טבעת</strong> או <strong>טבלה</strong>.</td></tr>' +
  '<tr><td>להציג את המובילים</td><td>5, 10, 20 או כל הקבוצות — לאנשים, ללקוחות, לפרויקטים ולהזמנות עבודה.</td></tr>' +
  '<tr><td>רק עבור עובד/ת · לקוח · פרויקט</td><td>מצמצם את הרכיב הזה מעבר למסננים של הלוח.</td></tr>' +
  '<tr><td>רוחב</td><td>רבע, שליש, חצי, שני שלישים או רוחב מלא של הלוח.</td></tr>' +
  '<tr><td>צבע</td><td>טורקיז, ירוק, צהוב, אדום, כחול או כתום — לעמודות, לקווים ולשטחים.</td></tr>' +
  '</tbody></table>' +
  '<div class="callout tip"><b>טיפ:</b> החזיקו לוח לכל שאלה — למשל <em>החודש שלי</em>, <em>חיוב</em> או <em>לקוח X</em> — במקום עמוד אחד עמוס.</div>' +
  '<p>המדריך מתאר כל רכיב — ראו <a href="../handbook/he.html#h-dash-custom">התאמה אישית של לוח</a>.</p>'
  } },

{ id: "workdesk-leave", cat: "training", updated: "30 Sep 2026",
  title: { en: "Requesting sick and vacation days in WorkDesk", he: "בקשת ימי מחלה וחופשה ב-WorkDesk" },
  summary: { en: "Send a sick or vacation request for a date range, with a supporting document.", he: "שליחת בקשת מחלה או חופשה לטווח תאריכים, עם מסמך תומך." },
  body: {
  en:
  '<p class="lede">Sick and vacation days go to your manager as a request. They count once your manager approves them.</p>' +
  '<ol class="steps">' +
  '<li>Open the <strong>Time Log</strong> tab and set <strong>Type</strong> to <em>Sick</em> or <em>Vacation</em>.</li>' +
  '<li>Choose the <strong>From</strong> and <strong>To</strong> dates. <strong>Days</strong> shows the working days (Sunday to Thursday) in the range.</li>' +
  '<li>For sick leave, attach the confirmation from the clinic or doctor\'s office under <strong>Sick-leave confirmation</strong> — a PDF or an image, up to 2 MB.</li>' +
  '<li>Add a short description and click <strong>Send request</strong>.</li>' +
  '</ol>' +
  '<p>The form shows who the request goes to — your direct manager. Until they decide, the days show as <strong>Pending</strong> and are not counted. If they decline, you\'ll see their reason on each day.</p>' +
  '<div class="callout note"><b>Note:</b> Only the CEO records sick and vacation days without a request.</div>',
  he:
  '<p class="lede">ימי מחלה וחופשה נשלחים למנהל/ת שלכם כבקשה. הם נספרים אחרי שהמנהל/ת מאשרים.</p>' +
  '<ol class="steps">' +
  '<li>פתחו את לשונית <strong>יומן השעות</strong> ובחרו ב<strong>סוג</strong> <em>מחלה</em> או <em>חופשה</em>.</li>' +
  '<li>בחרו תאריכים ב<strong>מתאריך</strong> וב<strong>עד תאריך</strong>. השדה <strong>ימים</strong> מציג את ימי העבודה (ראשון עד חמישי) בטווח.</li>' +
  '<li>במחלה, צרפו את האישור מהמרפאה או מהרופא תחת <strong>אישור מחלה</strong> — PDF או תמונה, עד 2 MB.</li>' +
  '<li>הוסיפו תיאור קצר ולחצו <strong>שליחת בקשה</strong>.</li>' +
  '</ol>' +
  '<p>הטופס מראה למי הבקשה נשלחת — המנהל/ת הישיר/ה שלכם. עד ההחלטה, הימים מוצגים כ<strong>ממתינים</strong> ואינם נספרים. אם הבקשה נדחית, הסיבה תופיע בכל יום.</p>' +
  '<div class="callout note"><b>שימו לב:</b> רק המנכ"ל רושם ימי מחלה וחופשה בלי בקשה.</div>'
  } },

{ id: "workdesk-expenses", cat: "training", updated: "30 Sep 2026",
  title: { en: "Reporting expenses in WorkDesk", he: "דיווח הוצאות ב-WorkDesk" },
  summary: { en: "Submit a claim with evidence and follow it through approval.", he: "הגשת תביעה עם אסמכתה ומעקב עד לאישור." },
  body: {
  en:
  '<ol class="steps">' +
  '<li>Open the <strong>Expenses</strong> tab.</li>' +
  '<li>Choose the expense type, date, amount and the project it relates to.</li>' +
  '<li>Attach a photo or PDF of the receipt. You can replace or remove it later.</li>' +
  '<li>Click <strong>Add expense</strong>. The claim goes to your approver; you\'ll see its status change in the list.</li>' +
  '</ol>' +
  '<p>See the <a href="#/expenses-policy">Expenses policy</a> for what you can claim.</p>',
  he:
  '<ol class="steps">' +
  '<li>פתחו את לשונית <strong>הוצאות</strong>.</li>' +
  '<li>בחרו סוג הוצאה, תאריך, סכום והפרויקט שאליו היא שייכת.</li>' +
  '<li>צרפו צילום או PDF של הקבלה. אפשר להחליף או להסיר אותו אחר כך.</li>' +
  '<li>לחצו <strong>הוספת הוצאה</strong>. התביעה עוברת למאשר/ת, והסטטוס שלה מתעדכן ברשימה.</li>' +
  '</ol>' +
  '<p>מה אפשר לתבוע — ב<a href="#/expenses-policy">נוהל ההוצאות</a>.</p>'
  } },

{ id: "workdesk-wo-document", cat: "training", updated: "18 Oct 2026",
  title: { en: "Work order documents for clients", he: "מסמכי הזמנת עבודה ללקוחות" },
  summary: { en: "Fill in a work order and send the client an official GALIL PDF, in English or Hebrew.", he: "ממלאים הזמנת עבודה ושולחים ללקוח מסמך PDF רשמי של גליל, באנגלית או בעברית." },
  body: {
  en:
  '<p class="lede">Project Managers, Operations and the CEO can turn any work order into an official GALIL document — letterhead, scope, budget, contacts and signature blocks — and send it to the client.</p>' +
  '<h2>Fill in the work order</h2>' +
  '<ol class="steps">' +
  '<li>In WorkDesk, open <strong>Management → Work Orders</strong> and click <strong>+ New work order</strong>, or the <i class="ui-ic" data-ic="edit"></i> on an existing one.</li>' +
  '<li>Besides the code, title, dates and budgeted hours, fill in <strong>Scope of work</strong>, the <strong>Deliverables</strong> (one per line), the <strong>Client points of contact</strong>, GALIL\'s <strong>Project lead</strong> and <strong>Team members</strong>, and the <strong>Signatures</strong>.</li>' +
  '<li>Optionally, fill in <strong>Title in Hebrew</strong>. The Hebrew document uses it; when it is empty, the English title is used.</li>' +
  '<li>Save.</li></ol>' +
  '<h2>What the document contains</h2>' +
  '<ul><li>The GALIL letterhead with the <strong>[G]</strong> mark, and the heading <strong>Work order</strong> followed by the order\'s code.</li>' +
  '<li><strong>Order details</strong> — the order\'s title, client, project, status, contract reference, owner and dates — then the scope, deliverables and budget.</li>' +
  '<li>The client\'s points of contact and GALIL\'s project team.</li>' +
  '<li>Numbered <strong>Terms of engagement</strong>: schedule, the responsibilities of each side, delays, changes, acceptance, payment, confidentiality, ownership, liability, termination and general terms.</li>' +
  '<li>Both signature blocks together at the foot of the last page.</li></ul>' +
  '<p>The Hebrew document is laid out right to left, and brackets, codes and English names inside it read correctly.</p>' +
  '<h2>Create and send the document</h2>' +
  '<ol class="steps">' +
  '<li>Click <i class="ui-ic" data-ic="file"></i> on the work order\'s row (or <strong>Document (PDF)</strong> in the editor).</li>' +
  '<li>Choose <strong>English</strong> or <strong>עברית</strong>. The preview updates.</li>' +
  '<li><strong>Download PDF</strong> to keep a copy, or <strong>Email</strong> to send it to the addresses in <strong>Send to</strong>.</li></ol>' +
  '<div class="callout note"><b>Attaching on a computer:</b> on a phone, and in Edge and Safari, the PDF is attached for you. In other browsers it downloads and your mail app opens with the message written — attach the downloaded file before sending.</div>' +
  '<div class="callout tip"><b>Tip:</b> Fill in the client\'s contacts on the work order — the document lists them, and <strong>Send to</strong> uses their addresses.</div>',
  he:
  '<p class="lede">מנהלי פרויקטים, התפעול והמנכ"ל יכולים להפוך כל הזמנת עבודה למסמך רשמי של גליל — נייר מכתבים, היקף עבודה, תקציב, אנשי קשר ואזורי חתימה — ולשלוח אותו ללקוח.</p>' +
  '<h2>ממלאים את הזמנת העבודה</h2>' +
  '<ol class="steps">' +
  '<li>ב-WorkDesk, פתחו <strong>ניהול ← הזמנות עבודה</strong> ולחצו <strong>+ הזמנת עבודה חדשה</strong>, או <i class="ui-ic" data-ic="edit"></i> בהזמנה קיימת.</li>' +
  '<li>מלבד הקוד, הכותרת, התאריכים והשעות המתוקצבות, מלאו את <strong>היקף העבודה</strong>, את <strong>התוצרים</strong> (אחד בכל שורה), את <strong>אנשי הקשר מטעם הלקוח</strong>, את <strong>מוביל/ת הפרויקט</strong> ו<strong>חברי הצוות</strong> מגליל, ואת <strong>החתימות</strong>.</li>' +
  '<li>אפשר גם למלא <strong>שם בעברית (למסמך בעברית)</strong>. המסמך בעברית משתמש בו; כשהוא ריק, משמש השם באנגלית.</li>' +
  '<li>שמרו.</li></ol>' +
  '<h2>מה יש במסמך</h2>' +
  '<ul><li>נייר המכתבים של גליל עם הסמל <strong>[G]</strong>, והכותרת <strong>הזמנת עבודה</strong> ואחריה קוד ההזמנה.</li>' +
  '<li><strong>פרטי ההזמנה</strong> — שם ההזמנה, הלקוח, הפרויקט, הסטטוס, אסמכתת החוזה, מנהל/ת הפרויקט והתאריכים — ואחריהם היקף העבודה, התוצרים והתקציב.</li>' +
  '<li>אנשי הקשר מטעם הלקוח וצוות הפרויקט מטעם גליל.</li>' +
  '<li><strong>תנאי ההתקשרות</strong> בסעיפים ממוספרים: לוח זמנים, האחריות של כל צד, עיכובים, שינויים, קבלת התוצרים, תשלום, סודיות, בעלות, אחריות לנזקים, סיום ההתקשרות והוראות כלליות.</li>' +
  '<li>שני אזורי החתימה יחד בתחתית העמוד האחרון.</li></ul>' +
  '<p>המסמך בעברית ערוך מימין לשמאל, וסוגריים, קודים ושמות באנגלית בתוכו מוצגים נכון.</p>' +
  '<h2>מפיקים ושולחים את המסמך</h2>' +
  '<ol class="steps">' +
  '<li>לחצו <i class="ui-ic" data-ic="file"></i> בשורה של ההזמנה (או <strong>מסמך (PDF)</strong> בעורך).</li>' +
  '<li>בחרו <strong>English</strong> או <strong>עברית</strong>. התצוגה המקדימה מתעדכנת.</li>' +
  '<li><strong>הורדת PDF</strong> שומרת עותק, ו<strong>דוא״ל</strong> שולח אותו לכתובות שב<strong>שליחה אל</strong>.</li></ol>' +
  '<div class="callout note"><b>צירוף במחשב:</b> בטלפון, וב-Edge וב-Safari, ה-PDF מצורף עבורכם. בדפדפנים אחרים הוא יורד ואפליקציית הדוא״ל נפתחת עם ההודעה כתובה — צרפו את הקובץ שירד לפני השליחה.</div>' +
  '<div class="callout tip"><b>טיפ:</b> מלאו את אנשי הקשר של הלקוח בהזמנת העבודה — המסמך מציג אותם, ו<strong>שליחה אל</strong> משתמש בכתובות שלהם.</div>'
  } },

{ id: "taskana-tasks", cat: "training", updated: "18 Oct 2026",
  title: { en: "Working with tasks in Taskana", he: "עבודה עם משימות ב-Taskana" },
  summary: { en: "Find your tasks, move them through review, ask questions and see your hours bank.", he: "איתור המשימות שלכם, העברתן בשלבי הסקירה, שאלות ובנק השעות." },
  body: {
  en:
  '<ol class="steps">' +
  '<li>On the portal home page, open <strong>Taskana</strong>. <strong>My work</strong> lists the tasks assigned to you.</li>' +
  '<li>Open a task to see its description, checklist, due date, project and work order.</li>' +
  '<li>Move it through the workflow as you go: <em>Backlog → To Do → Writing → Peer Review → SME Review → Done</em> — on the <strong>Board</strong> by dragging, or with the <strong>Status</strong> field.</li>' +
  '<li>Ask a question in the task\'s comments and mention a colleague with <code>@</code>. Answers, mentions and assignments arrive in your <strong>Inbox</strong>.</li>' +
  '</ol>' +
  '<h2>Hours and budgets</h2>' +
  '<ul><li><strong>Hours in WorkDesk</strong>, in each task, shows the time reported against it and how it compares with the estimate.</li>' +
  '<li><strong>My hours banks</strong>, on My work, shows your allowance on each project and how much is left.</li>' +
  '<li>Managers also see the project and work-order budgets, and everyone\'s hours banks, on each project page.</li></ul>' +
  '<div class="callout note"><b>Note:</b> Clients, projects and people are set in WorkDesk — Taskana shows them and keeps the tasks. See <a href="#/portal-how">How WorkDesk and Taskana work together</a>.</div>' +
  '<div class="callout tip"><b>Tip:</b> Research for a task — SME interviews, site visits, walkthroughs — goes in the <strong>Library</strong>, in Taskana\'s sidebar. See <a href="#/library-start">Getting started with the Library</a>.</div>',
  he:
  '<ol class="steps">' +
  '<li>בדף הבית של הפורטל, פתחו את <strong>Taskana</strong>. העמוד <strong>העבודה שלי</strong> מציג את המשימות שהוקצו לכם.</li>' +
  '<li>פתחו משימה כדי לראות את התיאור, רשימת הבדיקה, תאריך היעד, הפרויקט והזמנת העבודה.</li>' +
  '<li>העבירו אותה בשלבי העבודה: <em>צבר ← לביצוע ← כתיבה ← סקירת עמיתים ← סקירת מומחה תוכן ← הושלם</em> — ב<strong>לוח</strong> בגרירה, או בשדה <strong>סטטוס</strong>.</li>' +
  '<li>שאלו שאלה בתגובות של המשימה ותייגו עמית עם <code>@</code>. תשובות, תיוגים והקצאות מגיעים ל<strong>תיבת הדואר</strong> שלכם.</li>' +
  '</ol>' +
  '<h2>שעות ותקציבים</h2>' +
  '<ul><li><strong>שעות ב-WorkDesk</strong>, בכל משימה, מציג את הזמן שדווח עליה ואת ההשוואה להערכה.</li>' +
  '<li><strong>בנקי השעות שלי</strong>, בעמוד העבודה שלי, מציג את המכסה שלכם בכל פרויקט וכמה נותר.</li>' +
  '<li>מנהלים רואים גם את תקציבי הפרויקט והזמנות העבודה, ואת בנקי השעות של כולם, בעמוד של כל פרויקט.</li></ul>' +
  '<div class="callout note"><b>שימו לב:</b> לקוחות, פרויקטים ואנשים מוגדרים ב-WorkDesk — ‏Taskana מציגה אותם ומחזיקה את המשימות. ראו <a href="#/portal-how">איך WorkDesk ו-Taskana עובדים יחד</a>.</div>' +
  '<div class="callout tip"><b>טיפ:</b> התחקיר למשימה — ראיונות עם מומחי תוכן, ביקורי אתר, הדגמות — נכתב ב<strong>ספרייה</strong>, בסרגל הצדדי של Taskana. ראו <a href="#/library-start">צעדים ראשונים בספרייה</a>.</div>'
  } },

{ id: "library-start", cat: "training", updated: "18 Oct 2026",
  title: { en: "Getting started with the Library", he: "צעדים ראשונים בספרייה" },
  summary: { en: "Open the team's research notebook in Taskana, find and create documents, edit them safely and export them.", he: "פתיחת מחברת התחקיר של הצוות ב-Taskana, איתור ויצירה של מסמכים, עריכה בטוחה וייצוא." },
  body: {
  en:
  '<p class="lede">The Library is the team\'s research notebook: rich documents for collecting and working through what subject-matter experts tell you — in interviews, on site visits and in product walkthroughs at the client — and for the house notes the team keeps. It lives in Taskana, beside the tasks the research is for.</p>' +
  '<h2>Opening it</h2>' +
  '<p>In Taskana, choose <strong>Library</strong> in the sidebar. The Library is no longer a WorkDesk tab — until October 2026 it was, and its items were brought into Taskana as <em>Research notes</em> the first time the Library was opened.</p>' +
  '<table><thead><tr><th>Taskana role</th><th>In the Library</th></tr></thead><tbody>' +
  '<tr><td>Admin, Manager</td><td>Read and write; lock, unlock and delete any document; manage everyone\'s snippets.</td></tr>' +
  '<tr><td>Member</td><td>Read and write; lock and delete their own documents.</td></tr>' +
  '<tr><td>Viewer</td><td>Read only.</td></tr>' +
  '<tr><td>External</td><td>No Library.</td></tr>' +
  '</tbody></table>' +
  '<h2>Finding a document</h2>' +
  '<ul><li>With no document open, the list of documents fills the left side. Each shows its title, kind, status, the number of open follow-ups (a <strong>?</strong> badge), its client, project and expert, and who changed it last.</li>' +
  '<li><strong>Search the library</strong> looks through titles, experts, places, tags and the full text of every document. The three selectors narrow the list by kind, status and client.</li>' +
  '<li>With a document open, the list folds away so the document has the width. <strong>Documents</strong> at the top brings the list back, and hides it again.</li>' +
  '<li>A private document appears only in its author\'s list.</li></ul>' +
  '<h2>Creating a document</h2>' +
  '<ol class="steps">' +
  '<li>Click <strong>New document</strong> and choose what it is for. Each kind starts from a template.</li>' +
  '<li>The document opens with the <strong>Details</strong> tab showing. Give it a title, then set its client, project, task, expert and date.</li>' +
  '<li>Click <strong>Edit document</strong> and start writing — or paste your raw notes and let <strong>Organize</strong> structure them (see <a href="#/library-sme-interview">Running an SME interview in the Library</a>).</li>' +
  '</ol>' +
  '<table><thead><tr><th>Kind</th><th>The template sets out</th></tr></thead><tbody>' +
  '<tr><td>SME interview</td><td>Interview details (expert, role, date and place, attendees, recording), goals, questions and answers, procedures described, terminology, follow-ups.</td></tr>' +
  '<tr><td>Site visit</td><td>Visit details (site, date, host, equipment and versions), what was observed, procedures observed, photos and screens, safety notes, follow-ups.</td></tr>' +
  '<tr><td>Walkthrough</td><td>System and version, steps shown, a table of screens and messages, follow-ups.</td></tr>' +
  '<tr><td>Research notes</td><td>Sources, findings, open questions.</td></tr>' +
  '<tr><td>Meeting notes</td><td>Agenda, decisions, action items.</td></tr>' +
  '<tr><td>Blank document</td><td>An empty page.</td></tr>' +
  '</tbody></table>' +
  '<h2>Reading and editing</h2>' +
  '<p>A document always opens for reading, so a stray click or key can\'t change it. Links work, and nothing you type lands in the text.</p>' +
  '<ul><li><strong>Edit document</strong> — or <code>Ctrl</code>+<code>E</code>, or a double-click in the text — switches editing on. The page gets an orange frame and the toolbar appears.</li>' +
  '<li><strong>Done editing</strong> (or <code>Ctrl</code>+<code>E</code> again) switches it off and saves.</li>' +
  '<li><strong>Visual</strong> and <strong>HTML</strong>, beside Done editing, switch between the page and its code — see <a href="#/library-html-styles">Styles, fonts and HTML mode in the Library</a>.</li>' +
  '<li><strong>Locked</strong>: under Details, the document\'s author or a manager can lock it. Nobody can switch editing on until it is unlocked — use it for a <em>Final</em> document.</li></ul>' +
  '<h2>Saving</h2>' +
  '<p>There is no Save button. Every change is saved a moment after you stop typing; the footer says <strong>Saving…</strong> and then <strong>Saved</strong>, with who saved last and when. <code>Ctrl</code>+<code>S</code> saves at once. The Library is part of Taskana\'s data, so it is kept, shared and backed up the same way as the tasks.</p>' +
  '<div class="callout warn"><b>Important:</b> If two people edit the same document at the same moment, the later save wins. Agree who is editing.</div>' +
  '<h2>The side panel</h2>' +
  '<table><thead><tr><th>Tab</th><th>What it shows</th></tr></thead><tbody>' +
  '<tr><td>Outline</td><td>Every heading, indented by level. Click one to jump to it.</td></tr>' +
  '<tr><td>Styles</td><td>The document\'s fonts and styles.</td></tr>' +
  '<tr><td>Follow-ups</td><td>Everything marked as a follow-up, and every unticked checklist item, with a box to tick when it is resolved. <strong>Create tasks from open follow-ups</strong> turns them into Taskana tasks.</td></tr>' +
  '<tr><td>Terms</td><td>Every word marked as a term, with a field for what it means.</td></tr>' +
  '<tr><td>Links</td><td>The links in this document — to other documents, headings, tasks and the web — and <strong>Linked from</strong>: the documents that link here.</td></tr>' +
  '<tr><td>Details</td><td>The document\'s details — see below.</td></tr>' +
  '</tbody></table>' +
  '<h2>Details</h2>' +
  '<table><thead><tr><th>Field</th><th>What it is for</th></tr></thead><tbody>' +
  '<tr><td>Title · Kind</td><td>The document\'s name, and which template it started from.</td></tr>' +
  '<tr><td>Status</td><td><em>Draft</em>, <em>In review</em> or <em>Final</em>.</td></tr>' +
  '<tr><td>Client · Project · Task</td><td>What the research is for. The task has a link to open it; follow-ups become tasks on the project.</td></tr>' +
  '<tr><td>Subject-matter expert · role</td><td>Who you talked to, and what they do.</td></tr>' +
  '<tr><td>Date · Where</td><td>When and where — the client site, Teams…</td></tr>' +
  '<tr><td>Tags</td><td>Words to find the document by.</td></tr>' +
  '<tr><td>Private</td><td><em>Private — only I can see it</em> keeps it out of everyone else\'s list.</td></tr>' +
  '<tr><td>Locked</td><td>No editing until unlocked (the author or a manager).</td></tr>' +
  '</tbody></table>' +
  '<p>Under the fields are who created the document and when, and <strong>Delete document</strong> (the author or a manager) — the message that follows offers <strong>Undo</strong>.</p>' +
  '<h2>Exporting and printing</h2>' +
  '<p><strong>Export</strong>, in the reading bar (and under <strong>Writer tools</strong> while editing), offers:</p>' +
  '<ul><li><strong>Word document (.doc)</strong> — opens in Word with the document\'s look, ready to edit or to paste into a client template.</li>' +
  '<li><strong>Web page (.html)</strong> — a single file, with the document\'s styles and fonts.</li>' +
  '<li><strong>Markdown (.md)</strong>, or <strong>Copy as Markdown</strong> to paste it into another tool.</li>' +
  '<li><strong>Print or save as PDF</strong> (<code>Ctrl</code>+<code>P</code>) — page breaks you inserted start a new page.</li></ul>' +
  '<p>Every export starts with the title and a line with the client, project, expert and date.</p>' +
  '<div class="callout tip"><b>Tip:</b> Next, read <a href="#/library-formatting">Formatting, lists, tables, links and blocks in the Library</a>. The Handbook covers the Library in full — see <a href="../handbook/index.html#ch-tk-library">The Library</a>.</div>',
  he:
  '<p class="lede">הספרייה היא מחברת התחקיר של הצוות: מסמכים עשירים לאיסוף ולעיבוד של מה שמומחי תוכן מספרים לכם — בראיונות, בביקורי אתר ובהדגמות מוצר אצל הלקוח — ולהערות הפנימיות של הצוות. היא נמצאת ב-Taskana, ליד המשימות שהתחקיר נועד להן.</p>' +
  '<h2>פתיחה</h2>' +
  '<p>ב-Taskana, בחרו <strong>ספרייה</strong> בסרגל הצדדי. הספרייה אינה עוד לשונית ב-WorkDesk — עד אוקטובר 2026 היא הייתה, והפריטים שלה הועברו ל-Taskana כ<em>הערות תחקיר</em> בפעם הראשונה שהספרייה נפתחה.</p>' +
  '<table><thead><tr><th>תפקיד ב-Taskana</th><th>בספרייה</th></tr></thead><tbody>' +
  '<tr><td>מנהל מערכת, מנהל</td><td>קריאה וכתיבה; נעילה, שחרור ומחיקה של כל מסמך; ניהול הקטעים השמורים של כולם.</td></tr>' +
  '<tr><td>חבר צוות</td><td>קריאה וכתיבה; נעילה ומחיקה של המסמכים שלו.</td></tr>' +
  '<tr><td>צופה</td><td>קריאה בלבד.</td></tr>' +
  '<tr><td>חיצוני</td><td>אין ספרייה.</td></tr>' +
  '</tbody></table>' +
  '<h2>איתור מסמך</h2>' +
  '<ul><li>כשאין מסמך פתוח, רשימת המסמכים ממלאת את הצד. לכל מסמך מוצגים הכותרת, הסוג, הסטטוס, מספר הנקודות הפתוחות להמשך (תג <strong>?</strong>), הלקוח, הפרויקט והמומחה, ומי שינה אותו לאחרונה.</li>' +
  '<li><strong>חיפוש בספרייה</strong> מחפש בכותרות, במומחים, במקומות, בתגיות ובכל הטקסט של כל מסמך. שלוש הבחירות מצמצמות את הרשימה לפי סוג, סטטוס ולקוח.</li>' +
  '<li>כשמסמך פתוח, הרשימה מתקפלת כדי שלמסמך יהיה כל הרוחב. <strong>מסמכים</strong> למעלה מחזיר את הרשימה, ומסתיר אותה שוב.</li>' +
  '<li>מסמך פרטי מופיע רק ברשימה של מי שכתב אותו.</li></ul>' +
  '<h2>יצירת מסמך</h2>' +
  '<ol class="steps">' +
  '<li>לחצו <strong>מסמך חדש</strong> ובחרו למה הוא נועד. כל סוג מתחיל מתבנית.</li>' +
  '<li>המסמך נפתח כשהלשונית <strong>פרטים</strong> מוצגת. תנו לו כותרת, ואז קבעו את הלקוח, הפרויקט, המשימה, המומחה והתאריך.</li>' +
  '<li>לחצו <strong>עריכת המסמך</strong> והתחילו לכתוב — או הדביקו את ההערות הגולמיות ותנו ל<strong>סידור</strong> לבנות אותן (ראו <a href="#/library-sme-interview">ראיון מומחה תוכן בספרייה</a>).</li>' +
  '</ol>' +
  '<table><thead><tr><th>סוג</th><th>מה התבנית כוללת</th></tr></thead><tbody>' +
  '<tr><td>ראיון מומחה תוכן</td><td>פרטי הראיון (מומחה, תפקיד, תאריך ומקום, משתתפים, הקלטה), מטרות, שאלות ותשובות, נהלים שתוארו, מונחים, נקודות להמשך.</td></tr>' +
  '<tr><td>ביקור באתר</td><td>פרטי הביקור (אתר, תאריך, מארח, ציוד וגרסאות), מה נצפה, נהלים שנצפו, תמונות ומסכים, הערות בטיחות, נקודות להמשך.</td></tr>' +
  '<tr><td>הדגמה</td><td>מערכת וגרסה, הצעדים שהוצגו, טבלת מסכים והודעות, נקודות להמשך.</td></tr>' +
  '<tr><td>הערות תחקיר</td><td>מקורות, ממצאים, שאלות פתוחות.</td></tr>' +
  '<tr><td>סיכום פגישה</td><td>סדר יום, החלטות, משימות לביצוע.</td></tr>' +
  '<tr><td>מסמך ריק</td><td>דף ריק.</td></tr>' +
  '</tbody></table>' +
  '<h2>קריאה ועריכה</h2>' +
  '<p>מסמך תמיד נפתח לקריאה, כך שלחיצה או הקשה מקרית לא ישנו אותו. הקישורים עובדים, ושום דבר שתקלידו לא נכנס לטקסט.</p>' +
  '<ul><li><strong>עריכת המסמך</strong> — או <code>Ctrl</code>+<code>E</code>, או לחיצה כפולה בטקסט — מפעילה עריכה. הדף מקבל מסגרת כתומה וסרגל הכלים מופיע.</li>' +
  '<li><strong>סיום עריכה</strong> (או <code>Ctrl</code>+<code>E</code> שוב) מכבה את העריכה ושומר.</li>' +
  '<li><strong>חזותי</strong> ו-<strong>HTML</strong>, ליד סיום עריכה, עוברים בין הדף לקוד שלו — ראו <a href="#/library-html-styles">סגנונות, גופנים ומצב HTML בספרייה</a>.</li>' +
  '<li><strong>נעול</strong>: תחת פרטים, מי שכתב את המסמך או מנהל יכולים לנעול אותו. אף אחד לא יכול להפעיל עריכה עד שהוא משוחרר — השתמשו בזה למסמך <em>סופי</em>.</li></ul>' +
  '<h2>שמירה</h2>' +
  '<p>אין כפתור שמירה. כל שינוי נשמר רגע אחרי שמפסיקים להקליד; בתחתית מופיע <strong>שומר…</strong> ואז <strong>נשמר</strong>, עם מי שמר לאחרונה ומתי. <code>Ctrl</code>+<code>S</code> שומר מיד. הספרייה היא חלק מהנתונים של Taskana, ולכן היא נשמרת, משותפת ומגובה כמו המשימות.</p>' +
  '<div class="callout warn"><b>חשוב:</b> אם שני אנשים עורכים את אותו מסמך באותו רגע, השמירה המאוחרת גוברת. תאמו מי עורך.</div>' +
  '<h2>החלונית הצדדית</h2>' +
  '<table><thead><tr><th>לשונית</th><th>מה היא מציגה</th></tr></thead><tbody>' +
  '<tr><td>מבנה</td><td>כל הכותרות, מוזחות לפי רמה. לחיצה על כותרת קופצת אליה.</td></tr>' +
  '<tr><td>סגנונות</td><td>הגופנים והסגנונות של המסמך.</td></tr>' +
  '<tr><td>להמשך</td><td>כל מה שסומן להמשך טיפול, וכל פריט לא מסומן ברשימת בדיקה, עם תיבה לסמן כשהוא נפתר. <strong>יצירת משימות מנקודות פתוחות</strong> הופך אותם למשימות ב-Taskana.</td></tr>' +
  '<tr><td>מונחים</td><td>כל מילה שסומנה כמונח, עם שדה למשמעות שלה.</td></tr>' +
  '<tr><td>קישורים</td><td>הקישורים במסמך — למסמכים אחרים, לכותרות, למשימות ולאינטרנט — ו<strong>מקושר מ-</strong>: המסמכים שמקשרים לכאן.</td></tr>' +
  '<tr><td>פרטים</td><td>פרטי המסמך — ראו בהמשך.</td></tr>' +
  '</tbody></table>' +
  '<h2>פרטים</h2>' +
  '<table><thead><tr><th>שדה</th><th>למה הוא משמש</th></tr></thead><tbody>' +
  '<tr><td>כותרת · סוג</td><td>שם המסמך, ומאיזו תבנית הוא התחיל.</td></tr>' +
  '<tr><td>סטטוס</td><td><em>טיוטה</em>, <em>בסקירה</em> או <em>סופי</em>.</td></tr>' +
  '<tr><td>לקוח · פרויקט · משימה</td><td>למה התחקיר נועד. למשימה יש קישור שפותח אותה; נקודות להמשך הופכות למשימות בפרויקט.</td></tr>' +
  '<tr><td>מומחה/ית תוכן · תפקיד</td><td>עם מי דיברתם, ומה הוא או היא עושים.</td></tr>' +
  '<tr><td>תאריך · איפה</td><td>מתי ואיפה — אתר הלקוח, Teams…</td></tr>' +
  '<tr><td>תגיות</td><td>מילים שלפיהן אפשר למצוא את המסמך.</td></tr>' +
  '<tr><td>פרטי</td><td><em>פרטי — רק אני רואה אותו</em> מוציא אותו מהרשימה של כל השאר.</td></tr>' +
  '<tr><td>נעול</td><td>אין עריכה עד לשחרור (מי שכתב או מנהל).</td></tr>' +
  '</tbody></table>' +
  '<p>מתחת לשדות מופיעים מי יצר את המסמך ומתי, ו<strong>מחיקת המסמך</strong> (מי שכתב או מנהל) — ההודעה שמופיעה אחר כך מציעה <strong>ביטול</strong>.</p>' +
  '<h2>ייצוא והדפסה</h2>' +
  '<p><strong>ייצוא</strong>, בסרגל הקריאה (ותחת <strong>כלי כתיבה</strong> בזמן עריכה), מציע:</p>' +
  '<ul><li><strong>מסמך Word ‏(.doc)</strong> — נפתח ב-Word במראה של המסמך, מוכן לעריכה או להדבקה בתבנית של הלקוח.</li>' +
  '<li><strong>דף אינטרנט ‏(.html)</strong> — קובץ אחד, עם הסגנונות והגופנים של המסמך.</li>' +
  '<li><strong>Markdown ‏(.md)</strong>, או <strong>העתקה כ-Markdown</strong> להדבקה בכלי אחר.</li>' +
  '<li><strong>הדפסה או שמירה כ-PDF</strong> (<code>Ctrl</code>+<code>P</code>) — מעברי עמוד שהוספתם מתחילים עמוד חדש.</li></ul>' +
  '<p>כל ייצוא מתחיל בכותרת ובשורה עם הלקוח, הפרויקט, המומחה והתאריך.</p>' +
  '<div class="callout tip"><b>טיפ:</b> המשיכו ל<a href="#/library-formatting">עיצוב, רשימות, טבלאות, קישורים ובלוקים בספרייה</a>. המדריך מכסה את הספרייה במלואה — ראו <a href="../handbook/he.html#ch-tk-library">הספרייה</a>.</div>'
  } },

{ id: "library-sme-interview", cat: "training", updated: "18 Oct 2026",
  title: { en: "Running an SME interview in the Library", he: "ראיון מומחה תוכן בספרייה" },
  summary: { en: "From an empty template to a structured, reviewed document: notes, follow-ups, terms, contents and export.", he: "מתבנית ריקה למסמך מסודר וסקור: הערות, נקודות להמשך, מונחים, תוכן עניינים וייצוא." },
  body: {
  en:
  '<p class="lede">Most of what we write starts with a subject-matter expert (SME) explaining how something works. This guide walks through one interview in the Library — before, during and after — until it is a document the team can build on.</p>' +
  '<h2>Before the interview</h2>' +
  '<ol class="steps">' +
  '<li>In Taskana, open <strong>Library</strong> in the sidebar, click <strong>New document</strong> and choose <strong>SME interview</strong>. The template sets out the interview details, goals, questions and answers, procedures described, terminology and follow-ups.</li>' +
  '<li>On the <strong>Details</strong> tab, give it a title and link it to its work: the <strong>Client</strong>, the <strong>Project</strong> and the <strong>Task</strong> the research is for. Fill in the <strong>Subject-matter expert</strong> and their <strong>role</strong>, the <strong>Date</strong> and <strong>Where</strong> (the client site, Teams…), and a few <strong>Tags</strong>. The status starts as <em>Draft</em>.</li>' +
  '<li>Click <strong>Edit document</strong> (<code>Ctrl</code>+<code>E</code>). Fill in the interview details table — attendees, whether it is recorded — and write your goals and the questions you plan to ask.</li>' +
  '</ol>' +
  '<div class="callout note"><b>Note:</b> Set the project before the interview. Follow-ups become tasks on the document\'s project, so without one they cannot be turned into tasks.</div>' +
  '<h2>During the interview — take raw notes</h2>' +
  '<p>Don\'t format as you go. Type under <strong>Questions and answers</strong> as fast as you need, one thought per line, or paste notes you took elsewhere. A few habits make the clean-up afterwards automatic:</p>' +
  '<table><thead><tr><th>Type</th><th>Becomes, after Organize</th></tr></thead><tbody>' +
  '<tr><td><code>Q:</code> and <code>A:</code> at the start of a line</td><td>A question-and-answer block</td></tr>' +
  '<tr><td>A line in CAPITALS, or starting with <code>#</code></td><td>A heading</td></tr>' +
  '<tr><td>A short line ending with a colon, e.g. <code>Error codes:</code></td><td>A Heading 2</td></tr>' +
  '<tr><td><code>1.2</code> or <code>1.2.3</code> at the start</td><td>A numbered Heading 2 or 3</td></tr>' +
  '<tr><td><code>1.</code> or <code>a)</code> at the start</td><td>A numbered step</td></tr>' +
  '<tr><td><code>-</code>, <code>*</code> or <code>•</code> at the start</td><td>A bullet</td></tr>' +
  '<tr><td><code>[ ]</code> or <code>[x]</code> at the start</td><td>A checklist item</td></tr>' +
  '<tr><td><code>Note:</code>, <code>Tip:</code>, <code>Warning:</code> or <code>Caution:</code></td><td>A callout of that kind</td></tr>' +
  '<tr><td><code>todo</code>, <code>TBD</code>, <code>follow-up</code> or <code>??</code></td><td>A follow-up</td></tr>' +
  '<tr><td>Something that looks like code — JSON, XML, SQL, a shell command</td><td>A code block, tidied and labelled</td></tr>' +
  '</tbody></table>' +
  '<p>When the interview is recorded, <strong>Insert → Time stamp</strong> drops the current time in brackets, so you can find the moment in the recording later. Paste screenshots straight onto the page with <code>Ctrl</code>+<code>V</code>.</p>' +
  '<h2>After the interview — organize</h2>' +
  '<ol class="steps">' +
  '<li>Select the notes (or nothing, to organize every plain paragraph) and choose <strong>Writer tools → Organize pasted notes into a document</strong>. Headings, lists and tables you already made are left alone. One <strong>Undo</strong> puts the notes back exactly as they were.</li>' +
  '<li>Read it through. Fix headings with the <strong>Style</strong> menu, and tidy anything Organize could not guess.</li>' +
  '<li>Choose <strong>Writer tools → Tidy code blocks</strong> if the expert showed you commands, settings or messages.</li>' +
  '</ol>' +
  '<h2>Follow-ups become tasks</h2>' +
  '<ol class="steps">' +
  '<li>Select anything that still needs an answer and choose <strong>Writer tools → Mark selection as a follow-up</strong>. It is highlighted, and listed on the <strong>Follow-ups</strong> tab together with any unticked checklist items.</li>' +
  '<li>On the Follow-ups tab, tick the ones that are already resolved.</li>' +
  '<li>Click <strong>Create tasks from open follow-ups</strong>. Each open follow-up becomes a Taskana task on the document\'s project, assigned to you — reassign them in Taskana as needed.</li>' +
  '</ol>' +
  '<h2>Capture the client\'s terms</h2>' +
  '<ol class="steps">' +
  '<li>Select a word or phrase the client uses and choose <strong>Writer tools → Mark selection as a term</strong>.</li>' +
  '<li>On the <strong>Terms</strong> tab, write what each term means.</li>' +
  '<li>Choose <strong>Insert glossary from terms</strong> to add a Glossary table at the end of the document. Run it again after adding terms — it refreshes the table.</li>' +
  '</ol>' +
  '<h2>Give it structure</h2>' +
  '<ul><li><strong>Insert / update table of contents</strong> adds a contents box at the top that links to every heading. Run it again after changing headings. (Organize adds one by itself when it creates two or more headings.)</li>' +
  '<li><strong>Number the headings (1, 1.1, 1.2…)</strong> numbers every Heading 1–3; choose it again to stop.</li>' +
  '<li><strong>Clean up formatting (whole document)</strong> removes empty paragraphs and leftovers from pasted text.</li>' +
  '<li>Link the interview to related documents with <strong>Insert → Link to a document, heading or task…</strong>. The other document lists it under <strong>Linked from</strong>.</li></ul>' +
  '<h2>Review and finish</h2>' +
  '<ol class="steps">' +
  '<li>Under Details, set the status to <em>In review</em> and ask your Team Lead — or the SME — to read it.</li>' +
  '<li>Once it is agreed, set the status to <em>Final</em> and tick <strong>Locked</strong>, so nobody changes it by accident.</li>' +
  '<li>Choose <strong>Export → Word document (.doc)</strong> when the content goes into the client\'s manual, or <strong>Print or save as PDF</strong> to send the expert a copy for sign-off.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>Tip:</b> Search the Library for the expert\'s name before you go — earlier interviews with them show what is already known. The Handbook has a worked example — see <a href="../handbook/index.html#ch-tk-lib-tools">Library tools: structure, styles and HTML</a>.</div>',
  he:
  '<p class="lede">רוב מה שאנחנו כותבים מתחיל במומחה תוכן שמסביר איך משהו עובד. המדריך הזה עובר על ראיון אחד בספרייה — לפני, במהלך ואחרי — עד שהוא מסמך שהצוות יכול לבנות עליו.</p>' +
  '<h2>לפני הראיון</h2>' +
  '<ol class="steps">' +
  '<li>ב-Taskana, פתחו את <strong>ספרייה</strong> בסרגל הצדדי, לחצו <strong>מסמך חדש</strong> ובחרו <strong>ראיון מומחה תוכן</strong>. התבנית כוללת את פרטי הראיון, מטרות, שאלות ותשובות, נהלים שתוארו, מונחים ונקודות להמשך.</li>' +
  '<li>בלשונית <strong>פרטים</strong>, תנו כותרת וקשרו את המסמך לעבודה: <strong>לקוח</strong>, <strong>פרויקט</strong> ו<strong>משימה</strong> שהתחקיר נועד להם. מלאו את <strong>מומחה/ית תוכן</strong> ואת התפקיד, <strong>תאריך</strong> ו<strong>איפה</strong> (אתר הלקוח, Teams…), וכמה <strong>תגיות</strong>. הסטטוס מתחיל כ<em>טיוטה</em>.</li>' +
  '<li>לחצו <strong>עריכת המסמך</strong> (<code>Ctrl</code>+<code>E</code>). מלאו את טבלת פרטי הראיון — משתתפים, האם הוא מוקלט — וכתבו את המטרות ואת השאלות שאתם מתכננים לשאול.</li>' +
  '</ol>' +
  '<div class="callout note"><b>שימו לב:</b> קבעו את הפרויקט לפני הראיון. נקודות להמשך הופכות למשימות בפרויקט של המסמך, ובלי פרויקט אי אפשר להפוך אותן למשימות.</div>' +
  '<h2>במהלך הראיון — הערות גולמיות</h2>' +
  '<p>אל תעצבו תוך כדי. הקלידו תחת <strong>שאלות ותשובות</strong> כמה שיותר מהר, מחשבה אחת בכל שורה, או הדביקו הערות שרשמתם במקום אחר. כמה הרגלים הופכים את הסידור אחר כך לאוטומטי:</p>' +
  '<table><thead><tr><th>מקלידים</th><th>אחרי סידור, הופך ל</th></tr></thead><tbody>' +
  '<tr><td><code>Q:</code> ו-<code>A:</code> (או <code>ש:</code> ו-<code>ת:</code>) בתחילת שורה</td><td>בלוק שאלה ותשובה</td></tr>' +
  '<tr><td>שורה באותיות גדולות, או שמתחילה ב-<code>#</code></td><td>כותרת</td></tr>' +
  '<tr><td>שורה קצרה שמסתיימת בנקודתיים, למשל <code>קודי שגיאה:</code></td><td>כותרת 2</td></tr>' +
  '<tr><td><code>1.2</code> או <code>1.2.3</code> בהתחלה</td><td>כותרת 2 או 3 ממוספרת</td></tr>' +
  '<tr><td><code>1.</code> או <code>a)</code> בהתחלה</td><td>צעד ממוספר</td></tr>' +
  '<tr><td><code>-</code>, <code>*</code> או <code>•</code> בהתחלה</td><td>תבליט</td></tr>' +
  '<tr><td><code>[ ]</code> או <code>[x]</code> בהתחלה</td><td>פריט ברשימת בדיקה</td></tr>' +
  '<tr><td><code>Note:</code>, <code>Tip:</code>, <code>Warning:</code> או <code>Caution:</code></td><td>תיבת הדגשה מהסוג הזה</td></tr>' +
  '<tr><td><code>todo</code>, <code>TBD</code>, <code>follow-up</code> או <code>??</code></td><td>נקודה להמשך</td></tr>' +
  '<tr><td>משהו שנראה כמו קוד — JSON, ‏XML, ‏SQL, פקודת מעטפת</td><td>בלוק קוד, מסודר ומתויג</td></tr>' +
  '</tbody></table>' +
  '<p>כשהראיון מוקלט, <strong>הוספה ← חותמת זמן</strong> מוסיפה את השעה הנוכחית בסוגריים, כדי שתמצאו אחר כך את הרגע בהקלטה. צילומי מסך מדביקים ישירות לדף עם <code>Ctrl</code>+<code>V</code>.</p>' +
  '<h2>אחרי הראיון — סידור</h2>' +
  '<ol class="steps">' +
  '<li>בחרו את ההערות (או כלום, כדי לסדר כל פסקה רגילה) ובחרו <strong>כלי כתיבה ← סידור הערות שהודבקו למסמך</strong>. כותרות, רשימות וטבלאות שכבר יצרתם נשארות כמו שהן. <strong>ביטול</strong> אחד מחזיר את ההערות בדיוק כפי שהיו.</li>' +
  '<li>קראו את התוצאה. תקנו כותרות בתפריט <strong>סגנון</strong>, וסדרו כל מה שהסידור לא ניחש.</li>' +
  '<li>אם המומחה הראה לכם פקודות, הגדרות או הודעות, בחרו <strong>כלי כתיבה ← סידור בלוקי קוד</strong>.</li>' +
  '</ol>' +
  '<h2>נקודות להמשך הופכות למשימות</h2>' +
  '<ol class="steps">' +
  '<li>בחרו כל דבר שעדיין צריך תשובה ובחרו <strong>כלי כתיבה ← סימון הבחירה להמשך טיפול</strong>. הוא מודגש, ומופיע בלשונית <strong>להמשך</strong> יחד עם פריטים לא מסומנים ברשימות בדיקה.</li>' +
  '<li>בלשונית להמשך, סמנו את מה שכבר נפתר.</li>' +
  '<li>לחצו <strong>יצירת משימות מנקודות פתוחות</strong>. כל נקודה פתוחה הופכת למשימה ב-Taskana בפרויקט של המסמך, מוקצית לכם — הקצו אותן מחדש ב-Taskana לפי הצורך.</li>' +
  '</ol>' +
  '<h2>המונחים של הלקוח</h2>' +
  '<ol class="steps">' +
  '<li>בחרו מילה או ביטוי שהלקוח משתמש בהם ובחרו <strong>כלי כתיבה ← סימון הבחירה כמונח</strong>.</li>' +
  '<li>בלשונית <strong>מונחים</strong>, כתבו מה כל מונח אומר.</li>' +
  '<li>בחרו <strong>הוספת מילון מהמונחים</strong> כדי להוסיף טבלת מילון מונחים בסוף המסמך. הפעילו שוב אחרי שהוספתם מונחים — הטבלה מתעדכנת.</li>' +
  '</ol>' +
  '<h2>מבנה</h2>' +
  '<ul><li><strong>הוספה / עדכון של תוכן עניינים</strong> מוסיף בראש המסמך תיבת תוכן עם קישור לכל כותרת. הפעילו שוב אחרי שינוי כותרות. (הסידור מוסיף אחת בעצמו כשהוא יוצר שתי כותרות או יותר.)</li>' +
  '<li><strong>מספור הכותרות (1, 1.1, 1.2…)</strong> ממספר כל כותרת 1–3; בחירה נוספת מפסיקה את המספור.</li>' +
  '<li><strong>ניקוי עיצוב (כל המסמך)</strong> מסיר פסקאות ריקות ושאריות מטקסט שהודבק.</li>' +
  '<li>קשרו את הראיון למסמכים קשורים עם <strong>הוספה ← קישור למסמך, לכותרת או למשימה…</strong>. המסמך השני מציג אותו תחת <strong>מקושר מ-</strong>.</li></ul>' +
  '<h2>סקירה וסיום</h2>' +
  '<ol class="steps">' +
  '<li>תחת פרטים, שנו את הסטטוס ל<em>בסקירה</em> ובקשו מראש הצוות — או מהמומחה — לקרוא.</li>' +
  '<li>אחרי שהתוכן מוסכם, שנו את הסטטוס ל<em>סופי</em> וסמנו <strong>נעול</strong>, כדי שאף אחד לא ישנה אותו בטעות.</li>' +
  '<li>בחרו <strong>ייצוא ← מסמך Word ‏(.doc)</strong> כשהתוכן עובר למדריך של הלקוח, או <strong>הדפסה או שמירה כ-PDF</strong> כדי לשלוח למומחה עותק לאישור.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>טיפ:</b> לפני שיוצאים, חפשו בספרייה את שם המומחה — ראיונות קודמים איתו מראים מה כבר ידוע. במדריך יש דוגמה מלאה — ראו <a href="../handbook/he.html#ch-tk-lib-tools">כלי הספרייה: מבנה, סגנונות ו-HTML</a>.</div>'
  } },

{ id: "library-formatting", cat: "training", updated: "18 Oct 2026",
  title: { en: "Formatting, lists, tables, links and blocks in the Library", he: "עיצוב, רשימות, טבלאות, קישורים ובלוקים בספרייה" },
  summary: { en: "The Library editor, control by control: the toolbar, styles, lists, tables, images, links, content blocks, snippets and shortcuts.", he: "עורך הספרייה, פקד אחר פקד: סרגל הכלים, סגנונות, רשימות, טבלאות, תמונות, קישורים, בלוקי תוכן, קטעים שמורים וקיצורים." },
  body: {
  en:
  '<p class="lede">The Library editor works like a word processor: a toolbar of buttons and menus over the page, keyboard shortcuts, and undo for every change. Switch editing on first — <strong>Edit document</strong> or <code>Ctrl</code>+<code>E</code> — see <a href="#/library-start">Getting started with the Library</a>.</p>' +
  '<h2>The toolbar</h2>' +
  '<table><thead><tr><th>Control</th><th>What it does</th></tr></thead><tbody>' +
  '<tr><td>Undo · Redo</td><td>Steps back and forward through every change — typing (a word at a time), buttons and tools alike.</td></tr>' +
  '<tr><td>Style</td><td>Shows the style the caret is in and applies another: Normal text, Heading 1–4, Lead paragraph, Small print, Caption, Quote, Code block, and the document\'s own styles.</td></tr>' +
  '<tr><td>Font · Size</td><td>The typeface and size of the selected words. The list shows each font in its own face.</td></tr>' +
  '<tr><td>B · I · U · S</td><td>Bold, italic, underline, strikethrough.</td></tr>' +
  '<tr><td>More formatting</td><td>Superscript, subscript, inline code, keyboard key, text size, clear formatting.</td></tr>' +
  '<tr><td>Text colour · Highlight</td><td>A palette for each; <em>Automatic</em> and <em>No highlight</em> remove them.</td></tr>' +
  '<tr><td>Alignment</td><td>Start, centre, end, justify — for every paragraph in the selection.</td></tr>' +
  '<tr><td>Bullets · Numbering</td><td>List styles — see Lists below.</td></tr>' +
  '<tr><td>Decrease · Increase indent</td><td>Nests a list item, or indents a paragraph by a step.</td></tr>' +
  '<tr><td>Spacing and indents</td><td>Line spacing (1.0, 1.15, 1.5, 2.0), space after paragraphs (none, normal, large), first-line and hanging indents.</td></tr>' +
  '<tr><td>Insert</td><td>Links, images, tables, content blocks, snippets, special characters, a divider, a page break, a table of contents, today\'s date, a time stamp.</td></tr>' +
  '<tr><td>Table</td><td>Everything about the table the caret is in.</td></tr>' +
  '<tr><td>Link · Find</td><td>A web link; find and replace.</td></tr>' +
  '<tr><td>Writer tools</td><td>Structure, follow-ups, terms, code and clean-up — see <a href="#/library-sme-interview">Running an SME interview in the Library</a>.</td></tr>' +
  '</tbody></table>' +
  '<h2>Formatting text and paragraphs</h2>' +
  '<ul><li>Select the words first, then use the toolbar. Formatting wraps exactly the selected words — across several lines or paragraphs too — without adding line breaks or spaces. Click the button again to take it off.</li>' +
  '<li><strong>More formatting → Clear formatting</strong> removes bold, italics, colours, highlights, fonts and sizes from the selection.</li>' +
  '<li>Use <strong>styles</strong> to give a paragraph its role rather than making text bold and large by hand: headings feed the outline, the table of contents and heading numbers, and a style can be changed for the whole document at once — see <a href="#/library-html-styles">Styles, fonts and HTML mode in the Library</a>.</li>' +
  '<li><strong>Alignment</strong>, <strong>Spacing and indents</strong> and the indent buttons apply to every paragraph the selection touches.</li>' +
  '<li>Each paragraph runs in the direction of its own text, so English notes in a Hebrew document (and the reverse) read correctly.</li></ul>' +
  '<h2>Lists</h2>' +
  '<ul><li><strong>Bullets</strong>: dots, circles, squares, dashes, arrows, or a checklist — click a checklist box to tick it.</li>' +
  '<li><strong>Numbering</strong>: 1. 2. 3. · a. b. c. · A. B. C. · i. ii. iii. · I. II. III. — and two multilevel styles for the whole list: <em>Multilevel 1 · 1.1 · 1.1.1</em> and <em>Outline 1 · a · i</em>.</li>' +
  '<li><code>Tab</code> on a list item nests it one level deeper; <code>Shift</code>+<code>Tab</code> brings it back. <strong>Decrease</strong> and <strong>Increase indent</strong> do the same.</li>' +
  '<li><strong>Numbering → Start at…</strong> starts a numbered list from any number — useful when a procedure continues after a note.</li>' +
  '<li><strong>Remove the list</strong> turns the items back into paragraphs.</li></ul>' +
  '<h2>Tables</h2>' +
  '<ol class="steps">' +
  '<li>Choose <strong>Insert → Table</strong> and move over the grid to choose the size (up to 8 × 8), or <strong>Custom size…</strong> for up to 60 rows and 15 columns. The first row is a header row.</li>' +
  '<li>Type in a cell. <code>Tab</code> moves to the next cell (and adds a row at the end), <code>Shift</code>+<code>Tab</code> to the previous one.</li>' +
  '<li>To size a column, point at the right edge of one of its cells (the left edge in Hebrew) until the pointer becomes ↔, and drag. The table keeps the widths you set.</li>' +
  '<li>Use the <strong>Table</strong> menu for everything else.</li>' +
  '</ol>' +
  '<table><thead><tr><th>Table menu</th><th>What it does</th></tr></thead><tbody>' +
  '<tr><td>Insert row above / below, column before / after</td><td>Adds a row or column next to the caret.</td></tr>' +
  '<tr><td>Delete row / column / table</td><td>Removes it; deleting the last row or column removes the table.</td></tr>' +
  '<tr><td>Merge with the cell to the right / below</td><td>Joins two cells, keeping both contents.</td></tr>' +
  '<tr><td>Split merged cell</td><td>Splits a merged cell back into single cells.</td></tr>' +
  '<tr><td>Header row · First column as labels · Caption</td><td>Turns the first row into headings, the first column into bold labels, and adds a caption above the table.</td></tr>' +
  '<tr><td>Autofit</td><td><em>Fit to contents</em>, <em>Fit to page width</em>, <em>Fixed column widths</em> (the widths stop changing as you type), <em>Distribute columns evenly</em>.</td></tr>' +
  '<tr><td>Cell alignment · Cell shading</td><td>Top, middle or bottom; start, centre or end; a background colour — for the selected cells.</td></tr>' +
  '<tr><td>Table style</td><td>Grid, striped rows, plain lines, compact, dark header.</td></tr>' +
  '</tbody></table>' +
  '<h2>Images</h2>' +
  '<ul><li>Choose <strong>Insert → Image…</strong>, paste a screenshot (<code>Ctrl</code>+<code>V</code>), or drag an image file onto the page. Images up to 1 MB.</li>' +
  '<li>Click an image to select it. The bar above the page sets its width (25 %, 50 %, 75 %, 100 %, original), wraps the text to the left or right, centres it or puts it back in line, sets its alternative text, adds a caption under it, or deletes it.</li></ul>' +
  '<h2>Links</h2>' +
  '<ul><li><strong>Link</strong> (<code>Ctrl</code>+<code>K</code>) — type a web address and <strong>Apply</strong>. With the caret in a link, the same bar changes or removes it.</li>' +
  '<li><strong>Insert → Link to a document, heading or task…</strong> opens a picker with three tabs: <em>Documents</em> (its search finds headings inside them too), <em>This document</em> (its headings) and <em>Tasks</em> (Taskana tasks by key or title). Selected words become the link; otherwise the title is inserted.</li>' +
  '<li>While reading, a click follows the link: another document opens (at the heading, if the link points to one), a task opens over the page, and a web address opens in a new tab. While editing, <code>Ctrl</code>+click follows it.</li>' +
  '<li>The <strong>Links</strong> tab in the side panel lists every link in the document and every document that links to it.</li></ul>' +
  '<h2>Content blocks</h2>' +
  '<p><strong>Insert → Content block</strong> adds a ready-made block, already formatted:</p>' +
  '<ul><li><strong>Admonitions</strong> — Note, Tip, Important, Warning (damage to equipment or data), Caution (risk of injury).</li>' +
  '<li><strong>Structure</strong> — Procedure (a titled set of numbered steps with a result line), Before you begin (prerequisites as a checklist), Question and answer, Definition list, Field / value table.</li>' +
  '<li><strong>Layout</strong> — Figure with caption, Two or Three columns, a Collapsible section (click its title to fold it), Code block.</li></ul>' +
  '<h2>Snippets</h2>' +
  '<p>A snippet is a piece of a document saved under a name for the whole team to reuse — a standard safety note, a disclaimer, a table layout.</p>' +
  '<ol class="steps">' +
  '<li>Select what to keep and choose <strong>Insert → Snippet → Save the selection as a snippet…</strong>. Name it and press <code>Enter</code>.</li>' +
  '<li>To use it, put the caret where it belongs and choose it under <strong>Insert → Snippet</strong>.</li>' +
  '<li><strong>Manage snippets…</strong> renames, inserts and deletes them — your own, or any as a manager.</li>' +
  '</ol>' +
  '<h2>Also under Insert</h2>' +
  '<ul><li><strong>Special character</strong> — arrows, ±, ×, ≤, ≥, °, µ, Ω, ©, ™, €, ₪, ✓, ⚠ and more.</li>' +
  '<li><strong>Divider</strong> · <strong>Page break</strong> (a new page in print, PDF and Word) · <strong>Table of contents</strong> · <strong>Today\'s date</strong> · <strong>Time stamp</strong> (the current time in brackets).</li></ul>' +
  '<h2>Find and replace</h2>' +
  '<p><code>Ctrl</code>+<code>F</code> opens the bar above the page. It counts the matches as you type; <code>Enter</code> or ↓ goes to the next one, ↑ to the previous one; <strong>Aa</strong> matches capitals exactly. While editing, <strong>Replace</strong> changes the current match and <strong>Replace all</strong> every one — Undo brings them all back in one step.</p>' +
  '<h2>Typing shortcuts</h2>' +
  '<p>At the start of an empty paragraph, type one of these and a space:</p>' +
  '<table><thead><tr><th>Type</th><th>You get</th></tr></thead><tbody>' +
  '<tr><td><code>#</code> · <code>##</code> · <code>###</code> · <code>####</code></td><td>Heading 1 · 2 · 3 · 4</td></tr>' +
  '<tr><td><code>-</code> or <code>*</code></td><td>A bulleted list</td></tr>' +
  '<tr><td><code>1.</code> · <code>a.</code></td><td>A numbered list · a lettered list</td></tr>' +
  '<tr><td><code>[]</code></td><td>A checklist</td></tr>' +
  '<tr><td><code>&gt;</code></td><td>A quote</td></tr>' +
  '<tr><td><code>```</code></td><td>A code block (<code>Enter</code> twice at its end leaves it)</td></tr>' +
  '<tr><td><code>---</code></td><td>A divider</td></tr>' +
  '</tbody></table>' +
  '<h2>Keyboard shortcuts</h2>' +
  '<table><thead><tr><th>Keys</th><th>Action</th></tr></thead><tbody>' +
  '<tr><td><code>Ctrl</code>+<code>E</code></td><td>Start or stop editing</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Z</code> · <code>Ctrl</code>+<code>Y</code> (or <code>Ctrl</code>+<code>Shift</code>+<code>Z</code>)</td><td>Undo · Redo</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>B</code> · <code>I</code> · <code>U</code></td><td>Bold · Italic · Underline</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>`</code></td><td>Inline code</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Alt</code>+<code>1</code>…<code>4</code> · <code>Ctrl</code>+<code>Alt</code>+<code>0</code></td><td>Heading 1–4 · Normal text</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>7</code> · <code>8</code></td><td>Numbered list · Bulleted list</td></tr>' +
  '<tr><td><code>Tab</code> · <code>Shift</code>+<code>Tab</code></td><td>Nest or un-nest a list item; next or previous table cell; indent a paragraph; two spaces in a code block</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>K</code></td><td>Link</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>F</code></td><td>Find and replace</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>S</code> · <code>Ctrl</code>+<code>P</code></td><td>Save now · Print or save as PDF</td></tr>' +
  '<tr><td><code>Esc</code></td><td>Close a menu or the bar above the page</td></tr>' +
  '</tbody></table>' +
  '<div class="callout note"><b>Pasting:</b> text pasted from Word, Outlook or a web page keeps its headings, lists, tables, bold and links, and loses the rest — Word\'s hidden styling, and the source\'s fonts and colours. Plain text arrives as one paragraph per line. Inside a code block, everything is pasted as plain text.</div>' +
  '<p>The Handbook goes through every control — see <a href="../handbook/index.html#ch-tk-lib-write">Writing in the Library</a>.</p>',
  he:
  '<p class="lede">עורך הספרייה עובד כמו מעבד תמלילים: סרגל כפתורים ותפריטים מעל הדף, קיצורי מקלדת וביטול לכל שינוי. קודם מפעילים עריכה — <strong>עריכת המסמך</strong> או <code>Ctrl</code>+<code>E</code> — ראו <a href="#/library-start">צעדים ראשונים בספרייה</a>.</p>' +
  '<h2>סרגל הכלים</h2>' +
  '<table><thead><tr><th>פקד</th><th>מה הוא עושה</th></tr></thead><tbody>' +
  '<tr><td>ביטול · ביצוע חוזר</td><td>צעד אחורה וקדימה בכל שינוי — הקלדה (מילה בכל פעם), כפתורים וכלים.</td></tr>' +
  '<tr><td>סגנון</td><td>מראה באיזה סגנון הסמן נמצא ומחיל סגנון אחר: טקסט רגיל, כותרת 1–4, פסקת פתיחה, אותיות קטנות, כיתוב, ציטוט, בלוק קוד, והסגנונות של המסמך עצמו.</td></tr>' +
  '<tr><td>גופן · גודל</td><td>הגופן והגודל של המילים שנבחרו. הרשימה מציגה כל גופן בצורתו.</td></tr>' +
  '<tr><td>B · I · U · S</td><td>מודגש, נטוי, קו תחתון, קו חוצה.</td></tr>' +
  '<tr><td>עיצוב נוסף</td><td>כתב עילי, כתב תחתי, קוד בשורה, מקש מקלדת, גודל טקסט, ניקוי עיצוב.</td></tr>' +
  '<tr><td>צבע טקסט · הדגשה בצבע</td><td>לוח צבעים לכל אחד; <em>אוטומטי</em> ו<em>ללא הדגשה</em> מסירים אותם.</td></tr>' +
  '<tr><td>יישור</td><td>התחלה, מרכז, סוף, יישור לשני הצדדים — לכל פסקה בבחירה.</td></tr>' +
  '<tr><td>תבליטים · מספור</td><td>סגנונות רשימה — ראו רשימות בהמשך.</td></tr>' +
  '<tr><td>הקטנת הזחה · הגדלת הזחה</td><td>מקנן פריט ברשימה, או מזיח פסקה בצעד.</td></tr>' +
  '<tr><td>ריווח והזחות</td><td>ריווח שורות (1.0, 1.15, 1.5, 2.0), רווח אחרי פסקאות (ללא, רגיל, גדול), הזחת שורה ראשונה והזחה תלויה.</td></tr>' +
  '<tr><td>הוספה</td><td>קישורים, תמונות, טבלאות, בלוקי תוכן, קטעים שמורים, תווים מיוחדים, קו מפריד, מעבר עמוד, תוכן עניינים, התאריך של היום, חותמת זמן.</td></tr>' +
  '<tr><td>טבלה</td><td>כל מה שקשור לטבלה שהסמן נמצא בה.</td></tr>' +
  '<tr><td>קישור · חיפוש</td><td>קישור לאינטרנט; חיפוש והחלפה.</td></tr>' +
  '<tr><td>כלי כתיבה</td><td>מבנה, נקודות להמשך, מונחים, קוד וניקוי — ראו <a href="#/library-sme-interview">ראיון מומחה תוכן בספרייה</a>.</td></tr>' +
  '</tbody></table>' +
  '<h2>עיצוב טקסט ופסקאות</h2>' +
  '<ul><li>קודם בוחרים את המילים, ואז משתמשים בסרגל. העיצוב חל בדיוק על המילים שנבחרו — גם על פני כמה שורות או פסקאות — בלי להוסיף שורות או רווחים. לחיצה נוספת על הכפתור מסירה אותו.</li>' +
  '<li><strong>עיצוב נוסף ← ניקוי עיצוב</strong> מסיר מהבחירה הדגשה, נטוי, צבעים, הדגשות בצבע, גופנים וגדלים.</li>' +
  '<li>השתמשו ב<strong>סגנונות</strong> כדי לתת לפסקה את התפקיד שלה, במקום להדגיש ולהגדיל טקסט ידנית: הכותרות מזינות את המבנה, את תוכן העניינים ואת מספור הכותרות, ואפשר לשנות סגנון בכל המסמך בבת אחת — ראו <a href="#/library-html-styles">סגנונות, גופנים ומצב HTML בספרייה</a>.</li>' +
  '<li><strong>יישור</strong>, <strong>ריווח והזחות</strong> וכפתורי ההזחה חלים על כל פסקה שהבחירה נוגעת בה.</li>' +
  '<li>כל פסקה נכתבת בכיוון של הטקסט שלה, כך שהערות באנגלית במסמך בעברית (וההפך) נקראות נכון.</li></ul>' +
  '<h2>רשימות</h2>' +
  '<ul><li><strong>תבליטים</strong>: נקודות, עיגולים, ריבועים, מקפים, חצים, או רשימת בדיקה — לחיצה על תיבה מסמנת אותה.</li>' +
  '<li><strong>מספור</strong>: 1. 2. 3. · a. b. c. · A. B. C. · i. ii. iii. · I. II. III. — ושני סגנונות רב־רמתיים לכל הרשימה: <em>רב־רמתי 1 · 1.1 · 1.1.1</em> ו<em>מתאר 1 · a · i</em>.</li>' +
  '<li><code>Tab</code> בפריט ברשימה מקנן אותו רמה אחת פנימה; <code>Shift</code>+<code>Tab</code> מחזיר אותו. <strong>הקטנת הזחה</strong> ו<strong>הגדלת הזחה</strong> עושים אותו דבר.</li>' +
  '<li><strong>מספור ← התחלה מ-…</strong> מתחיל רשימה ממוספרת מכל מספר — שימושי כשנוהל ממשיך אחרי הערה.</li>' +
  '<li><strong>ביטול הרשימה</strong> מחזיר את הפריטים לפסקאות.</li></ul>' +
  '<h2>טבלאות</h2>' +
  '<ol class="steps">' +
  '<li>בחרו <strong>הוספה ← טבלה</strong> ועברו על הרשת כדי לבחור גודל (עד 8 × 8), או <strong>גודל מותאם…</strong> לעד 60 שורות ו-15 עמודות. השורה הראשונה היא שורת כותרת.</li>' +
  '<li>הקלידו בתא. <code>Tab</code> עובר לתא הבא (ומוסיף שורה בסוף), <code>Shift</code>+<code>Tab</code> לתא הקודם.</li>' +
  '<li>כדי לשנות רוחב עמודה, הצביעו על הקצה השמאלי של אחד התאים שלה (הימני באנגלית) עד שהסמן הופך ל-↔, וגררו. הטבלה שומרת את הרוחב שקבעתם.</li>' +
  '<li>כל השאר — בתפריט <strong>טבלה</strong>.</li>' +
  '</ol>' +
  '<table><thead><tr><th>תפריט טבלה</th><th>מה הוא עושה</th></tr></thead><tbody>' +
  '<tr><td>הוספת שורה מעל / מתחת, עמודה לפני / אחרי</td><td>מוסיף שורה או עמודה ליד הסמן.</td></tr>' +
  '<tr><td>מחיקת שורה / עמודה / הטבלה</td><td>מוחק; מחיקת השורה או העמודה האחרונה מוחקת את הטבלה.</td></tr>' +
  '<tr><td>מיזוג עם התא הבא בשורה / שמתחת</td><td>מאחד שני תאים ושומר את התוכן של שניהם.</td></tr>' +
  '<tr><td>פיצול תא ממוזג</td><td>מפצל תא ממוזג חזרה לתאים בודדים.</td></tr>' +
  '<tr><td>שורת כותרת · עמודה ראשונה ככותרות · כיתוב</td><td>הופך את השורה הראשונה לכותרות, את העמודה הראשונה לתוויות מודגשות, ומוסיף כיתוב מעל הטבלה.</td></tr>' +
  '<tr><td>התאמה אוטומטית</td><td><em>התאמה לתוכן</em>, <em>התאמה לרוחב הדף</em>, <em>רוחב עמודות קבוע</em> (הרוחב לא משתנה בזמן ההקלדה), <em>פיזור עמודות שווה</em>.</td></tr>' +
  '<tr><td>יישור תאים · הצללת תאים</td><td>למעלה, באמצע או למטה; התחלה, מרכז או סוף; צבע רקע — לתאים שנבחרו.</td></tr>' +
  '<tr><td>סגנון טבלה</td><td>רשת, שורות מפוספסות, קווים פשוטים, דחוס, כותרת כהה.</td></tr>' +
  '</tbody></table>' +
  '<h2>תמונות</h2>' +
  '<ul><li>בחרו <strong>הוספה ← תמונה…</strong>, הדביקו צילום מסך (<code>Ctrl</code>+<code>V</code>), או גררו קובץ תמונה לדף. תמונות עד 1 MB.</li>' +
  '<li>לחיצה על תמונה בוחרת אותה. הסרגל שמעל הדף קובע את הרוחב (25%, 50%, 75%, 100%, מקורי), גלישת טקסט משמאל או מימין, מרכוז או החזרה לתוך השורה, טקסט חלופי, כיתוב מתחת לתמונה, או מחיקה.</li></ul>' +
  '<h2>קישורים</h2>' +
  '<ul><li><strong>קישור</strong> (<code>Ctrl</code>+<code>K</code>) — הקלידו כתובת ולחצו <strong>החלה</strong>. כשהסמן בתוך קישור, אותו סרגל משנה או מסיר אותו.</li>' +
  '<li><strong>הוספה ← קישור למסמך, לכותרת או למשימה…</strong> פותח בורר עם שלוש לשוניות: <em>מסמכים</em> (החיפוש מוצא גם כותרות בתוכם), <em>המסמך הזה</em> (הכותרות שלו) ו<em>משימות</em> (משימות Taskana לפי מפתח או כותרת). מילים שנבחרו הופכות לקישור; אחרת נוספת הכותרת.</li>' +
  '<li>בזמן קריאה, לחיצה על קישור עוקבת אחריו: מסמך אחר נפתח (בכותרת, אם הקישור מצביע עליה), משימה נפתחת מעל הדף, וכתובת אינטרנט נפתחת בלשונית חדשה. בזמן עריכה, <code>Ctrl</code>+לחיצה עוקבת אחריו.</li>' +
  '<li>הלשונית <strong>קישורים</strong> בחלונית הצדדית מציגה כל קישור במסמך וכל מסמך שמקשר אליו.</li></ul>' +
  '<h2>בלוקי תוכן</h2>' +
  '<p><strong>הוספה ← בלוק תוכן</strong> מוסיף בלוק מוכן, כבר מעוצב:</p>' +
  '<ul><li><strong>תיבות הדגשה</strong> — הערה, טיפ, חשוב, אזהרה (נזק לציוד או לנתונים), זהירות (סכנת פציעה).</li>' +
  '<li><strong>מבנה</strong> — נוהל (צעדים ממוספרים עם כותרת ושורת תוצאה), לפני שמתחילים (דרישות מוקדמות כרשימת בדיקה), שאלה ותשובה, רשימת הגדרות, טבלת שדה / ערך.</li>' +
  '<li><strong>פריסה</strong> — איור עם כיתוב, שתי עמודות או שלוש עמודות, קטע מתקפל (לחיצה על הכותרת מקפלת אותו), בלוק קוד.</li></ul>' +
  '<h2>קטעים שמורים</h2>' +
  '<p>קטע שמור הוא חלק ממסמך שנשמר בשם, כדי שכל הצוות ישתמש בו שוב — הערת בטיחות קבועה, הסתייגות, מבנה של טבלה.</p>' +
  '<ol class="steps">' +
  '<li>בחרו את מה שרוצים לשמור ובחרו <strong>הוספה ← קטע שמור ← שמירת הבחירה כקטע שמור…</strong>. תנו לו שם והקישו <code>Enter</code>.</li>' +
  '<li>כדי להשתמש בו, העמידו את הסמן במקום הנכון ובחרו אותו תחת <strong>הוספה ← קטע שמור</strong>.</li>' +
  '<li><strong>ניהול קטעים שמורים…</strong> משנה שם, מוסיף ומוחק — את שלכם, או כל קטע אם אתם מנהלים.</li>' +
  '</ol>' +
  '<h2>עוד תחת הוספה</h2>' +
  '<ul><li><strong>תו מיוחד</strong> — חצים, ±, ×, ≤, ≥, °, µ, Ω, ©, ™, €, ₪, ✓, ⚠ ועוד.</li>' +
  '<li><strong>קו מפריד</strong> · <strong>מעבר עמוד</strong> (עמוד חדש בהדפסה, ב-PDF וב-Word) · <strong>תוכן עניינים</strong> · <strong>התאריך של היום</strong> · <strong>חותמת זמן</strong> (השעה הנוכחית בסוגריים).</li></ul>' +
  '<h2>חיפוש והחלפה</h2>' +
  '<p><code>Ctrl</code>+<code>F</code> פותח את הסרגל שמעל הדף. הוא סופר את ההתאמות תוך כדי הקלדה; <code>Enter</code> או ↓ עוברים להתאמה הבאה, ↑ לקודמת; <strong>Aa</strong> מתאים אותיות רישיות בדיוק. בזמן עריכה, <strong>החלפה</strong> מחליפה את ההתאמה הנוכחית ו<strong>החלפת הכול</strong> את כולן — ביטול מחזיר את כולן בצעד אחד.</p>' +
  '<h2>קיצורי הקלדה</h2>' +
  '<p>בתחילת פסקה ריקה, הקלידו אחד מאלה ורווח:</p>' +
  '<table><thead><tr><th>מקלידים</th><th>מקבלים</th></tr></thead><tbody>' +
  '<tr><td><code>#</code> · <code>##</code> · <code>###</code> · <code>####</code></td><td>כותרת 1 · 2 · 3 · 4</td></tr>' +
  '<tr><td><code>-</code> או <code>*</code></td><td>רשימת תבליטים</td></tr>' +
  '<tr><td><code>1.</code> · <code>a.</code></td><td>רשימה ממוספרת · רשימה באותיות</td></tr>' +
  '<tr><td><code>[]</code></td><td>רשימת בדיקה</td></tr>' +
  '<tr><td><code>&gt;</code></td><td>ציטוט</td></tr>' +
  '<tr><td><code>```</code></td><td>בלוק קוד (<code>Enter</code> פעמיים בסופו יוצא ממנו)</td></tr>' +
  '<tr><td><code>---</code></td><td>קו מפריד</td></tr>' +
  '</tbody></table>' +
  '<h2>קיצורי מקלדת</h2>' +
  '<table><thead><tr><th>מקשים</th><th>פעולה</th></tr></thead><tbody>' +
  '<tr><td><code>Ctrl</code>+<code>E</code></td><td>התחלה או סיום של עריכה</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Z</code> · <code>Ctrl</code>+<code>Y</code> (או <code>Ctrl</code>+<code>Shift</code>+<code>Z</code>)</td><td>ביטול · ביצוע חוזר</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>B</code> · <code>I</code> · <code>U</code></td><td>מודגש · נטוי · קו תחתון</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>`</code></td><td>קוד בשורה</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Alt</code>+<code>1</code>…<code>4</code> · <code>Ctrl</code>+<code>Alt</code>+<code>0</code></td><td>כותרת 1–4 · טקסט רגיל</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>7</code> · <code>8</code></td><td>רשימה ממוספרת · רשימת תבליטים</td></tr>' +
  '<tr><td><code>Tab</code> · <code>Shift</code>+<code>Tab</code></td><td>קינון או ביטול קינון של פריט ברשימה; התא הבא או הקודם בטבלה; הזחת פסקה; שני רווחים בבלוק קוד</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>K</code></td><td>קישור</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>F</code></td><td>חיפוש והחלפה</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>S</code> · <code>Ctrl</code>+<code>P</code></td><td>שמירה מיידית · הדפסה או שמירה כ-PDF</td></tr>' +
  '<tr><td><code>Esc</code></td><td>סגירת תפריט או הסרגל שמעל הדף</td></tr>' +
  '</tbody></table>' +
  '<div class="callout note"><b>הדבקה:</b> טקסט שמודבק מ-Word, מ-Outlook או מדף אינטרנט שומר על הכותרות, הרשימות, הטבלאות, ההדגשות והקישורים, ומאבד את השאר — העיצוב הנסתר של Word, והגופנים והצבעים של המקור. טקסט פשוט מגיע כפסקה לכל שורה. בתוך בלוק קוד, הכול מודבק כטקסט פשוט.</div>' +
  '<p>המדריך עובר על כל פקד — ראו <a href="../handbook/he.html#ch-tk-lib-write">כתיבה בספרייה</a>.</p>'
  } },

{ id: "library-html-styles", cat: "training", updated: "18 Oct 2026",
  title: { en: "Styles, fonts and HTML mode in the Library", he: "סגנונות, גופנים ומצב HTML בספרייה" },
  summary: { en: "Give a document its look once: styles, your own fonts, CSS, a linked stylesheet and the HTML behind the page.", he: "קובעים את המראה של מסמך פעם אחת: סגנונות, גופנים משלכם, CSS, גיליון סגנונות מקושר וה-HTML שמאחורי הדף." },
  body: {
  en:
  '<p class="lede">Every Library document carries its own look: its styles, its fonts and its CSS. Change a style once and every paragraph in that style follows — and when a client has a house style, you can bring it in. This is how.</p>' +
  '<h2>The Styles tab</h2>' +
  '<p>Open <strong>Styles</strong> in the side panel while editing. It holds the document\'s fonts and every style the document uses, ready to change.</p>' +
  '<ol class="steps">' +
  '<li>Pick a style under <strong>Style to edit</strong> — Normal text, Heading 1–4, Lead paragraph, Small print, Caption, Quote, Code block, Table heading, Table of contents, or one of the document\'s own.</li>' +
  '<li>Set any of: font, size, weight, italic, capitals, text colour, background, alignment, line height, space before and after, first-line indent, letter spacing, underline, a line under the paragraph.</li>' +
  '<li>Every paragraph in that style changes at once. <strong>Reset to default</strong> undoes your changes to the style.</li>' +
  '</ol>' +
  '<h2>Update a style to match the selection</h2>' +
  '<p>The word-processor way: format one paragraph by hand until it looks right, put the caret in it, and choose <strong>Update the style to match the selection</strong> in the toolbar\'s style menu — or <strong>Match the selection</strong> on the Styles tab. The style takes that look, and the manual formatting is folded into it, so every other paragraph in the style follows.</p>' +
  '<h2>New styles</h2>' +
  '<ol class="steps">' +
  '<li>Format some text the way you want it and leave it selected.</li>' +
  '<li>Choose <strong>New style from the selection…</strong> in the style menu (or <strong>＋ New style…</strong> on the Styles tab).</li>' +
  '<li>Name it, choose <strong>Paragraph style</strong> or <strong>Character style (for words)</strong>, and what it is based on.</li>' +
  '<li>Click <strong>Create style</strong>. It starts from how the selected text looks. Paragraph styles appear under <em>This document\'s styles</em> in the style menu, character styles under <em>Character styles</em>.</li>' +
  '</ol>' +
  '<h2>Copy styles from another document</h2>' +
  '<p><strong>Copy the styles and fonts of another document</strong>, at the bottom of the Styles tab, brings in that document\'s styles, fonts and CSS — the text is untouched. Keep one well-styled document per client as the model, and copy from it into every new one.</p>' +
  '<h2>Fonts</h2>' +
  '<ul><li><strong>Document font</strong>, under Styles → Fonts, sets the typeface of the whole document.</li>' +
  '<li>Add a <strong>Google font</strong> by name — suggestions include Heebo, Rubik, Assistant, Frank Ruhl Libre, Inter, Roboto and more — and press <strong>Add</strong>.</li>' +
  '<li>Or <strong>Upload a font file</strong> — <code>.woff2</code>, <code>.woff</code>, <code>.ttf</code> or <code>.otf</code>, up to 700 KB. A <code>.woff2</code> file is usually the smallest.</li>' +
  '<li>The fonts you add appear at the top of the toolbar\'s <strong>Font</strong> menu, followed by the fonts installed on most computers, and they travel with the document when you export it as a web page.</li></ul>' +
  '<h2>Custom classes</h2>' +
  '<p><strong>Custom class…</strong>, in the style menu, gives the paragraph at the caret one or more CSS classes. The classes the document\'s CSS defines are offered as one-click choices. A class changes nothing until CSS styles it — add the rules in HTML mode → CSS, or make a named style instead.</p>' +
  '<h2>HTML mode</h2>' +
  '<ol class="steps">' +
  '<li>While editing, choose <strong>HTML</strong> beside Done editing (or <strong>Writer tools → Edit the document\'s CSS…</strong>). The code is on the left and the page on the right, updated as you type.</li>' +
  '<li>On the <strong>HTML</strong> tab, change the HTML, or paste a whole page\'s HTML. <strong>Paste HTML</strong> replaces the document with the HTML on the clipboard; <strong>Format HTML</strong> lays the code out neatly.</li>' +
  '<li>On the <strong>CSS</strong> tab, write CSS for this document, and give the address of a <strong>Linked stylesheet</strong> — a <code>.css</code> file at an <code>https://</code> address, for example the client\'s documentation stylesheet. Plain <code>http://</code> addresses are not accepted.</li>' +
  '<li>Choose <strong>Visual</strong> to go back to the page.</li>' +
  '</ol>' +
  '<p>The order is: the linked file first, then the document\'s styles, then its own CSS — so the document\'s CSS has the last word.</p>' +
  '<h2>What is kept, and what is stripped</h2>' +
  '<table><thead><tr><th>Kept</th><th>Always removed</th></tr></thead><tbody>' +
  '<tr><td>Headings, paragraphs, lists, tables, images, links, sections, figures, collapsible sections, classes, ids and inline styles</td><td>Scripts, event handlers, forms, frames and embedded media</td></tr>' +
  '</tbody></table>' +
  '<div class="callout note"><b>Note:</b> A document\'s CSS and fonts apply only inside that document — never to Taskana or to other documents.</div>' +
  '<div class="callout tip"><b>Tip:</b> Prefer styles over CSS when you can: a teammate who has never seen your CSS can still change a style on the Styles tab. The Handbook covers this in full — see <a href="../handbook/index.html#ch-tk-lib-tools">Library tools: structure, styles and HTML</a>.</div>',
  he:
  '<p class="lede">לכל מסמך בספרייה יש מראה משלו: הסגנונות, הגופנים וה-CSS שלו. משנים סגנון פעם אחת וכל פסקה בסגנון הזה משתנה איתו — וכשללקוח יש סגנון בית, אפשר להביא אותו. כך עושים את זה.</p>' +
  '<h2>הלשונית סגנונות</h2>' +
  '<p>פתחו את <strong>סגנונות</strong> בחלונית הצדדית בזמן עריכה. יש בה את הגופנים של המסמך ואת כל סגנון שהמסמך משתמש בו, מוכנים לשינוי.</p>' +
  '<ol class="steps">' +
  '<li>בחרו סגנון ב<strong>סגנון לעריכה</strong> — טקסט רגיל, כותרת 1–4, פסקת פתיחה, אותיות קטנות, כיתוב, ציטוט, בלוק קוד, כותרת טבלה, תוכן עניינים, או אחד מהסגנונות של המסמך.</li>' +
  '<li>קבעו כל אחד מאלה: גופן, גודל, משקל, נטוי, אותיות רישיות, צבע טקסט, רקע, יישור, גובה שורה, רווח לפני ואחרי, הזחת שורה ראשונה, ריווח אותיות, קו תחתון, קו מתחת לפסקה.</li>' +
  '<li>כל פסקה בסגנון הזה משתנה בבת אחת. <strong>איפוס לברירת המחדל</strong> מבטל את השינויים שעשיתם בסגנון.</li>' +
  '</ol>' +
  '<h2>עדכון סגנון לפי הבחירה</h2>' +
  '<p>הדרך של מעבד התמלילים: עצבו פסקה אחת ידנית עד שהיא נראית נכון, העמידו בה את הסמן, ובחרו <strong>עדכון הסגנון לפי הבחירה</strong> בתפריט הסגנון שבסרגל — או <strong>התאמה לבחירה</strong> בלשונית סגנונות. הסגנון מקבל את המראה הזה, והעיצוב הידני נבלע בו, כך שכל שאר הפסקאות בסגנון משתנות בהתאם.</p>' +
  '<h2>סגנונות חדשים</h2>' +
  '<ol class="steps">' +
  '<li>עצבו טקסט כמו שאתם רוצים והשאירו אותו בחור.</li>' +
  '<li>בחרו <strong>סגנון חדש מהבחירה…</strong> בתפריט הסגנון (או <strong>＋ סגנון חדש…</strong> בלשונית סגנונות).</li>' +
  '<li>תנו לו שם, בחרו <strong>סגנון פסקה</strong> או <strong>סגנון תווים (למילים)</strong>, ועל מה הוא מבוסס.</li>' +
  '<li>לחצו <strong>יצירת סגנון</strong>. הוא מתחיל מהמראה של הטקסט שנבחר. סגנונות פסקה מופיעים בתפריט הסגנון תחת <em>הסגנונות של המסמך</em>, וסגנונות תווים תחת <em>סגנונות תווים</em>.</li>' +
  '</ol>' +
  '<h2>העתקת סגנונות ממסמך אחר</h2>' +
  '<p><strong>העתקת הסגנונות והגופנים של מסמך אחר</strong>, בתחתית הלשונית סגנונות, מביאה את הסגנונות, הגופנים וה-CSS של המסמך ההוא — הטקסט נשאר כמו שהוא. החזיקו מסמך אחד מעוצב היטב לכל לקוח כדוגמה, והעתיקו ממנו לכל מסמך חדש.</p>' +
  '<h2>גופנים</h2>' +
  '<ul><li><strong>גופן המסמך</strong>, תחת סגנונות ← גופנים, קובע את הגופן של כל המסמך.</li>' +
  '<li>הוסיפו <strong>גופן של Google</strong> לפי שם — בין ההצעות Heebo, ‏Rubik, ‏Assistant, ‏Frank Ruhl Libre, ‏Inter, ‏Roboto ועוד — ולחצו <strong>הוספה</strong>.</li>' +
  '<li>או <strong>העלאת קובץ גופן</strong> — <code>.woff2</code>, <code>.woff</code>, <code>.ttf</code> או <code>.otf</code>, עד 700KB. קובץ <code>.woff2</code> הוא בדרך כלל הקטן ביותר.</li>' +
  '<li>הגופנים שהוספתם מופיעים בראש התפריט <strong>גופן</strong> בסרגל, ואחריהם הגופנים שמותקנים ברוב המחשבים, והם עוברים עם המסמך כשמייצאים אותו כדף אינטרנט.</li></ul>' +
  '<h2>מחלקות מותאמות</h2>' +
  '<p><strong>מחלקה מותאמת…</strong>, בתפריט הסגנון, נותנת לפסקה שבה הסמן מחלקת CSS אחת או יותר. המחלקות שה-CSS של המסמך מגדיר מוצעות כבחירה בלחיצה אחת. מחלקה לא משנה דבר עד שיש לה עיצוב ב-CSS — הוסיפו כללים במצב HTML ← CSS, או צרו במקום זה סגנון בעל שם.</p>' +
  '<h2>מצב HTML</h2>' +
  '<ol class="steps">' +
  '<li>בזמן עריכה, בחרו <strong>HTML</strong> ליד סיום עריכה (או <strong>כלי כתיבה ← עריכת ה-CSS של המסמך…</strong>). הקוד בצד אחד והדף בצד השני, ומתעדכן תוך כדי הקלדה.</li>' +
  '<li>בלשונית <strong>HTML</strong>, שנו את ה-HTML, או הדביקו HTML של דף שלם. <strong>הדבקת HTML</strong> מחליפה את המסמך ב-HTML שבלוח; <strong>סידור HTML</strong> מסדר את הקוד בצורה נקייה.</li>' +
  '<li>בלשונית <strong>CSS</strong>, כתבו CSS למסמך הזה, ותנו כתובת של <strong>גיליון סגנונות מקושר</strong> — קובץ <code>.css</code> בכתובת <code>https://</code>, למשל גיליון הסגנונות של התיעוד של הלקוח. כתובות <code>http://</code> רגילות אינן מתקבלות.</li>' +
  '<li>בחרו <strong>חזותי</strong> כדי לחזור לדף.</li>' +
  '</ol>' +
  '<p>הסדר הוא: קודם הקובץ המקושר, אחריו הסגנונות של המסמך, ואחריהם ה-CSS שלו — כך של-CSS של המסמך יש המילה האחרונה.</p>' +
  '<h2>מה נשמר ומה מוסר</h2>' +
  '<table><thead><tr><th>נשמר</th><th>מוסר תמיד</th></tr></thead><tbody>' +
  '<tr><td>כותרות, פסקאות, רשימות, טבלאות, תמונות, קישורים, מקטעים, איורים, קטעים מתקפלים, מחלקות, מזהים (ids) וסגנונות מוטבעים</td><td>סקריפטים, מטפלי אירועים, טפסים, מסגרות ומדיה מוטמעת</td></tr>' +
  '</tbody></table>' +
  '<div class="callout note"><b>שימו לב:</b> ה-CSS והגופנים של מסמך חלים רק בתוך המסמך הזה — לעולם לא על Taskana או על מסמכים אחרים.</div>' +
  '<div class="callout tip"><b>טיפ:</b> כשאפשר, העדיפו סגנונות על פני CSS: עמית שמעולם לא ראה את ה-CSS שלכם עדיין יכול לשנות סגנון בלשונית סגנונות. המדריך מכסה את זה במלואו — ראו <a href="../handbook/he.html#ch-tk-lib-tools">כלי הספרייה: מבנה, סגנונות ו-HTML</a>.</div>'
  } },

/* ======================= Word for technical writers (course) ======================= */
{ id: "word-course", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Word for technical writers — crash course (start here)' },
  summary: { en: 'A fast, hands-on course in Word for Microsoft 365: styles, paragraphs, lists, headings, the table of contents, tables, page layout and the documents we write for the defense industry.' },
  body: {
  en:
  '<p class="lede">You already know technology and you already write good English. This course gives you the other half of the job: using Word the way a professional technical writer does — so that a 300-page manual stays consistent, numbers itself, builds its own table of contents and survives three rounds of customer review.</p>' +
  '<h2>Who it is for</h2>' +
  '<p>New technical writers at GALIL. No previous Word training is assumed beyond typing and saving a file. Every lesson is short, and every lesson ends with a <strong>Try it</strong> exercise you do in Word — that is where the learning happens.</p>' +
  '<h2>What you need</h2>' +
  '<ul>' +
  '<li><strong>Word for Microsoft 365, the desktop app</strong> (Windows), kept on the Current Channel. The course does not cover Word on the web — it lacks many of the features we rely on (multilevel lists linked to headings, captions and cross-references, styles management, document inspection).</li>' +
  '<li>An empty folder for your practice files. Use your work computer only — see <a href="#/infosec">Information security</a>.</li>' +
  '<li>About <strong>3 hours</strong>, which you can split across several days.</li>' +
  '</ul>' +
  '<div class="callout note"><b>Which version?</b> To check, open Word and choose <strong>File → Account → About Word</strong>. You should see <em>Microsoft® Word for Microsoft 365</em>. Ribbon names in this course match that version; if a button looks slightly different on your screen, the tab and group names are still the same.</div>' +
  '<h2>The lessons</h2>' +
  '<table><thead><tr><th>#</th><th>Lesson</th><th>Time</th></tr></thead><tbody>' +
  '<tr><td>1</td><td><a href="#/word-1-mindset">Think like a technical writer</a></td><td>15 min</td></tr>' +
  '<tr><td>2</td><td><a href="#/word-2-setup">Set up Word for technical writing</a></td><td>10 min</td></tr>' +
  '<tr><td>3</td><td><a href="#/word-3-styles">Styles — the one habit that matters</a></td><td>25 min</td></tr>' +
  '<tr><td>4</td><td><a href="#/word-4-paragraphs">Paragraphs, spacing and page flow</a></td><td>15 min</td></tr>' +
  '<tr><td>5</td><td><a href="#/word-5-lists">Bulleted and numbered lists</a></td><td>20 min</td></tr>' +
  '<tr><td>6</td><td><a href="#/word-6-headings-toc">Headings, numbering and the table of contents</a></td><td>20 min</td></tr>' +
  '<tr><td>7</td><td><a href="#/word-7-tables-figures">Tables, figures, captions and safety notices</a></td><td>20 min</td></tr>' +
  '<tr><td>8</td><td><a href="#/word-8-layout">Page layout: sections, headers, footers and markings</a></td><td>15 min</td></tr>' +
  '<tr><td>9</td><td><a href="#/word-9-documents">What our documents look like</a></td><td>15 min</td></tr>' +
  '<tr><td>10</td><td><a href="#/word-10-review">Review, track changes and delivery</a></td><td>15 min</td></tr>' +
  '<tr><td>11</td><td><a href="#/word-11-advanced">A step further: templates, Quick Parts and power tools</a></td><td>15 min</td></tr>' +
  '<tr><td>12</td><td><a href="#/word-12-final">Final exercise, checklist and shortcut sheet</a></td><td>30 min</td></tr>' +
  '</tbody></table>' +
  '<h2>How to take the course</h2>' +
  '<ol class="steps">' +
  '<li>Read a lesson, then do its <strong>Try it</strong> in Word straight away.</li>' +
  '<li>Keep one practice file per lesson (<code>Lesson03-Styles.docx</code> and so on). You will reuse some of them later.</li>' +
  '<li>Finish with the final exercise in lesson 12 and show the result to your Team Lead.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>Tip:</b> Need practice text fast? In an empty paragraph, type <code>=rand(5,4)</code> and press <code>Enter</code>. Word writes five paragraphs of four sentences each. <code>=lorem(3,5)</code> does the same in Latin.</div>'
  } },

{ id: "word-1-mindset", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 1 — Think like a technical writer' },
  summary: { en: 'Who reads our documents, what they need, and the writing rules that follow — with what is special about the defense industry in Israel.' },
  body: {
  en:
  '<p class="lede">Before the buttons, the mindset. A technical document is a tool. The reader is in the middle of a job — operating a system, maintaining it, testing it, approving it — and opens the document to get one answer. Your job is to make that answer quick to find and impossible to misread.</p>' +
  '<h2>Five questions before you write anything</h2>' +
  '<ol>' +
  '<li><strong>Who is the reader?</strong> An operator, a maintenance technician, a software engineer, a test engineer, a customer quality inspector? Their training and their language decide your words.</li>' +
  '<li><strong>What will they do with it?</strong> Learn, perform a task, look something up, approve it?</li>' +
  '<li><strong>Where will they read it?</strong> At a desk, in a hangar, in a vehicle, on a laptop next to the equipment, on paper.</li>' +
  '<li><strong>What document type is it?</strong> Each type has a fixed structure — see <a href="#/word-9-documents">lesson 9</a>.</li>' +
  '<li><strong>Which rules apply?</strong> The contract, the customer\'s template and style guide, and any standard the contract names. These beat personal taste every time.</li>' +
  '</ol>' +
  '<h2>The writing rules</h2>' +
  '<table><thead><tr><th>Rule</th><th>Instead of…</th><th>Write…</th></tr></thead><tbody>' +
  '<tr><td>One idea per sentence; short sentences (20 words or fewer for instructions).</td><td>After the system has been powered on and the self-test has completed, which takes about two minutes, the operator should verify the status.</td><td>Switch on the system. Wait for the self-test to finish (about 2 minutes). Make sure that the STATUS indicator is green.</td></tr>' +
  '<tr><td>Instructions in the imperative.</td><td>The cover should be removed.</td><td>Remove the cover.</td></tr>' +
  '<tr><td>Active voice.</td><td>The data is sent by the unit.</td><td>The unit sends the data.</td></tr>' +
  '<tr><td>One term for one thing — always.</td><td>display, screen, monitor, panel (for the same part)</td><td>display (every time)</td></tr>' +
  '<tr><td>Exact values with units.</td><td>Tighten firmly.</td><td>Tighten to 12 N·m.</td></tr>' +
  '<tr><td>Name controls exactly as they are labelled.</td><td>Press the power button.</td><td>Push <strong>PWR</strong>.</td></tr>' +
  '<tr><td>Condition before action.</td><td>Push RESET if the LED is red.</td><td>If the LED is red, push RESET.</td></tr>' +
  '</tbody></table>' +
  '<p>Many defense customers ask for <strong>ASD-STE100 Simplified Technical English</strong> (STE): a controlled dictionary of approved words, each with one meaning, plus writing rules like the ones above. If your project uses STE, your Team Lead will give you the dictionary and the project word list.</p>' +
  '<h2>What is special about the defense industry</h2>' +
  '<ul>' +
  '<li><strong>The customer\'s standard rules.</strong> Contracts name the documents to deliver and the standard each follows — for example MIL-STD-498 for software documents, MIL-STD-40051 or S1000D for technical manuals, or the customer\'s own template (common with Israeli primes and the Ministry of Defense). Follow the template exactly, including its styles.</li>' +
  '<li><strong>Safety notices are formal.</strong> <em>WARNING</em> (risk of injury or death), <em>CAUTION</em> (risk of damage to equipment) and <em>NOTE</em> (useful information) have fixed meanings and fixed positions — before the step they apply to. See <a href="#/word-7-tables-figures">lesson 7</a>.</li>' +
  '<li><strong>Configuration control.</strong> Every document has a document number, a revision, a date and a record of changes. A reader must always know which version they hold and that it matches the system\'s version.</li>' +
  '<li><strong>Security classification.</strong> Documents carry a classification marking (for example בלמ"ס — unclassified) at the top and bottom of every page. The project\'s security officer sets the level and the marking rules. Classified material is written only on the approved computers and networks for it — never on a home computer, a personal phone, an online tool or an AI assistant. See <a href="#/infosec">Information security</a> and <a href="#/confidentiality">Confidentiality</a>.</li>' +
  '<li><strong>Export control.</strong> Some technical data may not be shared outside the project, even inside GALIL. When in doubt, ask before you send.</li>' +
  '<li><strong>Hebrew and English.</strong> Most of our deliverables are in English, some in Hebrew, and some in both. Word handles both; a Hebrew paragraph just needs right-to-left direction (lesson 4).</li>' +
  '</ul>' +
  '<div class="callout warn"><b>Important:</b> Do not paste customer or project text into Copilot, ChatGPT, online translators or any other AI or cloud tool unless your Team Lead has confirmed in writing that the project allows it.</div>' +
  '<h2>Try it</h2>' +
  '<p>Rewrite this paragraph as a numbered procedure using the rules above:</p>' +
  '<p><em>“The unit can be reset by the operator, which should only be done when the FAULT indicator has been lit for more than ten seconds, by holding down the reset button for about 3 seconds after first making sure that no transmission is in progress.”</em></p>' +
  '<p>Compare with the answer at the end of <a href="#/word-12-final">lesson 12</a>.</p>'
  } },

{ id: "word-2-setup", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 2 — Set up Word for technical writing' },
  summary: { en: 'Ten minutes of settings that let you see what is really in a document: formatting marks, the Navigation pane, the Styles pane and the style area.' },
  body: {
  en:
  '<p class="lede">A technical writer needs to see the structure of a document, not only how it looks. These settings stay on — you change them once.</p>' +
  '<h2>The ribbon in one minute</h2>' +
  '<table><thead><tr><th>Tab</th><th>What you will use it for</th></tr></thead><tbody>' +
  '<tr><td>Home</td><td>Styles, lists, paragraph settings, Find and Replace, Show/Hide ¶.</td></tr>' +
  '<tr><td>Insert</td><td>Tables, pictures, page breaks, headers and footers, page numbers, Quick Parts, cross-references.</td></tr>' +
  '<tr><td>Layout</td><td>Margins, orientation, section breaks, paragraph spacing.</td></tr>' +
  '<tr><td>References</td><td>Table of contents, captions, list of figures, cross-references.</td></tr>' +
  '<tr><td>Review</td><td>Spelling, comments, Track Changes, Compare, Restrict Editing, accessibility.</td></tr>' +
  '<tr><td>View</td><td>Navigation pane, Outline and Draft views, ruler, side-by-side.</td></tr>' +
  '<tr><td>Contextual tabs</td><td><strong>Table Design</strong> and <strong>Layout</strong> appear when the cursor is in a table; <strong>Picture Format</strong> when a picture is selected; <strong>Header &amp; Footer</strong> while you edit a header.</td></tr>' +
  '</tbody></table>' +
  '<h2>Turn these on</h2>' +
  '<ol class="steps">' +
  '<li><strong>Formatting marks.</strong> <strong>Home → Paragraph → Show/Hide ¶</strong> (<code>Ctrl</code>+<code>Shift</code>+<code>8</code>). Now you see every paragraph mark (¶), tab (→), space (·), line break (↵) and section break. Professional writers work with this on.</li>' +
  '<li><strong>The Navigation pane.</strong> <strong>View → Show → Navigation Pane</strong> (or <code>Ctrl</code>+<code>F</code>). The <em>Headings</em> tab shows the document\'s outline — click to jump, drag to move a whole chapter.</li>' +
  '<li><strong>The Styles pane.</strong> Click the small arrow at the bottom-right of the <strong>Home → Styles</strong> group (or <code>Ctrl</code>+<code>Alt</code>+<code>Shift</code>+<code>S</code>). Dock it on the right. At the bottom, tick <strong>Show Preview</strong>; under <strong>Options…</strong>, choose <em>Select styles to show: In use</em>.</li>' +
  '<li><strong>The ruler.</strong> <strong>View → Show → Ruler</strong>. You need it for indents and tab stops.</li>' +
  '<li><strong>The style area.</strong> <strong>File → Options → Advanced → Display → Style area pane width in Draft and Outline views</strong>: set <code>2.5 cm</code>. Now <strong>View → Draft</strong> shows the name of every paragraph\'s style in the left margin — the fastest way to check a document.</li>' +
  '</ol>' +
  '<h2>Stop Word from guessing</h2>' +
  '<p>Word\'s automatic formatting creates lists and borders you didn\'t ask for, outside the styles. Go to <strong>File → Options → Proofing → AutoCorrect Options… → AutoFormat As You Type</strong> and clear:</p>' +
  '<ul>' +
  '<li><em>Automatic bulleted lists</em> and <em>Automatic numbered lists</em> — you will use list styles instead.</li>' +
  '<li><em>Border lines</em> — typing <code>---</code> then <code>Enter</code> otherwise draws a line you cannot select.</li>' +
  '<li><em>Define styles based on your formatting</em> — it creates random new styles.</li>' +
  '</ul>' +
  '<p>Also: <strong>File → Options → Advanced → Cut, copy, and paste → Pasting from other programs: Keep Text Only</strong>. Text pasted from e-mails and web pages then takes your document\'s styles.</p>' +
  '<h2>Proofing language</h2>' +
  '<p>Select all (<code>Ctrl</code>+<code>A</code>), then <strong>Review → Language → Set Proofing Language…</strong> and choose the variant the customer wants — usually <em>English (United States)</em>. Better still: set it in the styles, so every new paragraph has it (lesson 3).</p>' +
  '<h2>Your Quick Access Toolbar</h2>' +
  '<p>Right-click any button and choose <strong>Add to Quick Access Toolbar</strong>. Good candidates: <em>Show/Hide ¶</em>, <em>Update Table</em>, <em>Insert Caption</em>, <em>Cross-reference</em>, <em>Track Changes</em>. If the toolbar is hidden, <strong>right-click the ribbon → Show Quick Access Toolbar</strong>.</p>' +
  '<h2>Try it</h2>' +
  '<p>Make all the settings above. Create a new blank document, type <code>=rand(3,3)</code> and press <code>Enter</code>, switch to <strong>View → Draft</strong> and check that you see <em>Normal</em> beside each paragraph in the style area.</p>'
  } },

{ id: "word-3-styles", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 3 — Styles: the one habit that matters' },
  summary: { en: 'What styles are, why every paragraph must have one, how to apply and change them, and which style to use for what.' },
  body: {
  en:
  '<p class="lede">If you take one thing from this course, take this: <strong>never format text by hand — apply a style.</strong> A style is a named set of formatting (font, size, spacing, indents, numbering, and more). Headings, the table of contents, numbering, cross-references, PDF bookmarks and the customer\'s template all depend on it.</p>' +
  '<h2>Why it matters</h2>' +
  '<ul>' +
  '<li><strong>Consistency.</strong> Every warning, every step and every heading looks the same in all 300 pages.</li>' +
  '<li><strong>Speed.</strong> The customer wants headings in dark blue instead of black? Change one style — the whole document follows in a second.</li>' +
  '<li><strong>Structure.</strong> The Navigation pane, the table of contents and heading numbers are built from heading styles. Bold 14-pt text that only <em>looks</em> like a heading is invisible to all of them.</li>' +
  '</ul>' +
  '<h2>The kinds of style</h2>' +
  '<table><thead><tr><th>Kind</th><th>Symbol in the Styles pane</th><th>Applies to</th><th>Examples</th></tr></thead><tbody>' +
  '<tr><td>Paragraph</td><td>¶</td><td>The whole paragraph</td><td>Normal, Heading 1, List Number, Caption</td></tr>' +
  '<tr><td>Character</td><td><em>a</em></td><td>Selected words only</td><td>Strong, Emphasis, a <em>UI Control</em> style for button names</td></tr>' +
  '<tr><td>Linked</td><td>¶<em>a</em></td><td>A paragraph, or just the selected words</td><td>Heading 1, Title</td></tr>' +
  '<tr><td>Table</td><td>▦</td><td>A table</td><td>Table Grid, the template\'s own table style</td></tr>' +
  '<tr><td>List</td><td>☰</td><td>Numbering of a list (advanced)</td><td>1 / 1.1 / 1.1.1</td></tr>' +
  '</tbody></table>' +
  '<h2>Applying a style</h2>' +
  '<ul>' +
  '<li>Click anywhere in the paragraph — no need to select it — and click a style in <strong>Home → Styles</strong> or in the Styles pane.</li>' +
  '<li>Or press <code>Ctrl</code>+<code>Shift</code>+<code>S</code>, type the first letters of the style name and press <code>Enter</code>.</li>' +
  '<li>Built-in shortcuts: <code>Ctrl</code>+<code>Alt</code>+<code>1</code> / <code>2</code> / <code>3</code> for Heading 1–3, <code>Ctrl</code>+<code>Shift</code>+<code>N</code> for Normal, <code>Ctrl</code>+<code>Shift</code>+<code>L</code> for List Bullet.</li>' +
  '</ul>' +
  '<h2>Changing a style</h2>' +
  '<ol class="steps">' +
  '<li>In the Styles pane, point at the style, click the arrow beside it and choose <strong>Modify…</strong>.</li>' +
  '<li>Set the basics in the dialog. For more, use <strong>Format</strong> at the bottom-left: <em>Font</em>, <em>Paragraph</em> (spacing, indents, line and page breaks), <em>Tabs</em>, <em>Border</em>, <em>Language</em>, <em>Numbering</em>.</li>' +
  '<li>Check <strong>Style for following paragraph</strong>: after a heading you want <em>Body Text</em> or <em>Normal</em>, so pressing <code>Enter</code> puts you straight in the right style.</li>' +
  '<li>Choose <strong>Only in this document</strong> (the safe default) unless you are editing a template. Leave <strong>Automatically update</strong> cleared — otherwise one accidental change to one paragraph changes the style everywhere.</li>' +
  '</ol>' +
  '<p>The quick way: format one paragraph until it looks right, then right-click its style in the gallery and choose <strong>Update <em>Heading 1</em> to Match Selection</strong>.</p>' +
  '<h2>“Based on” — the family tree</h2>' +
  '<p>Most styles are <strong>based on</strong> another (usually <em>Normal</em>). They inherit everything you don\'t set yourself. Change the font of <em>Normal</em> and every style based on it follows. That is powerful — and the reason to change <em>Normal</em> carefully.</p>' +
  '<h2>Which style for what</h2>' +
  '<table><thead><tr><th>Content</th><th>Style</th></tr></thead><tbody>' +
  '<tr><td>Document title on the title page</td><td>Title</td></tr>' +
  '<tr><td>Chapter / section / subsection headings</td><td>Heading 1 / Heading 2 / Heading 3 (rarely Heading 4)</td></tr>' +
  '<tr><td>Ordinary text</td><td>Normal or Body Text — whichever the template uses</td></tr>' +
  '<tr><td>Bullets</td><td>List Bullet, List Bullet 2 for the second level</td></tr>' +
  '<tr><td>Procedure steps</td><td>List Number, List Number 2 for sub-steps</td></tr>' +
  '<tr><td>Text that continues a list item (a second paragraph inside a step)</td><td>List Continue</td></tr>' +
  '<tr><td>Figure and table titles</td><td>Caption (inserted with <em>Insert Caption</em> — lesson 7)</td></tr>' +
  '<tr><td>Text inside tables</td><td>The template\'s table text style (often <em>Table Text</em>), not Normal — Normal usually has too much spacing for a cell.</td></tr>' +
  '<tr><td>WARNING, CAUTION, NOTE</td><td>The template\'s notice styles (lesson 7)</td></tr>' +
  '<tr><td>Code, commands, file content</td><td>A code style with a monospaced font (e.g. <em>Code</em>, based on Consolas)</td></tr>' +
  '<tr><td>Button names, menu names, field names inside a sentence</td><td>A character style (Strong, or the template\'s <em>UI Control</em> style)</td></tr>' +
  '</tbody></table>' +
  '<h2>Finding hand formatting</h2>' +
  '<ul>' +
  '<li><code>Shift</code>+<code>F1</code> opens <strong>Reveal Formatting</strong>: it shows the paragraph\'s style and anything added on top of it.</li>' +
  '<li>The <strong>Style Inspector</strong> (second button at the bottom of the Styles pane) shows the paragraph style and the character style, and any extra formatting — with a button to clear it.</li>' +
  '<li>To remove hand formatting: <code>Ctrl</code>+<code>Space</code> clears character formatting, <code>Ctrl</code>+<code>Q</code> clears paragraph formatting. <strong>Home → Clear All Formatting</strong> (the <em>A</em> with an eraser) resets the selection to Normal.</li>' +
  '</ul>' +
  '<div class="callout tip"><b>Tip:</b> Right-click a style in the Styles pane and choose <strong>Select All <em>n</em> Instances</strong>. Useful to check that every warning is in the warning style — or to move all of them to another style in one click.</div>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>Type <code>=rand(6,3)</code> and <code>Enter</code>. Turn three of the paragraphs into short headings and apply Heading 1, Heading 2 and Heading 2.</li>' +
  '<li>Modify <em>Heading 1</em>: Arial 16 pt, bold, dark blue, 18 pt space before, 6 pt after, <em>Style for following paragraph: Normal</em>.</li>' +
  '<li>Make one sentence bold and red by hand. Find it with <code>Shift</code>+<code>F1</code>, then clear it with <code>Ctrl</code>+<code>Space</code>.</li>' +
  '<li>Open the Navigation pane and check that your three headings appear in it.</li>' +
  '</ol>'
  } },

{ id: "word-4-paragraphs", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 4 — Paragraphs, spacing and page flow' },
  summary: { en: 'Spacing without empty lines, indents, line and page breaks, keeping things together, special spaces, and Hebrew right-to-left paragraphs.' },
  body: {
  en:
  '<p class="lede">In Word a paragraph is everything up to a ¶ mark. Spacing, indents, alignment and page-break behaviour belong to the paragraph — and should come from its style.</p>' +
  '<h2>Spacing: never press Enter twice</h2>' +
  '<p>Empty paragraphs to make space are the most common beginner mistake. They break page flow, leave blank lines at the tops of pages and make spacing inconsistent. Use <strong>space before</strong> and <strong>space after</strong> in the style instead: <strong>Modify → Format → Paragraph → Spacing</strong>, or <strong>Layout → Paragraph → Spacing</strong> for a single paragraph.</p>' +
  '<table><thead><tr><th>You want</th><th>Use</th><th>Not</th></tr></thead><tbody>' +
  '<tr><td>A gap between paragraphs</td><td>Space after (e.g. 6 pt) in the style</td><td>An empty paragraph</td></tr>' +
  '<tr><td>A new line in the same paragraph (e.g. an address)</td><td>Line break: <code>Shift</code>+<code>Enter</code></td><td>A new paragraph</td></tr>' +
  '<tr><td>Start on a new page</td><td>Page break: <code>Ctrl</code>+<code>Enter</code>, or <em>Page break before</em> in the Heading 1 style</td><td>Many empty paragraphs</td></tr>' +
  '<tr><td>Text that starts further in</td><td>An indent (ruler, or <em>Indentation</em> in the Paragraph dialog)</td><td>Spaces or tabs at the start</td></tr>' +
  '<tr><td>Values lined up in a column</td><td>A tab stop, or better, a table</td><td>Spaces</td></tr>' +
  '</tbody></table>' +
  '<h2>Line and Page Breaks — the hidden powers</h2>' +
  '<p><strong>Home → Paragraph</strong> dialog launcher → <strong>Line and Page Breaks</strong> tab. Set these in the styles:</p>' +
  '<ul>' +
  '<li><strong>Widow/Orphan control</strong> — no single line of a paragraph alone at the top or bottom of a page. Leave it on.</li>' +
  '<li><strong>Keep with next</strong> — the paragraph stays on the same page as the next one. Always on for headings, captions above tables, and WARNING / CAUTION / NOTE (a warning must never be separated from its step).</li>' +
  '<li><strong>Keep lines together</strong> — the paragraph is never split across pages. Good for short steps and notices.</li>' +
  '<li><strong>Page break before</strong> — the paragraph always starts a page. Typical for Heading 1 (each chapter on a new page).</li>' +
  '</ul>' +
  '<p>A small black square ▪ beside a paragraph (with Show/Hide ¶ on) means one of these is set.</p>' +
  '<h2>Indents</h2>' +
  '<ul>' +
  '<li><strong>Left / right indent</strong> — the whole paragraph moves in.</li>' +
  '<li><strong>First line</strong> — only the first line moves in (rare in technical writing).</li>' +
  '<li><strong>Hanging</strong> — every line except the first moves in. This is how list text lines up after the bullet or number, and how “NOTE:” sits beside its text.</li>' +
  '</ul>' +
  '<h2>Special characters that save layouts</h2>' +
  '<table><thead><tr><th>Character</th><th>Keys</th><th>Use</th></tr></thead><tbody>' +
  '<tr><td>Non-breaking space</td><td><code>Ctrl</code>+<code>Shift</code>+<code>Space</code></td><td>Between a number and its unit (<em>12 V</em>, <em>5 mm</em>) and in names like <em>Figure 3</em>, so they never split across lines.</td></tr>' +
  '<tr><td>Non-breaking hyphen</td><td><code>Ctrl</code>+<code>Shift</code>+<code>-</code></td><td>In part numbers and codes (<em>MS-2210-04</em>).</td></tr>' +
  '<tr><td>Optional hyphen</td><td><code>Ctrl</code>+<code>-</code></td><td>Where a long word may break.</td></tr>' +
  '<tr><td>Symbols</td><td><strong>Insert → Symbol</strong></td><td>°, ±, µ, Ω, ×, ≤, ≥. Never type <em>x</em> for × or <em>u</em> for µ.</td></tr>' +
  '</tbody></table>' +
  '<h2>Hebrew paragraphs</h2>' +
  '<p>Add Hebrew once in <strong>File → Options → Language</strong>. The <strong>Right-to-Left Text Direction</strong> and <strong>Left-to-Right Text Direction</strong> buttons then appear in <strong>Home → Paragraph</strong> (<code>Ctrl</code>+<code>Right Shift</code> and <code>Ctrl</code>+<code>Left Shift</code>). In a Hebrew document use a style with right-to-left direction, so headings, lists and tables all run the right way. English terms inside Hebrew text stay readable on their own.</p>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>In your lesson 3 file, delete every empty paragraph. Set <em>Normal</em> to 6 pt space after, 1.15 line spacing.</li>' +
  '<li>Set <em>Heading 1</em> to <em>Page break before</em> and <em>Keep with next</em>. Watch each chapter jump to a new page.</li>' +
  '<li>Type <em>Apply 28 V DC</em> with a non-breaking space between <em>28</em> and <em>V</em>. Narrow the window and check that they never split.</li>' +
  '</ol>'
  } },

{ id: "word-5-lists", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 5 — Bulleted and numbered lists' },
  summary: { en: 'When to use bullets and when to use numbers, how to write list items, and how to make Word\'s numbering behave.' },
  body: {
  en:
  '<p class="lede">Lists are the backbone of technical writing — every procedure is a numbered list. They are also where Word surprises beginners most. Follow the rules here and lists will behave.</p>' +
  '<h2>Bullets or numbers?</h2>' +
  '<table><thead><tr><th>Use</th><th>When</th><th>Example</th></tr></thead><tbody>' +
  '<tr><td><strong>Numbered list</strong> (ordered, <code>&lt;ol&gt;</code>)</td><td>The order matters: steps of a procedure, a sequence of events, a ranked list — or you will refer to an item by its number.</td><td>1. Remove the four screws. 2. Lift the cover. 3. Disconnect J1.</td></tr>' +
  '<tr><td><strong>Bulleted list</strong> (unordered, <code>&lt;ul&gt;</code>)</td><td>The order doesn\'t matter: features, parts in a kit, options, prerequisites.</td><td>• Power supply • Data cable • Mounting kit</td></tr>' +
  '<tr><td><strong>Table</strong></td><td>Each item has two or more attributes (name, value, unit, range).</td><td>Parameter | Value | Unit</td></tr>' +
  '<tr><td><strong>Ordinary paragraph</strong></td><td>Fewer than two items, or the items need explaining in full sentences.</td><td>—</td></tr>' +
  '</tbody></table>' +
  '<h2>Writing list items</h2>' +
  '<ul>' +
  '<li><strong>Introduce the list</strong> with a sentence that ends in a colon: <em>“The kit contains:”</em> or <em>“To install the unit:”</em>.</li>' +
  '<li><strong>Keep items parallel</strong> — all nouns, or all full sentences, or all starting with a verb. Not a mix.</li>' +
  '<li><strong>One action per step.</strong> If a step has an <em>and</em> joining two actions, it is probably two steps.</li>' +
  '<li><strong>Result after the action.</strong> <em>“Push START. The READY indicator comes on.”</em> The result can be a second sentence in the same step.</li>' +
  '<li><strong>Two levels at most.</strong> A third level means the content needs a table or a sub-procedure.</li>' +
  '<li><strong>Punctuation:</strong> full sentences end with a full stop; short fragments get no punctuation. Follow the customer\'s style guide where it says otherwise.</li>' +
  '</ul>' +
  '<h2>Making lists in Word — the right way</h2>' +
  '<p>Use the <strong>list styles</strong>, not the Bullets and Numbering buttons. The styles carry the right indents and spacing from the template, and they stay consistent.</p>' +
  '<table><thead><tr><th>Style</th><th>For</th></tr></thead><tbody>' +
  '<tr><td>List Bullet / List Bullet 2</td><td>Bullets, first and second level</td></tr>' +
  '<tr><td>List Number / List Number 2</td><td>Steps (1, 2, 3) and sub-steps (a, b, c)</td></tr>' +
  '<tr><td>List Continue / List Continue 2</td><td>An extra paragraph, a picture or a note inside a list item, lined up with its text</td></tr>' +
  '</tbody></table>' +
  '<p>If these styles are not in the Styles pane: <strong>Options… → Select styles to show: All styles</strong>, or apply them with <code>Ctrl</code>+<code>Shift</code>+<code>S</code>.</p>' +
  '<h2>Controlling the numbering</h2>' +
  '<ul>' +
  '<li><strong>Start a new procedure at 1:</strong> right-click the first number → <strong>Restart at 1</strong>.</li>' +
  '<li><strong>Continue after a note or picture:</strong> right-click the number → <strong>Continue Numbering</strong>. If the note is in <em>List Continue</em> style, numbering continues by itself.</li>' +
  '<li><strong>Start at any number:</strong> right-click → <strong>Set Numbering Value…</strong>.</li>' +
  '<li><strong>Change the level:</strong> <code>Tab</code> at the start of a list item moves it one level down, <code>Shift</code>+<code>Tab</code> moves it up — or apply <em>List Number 2</em>.</li>' +
  '<li><strong>Remove a list:</strong> apply <em>Normal</em> (or the body style).</li>' +
  '</ul>' +
  '<div class="callout note"><b>Note:</b> Never type numbers or bullet characters by hand (“1.”, “-”, “•”). They don\'t renumber when you add a step, and cross-references to steps can\'t find them.</div>' +
  '<h2>A good procedure, start to finish</h2>' +
  '<p><em>Heading 3:</em> <strong>Replacing the air filter</strong><br>' +
  '<em>Normal:</em> To replace the air filter:<br>' +
  '<em>List Number:</em> 1. Set the MAIN POWER switch to OFF.<br>' +
  '<em>List Number:</em> 2. Remove the four screws (1) from the filter cover (2).<br>' +
  '<em>List Continue:</em> NOTE: Keep the screws for the new cover.<br>' +
  '<em>List Number:</em> 3. Remove the filter and discard it.<br>' +
  '<em>List Number:</em> 4. Install the new filter with the arrow pointing to the fan.</p>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>Write the procedure above with <em>List Number</em> and <em>List Continue</em> styles. Check that the steps are numbered 1 to 4 with the note unnumbered between them.</li>' +
  '<li>Write a second procedure right after it and make it restart at 1.</li>' +
  '<li>Add a bulleted list of the tools needed, introduced by a sentence with a colon.</li>' +
  '</ol>'
  } },

{ id: "word-6-headings-toc", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 6 — Headings, numbering and the table of contents' },
  summary: { en: 'Heading levels, numbered headings (1, 1.1, 1.1.1), moving chapters in the Navigation pane, and a table of contents that builds itself.' },
  body: {
  en:
  '<p class="lede">Headings are the skeleton of a document. Set them up correctly once and Word gives you numbering, navigation, a table of contents and PDF bookmarks for free.</p>' +
  '<h2>Heading levels</h2>' +
  '<ul>' +
  '<li><strong>Heading 1</strong> — chapters (1 INTRODUCTION, 2 SYSTEM DESCRIPTION…).</li>' +
  '<li><strong>Heading 2</strong> — sections inside a chapter (2.1, 2.2).</li>' +
  '<li><strong>Heading 3</strong> — subsections (2.1.1). Use Heading 4 only when the template requires it.</li>' +
  '<li>Never skip a level (Heading 1 straight to Heading 3), and avoid a single subsection on its own — if 2.1 has no 2.2, it probably isn\'t needed.</li>' +
  '<li>Headings say what the section is about: <em>Replacing the battery</em>, not <em>General</em>.</li>' +
  '</ul>' +
  '<h2>Numbered headings: 1 / 1.1 / 1.1.1</h2>' +
  '<p>Defense documents almost always number their headings. The right way is a <strong>multilevel list linked to the heading styles</strong> — then numbers update themselves when you add, delete or move a section.</p>' +
  '<ol class="steps">' +
  '<li>Put the cursor in a Heading 1 paragraph.</li>' +
  '<li>Choose <strong>Home → Paragraph → Multilevel List</strong>. If the library shows a style like <em>1 Heading 1 / 1.1 Heading 2 / 1.1.1 Heading 3</em>, click it — done.</li>' +
  '<li>Otherwise choose <strong>Define New Multilevel List…</strong> and click <strong>More &gt;&gt;</strong>.</li>' +
  '<li>Click level <strong>1</strong>. Set <em>Link level to style: Heading 1</em>, and the number format to <code>1</code>.</li>' +
  '<li>Click level <strong>2</strong>. <em>Link level to style: Heading 2</em>; number format <code>1.1</code> (Word builds it from <em>Include level number from</em>).</li>' +
  '<li>Level <strong>3</strong>: <em>Heading 3</em>, <code>1.1.1</code>. Set <em>Aligned at</em> 0 cm and a tab after the number for every level, so headings line up at the margin.</li>' +
  '<li>Click <strong>OK</strong>. Every heading in the document is now numbered.</li>' +
  '</ol>' +
  '<div class="callout tip"><b>Tip:</b> Appendices usually need their own scheme (A, A.1, A.1.1). Use separate styles for them — for example <em>Appendix 1</em>, <em>Appendix 2</em> — with their own linked multilevel list. Customer templates usually already have them.</div>' +
  '<h2>Reorganising with the Navigation pane</h2>' +
  '<ul>' +
  '<li>Drag a heading up or down in the Navigation pane: the whole section moves with it, sub-sections included, and the numbers update.</li>' +
  '<li>Right-click a heading for <strong>Promote</strong>, <strong>Demote</strong>, <strong>New Heading Before / After</strong>, <strong>Delete</strong>.</li>' +
  '<li><strong>View → Outline</strong> does the same in the page, and <strong>Show Level</strong> folds the document down to its headings — the best way to review a structure.</li>' +
  '</ul>' +
  '<h2>The table of contents</h2>' +
  '<ol class="steps">' +
  '<li>Put the cursor where the table of contents goes (usually its own page after the front matter). Type a title such as <em>TABLE OF CONTENTS</em> in a style that is <strong>not</strong> a heading (e.g. <em>TOC Heading</em>), so it doesn\'t list itself.</li>' +
  '<li>Choose <strong>References → Table of Contents → Custom Table of Contents…</strong>.</li>' +
  '<li>Set <strong>Show levels</strong> (usually 3), tick <strong>Right align page numbers</strong>, and choose the dot leader. Click <strong>OK</strong>.</li>' +
  '<li>After changes, click in the table and press <code>F9</code> (or <strong>References → Update Table</strong>) → <strong>Update entire table</strong>.</li>' +
  '</ol>' +
  '<ul>' +
  '<li>The look of each line comes from the styles <strong>TOC 1</strong>, <strong>TOC 2</strong>, <strong>TOC 3</strong>. Change those styles, never the table\'s text — hand changes vanish at the next update.</li>' +
  '<li>Something missing? Its paragraph isn\'t in a heading style. Something extra? A non-heading paragraph has an outline level — fix its style.</li>' +
  '<li><code>Ctrl</code>+click a line to jump to the section.</li>' +
  '</ul>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>Build an outline: three Heading 1 chapters, each with two Heading 2 sections, one with two Heading 3 subsections.</li>' +
  '<li>Number the headings 1 / 1.1 / 1.1.1 with a linked multilevel list.</li>' +
  '<li>Insert a three-level table of contents at the top.</li>' +
  '<li>Drag chapter 3 above chapter 2 in the Navigation pane. Update the table of contents and check the new numbers.</li>' +
  '</ol>'
  } },

{ id: "word-7-tables-figures", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 7 — Tables, figures, captions and safety notices' },
  summary: { en: 'Tables that survive page breaks, pictures that stay put, numbered captions with cross-references, lists of figures and tables, and WARNING / CAUTION / NOTE.' },
  body: {
  en:
  '<p class="lede">Tables and figures carry much of a technical document\'s information. They need numbers, titles and references that update themselves — Word\'s captions and cross-references do exactly that.</p>' +
  '<h2>Tables</h2>' +
  '<ol class="steps">' +
  '<li><strong>Insert → Table</strong>, drag over the grid for the size.</li>' +
  '<li>Apply the template\'s table style (<strong>Table Design → Table Styles</strong>). Format through the style, not cell by cell.</li>' +
  '<li>Use the table text style for the cells, and a table heading style for the first row.</li>' +
  '<li>Select the header row and choose <strong>Layout → Data → Repeat Header Rows</strong>. On every new page the table continues with its headings.</li>' +
  '<li>Select the table, <strong>Layout → Table → Properties → Row</strong>, and clear <strong>Allow row to break across pages</strong> — a row is never split in two.</li>' +
  '<li><strong>Layout → Cell Size → AutoFit → AutoFit Window</strong> fits the table to the page width.</li>' +
  '</ol>' +
  '<ul>' +
  '<li>Units go in the column heading — <em>Voltage (V DC)</em> — not in every cell.</li>' +
  '<li>Numbers align right or on the decimal point; text aligns left.</li>' +
  '<li>Never leave a cell empty — use “—” or “N/A” so the reader knows it isn\'t missing.</li>' +
  '<li>Wide table? Put it on a landscape page (lesson 8).</li>' +
  '</ul>' +
  '<h2>Figures</h2>' +
  '<ul>' +
  '<li><strong>Insert → Pictures → This Device</strong>. Keep the picture <strong>In Line with Text</strong> (<strong>Picture Format → Wrap Text</strong>) and in its own paragraph with a <em>Figure</em> style (centred, Keep with next). Floating pictures wander when the text changes.</li>' +
  '<li>Size pictures to the text width or a fixed fraction of it, so all figures look alike.</li>' +
  '<li>Use callout numbers on the picture (1), (2), (3) and explain them in a legend or in the steps — not long text labels inside the picture, which can\'t be edited or translated.</li>' +
  '<li>Right-click → <strong>View Alt Text</strong> and describe the picture.</li>' +
  '<li><strong>Picture Format → Compress Pictures</strong> keeps big manuals at a sensible size.</li>' +
  '</ul>' +
  '<h2>Captions</h2>' +
  '<ol class="steps">' +
  '<li>Select the table or picture and choose <strong>References → Insert Caption</strong>.</li>' +
  '<li>Choose the <strong>Label</strong>: <em>Table</em> or <em>Figure</em>. Choose the <strong>Position</strong>: tables above, figures below — unless the template says otherwise.</li>' +
  '<li>To number by chapter (Figure 3-2, Table 4-1), click <strong>Numbering…</strong>, tick <strong>Include chapter number</strong> and choose <em>Heading 1</em>. (This needs numbered headings — lesson 6.)</li>' +
  '<li>Type the title after the number — <em>Figure 3-2 Front panel controls</em> — and click <strong>OK</strong>.</li>' +
  '</ol>' +
  '<h2>Cross-references</h2>' +
  '<p>Never type “see Figure 5” by hand — after one new figure it is wrong. Instead: <strong>References → Cross-reference</strong> (or <strong>Insert → Links → Cross-reference</strong>), choose <em>Reference type: Figure</em> (or Table, Heading, Numbered item), <em>Insert reference to: Only label and number</em>, pick the item and click <strong>Insert</strong>. Keep <strong>Insert as hyperlink</strong> ticked.</p>' +
  '<p>Cross-references are fields. Update all of them with <code>Ctrl</code>+<code>A</code> then <code>F9</code>. To have Word do it before every print and PDF: <strong>File → Options → Display → Update fields before printing</strong>.</p>' +
  '<h2>Lists of figures and tables</h2>' +
  '<p><strong>References → Insert Table of Figures</strong>, choose <em>Caption label: Figure</em> — and again with <em>Table</em>. They go right after the table of contents and update like it.</p>' +
  '<h2>WARNING, CAUTION and NOTE</h2>' +
  '<table><thead><tr><th>Notice</th><th>Means</th><th>Rules</th></tr></thead><tbody>' +
  '<tr><td><strong>WARNING</strong></td><td>A procedure or condition that can cause injury or death.</td><td>Before the step it applies to. Says the hazard, the result and how to avoid it.</td></tr>' +
  '<tr><td><strong>CAUTION</strong></td><td>A procedure or condition that can damage equipment or data.</td><td>Before the step it applies to.</td></tr>' +
  '<tr><td><strong>NOTE</strong></td><td>Information that helps the reader. No danger.</td><td>Before or after the step. Never contains an instruction that must be done.</td></tr>' +
  '</tbody></table>' +
  '<ul>' +
  '<li>Use the template\'s notice styles (often a one-cell table or a bordered paragraph with an icon). They have <em>Keep with next</em> so a warning never sits on a different page from its step.</li>' +
  '<li>A notice is never a step — don\'t number it.</li>' +
  '<li>Save your project\'s standard notices as Quick Parts (lesson 11) so the wording is identical everywhere.</li>' +
  '</ul>' +
  '<div class="callout warn"><b>Example:</b> WARNING — HIGH VOLTAGE. The power supply contains 400 V DC for up to 2 minutes after power is removed. Wait 2 minutes before you open the cover.</div>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>In your lesson 6 file, add a 4 × 10 table of technical data with a repeating header row and a caption above it.</li>' +
  '<li>Add two pictures (any screenshots) with captions below them, numbered by chapter.</li>' +
  '<li>In the text, add “see <em>Figure 1-2</em>” as a cross-reference. Then insert a new figure before it, update the fields and watch it become <em>Figure 1-3</em>.</li>' +
  '<li>Add a list of figures and a list of tables after the table of contents.</li>' +
  '</ol>'
  } },

{ id: "word-8-layout", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 8 — Page layout: sections, headers, footers and markings' },
  summary: { en: 'Section breaks, a landscape page in a portrait document, headers and footers with the document number, revision, page X of Y and the classification marking.' },
  body: {
  en:
  '<p class="lede">A defense document\'s pages carry a lot of information around the text: the classification marking, the document number and revision, the page number. Word manages all of it with <strong>sections</strong> and <strong>headers and footers</strong>.</p>' +
  '<h2>Sections</h2>' +
  '<p>A section is a part of the document with its own page setup: orientation, margins, headers and footers, page numbering. Insert one with <strong>Layout → Breaks → Section Breaks → Next Page</strong>. Typical sections in a manual:</p>' +
  '<ol>' +
  '<li>Title page — no page number.</li>' +
  '<li>Front matter (record of changes, table of contents, lists of figures and tables) — numbered i, ii, iii.</li>' +
  '<li>The body — numbered 1, 2, 3 (or 1-1, 1-2 by chapter).</li>' +
  '<li>A landscape section for a wide table or diagram, then portrait again.</li>' +
  '</ol>' +
  '<h2>A landscape page in a portrait document</h2>' +
  '<ol class="steps">' +
  '<li>Put a <strong>Next Page</strong> section break before the wide table and another after it.</li>' +
  '<li>Click inside the table\'s section and choose <strong>Layout → Orientation → Landscape</strong>. Only that section turns.</li>' +
  '</ol>' +
  '<h2>Headers and footers</h2>' +
  '<ol class="steps">' +
  '<li>Double-click the top or bottom margin (or <strong>Insert → Header → Edit Header</strong>). The <strong>Header &amp; Footer</strong> tab opens.</li>' +
  '<li><strong>Different First Page</strong> gives the title page its own (or no) header.</li>' +
  '<li><strong>Link to Previous</strong> is on by default: the section repeats the previous section\'s header. Switch it off in a section before you change that section\'s header — otherwise you change them all.</li>' +
  '<li><strong>Page Number → Format Page Numbers…</strong> sets the number format (i, ii, iii or 1, 2, 3) and <strong>Start at</strong> 1 for each section.</li>' +
  '<li><strong>Close Header and Footer</strong> (or press <code>Esc</code>) to go back to the text.</li>' +
  '</ol>' +
  '<h2>What a typical page carries</h2>' +
  '<table><thead><tr><th>Where</th><th>Typical content</th></tr></thead><tbody>' +
  '<tr><td>Top centre and bottom centre</td><td>The classification marking — the same on every page, including the title page and blank pages.</td></tr>' +
  '<tr><td>Header</td><td>Document title or document number, company and customer logo if the template has them.</td></tr>' +
  '<tr><td>Footer</td><td>Document number, revision, date, <em>Page X of Y</em>.</td></tr>' +
  '</tbody></table>' +
  '<h2>Page X of Y</h2>' +
  '<p><strong>Insert → Page Number → Current Position → Page X of Y</strong> — or type <em>Page</em>, then <strong>Insert → Quick Parts → Field… → Page</strong>, <em>of</em>, and the field <strong>NumPages</strong> (or <strong>SectionPages</strong> to count only the body section).</p>' +
  '<h2>Document number and revision that fill themselves in</h2>' +
  '<ol class="steps">' +
  '<li>Type the values once in <strong>File → Info → Properties → Advanced Properties</strong> (<em>Title</em>, <em>Subject</em>, or custom properties such as <em>DocNumber</em> and <em>Revision</em> on the <strong>Custom</strong> tab).</li>' +
  '<li>In the header, footer or title page, insert them with <strong>Insert → Quick Parts → Document Property</strong> (for <em>Title</em>, <em>Subject</em> and the other standard ones) or <strong>Insert → Quick Parts → Field… → DocProperty</strong> (for custom ones).</li>' +
  '<li>Change the revision in one place, press <code>Ctrl</code>+<code>A</code> and <code>F9</code>, and every page shows it.</li>' +
  '</ol>' +
  '<div class="callout warn"><b>Important:</b> The classification marking must match the highest classification of any content in the document, and is set by the project security officer — never by guess. If you are not sure what to mark, stop and ask.</div>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>In your practice document, add a title page and a front-matter section before chapter 1.</li>' +
  '<li>No number on the title page; i, ii, iii in the front matter; 1, 2, 3 from chapter 1.</li>' +
  '<li>Add <em>UNCLASSIFIED</em> centred at the top and bottom of every page, and <em>Doc. No. GAL-TM-0001 Rev. A — Page X of Y</em> in the footer, with the number and revision as document properties.</li>' +
  '<li>Put your wide table from lesson 7 on a landscape page.</li>' +
  '</ol>'
  } },

{ id: "word-9-documents", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 9 — What our documents look like' },
  summary: { en: 'The documents GALIL writes for defense customers — manuals, software documents, test procedures, interface documents and training material — and the structure of each.' },
  body: {
  en:
  '<p class="lede">Every document type has a job and a shape that fits it. Once you know the shapes, a new project is mostly filling in a familiar structure. The contract and the customer\'s template always win — what follows is the typical shape.</p>' +
  '<h2>At a glance</h2>' +
  '<div class="docmocks">' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Operator\'s / Maintenance Manual</b><span>Title page · Warnings summary · TOC · Introduction · Description · Operation · Maintenance · Troubleshooting · Appendices</span><div class="mk">UNCLASSIFIED</div></div>' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Software User Manual (SUM)</b><span>Scope · Software summary · Access · Using the software (task by task) · Messages and errors · Notes</span><div class="mk">UNCLASSIFIED</div></div>' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Requirements Specification (SRS / SSS)</b><span>Scope · Applicable documents · Requirements (“shall”, each with an ID) · Qualification provisions · Traceability</span><div class="mk">UNCLASSIFIED</div></div>' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Acceptance Test Procedure (ATP)</b><span>Scope · Test equipment · Setup · Test steps table: Step | Action | Expected result | Pass/Fail · Sign-off</span><div class="mk">UNCLASSIFIED</div></div>' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Interface Control Document (ICD)</b><span>Scope · Interfaces overview · Physical / electrical · Messages and fields tables · Timing · Error handling</span><div class="mk">UNCLASSIFIED</div></div>' +
  '<div class="docmock"><div class="mk">UNCLASSIFIED</div><b>Training material</b><span>Course plan · Lesson objectives · Content · Exercises · Assessment · Trainer notes</span><div class="mk">UNCLASSIFIED</div></div>' +
  '</div>' +
  '<h2>Front matter — the same in almost every document</h2>' +
  '<ul>' +
  '<li><strong>Title page:</strong> document title, document number, revision, date, customer and contract number, classification marking, prepared / reviewed / approved by (names, signatures, dates).</li>' +
  '<li><strong>Record of changes</strong> (revision history): Revision | Date | Description of change | Pages affected | Approved by.</li>' +
  '<li><strong>List of effective pages</strong> in some manuals: the revision of every page.</li>' +
  '<li><strong>Table of contents</strong>, <strong>list of figures</strong>, <strong>list of tables</strong>.</li>' +
  '<li><strong>Acronyms and abbreviations</strong>, often as an appendix.</li>' +
  '<li><strong>Applicable and reference documents</strong>: number, title and revision of every document you rely on.</li>' +
  '</ul>' +
  '<h2>The main types</h2>' +
  '<h3>Technical manuals (operator, maintenance, installation)</h3>' +
  '<p>Task-based. The reader is doing something with the equipment. Short numbered steps, many figures with callout numbers, formal WARNING / CAUTION / NOTE, tables of parts, tools and consumables, troubleshooting tables (<em>Symptom | Probable cause | Corrective action</em>). Often written to MIL-STD-40051 or S1000D, or a customer template derived from them.</p>' +
  '<h3>Software documents (MIL-STD-498 style)</h3>' +
  '<p>Many customers still use the MIL-STD-498 document set or a template based on it: <strong>SSS</strong>/<strong>SRS</strong> (requirements), <strong>SDD</strong> (design), <strong>IRS</strong>/<strong>IDD</strong> (interfaces), <strong>STP</strong>/<strong>STD</strong>/<strong>STR</strong> (test plan, descriptions, report), <strong>SUM</strong> (user manual), <strong>VDD</strong> (version description). Their chapters follow fixed numbered paragraphs — keep the numbering even when a paragraph says only “Not applicable.”</p>' +
  '<p>Requirements are written as <em>“The system shall…”</em> — one requirement per sentence, each with a unique ID (for example <code>SRS-NAV-0012</code>), testable, and never with <em>and/or</em>, <em>etc.</em> or <em>as appropriate</em>.</p>' +
  '<h3>Test procedures (ATP, STD)</h3>' +
  '<p>Built around a test table that a tester fills in with a pen or on a laptop. One action and one measurable expected result per row, a Pass/Fail column and space for the tester\'s initials. Repeating header rows and rows that don\'t break across pages (lesson 7) are a must.</p>' +
  '<h3>Interface Control Documents (ICD)</h3>' +
  '<p>Reference documents read by engineers on both sides of an interface. Mostly tables: message lists, field layouts (<em>Field | Bits | Type | Range | Units | Description</em>), connector pin-outs. Precision matters more than prose.</p>' +
  '<h3>Training material</h3>' +
  '<p>Lesson plans, trainee guides and exercises, often delivered with the manuals. Learning objectives first, then content in small units, then practice and assessment — like this course.</p>' +
  '<div class="callout tip"><b>Tip:</b> Before you start any new document, ask your Team Lead for an approved example of the same type for the same customer. Copying its structure is not cheating — it is how consistency works.</div>' +
  '<h2>Try it</h2>' +
  '<p>Take your practice document and turn it into the skeleton of an Operator\'s Manual: title page, record of changes table, table of contents, list of figures and tables, and the chapters <em>Introduction</em>, <em>System Description</em>, <em>Operation</em>, <em>Maintenance</em>, <em>Troubleshooting</em>, and <em>Appendix A — Acronyms</em>. Add a three-row troubleshooting table.</p>'
  } },

{ id: "word-10-review", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 10 — Review, track changes and delivery' },
  summary: { en: 'Comments and Track Changes, comparing versions, the final checks, removing hidden data and exporting a PDF with bookmarks.' },
  body: {
  en:
  '<p class="lede">Documents go through rounds of review: your Team Lead, the engineers, the customer\'s quality team. Word records every change and every comment so nothing gets lost — and you must remove all of it before delivery.</p>' +
  '<h2>Comments</h2>' +
  '<ul>' +
  '<li>Select text and choose <strong>Review → New Comment</strong> (<code>Ctrl</code>+<code>Alt</code>+<code>M</code>). Use <code>@name</code> to address a colleague.</li>' +
  '<li>Answer in the comment\'s thread with <strong>Reply</strong>, and close it with <strong>Resolve</strong> when it is handled.</li>' +
  '<li><strong>Review → Delete → Delete All Comments in Document</strong> before delivery.</li>' +
  '</ul>' +
  '<h2>Track Changes</h2>' +
  '<ul>' +
  '<li><strong>Review → Track Changes</strong> (<code>Ctrl</code>+<code>Shift</code>+<code>E</code>) records every insertion, deletion and formatting change.</li>' +
  '<li>Choose what you see under <strong>Review → Tracking</strong>: <em>Simple Markup</em> (clean view, red bars in the margin), <em>All Markup</em> (every change shown), <em>No Markup</em>, <em>Original</em>.</li>' +
  '<li>Go through changes with <strong>Next</strong> / <strong>Previous</strong> and <strong>Accept</strong> or <strong>Reject</strong> each one. <strong>Accept All Changes</strong> when the review is finished.</li>' +
  '<li><strong>Review → Tracking → Lock Tracking</strong> stops reviewers from switching it off.</li>' +
  '</ul>' +
  '<h2>Compare two versions</h2>' +
  '<p>A reviewer edited without Track Changes? <strong>Review → Compare → Compare…</strong>, choose the original and the revised document, and Word builds a third document with every difference as a tracked change. Also the way to prepare a change list for a new revision.</p>' +
  '<h2>Before you deliver — the final checks</h2>' +
  '<ol class="steps">' +
  '<li><strong>Update all fields:</strong> <code>Ctrl</code>+<code>A</code>, <code>F9</code>. Then update the table of contents and the lists of figures and tables.</li>' +
  '<li><strong>Look for broken references:</strong> <code>Ctrl</code>+<code>F</code>, search for <em>Error!</em> — that is how a broken cross-reference shows.</li>' +
  '<li><strong>Spelling and grammar:</strong> <strong>Review → Spelling &amp; Grammar</strong> (<code>F7</code>).</li>' +
  '<li><strong>Styles check:</strong> <strong>View → Draft</strong> with the style area on — every paragraph in the right style?</li>' +
  '<li><strong>Accept all changes, delete all comments.</strong></li>' +
  '<li><strong>Inspect the document:</strong> <strong>File → Info → Check for Issues → Inspect Document</strong>. Remove comments, revisions, document properties you don\'t want to send (author names, internal paths), hidden text and personal information.</li>' +
  '<li><strong>Accessibility:</strong> <strong>Review → Check Accessibility</strong> — missing alt text, tables without header rows, headings out of order.</li>' +
  '<li><strong>Page through the whole document</strong> in <strong>View → Print Layout</strong> or <strong>Read Mode</strong>: markings on every page, no blank pages, no orphan headings.</li>' +
  '</ol>' +
  '<div class="callout warn"><b>Important:</b> Hidden data is a real security risk. A tracked deletion, an old comment or an internal file path in the properties is still in the file — and the customer can read it. Inspect every document before it leaves GALIL.</div>' +
  '<h2>Export to PDF</h2>' +
  '<ol class="steps">' +
  '<li><strong>File → Export → Create PDF/XPS Document → Create PDF/XPS</strong>.</li>' +
  '<li>Click <strong>Options…</strong> and tick <strong>Create bookmarks using: Headings</strong> (the PDF gets a clickable outline), and <strong>Document structure tags for accessibility</strong>. Clear <strong>Document properties</strong> if you removed them for a reason.</li>' +
  '<li>Choose <strong>Optimize for: Standard</strong> for print quality.</li>' +
  '<li>Open the PDF and check: bookmarks, links, page count, markings.</li>' +
  '</ol>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>Switch on Track Changes in your practice manual, change three sentences and add two comments. Switch between Simple Markup and All Markup.</li>' +
  '<li>Accept the changes, resolve and delete the comments.</li>' +
  '<li>Run Inspect Document and the accessibility check, fix what they find, then export a PDF with heading bookmarks.</li>' +
  '</ol>'
  } },

{ id: "word-11-advanced", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 11 — A step further: templates, Quick Parts and power tools' },
  summary: { en: 'Templates, reusable text with Quick Parts, copying styles between documents, finding and replacing by style, fields, content controls and protecting a template\'s styles.' },
  body: {
  en:
  '<p class="lede">You can do the job with lessons 1–10. These features make you fast and make your documents hard to break.</p>' +
  '<h2>Templates (.dotx)</h2>' +
  '<ul>' +
  '<li>A template holds the styles, the page layout, the headers and footers and the boilerplate of a document type. Each new document starts from it — double-click a <code>.dotx</code> file, or <strong>File → New → Personal</strong> once your templates folder is set in <strong>File → Options → Save → Default personal templates location</strong>.</li>' +
  '<li>To make one: build a perfect sample, delete the project-specific content, then <strong>File → Save As → Word Template (*.dotx)</strong>.</li>' +
  '<li>Change a template only with your Team Lead\'s agreement — every document built from it depends on it.</li>' +
  '</ul>' +
  '<h2>Copy styles between documents</h2>' +
  '<p>Styles pane → <strong>Manage Styles</strong> (third button at the bottom) → <strong>Import/Export…</strong>. The <em>Organizer</em> shows two documents side by side; select styles on one side and click <strong>Copy</strong>. The clean way to bring a document into line with the customer\'s template.</p>' +
  '<p>Or, to attach a template to an existing document: <strong>Developer → Document Template → Attach…</strong>, tick <strong>Automatically update document styles</strong>, click <strong>OK</strong> — then clear the tick again so it doesn\'t happen every time the file opens. (Show the Developer tab with <strong>File → Options → Customize Ribbon → Developer</strong>.)</p>' +
  '<h2>Quick Parts — write it once</h2>' +
  '<ol class="steps">' +
  '<li>Select the text you reuse — a standard WARNING, a disclaimer, the record-of-changes table.</li>' +
  '<li><strong>Insert → Quick Parts → Save Selection to Quick Part Gallery…</strong>. Give it a short name (e.g. <code>wHV</code> for a high-voltage warning).</li>' +
  '<li>To insert it: type the name and press <code>F3</code>, or pick it from <strong>Insert → Quick Parts</strong>.</li>' +
  '</ol>' +
  '<p>Quick Parts are saved in <em>Building Blocks.dotx</em> on your computer. To share them with the team, save them in the project template instead (the <em>Save in</em> box).</p>' +
  '<h2>Find and Replace — the power version</h2>' +
  '<p><code>Ctrl</code>+<code>H</code> → <strong>More &gt;&gt;</strong>:</p>' +
  '<ul>' +
  '<li><strong>Format → Style…</strong> finds every paragraph in a style — and can replace it with another. For example, every <em>Body Text 2</em> becomes <em>Normal</em> in one click.</li>' +
  '<li><strong>Special</strong> finds paragraph marks (<code>^p</code>), tabs (<code>^t</code>), manual line breaks (<code>^l</code>) and more. Replace <code>^p^p</code> with <code>^p</code> to remove empty paragraphs.</li>' +
  '<li><strong>Use wildcards</strong> for patterns: <code>[0-9]{1,}V</code> finds “12V”, “230V” — to add the missing space.</li>' +
  '</ul>' +
  '<h2>Fields</h2>' +
  '<p>Page numbers, cross-references, captions, the table of contents and document properties are all <strong>fields</strong>: live codes Word calculates. <code>Alt</code>+<code>F9</code> shows the codes (<code>{ PAGE }</code>, <code>{ REF _Ref123 \\h }</code>) and back. <code>F9</code> updates the selected fields. <code>Ctrl</code>+<code>Shift</code>+<code>F9</code> turns a field into plain text — rarely what you want.</p>' +
  '<h2>Content controls — forms in a document</h2>' +
  '<p><strong>Developer → Controls</strong>: text boxes, drop-down lists, date pickers and check boxes inside the document. Useful for title-page fields, and for test procedures the tester fills in on a laptop (a Pass / Fail drop-down in each row).</p>' +
  '<h2>Protecting the styles</h2>' +
  '<p><strong>Review → Protect → Restrict Editing → Limit formatting to a selection of styles → Settings…</strong>. Reviewers and other writers can then use only the template\'s styles — no hand formatting, no stray fonts. Click <strong>Yes, Start Enforcing Protection</strong>; a password is optional.</p>' +
  '<h2>Outline view and splitting large documents</h2>' +
  '<p>For very large manuals, write each chapter in its own file from the same template and combine them at the end — <strong>Insert → Object → Text from File…</strong> brings the contents in. Avoid Word\'s old <em>Master Document</em> feature; it is known to damage files.</p>' +
  '<div class="callout note"><b>Note:</b> Macros (VBA) and add-ins can automate a lot, but many defense networks block them. Use them only if the project\'s IT rules allow it.</div>' +
  '<h2>Try it</h2>' +
  '<ol class="steps">' +
  '<li>Save your practice manual as a template, <code>GALIL-Manual-Practice.dotx</code>, and create a new document from it.</li>' +
  '<li>Save a standard WARNING as a Quick Part and insert it in three places with <code>F3</code>.</li>' +
  '<li>Apply <em>Body Text</em> to a few paragraphs, then use Find and Replace by style to turn them all back into <em>Normal</em>.</li>' +
  '</ol>'
  } },

{ id: "word-12-final", cat: "training", updated: "20 Oct 2026",
  title: { en: 'Lesson 12 — Final exercise, checklist and shortcut sheet' },
  summary: { en: 'Put it all together in a short operator\'s manual, check it against the delivery checklist, and keep the shortcut sheet by your keyboard.' },
  body: {
  en:
  '<p class="lede">Time to put everything together. Build a short manual from an empty document, check it against the checklist, and show it to your Team Lead. When it passes, you are ready for real project work.</p>' +
  '<h2>The final exercise — a mini Operator\'s Manual</h2>' +
  '<p>Write a 6–10 page <em>Operator\'s Manual for the XR-200 Field Radio</em> (an imaginary product — invent the details, and keep everything unclassified). It must have:</p>' +
  '<ol>' +
  '<li>A title page with document number, revision and date taken from document properties, and an approval table.</li>' +
  '<li>A record of changes table.</li>' +
  '<li>An automatic table of contents, list of figures and list of tables.</li>' +
  '<li>Numbered headings, three levels: <em>1 Introduction</em>, <em>2 Description</em>, <em>3 Operation</em>, <em>4 Maintenance</em>, <em>5 Troubleshooting</em>, and <em>Appendix A — Acronyms</em>.</li>' +
  '<li>At least two procedures (numbered steps), with one WARNING, one CAUTION and one NOTE in the right places.</li>' +
  '<li>At least two figures and two tables with chapter-numbered captions, and a cross-reference to each in the text.</li>' +
  '<li>A technical-data table on a landscape page.</li>' +
  '<li>UNCLASSIFIED at the top and bottom of every page; <em>Page X of Y</em>; front matter in roman numerals.</li>' +
  '<li>No hand formatting and no empty paragraphs.</li>' +
  '<li>A PDF with heading bookmarks.</li>' +
  '</ol>' +
  '<h2>The delivery checklist</h2>' +
  '<table><thead><tr><th>✓</th><th>Check</th></tr></thead><tbody>' +
  '<tr><td>☐</td><td>Every paragraph is in a template style (Draft view, style area).</td></tr>' +
  '<tr><td>☐</td><td>No empty paragraphs used for spacing; no spaces or tabs used for indenting.</td></tr>' +
  '<tr><td>☐</td><td>Headings are numbered automatically, no levels skipped.</td></tr>' +
  '<tr><td>☐</td><td>Table of contents and lists of figures and tables updated.</td></tr>' +
  '<tr><td>☐</td><td>All fields updated; no <em>Error! Reference source not found.</em></td></tr>' +
  '<tr><td>☐</td><td>Every table and figure has a caption and is referred to in the text.</td></tr>' +
  '<tr><td>☐</td><td>Table header rows repeat; rows don\'t break across pages.</td></tr>' +
  '<tr><td>☐</td><td>Warnings and cautions are before their steps and on the same page.</td></tr>' +
  '<tr><td>☐</td><td>Document number, revision and date are the same on the title page, in the headers and footers, and in the record of changes.</td></tr>' +
  '<tr><td>☐</td><td>Classification marking correct on every page.</td></tr>' +
  '<tr><td>☐</td><td>Terms are consistent; spelling checked in the right English variant.</td></tr>' +
  '<tr><td>☐</td><td>All tracked changes accepted, all comments deleted, document inspected.</td></tr>' +
  '<tr><td>☐</td><td>PDF checked: bookmarks, links, page count.</td></tr>' +
  '</tbody></table>' +
  '<h2>Shortcut sheet</h2>' +
  '<table class="kbd-table"><thead><tr><th>Keys</th><th>Does</th></tr></thead><tbody>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>8</code></td><td>Show / hide formatting marks</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>S</code></td><td>Apply a style by name</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Alt</code>+<code>Shift</code>+<code>S</code></td><td>Open the Styles pane</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Alt</code>+<code>1</code> / <code>2</code> / <code>3</code></td><td>Heading 1 / 2 / 3</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>N</code></td><td>Normal style</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>L</code></td><td>List Bullet style</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Space</code> · <code>Ctrl</code>+<code>Q</code></td><td>Clear character / paragraph hand formatting</td></tr>' +
  '<tr><td><code>Shift</code>+<code>F1</code></td><td>Reveal Formatting</td></tr>' +
  '<tr><td><code>Tab</code> · <code>Shift</code>+<code>Tab</code></td><td>List item one level down / up</td></tr>' +
  '<tr><td><code>Shift</code>+<code>Enter</code></td><td>Line break inside a paragraph</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Enter</code></td><td>Page break</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>Space</code></td><td>Non-breaking space</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>-</code></td><td>Non-breaking hyphen</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>F</code> · <code>Ctrl</code>+<code>H</code></td><td>Navigation pane / search · Find and Replace</td></tr>' +
  '<tr><td><code>F9</code> · <code>Ctrl</code>+<code>A</code>, <code>F9</code></td><td>Update selected fields · update all fields</td></tr>' +
  '<tr><td><code>Alt</code>+<code>F9</code></td><td>Show / hide field codes</td></tr>' +
  '<tr><td><code>F3</code></td><td>Insert a Quick Part by its name</td></tr>' +
  '<tr><td><code>F4</code></td><td>Repeat the last action</td></tr>' +
  '<tr><td><code>Shift</code>+<code>F3</code></td><td>Change case (UPPER / lower / Title)</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>C</code> / <code>V</code></td><td>Copy / paste formatting</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Shift</code>+<code>E</code></td><td>Track Changes on / off</td></tr>' +
  '<tr><td><code>Ctrl</code>+<code>Alt</code>+<code>M</code></td><td>New comment</td></tr>' +
  '<tr><td><code>F7</code></td><td>Spelling and grammar</td></tr>' +
  '</tbody></table>' +
  '<h2>Answer to the lesson 1 exercise</h2>' +
  '<p><strong>Resetting the unit</strong><br>' +
  'Reset the unit only if the FAULT indicator stays on for more than 10 seconds.</p>' +
  '<ol>' +
  '<li>Make sure that no transmission is in progress.</li>' +
  '<li>Push and hold <strong>RESET</strong> for 3 seconds.</li>' +
  '<li>Release <strong>RESET</strong>. The FAULT indicator goes off.</li>' +
  '</ol>' +
  '<p>The condition comes first, there is one action per step, the button is named as labelled, the vague <em>about</em> is gone, and the last step tells the reader what to expect.</p>' +
  '<h2>What next</h2>' +
  '<ul>' +
  '<li>Ask your Team Lead for the templates and style guide of your first project, and an approved document of the same type.</li>' +
  '<li>Keep this course bookmarked — the lessons double as a reference.</li>' +
  '<li>Back to the <a href="#/word-course">course overview</a>.</li>' +
  '</ul>'
  } },

{ id: "phishing", cat: "training", updated: "30 Sep 2026",
  title: { en: "Spotting and reporting phishing", he: "זיהוי ודיווח על פישינג" },
  summary: { en: "Recognise suspicious emails and know what to do.", he: "זיהוי הודעות דוא\"ל חשודות ומה עושים." },
  body: {
  en:
  '<h2>Warning signs</h2>' +
  '<ul><li>Urgent requests to pay, change bank details or buy gift cards.</li>' +
  '<li>A sender address that is almost — but not quite — right.</li>' +
  '<li>Unexpected attachments or links asking you to "sign in again".</li></ul>' +
  '<h2>What to do</h2>' +
  '<ol class="steps">' +
  '<li>Don\'t click links or open attachments.</li>' +
  '<li>Use <strong>Report → Phishing</strong> in Outlook.</li>' +
  '<li>If you already clicked or entered your password, change it immediately and tell Operations.</li>' +
  '</ol>',
  he:
  '<h2>סימני אזהרה</h2>' +
  '<ul><li>בקשות דחופות לשלם, לשנות פרטי בנק או לקנות כרטיסי מתנה.</li>' +
  '<li>כתובת שולח שנראית כמעט — אבל לא בדיוק — נכונה.</li>' +
  '<li>קבצים מצורפים או קישורים לא צפויים שמבקשים "להתחבר שוב".</li></ul>' +
  '<h2>מה עושים</h2>' +
  '<ol class="steps">' +
  '<li>אל תלחצו על קישורים ואל תפתחו קבצים מצורפים.</li>' +
  '<li>השתמשו ב-<strong>Report ← Phishing</strong> ב-Outlook.</li>' +
  '<li>אם כבר לחצתם או הזנתם סיסמה, החליפו אותה מיד והודיעו לתפעול.</li>' +
  '</ol>'
  } }
];
