// Tutorial: WorkDesk on a phone — the Time tab. Danny Gelman reports a morning's work,
// uses the timer, and finds his team's time.
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  warm: ["taskana/index.html#/my"],
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const sheet = page.locator(".sheet").last();
    const f = label => T.field(label, sheet);

    await T.card("WorkDesk on a phone", "Reporting time", "Your hours, sick and vacation days — in a few taps.", 5);

    await T.say("On a phone, WorkDesk opens on <b>Time</b>. The bar at the bottom has <b>Time</b>, <b>Plan</b>, <b>Expenses</b> and <b>More</b>.", { spot: page.locator(".mnav") });
    await T.say("At the top: the hours you've reported <b>today</b>, and the <b>timer</b>. Start it when you begin, stop it when you finish — the entry fills itself in.", { spot: page.locator("#m-time-bar").first(), secs: 6.5 });
    await T.say("Or report afterwards: <b>Report without the timer</b>.", { spot: page.getByRole("button", { name: "Report without the timer" }), keep: true, secs: 2.8 });
    await T.click(page.getByRole("button", { name: "Report without the timer" }), 1100);
    await T.say("The same form as on a computer: <b>type</b>, date, start and end…", { spot: f("Start").locator("xpath=../.."), keep: true, secs: 3.5 });
    await T.fill(f("End"), "13:00");
    await T.say("…the <b>hour type</b> — Yellow for client work, Red for company time, Blue for managing projects…", { spot: sheet.locator(".seg"), secs: 4.5 });
    await T.say("…then the client and project.", { spot: f("Client"), keep: true, secs: 2.5 });
    await T.select(f("Client"), "Elbit Systems", { hold: true });
    await T.select(f("Project"), "Avionics Help System", { hold: true });
    await T.select(f("Work order"), await f("Work order").locator("option").nth(1).textContent());
    await T.say("Say what you worked on…", { spot: f("Description"), keep: true, secs: 2 });
    await T.type(f("Description"), "Help topics — review comments");
    await T.say("…and <b>Save entry</b>.", { spot: sheet.getByRole("button", { name: "Save entry" }), keep: true, secs: 2 });
    await T.click(sheet.getByRole("button", { name: "Save entry" }), 1300);

    const card = page.locator(".mcard").filter({ hasText: "Help topics — review comments" }).first();
    await T.say("Each entry is a card: hours and colour, date and time, client and project.", { spot: card });
    await T.say("<b>Edit</b>, <b>Duplicate</b> to other days, or <b>delete</b>.", { spot: card.getByRole("button", { name: "Duplicate…" }).locator("xpath=.."), secs: 3.5 });
    await T.say("Move between <b>months</b> at the top of the list.", { spot: page.getByRole("button", { name: "Previous month" }).locator("xpath=.."), secs: 3 });
    await T.say("Managers can switch to <b>Me and my team</b> — and <b>Filter &amp; sort</b> narrows the list down.", { spot: page.getByRole("button", { name: "Me and my team" }).locator("xpath=.."), keep: true });
    await T.click(page.getByRole("button", { name: "Me and my team" }), 1500);
    await T.click(page.getByRole("button", { name: "Mine" }), 900);

    await T.card("That's Time on a phone", "Tap · report · done", "More help: the Handbook → Time Log.", 4.5);
  }
};
