// Tutorial: Taskana → the Library, on a computer. Danny Gelman finds an SME interview,
// reads it, edits it, and starts a new document from a template.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  warm: ["taskana/index.html#/board"],
  start: "taskana/index.html#/library",

  steps: async T => {
    const { page } = T;
    const list = page.locator(".lib-item").first().locator("xpath=..");
    const doc = page.locator(".lib-item").filter({ hasText: /SME interview/ }).first();
    const menuItem = text => page.locator(".ed-menu button, .lib-menu button").filter({ hasText: text }).first();

    await T.card("Taskana tutorial · on a computer", "The Library", "Research from subject-matter experts, site visits and walkthroughs — written, organised and shared.", 5.5);

    await T.say("The <b>Library</b> keeps the research behind the writing: SME interviews, site visits, walkthroughs and notes.", { spot: list });
    await T.say("<b>Search</b> it, and filter by kind, status or client.", { spot: page.getByPlaceholder("Search the library…") });
    await T.say("Each document shows its kind, its status, the client and project it's for — and any <b>open questions</b>.", { spot: doc, keep: true });
    await T.click(doc, 1300);
    await T.say("A document opens on the right, laid out and ready to read — with its headings, tables and the questions still waiting for an answer.", { spot: page.locator(".lib-doc, .lib-view, main").last(), pad: 0, secs: 6 });

    if (await page.locator("#lib-edit").count()) {
      await T.say("<b>Edit</b> turns it into a word processor.", { spot: page.locator("#lib-edit"), keep: true, secs: 2.5 });
      await T.click(page.locator("#lib-edit"), 1100);
      await T.say("The toolbar has what you'd expect — styles, bold and italic, lists, tables, links, images — and keyboard shortcuts.", { spot: page.locator(".ed-bar, .ed-toolbar, [role=toolbar]").first(), secs: 6 });
      const insert = page.getByRole("button", { name: "Insert" });
      if (await insert.count()) {
        await T.say("<b>Insert</b> adds content blocks: a note, a warning, a question for the SME, a step list…", { spot: insert, keep: true });
        await T.click(insert, 500, { hold: true });
        const cb = menuItem("Content block");
        if (await cb.count()) { await T.point(cb); await T.wait(1600); }
        await page.keyboard.press("Escape"); await T.wait(400); await T.done();
      }
      const tools = page.getByRole("button", { name: "Writer tools" });
      if (await tools.count()) {
        await T.say("<b>Writer tools</b> help with the raw material — paste a dump of notes, and <b>Organize</b> turns it into headings, lists and a table of contents.", { spot: tools, keep: true, secs: 6.5 });
        await T.click(tools, 1200, { hold: true });
        await page.keyboard.press("Escape"); await T.wait(400); await T.done();
      }
      const styles = page.locator(".lib-tabs button").filter({ hasText: "Styles" });
      if (await styles.count()) {
        await T.say("<b>Styles</b> sets how headings and paragraphs look — for this document, or as the house style.", { spot: styles, keep: true });
        await T.click(styles, 1400);
      }
      await T.say("The side panel also has the document's <b>outline</b>, its <b>follow-ups</b> — the open questions — its terms, links and details.", { spot: page.locator(".lib-tabs").first(), secs: 6 });
      const done = page.getByRole("button", { name: "Done editing" });
      await T.say("Everything saves as you type. <b>Done editing</b> goes back to reading.", { spot: done, keep: true, secs: 3.8 });
      await T.click(done, 1000);
    }

    await T.say("<b>New document</b> starts a blank page or a <b>template</b> — an SME interview, a site visit, a walkthrough.", { spot: page.getByRole("button", { name: "New document" }), keep: true });
    await T.click(page.getByRole("button", { name: "New document" }), 1600);
    await page.keyboard.press("Escape"); await T.wait(400);

    await T.card("That's the Library", "Collect · organise · share", "More help: the Handbook → The Library.", 4.5);
  }
};
