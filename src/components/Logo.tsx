"use client";

import React from "react";
import { useApp } from "@/components/AppProviders";
import type { SeasonalThemeId } from "@/lib/themes";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  themeOverride?: SeasonalThemeId;
}

export function Logo({ size = "md", themeOverride }: LogoProps) {
  const { activeSeasonalTheme, themeHydrated } = useApp();
  const activeId: SeasonalThemeId =
    themeOverride ?? (themeHydrated ? activeSeasonalTheme.id : "base");

  const iconDim =
    size === "lg" ? "w-11 h-11" : size === "sm" ? "w-6 h-6" : "w-9 h-9";
  const textSize =
    size === "lg"
      ? "text-3xl tracking-tighter"
      : size === "sm"
      ? "text-base tracking-tighter"
      : "text-2xl tracking-tighter";

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={`${iconDim} shrink-0 drop-shadow-xs overflow-visible`}
        aria-hidden="true"
      >
        <g transform="rotate(-11 26 34)">
          <rect
            x="10"
            y="14"
            width="28"
            height="36"
            rx="8"
            style={{ fill: "var(--nope-color, #F43F5E)" }}
          />
          <path
            d="M19 27L29 37M29 27L19 37"
            stroke="#FFFFFF"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </g>
        <g transform="rotate(9 39 30)">
          <rect
            x="25"
            y="11"
            width="28"
            height="36"
            rx="8"
            style={{ fill: "var(--yep-color, #10B981)" }}
          />
          <path
            d="M32.5 29.5L37.2 34.2L46 24.5"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Micro seasonal decorations */}
        {activeId === "natale" && (
          <g transform="translate(33, -3) rotate(12)">
            {/* Subtle Santa hat perched on top-right card */}
            <path d="M2 15C5 4 17 2 24 11L2 15Z" fill="#DC2626" />
            <rect x="0" y="13" width="24" height="5" rx="2.5" fill="#FFFFFF" />
            <circle cx="25" cy="10" r="3.4" fill="#FFFFFF" />
          </g>
        )}

        {activeId === "capodanno" && (
          <g>
            {/* Golden champagne sparkles */}
            <path
              d="M54 5L55.6 9.4L60 11L55.6 12.6L54 17L52.4 12.6L48 11L52.4 9.4L54 5Z"
              fill="#FACC15"
            />
            <circle cx="10" cy="10" r="2.6" fill="#FACC15" />
          </g>
        )}

        {activeId === "san-valentino" && (
          <path
            d="M53 16.5C53 16.5 46 12.2 46 8.3C46 6.2 47.6 4.8 49.5 4.8C50.9 4.8 52.1 5.6 53 6.8C53.9 5.6 55.1 4.8 56.5 4.8C58.4 4.8 60 6.2 60 8.3C60 12.2 53 16.5 53 16.5Z"
            fill="#EC4899"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
        )}

        {activeId === "halloween" && (
          <g>
            {/* Glowing pumpkin accent dot */}
            <circle
              cx="53"
              cy="10"
              r="5.5"
              fill="#F97316"
              stroke="#110E17"
              strokeWidth="1.6"
            />
            <path
              d="M53 4.5C53.5 3 54.6 2.2 56 2"
              stroke="#84CC16"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {activeId === "estate" && (
          <g>
            {/* Bright golden sun badge */}
            <circle
              cx="53"
              cy="10"
              r="5"
              fill="#F59E0B"
              stroke="#FFFFFF"
              strokeWidth="1.6"
            />
            <circle cx="53" cy="10" r="2.2" fill="#FDE047" />
          </g>
        )}
      </svg>

      <span className={`font-display font-extrabold leading-none ${textSize}`}>
        <span className="text-yep">Yep</span>
        <span className="text-nope">Nope</span>
      </span>
    </span>
  );
}
