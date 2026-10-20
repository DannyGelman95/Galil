// Tutorial: WorkDesk → Dashboard, on a computer. Danny Gelman reads his team's numbers,
// narrows them down, and builds a dashboard of his own.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/dashboard",

  steps: async T => {
    const { page } = T;
    const pill = label => page.locator(".pill, .btn").filter({ hasText: new RegExp("^" + label + "$") }).first();

    await T.card("WorkDesk tutorial · on a computer", "The Dashboard", "Hours, utilisation, budgets and approvals at a glance — and dashboards you build yourself.", 5.5);

    await T.say("Choose the <b>period</b>: this week, this month, the last three months, the year or all time.", { spot: pill("This week").locator("xpath=.."), keep: true });
    await T.click(pill("Last 3 months"), 1500, { hold: true });
    await T.click(pill("This month"), 1000);
    await T.say("<b>Values</b> or <b>%</b> switches the charts between hours and shares; <b>Export</b> saves the numbers to Excel.", { spot: pill("Values").locator("xpath=..") });
    await T.say("The <b>filters</b> narrow everything to one person, client, project or work order. You see only the people in your scope.", { spot: page.locator(".panel").filter({ has: page.locator("label", { hasText: "Work order" }) }).first() });

    await T.say("The <b>manager cockpit</b> shows what needs you: approvals waiting, projects close to their budget, people over capacity and hours still in approval.", { spot: page.locator(".panel").filter({ hasText: "Manager cockpit" }).first(), secs: 7 });
    await T.say("Then the totals: all hours, <b>Yellow</b> client hours, <b>Red</b> company hours, and <b>utilisation</b> — the share of Yellow.", { spot: page.locator(".panel").filter({ hasText: "Total hours" }).first().locator("xpath=..") });
    await T.scroll(page.locator(".panel").filter({ hasText: "Hours by client" }).first());
    await T.say("Below, the charts: hours over time, by client, plan against actual, sick and vacation days, expenses…", { spot: page.locator(".panel").filter({ hasText: "Hours by client" }).first() });
    await T.scroll(page.locator(".panel").first());

    /* a dashboard of one's own */
    await T.say("You can build your own. <b>+ New dashboard</b> starts an empty one; <b>Customize</b> changes the one you're on.", { spot: page.getByRole("button", { name: "Customize" }), keep: true });
    await T.click(page.getByRole("button", { name: "Customize" }), 1100);
    await T.say("Now every widget has buttons to <b>move</b> it, change its <b>settings</b> or <b>remove</b> it — and the bar has Rename, Duplicate, Reset and Delete.", { spot: page.getByRole("button", { name: "+ Add widget" }).locator("xpath=.."), secs: 6.5 });
    await T.say("<b>+ Add widget</b> offers ready-made widgets…", { spot: page.getByRole("button", { name: "+ Add widget" }), keep: true, secs: 2.5 });
    await T.click(page.getByRole("button", { name: "+ Add widget" }), 1000);
    await T.say("…or <b>Build your own</b> from any measure, grouping and chart. Let's add <b>Hours by project</b>.", { spot: page.locator(".modal"), keep: true, pad: 2 });
    await T.click(page.locator(".modal button").filter({ hasText: "Hours by project" }).first(), 1300);
    await T.say("It's added at the end. When you're happy, press <b>Done</b> — the dashboard is saved for you.", { spot: page.getByRole("button", { name: "Done" }), keep: true });
    await T.click(page.getByRole("button", { name: "Done" }), 1000);

    await T.card("That's the Dashboard", "See · narrow · build your own", "More help: the Handbook → Dashboard.", 4.5);
  }
};
