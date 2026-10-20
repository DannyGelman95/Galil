// Tutorial: WorkDesk → Management, part 2 — clients, projects, work orders and budgets, on a
// computer. Tamir Nisman (CEO) adds a client, then walks through how the work is set up.
module.exports = {
  user: "u-tamir",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/management",

  steps: async T => {
    const { page } = T;
    const section = name => page.locator(".pillbar .pill").filter({ hasText: new RegExp("^" + name + "$") }).first();
    const modal = page.locator(".modal").last();

    await T.card("WorkDesk tutorial · on a computer", "Management · clients and budgets", "Clients, projects, work orders and budgets — the records every hour is counted against.", 5.5);

    await T.say("Client work is set up in order: a <b>client</b>, its <b>projects</b>, a <b>work order</b> for each piece of work, and a <b>budget</b> for it.", { spot: page.locator(".pillbar").first(), secs: 6 });

    /* Clients */
    await T.click(section("Clients"), 1100);
    await T.say("<b>Clients</b>: add one with its name and initials — the initials go into its work-order codes.", { spot: page.locator(".panel").filter({ has: page.locator("label", { hasText: "Client name" }) }).first(), keep: true });
    await T.type(T.field("Client name"), "Negev Robotics", { hold: true });
    await T.type(T.field("Initials"), "NRB", { hold: true });
    await T.type(T.field("Contact"), "Maya Levi", { hold: true });
    await T.click(page.getByRole("button", { name: "+ Add" }), 1200);
    await T.say("<b>More details…</b> adds the legal name, address, VAT number and payment terms. In the table, a click copies a phone, VAT number or address.", { spot: page.getByRole("button", { name: "More details…" }), secs: 6.5 });

    /* Projects */
    await T.click(section("Projects"), 1100);
    await T.say("<b>Projects</b> belong to a client, with a status, an owner, dates and their work orders and Taskana tasks.", { spot: page.locator("tbody tr").filter({ hasText: "Avionics Help System" }).first() });

    /* Work orders */
    await T.click(section("Work Orders"), 1100);
    await T.say("<b>Work Orders</b>: each piece of client work, with its code, lead, team, budget use and tasks.", { spot: page.locator("tbody tr").first() });
    await T.say("<b>+ New work order</b> opens the full order: title, dates, scope, deliverables, the lead and team, and who signs.", { spot: page.getByRole("button", { name: "+ New work order" }), keep: true });
    await T.click(page.getByRole("button", { name: "+ New work order" }), 1100);
    await T.say("The code is made for you from the client's initials. Everything here also goes on the signed document.", { spot: modal, pad: 2, secs: 5 });
    await T.click(modal.getByRole("button", { name: "Close" }).first(), 700);
    await T.say("The document button makes the official <b>work-order PDF</b>, in English or Hebrew, ready to download or email to the client.", { spot: page.getByRole("button", { name: "Work order document (PDF)" }).first(), secs: 6 });

    /* Budgets */
    await T.click(section("Budgets"), 1100);
    await T.say("<b>Budgets</b>: one row per work order. The bar shows how much is <b>used</b>, what's waiting in approval, and what <b>remains</b>.", { spot: page.locator("tbody tr").first(), secs: 6 });
    await T.say("A budget can be counted in <b>hours</b>, <b>money</b>, <b>pages</b> or <b>words</b>; <b>Projected exhaustion</b> estimates when it will run out.", { spot: page.locator("thead").first() , secs: 6 });
    await T.say("The filters find budgets by client, project, basis or how much is used — say, everything above 90%.", { spot: page.locator(".panel").filter({ has: page.locator("label", { hasText: "Used" }) }).first() });
    await T.say("<b>+ New budget</b> sets one up for a work order.", { spot: page.getByRole("button", { name: "+ New budget" }), keep: true, secs: 2.5 });
    await T.click(page.getByRole("button", { name: "+ New budget" }), 1000);
    await T.say("Pick the client, project and work order, the pricing basis and the amount. Every change is kept in the budget's history.", { spot: modal, pad: 2, secs: 5.5 });
    await T.click(modal.getByRole("button", { name: "Cancel" }), 700);

    await T.say("<b>Expense Types</b> sets the kinds of expense and their ceilings.", { spot: section("Expense Types") });

    await T.card("That's Management · clients and budgets", "Client · project · work order · budget", "More help: the Handbook → Management.", 4.5);
  }
};
