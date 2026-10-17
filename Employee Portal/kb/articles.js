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

{ id: "first-week", cat: "onboarding", updated: "16 Oct 2026",
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
  '<li>דווחו את שעות השבוע הראשון ב-WorkDesk — ראו <a href="#/workdesk-time">דיווח שעות</a>.</li>' +
  '<li>תכננו את השבוע הבא במתכנן השבועי — ראו <a href="#/workdesk-plan">תכנון השבוע</a>.</li></ul>' +
  '<div class="callout note"><b>שימו לב:</b> אם עד סוף היום הראשון חסרים לכם חשבון או גישה, הודיעו לתפעול מיד — אל תחכו.</div>'
  } },

{ id: "accounts", cat: "onboarding", updated: "16 Oct 2026",
  title: { en: "Accounts & systems you will use", he: "החשבונות והמערכות שתשתמשו בהם" },
  summary: { en: "The company systems, what each is for and how you get access.", he: "מערכות החברה, למה כל אחת משמשת ואיך מקבלים גישה." },
  body: {
  en:
  '<p class="lede">These are the systems you will use day to day. Operations creates your accounts before your first day.</p>' +
  '<table><thead><tr><th>System</th><th>Used for</th><th>Sign-in</th></tr></thead><tbody>' +
  '<tr><td>Microsoft 365</td><td>Email, calendar, Teams, OneDrive and SharePoint</td><td>Your <code>@galiltc.co.il</code> account + MFA</td></tr>' +
  '<tr><td>Employee Portal</td><td>One home page for WorkDesk, Taskana, the Handbook and the Knowledge Base</td><td>Your <code>@galiltc.co.il</code> account, once</td></tr>' +
  '<tr><td>— WorkDesk</td><td>Time, sick and vacation reporting, expenses; for managers, budgets, clients, projects and work orders</td><td>Through the portal</td></tr>' +
  '<tr><td>— Taskana</td><td>Tasks, boards, reviews and questions on every project</td><td>Through the portal</td></tr>' +
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
  '<tr><td>— Taskana</td><td>משימות, לוחות, סקירות ושאלות בכל פרויקט</td><td>דרך הפורטל</td></tr>' +
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

{ id: "portal-access", cat: "portal", updated: "16 Oct 2026",
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
  '<li>In the person\'s <strong>Portal access</strong> column, click <strong>✎</strong>.</li>' +
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
  '<li>בעמודה <strong>גישה לפורטל</strong> של האדם, לחצו על <strong>✎</strong>.</li>' +
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

{ id: "portal-how", cat: "portal", updated: "16 Oct 2026",
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
  '<p>Time, sick and vacation days and expenses are reported in WorkDesk only. From a task in Taskana, <strong>Report time on this task in WorkDesk</strong> opens the Time Log with the project, work order and task already filled in.</p>',
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
  '<p>שעות, ימי מחלה וחופשה והוצאות מדווחים רק ב-WorkDesk. ממשימה ב-Taskana, <strong>דיווח שעות על המשימה ב-WorkDesk</strong> פותח את יומן השעות כשהפרויקט, הזמנת העבודה והמשימה כבר ממולאים.</p>'
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

{ id: "workdesk-time", cat: "training", updated: "16 Oct 2026",
  title: { en: "Logging your time in WorkDesk", he: "דיווח שעות ב-WorkDesk" },
  summary: { en: "Report hours against the right work order, every day.", he: "דיווח שעות על הזמנת העבודה הנכונה, כל יום." },
  body: {
  en:
  '<ol class="steps">' +
  '<li>On the portal home page, open <strong>WorkDesk</strong> (or choose <strong>Report time</strong>). WorkDesk opens on the <strong>Time Log</strong>.</li>' +
  '<li>Choose the date, the start and end time and the hour type: <strong>Red</strong> for company time, <strong>Yellow</strong> for client work, <strong>Blue</strong> for managing a client\'s projects (managers).</li>' +
  '<li>Choose the client, project and work order. Optionally, choose the <strong>Taskana task</strong> the time went to.</li>' +
  '<li>Add a short description and click <strong>Add entry</strong>. The entry is registered — or sent for approval if it goes past your hours bank or the budget.</li>' +
  '</ol>' +
  '<h2>Useful shortcuts</h2>' +
  '<ul><li>From a task in Taskana, <strong>Report time on this task in WorkDesk</strong> opens the form with the project, work order and task already filled in.</li>' +
  '<li><strong>Duplicate</strong> an entry with the ⧉ button — to the previous or next day or week, a number of days back or forward (optionally onto every working day in between), or a specific date.</li>' +
  '<li>Click a work order code anywhere in a table to copy it.</li>' +
  '<li>Click a column heading to sort the table, drag a heading to move it, or drag its edge to resize it. Use <strong>＋ Save</strong> above the table to keep that layout as a view.</li>' +
  '<li>On your phone, use the running timer in the mobile layout. Below it, <strong>‹ ›</strong> change the month and <strong>⚙ Filter &amp; sort</strong> narrows and sorts your entries; managers can switch to <strong>Me and my team</strong> to see the time of the people who report to them.</li></ul>' +
  '<div class="callout note"><b>Out of allowance?</b> Use <strong>Request hours</strong> under ◱ My assignments and allowances — your Team Lead or Project Manager approves or declines it.</div>',
  he:
  '<ol class="steps">' +
  '<li>בדף הבית של הפורטל, פתחו את <strong>WorkDesk</strong> (או בחרו <strong>דיווח שעות</strong>). ‏WorkDesk נפתח ב<strong>יומן השעות</strong>.</li>' +
  '<li>בחרו תאריך, שעת התחלה וסיום וסוג שעות: <strong>אדום</strong> לזמן חברה, <strong>צהוב</strong> לעבודה ללקוח, <strong>כחול</strong> לניהול פרויקטים של לקוח (מנהלים).</li>' +
  '<li>בחרו לקוח, פרויקט והזמנת עבודה. אפשר גם לבחור את <strong>המשימה ב-Taskana</strong> שהזמן הוקדש לה.</li>' +
  '<li>הוסיפו תיאור קצר ולחצו <strong>הוספת רישום</strong>. הרישום נרשם — או נשלח לאישור אם הוא חורג מבנק השעות שלכם או מהתקציב.</li>' +
  '</ol>' +
  '<h2>קיצורי דרך שימושיים</h2>' +
  '<ul><li>ממשימה ב-Taskana, <strong>דיווח שעות על המשימה ב-WorkDesk</strong> פותח את הטופס כשהפרויקט, הזמנת העבודה והמשימה כבר ממולאים.</li>' +
  '<li><strong>שכפלו</strong> רישום עם הכפתור ⧉ — ליום או לשבוע הקודם או הבא, למספר ימים אחורה או קדימה (ואפשר לכל יום עבודה שביניהם), או לתאריך מסוים.</li>' +
  '<li>לחיצה על קוד הזמנת עבודה בכל טבלה מעתיקה אותו.</li>' +
  '<li>לחצו על כותרת עמודה למיון, גררו כותרת להזזה או גררו את הקצה לשינוי הרוחב. <strong>＋ שמירה</strong> מעל הטבלה שומר את הפריסה כתצוגה.</li>' +
  '<li>בטלפון, השתמשו בטיימר שבתצוגת הטלפון. מתחתיו, <strong>‹ ›</strong> מחליפים חודש ו<strong>⚙ סינון ומיון</strong> מצמצם וממיין את הרישומים; מנהלים יכולים לעבור ל<strong>אני והצוות שלי</strong> כדי לראות את השעות של מי שכפוף להם.</li></ul>' +
  '<div class="callout note"><b>נגמרה המכסה?</b> השתמשו ב<strong>בקשת שעות</strong> תחת ◱ השיבוצים והמכסות שלי — ראש הצוות או מנהל/ת הפרויקט מאשרים או דוחים.</div>'
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

{ id: "taskana-tasks", cat: "training", updated: "16 Oct 2026",
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
  '<div class="callout note"><b>Note:</b> Clients, projects and people are set in WorkDesk — Taskana shows them and keeps the tasks. See <a href="#/portal-how">How WorkDesk and Taskana work together</a>.</div>',
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
  '<div class="callout note"><b>שימו לב:</b> לקוחות, פרויקטים ואנשים מוגדרים ב-WorkDesk — ‏Taskana מציגה אותם ומחזיקה את המשימות. ראו <a href="#/portal-how">איך WorkDesk ו-Taskana עובדים יחד</a>.</div>'
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
