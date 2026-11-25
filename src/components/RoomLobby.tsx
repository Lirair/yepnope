"use client";

import React, { useState } from "react";
import {
  Share2,
  Check,
  Copy,
  Play,
  Users,
  Crown,
  UserPlus,
  Layers,
} from "lucide-react";
import type { Participant, Room } from "@/types/yepnope";
import { useApp } from "@/components/AppProviders";
import { getInitials } from "@/lib/utils";
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
  const [copied, setCopied] = useState(false);
  const demo = isDemoMode();

  const activeParticipants = participants.filter((p) => p.is_active);
  const categoryInfo = t.categories[room.category];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.code}`
      : `/room/${room.code}`;

  const handleShare = async () => {
    const shareText = `${t.room.shareText} ${shareUrl}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "YepNope",
          text: t.room.shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if user cancels or share fails
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback textarea copy
      const el = document.createElement("textarea");
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleCopyCodeOnly = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-8">
      {/* Room Code & Share Hero Card */}
      <div className="rounded-[28px] p-5 card-elevated flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {room.settings.title || categoryInfo.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-3xl font-extrabold tracking-[0.14em]">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCodeOnly}
                className="p-2 rounded-xl bg-surface-muted hover:opacity-80 active:scale-95 transition cursor-pointer"
                aria-label="Copia codice"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#22C55E]" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-surface-muted text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>{room.deck.length}</span>
          </div>
        </div>

        {/* Main Share Link Button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full py-4 px-5 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#22C55E]/25 active:scale-[0.98] transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              <span>{t.room.copied}</span>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              <span>{t.room.shareButton}</span>
            </>
          )}
        </button>

        {room.settings.watchDataSource === "mock" && (
          <p className="text-[11px] font-medium text-muted text-center bg-surface-muted rounded-xl px-3 py-2">
            {t.room.mockMoviesNotice}
          </p>
        )}
      </div>

      {/* Live Participants Card */}
      <div className="rounded-[28px] p-5 surface-panel flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-muted">
              {t.room.participantsTitle}
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#22C55E]/15 text-[#16A34A] dark:text-[#4ADE80]">
            {activeParticipants.length}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {activeParticipants.map((p) => {
            const isMe = p.id === currentParticipant.id;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-muted/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    style={{ backgroundColor: p.avatar_color }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-sm"
                  >
                    {getInitials(p.nickname)}
                  </span>
                  <span className="font-bold text-sm truncate">
                    {p.nickname}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isMe && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full surface-panel">
                      {t.room.youBadge}
                    </span>
                  )}
                  {p.is_host && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      <Crown className="w-3 h-3" />
                      {t.room.hostBadge}
                    </span>
                  )}
                </div>
              </li>
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
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
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
            className="w-full py-4 px-5 rounded-2xl bg-foreground text-background font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
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
