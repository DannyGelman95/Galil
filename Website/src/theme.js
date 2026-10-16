import { createTheme } from '@mui/material/styles';

// GALIL brand — Palette A (Continuity) + Noto Sans, per the brand deck.
const brand = {
  paper: '#FBFCF9',
  surface: '#F1F5EC',
  card: '#FFFFFF',
  forest: '#1F3D24',
  forestDeep: '#14301C',
  green: '#8CC63E',
  greenDeep: '#4E7A1C',
  steel: '#6B7A6E',
  rule: '#D9E4D0',
  annot: '#17A3B8',
};

// Dark-theme counterparts — an explicit choice wins over the device default;
// the deep-green sections (footer, track record) stay dark in both themes.
const brandDark = {
  paper: '#0E1710',
  surface: '#16211A',
  card: '#1A261C',
  forest: '#E4EFE0',
  forestDeep: '#0A1209',
  green: '#9FD154',
  greenDeep: '#B6E072',
  steel: '#9AAD96',
  rule: '#2A3A2C',
  annot: '#49C2D4',
};

export { brand, brandDark };

export function getTheme(direction, mode) {
  const b = mode === 'dark' ? brandDark : brand;
  return createTheme({
    direction,
    palette: {
      mode: mode === 'dark' ? 'dark' : 'light',
      background: { default: b.paper, paper: b.card },
      primary: { main: b.green, dark: b.greenDeep, contrastText: mode === 'dark' ? '#0E1B0B' : '#12240F' },
      secondary: { main: b.annot },
      text: { primary: b.forest, secondary: b.steel },
      divider: b.rule,
      error: { main: '#C0392B' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Noto Sans","Noto Sans Hebrew","Segoe UI",Arial,sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.035em' },
      h2: { fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: 20 },
      h4: { fontWeight: 700, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: '0.05em' },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, padding: '13px 24px', fontSize: 15 },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: b.paper },
        },
      },
      // Inputs otherwise render transparent, showing whatever section
      // background sits behind them (e.g. the tinted --surface sections),
      // and their border defaults to MUI's grey rather than the brand rule.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: b.card,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: b.rule },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: b.forest },
          },
        },
      },
    },
  });
}
