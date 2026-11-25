"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemePicker } from "@/components/ThemePicker";
import { useApp } from "@/components/AppProviders";
import { isDemoMode } from "@/lib/roomService";

interface TopBarProps {
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  showModeBadge?: boolean;
  showThemePicker?: boolean;
}

export function TopBar({
  backHref,
  backLabel,
  rightSlot,
  showModeBadge = false,
  showThemePicker = true,
}: TopBarProps) {
  const { locale, toggleLocale, theme, isDarkLocked, toggleTheme, t } = useApp();
  const demo = isDemoMode();

  return (
    <header className="w-full max-w-md mx-auto px-4 pt-3.5 pb-2 flex items-center justify-between gap-2 relative z-30">
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold surface-panel hover:opacity-90 active:scale-[0.97] transition-transform"
            aria-label={backLabel || t.backHome}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel || t.backHome}</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="focus:outline-none active:scale-[0.97] transition-transform inline-flex"
          >
            <Logo size="md" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {rightSlot}
        {showModeBadge && demo && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Demo
          </span>
        )}
        {showThemePicker && <ThemePicker />}
        <button
          type="button"
          onClick={toggleLocale}
          className="h-9 px-3 rounded-full text-xs font-bold uppercase tracking-wide surface-panel hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer"
          aria-label="Cambia lingua"
          title="IT / EN"
        >
          {locale}
        </button>
        {!isDarkLocked && (
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full flex items-center justify-center surface-panel hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer"
            aria-label="Cambia tema chiaro o scuro"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
