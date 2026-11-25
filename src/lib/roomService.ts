import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  generateFunNickname,
  generateRoomCode,
  generateUUID,
  pickAvatarColor,
  shuffleDeck,
} from "@/lib/utils";
import type {
  CardItem,
  Category,
  Participant,
  Room,
  RoomSettings,
  RoomSnapshot,
  Vote,
} from "@/types/yepnope";

const DEMO_STORAGE_PREFIX = "yepnope_demo_room_";
const DEMO_CHANNEL_NAME = "yepnope-demo-realtime";

function getDemoKey(code: string): string {
  return `${DEMO_STORAGE_PREFIX}${code.toUpperCase()}`;
}

function readDemoSnapshot(code: string): RoomSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getDemoKey(code));
    if (!raw) return null;
    const snap = JSON.parse(raw) as RoomSnapshot;
    if (new Date(snap.room.expires_at).getTime() < Date.now()) {
      localStorage.removeItem(getDemoKey(code));
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

function writeDemoSnapshot(snap: RoomSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getDemoKey(snap.room.code), JSON.stringify(snap));
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(DEMO_CHANNEL_NAME);
      ch.postMessage({ type: "snapshot", code: snap.room.code });
      ch.close();
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

export interface CreateRoomInput {
  category: Category;
  hostNickname: string;
  deck: CardItem[];
  settings: RoomSettings;
}

export interface CreateRoomResult {
  room: Room;
  host: Participant;
}

export async function createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
  const code = generateRoomCode(6);
  const roomId = generateUUID();
  const hostId = generateUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const shuffledDeck = shuffleDeck(input.deck);
  const nickname = input.hostNickname.trim() || generateFunNickname(input.settings.locale ?? "it");

  const room: Room = {
    id: roomId,
    code,
    category: input.category,
    status: "lobby",
    host_id: hostId,
    settings: input.settings,
    deck: shuffledDeck,
    matched_card_ids: [],
    current_match_card_id: null,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const host: Participant = {
    id: hostId,
    room_id: roomId,
    room_code: code,
    nickname,
    avatar_color: pickAvatarColor(nickname + hostId),
    is_host: true,
    is_active: true,
    current_index: 0,
    finished: false,
    joined_at: now.toISOString(),
    last_seen_at: now.toISOString(),
  };

  const supabase = getSupabaseClient(code);
  if (!supabase) {
    writeDemoSnapshot({ room, participants: [host], votes: [] });
    return { room, host };
  }

  const { error: roomError } = await supabase.from("rooms").insert({
    id: room.id,
    code: room.code,
    category: room.category,
    status: room.status,
    host_id: room.host_id,
    settings: room.settings,
    deck: room.deck,
    matched_card_ids: room.matched_card_ids,
    current_match_card_id: room.current_match_card_id,
    expires_at: room.expires_at,
  });

  if (roomError) {
    throw new Error(`Impossibile creare la stanza: ${roomError.message}`);
  }

  const { error: partError } = await supabase.from("participants").insert({
    id: host.id,
    room_id: host.room_id,
    room_code: host.room_code,
    nickname: host.nickname,
    avatar_color: host.avatar_color,
    is_host: true,
    is_active: true,
    current_index: 0,
    finished: false,
  });

  if (partError) {
    throw new Error(`Impossibile registrare l'host: ${partError.message}`);
  }

  return { room, host };
}

export async function fetchRoomSnapshot(rawCode: string): Promise<RoomSnapshot | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const supabase = getSupabaseClient(code);
  if (!supabase) {
    return readDemoSnapshot(code);
  }

  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (roomError || !roomData) {
    return null;
  }

  const room = roomData as Room;

  const [participantsRes, votesRes] = await Promise.all([
    supabase
      .from("participants")
      .select("*")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true }),
    supabase.from("votes").select("*").eq("room_id", room.id),
  ]);

  return {
    room,
    participants: (participantsRes.data ?? []) as Participant[],
    votes: (votesRes.data ?? []) as Vote[],
  };
}

export async function joinRoom(
  room: Room,
  rawNickname: string
): Promise<Participant> {
  const id = generateUUID();
  const now = new Date().toISOString();
  const nickname = rawNickname.trim() || generateFunNickname(room.settings.locale ?? "it");

  const participant: Participant = {
    id,
    room_id: room.id,
    room_code: room.code,
    nickname,
    avatar_color: pickAvatarColor(nickname + id),
    is_host: false,
    is_active: true,
    current_index: 0,
    finished: false,
    joined_at: now,
    last_seen_at: now,
  };

  const supabase = getSupabaseClient(room.code);
  if (!supabase) {
    const snap = readDemoSnapshot(room.code);
    if (!snap) throw new Error("Stanza non trovata");
    snap.participants = [...snap.participants, participant];
    writeDemoSnapshot(snap);
    return participant;
  }

  const { error } = await supabase.from("participants").insert({
    id: participant.id,
    room_id: participant.room_id,
    room_code: participant.room_code,
    nickname: participant.nickname,
    avatar_color: participant.avatar_color,
    is_host: false,
    is_active: true,
    current_index: 0,
    finished: false,
  });

  if (error) {
    throw new Error(`Impossibile entrare nella stanza: ${error.message}`);
  }

  return participant;
}

export async function startRoomSwiping(room: Room): Promise<void> {
  const supabase = getSupabaseClient(room.code);
  if (!supabase) {
    const snap = readDemoSnapshot(room.code);
    if (!snap) return;
    snap.room.status = "playing";
    writeDemoSnapshot(snap);
    return;
  }

  const { error } = await supabase
    .from("rooms")
    .update({ status: "playing" })
    .eq("id", room.id)
    .eq("code", room.code);

  if (error) {
    throw new Error(`Impossibile avviare la stanza: ${error.message}`);
  }
}

export async function finishRoomNow(room: Room): Promise<void> {
  const supabase = getSupabaseClient(room.code);
  if (!supabase) {
    const snap = readDemoSnapshot(room.code);
    if (!snap) return;
    snap.room.status = "finished";
    writeDemoSnapshot(snap);
    return;
  }

  await supabase
    .from("rooms")
    .update({ status: "finished" })
    .eq("id", room.id)
    .eq("code", room.code);
}

export interface CastVoteResult {
  matched: boolean;
  matchedCardId: string | null;
}

export async function castVote(params: {
  room: Room;
  participantId: string;
  cardId: string;
  value: boolean;
  nextIndex: number;
  finished: boolean;
}): Promise<CastVoteResult> {
  const { room, participantId, cardId, value, nextIndex, finished } = params;
  const supabase = getSupabaseClient(room.code);

  if (!supabase) {
    const snap = readDemoSnapshot(room.code);
    if (!snap) return { matched: false, matchedCardId: null };

    const now = new Date().toISOString();
    const existingIdx = snap.votes.findIndex(
      (v) => v.participant_id === participantId && v.card_id === cardId
    );
    const voteObj: Vote = {
      id: existingIdx >= 0 ? snap.votes[existingIdx].id : generateUUID(),
      room_id: room.id,
      room_code: room.code,
      participant_id: participantId,
      card_id: cardId,
      value,
      created_at: now,
    };

    if (existingIdx >= 0) {
      snap.votes[existingIdx] = voteObj;
    } else {
      snap.votes.push(voteObj);
    }

    snap.participants = snap.participants.map((p) =>
      p.id === participantId
        ? { ...p, current_index: nextIndex, finished, last_seen_at: now }
        : p
    );

    const activeParticipants = snap.participants.filter((p) => p.is_active);
    let matched = false;
    let matchedCardId: string | null = null;

    if (
      value &&
      activeParticipants.length >= 2 &&
      !snap.room.matched_card_ids.includes(cardId)
    ) {
      const yepVoters = new Set(
        snap.votes
          .filter((v) => v.card_id === cardId && v.value)
          .map((v) => v.participant_id)
      );
      const unanimous = activeParticipants.every((p) => yepVoters.has(p.id));
      if (unanimous) {
        matched = true;
        matchedCardId = cardId;
        snap.room.status = "matched";
        snap.room.current_match_card_id = cardId;
        snap.room.matched_card_ids = [...snap.room.matched_card_ids, cardId];
      }
    }

    if (!matched && snap.room.status === "playing") {
      const allFinished =
        activeParticipants.length > 0 && activeParticipants.every((p) => p.finished);
      if (allFinished) {
        snap.room.status = "finished";
      }
    }

    writeDemoSnapshot(snap);
    return { matched, matchedCardId };
  }

  // Chiamata atomica via RPC Postgres (evita race condition sul match unanime)
  const { data, error } = await supabase.rpc("cast_vote_and_check_match", {
    p_room_id: room.id,
    p_room_code: room.code,
    p_participant_id: participantId,
    p_card_id: cardId,
    p_value: value,
    p_next_index: nextIndex,
    p_finished: finished,
  });

  if (error) {
    throw new Error(`Errore salvataggio voto: ${error.message}`);
  }

  const payload = (data ?? {}) as { matched?: boolean; matched_card_id?: string | null };
  return {
    matched: Boolean(payload.matched),
    matchedCardId: payload.matched_card_id ?? null,
  };
}

export async function resumeSwipingAfterMatch(room: Room): Promise<void> {
  const supabase = getSupabaseClient(room.code);
  if (!supabase) {
    const snap = readDemoSnapshot(room.code);
    if (!snap) return;
    const activeParticipants = snap.participants.filter((p) => p.is_active);
    const allFinished =
      activeParticipants.length > 0 && activeParticipants.every((p) => p.finished);
    snap.room.status = allFinished ? "finished" : "playing";
    snap.room.current_match_card_id = null;
    writeDemoSnapshot(snap);
    return;
  }

  const { error } = await supabase.rpc("resume_room_swiping", {
    p_room_id: room.id,
    p_room_code: room.code,
  });

  if (error) {
    throw new Error(`Impossibile riprendere lo swipe: ${error.message}`);
  }
}

/**
 * Demo Mode helper: aggiunge un amico simulato e gli fa votare il mazzo
 * per consentire il test immediato del match unanime anche da un solo dispositivo.
 */
export async function addDemoVirtualFriend(room: Room): Promise<Participant | null> {
  if (!isDemoMode()) return null;
  const snap = readDemoSnapshot(room.code);
  if (!snap) return null;

  const botNames = ["Giulia (Demo)", "Luca (Demo)", "Sofia (Demo)", "Matteo (Demo)"];
  const existingNames = new Set(snap.participants.map((p) => p.nickname));
  const nextName =
    botNames.find((n) => !existingNames.has(n)) ??
    `${generateFunNickname("it")} (Demo)`;

  const bot = await joinRoom(snap.room, nextName);
  return bot;
}

/**
 * In Modalità Demo, fa votare automaticamente gli amici virtuali "(Demo)"
 * sulle carte così puoi sperimentare subito il match unanime e la classifica Top 3.
 */
export async function triggerDemoFriendsVoteForCard(
  room: Room,
  cardId: string,
  cardIndex: number
): Promise<void> {
  if (!isDemoMode()) return;
  const snap = readDemoSnapshot(room.code);
  if (!snap) return;

  const bots = snap.participants.filter(
    (p) => p.is_active && p.nickname.endsWith("(Demo)")
  );
  if (bots.length === 0) return;

  const isLast = cardIndex + 1 >= snap.room.deck.length;

  for (const bot of bots) {
    const alreadyVoted = snap.votes.some(
      (v) => v.participant_id === bot.id && v.card_id === cardId
    );
    if (alreadyVoted) continue;

    // ~65% Yep sui bot demo così il match scatta in modo realistico dopo 2-4 swipe
    const botVote = Math.random() < 0.65;
    await castVote({
      room: snap.room,
      participantId: bot.id,
      cardId,
      value: botVote,
      nextIndex: cardIndex + 1,
      finished: isLast,
    });
  }
}

export function subscribeToRoom(
  rawCode: string,
  onSnapshot: (snapshot: RoomSnapshot) => void
): () => void {
  const code = rawCode.trim().toUpperCase();
  const supabase = getSupabaseClient(code);

  // Modalità Demo locale: sincronizzazione realtime multi-tab via BroadcastChannel + storage event
  if (!supabase) {
    let channel: BroadcastChannel | null = null;

    const notify = () => {
      const snap = readDemoSnapshot(code);
      if (snap) onSnapshot(snap);
    };

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
      channel.onmessage = (ev: MessageEvent<{ type?: string; code?: string }>) => {
        if (ev.data?.code === code) {
          notify();
        }
      };
    }

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === getDemoKey(code)) {
        notify();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (channel) channel.close();
    };
  }

  // Modalità Supabase Realtime: sottoscrizione a rooms, participants, votes filtrati per room_code
  let isDisposed = false;
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  const scheduleRefresh = () => {
    if (isDisposed) return;
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(async () => {
      const snap = await fetchRoomSnapshot(code);
      if (snap && !isDisposed) {
        onSnapshot(snap);
      }
    }, 80);
  };

  const realtimeChannel = supabase
    .channel(`yepnope-room-${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `code=eq.${code}`,
      },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "participants",
        filter: `room_code=eq.${code}`,
      },
      scheduleRefresh
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `room_code=eq.${code}`,
      },
      scheduleRefresh
    )
    .subscribe();

  // Polling leggero di backup ogni 6s in caso di riconnessione rete mobile
  const interval = setInterval(scheduleRefresh, 6000);

  return () => {
    isDisposed = true;
    clearInterval(interval);
    if (refreshTimeout) clearTimeout(refreshTimeout);
    void supabase.removeChannel(realtimeChannel);
  };
}
