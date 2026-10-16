import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('galil-lang') === 'he' ? 'he' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('galil-lang', lang);
    } catch {
      /* private browsing etc. */
    }
  }, [lang]);

  const value = useMemo(() => {
    const t = (en, he) => (lang === 'he' ? he : en);
    return { lang, setLang, dir: lang === 'he' ? 'rtl' : 'ltr', t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
