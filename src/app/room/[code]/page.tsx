"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Dices,
  Loader2,
  Share2,
  Check,
  UserPlus,
  Clock,
  Trophy,
  Plus,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { RoomLobby } from "@/components/RoomLobby";
import { SwipeDeck } from "@/components/SwipeDeck";
import { MatchCelebration } from "@/components/MatchCelebration";
import { NoMatchSummary } from "@/components/NoMatchSummary";
import { useApp } from "@/components/AppProviders";
import {
  addDemoVirtualFriend,
  castVote,
  fetchRoomSnapshot,
  finishRoomNow,
  isDemoMode,
  joinRoom,
  resumeSwipingAfterMatch,
  startRoomSwiping,
  subscribeToRoom,
  triggerDemoFriendsVoteForCard,
} from "@/lib/roomService";
import {
  computeTopOptions,
  generateFunNickname,
  getInitials,
  getPastelAvatar,
  loadLastNickname,
  loadParticipantSession,
  saveParticipantSession,
} from "@/lib/utils";
import { isValidSeasonalThemeId } from "@/lib/themes";
import type { CardItem, Participant, RoomSnapshot } from "@/types/yepnope";

export default function RoomPage() {
  const params = useParams<{ code?: string }>();
  const rawCode = (params?.code ?? "").toUpperCase();
  const { locale, t, setRoomThemeOverride } = useApp();
  const demo = isDemoMode();

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(rawCode));
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Join gate state
  const [joinNickname, setJoinNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Action states
  const [starting, setStarting] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [localIndex, setLocalIndex] = useState<number>(0);
  const [copiedInline, setCopiedInline] = useState(false);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!rawCode) return;

    let cancelled = false;
    const savedSession = loadParticipantSession(rawCode);
    const lastNick = loadLastNickname();

    fetchRoomSnapshot(rawCode)
      .then((snap) => {
        if (cancelled) return;
        if (lastNick) {
          setJoinNickname(lastNick);
        }
        setSnapshot(snap);
        if (snap && savedSession) {
          const existing = snap.participants.find(
            (p) => p.id === savedSession.participantId
          );
          if (existing) {
            setParticipantId(savedSession.participantId);
            setLocalIndex(existing.current_index);
          } else {
            setParticipantId(null);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeToRoom(rawCode, (updated) => {
      if (!cancelled) {
        setSnapshot(updated);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [rawCode]);

  // Apply the host's saved room theme_id so all invited guests see the exact same festive theme
  const savedRoomThemeId =
    snapshot?.room.theme_id ?? snapshot?.room.settings?.themeId ?? null;

  useEffect(() => {
    if (savedRoomThemeId && isValidSeasonalThemeId(savedRoomThemeId)) {
      setRoomThemeOverride(savedRoomThemeId);
    } else {
      setRoomThemeOverride(null);
    }
    return () => {
      setRoomThemeOverride(null);
    };
  }, [savedRoomThemeId, setRoomThemeOverride]);

  const currentParticipant: Participant | null = useMemo(() => {
    if (!snapshot || !participantId) return null;
    return snapshot.participants.find((p) => p.id === participantId) ?? null;
  }, [snapshot, participantId]);

  const activeParticipants = useMemo(() => {
    return (snapshot?.participants ?? []).filter((p) => p.is_active);
  }, [snapshot]);

  const matchedCard: CardItem | null = useMemo(() => {
    if (!snapshot?.room.current_match_card_id) return null;
    return (
      snapshot.room.deck.find(
        (c) => c.id === snapshot.room.current_match_card_id
      ) ?? null
    );
  }, [snapshot]);

  const topOptions = useMemo(() => {
    if (!snapshot) return [];
    return computeTopOptions(
      snapshot.room.deck,
      snapshot.participants,
      snapshot.votes,
      3
    );
  }, [snapshot]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot || joining) return;
    setJoining(true);
    setJoinError("");
    try {
      const nick = joinNickname.trim() || generateFunNickname(locale);
      const created = await joinRoom(snapshot.room, nick);
      saveParticipantSession(snapshot.room.code, created.id, created.nickname);
      setParticipantId(created.id);
      setLocalIndex(0);
      const refreshed = await fetchRoomSnapshot(snapshot.room.code);
      if (refreshed) setSnapshot(refreshed);
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : "Errore ingresso stanza"
      );
    } finally {
      setJoining(false);
    }
  };

  const handleStartSwiping = async () => {
    if (!snapshot || starting) return;
    setStarting(true);
    try {
      await startRoomSwiping(snapshot.room);
      const refreshed = await fetchRoomSnapshot(snapshot.room.code);
      if (refreshed) setSnapshot(refreshed);
    } finally {
      setStarting(false);
    }
  };

  const handleAddDemoFriend = async () => {
    if (!snapshot) return;
    await addDemoVirtualFriend(snapshot.room);
    const refreshed = await fetchRoomSnapshot(snapshot.room.code);
    if (refreshed) setSnapshot(refreshed);
  };

  const handleSwipe = useCallback(
    async (card: CardItem, isYep: boolean) => {
      if (!snapshot || !currentParticipant) return;

      const cardIndex = localIndex;
      const nextIdx = localIndex + 1;
      const finished = nextIdx >= snapshot.room.deck.length;

      // Optimistic local progression for zero-lag 60fps swipe feel
      setLocalIndex(nextIdx);

      try {
        const result = await castVote({
          room: snapshot.room,
          participantId: currentParticipant.id,
          cardId: card.id,
          value: isYep,
          nextIndex: nextIdx,
          finished,
        });

        // In Demo Mode, let virtual friends vote on the same card after a short natural delay
        if (demo && !result.matched) {
          setTimeout(async () => {
            await triggerDemoFriendsVoteForCard(snapshot.room, card.id, cardIndex);
            const updatedAfterBot = await fetchRoomSnapshot(snapshot.room.code);
            if (updatedAfterBot) setSnapshot(updatedAfterBot);
          }, 260);
        }

        const refreshed = await fetchRoomSnapshot(snapshot.room.code);
        if (refreshed) setSnapshot(refreshed);
      } catch {
        // Keep UI responsive; next sync reconciles state
      }
    },
    [currentParticipant, demo, localIndex, snapshot]
  );

  const handleContinueAfterMatch = async () => {
    if (!snapshot || resuming) return;
    setResuming(true);
    try {
      await resumeSwipingAfterMatch(snapshot.room);
      const refreshed = await fetchRoomSnapshot(snapshot.room.code);
      if (refreshed) setSnapshot(refreshed);
    } finally {
      setResuming(false);
    }
  };

  const handleQuickShare = async () => {
    if (!snapshot) return;
    const url = `${window.location.origin}/room/${snapshot.room.code}`;
    const text = `${t.room.shareText} ${url}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "YepNope", text: t.room.shareText, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInline(true);
      setTimeout(() => setCopiedInline(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShowResultsNow = async () => {
    if (!snapshot) return;
    await finishRoomNow(snapshot.room);
    const refreshed = await fetchRoomSnapshot(snapshot.room.code);
    if (refreshed) setSnapshot(refreshed);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TopBar backHref="/" />
        <main className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <p className="text-sm font-semibold text-muted">{t.room.loading}</p>
        </main>
      </div>
    );
  }

  // Room not found / expired
  if (!snapshot) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TopBar backHref="/" />
        <main className="flex-1 w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#F43F5E]/15 text-[#F43F5E] flex items-center justify-center text-3xl font-display font-extrabold">
            ?
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {t.room.notFoundTitle}
          </h1>
          <p className="text-sm text-muted max-w-[32ch]">{t.room.notFoundDesc}</p>
          <Link
            href="/"
            className="mt-2 py-3.5 px-6 rounded-2xl bg-[#10B981] text-white font-display font-extrabold text-sm inline-flex items-center gap-2 hover:bg-[#059669] yep-glow active:scale-[0.97] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>{t.room.createNew}</span>
          </Link>
        </main>
      </div>
    );
  }

  // Join Gate (visitor opened shared link without joining yet)
  if (!currentParticipant) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <TopBar backHref="/" showModeBadge />
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
          <form
            onSubmit={handleJoinSubmit}
            className="rounded-3xl p-6 card-elevated flex flex-col gap-4"
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-[0.14em] bg-[#10B981]/15 text-[#059669] dark:text-[#34D399]">
                {snapshot.room.code}
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
                {t.room.joinTitle}
              </h1>
              <p className="mt-1 text-sm text-muted font-medium">
                {t.room.joinSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={28}
                autoFocus
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder={t.setup.nicknamePlaceholder}
                className="flex-1 h-12 px-4 rounded-2xl bg-surface-muted font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
              <button
                type="button"
                onClick={() => setJoinNickname(generateFunNickname(locale))}
                className="h-12 px-3.5 rounded-2xl bg-surface-muted hover:opacity-85 active:scale-[0.97] transition-transform flex items-center justify-center cursor-pointer"
                aria-label={t.setup.randomName}
                title={t.setup.randomName}
              >
                <Dices className="w-5 h-5 text-[#10B981]" />
              </button>
            </div>

            {joinError && (
              <p className="text-xs font-bold text-[#F43F5E]">{joinError}</p>
            )}

            <button
              type="submit"
              disabled={joining}
              className="w-full py-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-display font-extrabold text-base tracking-tight flex items-center justify-center gap-2 yep-glow active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-60"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.room.joining}</span>
                </>
              ) : (
                <span>{t.room.joinNow}</span>
              )}
            </button>
          </form>
        </main>
      </div>
    );
  }

  const { room } = snapshot;
  const totalCards = room.deck.length;
  const effectiveIndex = Math.max(localIndex, currentParticipant.current_index);
  const userFinishedDeck = effectiveIndex >= totalCards;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TopBar
        backHref="/"
        rightSlot={
          room.status === "playing" ? (
            <button
              type="button"
              onClick={handleQuickShare}
              className="h-9 px-3 rounded-full text-xs font-extrabold tracking-wider surface-panel flex items-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer"
              title={t.room.shareButton}
            >
              {copiedInline ? (
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-[#10B981]" />
              )}
              <span>{room.code}</span>
            </button>
          ) : undefined
        }
        showModeBadge={room.status !== "playing"}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-1 pb-6 flex flex-col">
        {/* STATE 1: LOBBY */}
        {room.status === "lobby" && (
          <RoomLobby
            room={room}
            participants={snapshot.participants}
            currentParticipant={currentParticipant}
            onStart={handleStartSwiping}
            onAddDemoFriend={handleAddDemoFriend}
            starting={starting}
          />
        )}

        {/* STATE 2: PLAYING (SWIPE ARENA) */}
        {room.status === "playing" && (
          <div className="flex-1 flex flex-col items-center">
            {/* Compact Live Header: Active Participants + Card Progress */}
            <div className="relative z-20 w-full max-w-[380px] mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex -space-x-2">
                  {activeParticipants.slice(0, 5).map((p) => {
                    const pastel = getPastelAvatar(p.nickname);
                    return (
                      <div key={p.id} className="relative">
                        <span
                          title={`${p.nickname} (${Math.min(p.current_index, totalCards)}/${totalCards})`}
                          style={{
                            backgroundColor: pastel.bg,
                            color: pastel.text,
                          }}
                          className="w-7 h-7 rounded-full border-2 border-[var(--bg)] flex items-center justify-center font-display text-[10px] font-extrabold shadow-xs"
                        >
                          {getInitials(p.nickname)}
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-[1.5px] ring-[var(--bg)]" />
                      </div>
                    );
                  })}
                  {activeParticipants.length > 5 && (
                    <span className="w-7 h-7 rounded-full border-2 border-[var(--bg)] bg-surface-muted flex items-center justify-center text-[10px] font-bold">
                      +{activeParticipants.length - 5}
                    </span>
                  )}
                </div>

                {demo && activeParticipants.length < 2 && (
                  <button
                    type="button"
                    onClick={handleAddDemoFriend}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Demo</span>
                  </button>
                )}
              </div>

              {/* Card progress bar + counter */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((Math.min(effectiveIndex + 1, totalCards) / Math.max(totalCards, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <span className="font-display text-xs font-bold text-muted tabular-nums">
                  {Math.min(effectiveIndex + 1, totalCards)}/{totalCards}
                </span>
              </div>
            </div>

            {activeParticipants.length < 2 && !userFinishedDeck && (
              <p className="relative z-20 w-full max-w-[380px] mb-2 text-[11px] font-semibold text-muted text-center bg-surface-muted/80 px-3 py-1.5 rounded-full">
                {t.room.needTwoPlayersHint}
              </p>
            )}

            {/* Main Swipe Stack OR Waiting for Others */}
            {!userFinishedDeck ? (
              <SwipeDeck
                cards={room.deck}
                currentIndex={effectiveIndex}
                listTitle={room.settings.title}
                onSwipe={handleSwipe}
              />
            ) : (
              <div className="w-full max-w-[380px] my-auto rounded-3xl p-6 card-elevated text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight">
                    {t.room.waitingOthersTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted font-medium leading-relaxed">
                    {activeParticipants.length < 2
                      ? t.room.waitingSoloDesc
                      : t.room.waitingOthersDesc}
                  </p>
                </div>

                {/* Per-participant progress */}
                <div className="w-full flex flex-col gap-2 pt-1">
                  {activeParticipants.map((p) => {
                    const pct = Math.min(
                      100,
                      Math.round((p.current_index / Math.max(totalCards, 1)) * 100)
                    );
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 text-xs font-bold"
                      >
                        <span className="w-24 truncate text-left">
                          {p.nickname}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-muted tabular-nums">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {activeParticipants.length < 2 ? (
                  <button
                    type="button"
                    onClick={handleQuickShare}
                    className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-accent-fg font-display font-extrabold text-sm flex items-center justify-center gap-2 accent-glow active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    {copiedInline ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t.room.copied}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>{t.room.shareButton}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleShowResultsNow}
                    className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-foreground text-background font-display font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{t.room.showResultsNow}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATE 3: UNANIMOUS MATCH */}
        {room.status === "matched" && matchedCard && (
          <MatchCelebration
            room={room}
            card={matchedCard}
            participants={snapshot.participants}
            onContinue={handleContinueAfterMatch}
            resuming={resuming}
          />
        )}

        {/* STATE 4: FINISHED / TOP 3 FALLBACK */}
        {room.status === "finished" && (
          <NoMatchSummary room={room} topOptions={topOptions} />
        )}
      </main>
    </div>
  );
}
