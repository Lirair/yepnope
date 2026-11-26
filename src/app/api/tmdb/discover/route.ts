import { NextRequest, NextResponse } from "next/server";
import { MOCK_WATCH_DECK } from "@/data/mockMovies";
import { IT_WATCH_PROVIDERS, resolveGenreId } from "@/lib/tmdb";
import { gradientFromText } from "@/lib/utils";
import type { CardItem, WatchMediaType } from "@/types/yepnope";

const ALLOWED_PROVIDER_IDS = new Set(IT_WATCH_PROVIDERS.map((p) => p.id));
const MAX_CACHE_ENTRIES = 80;

interface TmdbDiscoverResult {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface TmdbDiscoverResponse {
  results?: TmdbDiscoverResult[];
}

interface CacheEntry {
  expiresAt: number;
  cards: CardItem[];
  source: "tmdb" | "mock";
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minuti
const memoryCache = new Map<string, CacheEntry>();

function setCacheEntry(key: string, entry: CacheEntry) {
  const now = Date.now();
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    for (const [k, v] of memoryCache) {
      if (v.expiresAt <= now) {
        memoryCache.delete(k);
      }
    }
    while (memoryCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      if (!oldestKey) break;
      memoryCache.delete(oldestKey);
    }
  }
  memoryCache.set(key, entry);
}

function buildMockDeck(
  mediaType: WatchMediaType,
  providers: number[],
  genreId: string
): CardItem[] {
  const filtered = MOCK_WATCH_DECK.filter((item) => {
    const typeMatch = mediaType === "tv" ? item.mediaType === "tv" : item.mediaType === "movie";
    const providerMatch =
      providers.length === 0 || item.providers.some((p) => providers.includes(p));
    const genreMatch = !genreId || item.genres.includes(genreId);
    return typeMatch && providerMatch && genreMatch;
  });

  // Se i filtri sul mazzo mock sono troppo restrittivi, garantiamo almeno 10-15 carte per testare bene
  const sourceList = filtered.length >= 5 ? filtered : MOCK_WATCH_DECK;

  return sourceList.map((item) => ({
    id: item.id,
    category: "watch",
    title: item.title,
    description: item.description,
    year: item.year,
    rating: item.rating,
    tags: item.tags,
    image: item.image,
    emoji: item.emoji,
    gradient: item.gradient,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") === "tv" ? "tv" : "movie";
  const providersParam = searchParams.get("providers") ?? "";
  const genreSlug = searchParams.get("genre") ?? "all";
  const langParam = searchParams.get("lang") === "en" ? "en-US" : "it-IT";

  const providerIds = Array.from(
    new Set(
      providersParam
        .split(",")
        .slice(0, 10)
        .map((p) => Number(p.trim()))
        .filter((n) => Number.isInteger(n) && ALLOWED_PROVIDER_IDS.has(n))
    )
  );

  const genreId = resolveGenreId(genreSlug, typeParam);
  const cacheKey = `${typeParam}|${providerIds.sort((a, b) => a - b).join(",")}|${genreId}|${langParam}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { cards: cached.cards, source: cached.source, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  }

  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!apiKey) {
    const mockCards = buildMockDeck(typeParam, providerIds, genreId);
    setCacheEntry(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      cards: mockCards,
      source: "mock",
    });

    return NextResponse.json(
      { cards: mockCards, source: "mock", cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      }
    );
  }

  try {
    const endpoint = typeParam === "tv" ? "discover/tv" : "discover/movie";
    const tmdbUrl = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    tmdbUrl.searchParams.set("language", langParam);
    tmdbUrl.searchParams.set("watch_region", "IT");
    tmdbUrl.searchParams.set("sort_by", "popularity.desc");
    tmdbUrl.searchParams.set("include_adult", "false");
    tmdbUrl.searchParams.set("vote_count.gte", "80");
    tmdbUrl.searchParams.set("page", "1");

    if (providerIds.length > 0) {
      tmdbUrl.searchParams.set("with_watch_providers", providerIds.join("|"));
      tmdbUrl.searchParams.set("with_watch_monetization_types", "flatrate");
    }

    if (genreId) {
      tmdbUrl.searchParams.set("with_genres", genreId);
    }

    // Supporta sia TMDB API Key v3 (query param) sia Bearer Read Access Token v4
    const isBearerToken = apiKey.startsWith("eyJ") || apiKey.length > 48;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (isBearerToken) {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      tmdbUrl.searchParams.set("api_key", apiKey);
    }

    const res = await fetch(tmdbUrl.toString(), {
      headers,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`TMDB HTTP ${res.status}`);
    }

    const data = (await res.json()) as TmdbDiscoverResponse;
    const results = (data.results ?? []).filter((item) => item.poster_path || item.backdrop_path);

    if (results.length === 0) {
      const mockCards = buildMockDeck(typeParam, providerIds, genreId);
      return NextResponse.json(
        { cards: mockCards, source: "mock", cached: false },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
          },
        }
      );
    }

    const cards: CardItem[] = results.slice(0, 20).map((item) => {
      const title = (item.title || item.name || "Titolo").trim();
      const rawDate = item.release_date || item.first_air_date || "";
      const year = rawDate ? rawDate.slice(0, 4) : undefined;
      const rating =
        typeof item.vote_average === "number" && item.vote_average > 0
          ? Number(item.vote_average.toFixed(1))
          : undefined;
      const posterPath = item.poster_path || item.backdrop_path;
      const image = posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : undefined;

      return {
        id: `tmdb-${typeParam}-${item.id}`,
        category: "watch",
        title,
        description:
          item.overview?.trim() ||
          (langParam === "en-US"
            ? "Discover this title tonight with your group."
            : "Scopri questo titolo stasera insieme al gruppo."),
        year,
        rating,
        image,
        emoji: typeParam === "tv" ? "📺" : "🎬",
        gradient: gradientFromText(title),
        tmdbId: item.id,
        mediaType: typeParam,
        tags: [typeParam === "tv" ? "Serie TV" : "Film"],
      };
    });

    setCacheEntry(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      cards,
      source: "tmdb",
    });

    return NextResponse.json(
      { cards, source: "tmdb", cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    const mockCards = buildMockDeck(typeParam, providerIds, genreId);
    return NextResponse.json(
      { cards: mockCards, source: "mock", cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120",
        },
      }
    );
  }
}
