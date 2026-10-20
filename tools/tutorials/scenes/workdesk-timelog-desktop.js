// Tutorial: WorkDesk → Time Log, on a computer. Danny Gelman reports a morning's work,
// meets the hour types, edits, duplicates and filters, and sees sick and vacation days.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  warm: ["taskana/index.html#/my"],
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const form = page.locator(".tlform");
    const f = label => T.field(label, form);

    await T.card("WorkDesk tutorial · on a computer", "The Time Log", "Report your work, sick and vacation time — and find, fix and export what you reported.", 5.5);

    await T.say("The <b>Time Log</b> is where you report your time. The form is on the left; everything reported this month is in the table on the right.", { spot: form });
    await T.say("The <b>date</b> starts on today. Pick another day in the calendar, or press <b>Today</b> to come back.", { spot: form.locator(".band").nth(1) });
    await T.say("The <b>type</b> is Work, Sick or Vacation. We're reporting work.", { spot: f("Type") });

    await T.say("Set when you <b>started</b> and <b>finished</b>. WorkDesk works out the hours.", { spot: form.locator(".band").nth(3), keep: true });
    await T.select(form.getByLabel("Start hour"), "09", { hold: true });
    await T.select(form.getByLabel("End hour"), "13");

    await T.say("Then the <b>hour type</b>. <b>Yellow</b> is client work, billed and drawn from the project's budget. <b>Red</b> is company time. <b>Blue</b> is managing a client's projects.", { spot: form.locator(".seg"), secs: 7.5 });

    await T.say("Choose the <b>client</b> and the <b>project</b>. Not in the list? <b>Type it</b> — a manager verifies it later.", { spot: form.locator(".band").filter({ has: page.getByText("Client", { exact: false }) }).first(), keep: true });
    await T.select(f("Client"), "Elbit Systems", { hold: true });
    await T.select(f("Project"), "Avionics Help System");
    await T.say("If the work belongs to a <b>work order</b> or one of your <b>Taskana tasks</b>, pick them too.", { spot: form.locator(".band").filter({ has: page.locator("label", { hasText: "Work order" }) }), keep: true });
    await T.select(f("Work order"), await f("Work order").locator("option").nth(1).textContent());
    await T.say("A short <b>description</b> is required — what did you work on?", { spot: f("Description"), keep: true });
    await T.type(f("Description"), "Help topics — review comments from the SME");
    await T.say("Press <b>Add entry</b>.", { spot: form.getByRole("button", { name: "Add entry" }), keep: true, secs: 2.2 });
    await T.click(form.getByRole("button", { name: "Add entry" }), 1300);

    const row = page.locator("tbody tr").filter({ hasText: "Help topics — review comments" }).first();
    await T.say("It's in the table. Its <b>status</b> shows whether it went straight in or is waiting for a manager's approval — over an allowance, for example.", { spot: row, secs: 7 });
    await T.say("At the end of each row: <b>edit</b>, <b>duplicate</b> and <b>delete</b>.", { spot: row.locator("td").last() });
    await T.say("<b>Duplicate</b> copies the entry to other days in one go — the next day, the rest of the week, or a date you choose.", { spot: row.getByTitle("Duplicate this entry"), keep: true });
    await T.click(row.getByTitle("Duplicate this entry"), 1200);
    await T.say("Pick where it should go. We'll close this for now.", { spot: page.locator(".duppop"), secs: 4.5 });
    await page.keyboard.press("Escape").catch(() => {});
    await page.mouse.click(800, 860); await T.wait(400);

    await T.say("For a day off, set the type to <b>Sick</b> or <b>Vacation</b>. You choose a date range, and WorkDesk counts the working days and shows your balance.", { spot: f("Type"), keep: true });
    await T.select(f("Type"), "Vacation", { hold: true });
    await T.say("Leave goes to your manager for approval. We'll switch back to Work.", { spot: form, secs: 4.5, keep: true });
    await T.select(f("Type"), "Work");

    const bar = page.locator(".panel").filter({ has: page.getByRole("button", { name: "Previous month" }) }).first();
    await T.say("Above the table: move between <b>months</b>, and the totals of what you see — by hour colour, sick days and what's in approval.", { spot: bar });
    await T.say("Managers can see their team's time too. The <b>filters</b> narrow it down by employee, client, project, work order or status.", { spot: bar.locator(".fld").first() });
    await T.say("<b>This view</b> exports exactly what you see to Excel; <b>Everything</b> exports all the time you're allowed to see.", { spot: page.getByRole("button", { name: "This view" }) });
    await T.say("And every table can be shaped to suit you: save <b>views</b>, <b>sort</b>, move and resize <b>columns</b> — and reset it all.", { spot: page.locator(".tbg").first().locator("xpath=..") });

    await T.card("That's the Time Log", "Report · check · export", "Report as you go — it takes a minute a day. More help: the Handbook → Time Log.", 5);
  }
};
