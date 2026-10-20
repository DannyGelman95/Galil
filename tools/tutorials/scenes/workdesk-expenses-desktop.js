// Tutorial: WorkDesk → Expenses, on a computer. Danny Gelman records a client lunch with
// its receipt, and sees reimbursement, editing and export.
const path = require("path");
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/expenses",

  steps: async T => {
    const { page } = T;
    const form = page.locator(".panel").filter({ hasText: "Report an expense" }).first();
    const f = label => T.field(label, form);
    const optionLike = async (sel, re) => (await sel.locator("option").allTextContents()).find(t => re.test(t));

    await T.card("WorkDesk tutorial · on a computer", "Expenses", "Record what you spent for work, attach the receipt, and follow it until it's paid.", 5.5);

    await T.say("The <b>Expenses</b> tab: the form at the top, and this month's expenses in the table below.", { spot: form });
    await T.say("Set the <b>date</b> and the <b>time</b> of the expense.", { spot: f("Date") });
    await T.say("Choose the <b>expense type</b>. Some types have a <b>ceiling</b> — an amount above it goes to your manager for approval.", { spot: f("Expense type"), keep: true });
    await T.select(f("Expense type"), await optionLike(f("Expense type"), /^Meal/));
    await T.say("Most expenses are in <b>money</b>: pick the currency and type the amount. Some, like travel time, are counted in <b>hours</b>.", { spot: f("Value kind"), keep: true });
    await T.fill(f("Amount"), "126");
    await T.say("If it was for a client, say which <b>client</b>, <b>project</b> and <b>work order</b> — it then shows against their budget.", { spot: form.locator(".band").nth(1).locator(".fld").nth(0), keep: true });
    await T.select(f("Client"), "Elbit Systems", { hold: true });
    await T.select(f("Project"), "Avionics Help System");
    await T.say("Describe it in a few words.", { spot: f("Description"), keep: true, secs: 2.5 });
    await T.type(f("Description"), "Lunch with the client's SME after the review");
    await T.say("Attach the <b>receipt</b> — a photo or a PDF. Finance needs it to pay you back.", { spot: form.locator(".filebox"), keep: true });
    await form.locator("input[type=file]").setInputFiles(path.join(__dirname, "..", "assets", "receipt.jpg"));
    await T.wait(900); await T.done();
    await T.say("Then <b>Add expense</b>.", { spot: form.getByRole("button", { name: "Add expense" }), keep: true, secs: 2.2 });
    await T.click(form.getByRole("button", { name: "Add expense" }), 1300);

    const row = page.locator("tbody tr").filter({ hasText: "Lunch with the client" }).first();
    await T.say("Here it is, with its receipt — click the clip to open it.", { spot: row });
    await T.say("<b>Reimbursement</b> follows it from <b>Submitted</b> to <b>Approved</b> and <b>Paid</b>. Managers and finance change it here; you see it update.", { spot: row.locator("td").nth(7), secs: 6.5 });
    await T.say("You can <b>edit</b> or <b>delete</b> your expense until it's approved.", { spot: row.locator("td").last() });
    await T.say("Move between <b>months</b>; the total of what you see is on the right. Managers can filter by <b>employee</b>.", { spot: page.locator(".panel").filter({ has: page.getByRole("button", { name: "Previous month" }) }).first() });
    await T.say("<b>This view</b> and <b>Everything</b> export the expenses to Excel.", { spot: page.getByRole("button", { name: "This view" }) });

    await T.card("That's Expenses", "Record · attach · get paid", "Add the receipt while you still have it. More help: the Handbook → Expenses.", 5);
  }
};
