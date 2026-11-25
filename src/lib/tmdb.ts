import type { WatchMediaType } from "@/types/yepnope";

export interface WatchProviderOption {
  id: number;
  name: string;
  shortName: string;
  accent: string;
}

/**
 * Official TMDB watch_provider IDs for Italy (watch_region = "IT")
 */
export const IT_WATCH_PROVIDERS: WatchProviderOption[] = [
  { id: 8, name: "Netflix", shortName: "Netflix", accent: "#E50914" },
  { id: 119, name: "Prime Video", shortName: "Prime", accent: "#00A8E1" },
  { id: 337, name: "Disney+", shortName: "Disney+", accent: "#113CCF" },
  { id: 350, name: "Apple TV+", shortName: "Apple TV+", accent: "#111827" },
  { id: 39, name: "NOW / Sky", shortName: "NOW/Sky", accent: "#00C389" },
];

export interface WatchGenreOption {
  slug: string;
  labelIt: string;
  labelEn: string;
  movieId: string;
  tvId: string;
}

export const WATCH_GENRES: WatchGenreOption[] = [
  { slug: "all", labelIt: "Tutti", labelEn: "All", movieId: "", tvId: "" },
  { slug: "comedy", labelIt: "Commedia", labelEn: "Comedy", movieId: "35", tvId: "35" },
  { slug: "action", labelIt: "Azione", labelEn: "Action", movieId: "28", tvId: "10759" },
  { slug: "thriller", labelIt: "Thriller", labelEn: "Thriller", movieId: "53", tvId: "9648" },
  { slug: "scifi", labelIt: "Sci-Fi", labelEn: "Sci-Fi", movieId: "878", tvId: "10765" },
  { slug: "horror", labelIt: "Horror", labelEn: "Horror", movieId: "27", tvId: "9648" },
  { slug: "animation", labelIt: "Animazione", labelEn: "Animation", movieId: "16", tvId: "16" },
  { slug: "romance", labelIt: "Romantico", labelEn: "Romance", movieId: "10749", tvId: "18" },
];

export function resolveGenreId(slug: string, mediaType: WatchMediaType): string {
  const found = WATCH_GENRES.find((g) => g.slug === slug);
  if (!found) return "";
  return mediaType === "tv" ? found.tvId : found.movieId;
}

export function getGenreLabel(slug: string, locale: "it" | "en" = "it"): string {
  const found = WATCH_GENRES.find((g) => g.slug === slug);
  if (!found) return "";
  return locale === "en" ? found.labelEn : found.labelIt;
}
