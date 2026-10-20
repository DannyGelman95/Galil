// Tutorial: WorkDesk → System administration, on a computer. Tamir Nisman (CEO) looks at
// roles and permissions, company settings, backup and restore, and the audit log.
module.exports = {
  user: "u-tamir",
  viewport: { width: 1600, height: 900 },
  start: "index.html#/workdesk/time",

  steps: async T => {
    const { page } = T;
    const modal = page.locator(".modal").last();
    const side = name => modal.locator("button").filter({ hasText: new RegExp("^" + name + "$") }).first();

    await T.card("WorkDesk tutorial · on a computer", "System administration", "Roles and permissions, company settings, backups and the audit log — for the CEO and Operations.", 5.5);

    await T.say("<b>System administration</b> is behind the gear in the top bar. Only the CEO and Operations managers see it.", { spot: page.getByLabel("System administration"), keep: true });
    await T.click(page.getByLabel("System administration"), 1100);
    await T.say("<b>Roles &amp; permissions</b>: what each of the nine roles may do. <b>Y</b> is allowed, <b>T</b> for their own team, <b>P</b> for their own projects, <b>–</b> not allowed.", { spot: modal.locator("table").first(), secs: 7.5 });
    await T.say("Each person's role is set on Management → People.", { spot: side("Roles & permissions"), secs: 3.2 });

    await T.say("<b>Company settings</b>: the daily and weekly hour limits, the default contract hours, and the <b>month-end close</b> that locks a month for payroll.", { spot: side("Company settings"), keep: true });
    await T.click(side("Company settings"), 1100);
    await T.say("Changes here apply to everyone, from the next entry on.", { spot: modal.locator(".body"), pad: 0, secs: 4 });

    await T.say("<b>Backup &amp; restore</b>: download all of WorkDesk's data as one file, and bring it back if ever needed.", { spot: side("Backup & restore"), keep: true });
    await T.click(side("Backup & restore"), 1100);
    await T.say("The data is also saved automatically after every change — this is for an extra copy you keep yourself.", { spot: modal.locator(".body"), pad: 0, secs: 5 });

    await T.say("The <b>Audit log</b> records every change: who did what, when, and what it was before.", { spot: side("Audit log"), keep: true });
    await T.click(side("Audit log"), 1100);
    await T.say("Search and filter it to answer \"who changed this?\" in seconds.", { spot: modal.locator(".body"), pad: 0, secs: 4 });
    await T.click(modal.getByRole("button", { name: "Close" }).first(), 700);

    await T.card("That's System administration", "Roles · settings · backups · audit", "More help: the Handbook → System administration.", 4.5);
  }
};
