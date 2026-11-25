"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Share2,
  Check,
  Copy,
  Play,
  Users,
  Crown,
  UserPlus,
  Layers,
  MessageCircle,
} from "lucide-react";
import type { Participant, Room } from "@/types/yepnope";
import { useApp } from "@/components/AppProviders";
import { getInitials, getPastelAvatar, triggerHaptic } from "@/lib/utils";
import { isDemoMode } from "@/lib/roomService";

interface RoomLobbyProps {
  room: Room;
  participants: Participant[];
  currentParticipant: Participant;
  onStart: () => void;
  onAddDemoFriend: () => void;
  starting: boolean;
}

export function RoomLobby({
  room,
  participants,
  currentParticipant,
  onStart,
  onAddDemoFriend,
  starting,
}: RoomLobbyProps) {
  const { t } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const demo = isDemoMode();

  const activeParticipants = participants.filter((p) => p.is_active);
  const categoryInfo = t.categories[room.category];

  const getShareUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.code}`
      : `/room/${room.code}`;

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    const ok = await copyTextToClipboard(url);
    if (ok) {
      triggerHaptic(15);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = async () => {
    const url = getShareUrl();
    const shareText = `${t.room.shareText} ${url}`;
    triggerHaptic(15);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "YepNope",
          text: t.room.shareText,
          url,
        });
        return;
      } catch {
        // Fallback to WhatsApp link / clipboard if user cancels or unavailable
      }
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCopyCodeOnly = async () => {
    const ok = await copyTextToClipboard(room.code);
    if (ok) {
      triggerHaptic(15);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-8">
      {/* Room Code & Share Hero Card */}
      <div className="rounded-3xl p-5 card-elevated flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {room.settings.title || categoryInfo.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-3xl font-extrabold tracking-[0.14em] text-foreground">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCodeOnly}
                className="p-2 rounded-xl bg-surface-muted hover:opacity-85 active:scale-[0.97] transition-transform cursor-pointer"
                aria-label="Copia codice"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-surface-muted text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{room.deck.length}</span>
          </div>
        </div>

        {/* Prominent Share on WhatsApp + Copy Link Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-3.5 px-5 rounded-2xl bg-accent hover:bg-accent-hover text-accent-fg font-display font-extrabold text-[15px] tracking-tight flex items-center justify-center gap-2 accent-glow active:scale-[0.97] transition-transform cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{t.room.shareButton}</span>
            <Share2 className="w-4 h-4 opacity-80 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`w-full py-3 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 border active:scale-[0.97] transition-all cursor-pointer overflow-hidden ${
              copiedLink
                ? "bg-[#10B981]/12 border-[#10B981]/40 text-[#059669] dark:text-[#34D399]"
                : "bg-surface-muted/80 hover:bg-surface-muted border-[var(--border)] text-foreground"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedLink ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span>{t.room.copied}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-2"
                >
                  <Copy className="w-4 h-4 text-muted" />
                  <span>{t.room.copyLink}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {room.settings.watchDataSource === "mock" && (
          <p className="text-[11px] font-medium text-muted text-center bg-surface-muted rounded-xl px-3 py-2">
            {t.room.mockMoviesNotice}
          </p>
        )}
      </div>

      {/* Live Participants Card */}
      <div className="rounded-3xl p-5 surface-panel flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted" />
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-muted">
              {t.room.participantsTitle}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#10B981]/14 text-[#059669] dark:text-[#34D399]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            {activeParticipants.length}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {activeParticipants.map((p) => {
            const isMe = p.id === currentParticipant.id;
            const pastel = getPastelAvatar(p.nickname);
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-muted/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <span
                      style={{
                        backgroundColor: pastel.bg,
                        color: pastel.text,
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display text-xs font-extrabold shadow-xs ring-2 ring-surface"
                    >
                      {getInitials(p.nickname)}
                    </span>
                    {/* Pulsing green online dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3"
                      aria-label="Online"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-65" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] ring-2 ring-surface" />
                    </span>
                  </div>
                  <span className="font-semibold text-sm truncate text-foreground">
                    {p.nickname}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isMe && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full surface-panel">
                      {t.room.youBadge}
                    </span>
                  )}
                  {p.is_host && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      <Crown className="w-3 h-3" />
                      {t.room.hostBadge}
                    </span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>

        {activeParticipants.length < 2 && (
          <p className="text-xs text-muted font-medium leading-relaxed">
            {t.room.waitingForFriends}
          </p>
        )}

        {/* Demo Mode virtual friend simulator */}
        {demo && (
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            <button
              type="button"
              onClick={onAddDemoFriend}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.room.simulateFriend}</span>
            </button>
            <p className="text-[11px] text-muted text-center">
              {t.room.simulateFriendHint}
            </p>
          </div>
        )}
      </div>

      {/* Host Start CTA or Guest Waiting Banner */}
      {currentParticipant.is_host ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="w-full py-4 px-5 rounded-2xl bg-foreground text-background font-display font-extrabold text-base tracking-tight flex items-center justify-center gap-2 hover:opacity-92 active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50 shadow-md"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.room.startSwipe}</span>
          </button>
          <p className="text-xs text-muted text-center font-medium">
            {t.room.startNote}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl p-4 surface-panel text-center">
          <p className="text-sm font-semibold text-muted">
            {t.room.waitingHost}
          </p>
        </div>
      )}
    </div>
  );
}
