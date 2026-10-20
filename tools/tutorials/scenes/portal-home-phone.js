// Tutorial: the Employee Portal on a phone — the home page.
module.exports = {
  user: "u-danny", phone: true, scale: 2,
  viewport: { width: 390, height: 844 },
  warm: ["taskana/index.html#/my"],
  start: "index.html",

  steps: async T => {
    const { page } = T;
    await T.card("Employee Portal on a phone", "The home page", "Every GALIL app in your pocket.", 5);
    await T.say("On a phone, the home page is the same: a greeting, and a <b>tile</b> for each of your apps.", { spot: page.locator("#tile-workdesk") });
    await T.scroll(page.locator("#tile-kb"));
    await T.say("Taskana, the Handbook and the Knowledge Base follow — each with its own numbers.", { spot: page.locator("#tile-taskana") });
    await T.scroll(page.locator(".quick"));
    await T.say("The <b>shortcuts</b> go straight to reporting time, days off, expenses and your tasks.", { spot: page.locator(".quick") });
    await T.say("<b>Install on your phone</b> adds the portal to your home screen, so it opens like an app.", { spot: page.locator(".quick a").filter({ hasText: "Install" }) });
    await T.scroll(page.locator(".hubtop"));
    await T.say("At the top: the save status, the language, light or dark, and your profile.", { spot: page.locator(".hubtop") });
    await T.say("Tap <b>WorkDesk</b> to open it.", { spot: page.locator("#tile-workdesk"), keep: true, secs: 2 });
    await T.click(page.locator("#tile-workdesk"), 1500);
    await T.say("WorkDesk's phone layout: four tabs at the bottom. The house at the top brings you back home.", { spot: page.locator(".mnav"), secs: 4.5 });
    await T.card("That's the portal on a phone", "Every app, one tap away", "More help: the Handbook → The Employee Portal.", 4.5);
  }
};
