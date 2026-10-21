# GALIL Model Studio

A browser application for opening CAD and 3D models, exploring their parts and
setting them up for images — the job Cortona3D RapidManual / RapidCatalog and
SOLIDWORKS Composer are used for when what is needed is pictures of the model
in the right positions.

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
- English and Hebrew (shares the language setting with the Employee Portal).

Keyboard: `F` fit all, `Shift+F` fit selection, `1`–`7` standard views, `H`
hide, `Shift+H` show all, `I` isolate, `T` move, `R` rotate, `Esc` clear the
selection, `Ctrl+O` open, `Ctrl+Shift+S` save image, `Ctrl+A` select all.

## Running it

It must be served over HTTP (browsers do not load ES modules or WebAssembly
from `file://`):

```bash
python3 -m http.server 8000
# http://localhost:8000/Model%20Studio/
```

GitHub Pages publishes it at `/model-studio/`.

## Files

```
index.html            the page
css/studio.css        its styles
js/studio.js          scene, camera, selection, tree, views, images
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
