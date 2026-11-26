"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ShoppingBag, Plus, Trophy } from "lucide-react";
import type { Room, TopOption } from "@/types/yepnope";
import { useApp } from "@/components/AppProviders";
import {
  buildDeliverooUrl,
  buildGoogleMapsUrl,
  gradientFromText,
  isAllowedImageUrl,
} from "@/lib/utils";

interface NoMatchSummaryProps {
  room: Room;
  topOptions: TopOption[];
}

export function NoMatchSummary({ room, topOptions }: NoMatchSummaryProps) {
  const { t } = useApp();
  const winner = topOptions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto flex flex-col gap-5 pb-10"
    >
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
          <Trophy className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {t.room.noMatchTitle}
        </h1>
        <p className="mt-1 text-sm text-muted font-medium">
          {t.room.noMatchSubtitle}
        </p>
      </div>

      {/* Top 3 Leaderboard */}
      <div className="flex flex-col gap-3">
        {topOptions.map((item, idx) => {
          const [g1, g2] = item.card.gradient ?? gradientFromText(item.card.title);
          const isFirst = idx === 0;

          return (
            <div
              key={item.card.id}
              className={`rounded-3xl p-4 surface-panel transition ${
                isFirst ? "ring-2 ring-[#10B981]/60 shadow-md" : ""
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Thumbnail / Gradient badge */}
                <div
                  className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl text-white font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${g1}, ${g2})`,
                  }}
                >
                  {isAllowedImageUrl(item.card.image) && item.card.category !== "custom" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.card.image}
                      alt={item.card.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{item.card.emoji || `#${idx + 1}`}</span>
                  )}
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                      isFirst
                        ? "bg-[#10B981] text-white"
                        : "bg-black/70 text-white"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>

                {/* Details + Agreement bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-bold text-base tracking-tight truncate">
                      {item.card.title}
                    </h2>
                    <span className="shrink-0 text-sm font-extrabold text-[#10B981]">
                      {item.percentage}%
                    </span>
                  </div>

                  {item.card.subtitle && (
                    <p className="text-xs text-muted truncate mt-0.5">
                      {item.card.subtitle}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(item.percentage, 6)}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${
                          isFirst ? "bg-[#10B981]" : "bg-foreground/40"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-muted shrink-0">
                      {item.yepCount}/{item.totalActive} Yep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contextual CTA for #1 option if food */}
      {room.category === "food" && winner && (
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <a
            href={buildGoogleMapsUrl(winner.card.searchQuery || winner.card.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-display font-extrabold text-[15px] tracking-tight flex items-center justify-center gap-2 yep-glow active:scale-[0.97] transition-transform"
          >
            <MapPin className="w-4 h-4" />
            <span>
              {t.room.searchMaps} ({winner.card.title})
            </span>
          </a>
          <a
            href={buildDeliverooUrl(winner.card.searchQuery || winner.card.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00CCBC] hover:bg-[#00b5a7] text-slate-950 font-display font-extrabold text-[15px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.room.orderDeliveroo}</span>
          </a>
        </div>
      )}

      <Link
        href="/"
        className="w-full py-4 px-5 rounded-2xl bg-foreground text-background font-display font-extrabold text-base tracking-tight flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-transform"
      >
        <Plus className="w-5 h-5" />
        <span>{t.room.newRoom}</span>
      </Link>
    </motion.div>
  );
}
