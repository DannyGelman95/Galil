// Tutorial: the Employee Portal home page, on a computer. Danny Gelman starts his day.
module.exports = {
  user: "u-danny",
  viewport: { width: 1600, height: 900 },
  warm: ["taskana/index.html#/my"],
  start: "index.html",

  steps: async T => {
    const { page } = T;
    const tile = k => page.locator("#tile-" + k);

    await T.card("Employee Portal tutorial · on a computer", "The Employee Portal home page", "Where every working day starts: your apps, your numbers and your shortcuts.", 5.5);

    await T.say("After signing in you land here. The greeting and today's date — and below, a <b>tile</b> for each app your account includes.", { spot: page.locator(".hello") });
    await T.say("<b>WorkDesk</b>: time, expenses, budgets and approvals. The tile shows your hours this week and what waits for your approval.", { spot: tile("workdesk") });
    await T.say("<b>Taskana</b>: your tasks and boards — with your role there, your open tasks and anything overdue.", { spot: tile("taskana") });
    await T.say("The <b>Handbook</b> explains every screen, role by role. The <b>Knowledge Base</b> has onboarding, company rules and training.", { spot: tile("handbook").locator("xpath=..") });
    await T.say("An app your account doesn't include shows a lock. Your administrator can change that.", { spot: page.locator(".tiles"), secs: 4.5 });
    const bday = page.locator("#home-birthdays");
    if (await bday.count()) await T.say("Colleagues with a <b>birthday</b> this week are reminded up here 🎂", { spot: bday });
    await T.say("The <b>shortcuts</b> go straight to the everyday things: report time, ask for days off, expenses, approvals, your tasks.", { spot: page.locator(".quick") });
    await T.say("<b>Install on your phone</b> shows how to add the portal to your home screen, like an app.", { spot: page.locator(".quick a").filter({ hasText: "Install" }) });

    await T.say("At the top: the <b>language</b> — English or Hebrew for the whole portal…", { spot: page.locator(".hubtop .lang, .hubtop [role=group]").first(), keep: true });
    await T.click(page.locator(".hubtop").getByRole("button", { name: "עב" }), 1600);
    await T.click(page.locator(".hubtop").getByRole("button", { name: "EN" }), 1200);
    await T.say("…the <b>light or dark</b> theme…", { spot: page.locator(".hubtop").getByLabel(/Switch to the dark theme/), keep: true, secs: 2 });
    await T.click(page.locator(".hubtop").getByLabel(/Switch to the dark theme/), 1500);
    await T.click(page.locator(".hubtop").getByLabel(/Switch to the light theme/), 1000);
    await T.say("…and your <b>profile</b>. <b>Sign out</b> is next to the greeting.", { spot: page.locator(".hubtop .who") });

    await T.say("Click a tile to open its app. Let's open <b>WorkDesk</b>.", { spot: tile("workdesk"), keep: true, secs: 2.5 });
    await T.click(tile("workdesk"), 1500);
    await T.say("The house at the top left always brings you back home.", { spot: page.locator("#to-portal"), secs: 3.5 });

    await T.card("That's the home page", "Every app, one place", "More help: the Handbook → The Employee Portal.", 4.5);
  }
};
