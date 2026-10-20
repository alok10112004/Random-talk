import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    const savedTheme = localStorage.getItem('theme');
    if (savedLang && ['en', 'hi'].includes(savedLang)) {
      setLanguage(savedLang);
    }
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Translation function
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        theme,
        changeLanguage,
        changeTheme,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}