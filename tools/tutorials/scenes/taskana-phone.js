// Tutorial: Taskana on a phone — My work, a task, and the board.
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  warm: ["taskana/index.html#/board"],
  start: "taskana/index.html#/my",

  steps: async T => {
    const { page } = T;
    await T.card("Taskana on a phone", "Your tasks", "See what's yours, answer questions and move work along — anywhere.", 5);
    await T.say("On a phone, Taskana opens on <b>My work</b>: your tasks by status, your hours banks, and what you reported.", { spot: page.locator(".card, section").first() });
    await T.say("The <b>menu</b> button opens the pages: Inbox, the Board, all tasks, the Library and more.", { spot: page.getByRole("button", { name: "Menu" }), keep: true, secs: 4 });
    await T.click(page.getByRole("button", { name: "Menu" }), 1200);
    await T.click(page.locator(".side .nav button").filter({ hasText: /^Inbox/ }), 1200);
    await T.say("The <b>Inbox</b>: new assignments, mentions and questions for you.", { spot: page.locator("main").first(), pad: 0, secs: 4 });
    await T.click(page.getByRole("button", { name: "Menu" }), 900);
    await T.click(page.locator(".side .nav button").filter({ hasText: /^Board/ }), 1300);
    await T.say("The <b>Board</b> scrolls sideways, one column at a time. To move a card, press and hold it — or use its <b>Move</b> menu.", { spot: page.locator("article.tcard").first(), secs: 6 });
    await T.click(page.locator("article.tcard").first(), 1300);
    await T.say("A task opens full screen: the description, checklist, comments and questions — and its status and dates.", { spot: page.locator(".modal").filter({ visible: true }).last(), pad: 0, secs: 5.5 });
    await T.click(page.locator(".modal").filter({ visible: true }).last().getByRole("button", { name: "Close" }).first(), 800);
    await T.card("That's Taskana on a phone", "Your tasks, anywhere", "More help: the Handbook → Taskana.", 4.5);
  }
};
