"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import {
  COLOR_SCHEME_STORAGE_KEY,
  SEASONAL_THEMES,
  SEASONAL_THEME_STORAGE_KEY,
  getAutoSeasonalTheme,
  isValidSeasonalThemeId,
  type SeasonalThemeConfig,
  type SeasonalThemeId,
  type ThemePreference,
} from "@/lib/themes";
import type { Locale } from "@/types/yepnope";

type ColorMode = "light" | "dark";

interface AppContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dictionary;
  theme: ColorMode;
  isDarkLocked: boolean;
  toggleTheme: () => void;
  seasonalThemePreference: ThemePreference;
  autoSeasonalTheme: SeasonalThemeId;
  activeSeasonalTheme: SeasonalThemeConfig;
  setSeasonalThemePreference: (pref: ThemePreference) => void;
  roomThemeOverride: SeasonalThemeId | null;
  setRoomThemeOverride: (themeId: SeasonalThemeId | null) => void;
  themeHydrated: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function resolveEffectiveColorMode(
  seasonalId: SeasonalThemeId,
  savedColorMode: ColorMode | null,
  systemPrefersDark: boolean
): ColorMode {
  const cfg = SEASONAL_THEMES[seasonalId];
  if (cfg.colorMode === "force-dark") return "dark";
  if (cfg.colorMode === "default-dark") {
    return savedColorMode === "light" ? "light" : "dark";
  }
  if (savedColorMode) return savedColorMode;
  return systemPrefersDark ? "dark" : "light";
}

function applyThemeToDom(seasonalId: SeasonalThemeId, mode: ColorMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", seasonalId);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");
  const [savedColorMode, setSavedColorMode] = useState<ColorMode | null>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  const [autoSeasonalTheme, setAutoSeasonalTheme] =
    useState<SeasonalThemeId>("base");
  const [seasonalThemePreference, setSeasonalThemePreferenceState] =
    useState<ThemePreference>("auto");
  const [urlThemeOverride, setUrlThemeOverride] =
    useState<SeasonalThemeId | null>(null);
  const [roomThemeOverride, setRoomThemeOverrideState] =
    useState<SeasonalThemeId | null>(null);
  const [themeHydrated, setThemeHydrated] = useState<boolean>(false);

  // Hydrate locale, color mode, URL ?theme override, localStorage pref, and date-based theme
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;

      const detectedAuto = getAutoSeasonalTheme(new Date());
      setAutoSeasonalTheme(detectedAuto);

      try {
        const savedLocale = localStorage.getItem("yepnope_locale");
        if (savedLocale === "it" || savedLocale === "en") {
          setLocaleState(savedLocale);
        }

        const storedMode = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
        if (storedMode === "dark" || storedMode === "light") {
          setSavedColorMode(storedMode);
        }

        const prefersDark = Boolean(
          window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
        setSystemPrefersDark(prefersDark);

        const storedSeasonal = localStorage.getItem(SEASONAL_THEME_STORAGE_KEY);
        if (
          storedSeasonal === "auto" ||
          isValidSeasonalThemeId(storedSeasonal)
        ) {
          setSeasonalThemePreferenceState(storedSeasonal);
        }

        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get("theme");
        if (isValidSeasonalThemeId(urlParam)) {
          setUrlThemeOverride(urlParam);
        }
      } catch {
        // Ignore storage or URL errors
      }

      setThemeHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Priority: 1) URL ?theme override, 2) Room theme_id (when inside a room), 3) Manual pref, 4) Auto date
  const resolvedSeasonalId: SeasonalThemeId = useMemo(() => {
    if (urlThemeOverride) return urlThemeOverride;
    if (roomThemeOverride) return roomThemeOverride;
    if (seasonalThemePreference !== "auto") return seasonalThemePreference;
    return autoSeasonalTheme;
  }, [
    urlThemeOverride,
    roomThemeOverride,
    seasonalThemePreference,
    autoSeasonalTheme,
  ]);

  const activeSeasonalTheme = SEASONAL_THEMES[resolvedSeasonalId];
  const isDarkLocked = activeSeasonalTheme.colorMode === "force-dark";

  const effectiveColorMode: ColorMode = useMemo(() => {
    if (!themeHydrated) return "light";
    return resolveEffectiveColorMode(
      resolvedSeasonalId,
      savedColorMode,
      systemPrefersDark
    );
  }, [themeHydrated, resolvedSeasonalId, savedColorMode, systemPrefersDark]);

  // Keep <html data-theme="..." class="dark"> in lockstep once hydrated
  useEffect(() => {
    if (!themeHydrated) return;
    applyThemeToDom(resolvedSeasonalId, effectiveColorMode);
  }, [themeHydrated, resolvedSeasonalId, effectiveColorMode]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("yepnope_locale", next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "it" ? "en" : "it");
  }, [locale, setLocale]);

  const toggleTheme = useCallback(() => {
    if (isDarkLocked) return;
    const next: ColorMode = effectiveColorMode === "dark" ? "light" : "dark";
    setSavedColorMode(next);
    applyThemeToDom(resolvedSeasonalId, next);
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, [effectiveColorMode, isDarkLocked, resolvedSeasonalId]);

  const setSeasonalThemePreference = useCallback(
    (pref: ThemePreference) => {
      setSeasonalThemePreferenceState(pref);
      // Clear URL override and room override when the user explicitly selects a theme manually
      setUrlThemeOverride(null);
      setRoomThemeOverrideState(null);

      const nextId = pref === "auto" ? autoSeasonalTheme : pref;
      const nextMode = resolveEffectiveColorMode(
        nextId,
        savedColorMode,
        systemPrefersDark
      );
      applyThemeToDom(nextId, nextMode);

      try {
        localStorage.setItem(SEASONAL_THEME_STORAGE_KEY, pref);
        // Clean ?theme= param from URL without reloading so picker changes persist cleanly
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.has("theme")) {
            url.searchParams.delete("theme");
            window.history.replaceState({}, "", url.toString());
          }
        }
      } catch {
        // ignore
      }
    },
    [autoSeasonalTheme, savedColorMode, systemPrefersDark]
  );

  const setRoomThemeOverride = useCallback(
    (themeId: SeasonalThemeId | null) => {
      setRoomThemeOverrideState(themeId);
    },
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: getDictionary(locale),
      theme: effectiveColorMode,
      isDarkLocked,
      toggleTheme,
      seasonalThemePreference,
      autoSeasonalTheme,
      activeSeasonalTheme,
      setSeasonalThemePreference,
      roomThemeOverride,
      setRoomThemeOverride,
      themeHydrated,
    }),
    [
      locale,
      setLocale,
      toggleLocale,
      effectiveColorMode,
      isDarkLocked,
      toggleTheme,
      seasonalThemePreference,
      autoSeasonalTheme,
      activeSeasonalTheme,
      setSeasonalThemePreference,
      roomThemeOverride,
      setRoomThemeOverride,
      themeHydrated,
    ]
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
