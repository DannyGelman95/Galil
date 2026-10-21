# GALIL Model Studio

A browser application for technical documentation from CAD and 3D models — the
work Cortona3D RapidManual / RapidCatalog and SOLIDWORKS Composer are used for:
explore the model, set it up, write assembly, disassembly and maintenance
procedures, animate them and record them as video, build an illustrated parts
catalogue (IPC), and publish it all as an interactive manual (IETM).

Static files only: no build step, no server code, nothing uploaded — files are
read in the browser.

## What it opens

| Kind | Formats |
|---|---|
| CAD (exact geometry, tessellated with OpenCascade) | STEP (`.step`, `.stp`), IGES (`.iges`, `.igs`), BREP |
| 3D meshes | glTF / GLB, OBJ (with its `.mtl` and textures), STL, 3MF, PLY, FBX, Collada (`.dae`), VRML (`.wrl`), 3DS, AMF |

Native SolidWorks (`.sldprt`, `.sldasm`), Inventor, Creo, CATIA, NX, Parasolid,
Composer (`.smg`) and Cortona3D files are closed formats that no browser
library reads. Save them as **STEP AP214 or AP242** (SolidWorks: *File → Save
As → STEP*); part names, colours and the assembly structure come across.
Model Studio says so when one of those files is opened.

Several files can be opened at once (an OBJ with its MTL and textures, a glTF
with its `.bin`): choose them together or drop them together.

## What it does

- **Parts tree** with the assembly structure, part colours, show/hide per node,
  search, and **Parts list** (item numbers and quantities, downloadable as CSV).
- **Select** parts in the view or the tree (Ctrl+click for several, Alt+click
  for the assembly a part belongs to); see the size, triangle count and item
  number; change its **colour** and **opacity**; **hide**, **isolate**, **show all**.
- **Move and rotate** a part or a sub-assembly with handles; **reset** a part or
  everything.
- **Explode** the assembly with a slider.
- **Camera**: orbit, pan, zoom to the cursor, standard views (front, back, left,
  right, top, bottom, isometric), roll by 90°, perspective or orthographic,
  fit all or the selection.
- **Styles**: shaded, shaded with edges, technical illustration, line drawing
  (hidden lines removed), X-ray, wireframe. Edges include silhouettes of curved
  parts.
- **Section cut** along X, Y or Z, with a position slider.
- **Callouts**: numbered balloons that point at parts (the parts-list item
  number, or any text); drag to place, double-click to edit, right-click to delete.
- **Display**: white, grey, gradient, dark or any background colour; light
  level; floor shadow; Z-up models stood upright.
- **Saved views** keep the camera, shown parts, positions, colours, explode,
  style, section, background, floor, light and callouts. They are remembered in
  the browser per model file, can be downloaded as JSON and loaded again, and
  **Images of all views** exports every view as one ZIP.
- **Images**: PNG or JPEG at the screen size, HD, 4K, A4 at 300 dpi or any size
  up to the graphics card's limit, with 1–3× smoothing and an optional
  transparent background. A frame on the screen shows exactly what the image
  will contain; lines and callouts keep their weight at any size.
- **Undo and redo** (Ctrl+Z, Ctrl+Y) for every change to the scene.
- **Move exactly**: move the selection by X/Y/Z in model units, or turn it by
  a number of degrees about an axis — for precise disassembly positions.
- **Part data**: part number, description, unit and notes for each part
  (Selected part panel), shown in the parts list; read them from a CSV file
  (columns Name, Part number, Description, Unit, Notes — English or Hebrew
  headers) and download them with the list.
- English and Hebrew (shares the language setting with the Employee Portal).

## Procedures, animation and video

The storyboard under the view has three tabs.

**Procedures.** A procedure is a list of steps; each step is a picture of the
model (camera, which parts are shown, where they are, colours, explode, style,
cut, callouts) with a title, instructions, a note / caution / warning, the
tools and materials, and how long its motion and pause last. Set the model up
and choose *+ Add step from the screen*; *Update from the screen* replaces a
step's picture. Playing a procedure animates from step to step: parts slide
and turn to their new places, parts that are hidden or shown fade out or in,
the camera flies, and the step text is shown as a caption.

- **Make disassembly steps** writes a first draft from the model: one step per
  part (all copies together), the outermost first, each part sliding out along
  its explode direction as it fades; the largest part stays.
- **Reverse into a new procedure** turns a disassembly into the assembly (and
  the other way): the steps in reverse order, "Remove" becoming "Install".
- **Record video** plays the procedure into an MP4 (or WebM) file at the
  image size, with the step text as captions if wanted.

**Illustrated parts catalogue.** A figure is a picture with numbered callouts
and the list of the parts it shows. *Balloon the visible parts* puts a callout
on every visible item, laid out around the model so leaders do not cross;
*Make figures for each assembly* makes a ballooned figure for the whole model
and for each sub-assembly.

**Views** are saved set-ups to come back to, export as images (all in one ZIP),
or turn into a step or a figure.

The project — procedures, figures, views and part data — is kept in the
browser for each model file, and **Project → Save project file** writes it to
a file to share or to keep with the model.

## Publishing the interactive manual (IETM)

**Publish** makes one HTML file that opens in any browser, also offline and
straight from the disk:

- contents: every procedure and its steps, every IPC figure, the parts list;
- the 3D model, with each step animated from the one before, *Play from here*,
  explode, and parts that can be clicked to see their item, description and
  part number (the row in the parts table lights up, and the other way round);
- the IPC figures with their callouts and parts tables (item, part number,
  description, quantity and unit);
- a print layout — cover, contents, every step with its picture and text, the
  figures and the parts list — so *Print or save as PDF* gives the paper
  manual.

Textures of mesh models are not carried into the manual; colours are.

Keyboard: `F` fit all, `Shift+F` fit selection, `1`–`7` standard views, `H`
hide, `Shift+H` show all, `I` isolate, `T` move, `R` rotate, `Esc` clear the
selection, `Ctrl+O` open, `Ctrl+Shift+S` save image, `Ctrl+A` select all.

## Running it

Model Studio is part of the GALIL Employee Portal: it has a tile on the portal
home page, and people need to be signed in to the portal with Model Studio in
their portal access (on by default for every role except view-only; changed in
WorkDesk → Management → People → Portal access). Without that, a screen sends
them to the portal.

It must be served over HTTP (browsers do not load ES modules or WebAssembly
from `file://`):

```bash
python3 -m http.server 8000      # from the repository root
# http://localhost:8000/Employee%20Portal/  → sign in → Model Studio
```

GitHub Pages publishes it at `/employee-portal/studio/`; the first address,
`/model-studio/`, sends people there.

## Files

```
index.html            the page
css/studio.css        its styles
js/main.js            loads the three parts below
js/studio.js          scene, camera, selection, tree, parts list, states, undo, images
js/story.js           procedures, playing and recording, figures, views, the project
js/publish.js         the interactive manual (IETM) as one HTML file
ietm/                 the manual's page and viewer, filled in by Publish
js/loaders.js         reading files into a three.js hierarchy
js/occt-worker.js     OpenCascade in a web worker (STEP, IGES, BREP)
js/i18n.js            English and Hebrew
js/zip.js             the ZIP writer for "Images of all views"
samples/              the sample assembly and the script that builds it
vendor/               three.js and occt-import-js (see vendor/README.md)
```

## Tests

```bash
cd tests/model-studio && npm ci && npx playwright install chromium && npm test
```
