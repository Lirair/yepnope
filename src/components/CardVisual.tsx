"use client";

import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import type { CardItem } from "@/types/yepnope";
import { gradientFromText } from "@/lib/utils";
import { useApp } from "@/components/AppProviders";

interface CardVisualProps {
  card: CardItem;
  listTitle?: string;
  compact?: boolean;
  interactiveExpand?: boolean;
}

export function CardVisual({
  card,
  listTitle,
  compact = false,
  interactiveExpand = false,
}: CardVisualProps) {
  const { t } = useApp();
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [gradStart, gradEnd] = card.gradient ?? gradientFromText(card.title);
  const showImage = Boolean(card.image) && !imgError && card.category !== "custom";

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-white/18 backdrop-blur-md">
            <span>{card.emoji || "✨"}</span>
            <span className="truncate max-w-[200px]">
              {listTitle || t.categories.custom.title}
            </span>
          </span>
        </div>

        <div className="relative z-10 my-auto py-4 text-center">
          <h2
            className={`font-display font-bold tracking-[-0.03em] leading-[1.08] drop-shadow-sm break-words ${
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

      {/* Subtle top vignette + rich bottom scrim for crisp legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/88" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/92 via-black/55 to-transparent" />

      {/* Top badges */}
      <div className="relative z-10 p-4 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {card.category === "watch" && card.year && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/50 backdrop-blur-md border border-white/15">
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
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wider bg-white/90 text-slate-950 shadow-sm">
              {card.budget}
            </span>
          )}
        </div>
      </div>

      {/* Bottom text content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pt-10 flex flex-col gap-1.5">
        <h2
          className={`font-display font-bold tracking-[-0.025em] leading-tight text-white drop-shadow-sm ${
            compact ? "text-xl" : "text-2xl sm:text-[28px]"
          }`}
        >
          {card.title}
        </h2>

        {card.subtitle && (
          <p className="text-sm sm:text-[15px] text-white/85 leading-snug font-medium">
            {card.subtitle}
          </p>
        )}

        {card.description && (
          <div className="mt-0.5">
            <p
              className={`text-sm text-white/85 leading-relaxed ${
                expanded ? "max-h-40 overflow-y-auto pr-1" : "line-clamp-3"
              }`}
            >
              {card.description}
            </p>
            {interactiveExpand && card.description.length > 110 && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => !prev);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-white/95 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full backdrop-blur-md transition cursor-pointer"
              >
                {expanded ? (
                  <>
                    <span>{t.room.readLess}</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>{t.room.readMore}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
