"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Clapperboard,
  Compass,
  SlidersHorizontal,
  ArrowUpRight,
  Hash,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useApp } from "@/components/AppProviders";
import type { Category } from "@/types/yepnope";

interface BentoCardConfig {
  id: Category;
  icon: React.ComponentType<{ className?: string }>;
  surfaceClass: string;
  iconWrapClass: string;
  badgeClass: string;
  countLabel?: string;
  isCustom?: boolean;
}

const BENTO_CARDS: BentoCardConfig[] = [
  {
    id: "food",
    icon: UtensilsCrossed,
    surfaceClass:
      "bg-gradient-to-br from-amber-50/95 via-orange-50/75 to-white dark:from-amber-500/[0.14] dark:via-orange-500/[0.06] dark:to-[#181A20] border border-amber-500/20 dark:border-amber-400/18",
    iconWrapClass:
      "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    countLabel: "35",
  },
  {
    id: "watch",
    icon: Clapperboard,
    surfaceClass:
      "bg-gradient-to-br from-violet-50/95 via-indigo-50/75 to-white dark:from-violet-500/[0.16] dark:via-indigo-500/[0.07] dark:to-[#181A20] border border-indigo-500/20 dark:border-indigo-400/18",
    iconWrapClass:
      "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25",
    badgeClass:
      "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
    countLabel: "TMDB",
  },
  {
    id: "activity",
    icon: Compass,
    surfaceClass:
      "bg-gradient-to-br from-sky-50/95 via-cyan-50/75 to-white dark:from-sky-500/[0.15] dark:via-cyan-500/[0.07] dark:to-[#181A20] border border-cyan-500/20 dark:border-cyan-400/18",
    iconWrapClass:
      "bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-cyan-500/25",
    badgeClass:
      "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
    countLabel: "32",
  },
  {
    id: "custom",
    icon: SlidersHorizontal,
    surfaceClass:
      "bg-gradient-to-br from-stone-100/70 via-white to-white dark:from-white/[0.04] dark:via-[#181A20] dark:to-[#181A20] border-2 border-dashed border-slate-300/90 dark:border-white/20",
    iconWrapClass:
      "bg-surface-muted text-foreground border border-[var(--border)] shadow-xs",
    badgeClass:
      "bg-foreground text-background",
    isCustom: true,
  },
];

export default function HomePage() {
  const { locale, t, activeSeasonalTheme, themeHydrated } = useApp();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const isFestive = themeHydrated && activeSeasonalTheme.id !== "base";
  const heroTagline = isFestive
    ? locale === "en"
      ? activeSeasonalTheme.taglineEn
      : activeSeasonalTheme.tagline
    : t.brandTagline;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.length < 4) {
      setCodeError(t.invalidCode);
      return;
    }
    setCodeError("");
    router.push(`/room/${cleaned}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TopBar showModeBadge />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-32 flex flex-col gap-6">
        {/* Hero Intro */}
        <section className="px-0.5 flex flex-col gap-2">
          {isFestive && (
            <motion.div
              key={activeSeasonalTheme.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-[var(--border)] bg-surface/90 shadow-xs"
            >
              <span>{activeSeasonalTheme.badgeEmoji}</span>
              <span className="text-accent">
                {locale === "en"
                  ? activeSeasonalTheme.nameEn
                  : activeSeasonalTheme.name}
              </span>
            </motion.div>
          )}
          <h1 className="font-display text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-[1.1] text-foreground">
            {heroTagline}
          </h1>
        </section>

        {/* 2x2 Bento Grid */}
        <section
          aria-label="Modalità di gioco"
          className="grid grid-cols-2 gap-3.5 my-auto"
        >
          {BENTO_CARDS.map((cat, index) => {
            const Icon = cat.icon;
            const copy = t.categories[cat.id];
            const badgeText = cat.isCustom
              ? t.categories.custom.badge
              : cat.countLabel;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.055,
                  type: "spring",
                  stiffness: 340,
                  damping: 26,
                }}
                className="flex"
              >
                <Link
                  href={`/create/${cat.id}`}
                  id={`category-card-${cat.id}`}
                  className={`group relative w-full min-h-[192px] sm:min-h-[208px] p-4 rounded-3xl shadow-[var(--card-shadow)] flex flex-col justify-between overflow-hidden active:scale-[0.97] transition-transform duration-150 ${cat.surfaceClass}`}
                >
                  {/* Top Row: Expressive Icon + Category Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${cat.iconWrapClass}`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    {badgeText && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-tight shrink-0 ${cat.badgeClass}`}
                      >
                        {cat.isCustom && <Sparkles className="w-2.5 h-2.5" />}
                        {badgeText}
                      </span>
                    )}
                  </div>

                  {/* Bottom Row: Title, Subtitle & Corner Cue */}
                  <div className="mt-5 flex flex-col gap-1">
                    <div className="flex items-end justify-between gap-1.5">
                      <h2 className="font-display font-extrabold text-[19px] sm:text-[20px] tracking-tight leading-[1.15] text-foreground">
                        {copy.title}
                      </h2>
                      <ArrowUpRight className="w-4 h-4 text-muted shrink-0 mb-0.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                    </div>
                    <p className="text-[12px] text-muted font-medium leading-snug line-clamp-2">
                      {copy.subtitle}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>
        {/* Subtle Copyright, Terms & TMDB Attribution Footer */}
        <footer className="text-center pt-1 pb-2 flex flex-col gap-1">
          <p className="text-[11px] font-medium text-muted/80">
            © 2026 YepNope · Carlo Contardi —{" "}
            <Link
              href="/termini"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {t.setup.termsLinkLabel}
            </Link>
          </p>
          <p className="text-[10px] text-muted/65">
            {locale === "en"
              ? "Movie data via TMDB API · Not endorsed or certified by TMDB"
              : "Dati film via API TMDB · Non affiliato né certificato da TMDB"}
          </p>
        </footer>
      </main>

      {/* Fixed Bottom Discrete Pill Bar for Room Code */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none px-4 pt-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        }}
      >
        <div className="w-full max-w-md mx-auto pointer-events-auto">
          {codeError && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 text-center text-xs font-semibold text-[#F43F5E] bg-surface/95 backdrop-blur-md py-1.5 px-3 rounded-full border border-[#F43F5E]/25 shadow-sm"
            >
              {codeError}
            </motion.p>
          )}

          <form
            onSubmit={handleJoinSubmit}
            className="flex items-center gap-2 p-1.5 pl-4 rounded-full bg-surface/92 backdrop-blur-xl border border-[var(--border)] shadow-[0_14px_34px_-12px_rgba(15,23,42,0.22)] dark:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.65)]"
          >
            <Hash className="w-4 h-4 text-accent shrink-0" />
            <input
              id="join-room-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={6}
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                if (codeError) setCodeError("");
              }}
              placeholder={t.joinPlaceholder}
              aria-label={t.joinPrompt}
              className="flex-1 min-w-0 h-10 bg-transparent font-display font-bold tracking-[0.16em] uppercase text-sm text-foreground placeholder:tracking-normal placeholder:font-sans placeholder:font-medium placeholder:text-muted/80 focus:outline-none"
            />
            <button
              type="submit"
              id="join-room-submit"
              className="h-10 px-4 rounded-full bg-accent hover:bg-accent-hover text-accent-fg font-display font-bold text-sm inline-flex items-center gap-1.5 accent-glow active:scale-[0.97] transition-transform cursor-pointer shrink-0"
            >
              <span>{t.joinButton}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.6]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
