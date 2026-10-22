/* =====================================================================
   GALIL HR — the building blocks every screen uses: buttons, chips,
   fields, dialogs, confirmations and toasts.
   ===================================================================== */
"use strict";

function chip(text, kind, attrs) { return h("span", Object.assign({ class: "chip" + (kind ? " " + kind : "") }, attrs || {}), text); }
function btn(label, o) {
  o = o || {};
  return h("button", { type: "button", class: "btn" + (o.kind ? " " + o.kind : "") + (o.sm ? " sm" : ""), id: o.id, title: o.title, "aria-label": o.aria || (label ? null : o.title),
    disabled: o.disabled, "aria-pressed": o.pressed == null ? null : String(!!o.pressed), onclick: o.onclick }, o.icon ? icon(o.icon, o.sm ? 15 : 17) : null, label ? h("span", null, label) : null);
}
function link(label, href, o) { o = o || {}; return h("a", { class: "btn" + (o.kind ? " " + o.kind : "") + (o.sm ? " sm" : ""), href: href, id: o.id }, o.icon ? icon(o.icon, o.sm ? 15 : 17) : null, h("span", null, label)); }
function field(label, control, hint) {
  var id = control.id || (control.id = uid("f"));
  return h("div", { class: "field" }, h("label", { for: id }, label), control, hint ? h("div", { class: "hint" }, hint) : null);
}
function input(o) { return h("input", Object.assign({ type: "text", class: "inp" }, o)); }
function textarea(o) { var t = h("textarea", Object.assign({ class: "inp", rows: 4 }, o)); return t; }
function select(options, value, o) {
  return h("select", Object.assign({ class: "inp" }, o || {}), options.map(function (op) {
    return h("option", { value: op[0], selected: String(op[0]) === String(value) }, op[1]);
  }));
}
function checkbox(label, checked, o) {
  var c = h("input", Object.assign({ type: "checkbox", checked: checked }, o || {}));
  return { el: h("label", { class: "check" }, c, h("span", null, label)), input: c };
}
function empty(text, action) { return h("div", { class: "empty" }, h("p", null, text), action || null); }
function section(title, extra, body) {
  return h("section", { class: "card sec" }, h("div", { class: "sec-h" }, h("h2", null, title), extra || null), body);
}
/* text with blank lines between paragraphs */
function paragraphs(text) {
  return String(text || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); }).map(function (p) {
    var el = h("p");
    p.split("\n").forEach(function (line, i) { if (i) el.appendChild(h("br")); el.appendChild(document.createTextNode(line)); });
    return el;
  });
}

/* ---------- dialogs ---------- */
var openModals = [];
function modal(title, body, actions, o) {
  o = o || {};
  var prev = document.activeElement;
  var box, back = h("div", { class: "modal-back", onmousedown: function (e) { if (e.target === back) close(); } });
  function close() {
    back.remove(); document.removeEventListener("keydown", onKey);
    openModals = openModals.filter(function (m) { return m !== api; });
    if (prev && prev.focus) try { prev.focus(); } catch (e) {}
  }
  function onKey(e) { if (e.key === "Escape" && openModals[openModals.length - 1] === api) { e.preventDefault(); close(); } }
  box = h("div", { class: "modal" + (o.wide ? " wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
    h("div", { class: "modal-h" }, h("h2", null, title), btn("", { kind: "ghost icon", icon: "close", title: tr("Close"), onclick: close })),
    h("div", { class: "modal-b" }, body),
    actions && actions.length ? h("div", { class: "modal-f" }, actions) : null);
  back.appendChild(box);
  document.body.appendChild(back);
  document.addEventListener("keydown", onKey);
  var api = { close: close, el: box };
  openModals.push(api);
  setTimeout(function () { var f = box.querySelector(".modal-b input, .modal-b textarea, .modal-b select"); if (f) f.focus(); }, 0);
  return api;
}
function confirmBox(title, text, okLabel, onOk) {
  var m = modal(title, h("p", null, text), [
    btn(tr("Cancel"), { onclick: function () { m.close(); } }),
    btn(okLabel, { kind: "danger", onclick: function () { m.close(); onOk(); } })]);
}
var toastTimer = null;
function toast(msg, kind) {
  var t = document.getElementById("toast");
  t.textContent = msg; t.className = "toast show" + (kind ? " " + kind : "");
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = "toast"; }, 3200);
}
/* a required field left empty: say so beside it */
function need(el, msg) {
  if (String(el.value || "").trim()) return true;
  el.classList.add("bad"); el.focus(); toast(msg || tr("Fill in the required fields."), "err");
  el.addEventListener("input", function () { el.classList.remove("bad"); }, { once: true });
  return false;
}

/* ---------- a 1–5 scale of buttons ---------- */
function scale(name, value, labels, onPick, disabled) {
  var wrap = h("div", { class: "scale", role: "radiogroup", "aria-label": name });
  labels.forEach(function (lab, i) {
    var v = i + (labels.length === 11 ? 0 : 1);
    var b = h("button", { type: "button", role: "radio", "aria-checked": String(value === v), class: "sc" + (value === v ? " on" : ""), title: lab, disabled: disabled,
      onclick: function () { wrap.querySelectorAll(".sc").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); }); b.classList.add("on"); b.setAttribute("aria-checked", "true"); onPick(v); } }, String(v));
    wrap.appendChild(b);
  });
  return wrap;
}
var RATING = ["Needs improvement", "Developing", "Meets expectations", "Exceeds expectations", "Outstanding"];
function ratingLabel(n) { return n ? tr(RATING[n - 1]) : "—"; }
function bar(part, whole, label) {
  var pc = whole ? Math.round(part * 100 / whole) : 0;
  return h("div", { class: "barrow" }, h("div", { class: "barlabel" }, label), h("div", { class: "bar" }, h("span", { style: { width: pc + "%" } })), h("div", { class: "barval" }, part + " · " + pc + "%"));
}
