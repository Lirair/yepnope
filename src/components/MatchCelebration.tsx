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
} from "lucide-react";
import type { CardItem, Participant, Room } from "@/types/yepnope";
import { CardVisual } from "@/components/CardVisual";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProviders";
import {
  buildDeliverooUrl,
  buildGoogleMapsUrl,
  getInitials,
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
  const { t } = useApp();
  const activeParticipants = participants.filter((p) => p.is_active);

  useEffect(() => {
    const colors = ["#22C55E", "#F43F5E", "#FACC15", "#38BDF8", "#FFFFFF"];

    confetti({
      particleCount: 55,
      spread: 72,
      origin: { y: 0.58 },
      colors,
      disableForReducedMotion: true,
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 32,
        angle: 60,
        spread: 55,
        origin: { x: 0.08, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 32,
        angle: 120,
        spread: 55,
        origin: { x: 0.92, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
    }, 240);

    return () => clearTimeout(timer);
  }, [card.id]);

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
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 25 }}
      className="w-full max-w-[380px] mx-auto flex flex-col items-center pb-8"
    >
      {/* 9:16 Story-ready vertical card frame (optimized for screenshots / IG & WhatsApp Stories) */}
      <div className="w-full rounded-[32px] p-3.5 bg-[#0D0F12] text-white shadow-2xl border border-white/10">
        {/* Story header */}
        <div className="px-2 pt-1 pb-3 flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#22C55E] font-display font-extrabold text-xs tracking-[0.14em] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.room.matchEyebrow}</span>
            </div>
            <p className="text-xs text-white/70 font-medium mt-0.5">
              {t.room.matchSubtitle} ({activeParticipants.length}/{activeParticipants.length})
            </p>
          </div>

          <div className="flex -space-x-2">
            {activeParticipants.slice(0, 5).map((p) => (
              <span
                key={p.id}
                title={p.nickname}
                style={{ backgroundColor: p.avatar_color }}
                className="w-7 h-7 rounded-full border-2 border-[#0D0F12] flex items-center justify-center text-[10px] font-extrabold text-white"
              >
                {getInitials(p.nickname)}
              </span>
            ))}
          </div>
        </div>

        {/* Winning Card visual */}
        <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden">
          <CardVisual card={card} listTitle={room.settings.title} />
        </div>

        {/* Story footer watermark */}
        <div className="pt-3 pb-1 px-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/60">
            {t.room.decidedWith}
          </span>
          <Logo size="sm" />
        </div>
      </div>

      {/* Contextual CTAs */}
      {mapsUrl && deliverooUrl && (
        <div className="w-full mt-4 grid grid-cols-1 gap-2.5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#22C55E]/25 active:scale-[0.98] transition"
          >
            <MapPin className="w-4 h-4" />
            <span>{t.room.searchMaps}</span>
          </a>
          <a
            href={deliverooUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00CCBC] hover:bg-[#00b5a7] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
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
            className="w-full py-3.5 px-4 rounded-2xl surface-panel font-bold text-sm flex items-center justify-center gap-2 hover:opacity-85 active:scale-[0.98] transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{t.room.openTmdb}</span>
          </a>
        </div>
      )}

      {/* Next Actions */}
      <div className="w-full mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onContinue}
          disabled={resuming}
          className="py-3.5 px-3 rounded-2xl surface-panel font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-85 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${resuming ? "animate-spin" : ""}`} />
          <span>{t.room.continueSwiping}</span>
        </button>

        <Link
          href="/"
          className="py-3.5 px-3 rounded-2xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.room.newRoom}</span>
        </Link>
      </div>
    </motion.div>
  );
}
