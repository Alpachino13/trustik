"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "ar" | "en";
type Translations = typeof fr;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  isRTL: boolean;
}

const dictionaries: Record<Locale, Translations> = { fr, ar, en };

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("trustik_locale") as Locale | null;
    if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
      setLocaleState(saved);
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = saved;
    }
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem("trustik_locale", newLocale);
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
  }

  const isRTL = locale === "ar";
  const t = dictionaries[locale] || fr;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "fr" as Locale,
      setLocale: () => {},
      t: fr,
      isRTL: false,
    };
  }
  return ctx;
}
