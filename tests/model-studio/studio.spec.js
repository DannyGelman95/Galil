// Model Studio: opening models, the parts tree and list, visibility, saved views and images.
const { test, expect } = require("@playwright/test");

const OBJ = [
  "o Bracket",
  "v 0 0 0", "v 10 0 0", "v 10 10 0", "v 0 10 0", "v 0 0 10", "v 10 0 10", "v 10 10 10", "v 0 10 10",
  "f 1 2 3 4", "f 5 8 7 6", "f 1 5 6 2", "f 2 6 7 3", "f 3 7 8 4", "f 5 1 4 8",
  "o Pin",
  "v 20 0 0", "v 22 0 0", "v 22 2 0", "v 20 2 0", "v 20 0 30", "v 22 0 30", "v 22 2 30", "v 20 2 30",
  "f 9 10 11 12", "f 13 16 15 14", "f 9 13 14 10", "f 10 14 15 11", "f 11 15 16 12", "f 13 9 12 16"
].join("\n");

async function openSample(page) {
  await page.goto("./");
  await page.click("#btn-sample-2");
  await expect(page.locator("#st-model")).toContainText("12 parts");
}

// waits until the camera and any playback have come to rest
async function settle(page) {
  await page.waitForFunction(() => window.studio.idle());
  await page.waitForTimeout(50);
}

function rows(page, name) {
  return page.locator(".tree .row .nm", { hasText: new RegExp("^" + name + "$") });
}

function pngInfo(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25] };
}

// Model Studio is part of the Employee Portal: the tests sign in as an employee
// the way the portal leaves it in the browser (its data and the session).
function signedIn(role) {
  return (role) => {
    if (!sessionStorage.getItem("init")) {
      localStorage.clear();
      sessionStorage.setItem("init", "1");
      if (role) {
        localStorage.setItem("galil-workdesk-v1", JSON.stringify({ data: { users: [
          { id: "u-test", email: "test@galiltc.co.il", fullName: "Test Writer", role: role, isActive: true }] } }));
        localStorage.setItem("galil-workdesk-session", "u-test");
      }
    }
  };
}
test.beforeEach(async ({ page }, info) => {
  if (!/sign-in/.test(info.title)) await page.addInitScript(signedIn(), "EMP");
});

test.describe("on a phone or tablet", () => {
  test.use({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  test("is not available; the page asks for a computer", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#portal-gate")).toContainText("Model Studio is for computers");
    await expect(page.locator("#portal-gate-go")).toHaveAttribute("href", "../index.html");
  });
});

test("needs the Employee Portal sign-in, and access to Model Studio", async ({ page, context }) => {
  await page.addInitScript(signedIn(), null);
  await page.goto("./");
  await expect(page.locator("#portal-gate")).toContainText("Sign in to the Employee Portal first");
  await expect(page.locator("#portal-gate-go")).toHaveAttribute("href", "../index.html");
  const viewer = await context.newPage();
  await viewer.addInitScript(signedIn(), "VIEW");
  await viewer.goto("./");
  await expect(viewer.locator("#portal-gate")).toContainText("No access to Model Studio");
});

test("opens the sample STEP assembly with its structure, names and parts list", async ({ page }) => {
  await openSample(page);
  await expect(page.locator("#start")).toBeHidden();
  await expect(rows(page, "Shaft support assembly")).toHaveCount(1);
  await expect(rows(page, "Support sub-assembly")).toHaveCount(2);
  await expect(rows(page, "Bolt M8")).toHaveCount(4);
  await expect(page.locator("#st-model")).toContainText("mm");
  await page.click('.tab[data-tab="bom"]');
  const bolt = page.locator("#bom-body tr", { hasText: "Bolt M8" });
  await expect(bolt.locator("td").nth(2)).toHaveText("4");
  await bolt.click();
  await expect(page.locator("#sel-name")).toHaveText("4 selected");
});

test("selects, hides, isolates and shows parts", async ({ page }) => {
  await openSample(page);
  await rows(page, "Hand wheel").click();
  await expect(page.locator("#sel-name")).toHaveText("Hand wheel");
  await expect(page.locator("#sel-info")).toContainText("Part");
  await page.click("#btn-hide");
  await expect(page.locator("#st-model")).toContainText("11 shown");
  await page.click("#btn-show-all");
  await expect(page.locator("#st-model")).not.toContainText("shown");
  await rows(page, "Base plate").click();
  await page.click("#btn-isolate");
  await expect(page.locator("#st-model")).toContainText("1 shown");
  await page.keyboard.press("Shift+H");
  await expect(page.locator("#st-model")).not.toContainText("shown");
});

test("clicking the model selects the part under the pointer", async ({ page }) => {
  await openSample(page);
  await page.click("[data-view=front]");
  await settle(page);
  const p = await page.evaluate(() => window.studio.screenPoint("Hand wheel"));
  await page.mouse.click(p.x, p.y);
  await expect(page.locator("#sel-name")).toHaveText("Hand wheel");
  await expect(rows(page, "Hand wheel").locator("xpath=..")).toHaveClass(/sel/);
  // clicking empty space clears the selection
  const box = await page.locator("#canvas").boundingBox();
  await page.mouse.click(box.x + 20, box.y + 20);
  await expect(page.locator("#sel-empty")).toBeVisible();
});

test("a part can be dragged to a new place and put back", async ({ page }) => {
  await openSample(page);
  await rows(page, "Hand wheel").click();
  await page.click("#btn-move");
  await expect(page.locator("#btn-move")).toHaveClass(/on/);
  const c = await page.evaluate(() => window.studio.screenPoint("Hand wheel"));
  const before = await page.evaluate(() => window.studio.state.selection.values().next().value.position.x);
  // the X handle points down and to the right in the isometric view
  await page.mouse.move(c.x + 45, c.y + 30);
  await page.mouse.down();
  await page.mouse.move(c.x + 90, c.y + 60, { steps: 6 });
  await page.mouse.move(c.x + 140, c.y + 90, { steps: 6 });
  await page.mouse.up();
  const after = await page.evaluate(() => window.studio.state.selection.values().next().value.position.x);
  expect(after).toBeGreaterThan(before + 5);
  await expect(page.locator("#sel-info")).toContainText("Moved");
  await page.click("#sel-reset");
  await expect(page.locator("#sel-info")).toContainText("As designed");
});

test("saves an image at the chosen size, with a transparent background", async ({ page }) => {
  await openSample(page);
  await page.selectOption("#sel-style", "technical");
  await page.selectOption("#sel-shot-preset", "1200x1200");
  await expect(page.locator("#frame")).toBeVisible();
  await page.check("#chk-transparent");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btn-shot")]);
  expect(download.suggestedFilename()).toMatch(/^shaft-support .*\.png$/);
  const fs = require("fs");
  const info = pngInfo(fs.readFileSync(await download.path()));
  expect(info).toEqual({ width: 1200, height: 1200, colorType: 6 });
  // The model is in the picture and the background around it is see-through.
  const counts = await page.evaluate(() => {
    const c = window.studio.capture({ w: 240, h: 240, ss: 1, format: "png", transparent: true });
    const d = c.getContext("2d").getImageData(0, 0, 240, 240).data;
    let solid = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 200) solid++;
    return { solid: solid, total: 240 * 240, corner: d[3] };
  });
  expect(counts.solid).toBeGreaterThan(counts.total * 0.05);
  expect(counts.solid).toBeLessThan(counts.total * 0.9);
  expect(counts.corner).toBe(0);
});

test("a saved view brings back the camera, hidden parts, explode and style", async ({ page }) => {
  await openSample(page);
  await page.click('.stab[data-stab="views"]');
  await page.click("[data-view=top]");
  await settle(page);
  await page.click("#btn-view-add");
  await expect(page.locator("#views-list .card:not(.add)")).toHaveCount(1);
  await expect(page.locator("#view-name")).toHaveValue("View 1");
  const before = await page.evaluate(() => window.studio.camera().position.toArray());

  await rows(page, "Hand wheel").click();
  await page.click("#btn-hide");
  await page.locator("#rng-explode").fill("60");
  await page.selectOption("#sel-style", "xray");
  await page.click("[data-view=front]");
  await settle(page);

  await page.locator("#views-list .card:not(.add)").first().click();
  await page.waitForTimeout(100);
  await settle(page);
  await expect(page.locator("#st-model")).not.toContainText("shown");
  await expect(page.locator("#rng-explode")).toHaveValue("0");
  await expect(page.locator("#sel-style")).toHaveValue("shaded");
  const after = await page.evaluate(() => window.studio.camera().position.toArray());
  after.forEach((v, i) => expect(v).toBeCloseTo(before[i], 3));
});

test("callouts carry the part's item number into the image", async ({ page }) => {
  await openSample(page);
  await rows(page, "Hand wheel").click();
  await page.click("#sel-callout");
  await expect(page.locator("#overlay .callout text")).toHaveText("6");
});

test("opens mesh files: an OBJ keeps its object names", async ({ page }) => {
  await page.goto("./");
  await page.setInputFiles("#file-input", { name: "fixture.obj", mimeType: "text/plain", buffer: Buffer.from(OBJ) });
  await expect(page.locator("#st-model")).toContainText("2 parts");
  await expect(rows(page, "Bracket")).toHaveCount(1);
  await expect(rows(page, "Pin")).toHaveCount(1);
});

test("explains how to bring in SolidWorks files", async ({ page }) => {
  await page.goto("./");
  await page.setInputFiles("#file-input", { name: "bracket.SLDPRT", mimeType: "application/octet-stream", buffer: Buffer.from("not readable") });
  await expect(page.locator("#toast")).toContainText("SolidWorks part");
  await expect(page.locator("#toast")).toContainText("STEP");
});

test("Hebrew lays the page out right to left", async ({ page }) => {
  await page.goto("./");
  await page.click("#btn-lang");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#btn-open span")).toHaveText("פתיחה");
  await page.click("#btn-lang");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#btn-open span")).toHaveText("Open");
});

test("undo and redo an exact move", async ({ page }) => {
  await openSample(page);
  await rows(page, "Hand wheel").click();
  const x0 = await page.evaluate(() => window.studio.state.nodes.find(n => n.name === "Hand wheel").position.x);
  await page.fill("#mv-x", "50");
  await page.click("#mv-apply");
  const xpos = () => page.evaluate(() => window.studio.state.nodes.find(n => n.name === "Hand wheel").position.x);
  expect(await xpos()).toBeCloseTo(x0 + 50, 3);
  await page.keyboard.press("Control+z");
  expect(await xpos()).toBeCloseTo(x0, 3);
  await page.click("#btn-redo");
  expect(await xpos()).toBeCloseTo(x0 + 50, 3);
});

test("part numbers typed in or read from a CSV appear in the parts list", async ({ page }) => {
  await openSample(page);
  await rows(page, "Hand wheel").click();
  await page.fill("#meta-pn", "GTC-HW-100");
  await page.click('.tab[data-tab="bom"]');
  await expect(page.locator("#bom-body tr", { hasText: "Hand wheel" }).locator(".pn")).toHaveText("GTC-HW-100");
  const csv = "Name,Part number,Description\nBolt M8,ISO-4762-M8x20,Socket head cap screw M8 x 20\nBase plate,GTC-BP-001,\n";
  await page.setInputFiles("#bom-input", { name: "parts.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.locator("#toast")).toContainText("2 parts");
  await expect(page.locator("#bom-body tr", { hasText: "Socket head cap screw" }).locator(".pn")).toHaveText("ISO-4762-M8x20");
});

test("disassembly steps are made, played, reversed and kept", async ({ page }) => {
  await openSample(page);
  await page.click("#proc-auto");
  const cards = page.locator("#proc-strip .card:not(.add)");
  await expect(cards).toHaveCount(7);
  await expect(page.locator("#step-title")).toHaveValue("Assembled");
  await expect(cards.nth(1)).toContainText("Remove the");
  // write an instruction and a warning on step 2
  await cards.nth(1).click();
  await page.fill("#step-text", "Pull the key out of the shaft keyway.");
  await page.selectOption("#step-note-kind", "warning");
  await page.fill("#step-note", "Wear gloves.");
  await expect(cards.nth(1).locator(".flag")).toHaveText("Warning");
  // play from the first step: the caption follows the steps
  await cards.nth(0).click();
  await page.click("#proc-play");
  await expect(page.locator("#caption")).toBeVisible();
  await expect(page.locator("#caption-title")).toContainText("Step 2", { timeout: 15000 });
  await expect(page.locator("#caption-text")).toContainText("WARNING: Wear gloves.");
  await page.click("#proc-stop");
  await expect(page.locator("#caption")).toBeHidden();
  // the assembly procedure, from the disassembly
  await page.click("#proc-reverse");
  await expect(page.locator("#proc-select option")).toHaveCount(2);
  await expect(page.locator("#proc-kind")).toHaveValue("assembly");
  await expect(cards).toHaveCount(7);
  await expect(cards.nth(1)).toContainText("Install the");
  await expect(cards.nth(6)).toContainText("Assembled");
  // kept in the browser for this model
  await page.waitForTimeout(800);
  await page.reload();
  await page.click("#btn-sample-2");
  await expect(page.locator("#proc-select option")).toHaveCount(2);
  await page.selectOption("#proc-select", "0");
  await cards.nth(1).click();
  await expect(page.locator("#step-text")).toHaveValue("Pull the key out of the shaft keyway.");
});

test("a procedure is recorded as a video", async ({ page }) => {
  await openSample(page);
  await page.click("#proc-new");
  await page.click("#proc-strip .card.add");
  await rows(page, "Hand wheel").click();
  await page.fill("#mv-x", "80");
  await page.click("#mv-apply");
  await page.click("#proc-strip .card.add");
  await page.fill("#step-dur", "0.5");
  await page.fill("#step-hold", "0.2");
  await page.locator("#proc-strip .card:not(.add)").first().click();
  await page.fill("#step-hold", "0.2");
  await page.selectOption("#sel-shot-preset", "1280x720");
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#proc-video")]);
  expect(download.suggestedFilename()).toMatch(/\.(mp4|webm)$/);
  const fs = require("fs");
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.length).toBeGreaterThan(5000);
  // the browser can play it and it lasts the length of the procedure
  const duration = await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const v = document.createElement("video");
    v.muted = true;
    v.src = URL.createObjectURL(new Blob([bin]));
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; });
    if (!isFinite(v.duration)) { v.currentTime = 1e9; await new Promise(r => { v.ontimeupdate = r; }); }
    return v.duration;
  }, bytes.toString("base64"));
  // the procedure lasts 2.7 s (first step 1 s, motion 0.5 s, pause 0.2 s + 1 s at the end)
  expect(duration).toBeGreaterThan(2.5);
});

test("figures: balloon the visible parts, then add a figure with its items", async ({ page }) => {
  await openSample(page);
  await page.click('.stab[data-stab="fig"]');
  await page.click("#fig-balloon");
  await expect(page.locator("#overlay .callout")).toHaveCount(7);
  await page.click("#fig-add");
  await expect(page.locator("#fig-strip .card:not(.add)")).toHaveCount(1);
  await expect(page.locator("#fig-items")).toContainText("7 items");
  await rows(page, "Hand wheel").click();
  await page.click("#btn-hide");
  await page.click("#fig-update");
  await expect(page.locator("#fig-items")).toContainText("6 items");
  await page.click("#fig-auto");
  await expect(page.locator("#fig-strip .card:not(.add)")).toHaveCount(3);
});

test("publish an interactive manual that works opened from the disk", async ({ page, context }) => {
  await openSample(page);
  await page.click("#proc-auto");
  await page.click('.stab[data-stab="fig"]');
  await page.click("#fig-balloon");
  await page.click("#fig-add");
  await page.click("#btn-publish");
  await page.fill("#pub-title", "Shaft support manual");
  await page.fill("#pub-doc", "GTC-001");
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 90000 }), page.click("#pub-go")]);
  const file = await download.path();
  const fs = require("fs"), path = require("path");
  const html = path.join(path.dirname(file), "manual.html");
  fs.copyFileSync(file, html);
  const m = await context.newPage();
  const errors = [];
  m.on("pageerror", e => errors.push(e.message));
  await m.goto("file://" + html);
  await expect(m.locator("#h-title")).toHaveText("Shaft support manual");
  await expect(m.locator("nav .steps button")).toHaveCount(7);
  await expect(m.locator("#content h2")).toHaveText("Assembled");
  await expect(m.locator("body")).not.toHaveClass(/no3d/);
  await m.click("#b-next");
  await expect(m.locator("#content .kicker")).toContainText("Step 2 of 7");
  await m.locator("nav button", { hasText: "Figure 1" }).click();
  await expect(m.locator("#content tbody tr")).toHaveCount(7);
  await expect(m.locator("#ov text")).toHaveCount(7, { timeout: 10000 });
  await m.locator("#content tbody tr").nth(5).click();
  await expect(m.locator("#content tbody tr").nth(5)).toHaveClass(/on/);
  // the print layout has every step and the parts list
  await m.emulateMedia({ media: "print" });
  await expect(m.locator("#print .step")).toHaveCount(7);
  await expect(m.locator("#print .figure")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("measure between two points; the distance follows the parts and goes into images", async ({ page }) => {
  await openSample(page);
  await page.click("[data-view=front]");
  await settle(page);
  await page.keyboard.press("m");
  await expect(page.locator("#btn-measure")).toHaveClass(/on/);
  const a = await page.evaluate(() => window.studio.screenPoint("Hand wheel"));
  const b = await page.evaluate(() => window.studio.screenPoint("Base plate"));
  await page.mouse.click(a.x, a.y);
  await page.mouse.click(b.x, b.y);
  const label = page.locator("#overlay .measure text");
  await expect(label).toHaveCount(1);
  await expect(label).toContainText("mm");
  const before = parseFloat((await label.textContent()).replace(/,/g, ""));
  expect(before).toBeGreaterThan(10);
  // moving the wheel 50 mm along X changes the distance
  await page.keyboard.press("Escape");
  await rows(page, "Hand wheel").click();
  await page.fill("#mv-x", "50");
  await page.click("#mv-apply");
  await expect.poll(async () => Math.abs(parseFloat((await label.textContent()).replace(/,/g, "")) - before)).toBeGreaterThan(5);
  // kept in a saved view's state, and undone with Ctrl+Z
  expect(await page.evaluate(() => window.studio.snapshot().measures.length)).toBe(1);
  await page.click("#btn-clear-measures");
  await expect(label).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(label).toHaveCount(1);
});

test("motion lines show where exploded parts came from", async ({ page }) => {
  await openSample(page);
  await expect(page.locator("#overlay .trail")).toHaveCount(0);
  await page.locator("#rng-explode").fill("60");
  await page.check("#chk-trails");
  await expect.poll(() => page.locator("#overlay .trail").count()).toBeGreaterThan(5);
  expect(await page.evaluate(() => window.studio.snapshot().trails)).toBe(true);
  await page.locator("#rng-explode").fill("0");
  await expect(page.locator("#overlay .trail")).toHaveCount(0);
});

test("the keyboard shortcuts list opens with ?", async ({ page }) => {
  await openSample(page);
  await page.keyboard.press("?");
  await expect(page.locator("#dlg-keys")).toBeVisible();
  await expect(page.locator("#dlg-keys")).toContainText("Measure between two points");
  await page.locator("#dlg-keys button").click();
  await expect(page.locator("#dlg-keys")).toBeHidden();
});
