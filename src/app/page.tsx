"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Utensils,
  Clapperboard,
  Compass,
  ListChecks,
  ArrowRight,
  Hash,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useApp } from "@/components/AppProviders";
import type { Category } from "@/types/yepnope";

interface CategoryCardConfig {
  id: Category;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  countLabel: string;
}

const CATEGORY_CARDS: CategoryCardConfig[] = [
  {
    id: "food",
    icon: Utensils,
    accentBg: "bg-orange-500/14 dark:bg-orange-500/18",
    accentText: "text-orange-600 dark:text-orange-400",
    countLabel: "35",
  },
  {
    id: "watch",
    icon: Clapperboard,
    accentBg: "bg-sky-500/14 dark:bg-sky-500/18",
    accentText: "text-sky-600 dark:text-sky-400",
    countLabel: "TMDB",
  },
  {
    id: "activity",
    icon: Compass,
    accentBg: "bg-emerald-500/14 dark:bg-emerald-500/18",
    accentText: "text-emerald-600 dark:text-emerald-400",
    countLabel: "32",
  },
  {
    id: "custom",
    icon: ListChecks,
    accentBg: "bg-rose-500/14 dark:bg-rose-500/18",
    accentText: "text-rose-600 dark:text-rose-400",
    countLabel: "DIY",
  },
];

export default function HomePage() {
  const { t } = useApp();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [codeError, setCodeError] = useState("");

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

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-7 flex flex-col justify-between gap-6">
        {/* Hero Intro */}
        <section>
          <h1 className="font-display text-[26px] sm:text-3xl font-extrabold tracking-[-0.035em] leading-[1.12]">
            {t.brandTagline}
          </h1>
        </section>

        {/* 4 Primary Category Cards */}
        <section
          aria-label="Modalità di gioco"
          className="grid grid-cols-1 gap-3 my-auto"
        >
          {CATEGORY_CARDS.map((cat, index) => {
            const Icon = cat.icon;
            const copy = t.categories[cat.id];

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
              >
                <Link
                  href={`/create/${cat.id}`}
                  id={`category-card-${cat.id}`}
                  className="group relative flex items-center gap-4 p-4 sm:p-5 rounded-[26px] card-elevated hover:scale-[1.01] active:scale-[0.985] transition-all duration-150"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${cat.accentBg} ${cat.accentText} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="w-7 h-7 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-lg sm:text-[19px] tracking-[-0.02em] leading-snug">
                        {copy.title}
                      </h2>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-surface-muted text-muted">
                        {cat.countLabel}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted font-medium mt-0.5 line-clamp-1">
                      {copy.subtitle}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-surface-muted flex items-center justify-center text-muted group-hover:bg-[#22C55E] group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>

        {/* Bottom Quick-Join Room Code Bar */}
        <section className="pt-1">
          <form
            onSubmit={handleJoinSubmit}
            className="rounded-[24px] p-3.5 surface-panel flex flex-col gap-2.5"
          >
            <label
              htmlFor="join-room-code"
              className="text-xs font-bold text-muted flex items-center gap-1.5 px-1"
            >
              <Hash className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{t.joinPrompt}</span>
            </label>

            <div className="flex items-center gap-2">
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
                className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-surface-muted font-display font-bold tracking-[0.16em] uppercase text-sm placeholder:tracking-normal placeholder:font-sans placeholder:font-medium placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="submit"
                id="join-room-submit"
                className="h-11 px-5 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0"
              >
                {t.joinButton}
              </button>
            </div>

            {codeError && (
              <p className="text-xs font-semibold text-[#F43F5E] px-1">
                {codeError}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
