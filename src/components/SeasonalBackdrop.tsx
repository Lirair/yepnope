"use client";

import React from "react";
import { useApp } from "@/components/AppProviders";

// Deterministic particles so SSR/hydration and renders are completely stable
const SNOWFLAKES = [
  { left: "6%", size: 10, duration: "11s", delay: "-1s", drift: "18px" },
  { left: "14%", size: 14, duration: "14s", delay: "-6s", drift: "-14px" },
  { left: "23%", size: 9, duration: "9.5s", delay: "-3s", drift: "22px" },
  { left: "34%", size: 13, duration: "13s", delay: "-8s", drift: "-18px" },
  { left: "46%", size: 11, duration: "12s", delay: "-2s", drift: "16px" },
  { left: "57%", size: 15, duration: "15s", delay: "-9s", drift: "-20px" },
  { left: "68%", size: 10, duration: "10.5s", delay: "-4s", drift: "14px" },
  { left: "79%", size: 13, duration: "13.5s", delay: "-7s", drift: "-16px" },
  { left: "88%", size: 11, duration: "11.5s", delay: "-5s", drift: "12px" },
  { left: "94%", size: 9, duration: "9.8s", delay: "-1.5s", drift: "-12px" },
];

const NYE_STARS = [
  { top: "9%", left: "12%", size: 6, duration: "3.2s", delay: "0s" },
  { top: "14%", left: "82%", size: 8, duration: "4.1s", delay: "-1.1s" },
  { top: "24%", left: "26%", size: 5, duration: "3.6s", delay: "-2.3s" },
  { top: "18%", left: "68%", size: 7, duration: "4.4s", delay: "-0.7s" },
  { top: "32%", left: "90%", size: 6, duration: "3.9s", delay: "-1.8s" },
  { top: "38%", left: "8%", size: 7, duration: "4.6s", delay: "-2.9s" },
];

export function SeasonalBackdrop() {
  const { activeSeasonalTheme, themeHydrated } = useApp();

  if (!themeHydrated || activeSeasonalTheme.id === "base") {
    return null;
  }

  const themeId = activeSeasonalTheme.id;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Subtle atmospheric top glow matched to active seasonal theme */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full blur-3xl opacity-[0.14] dark:opacity-[0.18]"
        style={{
          background:
            "radial-gradient(circle, var(--accent-primary) 0%, var(--accent-secondary) 55%, transparent 75%)",
        }}
      />

      {/* Christmas gentle animated snowfall (auto-disabled under prefers-reduced-motion) */}
      {themeId === "natale" &&
        SNOWFLAKES.map((flake, idx) => (
          <span
            key={idx}
            className="seasonal-snowflake absolute -top-6 select-none text-amber-500/45 dark:text-sky-100/55"
            style={
              {
                left: flake.left,
                fontSize: `${flake.size}px`,
                "--snow-duration": flake.duration,
                "--snow-delay": flake.delay,
                "--snow-drift": flake.drift,
              } as React.CSSProperties
            }
          >
            ❄
          </span>
        ))}

      {/* New Year's Eve subtle champagne & star sparkles */}
      {themeId === "capodanno" &&
        NYE_STARS.map((star, idx) => (
          <span
            key={idx}
            className="seasonal-twinkle absolute select-none text-[#FACC15]"
            style={
              {
                top: star.top,
                left: star.left,
                fontSize: `${star.size + 6}px`,
                "--twinkle-duration": star.duration,
                "--twinkle-delay": star.delay,
              } as React.CSSProperties
            }
          >
            ✦
          </span>
        ))}
    </div>
  );
}
