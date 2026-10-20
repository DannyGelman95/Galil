// Tutorial: WorkDesk → Management, part 1 — people, teams and assignments, on a computer.
// Tamir Nisman (CEO) looks after the people records, places someone in a team and gives an
// employee an assignment with an allowance.
module.exports = {
  user: "u-tamir",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/management",

  steps: async T => {
    const { page } = T;
    const section = name => page.locator(".pillbar .pill").filter({ hasText: new RegExp("^" + name + "$") }).first();
    const modal = page.locator(".modal").last();
    const closeModal = async () => T.click(modal.getByRole("button", { name: "Close" }).first(), 700);
    const row = name => page.locator("tbody tr").filter({ hasText: name }).first();

    await T.card("WorkDesk tutorial · on a computer", "Management · people and teams", "Keep the people records, the teams, and who works on what — with how many hours.", 5.5);

    await T.say("<b>Management</b> holds WorkDesk's records. Each button along the top opens one list.", { spot: page.locator(".pillbar").first() });

    /* People */
    await T.say("<b>People</b>: everyone in the company, with their email and mobile — click either to copy it.", { spot: row("Dennis Sablin").locator("td").nth(1) });
    await T.say("The <b>role</b> decides what a person may do. Open the list and pick a new role — the mouse wheel never changes it by accident.", { spot: page.getByLabel("Role of Dennis Sablin") });
    await T.say("<b>Portal access</b> decides which apps they see on the Employee Portal home page. The pencil changes it.", { spot: row("Dennis Sablin").getByLabel("Change portal access for Dennis Sablin"), keep: true });
    await T.click(row("Dennis Sablin").getByLabel("Change portal access for Dennis Sablin"), 1000);
    await T.say("WorkDesk on or off, a <b>Taskana role</b>, the Handbook and the Knowledge Base — one person at a time.", { spot: modal, pad: 2, secs: 5 });
    await closeModal();
    await T.say("The pencil by the name edits a person's <b>details</b>: job title, team, manager, contract hours, birthday… <b>Deactivate</b> closes an account without deleting its history.", { spot: row("Dennis Sablin").locator("td").first(), secs: 7 });

    /* Teams */
    await T.click(section("Teams"), 1100);
    await T.say("<b>Teams</b> group people under a lead. Each card shows the team's clients and members.", { spot: page.locator(".panel").filter({ hasText: "Defense Division" }).last() });
    await T.say("People without a team wait under <b>Available people</b>. Placing someone in a team makes its lead their direct manager.", { spot: page.locator(".panel").filter({ hasText: "Available people" }).first(), keep: true, secs: 6 });
    const place = page.getByLabel("Place Galil TC Office in a team");
    await T.select(place, (await place.locator("option").allTextContents()).find(t => /Defense/.test(t)));
    await T.say("<b>Manage</b> opens a team to change its members and lead. <b>Request a team member</b> borrows someone from another team — that goes to approval.", { spot: page.getByRole("button", { name: "Request a team member" }), secs: 6.5 });

    /* Assignments */
    await T.click(section("Assignments & Allowances"), 1100);
    await T.say("<b>Assignments &amp; Allowances</b>: who may report Yellow hours on which project or work order — and how many hours they get.", { spot: page.locator(".panel").filter({ has: page.locator("label", { hasText: "Allowance" }) }).first(), keep: true, secs: 6 });
    await T.select(T.field("Person"), "Dennis Sablin", { hold: true });
    await T.select(T.field("Project"), (await T.field("Project").locator("option").allTextContents()).find(t => /Radar Suite/.test(t)), { hold: true });
    await T.fill(T.field("Allowance (h)"), "60", { hold: true });
    await T.click(page.getByRole("button", { name: "+ Assign" }), 1200);
    await T.say("Done. Time beyond the allowance still gets reported — it just goes to a manager's <b>approval</b> first.", { spot: page.locator("tbody tr").filter({ hasText: "Dennis Sablin" }).first() });

    await T.say("<b>Pending Activation</b> lists new accounts waiting to be approved, and the <b>Verification Queue</b> checks clients and projects people typed in themselves.", { spot: section("Verification Queue").locator("xpath=.."), secs: 6.5 });

    await T.card("That's Management · people and teams", "People · teams · assignments", "Next: clients, projects, work orders and budgets. More help: the Handbook → Management.", 5);
  }
};
