# GALIL website

A React + [Material UI](https://mui.com/material-ui/getting-started/installation/)
build of the GALIL marketing website (Home, What we do, Careers, Contact),
bilingual in English/Hebrew with RTL support. This is the current website —
it replaced the original static HTML/CSS/JS version.

## Stack

- [Vite](https://vite.dev/) + React
- [Material UI](https://mui.com/material-ui/) (`@mui/material`, `@mui/icons-material`)
- [React Router](https://reactrouter.com/) for the four pages
- `stylis-plugin-rtl` + an RTL Emotion cache for the Hebrew layout

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

## Structure

```
src/
  theme.js                 MUI theme — GALIL brand palette, typography, light/dark.
  lib/
    LanguageContext.jsx     EN/HE state, sets <html lang/dir>, exposes t(en, he).
    ThemeModeContext.jsx     Light/dark state, persisted per device; useBrandColors()
                             hands components the palette for the current mode.
    rtlCache.js              Emotion caches (LTR / RTL via stylis-plugin-rtl).
    useMailtoForm.js         Shared validate-then-mailto logic for the
                             Contact and Careers/CV forms (no backend yet,
                             same as the static site — see root README).
  components/
    Header.jsx, Footer.jsx, Layout.jsx, PageHead.jsx
    GalilLogo.jsx, AssemblyDiagram.jsx   Hero exploded-assembly diagram.
    ClientLogos.jsx         LogoMarquee (the scrolling client strip under the hero)
                            and LogoCloud (floating logos in the "our work" section).
  data/
    clients.js              The clients shown in the logo strip and cloud.
  pages/
    Home.jsx, Services.jsx, Careers.jsx, Contact.jsx
```

Every string in the UI is passed through `t(english, hebrew)` from
`useLanguage()`, mirroring the `data-en`/`data-he` attribute pairs used in
the archived static site's markup.

The header carries a light/dark theme toggle and the EN/HE switch. Page
components read colours through `useBrandColors()` rather than importing the
`brand` constant directly, so they repaint when the theme switches; `theme.js`
exports both the light (`brand`) and dark (`brandDark`) palettes.

### Client logos

`src/data/clients.js` lists the clients shown on the home page — name in
English and Hebrew, sector, and an optional `logo` file. Put logo files
(SVG or PNG, ideally on a transparent background) in `public/logos/` and set
`logo` to the file name; a client without a logo file is shown as a clean
wordmark. Confirm each client's permission before listing them.

Routing uses React Router's `HashRouter` (`/#/services`, `/#/careers`, …) so
the built output is plain static files with no server-side rewrite rules —
it can be dropped into any static host, including GitHub Pages.

## Deployment

`.github/workflows/deploy-pages.yml` builds this app (`npm ci && npm run
build`) and publishes `dist/` at the GitHub Pages root, with the
`Employee Portal/` folder copied in unchanged under `/employee-portal/`.
See the root README.
