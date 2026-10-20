// Tutorial: Taskana — boards and tasks, on a computer. Danny Gelman creates a task for Eitan,
// opens it, asks a question, moves work along the board, and looks at My work and the Inbox.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  start: "taskana/index.html#/board",

  steps: async T => {
    const { page } = T;
    const nav = name => page.locator(".side .nav button").filter({ hasText: new RegExp("^" + name) }).first();
    const col = name => page.locator("section.col[data-drop='" + name + "']");
    const modal = page.locator(".modal").filter({ visible: true }).last();

    await T.card("Taskana tutorial · on a computer", "Boards and tasks", "Every client project's tasks, reviews and questions — from backlog to done.", 5.5);

    await T.say("<b>Taskana</b> is GALIL's task manager. Its pages are on the left: your Overview, Inbox, My work, the Board, all tasks, the Library and Insights.", { spot: page.locator(".side .nav"), secs: 6.5 });
    await T.say("The <b>Board</b> shows the workflow, left to right: Backlog, To Do, Writing, Peer Review, SME Review and Done.", { spot: page.locator("section.col").first().locator("xpath=.."), pad: 2, secs: 6 });
    const card = col("To Do").locator("article.tcard").first();
    await T.say("Each card is a task: its <b>key</b> and type, the title, the project, the priority, the <b>due date</b>, comments and open questions — and who it's assigned to.", { spot: card, secs: 7 });
    await T.say("Search, and filter by client, project, person, type or priority. <b>Overdue</b> and <b>Open questions</b> are one click; <b>Save view</b> keeps a filter in the sidebar.", { spot: page.locator(".col").first().locator("xpath=../..").locator("select").first().locator("xpath=.."), secs: 7 });

    /* a new task */
    await T.say("Let's create one. <b>New task</b>…", { spot: page.getByRole("button", { name: "New task" }), keep: true, secs: 2.2 });
    await T.click(page.getByRole("button", { name: "New task" }), 1000);
    await T.say("Pick the <b>project</b> — projects, work orders and people all come from WorkDesk — and give it a title.", { spot: page.locator("#fm-projectId"), keep: true });
    await T.select(page.locator("#fm-projectId"), (await page.locator("#fm-projectId option").allTextContents()).find(t => /Radar Suite/.test(t)), { hold: true });
    await T.type(page.locator("#fm-title"), "Draft chapter 6 — Calibration");
    await T.say("Then the <b>type</b>, <b>priority</b>, who it's for, its <b>status</b>, dates and an <b>estimate</b>.", { spot: page.locator("#fm-priority").locator("xpath=.."), keep: true });
    await T.select(page.locator("#fm-priority"), "High", { hold: true });
    await T.select(page.locator("#fm-assigneeId"), (await page.locator("#fm-assigneeId option").allTextContents()).find(t => /Eitan Fisch/.test(t)), { hold: true });
    await T.fill(modal.getByLabel("Estimate (hours)"), "16");
    await T.say("Press <b>Create</b>. Eitan sees it in his Inbox and My work.", { spot: modal.getByRole("button", { name: "Create" }), keep: true, secs: 2.8 });
    await T.click(modal.getByRole("button", { name: "Create" }), 1300);

    /* the task */
    const mine = page.locator("article.tcard").filter({ hasText: "Draft chapter 6 — Calibration" }).first();
    if (!(await page.locator("#ck-new").count())) {
      await T.say("Here it is. Click a card to open the task.", { spot: mine, keep: true, secs: 2.8 });
      await T.click(mine, 1300);
    }
    await T.say("The task holds everything about the work: the description, a <b>checklist</b>, sub-tasks, linked tasks, files and links.", { spot: page.locator("#ck-new").locator("xpath=../.."), secs: 6 });
    const chk = page.locator("#ck-new");
    await T.type(chk, "Screenshots of the calibration screens", { hold: true });
    await T.click(chk.locator("xpath=..").getByRole("button", { name: "Add", exact: true }), 800);
    await T.say("On the right: <b>status</b>, assignee, dates and estimate — and the <b>hours reported in WorkDesk</b> on this task, against its estimate and the budget.", { spot: modal.getByLabel("Status").first().locator("xpath=ancestor::*[3]"), secs: 7 });
    const box = page.getByPlaceholder(/^Add a comment/).filter({ visible: true }).first();
    if (await box.count()) {
      await T.say("Below, the <b>comments</b>. Mark one as a <b>Question</b> and it stays open until someone answers it.", { spot: box, keep: true });
      await T.click(modal.getByRole("button", { name: "Question", exact: true }), 300, { hold: true });
      await T.type(page.locator(".modal textarea").last(), "Which firmware version should the screenshots show?", { hold: true });
      await T.click(modal.getByRole("button", { name: "Ask", exact: true }), 900);
    }
    await T.click(modal.getByRole("button", { name: "Close" }).first(), 800);

    /* moving work along */
    await T.say("To move a task along, <b>drag</b> its card to the next column — or use its <b>Move</b> menu.", { spot: mine.locator("select.move"), keep: true });
    await T.select(mine.locator("select.move"), "Writing");
    await T.say("It's in <b>Writing</b> now. Peer Review and SME Review are the review rounds before Done.", { spot: page.locator("article.tcard").filter({ hasText: "Draft chapter 6 — Calibration" }).first() });

    /* my work, inbox */
    await T.click(nav("My work"), 1200);
    await T.say("<b>My work</b>: everything assigned to you, by due date — overdue first.", { spot: page.locator("main").first(), pad: 0, secs: 4.5 });
    await T.click(nav("Inbox"), 1200);
    await T.say("The <b>Inbox</b>: new assignments, comments, questions for you and reviews waiting — the number shows what's unread.", { spot: page.locator("main").first(), pad: 0, secs: 5.5 });
    await T.say("<b>Employee Portal</b> at the top takes you back to the home page.", { spot: page.locator("#to-portal"), secs: 3.5 });

    await T.card("That's Taskana", "Plan · write · review · done", "More help: the Handbook → Taskana.", 4.5);
  }
};
