// Tutorial: signing in to the Employee Portal and creating an account, on a computer.
module.exports = {
  user: null,
  viewport: { width: 1600, height: 900 },
  start: "index.html",

  steps: async T => {
    const { page } = T;
    const card = page.locator(".authcard").first();
    const go = card.locator(".btn.p").last();

    await T.card("Employee Portal tutorial · on a computer", "Signing in and signing up", "One sign-in for WorkDesk, Taskana, the Handbook and the Knowledge Base.", 5.5);

    await T.say("This is the Employee Portal's <b>sign-in</b> page — one sign-in for every GALIL app.", { spot: card, pad: 4 });
    await T.say("With a company Microsoft account, use <b>Sign in with Microsoft</b>. Microsoft Authenticator confirms it's you.", { spot: page.getByRole("button", { name: /Sign in with Microsoft/ }) });
    await T.say("Or use your <b>company email</b> and <b>password</b>. <b>Forgot password</b> sends you a link to set a new one.", { spot: page.locator("#si-email").locator("xpath=../..") });
    await T.say("The <b>language</b> switch works here already — English or Hebrew.", { spot: card.locator(".row").filter({ hasText: "Language" }).first() });

    /* sign up */
    await T.say("New at GALIL? <b>Create an account</b> takes four short steps.", { spot: page.getByRole("button", { name: "Create an account" }), keep: true });
    await T.click(page.getByRole("button", { name: "Create an account" }), 1000);
    await T.say("Step 1 — <b>who you are</b>: your name, company email, a password (or link Microsoft instead), and your mobile.", { spot: card.locator(".fld").first().locator("xpath=.."), keep: true });
    await T.type(T.field("Full name (English)"), "Noa Bar", { hold: true });
    await T.type(T.field("Company email"), "noa.bar@galiltc.co.il", { hold: true });
    await T.fill(T.field("Password"), "GalilWorkdesk1x", { hold: true });
    await T.fill(T.field("Confirm password"), "GalilWorkdesk1x", { hold: true });
    await T.type(T.field("Mobile number"), "052-123 4567");
    await T.click(go, 1000);
    await T.say("Step 2 — the <b>role</b> you ask for. Employee is the default; anything above Team Lead needs an administrator's approval.", { spot: card, pad: 2, secs: 6 });
    await T.click(go, 1000);
    await T.say("Step 3 — your <b>profile</b>: job title, department, team, manager and working hours.", { spot: card, pad: 2, keep: true });
    await T.type(T.field("Job title"), "Technical Writer", { hold: true });
    await T.type(T.field("Department"), "Civil Division");
    await T.click(go, 1000);
    await T.say("Step 4 — check everything, accept the usage policy, and create the account.", { spot: card.locator("input[type=checkbox]").first().locator("xpath=.."), keep: true });
    const accept = card.locator("input[type=checkbox]");
    for (let i = 0; i < await accept.count(); i++) await T.click(accept.nth(i), 300, { hold: true });
    await T.click(go, 1300);
    await T.say("The account now waits for <b>activation</b>: the CEO or an Operations Manager confirms the role, sets the team and projects — and you get an email.", { spot: card, pad: 2, secs: 7 });
    await T.click(card.getByRole("button", { name: "Sign out" }), 1000);

    /* sign in */
    await T.say("Once you're active, sign in with your email and password.", { spot: page.locator("#si-email").locator("xpath=../.."), keep: true });
    await T.type(page.locator("#si-email"), "danny.gelman@galiltc.co.il", { hold: true });
    await T.fill(page.locator("#si-pw"), "GalilWorkdesk1", { hold: true });
    await T.click(page.getByRole("button", { name: "Sign in", exact: true }), 1600);
    await T.say("And you're on the portal's <b>home page</b>. You stay signed in on this device until you sign out, or after 12 hours away.", { spot: page.locator("#portal-home .tiles"), secs: 6.5 });

    await T.card("That's signing in", "One sign-in, every app", "More help: the Handbook → Signing in and signing up.", 4.5);
  }
};
