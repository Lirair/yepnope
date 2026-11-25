"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Check, X } from "lucide-react";
import type { CardItem } from "@/types/yepnope";
import { CardVisual } from "@/components/CardVisual";
import { useApp } from "@/components/AppProviders";

interface SwipeDeckProps {
  cards: CardItem[];
  currentIndex: number;
  listTitle?: string;
  onSwipe: (card: CardItem, isYep: boolean) => void;
  disabled?: boolean;
}

const SWIPE_OFFSET_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

interface DraggableTopCardProps {
  card: CardItem;
  listTitle?: string;
  onCommitSwipe: (isYep: boolean) => void;
  triggerDirection: "left" | "right" | null;
  disabled?: boolean;
}

function DraggableTopCard({
  card,
  listTitle,
  onCommitSwipe,
  triggerDirection,
  disabled,
}: DraggableTopCardProps) {
  const { t } = useApp();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hasSwipedRef = useRef(false);

  const rotate = useTransform(x, [-240, 0, 240], [-16, 0, 16]);
  const yepOpacity = useTransform(x, [22, 115], [0, 1]);
  const nopeOpacity = useTransform(x, [-115, -22], [1, 0]);
  const yepScale = useTransform(x, [22, 120], [0.75, 1.06]);
  const nopeScale = useTransform(x, [-120, -22], [1.06, 0.75]);
  const greenTint = useTransform(x, [0, 180], [0, 0.28]);
  const redTint = useTransform(x, [-180, 0], [0.28, 0]);

  const flyOut = useCallback(
    (isYep: boolean) => {
      if (hasSwipedRef.current) return;
      hasSwipedRef.current = true;
      const targetX = isYep ? 520 : -520;
      animate(x, targetX, {
        type: "spring",
        stiffness: 260,
        damping: 26,
        velocity: isYep ? 450 : -450,
      });
      animate(y, 24, { duration: 0.22 });
      setTimeout(() => {
        onCommitSwipe(isYep);
      }, 175);
    },
    [onCommitSwipe, x, y]
  );

  useEffect(() => {
    if (!triggerDirection || hasSwipedRef.current) return;
    flyOut(triggerDirection === "right");
  }, [triggerDirection, flyOut]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || hasSwipedRef.current) return;

    const swipedRight =
      info.offset.x > SWIPE_OFFSET_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD;
    const swipedLeft =
      info.offset.x < -SWIPE_OFFSET_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;

    if (swipedRight) {
      flyOut(true);
    } else if (swipedLeft) {
      flyOut(false);
    } else {
      animate(x, 0, { type: "spring", stiffness: 520, damping: 32 });
      animate(y, 0, { type: "spring", stiffness: 520, damping: 32 });
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, touchAction: "none" }}
      drag={disabled ? false : true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      initial={{ scale: 0.96, opacity: 0.85, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute inset-0 rounded-[28px] overflow-hidden card-elevated cursor-grab select-none will-change-transform z-30"
    >
      <CardVisual card={card} listTitle={listTitle} interactiveExpand />

      {/* Dynamic green / coral wash overlays */}
      <motion.div
        style={{ opacity: greenTint }}
        className="pointer-events-none absolute inset-0 bg-[#22C55E] z-20"
      />
      <motion.div
        style={{ opacity: redTint }}
        className="pointer-events-none absolute inset-0 bg-[#F43F5E] z-20"
      />

      {/* YEP Stamp */}
      <motion.div
        style={{ opacity: yepOpacity, scale: yepScale }}
        className="pointer-events-none absolute top-7 left-6 z-30 -rotate-12 px-4 py-1.5 rounded-2xl border-4 border-[#22C55E] bg-black/35 backdrop-blur-sm"
      >
        <span className="font-display font-extrabold text-3xl tracking-wider text-[#22C55E] drop-shadow">
          {t.room.yep}
        </span>
      </motion.div>

      {/* NOPE Stamp */}
      <motion.div
        style={{ opacity: nopeOpacity, scale: nopeScale }}
        className="pointer-events-none absolute top-7 right-6 z-30 rotate-12 px-4 py-1.5 rounded-2xl border-4 border-[#F43F5E] bg-black/35 backdrop-blur-sm"
      >
        <span className="font-display font-extrabold text-3xl tracking-wider text-[#F43F5E] drop-shadow">
          {t.room.nope}
        </span>
      </motion.div>
    </motion.div>
  );
}

export function SwipeDeck({
  cards,
  currentIndex,
  listTitle,
  onSwipe,
  disabled = false,
}: SwipeDeckProps) {
  const { t } = useApp();
  const [trigger, setTrigger] = useState<{
    cardId: string;
    dir: "left" | "right";
  } | null>(null);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const thirdCard = cards[currentIndex + 2];

  const handleCommit = useCallback(
    (isYep: boolean) => {
      if (!currentCard) return;
      setTrigger(null);
      onSwipe(currentCard, isYep);
    },
    [currentCard, onSwipe]
  );

  const handleButtonSwipe = useCallback(
    (dir: "left" | "right") => {
      if (disabled || !currentCard) return;
      if (trigger?.cardId === currentCard.id) return;
      setTrigger({ cardId: currentCard.id, dir });
    },
    [currentCard, disabled, trigger]
  );

  // Desktop keyboard shortcuts (ArrowLeft = Nope, ArrowRight = Yep)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled || !currentCard) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleButtonSwipe("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleButtonSwipe("right");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentCard, disabled, handleButtonSwipe]);

  if (!currentCard) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Stacked Card Arena */}
      <div className="relative w-full max-w-[372px] h-[61dvh] min-h-[395px] max-h-[545px]">
        {/* Third card preview */}
        {thirdCard && (
          <div
            key={thirdCard.id}
            className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden card-elevated scale-[0.90] translate-y-5 opacity-50 z-10 transition-transform duration-300"
          >
            <CardVisual card={thirdCard} listTitle={listTitle} />
          </div>
        )}

        {/* Second card preview */}
        {nextCard && (
          <div
            key={nextCard.id}
            className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden card-elevated scale-[0.95] translate-y-2.5 opacity-80 z-20 transition-transform duration-300"
          >
            <CardVisual card={nextCard} listTitle={listTitle} />
          </div>
        )}

        {/* Active interactive top card */}
        <DraggableTopCard
          key={currentCard.id}
          card={currentCard}
          listTitle={listTitle}
          onCommitSwipe={handleCommit}
          triggerDirection={
            trigger && trigger.cardId === currentCard.id ? trigger.dir : null
          }
          disabled={disabled}
        />
      </div>

      {/* Tactile Tap Controls (Nope / Yep) */}
      <div className="mt-7 flex items-center justify-center gap-7">
        <button
          type="button"
          onClick={() => handleButtonSwipe("left")}
          disabled={disabled}
          aria-label="Nope"
          className="group w-16 h-16 rounded-full surface-panel shadow-md flex items-center justify-center text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white active:scale-90 transition-all duration-150 cursor-pointer disabled:opacity-40"
        >
          <X className="w-8 h-8 stroke-[2.8]" />
        </button>

        <button
          type="button"
          onClick={() => handleButtonSwipe("right")}
          disabled={disabled}
          aria-label="Yep"
          className="group w-[72px] h-[72px] rounded-full bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30 flex items-center justify-center hover:bg-[#16A34A] active:scale-90 transition-all duration-150 cursor-pointer disabled:opacity-40"
        >
          <Check className="w-9 h-9 stroke-[3]" />
        </button>
      </div>

      <p className="mt-3 text-xs text-muted font-medium text-center">
        {t.room.swipeHint}
      </p>
    </div>
  );
}
