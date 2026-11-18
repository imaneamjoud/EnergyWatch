"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { dictionaries, type Lang, type TranslationKey } from "@/i18n/dictionaries";

const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

interface I18nContextType {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("ei_lang");
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("ei_lang", l);
  }, []);

  const t = useCallback((key: TranslationKey) => dictionaries[lang][key], [lang]);

  const value = useMemo(
    () => ({ lang, locale: LOCALES[lang], setLang, t }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans LanguageProvider");
  return ctx;
}
