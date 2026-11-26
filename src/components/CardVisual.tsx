"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CardItem } from "@/types/yepnope";
import { gradientFromText, isAllowedImageUrl } from "@/lib/utils";
import { useApp } from "@/components/AppProviders";

interface CardVisualProps {
  card: CardItem;
  listTitle?: string;
  compact?: boolean;
  interactiveExpand?: boolean;
  infoExpanded?: boolean;
  onToggleInfo?: () => void;
}

export function CardVisual({
  card,
  listTitle,
  compact = false,
  interactiveExpand = false,
  infoExpanded,
  onToggleInfo,
}: CardVisualProps) {
  const { t } = useApp();
  const [imgError, setImgError] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled = typeof infoExpanded === "boolean";
  const expanded = isControlled ? infoExpanded : internalExpanded;

  const toggleExpand = () => {
    if (onToggleInfo) {
      onToggleInfo();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const [gradStart, gradEnd] = card.gradient ?? gradientFromText(card.title);
  const showImage =
    isAllowedImageUrl(card.image) && !imgError && card.category !== "custom";

  // Custom text-only typographic card
  if (card.category === "custom") {
    return (
      <div
        className="relative w-full h-full flex flex-col justify-between p-6 text-white select-none overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${gradStart} 0%, ${gradEnd} 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-25 blur-2xl"
          style={{ background: "#FFFFFF" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full opacity-20 blur-2xl"
          style={{ background: "#000000" }}
        />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/18 backdrop-blur-md border border-white/15">
            <span>{card.emoji || "✨"}</span>
            <span className="truncate max-w-[200px]">
              {listTitle || t.categories.custom.title}
            </span>
          </span>
        </div>

        <div className="relative z-10 my-auto py-4 text-center">
          <h2
            className={`font-display font-extrabold tracking-tight leading-[1.06] drop-shadow-sm break-words ${
              compact
                ? "text-2xl"
                : card.title.length > 26
                ? "text-3xl"
                : "text-4xl"
            }`}
          >
            {card.title}
          </h2>
          {card.subtitle && (
            <p className="mt-3 text-sm sm:text-base text-white/85 font-medium max-w-[28ch] mx-auto">
              {card.subtitle}
            </p>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <div className="w-10 h-1 rounded-full bg-white/35" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none text-white"
      style={{
        background: `linear-gradient(150deg, ${gradStart} 0%, ${gradEnd} 100%)`,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt={card.title}
          onError={() => setImgError(true)}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pb-20">
          <span className="text-7xl drop-shadow-lg">{card.emoji || "✨"}</span>
        </div>
      )}

      {/* Subtle top vignette + crisp bottom-to-top dark gradient for readability */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Top badges */}
      <div className="relative z-10 p-4 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {card.category === "watch" && card.year && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/45 backdrop-blur-md border border-white/15">
              {card.year}
            </span>
          )}
          {card.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/45 backdrop-blur-md border border-white/15"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {card.category === "watch" && typeof card.rating === "number" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-slate-950" />
              {card.rating.toFixed(1)}
            </span>
          )}
          {card.category === "activity" && card.budget && (
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wider bg-white/92 text-slate-950 shadow-sm">
              {card.budget}
            </span>
          )}
        </div>
      </div>

      {/* Bottom text content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pt-12 flex flex-col gap-1.5">
        <h2
          className={`font-display font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-sm ${
            compact ? "text-xl" : "text-[26px] sm:text-[30px]"
          }`}
        >
          {card.title}
        </h2>

        {card.subtitle && (
          <p className="text-sm sm:text-[15px] text-white/85 leading-snug font-medium">
            {card.subtitle}
          </p>
        )}

        {card.description && !expanded && (
          <div className="mt-0.5">
            <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
              {card.description}
            </p>
            {interactiveExpand && card.description.length > 95 && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/95 bg-white/16 hover:bg-white/24 px-3 py-1 rounded-full backdrop-blur-md transition active:scale-[0.97] cursor-pointer"
              >
                <span>{t.room.readMore}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Info Drawer Overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 z-20 p-5 pt-6 rounded-t-[26px] bg-black/82 backdrop-blur-xl border-t border-white/15 flex flex-col gap-2.5 max-h-[72%] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-xl tracking-tight text-white leading-tight">
                  {card.title}
                </h3>
                {card.subtitle && (
                  <p className="text-xs sm:text-sm text-white/75 font-medium mt-0.5">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                aria-label={t.room.readLess}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {card.description && (
              <p className="text-sm text-white/90 leading-relaxed font-normal">
                {card.description}
              </p>
            )}

            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/12 text-white/90 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              className="mt-1 self-start inline-flex items-center gap-1 text-xs font-semibold text-white/85 bg-white/14 hover:bg-white/22 px-3 py-1.5 rounded-full transition cursor-pointer"
            >
              <span>{t.room.readLess}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
