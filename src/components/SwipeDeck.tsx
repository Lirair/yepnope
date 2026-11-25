"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { Check, Info, X } from "lucide-react";
import type { CardItem } from "@/types/yepnope";
import { CardVisual } from "@/components/CardVisual";
import { useApp } from "@/components/AppProviders";
import { triggerHaptic } from "@/lib/utils";

interface SwipeDeckProps {
  cards: CardItem[];
  currentIndex: number;
  listTitle?: string;
  onSwipe: (card: CardItem, isYep: boolean) => void;
  disabled?: boolean;
}

const SWIPE_OFFSET_THRESHOLD = 95;
const SWIPE_VELOCITY_THRESHOLD = 480;
const STACK_SPRING = { type: "spring" as const, stiffness: 320, damping: 28 };

interface StackCardProps {
  card: CardItem;
  stackIndex: number;
  listTitle?: string;
  ambientX: MotionValue<number>;
  onCommitSwipe: (isYep: boolean) => void;
  triggerDirection: "left" | "right" | null;
  disabled?: boolean;
  infoExpanded: boolean;
  onToggleInfo: () => void;
}

function StackCard({
  card,
  stackIndex,
  listTitle,
  ambientX,
  onCommitSwipe,
  triggerDirection,
  disabled,
  infoExpanded,
  onToggleInfo,
}: StackCardProps) {
  const { t } = useApp();
  const isTop = stackIndex === 0;
  const x = useMotionValue(0);
  const dragY = useMotionValue(0);
  const hasSwipedRef = useRef(false);

  // Sync top card horizontal drag to ambient screen-edge glow
  useMotionValueEvent(x, "change", (latest) => {
    if (isTop) {
      ambientX.set(latest);
    }
  });

  useEffect(() => {
    if (isTop) {
      hasSwipedRef.current = false;
      x.set(0);
      dragY.set(0);
      ambientX.set(0);
    }
  }, [isTop, x, dragY, ambientX]);

  const rotate = useTransform(x, [-240, 0, 240], [-15, 0, 15]);
  const yepOpacity = useTransform(x, [20, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-110, -20], [1, 0]);
  const yepScale = useTransform(x, [20, 110], [0.78, 1.05]);
  const nopeScale = useTransform(x, [-110, -20], [1.05, 0.78]);
  const greenTint = useTransform(x, [20, 160], [0, 0.22]);
  const coralTint = useTransform(x, [-160, -20], [0.22, 0]);

  const flyOut = useCallback(
    (isYep: boolean) => {
      if (!isTop || hasSwipedRef.current) return;
      hasSwipedRef.current = true;
      triggerHaptic(15);

      const targetX = isYep ? 540 : -540;
      animate(x, targetX, {
        type: "spring",
        stiffness: 270,
        damping: 26,
        velocity: isYep ? 460 : -460,
      });
      animate(dragY, 26, { duration: 0.2 });

      setTimeout(() => {
        ambientX.set(0);
        onCommitSwipe(isYep);
      }, 170);
    },
    [ambientX, dragY, isTop, onCommitSwipe, x]
  );

  useEffect(() => {
    if (!isTop || !triggerDirection || hasSwipedRef.current) return;
    flyOut(triggerDirection === "right");
  }, [isTop, triggerDirection, flyOut]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!isTop || disabled || hasSwipedRef.current) return;

    const swipedRight =
      info.offset.x > SWIPE_OFFSET_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY_THRESHOLD;
    const swipedLeft =
      info.offset.x < -SWIPE_OFFSET_THRESHOLD ||
      info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;

    if (swipedRight) {
      flyOut(true);
    } else if (swipedLeft) {
      flyOut(false);
    } else {
      animate(x, 0, { type: "spring", stiffness: 520, damping: 32 });
      animate(dragY, 0, { type: "spring", stiffness: 520, damping: 32 });
    }
  };

  // 3D Stack geometry: active (1 / 0px), second (0.95 / 12px), third (0.90 / 24px)
  const targetScale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.95 : 0.9;
  const targetY = stackIndex === 0 ? 0 : stackIndex === 1 ? 12 : 24;
  const targetOpacity = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.84 : 0.54;
  const zIndex = stackIndex === 0 ? 30 : stackIndex === 1 ? 20 : 10;

  return (
    <motion.div
      initial={{
        scale: stackIndex === 2 ? 0.86 : targetScale,
        y: stackIndex === 2 ? 32 : targetY,
        opacity: stackIndex === 2 ? 0 : targetOpacity,
      }}
      animate={{
        scale: targetScale,
        y: targetY,
        opacity: targetOpacity,
      }}
      transition={STACK_SPRING}
      style={{ zIndex }}
      className={`absolute inset-0 ${isTop ? "" : "pointer-events-none"}`}
    >
      <motion.div
        style={{
          x: isTop ? x : 0,
          y: isTop ? dragY : 0,
          rotate: isTop ? rotate : 0,
          touchAction: isTop ? "none" : "auto",
        }}
        drag={isTop && !disabled}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.85}
        onDragEnd={handleDragEnd}
        whileTap={isTop ? { cursor: "grabbing" } : undefined}
        className={`relative w-full h-full rounded-[28px] overflow-hidden shadow-2xl border border-black/8 dark:border-white/10 bg-surface select-none will-change-transform ${
          isTop ? "cursor-grab" : ""
        }`}
      >
        <CardVisual
          card={card}
          listTitle={listTitle}
          interactiveExpand={isTop}
          infoExpanded={isTop ? infoExpanded : false}
          onToggleInfo={isTop ? onToggleInfo : undefined}
        />

        {isTop && (
          <>
            {/* Subtle directional color wash */}
            <motion.div
              style={{ opacity: greenTint }}
              className="pointer-events-none absolute inset-0 bg-yep z-20"
            />
            <motion.div
              style={{ opacity: coralTint }}
              className="pointer-events-none absolute inset-0 bg-nope z-20"
            />

            {/* YEP Stamp (top-left, -rotate-12) */}
            <motion.div
              style={{ opacity: yepOpacity, scale: yepScale }}
              className="pointer-events-none absolute top-7 left-5 z-30 -rotate-12 px-4 py-1.5 rounded-2xl border-4 border-yep bg-black/40 backdrop-blur-sm shadow-lg"
            >
              <span className="font-display font-extrabold text-3xl tracking-wider text-yep drop-shadow">
                {t.room.yep}
              </span>
            </motion.div>

            {/* NOPE Stamp (top-right, rotate-12) */}
            <motion.div
              style={{ opacity: nopeOpacity, scale: nopeScale }}
              className="pointer-events-none absolute top-7 right-5 z-30 rotate-12 px-4 py-1.5 rounded-2xl border-4 border-nope bg-black/40 backdrop-blur-sm shadow-lg"
            >
              <span className="font-display font-extrabold text-3xl tracking-wider text-nope drop-shadow">
                {t.room.nope}
              </span>
            </motion.div>
          </>
        )}
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
  const [infoExpandedCardId, setInfoExpandedCardId] = useState<string | null>(null);

  const ambientX = useMotionValue(0);
  const rightGlowOpacity = useTransform(ambientX, [18, 130], [0, 1]);
  const leftGlowOpacity = useTransform(ambientX, [-130, -18], [1, 0]);

  const currentCard = cards[currentIndex];
  const visibleCards = useMemo(() => {
    const slice = cards.slice(currentIndex, currentIndex + 3);
    // Render back-to-front in DOM so top card paints cleanly on top
    return slice.map((card, stackIndex) => ({ card, stackIndex })).reverse();
  }, [cards, currentIndex]);

  const isInfoExpanded = Boolean(
    currentCard && infoExpandedCardId === currentCard.id
  );

  const hasExpandableDetails = Boolean(
    currentCard &&
      (currentCard.description ||
        currentCard.subtitle ||
        (currentCard.tags && currentCard.tags.length > 0))
  );

  const handleToggleInfo = useCallback(() => {
    if (!currentCard) return;
    setInfoExpandedCardId((prev) =>
      prev === currentCard.id ? null : currentCard.id
    );
  }, [currentCard]);

  const handleCommit = useCallback(
    (isYep: boolean) => {
      if (!currentCard) return;
      setTrigger(null);
      setInfoExpandedCardId(null);
      onSwipe(currentCard, isYep);
    },
    [currentCard, onSwipe]
  );

  const handleButtonSwipe = useCallback(
    (dir: "left" | "right") => {
      if (disabled || !currentCard) return;
      if (trigger?.cardId === currentCard.id) return;
      setInfoExpandedCardId(null);
      setTrigger({ cardId: currentCard.id, dir });
    },
    [currentCard, disabled, trigger]
  );

  // Desktop keyboard shortcuts (ArrowLeft = Nope, ArrowRight = Yep)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled || !currentCard) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

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
    <div className="w-full flex flex-col items-center relative">
      {/* Reactive Ambient Edge Glow (Emerald right / Coral left) */}
      <motion.div
        aria-hidden="true"
        style={{
          opacity: rightGlowOpacity,
          background:
            "radial-gradient(circle at 100% 45%, rgba(16, 185, 129, 0.34) 0%, rgba(16, 185, 129, 0.12) 32%, transparent 65%)",
        }}
        className="pointer-events-none fixed inset-0 z-10"
      />
      <motion.div
        aria-hidden="true"
        style={{
          opacity: leftGlowOpacity,
          background:
            "radial-gradient(circle at 0% 45%, rgba(244, 63, 94, 0.34) 0%, rgba(244, 63, 94, 0.12) 32%, transparent 65%)",
        }}
        className="pointer-events-none fixed inset-0 z-10"
      />

      {/* 3D Stacked Full-Bleed Card Arena (~68dvh) */}
      <div className="relative z-20 w-full max-w-[380px] h-[68dvh] max-h-[calc(100dvh-210px)] min-h-[380px]">
        {visibleCards.map(({ card, stackIndex }) => (
          <StackCard
            key={card.id}
            card={card}
            stackIndex={stackIndex}
            listTitle={listTitle}
            ambientX={ambientX}
            onCommitSwipe={handleCommit}
            triggerDirection={
              stackIndex === 0 && trigger && trigger.cardId === card.id
                ? trigger.dir
                : null
            }
            disabled={disabled}
            infoExpanded={stackIndex === 0 ? isInfoExpanded : false}
            onToggleInfo={handleToggleInfo}
          />
        ))}
      </div>

      {/* One-Handed Thumb Controls (64px Nope | Optional Info | 64px Yep) */}
      <div className="relative z-20 mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => handleButtonSwipe("left")}
          disabled={disabled}
          aria-label="Nope"
          className="group w-16 h-16 rounded-full surface-panel nope-glow flex items-center justify-center text-nope border border-nope/30 hover:bg-nope hover:text-white active:scale-90 transition-all duration-150 cursor-pointer disabled:opacity-40"
        >
          <X className="w-8 h-8 stroke-[2.8]" />
        </button>

        {hasExpandableDetails && currentCard.category !== "custom" && (
          <button
            type="button"
            onClick={handleToggleInfo}
            disabled={disabled}
            aria-label={t.room.infoLabel}
            aria-expanded={isInfoExpanded}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-40 ${
              isInfoExpanded
                ? "bg-foreground text-background border-transparent shadow-md"
                : "surface-panel text-muted hover:text-foreground shadow-sm"
            }`}
          >
            <Info className="w-5 h-5 stroke-[2.3]" />
          </button>
        )}

        <button
          type="button"
          onClick={() => handleButtonSwipe("right")}
          disabled={disabled}
          aria-label="Yep"
          className="group w-16 h-16 rounded-full bg-yep text-white yep-glow flex items-center justify-center hover:bg-yep-strong active:scale-90 transition-all duration-150 cursor-pointer disabled:opacity-40"
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      <p className="relative z-20 mt-3 text-xs text-muted font-medium text-center">
        {t.room.swipeHint}
      </p>
    </div>
  );
}
