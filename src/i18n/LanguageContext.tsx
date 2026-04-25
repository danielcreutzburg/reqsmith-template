import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectBrowserLanguage(): Language {
  const stored = localStorage.getItem("reqsmith-lang");
  if (stored === "en" || stored === "de") return stored;

  // Auto-detect from browser
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("en")) return "en";

  // Check all browser languages
  const languages = navigator.languages || [];
  for (const lang of languages) {
    if (lang.startsWith("de")) return "de";
    if (lang.startsWith("en")) return "en";
  }

  return "de"; // default
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectBrowserLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("reqsmith-lang", lang);
  }, []);

  // Set html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      let text: string = translations[language][key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.split(`{{${k}}}`).join(v).split(`{${k}}`).join(v);
        }
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
