import type { SeasonalThemeId } from "@/lib/themes";

export type Category = "food" | "watch" | "activity" | "custom";

export type RoomStatus = "lobby" | "playing" | "matched" | "finished";

export type Locale = "it" | "en";

export type BudgetLevel = "€" | "€€" | "€€€";

export type ActivityFilterTag = "in-casa" | "fuori-aperto" | "low-cost";

export type FoodFilterTag = "Veloce" | "Consegna" | "Uscita" | "Comfort" | "Gruppo";

export type WatchMediaType = "movie" | "tv";

export interface CardItem {
  id: string;
  category: Category;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  image?: string;
  emoji?: string;
  gradient?: [string, string];
  /** Used for Google Maps / Deliveroo CTA in food mode */
  searchQuery?: string;
  /** Used for watch mode */
  year?: string;
  rating?: number;
  tmdbId?: number;
  mediaType?: WatchMediaType;
  /** Used for activity mode */
  budget?: BudgetLevel;
  filterTags?: ActivityFilterTag[];
}

export interface RoomSettings {
  title?: string;
  locale?: Locale;
  themeId?: SeasonalThemeId;
  foodTag?: FoodFilterTag | "all";
  watchMediaType?: WatchMediaType;
  watchProviders?: number[];
  watchGenre?: string;
  watchDataSource?: "tmdb" | "mock";
  activityTags?: ActivityFilterTag[];
  customTemplateId?: string;
}

export interface Room {
  id: string;
  code: string;
  category: Category;
  status: RoomStatus;
  host_id: string;
  theme_id?: SeasonalThemeId;
  settings: RoomSettings;
  deck: CardItem[];
  matched_card_ids: string[];
  current_match_card_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  room_code: string;
  nickname: string;
  avatar_color: string;
  is_host: boolean;
  is_active: boolean;
  current_index: number;
  finished: boolean;
  joined_at: string;
  last_seen_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  room_code: string;
  participant_id: string;
  card_id: string;
  value: boolean;
  created_at: string;
}

export interface RoomSnapshot {
  room: Room;
  participants: Participant[];
  votes: Vote[];
}

export interface TopOption {
  card: CardItem;
  yepCount: number;
  totalActive: number;
  percentage: number;
}

export interface CustomTemplate {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  emoji: string;
  items: string[];
  seasonalThemeId?: SeasonalThemeId;
}
