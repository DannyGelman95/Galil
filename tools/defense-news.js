#!/usr/bin/env node
/* =====================================================================
   Defense News — builds the Employee Portal's news feed.

   Reads Google News (English and Hebrew) for each company in COMPANIES,
   keeps the last 30 days, merges the same story found under several
   companies, and writes one JSON file the portal's news page reads
   (Employee Portal/news/index.html).

   The Pages deployment runs it on every deploy and on a schedule
   (.github/workflows/deploy-pages.yml), so the published feed stays fresh.

     node tools/defense-news.js <output.json>
     node tools/defense-news.js --sample <rss.xml>   parse one RSS file and print it

   Node 18 or later (global fetch); no packages.
   ===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");

/* q: the English search, he: the Hebrew search (Google News syntax) */
const COMPANIES = [
  { id: "iai", name: "IAI", full: "Israel Aerospace Industries", he: "התעשייה האווירית", color: "#1D4ED8",
    q: '"Israel Aerospace Industries" OR "IAI Elta" OR "Elta Systems"', qhe: '"התעשייה האווירית"',
    match: /israel aerospace|\bIAI\b|\belta\b|התעשייה האווירית|תע"א|אלתא/i },
  { id: "elbit", name: "Elbit Systems", full: "Elbit Systems", he: "אלביט מערכות", color: "#0F766E",
    q: '"Elbit Systems" OR "Elbit America" OR "IMI Systems"', qhe: 'אלביט',
    match: /elbit|imi systems|אלביט/i },
  { id: "rafael", name: "Rafael", full: "Rafael Advanced Defense Systems", he: "רפאל", color: "#B91C1C",
    q: '"Rafael Advanced Defense" OR (Rafael ("Iron Dome" OR "Iron Beam" OR "David\'s Sling" OR Spike OR Trophy))', qhe: '"רפאל" (מערכות OR כיפת ברזל OR ביטחון)',
    match: /rafael|iron dome|iron beam|רפאל|כיפת ברזל|מגן אור/i },
  { id: "aeronautics", name: "Aeronautics", full: "Aeronautics Ltd.", he: "אירונאוטיקס", color: "#7C3AED",
    q: '"Aeronautics Ltd" OR "Aeronautics Group" OR (Aeronautics (Orbiter OR UAS OR Israel drone))', qhe: 'אירונאוטיקס',
    match: /aeronautics (ltd|group)|orbiter|אירונאוטיקס/i },
  { id: "controp", name: "Controp", full: "Controp Precision Technologies", he: "קונטרופ", color: "#C2410C",
    q: 'Controp', qhe: 'קונטרופ',
    match: /controp|קונטרופ/i },
  { id: "tomer", name: "Tomer", full: "Tomer", he: "תומר", color: "#4D7C0F",
    q: '"Tomer" (rocket OR motor OR Israel defense)', qhe: '"חברת תומר"',
    match: /\btomer\b.*(rocket|motor|defen)|חברת תומר/i },
  { id: "uvision", name: "UVision", full: "UVision Air", he: "יו-ויז'ן", color: "#0E7490",
    q: 'UVision (Hero OR loitering)', qhe: 'יוויז\'ן OR "יו-ויז\'ן"',
    match: /uvision|יו-?ויז'ן/i },
  { id: "imod", name: "Israel MOD", full: "Israel Ministry of Defense · SIBAT · DDR&D", he: "משרד הביטחון", color: "#334155",
    q: '"Israel Ministry of Defense" (contract OR export OR SIBAT OR procurement OR DDR&D)', qhe: '"משרד הביטחון" (עסקה OR ייצוא OR סיב"ט OR מפא"ת OR רכש)',
    match: /ministry of defen[cs]e|\bIMOD\b|sibat|ddr&d|משרד הביטחון|סיב"ט|מפא"ת/i },
  { id: "industry", name: "Israeli defense industry", full: "The Israeli defense industry", he: "התעשיות הביטחוניות", color: "#946C00",
    q: '"Israeli defense industry" OR "Israeli defense exports" OR "Israeli defense company"', qhe: '"התעשיות הביטחוניות" OR "יצוא ביטחוני"',
    match: /israeli defen[cs]e (industry|export|compan)|התעשיות הביטחוניות|יצוא ביטחוני/i }
];

const DAYS = 30, MAX_ITEMS = 600, PER_QUERY = 60;
const UA = "Mozilla/5.0 (compatible; GALIL-Portal-News/1.0; +https://github.com/DannyGelman95/Galil)";

function rssUrl(query, lang) {
  const q = encodeURIComponent(query + " when:" + DAYS + "d");
  return lang === "he"
    ? "https://news.google.com/rss/search?q=" + q + "&hl=iw&gl=IL&ceid=IL:he"
    : "https://news.google.com/rss/search?q=" + q + "&hl=en-US&gl=US&ceid=US:en";
}

/* ---------- RSS ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isFinite(n) ? String.fromCodePoint(n) : m; }
      return ENT[e.toLowerCase()] != null ? ENT[e.toLowerCase()] : m;
    });
}
function tag(xml, name) {
  const m = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? decode(m[1]).trim() : "";
}
function attr(xml, name, a) {
  const m = xml.match(new RegExp("<" + name + "\\s[^>]*" + a + "=\"([^\"]*)\"", "i"));
  return m ? decode(m[1]) : "";
}
function stripHtml(s) { return decode(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }

/* one Google News RSS document → [{ title, url, source, sourceUrl, date }] */
function parseRss(xml) {
  const out = [];
  const items = String(xml).match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const it of items) {
    let title = stripHtml(tag(it, "title"));
    const source = stripHtml(tag(it, "source"));
    const sourceUrl = attr(it, "source", "url");
    /* Google News titles end with " - Source" */
    if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3)).trim();
    const url = tag(it, "link");
    const d = new Date(tag(it, "pubDate"));
    if (!title || !/^https?:\/\//.test(url) || isNaN(d)) continue;
    out.push({ title, url, source, sourceUrl, date: d.toISOString() });
  }
  return out;
}

/* ---------- building the feed ---------- */
function key(title) { return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 90); }
function isHebrew(s) { return /[֐-׿]/.test(s); }

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml" } });
      if (r.ok) return await r.text();
      if (r.status < 500 && r.status !== 429) throw new Error("HTTP " + r.status);
    } catch (e) { if (i === 2) throw e; }
    await new Promise(res => setTimeout(res, 1500 * (i + 1)));
  }
  throw new Error("no answer");
}

async function build() {
  const since = Date.now() - DAYS * 864e5;
  const byKey = new Map(), errors = [];
  for (const c of COMPANIES) {
    for (const [lang, query] of [["en", c.q], ["he", c.qhe]]) {
      if (!query) continue;
      let list;
      try { list = parseRss(await get(rssUrl(query, lang))).slice(0, PER_QUERY); }
      catch (e) { errors.push(c.id + "/" + lang + ": " + e.message); continue; }
      for (const n of list) {
        if (Date.parse(n.date) < since) continue;
        const k = key(n.title);
        let item = byKey.get(k);
        if (!item) { item = Object.assign({ lang: isHebrew(n.title) ? "he" : "en", companies: [] }, n); byKey.set(k, item); }
        if (item.companies.indexOf(c.id) < 0) item.companies.push(c.id);
      }
    }
  }
  /* a story about two companies is filed under both */
  for (const item of byKey.values()) {
    for (const c of COMPANIES) if (c.match.test(item.title) && item.companies.indexOf(c.id) < 0) item.companies.push(c.id);
    item.companies.sort((a, b) => COMPANIES.findIndex(c => c.id === a) - COMPANIES.findIndex(c => c.id === b));
  }
  const items = Array.from(byKey.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ITEMS)
    .map((n, i) => Object.assign({ id: "n" + i }, n));
  return {
    updated: new Date().toISOString(),
    days: DAYS,
    source: "Google News",
    companies: COMPANIES.map(c => ({ id: c.id, name: c.name, full: c.full, he: c.he, color: c.color })),
    items,
    errors
  };
}

/* ---------- command line ---------- */
if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  if (args[0] === "--sample") {
    console.log(JSON.stringify(parseRss(fs.readFileSync(args[1], "utf8")), null, 2));
    return;
  }
  const out = args[0];
  if (!out) { console.error("usage: node tools/defense-news.js <output.json>"); process.exit(2); }
  const feed = await build();
  /* nothing at all came back (Google News unreachable): keep the feed that is already there */
  if (!feed.items.length && fs.existsSync(out)) { console.warn("No news fetched; keeping " + out + ". " + feed.errors.join("; ")); return; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(feed));
  console.log(feed.items.length + " stories from " + COMPANIES.length + " companies → " + out + (feed.errors.length ? " (" + feed.errors.length + " searches failed: " + feed.errors.join("; ") + ")" : ""));
})().catch(e => { console.error(e); process.exit(1); });

module.exports = { parseRss, COMPANIES };
