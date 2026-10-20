// Builds preview.html (an artifact page) from the KB's own styles and the draft course.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "../../..");
const kb = fs.readFileSync(path.join(root, "Employee Portal/kb/index.html"), "utf8");
const css = kb.match(/<style>([\s\S]*?)<\/style>/)[1];
const extra = fs.readFileSync(path.join(__dirname, "word-course.css"), "utf8");
const data = fs.readFileSync(path.join(__dirname, "word-course.js"), "utf8");
const page = `<title>Word Crash Course</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Mono:wght@400;500&display=swap">
<style>${css}
${extra}
.shell,.masthead,.utility{padding-left:max(20px, env(safe-area-inset-left, 0px)); padding-right:max(20px, env(safe-area-inset-right, 0px))}
.utility-in,.masthead-in{padding-left:0; padding-right:0}
.draft{font-family:var(--sans); font-size:12.5px; background:var(--warn-bg); color:var(--warn-fg); border:1px solid var(--amber); border-radius:999px; padding:3px 12px; display:inline-block; margin-bottom:14px}
.toc{display:flex; flex-wrap:wrap; gap:6px; margin:0 0 22px; font-family:var(--sans); font-size:13px}
.toc button{border:1px solid var(--line); background:var(--surface); color:var(--ink); border-radius:999px; padding:4px 11px; cursor:pointer; font:inherit}
.toc button[aria-current="true"]{background:var(--chrome-bg); color:var(--chrome-fg); border-color:var(--chrome-bg)}
.tablewrap{overflow-x:auto; max-width:70ch}
.ext{border-bottom:1px dotted var(--muted); cursor:help}
</style>
<div class="utility"><div class="utility-in"><span>GALIL · Knowledge Base · Training &amp; how-to's</span><span class="who">Preview for review — not yet in the KB</span></div></div>
<header class="masthead"><div class="masthead-in"><div class="grow"><h1>Word for technical writers</h1><p class="standfirst">A fast, hands-on crash course in Word for Microsoft 365 (desktop) for new technical writers.</p></div></div></header>
<div class="shell"><main><div class="reader"><span class="draft">Draft for review · 13 lessons</span><nav class="toc" id="toc" aria-label="Lessons"></nav><div id="view"></div></div></main></div>
<script>
${data}
var KB = { infosec: "Information security", confidentiality: "Confidentiality" };
var cur = 0;
function render(i) {
  cur = i; var a = WORD_COURSE[i], p = WORD_COURSE[i - 1], n = WORD_COURSE[i + 1];
  document.getElementById("view").innerHTML =
    '<article><div class="crumbs">Knowledge Base › Training &amp; how-to\\'s</div><h1>' + a.title.en + '</h1><div class="meta">Updated ' + a.updated + '</div>' +
    a.body.en.replace(/<table/g, '<div class="tablewrap"><table').replace(/<\\/table>/g, '</table></div>') + '</article>' +
    '<div class="pager">' + (p ? '<a href="#/' + p.id + '"><small>Previous</small>' + p.title.en + '</a>' : '') +
    (n ? '<a class="next" href="#/' + n.id + '"><small>Next</small>' + n.title.en + '</a>' : '') + '</div>';
  document.querySelectorAll("#view a[href^='#/']").forEach(function (l) {
    var id = l.getAttribute("href").slice(2);
    if (KB[id]) { var s = document.createElement("span"); s.className = "ext"; s.title = "Existing KB article"; s.textContent = l.textContent; l.replaceWith(s); }
  });
  document.querySelectorAll("#toc button").forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
  window.scrollTo(0, 0);
}
document.getElementById("toc").innerHTML = WORD_COURSE.map(function (a, i) { return '<button type="button">' + (i ? i : "Start") + '</button>'; }).join("");
document.querySelectorAll("#toc button").forEach(function (b, i) { b.title = WORD_COURSE[i].title.en; b.onclick = function () { render(i); }; });
document.addEventListener("click", function (e) {
  var l = e.target.closest("a[href^='#/']"); if (!l) return;
  e.preventDefault(); var id = l.getAttribute("href").slice(2);
  for (var i = 0; i < WORD_COURSE.length; i++) if (WORD_COURSE[i].id === id) return render(i);
});
render(0);
</script>
`;
fs.writeFileSync(path.join(__dirname, "preview.html"), page);
console.log("ok", page.length);
