# GALIL

The GALIL website and the GALIL Employee Portal.

```
Website/            The public website — React + Material UI, English and Hebrew.
Welcome/            A standalone page inviting employees to the Employee Portal.
Employee Portal/    The Employee Portal — WorkDesk, Taskana, the Handbook and the
                    Knowledge Base behind one sign-in, English and Hebrew.
Model Studio/       Opens CAD and 3D models (STEP, IGES, glTF, OBJ, STL …), shows
                    their parts, sets them up and exports images.
tests/              Browser tests for the Employee Portal and Model Studio (Playwright).
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
| **WorkDesk** | Time (work, sick, vacation) and expense reporting; budgets against recorded hours; people, clients, projects, work orders, assignments and approvals | `index.html`, `workdesk/` |
| **Taskana** | Tasks only — boards, lists, reviews, comments. People, clients, projects and work orders come from WorkDesk; budget and hours-bank indicators show WorkDesk's figures | `taskana/` |
| **Handbook** | The user guide to the portal, WorkDesk and Taskana, role by role | `handbook/` (`index.html` English, `he.html` Hebrew) |
| **Knowledge Base** | Onboarding, company rules, security and training articles | `kb/` |

Also: `install/` — how to put the portal on a phone or computer, and how an
administrator sets it up.

### How the pieces fit

- **One sign-in.** `index.html` is the portal: sign-in (Microsoft Entra ID, or
  email and password), the home page, and WorkDesk at `#/workdesk/<tab>`.
  Taskana, the Handbook and the Knowledge Base read the same session through
  `shared/portal.js` and send people back to the portal when they are not
  signed in.
- **Per-person access.** Each person's portal access — WorkDesk yes/no, a
  Taskana role (Admin, Manager, Member, External, Viewer or none), Handbook
  yes/no, Knowledge Base yes/no — starts from their WorkDesk role and can be
  changed in WorkDesk → Management → People → Portal access.
- **One set of records.** People, clients, projects, work orders, budgets and
  assignments are kept in WorkDesk; Taskana reads them and keeps only the
  tasks. Time is reported in WorkDesk and may name the Taskana task it was for.
- **English and Hebrew.** One switch (EN / עב) changes the whole portal, laid
  out right to left in Hebrew. WorkDesk's Hebrew is in `workdesk/he.js`,
  Taskana's in `taskana/js/he.js`, the Knowledge Base's articles carry both
  languages, and the Handbook has a page per language.
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

A browser application for opening CAD and 3D models and making images of them
in the right positions — parts tree and parts list, show/hide/isolate, move and
rotate parts, explode, section cut, standard views, technical-illustration and
line styles, numbered callouts, saved views, and PNG/JPEG export at any size
(transparent background optional). It reads STEP, IGES and BREP through
OpenCascade (WebAssembly) and glTF, OBJ, STL, 3MF, PLY, FBX, Collada, VRML, 3DS
and AMF; SolidWorks and other native CAD files are saved as STEP first. See
[`Model Studio/README.md`](Model%20Studio/README.md).

```bash
python3 -m http.server 8000
# http://localhost:8000/Model%20Studio/
```

## Tests

```bash
cd tests/workdesk && npm ci && npx playwright install chromium && npm test   # portal home, access, Hebrew, WorkDesk
cd tests/taskana  && npm ci && npx playwright install chromium && npm test   # Taskana in the portal
cd tests/model-studio && npm ci && npx playwright install chromium && npm test  # Model Studio
```

## Deployment

`.github/workflows/deploy-pages.yml` publishes to GitHub Pages on every push
to `main`: the website at the root and the Employee Portal at
`/employee-portal/`, the welcome page (`Welcome/`) at `/welcome/` — the link to
send employees — and Model Studio at `/model-studio/`. `employee-portal-tests.yml`
runs the portal's test suites, `model-studio-tests.yml` Model Studio's, and
`website.yml` lints and builds the website on pull requests.
