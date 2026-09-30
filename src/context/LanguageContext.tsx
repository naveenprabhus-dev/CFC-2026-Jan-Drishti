import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageOption } from '../i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  currentLanguageOption: LanguageOption;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'cfc_app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as LanguageCode;
      }
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      // ignore
    }
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    let text = langDict?.[key];

    if (!text && TRANSLATIONS['en']?.[key]) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn(`[MISSING_TRANSLATION] locale=${language} key=${key}`);
      }
      text = TRANSLATIONS['en'][key];
    } else if (!text) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn(`[MISSING_TRANSLATION] locale=${language} key=${key}`);
      }
      text = key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLanguageOption,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
