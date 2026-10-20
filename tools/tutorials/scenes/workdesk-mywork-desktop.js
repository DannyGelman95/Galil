// Tutorial: WorkDesk's top bar, My assignments and allowances, and My profile, on a computer.
// Eitan Fisch, a technical writer, checks how many hours he has left and asks for more.
module.exports = {
  user: "u-eitan",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const modal = page.locator(".modal").last();

    await T.card("WorkDesk tutorial · on a computer", "My assignments and my profile", "Find your way around the top bar, see the hours you have left, and keep your details up to date.", 5.5);

    await T.say("The <b>top bar</b> is the same on every WorkDesk tab. On the left: <b>Back</b>, and the house — back to the Employee Portal home.", { spot: page.locator(".topbar .backbtn").locator("xpath=..").locator("button").nth(1) });
    await T.say("The <b>tabs</b> below are the parts of WorkDesk your role may open.", { spot: page.locator(".tabs") });
    await T.say("On the right: the <b>light or dark</b> theme, your <b>assignments</b>, the language, the <b>Knowledge Base</b>, the <b>Handbook</b>, and your profile.", { spot: page.getByLabel("My assignments and allowances").locator("xpath=.."), secs: 6.5 });

    await T.say("Let's open <b>My assignments and allowances</b>.", { spot: page.getByLabel("My assignments and allowances"), keep: true, secs: 2.5 });
    await T.click(page.getByLabel("My assignments and allowances"), 1100);
    await T.say("Every project and work order you're assigned to, with your <b>allowance</b> — the hours you may report there.", { spot: modal.locator("table").first(), secs: 5.5 });
    await T.say("<b>Consumed</b>, what's <b>in approval</b>, and what <b>remains</b> — with a bar that turns amber, then red, as you get close.", { spot: modal.locator("thead th").nth(3), secs: 6 });
    const reqBtn = modal.getByRole("button", { name: "Request hours" }).first();
    await T.say("Running out? <b>Request hours</b> asks your manager for more.", { spot: reqBtn, keep: true });
    await T.click(reqBtn, 1000);
    await T.say("Say how many hours, and why. The request goes to the approval queue.", { spot: page.locator(".modal").last(), pad: 2, secs: 4.5 });
    await T.click(page.locator(".modal").last().getByRole("button", { name: "Cancel" }), 600);
    await T.click(modal.getByRole("button", { name: "Close" }).first(), 700);

    const me = page.locator(".topbar .who, .topbar button").filter({ hasText: "Eitan" }).first();
    await T.say("Your <b>name</b> opens <b>My profile</b>.", { spot: me, keep: true, secs: 2.5 });
    await T.click(me, 1000);
    await T.say("Your role, team, manager, contract hours and portal access — and <b>Edit my details</b> for your mobile and birthday.", { spot: page.locator(".modal").last(), pad: 2, secs: 6 });
    await T.say("You can keep your birthday private. Below are the language, the layout on this device, and <b>Sign out</b>.", { spot: page.locator(".modal").last().locator("footer"), secs: 5.5 });
    await T.click(page.locator(".modal").last().getByRole("button", { name: "Close" }).last(), 700);

    await T.card("That's your corner of WorkDesk", "Assignments · allowances · profile", "More help: the Handbook → My assignments and allowances.", 4.5);
  }
};
