import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LanguageProvider } from './lib/LanguageContext';
import { ThemeModeProvider } from './lib/ThemeModeContext';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <LanguageProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </LanguageProvider>
    </HashRouter>
  </StrictMode>
);
