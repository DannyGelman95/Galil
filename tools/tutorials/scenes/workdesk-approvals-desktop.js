// Tutorial: WorkDesk → Approvals, on a computer. Tamir Nisman (CEO) works through the
// queue: reads a request, asks a question, approves with a raised allowance, bulk-approves
// and reviews past decisions.
module.exports = {
  user: "u-tamir",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/approvals",

  steps: async T => {
    const { page } = T;
    const card = n => page.locator(".apcard").nth(n);
    const modal = page.locator(".modal").last();

    await T.card("WorkDesk tutorial · on a computer", "Approvals", "Everything that needs a manager's yes — time over an allowance, leave, expenses, new accounts and more.", 5.5);

    await T.say("The <b>Approvals</b> tab is your queue. The number on the tab is how many requests are waiting for you.", { spot: page.locator(".tabs .tab").filter({ hasText: "Approvals" }) });
    await T.say("Each <b>type</b> of request has its own filter, with its count — time entries, leave, team loans, allowance increases, expenses, account activations…", { spot: page.locator(".apfilters .pillbar") });
    await T.say("Each card is one request: <b>who</b> asked, <b>when</b>, who it's assigned to, and the <b>hours</b> and dates.", { spot: card(0).locator(".row").first() });
    await T.say("Then <b>why</b> it needs approval — here, the entry takes Eitan past his <b>allowance</b> — and the client, project and work order.", { spot: card(0).locator(".row").nth(1) });
    await T.say("The bars show the <b>allowance</b> and the project's <b>budget</b> as they stand — so you decide knowing the numbers.", { spot: card(0).locator(".row").filter({ hasText: "Assignment allowance" }).locator("xpath=..") });
    await T.say("Four actions: <b>Approve</b>, <b>Edit &amp; approve</b> to correct it first, <b>Decline</b> with a reason, or <b>Request info</b>.", { spot: card(0).locator(".apgo") });

    /* ask a question */
    await T.say("Not sure about this one? <b>Request info</b> asks the person a question. The request stays pending.", { spot: card(2).getByRole("button", { name: "Request info" }), keep: true });
    await T.click(card(2).getByRole("button", { name: "Request info" }), 900);
    await T.type(page.locator("#ask-note"), "Is this call for an existing client project, or a new proposal?");
    await T.click(modal.getByRole("button", { name: "Send question" }), 1100);
    await T.say("The question now shows on the card, and the answer will appear under it.", { spot: card(2) });

    /* approve with the allowance raised */
    await T.say("Let's approve Eitan's overtime.", { spot: card(0).getByRole("button", { name: "Approve", exact: true }), keep: true, secs: 2.5 });
    await T.click(card(0).getByRole("button", { name: "Approve", exact: true }), 900);
    await T.say("Because it's over his allowance, WorkDesk asks: <b>approve only</b>, or <b>approve and raise the allowance</b> by the overage, so his next entry doesn't come back here.", { spot: modal, keep: true, pad: 2, secs: 7.5 });
    await T.click(modal.getByRole("button", { name: "Approve and raise allowance" }), 1300);

    /* bulk */
    await T.say("Several simple requests? Tick them and use <b>Bulk approve</b>. Anything over a project's budget must be decided one by one.", { spot: page.locator(".apcard input[type=checkbox]").first(), keep: true });
    await T.click(page.locator(".apcard input[type=checkbox]").first(), 700);
    await T.say("Then <b>Bulk approve</b>.", { spot: page.getByRole("button", { name: /Bulk approve/ }), keep: true, secs: 2.2 });
    await T.click(page.getByRole("button", { name: /Bulk approve/ }), 1200);

    /* history */
    await T.say("To look back, set the <b>status</b> to Approved or Declined. Every decision shows who made it, when, and the note.", { spot: T.field("Status"), keep: true });
    await T.select(T.field("Status"), "Approved");
    await T.say("Here are today's decisions.", { spot: page.locator(".apgrid"), pad: 4 });
    await T.select(T.field("Status"), "Pending");

    await T.card("That's Approvals", "Read · decide · move on", "Every request carries the numbers you need. More help: the Handbook → Approvals.", 5);
  }
};
