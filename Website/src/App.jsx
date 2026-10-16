import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { useLanguage } from './lib/LanguageContext';
import { useThemeMode } from './lib/ThemeModeContext';
import { cacheLtr, cacheRtl } from './lib/rtlCache';
import { getTheme } from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Careers from './pages/Careers';
import Contact from './pages/Contact';

export default function App() {
  const { dir } = useLanguage();
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(dir, mode), [dir, mode]);
  const cache = dir === 'rtl' ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </CacheProvider>
  );
}
