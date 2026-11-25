"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Dices,
  Loader2,
  Plus,
  X,
  ClipboardPaste,
  Sparkles,
  Check,
  Film,
  Tv,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useApp } from "@/components/AppProviders";
import { FOOD_DECK, FOOD_FILTER_TAGS } from "@/data/food";
import { ACTIVITIES_DECK, ACTIVITY_FILTER_OPTIONS } from "@/data/activities";
import { CUSTOM_TEMPLATES } from "@/data/templates";
import { IT_WATCH_PROVIDERS, WATCH_GENRES } from "@/lib/tmdb";
import { createRoom } from "@/lib/roomService";
import {
  generateFunNickname,
  gradientFromText,
  loadLastNickname,
  parseMultilineList,
  saveParticipantSession,
} from "@/lib/utils";
import type {
  ActivityFilterTag,
  CardItem,
  Category,
  FoodFilterTag,
  WatchMediaType,
} from "@/types/yepnope";

const VALID_CATEGORIES: Category[] = ["food", "watch", "activity", "custom"];

export default function CreateRoomPage() {
  const params = useParams<{ category?: string }>();
  const router = useRouter();
  const { locale, t } = useApp();

  const rawCategory = params?.category ?? "food";
  const category: Category = VALID_CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : "food";

  // Host nickname
  const [nickname, setNickname] = useState("");

  // Food filter state
  const [foodTag, setFoodTag] = useState<FoodFilterTag | "all">("all");

  // Watch filter state
  const [watchMediaType, setWatchMediaType] = useState<WatchMediaType>("movie");
  const [watchProviders, setWatchProviders] = useState<number[]>([8, 119]);
  const [watchGenre, setWatchGenre] = useState<string>("all");

  // Activity filter state
  const [activityTags, setActivityTags] = useState<ActivityFilterTag[]>([]);

  // Custom list state
  const [customTab, setCustomTab] = useState<"scratch" | "templates">("scratch");
  const [customTitle, setCustomTitle] = useState("");
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [singleItemInput, setSingleItemInput] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const saved = loadLastNickname();
      if (saved) setNickname(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredFoodDeck = useMemo(() => {
    if (foodTag === "all") return FOOD_DECK;
    return FOOD_DECK.filter((c) => c.tags?.includes(foodTag));
  }, [foodTag]);

  const filteredActivityDeck = useMemo(() => {
    if (activityTags.length === 0) return ACTIVITIES_DECK;
    const matched = ACTIVITIES_DECK.filter((c) =>
      activityTags.every((tag) => c.filterTags?.includes(tag))
    );
    // Se l'intersezione stretta ha poche carte, usa unione (almeno uno dei tag selezionati)
    if (matched.length >= 4) return matched;
    return ACTIVITIES_DECK.filter((c) =>
      activityTags.some((tag) => c.filterTags?.includes(tag))
    );
  }, [activityTags]);

  const toggleProvider = (id: number) => {
    setWatchProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleActivityTag = (tag: ActivityFilterTag) => {
    setActivityTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleAddSingleItem = () => {
    const cleaned = singleItemInput.trim().slice(0, 80);
    if (!cleaned) return;
    if (!customItems.some((i) => i.toLowerCase() === cleaned.toLowerCase())) {
      setCustomItems((prev) => [...prev, cleaned]);
    }
    setSingleItemInput("");
    setErrorMsg("");
  };

  const handleApplyPaste = () => {
    const parsed = parseMultilineList(pasteText);
    if (parsed.length === 0) return;
    setCustomItems((prev) => {
      const existingLower = new Set(prev.map((i) => i.toLowerCase()));
      const merged = [...prev];
      for (const item of parsed) {
        if (!existingLower.has(item.toLowerCase())) {
          merged.push(item);
          existingLower.add(item.toLowerCase());
        }
      }
      return merged;
    });
    setPasteText("");
    setShowPasteBox(false);
    setErrorMsg("");
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = CUSTOM_TEMPLATES.find((item) => item.id === templateId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    setCustomTitle(locale === "en" ? tpl.titleEn : tpl.title);
    setCustomItems([...tpl.items]);
    setErrorMsg("");
  };

  const handleRemoveCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      let deck: CardItem[] = [];
      let watchDataSource: "tmdb" | "mock" | undefined;

      if (category === "food") {
        deck = filteredFoodDeck.length >= 2 ? filteredFoodDeck : FOOD_DECK;
      } else if (category === "activity") {
        deck =
          filteredActivityDeck.length >= 2 ? filteredActivityDeck : ACTIVITIES_DECK;
      } else if (category === "watch") {
        const qs = new URLSearchParams({
          type: watchMediaType,
          providers: watchProviders.join(","),
          genre: watchGenre,
          lang: locale,
        });
        const res = await fetch(`/api/tmdb/discover?${qs.toString()}`);
        if (!res.ok) throw new Error("Errore caricamento catalogo film");
        const data = (await res.json()) as {
          cards: CardItem[];
          source: "tmdb" | "mock";
        };
        deck = data.cards;
        watchDataSource = data.source;
      } else if (category === "custom") {
        if (customItems.length < 2) {
          setErrorMsg(t.setup.minTwoCards);
          setSubmitting(false);
          return;
        }
        const tpl = CUSTOM_TEMPLATES.find((item) => item.id === selectedTemplateId);
        deck = customItems.map((text, idx) => ({
          id: `custom-${idx}-${text.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`,
          category: "custom",
          title: text,
          emoji: tpl?.emoji ?? "✨",
          gradient: gradientFromText(text),
        }));
      }

      const finalNickname = nickname.trim() || generateFunNickname(locale);
      const { room, host } = await createRoom({
        category,
        hostNickname: finalNickname,
        deck,
        settings: {
          title: category === "custom" ? customTitle.trim() || undefined : undefined,
          locale,
          foodTag: category === "food" ? foodTag : undefined,
          watchMediaType: category === "watch" ? watchMediaType : undefined,
          watchProviders: category === "watch" ? watchProviders : undefined,
          watchGenre: category === "watch" ? watchGenre : undefined,
          watchDataSource,
          activityTags: category === "activity" ? activityTags : undefined,
          customTemplateId: selectedTemplateId ?? undefined,
        },
      });

      saveParticipantSession(room.code, host.id, host.nickname);
      router.push(`/room/${room.code}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Errore durante la creazione della stanza"
      );
      setSubmitting(false);
    }
  };

  const categoryCopy = t.categories[category];
  const previewCount =
    category === "food"
      ? filteredFoodDeck.length
      : category === "activity"
      ? filteredActivityDeck.length
      : category === "custom"
      ? customItems.length
      : null;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TopBar backHref="/" backLabel={t.backHome} />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-10">
        <div className="mb-5 flex items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl sm:text-[26px] font-extrabold tracking-[-0.03em]">
              {categoryCopy.title}
            </h1>
            <p className="text-sm text-muted font-medium mt-0.5">
              {categoryCopy.subtitle}
            </p>
          </div>
          {previewCount !== null && (
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-extrabold bg-[#22C55E]/15 text-[#16A34A] dark:text-[#4ADE80]">
              {previewCount} {t.setup.cardsReady}
            </span>
          )}
        </div>

        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
          {/* Host Nickname */}
          <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-2">
            <label
              htmlFor="host-nickname"
              className="text-xs font-bold uppercase tracking-wider text-muted"
            >
              {t.setup.yourNickname}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="host-nickname"
                type="text"
                maxLength={28}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.setup.nicknamePlaceholder}
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-muted font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="button"
                onClick={() => setNickname(generateFunNickname(locale))}
                className="h-11 px-3.5 rounded-xl bg-surface-muted hover:opacity-80 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
                title={t.setup.randomName}
              >
                <Dices className="w-4 h-4 text-[#22C55E]" />
                <span>{t.setup.randomName}</span>
              </button>
            </div>
          </div>

          {/* MODE 1: FOOD FILTERS */}
          {category === "food" && (
            <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {t.setup.foodFilterLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFoodTag("all")}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    foodTag === "all"
                      ? "bg-[#22C55E] text-white shadow-sm"
                      : "bg-surface-muted hover:opacity-80"
                  }`}
                >
                  {t.setup.allOptions} ({FOOD_DECK.length})
                </button>
                {FOOD_FILTER_TAGS.map((tag) => {
                  const active = foodTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFoodTag(tag)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                        active
                          ? "bg-[#22C55E] text-white shadow-sm"
                          : "bg-surface-muted hover:opacity-80"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 2: WATCH FILTERS (TMDB) */}
          {category === "watch" && (
            <>
              {/* Movie vs TV Toggle */}
              <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.setup.watchTypeLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWatchMediaType("movie")}
                    className={`py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                      watchMediaType === "movie"
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-surface-muted hover:opacity-85"
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>{t.setup.movies}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatchMediaType("tv")}
                    className={`py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                      watchMediaType === "tv"
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-surface-muted hover:opacity-85"
                    }`}
                  >
                    <Tv className="w-4 h-4" />
                    <span>{t.setup.tvShows}</span>
                  </button>
                </div>
              </div>

              {/* Streaming Providers multi-select */}
              <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.setup.platformsLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {IT_WATCH_PROVIDERS.map((provider) => {
                    const active = watchProviders.includes(provider.id);
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => toggleProvider(provider.id)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          active
                            ? "bg-[#22C55E] text-white shadow-sm"
                            : "bg-surface-muted hover:opacity-80"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{provider.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Genre */}
              <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.setup.genreLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {WATCH_GENRES.map((g) => {
                    const active = watchGenre === g.slug;
                    return (
                      <button
                        key={g.slug}
                        type="button"
                        onClick={() => setWatchGenre(g.slug)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                          active
                            ? "bg-foreground text-background"
                            : "bg-surface-muted hover:opacity-80"
                        }`}
                      >
                        {locale === "en" ? g.labelEn : g.labelIt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* MODE 3: ACTIVITY QUICK TAGS */}
          {category === "activity" && (
            <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {t.setup.activityFilterLabel}
              </span>
              <div className="flex flex-col gap-2">
                {ACTIVITY_FILTER_OPTIONS.map((opt) => {
                  const active = activityTags.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleActivityTag(opt.id)}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-between transition cursor-pointer ${
                        active
                          ? "bg-[#22C55E] text-white shadow-sm"
                          : "bg-surface-muted hover:opacity-85"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base">{opt.emoji}</span>
                        <span>{locale === "en" ? opt.labelEn : opt.labelIt}</span>
                      </span>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          active ? "bg-white/25" : "border border-[var(--border)]"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 4: CUSTOM LISTS (SCRATCH + PASTE + 3 TEMPLATES) */}
          {category === "custom" && (
            <div className="flex flex-col gap-4">
              {/* Tabs: Scratch vs Ready Templates */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-surface-muted">
                <button
                  type="button"
                  onClick={() => setCustomTab("scratch")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    customTab === "scratch"
                      ? "bg-surface shadow-sm text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {t.setup.customTabScratch}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomTab("templates")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    customTab === "templates"
                      ? "bg-surface shadow-sm text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>{t.setup.customTabTemplates}</span>
                </button>
              </div>

              {/* Templates Picker */}
              {customTab === "templates" && (
                <div className="flex flex-col gap-2.5">
                  {CUSTOM_TEMPLATES.map((tpl) => {
                    const selected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`w-full p-4 rounded-2xl text-left surface-panel flex items-center justify-between gap-3 transition cursor-pointer ${
                          selected
                            ? "ring-2 ring-[#22C55E]"
                            : "hover:opacity-90"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-11 h-11 rounded-xl bg-surface-muted flex items-center justify-center text-2xl shrink-0">
                            {tpl.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-sm truncate">
                              {locale === "en" ? tpl.titleEn : tpl.title}
                            </p>
                            <p className="text-xs text-muted font-medium truncate">
                              {locale === "en" ? tpl.subtitleEn : tpl.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-extrabold px-2.5 py-1 rounded-full bg-surface-muted">
                          {tpl.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Title + Quick Add / Paste List */}
              <div className="rounded-[24px] p-4 surface-panel flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="custom-list-title"
                    className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5"
                  >
                    {t.setup.customTitleLabel}
                  </label>
                  <input
                    id="custom-list-title"
                    type="text"
                    maxLength={60}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={t.setup.customTitlePlaceholder}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-muted font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                </div>

                {/* Single Item Add */}
                <div className="flex items-center gap-2">
                  <input
                    id="custom-item-input"
                    type="text"
                    maxLength={80}
                    value={singleItemInput}
                    onChange={(e) => setSingleItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSingleItem();
                      }
                    }}
                    placeholder={t.setup.addItemPlaceholder}
                    className="flex-1 h-11 px-3.5 rounded-xl bg-surface-muted font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSingleItem}
                    className="h-11 px-4 rounded-xl bg-[#22C55E] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#16A34A] active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.setup.addBtn}</span>
                  </button>
                </div>

                {/* Paste Multiline Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPasteBox((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] dark:text-[#4ADE80] hover:underline cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>{t.setup.pasteToggle}</span>
                  </button>

                  {showPasteBox && (
                    <div className="mt-2.5 flex flex-col gap-2">
                      <textarea
                        rows={5}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={t.setup.pastePlaceholder}
                        className="w-full p-3 rounded-xl bg-surface-muted text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPaste}
                        className="self-end px-4 py-2 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
                      >
                        {t.setup.pasteApply}
                      </button>
                    </div>
                  )}
                </div>

                {/* Editable Deck Items Chips */}
                {customItems.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted">
                        {customItems.length} {t.setup.itemsCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomItems([]);
                          setSelectedTemplateId(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#F43F5E] hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.setup.clearAll}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {customItems.map((item, idx) => (
                        <span
                          key={`${item}-${idx}`}
                          className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-surface-muted"
                        >
                          <span className="max-w-[200px] truncate">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomItem(idx)}
                            className="w-5 h-5 rounded-full hover:bg-[#F43F5E]/20 hover:text-[#F43F5E] flex items-center justify-center transition cursor-pointer"
                            aria-label={`Rimuovi ${item}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-sm font-bold text-[#F43F5E] bg-[#F43F5E]/10 px-4 py-3 rounded-2xl text-center">
              {errorMsg}
            </p>
          )}

          {/* Create Room Submit CTA */}
          <button
            type="submit"
            id="create-room-submit"
            disabled={submitting}
            className="mt-1 w-full py-4 px-6 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/25 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t.setup.creating}</span>
              </>
            ) : (
              <span>{t.setup.createRoom}</span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
