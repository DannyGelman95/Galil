// Tutorial: WorkDesk on a phone — More: approvals, my assignments, my profile and settings.
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const back = () => T.click(page.getByRole("button", { name: "‹ More" }), 900);

    await T.card("WorkDesk on a phone", "More", "Approvals, your assignments, your profile and settings.", 5);

    await T.click(page.locator(".mnav button").filter({ hasText: "More" }), 1000);
    await T.say("<b>More</b> has everything else, grouped: WorkDesk, the rest of the Employee Portal, and settings.", { spot: page.locator(".mgroup").first() });

    await T.say("<b>Approvals</b> — the number is how many requests wait for you.", { spot: page.locator("#more-approvals"), keep: true, secs: 3 });
    await T.click(page.locator("#more-approvals"), 1100);
    await T.say("Swipe the filter row sideways for each type. Each card has the numbers you need, and the four actions: <b>Approve</b>, <b>Edit &amp; approve</b>, <b>Decline</b>, <b>Request info</b>.", { spot: page.locator(".apcard").first(), secs: 7 });
    await back();

    await T.say("<b>My assignments and allowances</b>: how many hours you have left on each project.", { spot: page.locator("#more-mywork"), keep: true, secs: 3.2 });
    await T.click(page.locator("#more-mywork"), 1100);
    await T.say("Running low? <b>Request hours</b> asks your manager for more.", { spot: page.locator("#m-mywork .mcard").first(), secs: 4 });
    await back();

    await T.say("<b>My profile</b>: your role, team, manager and contract — and Edit my details, and Sign out.", { spot: page.locator("#more-profile"), keep: true, secs: 4 });
    await T.click(page.locator("#more-profile"), 1100);
    await T.scroll(page.getByRole("button", { name: "Sign out" }));
    await T.wait(800);
    await back();

    await T.say("The <b>Employee Portal</b> group opens your tasks, the Library, the Knowledge Base and this Handbook.", { spot: page.locator(".mgroup").nth(1), secs: 4.5 });
    await T.scroll(page.locator(".mgroup").last());
    await T.say("<b>Language</b>, and the <b>desktop layout</b> — for the Dashboard and Management, best on a bigger screen.", { spot: page.locator(".mgroup").last(), secs: 5 });

    await T.card("That's More on a phone", "Everything else, one tap away", "More help: the Handbook → Finding your way around.", 4.5);
  }
};
