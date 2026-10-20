// Tutorial: WorkDesk on a phone — Expenses. Danny Gelman photographs a receipt and reports it.
const path = require("path");
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const sheet = page.locator(".sheet").last();
    const f = label => T.field(label, sheet);

    await T.card("WorkDesk on a phone", "Expenses", "Report an expense the moment you pay — with a photo of the receipt.", 5);

    await T.click(page.locator(".mnav button").filter({ hasText: "Expenses" }), 1100);
    await T.say("<b>Expenses</b> lists what you've reported this month, each with its reimbursement status.", { spot: page.locator(".mbody .mcard").first() });
    const add = page.locator(".mbody .btn.p").first();
    await T.say("Tap the button at the top to report a new one.", { spot: add, keep: true, secs: 2.5 });
    await T.click(add, 1100);
    await T.say("Pick the <b>expense type</b> — some have a ceiling — and the amount.", { spot: f("Expense type"), keep: true });
    await T.select(f("Expense type"), (await f("Expense type").locator("option").allTextContents()).find(t => /^Meal/.test(t)), { hold: true });
    await T.fill(f("Amount"), "126");
    await T.say("The client and project, and a few words.", { spot: f("Client"), keep: true, secs: 2.5 });
    await T.select(f("Client"), "Elbit Systems", { hold: true });
    await T.type(f("Description"), "Lunch with the client's SME");
    const file = sheet.locator("input[type=file]").first();
    if (await file.count()) {
      await T.say("Attach the receipt — on a phone, you can <b>take a photo</b> of it right here.", { spot: sheet.locator(".filebox").first(), keep: true, secs: 4 });
      await file.setInputFiles(path.join(__dirname, "..", "assets", "receipt.jpg")); await T.wait(900); await T.done();
    }
    const save = sheet.locator("footer .btn.p, .btn.p").last();
    await T.say("And save.", { spot: save, keep: true, secs: 1.8 });
    await T.click(save, 1300);
    await T.say("It's on the list — <b>Submitted</b> until a manager approves it and finance pays it.", { spot: page.locator(".mbody .mcard").filter({ hasText: "Lunch with the client" }).first() });

    await T.card("That's Expenses on a phone", "Snap · report · get paid", "More help: the Handbook → Expenses.", 4.5);
  }
};
