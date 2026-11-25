"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/yepnope";

type Theme = "light" | "dark";

interface AppContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dictionary;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const savedLocale = localStorage.getItem("yepnope_locale");
        if (savedLocale === "it" || savedLocale === "en") {
          setLocaleState(savedLocale);
        }

        const savedTheme = localStorage.getItem("yepnope_theme");
        if (savedTheme === "dark" || savedTheme === "light") {
          setTheme(savedTheme);
          document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setTheme("dark");
          document.documentElement.classList.add("dark");
        }
      } catch {
        // Ignore storage access errors
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("yepnope_locale", next);
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "it" ? "en" : "it");
  };

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("yepnope_theme", next);
    } catch {
      // ignore
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: getDictionary(locale),
      theme,
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp deve essere usato dentro AppProviders");
  }
  return ctx;
}
