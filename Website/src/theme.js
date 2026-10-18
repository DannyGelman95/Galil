import { createTheme } from '@mui/material/styles';

// GALIL brand — navy + orange + Noto Sans. The token names (forest, green)
// predate the navy and orange palette and are kept so components need no change.
const brand = {
  paper: '#F9FAFC',
  surface: '#ECEFF5',
  card: '#FFFFFF',
  forest: '#1F3A66',
  forestDeep: '#182E52',
  green: '#F08A24',
  greenDeep: '#B5600E',
  steel: '#6B707A',
  rule: '#D0D7E4',
  annot: '#17A3B8',
};

// Dark-theme counterparts — an explicit choice wins over the device default;
// the deep-navy sections (footer, track record) stay dark in both themes.
const brandDark = {
  paper: '#0D1118',
  surface: '#151A22',
  card: '#191E27',
  forest: '#E0E6EF',
  forestDeep: '#080C13',
  green: '#F59A3E',
  greenDeep: '#FFB46B',
  steel: '#969EAD',
  rule: '#29303B',
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
      primary: { main: b.green, dark: b.greenDeep, contrastText: '#1F1405' },
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
