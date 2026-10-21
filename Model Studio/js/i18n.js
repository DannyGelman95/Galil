// English and Hebrew. The language is shared with the Employee Portal
// (the same "galil-portal-lang" setting), and Hebrew lays the page out right to left.
var KEY = "galil-portal-lang";

var HE = {
  "Model Studio": "סטודיו מודלים",
  "Open": "פתיחה",
  "Open a model (Ctrl+O)": "פתיחת מודל (Ctrl+O)",
  "Sample": "דוגמה",
  "Open the sample assembly": "פתיחת הרכבת הדוגמה",
  "Fit": "התאמה",
  "Fit everything in view (F)": "הצגת הכול במבט (F)",
  "Fit selection": "התאמה לבחירה",
  "Fit the selection in view (Shift+F)": "הצגת הבחירה במבט (Shift+F)",
  "Front": "חזית", "Back": "אחור", "Left": "שמאל", "Right": "ימין", "Top": "עליון", "Bottom": "תחתון", "Iso": "איזומטרי",
  "Front (1)": "חזית (1)", "Back (2)": "אחור (2)", "Left (3)": "שמאל (3)", "Right (4)": "ימין (4)",
  "Top (5)": "עליון (5)", "Bottom (6)": "תחתון (6)", "Isometric (7)": "איזומטרי (7)",
  "Roll the view 90° left": "סיבוב המבט ב־90° שמאלה",
  "Roll the view 90° right": "סיבוב המבט ב־90° ימינה",
  "Projection": "הטלה", "Perspective": "פרספקטיבה", "Orthographic": "אורתוגרפית",
  "Style": "סגנון", "Shaded": "מוצלל", "Shaded with edges": "מוצלל עם קווי מתאר",
  "Technical illustration": "איור טכני", "Line drawing": "שרטוט קווי", "X-ray": "שקוף (רנטגן)", "Wireframe": "קווי מתאר בלבד",
  "Explode": "פיצוץ",
  "Move": "הזזה", "Move the selected part (T)": "הזזת החלק הנבחר (T)",
  "Rotate": "סיבוב", "Rotate the selected part (R)": "סיבוב החלק הנבחר (R)",
  "Save image": "שמירת תמונה", "Save an image of the view (Ctrl+Shift+S)": "שמירת תמונה של המבט (Ctrl+Shift+S)",
  "Parts": "חלקים", "Parts list": "רשימת חלקים",
  "Find a part…": "חיפוש חלק…",
  "Show all": "הצגת הכול", "Show every part (Shift+H)": "הצגת כל החלקים (Shift+H)",
  "Hide": "הסתרה", "Show": "הצגה", "Hide the selection (H)": "הסתרת הבחירה (H)",
  "Isolate": "בידוד", "Show only the selection (I)": "הצגת הבחירה בלבד (I)",
  "Expand": "פתיחה", "Collapse": "כיווץ", "Expand or collapse every assembly": "פתיחה או כיווץ של כל ההרכבות",
  "Item": "פריט", "Part": "חלק", "Qty": "כמות", "Assembly": "הרכבה",
  "Download parts list (CSV)": "הורדת רשימת החלקים (CSV)",
  "parts list": "רשימת חלקים", "views": "מבטים",
  "Open a CAD or 3D model": "פתיחת מודל CAD או מודל תלת־ממדי",
  "Drop files here, or choose Open.": "גררו קבצים לכאן, או בחרו פתיחה.",
  "CAD:": "CAD:", "3D:": "תלת־ממד:",
  "SolidWorks, Inventor, Creo, CATIA or NX parts and assemblies: save them as STEP (AP214 or AP242) first — File → Save As → STEP. Names, colours and the assembly structure come across.":
    "חלקים והרכבות של SolidWorks,‏ Inventor,‏ Creo,‏ CATIA או NX: שמרו אותם קודם כ־STEP (‏AP214 או AP242) — קובץ ← שמירה בשם ← STEP. השמות, הצבעים ומבנה ההרכבה נשמרים.",
  "Open a model…": "פתיחת מודל…", "Try the sample assembly": "נסו את הרכבת הדוגמה",
  "Drop to open": "שחררו כדי לפתוח",
  "Selected part": "החלק הנבחר",
  "Click a part, or choose one in the parts tree. Ctrl+click selects several.": "לחצו על חלק, או בחרו אותו בעץ החלקים. Ctrl+לחיצה בוחרת כמה חלקים.",
  "Colour": "צבע", "Opacity": "אטימות",
  "Fit in view": "התאמה למבט",
  "Select parent": "בחירת ההרכבה", "Select the assembly this part belongs to": "בחירת ההרכבה שהחלק שייך אליה",
  "Add callout": "הוספת בועית", "Add a numbered balloon pointing at this part": "הוספת בועית ממוספרת שמצביעה על החלק",
  "Reset part": "איפוס החלק", "Put back its position, colour and opacity": "החזרת המיקום, הצבע והאטימות המקוריים",
  "Display": "תצוגה", "Background": "רקע", "White": "לבן", "Light grey": "אפור בהיר", "Gradient": "מדורג", "Dark": "כהה", "Custom colour": "צבע לבחירה",
  "Light": "תאורה", "Edge angle": "זווית קווי מתאר", "Floor shadow": "צל על הרצפה", "Axes in the corner": "צירים בפינה",
  "Z is up (most CATIA, NX and STL files)": "ציר Z כלפי מעלה (רוב קובצי CATIA,‏ NX ו־STL)",
  "Reset all parts": "איפוס כל החלקים", "Put every part back where it came from, with its own colour": "החזרת כל החלקים למקומם ולצבעם המקוריים",
  "Section cut": "חתך", "Cut through the model": "חיתוך המודל", "Plane": "מישור", "Flip": "היפוך", "Position": "מיקום",
  "Saved views": "מבטים שמורים",
  "A view keeps the camera, which parts are shown, where they are, their colours, the explode, the style, the cut and the callouts.":
    "מבט שומר את המצלמה, אילו חלקים מוצגים, היכן הם, הצבעים, הפיצוץ, הסגנון, החתך והבועיות.",
  "Save this view": "שמירת המבט", "Images of all views": "תמונות של כל המבטים",
  "Export an image of every saved view, in one ZIP file": "תמונה של כל מבט שמור, בקובץ ZIP אחד",
  "Download views": "הורדת המבטים", "Download the views to open with this model later": "הורדת המבטים כדי לפתוח אותם עם המודל בפעם אחרת",
  "Load views…": "טעינת מבטים…",
  "Image": "תמונה", "Size": "גודל", "Same as the screen": "כמו המסך", "Custom…": "מותאם…",
  "Width": "רוחב", "Height": "גובה", "Format": "פורמט", "Smoothing": "החלקה",
  "Transparent background (PNG)": "רקע שקוף (PNG)", "Show the image frame on screen": "הצגת מסגרת התמונה על המסך",
  "File name": "שם הקובץ",
  "No model open": "לא נפתח מודל",
  "Left drag: turn · Right drag: pan · Wheel: zoom · Double-click: fit part": "גרירה שמאלית: סיבוב · גרירה ימנית: הזזה · גלגלת: זום · לחיצה כפולה: התאמה לחלק",
  "Callout text (leave empty for the item number):": "טקסט הבועית (השאירו ריק למספר הפריט):",
  "Drag to move · double-click to change the text · right-click to delete": "גררו להזזה · לחיצה כפולה לשינוי הטקסט · לחיצה ימנית למחיקה",
  "Delete": "מחיקה", "Update": "עדכון", "Rename": "שינוי שם", "Replace this view with what is on the screen now": "החלפת המבט במה שמוצג עכשיו",
  "Type": "סוג", "Parts inside": "חלקים בתוכה", "Triangles": "משולשים", "Moved": "הוזז", "As designed": "כמו בתכנון",
  "{n} in the model": "{n} במודל", "{n} selected": "{n} נבחרו", "{n} parts": "{n} חלקים", "{n} shown": "{n} מוצגים", "{n} triangles": "{n} משולשים",
  "View {n}": "מבט {n}", "mm": "מ״מ",
  "Making the images…": "מכין את התמונות…",
  "Model Studio cannot open {name}.": "סטודיו המודלים לא יכול לפתוח את {name}.",
  "Open a model first.": "פתחו קודם מודל.",
  "Open the model first, then load its views.": "פתחו קודם את המודל, ואז טענו את המבטים שלו.",
  "Opening {name}…": "פותח את {name}…",
  "Saved {name} ({size})": "נשמר {name} ‏({size})",
  "Select a part first.": "בחרו קודם חלק.",
  "Select one part (or one assembly) to move it.": "בחרו חלק אחד (או הרכבה אחת) כדי להזיז אותו.",
  "Select the parts to keep first.": "בחרו קודם את החלקים שיישארו.",
  "That file does not hold Model Studio views.": "הקובץ הזה אינו מכיל מבטים של סטודיו המודלים.",
  "The sample could not be loaded. Open Model Studio from a web server, not from a file on disk.": "לא ניתן לטעון את הדוגמה. פתחו את סטודיו המודלים משרת אינטרנט, לא מקובץ בדיסק.",
  "These views were saved for {name}.": "המבטים האלה נשמרו עבור {name}.",
  "This computer can make images up to {n} pixels wide.": "המחשב הזה יכול ליצור תמונות ברוחב של עד {n} פיקסלים.",
  "{kind} files cannot be opened directly. In the program they come from, save the model as STEP (AP214 or AP242) and open the STEP file here.":
    "אי אפשר לפתוח ישירות קובצי {kind}. בתוכנה שבה נוצרו, שמרו את המודל כ־STEP (‏AP214 או AP242) ופתחו כאן את קובץ ה־STEP.",
  "{name} could not be opened: {msg}": "לא ניתן לפתוח את {name}: {msg}",
  "1 part": "חלק אחד"
};

export function lang() {
  try { return localStorage.getItem(KEY) === "he" ? "he" : "en"; } catch (e) { return "en"; }
}
export function setLang(l) {
  try { localStorage.setItem(KEY, l === "he" ? "he" : "en"); } catch (e) { /* blocked */ }
}

export function t(en, vars) {
  var s = (lang() === "he" && HE[en]) || en;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  return s;
}

// Elements marked data-t show their English text through t(); data-t-title and
// data-t-placeholder do the same for those attributes.
export function applyTexts(root) {
  root.querySelectorAll("[data-t]").forEach(function (el) {
    if (!el.dataset.t) el.dataset.t = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = t(el.dataset.t);
  });
  root.querySelectorAll("[data-t-title]").forEach(function (el) { el.title = t(el.dataset.tTitle); });
  root.querySelectorAll("[data-t-placeholder]").forEach(function (el) { el.placeholder = t(el.dataset.tPlaceholder); });
}
