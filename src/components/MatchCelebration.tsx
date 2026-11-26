"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  MapPin,
  ShoppingBag,
  RotateCw,
  Plus,
  ExternalLink,
  Sparkles,
  Check,
} from "lucide-react";
import type { CardItem, Participant, Room } from "@/types/yepnope";
import { CardVisual } from "@/components/CardVisual";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProviders";
import {
  buildDeliverooUrl,
  buildGoogleMapsUrl,
  getInitials,
  getPastelAvatar,
  triggerHaptic,
} from "@/lib/utils";

interface MatchCelebrationProps {
  room: Room;
  card: CardItem;
  participants: Participant[];
  onContinue: () => void;
  resuming: boolean;
}

export function MatchCelebration({
  room,
  card,
  participants,
  onContinue,
  resuming,
}: MatchCelebrationProps) {
  const { locale, t, activeSeasonalTheme } = useApp();
  const activeParticipants = participants.filter((p) => p.is_active);
  const isFestive = activeSeasonalTheme.id !== "base";

  useEffect(() => {
    // Celebratory double-pulse haptic feedback on Match
    triggerHaptic([30, 50, 30]);

    const colors = activeSeasonalTheme.confettiColors;
    const shapes = activeSeasonalTheme.confettiShapes ?? ["square", "circle"];

    confetti({
      particleCount: 46,
      spread: 70,
      startVelocity: 34,
      origin: { y: 0.54 },
      colors,
      shapes,
      disableForReducedMotion: true,
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 24,
        angle: 60,
        spread: 52,
        startVelocity: 30,
        origin: { x: 0.08, y: 0.62 },
        colors,
        shapes,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 24,
        angle: 120,
        spread: 52,
        startVelocity: 30,
        origin: { x: 0.92, y: 0.62 },
        colors,
        shapes,
        disableForReducedMotion: true,
      });
    }, 220);

    return () => clearTimeout(timer);
  }, [card.id, activeSeasonalTheme.id, activeSeasonalTheme.confettiColors, activeSeasonalTheme.confettiShapes]);

  const mapsUrl =
    card.category === "food"
      ? buildGoogleMapsUrl(card.searchQuery || card.title)
      : null;
  const deliverooUrl =
    card.category === "food"
      ? buildDeliverooUrl(card.searchQuery || card.title)
      : null;
  const tmdbUrl =
    card.category === "watch" && card.tmdbId
      ? `https://www.themoviedb.org/${card.mediaType === "tv" ? "tv" : "movie"}/${card.tmdbId}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="w-full max-w-[368px] mx-auto flex flex-col items-center pb-10"
    >
      {/* 9:16 Story-Ready Vertical Card with Amber -> Magenta Match Gradient Border */}
      <div className="w-full rounded-[34px] p-[2.5px] match-gradient shadow-[0_24px_56px_-14px_rgba(236,72,153,0.34)]">
        <div className="w-full aspect-[9/15.2] min-h-[530px] rounded-[31.5px] p-4 bg-[#0E0F13] text-white flex flex-col justify-between gap-3.5 relative overflow-hidden">
          {/* Subtle ambient radial glow inside story card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full opacity-25 blur-3xl match-gradient"
          />

          {/* Story Header: "È UN MATCH!" */}
          <div className="relative z-10 text-center pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full match-gradient text-white text-[11px] font-bold tracking-wider uppercase shadow-sm">
              {isFestive ? (
                <span aria-hidden="true">{activeSeasonalTheme.badgeEmoji}</span>
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {isFestive
                  ? `${locale === "en" ? activeSeasonalTheme.nameEn : activeSeasonalTheme.name} · ${t.room.matchSubtitle}`
                  : t.room.matchSubtitle}
              </span>
            </div>
            <h1 className="mt-2 font-display font-extrabold text-[30px] leading-none tracking-tight match-text-gradient">
              {t.room.matchEyebrow}
            </h1>
          </div>

          {/* Framed Winner Image / Poster */}
          <div className="relative z-10 flex-1 min-h-0 w-full rounded-[24px] overflow-hidden ring-1 ring-white/15 shadow-2xl">
            <CardVisual card={card} listTitle={room.settings.title} />
          </div>

          {/* Overlapping Yep Participants Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                {activeParticipants.slice(0, 5).map((p) => {
                  const pastel = getPastelAvatar(p.nickname);
                  return (
                    <span
                      key={p.id}
                      title={p.nickname}
                      style={{
                        backgroundColor: pastel.bg,
                        color: pastel.text,
                      }}
                      className="w-8 h-8 rounded-full border-2 border-[#0E0F13] flex items-center justify-center font-display text-[11px] font-extrabold shadow-xs"
                    >
                      {getInitials(p.nickname)}
                    </span>
                  );
                })}
                {activeParticipants.length > 5 && (
                  <span className="w-8 h-8 rounded-full border-2 border-[#0E0F13] bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                    +{activeParticipants.length - 5}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/85 truncate">
                <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3] shrink-0" />
                <span className="truncate">{t.room.matchSubtitle}</span>
              </span>
            </div>

            <span className="text-[11px] font-bold text-white/60 tabular-nums shrink-0">
              {activeParticipants.length}/{activeParticipants.length}
            </span>
          </div>

          {/* Discrete Watermark Footer for Stories */}
          <div className="relative z-10 pt-2 border-t border-white/10 px-1 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-white/55 truncate">
                {card.category === "custom"
                  ? t.room.userCreatedList
                  : t.room.decidedWith}
              </span>
            </div>
            <Logo size="sm" />
          </div>
        </div>
      </div>

      {/* Primary Contextual CTAs */}
      {mapsUrl && deliverooUrl && (
        <div className="w-full mt-4 grid grid-cols-1 gap-2.5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-display font-extrabold text-[15px] tracking-tight flex items-center justify-center gap-2 yep-glow active:scale-[0.97] transition-transform"
          >
            <MapPin className="w-4 h-4" />
            <span>{t.room.searchMaps}</span>
          </a>
          <a
            href={deliverooUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00CCBC] hover:bg-[#00b5a7] text-slate-950 font-display font-extrabold text-[15px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.room.orderDeliveroo}</span>
          </a>
        </div>
      )}

      {tmdbUrl && (
        <div className="w-full mt-4">
          <a
            href={tmdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl surface-panel font-display font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t.room.openTmdb}</span>
          </a>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="w-full mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onContinue}
          disabled={resuming}
          className="py-3.5 px-3 rounded-2xl surface-panel font-display font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${resuming ? "animate-spin" : ""}`} />
          <span>{t.room.continueSwiping}</span>
        </button>

        <Link
          href="/"
          className="py-3.5 px-3 rounded-2xl bg-foreground text-background font-display font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>{t.room.newRoom}</span>
        </Link>
      </div>
    </motion.div>
  );
}
