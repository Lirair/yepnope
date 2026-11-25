export type SeasonalThemeId =
  | "base"
  | "natale"
  | "capodanno"
  | "san-valentino"
  | "halloween"
  | "estate";

export type ThemePreference = "auto" | SeasonalThemeId;

export interface ThemeDateRange {
  startMonth: number; // 1-12
  startDay: number; // 1-31
  endMonth: number; // 1-12
  endDay: number; // 1-31
}

export interface SeasonalThemeConfig {
  id: SeasonalThemeId;
  name: string;
  nameEn: string;
  badgeEmoji: string;
  dateRange: ThemeDateRange | null;
  confettiColors: string[];
  confettiShapes?: ("square" | "circle" | "star")[];
  confettiEmojis?: string[];
  tagline: string;
  taglineEn: string;
  swatchPrimary: string;
  swatchSecondary: string;
  colorMode: "flexible" | "force-dark" | "default-dark";
}

export const SEASONAL_THEME_IDS: SeasonalThemeId[] = [
  "base",
  "natale",
  "capodanno",
  "san-valentino",
  "halloween",
  "estate",
];

export const SEASONAL_THEMES: Record<SeasonalThemeId, SeasonalThemeConfig> = {
  base: {
    id: "base",
    name: "Base",
    nameEn: "Base",
    badgeEmoji: "✨",
    dateRange: null,
    confettiColors: ["#F59E0B", "#EC4899", "#10B981", "#F43F5E", "#FFFFFF"],
    confettiShapes: ["square", "circle"],
    tagline: "Decidete insieme in 30 secondi. Zero login, solo match.",
    taglineEn: "Decide together in 30 seconds. Zero login, pure match.",
    swatchPrimary: "#10B981",
    swatchSecondary: "#F43F5E",
    colorMode: "flexible",
  },
  natale: {
    id: "natale",
    name: "Natale",
    nameEn: "Christmas",
    badgeEmoji: "🎄",
    dateRange: { startMonth: 12, startDay: 1, endMonth: 12, endDay: 26 },
    confettiColors: ["#DC2626", "#10B981", "#D97706", "#FDE68A", "#FFFFFF"],
    confettiShapes: ["circle", "star", "square"],
    confettiEmojis: ["❄️", "🎄", "⭐"],
    tagline: "Magia di Natale: zero discussioni, solo feste d'accordo.",
    taglineEn: "Christmas magic: zero debate, all holiday cheer.",
    swatchPrimary: "#DC2626",
    swatchSecondary: "#D97706",
    colorMode: "flexible",
  },
  capodanno: {
    id: "capodanno",
    name: "Capodanno",
    nameEn: "New Year",
    badgeEmoji: "🥂",
    dateRange: { startMonth: 12, startDay: 27, endMonth: 1, endDay: 2 },
    confettiColors: ["#FACC15", "#E2E8F0", "#FDE047", "#8B5CF6", "#FFFFFF"],
    confettiShapes: ["star", "circle", "square"],
    confettiEmojis: ["🥂", "✨", "🎆"],
    tagline: "Notte di Capodanno: scegliete il piano perfetto per brindare.",
    taglineEn: "New Year's Eve: pick the ultimate plan to celebrate.",
    swatchPrimary: "#FACC15",
    swatchSecondary: "#8B5CF6",
    colorMode: "force-dark",
  },
  "san-valentino": {
    id: "san-valentino",
    name: "San Valentino",
    nameEn: "Valentine's",
    badgeEmoji: "💘",
    dateRange: { startMonth: 2, startDay: 8, endMonth: 2, endDay: 15 },
    confettiColors: ["#EC4899", "#E11D48", "#F472B6", "#F59E0B", "#FFF1F2"],
    confettiShapes: ["circle", "star"],
    confettiEmojis: ["💘", "❤️", "✨"],
    tagline: "Speciale San Valentino: il match perfetto per la vostra serata.",
    taglineEn: "Valentine's Special: the perfect match for date night.",
    swatchPrimary: "#EC4899",
    swatchSecondary: "#E11D48",
    colorMode: "flexible",
  },
  halloween: {
    id: "halloween",
    name: "Halloween",
    nameEn: "Halloween",
    badgeEmoji: "🎃",
    dateRange: { startMonth: 10, startDay: 24, endMonth: 11, endDay: 1 },
    confettiColors: ["#F97316", "#A855F7", "#84CC16", "#FACC15", "#FFFFFF"],
    confettiShapes: ["circle", "star", "square"],
    confettiEmojis: ["🎃", "👻", "🦇"],
    tagline: "Dolcetto o swipe? Scegliete il piano da brivido perfetto.",
    taglineEn: "Trick or swipe? Pick your spooky night plan together.",
    swatchPrimary: "#F97316",
    swatchSecondary: "#A855F7",
    colorMode: "default-dark",
  },
  estate: {
    id: "estate",
    name: "Estate",
    nameEn: "Summer",
    badgeEmoji: "☀️",
    dateRange: { startMonth: 6, startDay: 15, endMonth: 8, endDay: 31 },
    confettiColors: ["#06B6D4", "#F59E0B", "#FB7185", "#38BDF8", "#FDE047"],
    confettiShapes: ["circle", "square"],
    confettiEmojis: ["☀️", "🌊", "🌴"],
    tagline: "Vibe d'estate: sole, mare e decisioni lampo tra amici.",
    taglineEn: "Summer vibes: sun, sea, and instant group decisions.",
    swatchPrimary: "#06B6D4",
    swatchSecondary: "#F59E0B",
    colorMode: "flexible",
  },
};

export const SEASONAL_THEME_LIST: SeasonalThemeConfig[] = SEASONAL_THEME_IDS.map(
  (id) => SEASONAL_THEMES[id]
);

export function isValidSeasonalThemeId(value: unknown): value is SeasonalThemeId {
  return (
    typeof value === "string" &&
    (SEASONAL_THEME_IDS as readonly string[]).includes(value)
  );
}

/**
 * Checks whether a calendar date falls inside an inclusive month/day range,
 * supporting cross-year ranges such as Dec 27 – Jan 2.
 */
function isDateInRange(month: number, day: number, range: ThemeDateRange): boolean {
  const current = month * 100 + day;
  const start = range.startMonth * 100 + range.startDay;
  const end = range.endMonth * 100 + range.endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Cross-year range (e.g. 1227 -> 0102)
  return current >= start || current <= end;
}

/**
 * Returns the seasonal theme that should be active automatically for a given date.
 */
export function getAutoSeasonalTheme(date: Date = new Date()): SeasonalThemeId {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const id of SEASONAL_THEME_IDS) {
    const range = SEASONAL_THEMES[id].dateRange;
    if (range && isDateInRange(month, day, range)) {
      return id;
    }
  }
  return "base";
}

export function getSeasonalThemeConfig(id?: string | null): SeasonalThemeConfig {
  if (id && isValidSeasonalThemeId(id)) {
    return SEASONAL_THEMES[id];
  }
  return SEASONAL_THEMES.base;
}

export const SEASONAL_THEME_STORAGE_KEY = "yepnope_seasonal_theme";
export const COLOR_SCHEME_STORAGE_KEY = "yepnope_theme";

/**
 * Synchronous pre-hydration inline script injected in <head> so the exact
 * `data-theme` and `.dark` class are applied before the first paint (zero FOUC).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var valid=["base","natale","capodanno","san-valentino","halloween","estate"];var params=new URLSearchParams(window.location.search);var urlTheme=params.get("theme");var pref=localStorage.getItem("${SEASONAL_THEME_STORAGE_KEY}");var now=new Date();var md=(now.getMonth()+1)*100+now.getDate();var autoTheme="base";if(md>=1201&&md<=1226)autoTheme="natale";else if(md>=1227||md<=102)autoTheme="capodanno";else if(md>=208&&md<=215)autoTheme="san-valentino";else if(md>=1024&&md<=1101)autoTheme="halloween";else if(md>=615&&md<=831)autoTheme="estate";var active=valid.indexOf(urlTheme)!==-1?urlTheme:(valid.indexOf(pref)!==-1?pref:autoTheme);var root=document.documentElement;root.setAttribute("data-theme",active);var savedMode=localStorage.getItem("${COLOR_SCHEME_STORAGE_KEY}");var prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=false;if(active==="capodanno"){isDark=true;}else if(active==="halloween"){isDark=savedMode!=="light";}else if(savedMode==="dark"||savedMode==="light"){isDark=savedMode==="dark";}else{isDark=prefersDark;}root.classList.toggle("dark",isDark);}catch(e){}})();`;
