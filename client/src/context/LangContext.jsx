import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

const langs = { en, ar };
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('agencyos_lang') || 'en');
  const isRTL = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('agencyos_lang', lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key) => langs[lang]?.[key] || langs['en']?.[key] || key;
  const toggle = () => setLang(l => l === 'en' ? 'ar' : 'en');

  return (
    <LangContext.Provider value={{ lang, isRTL, t, toggle, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
