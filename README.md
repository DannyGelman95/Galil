# GALIL

The GALIL website and the GALIL Employee Portal.

```
Website/            The public website — React + Material UI, English and Hebrew.
Welcome/            A standalone page inviting employees to the Employee Portal.
Employee Portal/    The Employee Portal — WorkDesk, Taskana, the Handbook, the
                    Knowledge Base, Model Studio and HR behind one sign-in,
                    English and Hebrew.
tests/              Browser tests for the Employee Portal, HR and Model Studio (Playwright).
docs/               Brand material; deprecated documents and films of the old apps.
```

## Website

A Vite + React + Material UI site (Home, What we do, Careers, Contact), with a
scrolling strip and a floating cloud of client logos on the home page. See
[`Website/README.md`](Website/README.md).

```bash
cd Website
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

## Employee Portal

One application for GALIL's employees. People sign in once, on the portal's
home page, and see a tile for each product their access includes:

| Product | What it is for | Folder |
|---|---|---|
| **WorkDesk** | Time (work, sick, vacation) and expense reporting, with a shift QR code for the desk — the first scan starts the timer, the second ends the shift and asks what the time was for (Management → Shift QR code prints it); budgets against recorded hours; people, clients, projects, work orders, assignments and approvals | `index.html`, `workdesk/` |
| **Taskana** | Tasks only — boards, lists, reviews, comments. People, clients, projects and work orders come from WorkDesk; budget and hours-bank indicators show WorkDesk's figures | `taskana/` |
| **Handbook** | The user guide to the portal, WorkDesk and Taskana, role by role | `handbook/` (`index.html` English, `he.html` Hebrew) |
| **Knowledge Base** | Onboarding, company rules, security and training articles | `kb/` |
| **Model Studio** | CAD and 3D models: parts, images, assembly and disassembly procedures with animation and video, illustrated parts catalogues, interactive manuals (IETM) | `studio/` |
| **HR** | Company news (likes, comments, pinned and scheduled posts); events with RSVPs, a calendar and calendar files; surveys (anonymous or named, five kinds of question, results and CSV); performance reviews (cycles, self-assessment, manager review, acknowledgement); the people directory with birthdays and work anniversaries; recognition (kudos) | `hr/` |
| **Defense News** | Headlines about IAI, Elbit Systems, Rafael, Aeronautics, Controp, Tomer, UVision, the Israel MOD and the wider Israeli defense industry, from Google News in English and Hebrew; filter by company, language and search. Open to everyone signed in. `tools/defense-news.js` builds `news/feed.json` on every Pages deployment and every two hours | `news/` |

Also: `install/` — how to put the portal on a phone or computer, and how an
administrator sets it up.

### How the pieces fit

- **One sign-in.** `index.html` is the portal: sign-in (Microsoft Entra ID, or
  email and password), the home page, and WorkDesk at `#/workdesk/<tab>`.
  Taskana, the Handbook, the Knowledge Base, Model Studio and HR read the same session through
  `shared/portal.js` and send people back to the portal when they are not
  signed in.
- **Per-person access.** Each person's portal access — WorkDesk yes/no, a
  Taskana role (Admin, Manager, Member, External, Viewer or none), Handbook
  yes/no, Knowledge Base yes/no, Model Studio yes/no, an HR role (Admin, Member
  or none — the CEO, Operations Managers and the office are HR admins,
  contractors have no HR) — starts from their WorkDesk role and can be
  changed in WorkDesk → Management → People → Portal access.
- **One set of records.** People, clients, projects, work orders, budgets and
  assignments are kept in WorkDesk; Taskana reads them and keeps only the
  tasks. Time is reported in WorkDesk and may name the Taskana task it was for.
- **English and Hebrew.** One switch (EN / עב) changes the whole portal, laid
  out right to left in Hebrew. WorkDesk's Hebrew is in `workdesk/he.js`,
  Taskana's in `taskana/js/he.js`, the Knowledge Base's articles carry both
  languages, and the Handbook has a page per language.
- **HR's data.** HR keeps its own data file (`hr-data.json`) where `config.js`
  says — the `hr-data` branch on GitHub, the OneDrive HR folder, or this
  browser — and reads people, managers and birthdays from WorkDesk. Saves
  merge record by record when two people save at once. An anonymous survey
  stores who answered apart from the answers, which carry no name or time.
- **Settings.** `config.js` holds everything a deployment needs: where the data
  lives (`github`, `onedrive` or `local`), the GitHub repository and branches,
  and the Microsoft Entra application. See the install guide's administrator
  section.

### Running it locally

The portal is static files. Serve the repository root and open
`Employee Portal/index.html`:

```bash
python3 -m http.server 8000
# http://localhost:8000/Employee%20Portal/
```

To try it without GitHub or Microsoft, choose **Connection settings… → This
browser only** on the sign-in screen; the demonstration accounts use the
password `GalilWorkdesk1` (for example `danny.gelman@galiltc.co.il`).

## Model Studio

A browser application for technical documentation from CAD and 3D models:
parts tree and parts list with part numbers, show/hide/isolate, move and rotate
parts, explode, section cut, technical-illustration and line styles, callouts,
images at any size; assembly and disassembly procedures that play as
animations and record as video; an illustrated parts catalogue; and Publish,
which makes an offline interactive manual (IETM) with a print layout for PDF. It reads STEP, IGES and BREP through
OpenCascade (WebAssembly) and glTF, OBJ, STL, 3MF, PLY, FBX, Collada, VRML, 3DS
and AMF; SolidWorks and other native CAD files are saved as STEP first. See
[`Employee Portal/studio/README.md`](Employee%20Portal/studio/README.md).

It is part of the Employee Portal (a tile on the home page, and a Model Studio
choice in each person's portal access, on by default for every role but
view-only). It is for computers: phones and tablets get no tile, and the
page asks for a computer. Sign in to the portal first, then open it from its tile, or at
`Employee Portal/studio/` on the same server:

```bash
python3 -m http.server 8000
# http://localhost:8000/Employee%20Portal/  → sign in → Model Studio
```

## Tests

```bash
cd tests/workdesk && npm ci && npx playwright install chromium && npm test   # portal home, access, Hebrew, WorkDesk
cd tests/taskana  && npm ci && npx playwright install chromium && npm test   # Taskana in the portal
cd tests/hr       && npm ci && npx playwright install chromium && npm test   # HR
cd tests/model-studio && npm ci && npx playwright install chromium && npm test  # Model Studio
```

## Deployment

`.github/workflows/deploy-pages.yml` publishes to GitHub Pages on every push
to `main`: the website at the root and the Employee Portal at
`/employee-portal/`, the welcome page (`Welcome/`) at `/welcome/` — the link to
send employees. Model Studio is at `/employee-portal/studio/`; its first address,
`/model-studio/`, sends people there. `employee-portal-tests.yml`
runs the portal's test suites (WorkDesk, Taskana and HR), `model-studio-tests.yml` Model Studio's, and
`website.yml` lints and builds the website on pull requests.
