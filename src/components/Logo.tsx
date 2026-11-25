import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const iconDim = size === "lg" ? "w-11 h-11" : size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const textSize =
    size === "lg"
      ? "text-3xl tracking-[-0.04em]"
      : size === "sm"
      ? "text-lg tracking-[-0.03em]"
      : "text-2xl tracking-[-0.035em]";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={`${iconDim} shrink-0 drop-shadow-sm`}
        aria-hidden="true"
      >
        <g transform="rotate(-11 26 34)">
          <rect x="10" y="14" width="28" height="36" rx="7" fill="#F43F5E" />
          <path
            d="M19 27L29 37M29 27L19 37"
            stroke="#FFFFFF"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </g>
        <g transform="rotate(9 39 30)">
          <rect x="25" y="11" width="28" height="36" rx="7" fill="#22C55E" />
          <path
            d="M32.5 29.5L37.2 34.2L46 24.5"
            stroke="#FFFFFF"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      <span className={`font-display font-extrabold leading-none ${textSize}`}>
        <span className="text-[#22C55E]">Yep</span>
        <span className="text-[#F43F5E]">Nope</span>
      </span>
    </span>
  );
}
