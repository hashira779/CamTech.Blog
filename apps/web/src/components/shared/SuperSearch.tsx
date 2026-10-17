"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  FileText,
  Compass,
  HelpCircle,
  Wrench,
  ArrowRight,
  CalendarDays,
  BookOpen,
  User,
  Sparkles,
  Heart,
} from "lucide-react";
import { searchGlobal } from "@/lib/api";
import { SearchResultItem } from "@/types";
import { useI18n, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { cleanText } from "@/lib/format";

/**
 * Command palette search.
 *
 * Restyled onto the token palette, and the footer legend that used to promise
 * "↑↓ to navigate" now actually works — arrow keys move a visible highlight and
 * Enter opens the highlighted result. Quick links come from the real navigation
 * table instead of a second invented list, and result marks reuse the same
 * category hues as the rest of the site.
 */
const QUICK_LINKS: { href: string; key: string; Icon: typeof Compass }[] = [
  { href: "/wedding", key: "nav.wedding", Icon: Heart },
  { href: "/travel", key: "nav.travel", Icon: Compass },
  { href: "/quiz", key: "nav.quiz", Icon: HelpCircle },
  { href: "/tools", key: "nav.tools", Icon: Wrench },
  { href: "/discover", key: "nav.discover", Icon: Sparkles },
];

function iconFor(type: string) {
  switch (type.toLowerCase()) {
    case "article":
      return { Icon: FileText, mark: "text-category-news" };
    case "place":
    case "destination":
    case "travel":
      return { Icon: Compass, mark: "text-category-travel" };
    case "quiz":
      return { Icon: HelpCircle, mark: "text-category-quiz" };
    case "tool":
      return { Icon: Wrench, mark: "text-category-tools" };
    case "discovery":
      return { Icon: Sparkles, mark: "text-category-discover" };
    case "guide":
      return { Icon: BookOpen, mark: "text-category-travel" };
    case "event":
      return { Icon: CalendarDays, mark: "text-category-breaking" };
    case "author":
      return { Icon: User, mark: "text-muted-foreground" };
    default:
      return { Icon: Search, mark: "text-muted-foreground" };
  }
}

function titleFor(item: SearchResultItem, lang: Language) {
  return (lang === "km" && item.title_km ? item.title_km : item.title) || item.title;
}

export function SuperSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { lang, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
    setQuery("");
    setResults([]);
    setActive(0);
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const term = query.trim();
      if (term.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await searchGlobal(term);
      setResults(data.results || []);
      setActive(0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const go = useCallback(
    (url: string) => {
      setIsOpen(false);
      router.push(url);
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item.url);
    }
  };

  // Keep the highlighted row inside the scroll box while arrowing.
  useEffect(() => {
    const box = listRef.current;
    if (!box) return;
    const row = box.querySelector<HTMLElement>(`[data-index="${active}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const summaryCount = useMemo(() => results.length, [results]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden w-56 items-center gap-2 rounded-md border border-border bg-surface-muted/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground md:flex lg:w-64"
      >
        <Search size={15} aria-hidden="true" />
        <span className="flex-1 text-left">{t("common.search")}</span>
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-xs text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("common.search")}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Search size={18} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pb-4 pt-4 sm:pt-20"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.search_placeholder")}
        >
          <div
            className="animate-fade-in fixed inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="animate-scale-in relative flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("nav.search_placeholder")}
                aria-label={t("common.search")}
                autoComplete="off"
                className="h-12 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close search"
                className="-mr-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div ref={listRef} className="max-h-[58vh] overflow-y-auto overscroll-contain p-2">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Searching…
                </div>
              )}

              {!loading && query.length > 0 && query.trim().length < 2 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Type at least two characters.
                </p>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="font-display text-base text-foreground">
                    Nothing found for “{query.trim()}”
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Try a place name, a topic, or the source you read it on.
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <>
                  <p className="section-label px-2 py-2 text-muted-foreground">
                    {summaryCount} result{summaryCount === 1 ? "" : "s"}
                  </p>
                  <ul className="space-y-0.5">
                    {results.map((item, index) => {
                      const { Icon, mark } = iconFor(item.type);
                      const isActiveRow = index === active;
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            data-index={index}
                            onClick={() => go(item.url)}
                            onMouseMove={() => setActive(index)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors",
                              isActiveRow ? "bg-muted" : "hover:bg-muted/60"
                            )}
                          >
                            <Icon
                              size={16}
                              aria-hidden="true"
                              className={cn("mt-0.5 shrink-0", mark)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                <span className="truncate text-sm font-medium text-foreground">
                                  {titleFor(item, lang)}
                                </span>
                                <span className="shrink-0 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                                  {item.type.toLowerCase()}
                                </span>
                              </span>
                              {item.summary && (
                                <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
                                  {cleanText(item.summary)}
                                </span>
                              )}
                            </span>
                            <ArrowRight
                              size={15}
                              aria-hidden="true"
                              className={cn(
                                "mt-1 shrink-0 transition-opacity",
                                isActiveRow ? "text-accent opacity-100" : "opacity-0"
                              )}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-2 border-t border-border pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        go(`/search?q=${encodeURIComponent(query.trim())}`)
                      }
                      className="w-full rounded-md px-2.5 py-2 text-sm font-medium text-accent transition-colors hover:bg-muted"
                    >
                      {t("home.view_all")}
                    </button>
                  </div>
                </>
              )}

              {!query && !loading && (
                <div>
                  <p className="section-label px-2 py-2 text-muted-foreground">Browse</p>
                  <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                    {QUICK_LINKS.map(({ href, key, Icon }) => (
                      <li key={href}>
                        <button
                          type="button"
                          onClick={() => go(href)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <Icon size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                          {t(key)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-surface-muted/60 px-4 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">↑</kbd>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">↓</kbd>
                to navigate
                <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-sans">Enter</kbd>
                to open
              </span>
              <span className="tabular-nums">{t("common.search")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
