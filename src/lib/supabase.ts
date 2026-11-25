import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith("http")
  );
}

const clientCache = new Map<string, SupabaseClient>();

export function getSupabaseClient(roomCode?: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  const key = roomCode ? roomCode.toUpperCase() : "__default__";
  const existing = clientCache.get(key);
  if (existing) return existing;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: roomCode
      ? {
          headers: {
            "x-room-code": roomCode.toUpperCase(),
          },
        }
      : undefined,
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  clientCache.set(key, client);
  return client;
}
