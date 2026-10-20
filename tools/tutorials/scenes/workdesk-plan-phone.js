// Tutorial: WorkDesk on a phone — the Plan tab. Danny Gelman plans a block, copies it and his
// week, swipes for Copy and Delete, and looks at the month.
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  start: "index.html#/workdesk/time",
  setup: async page => {
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      const sun = new Date(); sun.setHours(0, 0, 0, 0); sun.setDate(sun.getDate() - sun.getDay());
      const p2 = n => String(n).padStart(2, "0"), day = n => { const d = new Date(sun); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); };
      raw.data.planned = raw.data.planned.filter(x => x.userId !== "u-danny");
      raw.data.planned.push({ id: "pl-ph1", userId: "u-danny", date: day(0), start: "09:00", end: "13:00", red: 0, yellow: 4, blue: 0, clientId: "c-iai", projectId: "p-iai1", workOrderId: null, taskId: null, task: "", description: "Chapter 5 — first draft" });
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    });
  },

  steps: async T => {
    const { page } = T;
    const block = page.locator(".mcard").filter({ hasText: "Chapter 5 — first draft" }).first();

    await T.card("WorkDesk on a phone", "Planning your week", "Plan ahead, by week or by month — and copy what repeats.", 5);

    await T.click(page.locator(".mnav button").filter({ hasText: "Plan" }), 1100);
    await T.say("<b>Plan</b> shows your week, day by day, with planned (p) and actual (a) hours, and your totals at the top.", { spot: page.locator(".mday").first() });
    await T.say("<b>+ plan this day</b> adds a block: times, hour type, client, project and a description.", { spot: page.locator(".mday").nth(2).getByRole("button", { name: "+ plan this day" }), secs: 4.5 });

    await T.say("Swipe a block to the <b>left</b> for its actions…", { spot: block, keep: true, secs: 2.8 });
    await T.done();
    await T.swipe(block, -190);
    await T.say("…<b>Copy</b> and <b>Delete</b>.", { spot: page.locator(".swipe.open .swipe-acts"), keep: true, secs: 2.5 });
    await T.click(page.locator(".swipe.open .swipe-act").filter({ hasText: "Copy" }), 1000);
    await T.say("Copy it to the <b>next day</b>, or to the <b>rest of this week</b> — working days only.", { spot: page.locator(".sheet .sh").last(), pad: 0, keep: true, secs: 4.5 });
    await T.click(page.locator("#m-copy-rest"), 1300);
    await T.say("Done — Monday to Thursday now have it too. Every copy and delete has <b>Undo</b>.", { spot: page.locator(".mday").nth(1), secs: 4.5 });

    await T.say("<b>Copy this week to next week</b> repeats the whole week in one go.", { spot: page.locator("#m-copy-week"), secs: 4 });

    await T.say("Switch to <b>Month</b> for the whole month at a glance.", { spot: page.getByRole("tab", { name: "Month" }), keep: true, secs: 2.8 });
    await T.click(page.getByRole("tab", { name: "Month" }), 1100);
    await T.say("Each day shows its planned hours. Tap a day to see and plan it.", { spot: page.locator(".mcal"), secs: 4 });
    await T.click(page.locator(".mcal-day:not(.out)").nth(10), 1200);
    await T.click(page.getByRole("tab", { name: "Week" }), 900);

    await T.card("That's Plan on a phone", "Plan · copy · adjust", "More help: the Handbook → Week Planner.", 4.5);
  }
};
