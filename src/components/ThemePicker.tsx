"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProviders";
import {
  SEASONAL_THEMES,
  SEASONAL_THEME_LIST,
  type ThemePreference,
} from "@/lib/themes";

export function ThemePicker() {
  const {
    locale,
    seasonalThemePreference,
    autoSeasonalTheme,
    activeSeasonalTheme,
    setSeasonalThemePreference,
    themeHydrated,
  } = useApp();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (pref: ThemePreference) => {
    setSeasonalThemePreference(pref);
    setOpen(false);
  };

  const autoConfig = SEASONAL_THEMES[autoSeasonalTheme];
  const isFestive = themeHydrated && activeSeasonalTheme.id !== "base";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={locale === "en" ? "Select seasonal theme" : "Scegli tema stagionale"}
        aria-expanded={open}
        title={locale === "en" ? "Seasonal themes" : "Temi stagionali"}
        className={`h-9 rounded-full flex items-center justify-center gap-1.5 surface-panel hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer ${
          isFestive ? "px-2.5" : "w-9"
        }`}
      >
        {isFestive ? (
          <>
            <span className="text-sm leading-none" aria-hidden="true">
              {activeSeasonalTheme.badgeEmoji}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeSeasonalTheme.swatchPrimary }}
            />
          </>
        ) : (
          <Palette className="w-4 h-4 text-accent" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[272px] p-3 rounded-3xl card-elevated z-50"
          >
            <div className="px-1.5 pb-2 flex items-center justify-between">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-muted">
                {locale === "en" ? "Event theme" : "Tema evento"}
              </span>
              <span className="text-[11px] font-semibold text-accent">
                {activeSeasonalTheme.badgeEmoji}{" "}
                {locale === "en"
                  ? activeSeasonalTheme.nameEn
                  : activeSeasonalTheme.name}
              </span>
            </div>

            {/* Automatic option */}
            <button
              type="button"
              onClick={() => handleSelect("auto")}
              className={`w-full mb-2 px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 active:scale-[0.98] transition cursor-pointer ${
                seasonalThemePreference === "auto"
                  ? "bg-accent text-accent-fg shadow-xs"
                  : "bg-surface-muted hover:opacity-85 text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {locale === "en" ? "Automatic" : "Automatico"} ·{" "}
                  {locale === "en" ? autoConfig.nameEn : autoConfig.name}
                </span>
              </span>
              {seasonalThemePreference === "auto" && (
                <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              )}
            </button>

            {/* 6 Theme Pills */}
            <div className="grid grid-cols-2 gap-1.5">
              {SEASONAL_THEME_LIST.map((item) => {
                const isSelected = seasonalThemePreference === item.id;
                const isCurrentlyActive = activeSeasonalTheme.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`px-2.5 py-2 rounded-2xl text-left text-xs font-semibold flex items-center justify-between gap-1.5 border active:scale-[0.97] transition cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/12 text-foreground"
                        : isCurrentlyActive
                        ? "border-[var(--border)] bg-surface-muted/90 text-foreground"
                        : "border-transparent bg-surface-muted/60 hover:bg-surface-muted text-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                        style={{
                          background: `linear-gradient(135deg, ${item.swatchPrimary}, ${item.swatchSecondary})`,
                        }}
                      />
                      <span className="truncate">
                        {locale === "en" ? item.nameEn : item.name}
                      </span>
                    </span>
                    <span className="text-[12px] leading-none shrink-0">
                      {item.badgeEmoji}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
