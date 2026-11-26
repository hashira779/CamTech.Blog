"use client";

import Link from "next/link";
import {
  Search,
  FileText,
  Compass,
  Wrench,
  Sparkles,
  CalendarDays,
  BookOpen,
  User,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { AIAnswerBox } from "@/components/search/AIAnswerBox";
import { Photo } from "@/components/ui/photo";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, type CategoryKey } from "@/components/ui/category-mark";
import { cleanText, formatDate, hasKhmerText } from "@/lib/format";
import { localizeCategory, useI18n } from "@/lib/i18n";
import type { SearchResultItem } from "@/types";

const TYPE_META: Record<
  string,
  { en: string; km: string; icon: LucideIcon; category: CategoryKey }
> = {
  ARTICLE: { en: "News", km: "ព័ត៌មាន", icon: FileText, category: "news" },
  DISCOVERY: { en: "Discover", km: "ស្វែងយល់", icon: Sparkles, category: "discover" },
  TOOL: { en: "Tools", km: "ឧបករណ៍", icon: Wrench, category: "tools" },
  DESTINATION: { en: "Provinces", km: "ខេត្ត", icon: MapPin, category: "travel" },
  PLACE: { en: "Places", km: "ទីកន្លែង", icon: Compass, category: "travel" },
  GUIDE: { en: "Guides", km: "មគ្គុទ្ទេសក៍", icon: BookOpen, category: "travel" },
  EVENT: { en: "Events", km: "ព្រឹត្តិការណ៍", icon: CalendarDays, category: "neutral" },
  AUTHOR: { en: "Authors", km: "អ្នកនិពន្ធ", icon: User, category: "neutral" },
};

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors";
const CHIP_ACTIVE = "border-accent bg-accent text-accent-foreground";
const CHIP_IDLE =
  "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground";

export function SearchClient({
  q,
  activeType,
  results,
}: {
  q: string;
  activeType: string;
  results: SearchResultItem[];
}) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  const counts = results.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const visible = activeType ? results.filter((r) => r.type === activeType) : results;
  const presentTypes = Object.keys(TYPE_META).filter((type) => counts[type]);

  const quickLinks = [
    { href: "/news", label: t("news.desk_all"), icon: FileText },
    { href: "/cambodia", label: t("nav.cambodia"), icon: FileText },
    { href: "/news?desk=TH", label: t("nav.thailand_cambodia"), icon: FileText },
    { href: "/news?desk=ASEAN", label: t("nav.asean"), icon: FileText },
    { href: "/travel", label: t("nav.travel"), icon: Compass },
    { href: "/discover", label: t("nav.discover"), icon: Sparkles },
  ];

  const metaFor = (type: string) =>
    TYPE_META[type] || { en: type, km: type, icon: FileText, category: "neutral" as CategoryKey };

  return (
    <PublicPageShell
      breadcrumbs={[{ label: t("search.title"), href: "/search" }]}
      title={t("search.title")}
      description={t("search.description")}
    >
      <form action="/search" method="GET" className="relative max-w-2xl">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <label className="sr-only" htmlFor="global-search">
          {t("search.title")}
        </label>
        <input
          id="global-search"
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t("search.placeholder")}
          className="h-12 w-full rounded-md border border-input bg-surface pl-11 pr-28 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring"
        />
        {activeType && <input type="hidden" name="type" value={activeType} />}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("search.submit")}
        </button>
      </form>

      {q && (
        <div className="mt-8 space-y-6">
          <AIAnswerBox query={q} />

          {presentTypes.length > 1 && (
            <nav aria-label="Filter results by type" className="flex flex-wrap items-center gap-2">
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                className={`${CHIP_BASE} ${!activeType ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                {t("search.all_results")} ({results.length})
              </Link>
              {presentTypes.map((typeKey) => {
                const meta = metaFor(typeKey);
                return (
                  <Link
                    key={typeKey}
                    href={`/search?q=${encodeURIComponent(q)}&type=${typeKey}`}
                    className={`${CHIP_BASE} ${activeType === typeKey ? CHIP_ACTIVE : CHIP_IDLE}`}
                  >
                    {(isKm ? meta.km : meta.en)} ({counts[typeKey]})
                  </Link>
                );
              })}
            </nav>
          )}

          <p className="border-b border-border pb-3 text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{visible.length}</span>{" "}
            {isKm ? `លទ្ធផលសម្រាប់ “${q}”` : `${visible.length === 1 ? "result" : "results"} for “${q}”`}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("search.nothing_found")}
              description={t("search.try_different")}
              actionLabel={isKm ? "សម្អាតការស្វែងរក" : "Clear search"}
              actionHref="/search"
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((item) => {
                const meta = metaFor(item.type);
                const Icon = meta.icon;
                const rowTitle = cleanText(
                  isKm && hasKhmerText(item.title_km, 3) ? item.title_km : item.title
                );
                const summary = cleanText(item.summary);
                const category = item.category ? localizeCategory(cleanText(item.category), lang) : null;
                const date = formatDate(item.published_at, "medium", lang);

                return (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.url}
                      className="group flex items-start gap-4 py-5 transition-colors hover:bg-surface-muted/60 sm:gap-6"
                      aria-label={rowTitle}
                    >
                      {item.image_url ? (
                        <Photo
                          src={item.image_url}
                          alt={rowTitle}
                          ratio="4/3"
                          radius="md"
                          compact
                          showCredit={false}
                          className="h-16 w-20 shrink-0 sm:h-[4.5rem] sm:w-24"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-muted-foreground sm:h-[4.5rem] sm:w-24"
                        >
                          <Icon size={20} strokeWidth={1.5} />
                        </span>
                      )}

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <CategoryMark category={meta.category}>
                            {isKm ? meta.km : meta.en}
                          </CategoryMark>
                          {category && <span className="text-xs text-muted-foreground">{category}</span>}
                        </span>

                        <span className="mt-1.5 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
                          {rowTitle}
                        </span>

                        {summary && (
                          <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                            {summary}
                          </span>
                        )}

                        {date && (
                          <span className="mt-2 block text-xs text-muted-foreground tabular-nums">{date}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {!q && (
        <div className="mt-8">
          <SectionHeader label={t("search.title")} title={t("search.quick_links")} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 shadow-xs transition-colors hover:border-border-strong"
              >
                <s.icon
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
                />
                <span className="text-sm font-medium text-foreground">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PublicPageShell>
  );
}
