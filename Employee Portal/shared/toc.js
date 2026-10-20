/* =====================================================================
   GalilToc — the floating table of contents of the Handbook and the
   Knowledge Base (shared/chrome.css), and the height of their fixed top bar.
     GalilToc.track(bar, more)  keeps --hdr (the top bar) and --stick (the
                                top bar plus anything stuck under it) current
     GalilToc.render(aside, groups)
       groups: [{ title, items: [{ text, level: 1|2, target: "element id" | href: "#…", cur, cls }] }]
       a target scrolls to that element on the page, and the reader's place
       is marked as they scroll; an href is an ordinary link.
   ===================================================================== */
var GalilToc = (function () {
  "use strict";
  var root = document.documentElement, aside = null, links = [], ticking = false;

  function px(name) { return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0; }
  function offset() { return px("--stick") + 16; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function track(bar, more) {
    function measure() {
      var h = bar.offsetHeight;
      root.style.setProperty("--hdr", h + "px");
      root.style.setProperty("--stick", (h + (more && getComputedStyle(more).position === "sticky" ? more.offsetHeight : 0)) + "px");
    }
    measure();
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) { var ro = new ResizeObserver(measure); ro.observe(bar); if (more) ro.observe(more); }
  }

  function jump(el) {
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset() + 4, behavior: reduce ? "auto" : "smooth" });
  }

  function render(el, groups) {
    aside = el;
    aside.innerHTML = groups.filter(function (g) { return g.items.length; }).map(function (g) {
      return (g.title ? "<h2>" + esc(g.title) + "</h2>" : "") + "<ol>" + g.items.map(function (it) {
        var cls = ["l" + (it.level || 1)].concat(it.cur ? ["cur"] : [], it.cls ? [it.cls] : []).join(" ");
        return '<li><a class="' + cls + '"' + (it.target ? ' href="#' + esc(it.target) + '" data-target="' + esc(it.target) + '"' : ' href="' + esc(it.href) + '"') +
          (it.cur ? ' aria-current="page"' : "") + ">" + esc(it.text) + "</a></li>";
      }).join("") + "</ol>";
    }).join("");
    links = Array.prototype.slice.call(aside.querySelectorAll("a[data-target]"));
    spy();
  }

  /* the last heading that has reached the top bar is the reader's place */
  function spy() {
    ticking = false;
    if (!links.length) return;
    var line = offset() + 8, on = null;
    var atEnd = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    links.forEach(function (a) {
      var t = document.getElementById(a.getAttribute("data-target"));
      if (!t || t.offsetParent === null) return;
      if (atEnd || t.getBoundingClientRect().top <= line) on = a;
    });
    if (!on) on = links[0];
    links.forEach(function (a) { a.classList.toggle("on", a === on); });
    /* keep the marked entry in view inside a long contents column */
    var top = on.offsetTop, bottom = top + on.offsetHeight;
    if (top < aside.scrollTop + 8) aside.scrollTop = top - 40;
    else if (bottom > aside.scrollTop + aside.clientHeight - 8) aside.scrollTop = bottom - aside.clientHeight + 40;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener("resize", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".toc a[data-target]");
    if (!a) return;
    e.preventDefault();
    jump(document.getElementById(a.getAttribute("data-target")));
  });

  return { track: track, render: render, jump: jump, spy: spy };
})();
