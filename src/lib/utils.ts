import type { Locale, CardItem, Participant, Vote, TopOption } from "@/types/yepnope";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    result += ROOM_CODE_CHARS[idx];
  }
  return result;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const IT_ADJECTIVES = [
  "Volpe",
  "Panda",
  "Gatto",
  "Lupo",
  "Gufo",
  "Tigre",
  "Koala",
  "Orso",
  "Delfino",
  "Falco",
  "Riccio",
  "Lontra",
];

const IT_TRAITS = [
  "Veloce",
  "Solare",
  "Curioso",
  "Ninja",
  "Sprint",
  "Felice",
  "Zen",
  "Turbo",
  "Smart",
  "Chill",
];

const EN_ADJECTIVES = [
  "Swift",
  "Sunny",
  "Clever",
  "Chill",
  "Happy",
  "Turbo",
  "Cosmic",
  "Lucky",
];

const EN_ANIMALS = [
  "Fox",
  "Panda",
  "Otter",
  "Owl",
  "Tiger",
  "Koala",
  "Wolf",
  "Cat",
];

export function generateFunNickname(locale: Locale = "it"): string {
  if (locale === "en") {
    const adj = EN_ADJECTIVES[Math.floor(Math.random() * EN_ADJECTIVES.length)];
    const animal = EN_ANIMALS[Math.floor(Math.random() * EN_ANIMALS.length)];
    return `${adj} ${animal}`;
  }
  const animal = IT_ADJECTIVES[Math.floor(Math.random() * IT_ADJECTIVES.length)];
  const trait = IT_TRAITS[Math.floor(Math.random() * IT_TRAITS.length)];
  return `${animal} ${trait}`;
}

const AVATAR_COLORS = [
  "#10B981",
  "#F43F5E",
  "#0EA5E9",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#06B6D4",
];

export interface PastelAvatarPalette {
  bg: string;
  text: string;
}

const PASTEL_AVATARS: PastelAvatarPalette[] = [
  { bg: "#D1FAE5", text: "#065F46" }, // Emerald pastel
  { bg: "#FFE4E6", text: "#9F1239" }, // Rose pastel
  { bg: "#FEF3C7", text: "#92400E" }, // Amber pastel
  { bg: "#E0E7FF", text: "#3730A3" }, // Indigo pastel
  { bg: "#CFFAFE", text: "#155E75" }, // Cyan pastel
  { bg: "#FCE7F3", text: "#9D174D" }, // Pink pastel
  { bg: "#FFEDD5", text: "#9A3412" }, // Orange pastel
  { bg: "#EDE9FE", text: "#5B21B6" }, // Violet pastel
  { bg: "#CCFBF1", text: "#115E59" }, // Teal pastel
  { bg: "#E0F2FE", text: "#075985" }, // Sky pastel
];

export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getPastelAvatar(nickname: string): PastelAvatarPalette {
  const normalized = nickname.trim().toLowerCase() || "player";
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return PASTEL_AVATARS[Math.abs(hash) % PASTEL_AVATARS.length];
}

export function triggerHaptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported vibration environments
  }
}

export function shuffleDeck<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TYPOGRAPHIC_GRADIENTS: [string, string][] = [
  ["#0F766E", "#14B8A6"],
  ["#1D4ED8", "#38BDF8"],
  ["#BE123C", "#FB7185"],
  ["#C2410C", "#FB923C"],
  ["#15803D", "#4ADE80"],
  ["#0369A1", "#2DD4BF"],
  ["#B45309", "#FBBF24"],
  ["#9F1239", "#F43F5E"],
  ["#1E3A8A", "#60A5FA"],
  ["#065F46", "#34D399"],
  ["#9A3412", "#F97316"],
  ["#0E7490", "#22D3EE"],
];

/**
 * Generates a deterministic visually rich gradient pair from any text string.
 */
export function gradientFromText(text: string): [string, string] {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return TYPOGRAPHIC_GRADIENTS[Math.abs(hash) % TYPOGRAPHIC_GRADIENTS.length];
}

export function parseMultilineList(raw: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const cleaned = line
      .replace(/^[\s\-*•·\d.)\]]+/, "")
      .trim()
      .slice(0, 80);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(cleaned);
    }
  }
  return items;
}

export function computeTopOptions(
  deck: CardItem[],
  participants: Participant[],
  votes: Vote[],
  limit = 3
): TopOption[] {
  const activeIds = new Set(participants.filter((p) => p.is_active).map((p) => p.id));
  const totalActive = Math.max(activeIds.size, 1);

  const yepMap = new Map<string, Set<string>>();
  for (const v of votes) {
    if (!v.value || !activeIds.has(v.participant_id)) continue;
    let set = yepMap.get(v.card_id);
    if (!set) {
      set = new Set();
      yepMap.set(v.card_id, set);
    }
    set.add(v.participant_id);
  }

  const scored: TopOption[] = deck.map((card) => {
    const yepCount = yepMap.get(card.id)?.size ?? 0;
    const percentage = Math.round((yepCount / totalActive) * 100);
    return {
      card,
      yepCount,
      totalActive,
      percentage,
    };
  });

  scored.sort((a, b) => b.yepCount - a.yepCount);
  return scored.slice(0, limit);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function buildGoogleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildDeliverooUrl(query: string): string {
  return `https://deliveroo.it/it/restaurants/?search=${encodeURIComponent(query)}`;
}

export function saveParticipantSession(roomCode: string, participantId: string, nickname: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `yepnope_session_${roomCode.toUpperCase()}`,
      JSON.stringify({ participantId, nickname })
    );
    localStorage.setItem("yepnope_last_nickname", nickname);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadParticipantSession(
  roomCode: string
): { participantId: string; nickname: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`yepnope_session_${roomCode.toUpperCase()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { participantId?: string; nickname?: string };
    if (parsed.participantId && parsed.nickname) {
      return { participantId: parsed.participantId, nickname: parsed.nickname };
    }
    return null;
  } catch {
    return null;
  }
}

export function loadLastNickname(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("yepnope_last_nickname") ?? "";
  } catch {
    return "";
  }
}
