// Tutorial: WorkDesk → Week Planner, on a computer. Danny Gelman, a Project Manager,
// plans his week: a new block, its fields, moving it, a Taskana suggestion, planning for
// a team member, copying the week, the views and the export.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  warm: ["taskana/index.html#/my"],                 // Taskana's demo tasks feed the suggestions
  start: "index.html#/workdesk/time",
  seed: 7,

  /* a lived-in week: two blocks already planned */
  setup: async page => {
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("galil-workdesk-v1"));
      const sun = new Date(); sun.setHours(0, 0, 0, 0); sun.setDate(sun.getDate() - sun.getDay());
      const p2 = n => String(n).padStart(2, "0");
      const day = n => { const d = new Date(sun); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); };
      raw.data.planned = raw.data.planned.filter(x => x.userId !== "u-danny");
      raw.data.planned.push(
        { id: "pl-tut1", userId: "u-danny", date: day(0), start: "09:00", end: "15:00", red: 0, yellow: 6, blue: 0, clientId: "c-iai", projectId: "p-iai1", workOrderId: null, taskId: null, task: "", description: "Chapter 5 — first draft" },
        { id: "pl-tut2", userId: "u-danny", date: day(1), start: "09:00", end: "11:00", red: 2, yellow: 0, blue: 0, clientId: "c-gal", projectId: "p-int1", workOrderId: null, taskId: null, task: "", description: "Team meeting and admin" });
      localStorage.setItem("galil-workdesk-v1", JSON.stringify(raw));
    });
  },

  steps: async T => {
    const { page } = T;
    const day = n => page.locator(".week .day").nth(n);
    const fld = label => page.locator(".modal .fld").filter({ has: page.locator("label", { hasText: new RegExp("^" + label) }) }).locator("select, input").first();

    await T.card("WorkDesk tutorial · on a computer", "The Week Planner", "Plan your hours ahead — and see how they compare with the time you actually report.", 7);

    await T.say("The Week Planner is one of WorkDesk's tabs. Let's open it from the tab bar at the top.", { spot: page.locator(".tabs .tab").filter({ hasText: "Week Planner" }), keep: true });
    await T.click(page.locator(".tabs .tab").filter({ hasText: "Week Planner" }), 1400);
    await T.clear();

    await T.say("Each column is one day. <b>Today</b> is outlined in orange, and the blocks you have planned sit on their day.", { spot: page.locator(".week") , pad: 4 });
    await T.say("The top of each day shows two numbers: the hours you <b>planned</b> (p) and the hours you actually <b>reported</b> (a).", { spot: day(0).locator("h5") });
    await T.say("Up here are the totals for the period: <b>Planned</b>, <b>Actual</b>, the <b>Variance</b> between them, and your <b>Capacity</b> — the hours in your contract.", { spot: page.locator(".chip").filter({ hasText: "Planned" }).locator("xpath=..") });

    /* a new block */
    await T.say("To plan time, click <b>+ plan</b> on the day you want. Let's plan Tuesday morning.", { spot: day(2), keep: true });
    await T.click(day(2).getByRole("button", { name: "+ plan" }), 1300);
    await T.clear();
    await T.say("A planned entry opens. Set the <b>start</b> and the <b>end</b> — the number of hours is worked out for you.", { spot: page.locator(".modal .grid3"), keep: true });
    await T.fill(fld("Start"), "09:00");
    await T.fill(fld("End"), "13:00");
    await T.clear();
    await T.say("Choose the <b>hour type</b>: <b>Yellow</b> for client work, <b>Red</b> for company time — and <b>Blue</b> for management, if your role has it.", { spot: fld("Hour type"), keep: true });
    await T.select(fld("Hour type"), "Yellow · Client");
    await T.clear();
    await T.say("Then pick the <b>client</b> and the <b>project</b>. The project list only shows that client's projects.", { spot: fld("Client"), keep: true });
    await T.select(fld("Client"), "Elbit Systems");
    await T.select(fld("Project"), "Avionics Help System");
    await T.clear();
    await T.say("If you like, tie it to a <b>work order</b> and to one of your <b>Taskana tasks</b> — or leave them empty.", { spot: page.locator(".modal .grid2"), keep: true });
    await T.select(fld("Work order"), await fld("Work order").locator("option").nth(1).textContent());
    await T.clear();
    await T.say("Add a short <b>description</b>, so you remember what the time is for.", { spot: fld("Description"), keep: true });
    await T.type(fld("Description"), "Review the help topics with the SME");
    await T.clear();
    await T.say("Remember: a plan is only a plan. Planned entries <b>don't count as reported hours</b> — you still report your time in the Time Log.", { spot: page.locator(".modal .banner") });
    await T.say("Click <b>Save</b>, and the block appears on Tuesday.", { spot: page.locator(".modal footer").getByRole("button", { name: "Save" }), keep: true });
    await T.click(page.locator(".modal footer").getByRole("button", { name: "Save" }), 1200);
    await T.say("Here it is. The totals at the top have been updated too.", { spot: day(2).locator(".pcard").first() });

    /* change, delete, move */
    await T.say("Click a block to change any of its details — or to <b>delete</b> it.", { spot: day(2).locator(".pcard").first(), keep: true });
    await T.click(day(2).locator(".pcard").first(), 1200);
    await T.say("<b>Delete</b> is at the bottom left. We'll keep this one, so let's cancel.", { spot: page.locator(".modal footer").getByRole("button", { name: "Delete" }), keep: true });
    await T.click(page.locator(".modal footer").getByRole("button", { name: "Cancel" }), 900);
    await T.clear();
    await T.say("Plans change. To move a block to another day, just <b>drag</b> it there.", { spot: day(2).locator(".pcard").first(), keep: true });
    await T.clear();
    await T.drag(day(2).locator(".pcard").first(), day(3));
    await T.say("It moved to Wednesday.", { spot: day(3).locator(".pcard").first() });

    /* Taskana suggestions */
    const sug = page.locator(".chip.teal[draggable]");
    if (await sug.count()) {
      await T.say("Your open <b>Taskana tasks</b> that have a due date are suggested up here.", { spot: sug.first().locator("xpath=..") });
      await T.say("Drag one onto a day…", { spot: sug.first(), keep: true, secs: 2.5 });
      await T.clear();
      await T.drag(sug.first(), day(4));
      await T.say("…and the planner fills in the client, the project, the task and the description for you. Just set the hours and save.", { spot: page.locator(".modal"), keep: true, pad: 2 });
      await T.click(page.locator(".modal footer").getByRole("button", { name: "Save" }), 1200);
      await T.clear();
    }

    /* planning for someone else */
    await T.say("Team leads and managers can plan for their team as well. Choose the person under <b>Planning for</b>.", { spot: page.locator(".fld").filter({ hasText: "Planning for" }), keep: true });
    await T.select(page.locator(".fld").filter({ hasText: "Planning for" }).locator("select"), "Eitan Fisch");
    await T.say("Now you see Eitan's week. When you change someone's plan, they are <b>notified</b>.", { spot: page.locator(".week"), pad: 4 });
    await T.select(page.locator(".fld").filter({ hasText: "Planning for" }).locator("select"), "Danny Gelman");

    /* copy the week, move between weeks */
    await T.say("Happy with this week? <b>Copy week</b> puts every block into next week too — a quick start for a week that looks the same.", { spot: page.getByRole("button", { name: "Copy week" }), keep: true });
    await T.click(page.getByRole("button", { name: "Copy week" }), 1200);
    await T.clear();
    await T.say("Use the <b>arrows</b> to move between weeks. Here's next week — already planned.", { spot: page.getByRole("button", { name: "Next" }).locator("xpath=.."), keep: true });
    await T.click(page.getByRole("button", { name: "Next", exact: true }), 1600);
    await T.clear();
    await T.say("<b>This week</b> always brings you back to today.", { spot: page.getByRole("button", { name: "This week" }), keep: true });
    await T.click(page.getByRole("button", { name: "This week" }), 1200);
    await T.clear();

    /* views */
    await T.say("Switch between a <b>Day</b>, a <b>Week</b> and a four-week <b>Month</b> view.", { spot: page.locator(".pillbar").first(), keep: true });
    await T.click(page.locator(".pill", { hasText: /^Month$/ }), 1800);
    await T.click(page.locator(".pill", { hasText: /^Day$/ }), 1800);
    await T.click(page.locator(".pill", { hasText: /^Week$/ }), 1200);
    await T.clear();

    await T.say("And <b>Export</b> downloads the plan next to the actual hours as an Excel workbook — handy for a weekly review.", { spot: page.getByRole("button", { name: "Export" }) });
    await T.say("If a week is planned past your contracted hours, an orange warning tells you — so you can spread the work in time.", { spot: page.locator(".chip").filter({ hasText: "Capacity" }) });

    await T.card("That's the Week Planner", "Plan · compare · adjust", "Plan ahead, report as you go, and see the difference. More help: the Handbook → Week Planner.", 7);
  }
};
