import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { brand, brandDark } from '../theme';

const ThemeModeContext = createContext(null);

function systemMode() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const v = localStorage.getItem('galil-site-theme');
      return v === 'dark' || v === 'light' ? v : systemMode();
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    try {
      localStorage.setItem('galil-site-theme', mode);
    } catch {
      /* private browsing etc. */
    }
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within a ThemeModeProvider');
  return ctx;
}

/* The page components style themselves straight off the brand color
   constants (not off MUI's theme.palette), so switching the light/dark mode
   must swap which constants they get — this is that swap. */
export function useBrandColors() {
  const { mode } = useThemeMode();
  return mode === 'dark' ? brandDark : brand;
}
