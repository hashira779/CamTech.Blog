import Link from "next/link";
import { Metadata } from "next";
import {
  Search,
  FileText,
  Compass,
  HelpCircle,
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
import { searchGlobal } from "@/lib/api";
import { AIAnswerBox } from "@/components/search/AIAnswerBox";
import { Photo } from "@/components/ui/photo";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryMark, type CategoryKey } from "@/components/ui/category-mark";
import { cleanText, formatDate } from "@/lib/format";
import type { SearchResultItem } from "@/types";

export const metadata: Metadata = {
  title: "Search",
  description:
    "One search across news, visual discoveries, travel provinces, places, guides, events, quizzes, tools and authors.",
};

export const dynamic = "force-dynamic";

/**
 * The nine result types the endpoint can return, each mapped onto a section mark
 * instead of the old per-type palette (blue/purple/amber/cyan/emerald/teal/rose/
 * indigo). PLACE and DESTINATION are both travel; EVENT and AUTHOR have no hue of
 * their own in the token set, so they stay neutral rather than inventing one.
 */
const TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; category: CategoryKey }
> = {
  ARTICLE: { label: "News", icon: FileText, category: "news" },
  DISCOVERY: { label: "Discover", icon: Sparkles, category: "discover" },
  QUIZ: { label: "Quiz", icon: HelpCircle, category: "quiz" },
  TOOL: { label: "Tools", icon: Wrench, category: "tools" },
  DESTINATION: { label: "Provinces", icon: MapPin, category: "travel" },
  PLACE: { label: "Places", icon: Compass, category: "travel" },
  GUIDE: { label: "Guides", icon: BookOpen, category: "travel" },
  EVENT: { label: "Events", icon: CalendarDays, category: "neutral" },
  AUTHOR: { label: "Authors", icon: User, category: "neutral" },
};

function metaFor(type: string) {
  return TYPE_META[type] || { label: type, icon: FileText, category: "neutral" as CategoryKey };
}

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors";
const CHIP_ACTIVE = "border-accent bg-accent text-accent-foreground";
const CHIP_IDLE =
  "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground";

const QUICK_LINKS = [
  { href: "/cambodia", label: "Cambodia news", icon: FileText },
  { href: "/travel", label: "Travel & provinces", icon: Compass },
  { href: "/discover", label: "Visual discoveries", icon: Sparkles },
  { href: "/quiz", label: "Daily quiz", icon: HelpCircle },
  { href: "/tools", label: "Everyday tools", icon: Wrench },
  { href: "/trending", label: "Trending now", icon: CalendarDays },
];

function ResultRow({ item }: { item: SearchResultItem }) {
  const meta = metaFor(item.type);
  const Icon = meta.icon;
  const title = cleanText(item.title);
  const summary = cleanText(item.summary);
  const category = item.category ? cleanText(item.category) : null;
  const date = formatDate(item.published_at, "medium");

  return (
    <li>
      <Link
        href={item.url}
        className="group flex items-start gap-4 py-5 transition-colors hover:bg-surface-muted/60 sm:gap-6"
        aria-label={title}
      >
        {item.image_url ? (
          <Photo
            src={item.image_url}
            alt={title}
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
            <CategoryMark category={meta.category}>{meta.label}</CategoryMark>
            {category && <span className="text-xs text-muted-foreground">{category}</span>}
          </span>

          <span className="mt-1.5 block font-display text-lg leading-snug text-foreground transition-colors group-hover:text-accent">
            {title}
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
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const resolved = await searchParams;
  const q = (resolved.q || "").trim();
  const activeType = (resolved.type || "").toUpperCase();
  const data = q
    ? await searchGlobal(q)
    : { query: q, total: 0, results: [] as SearchResultItem[] };

  const counts = data.results.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const visible = activeType
    ? data.results.filter((r) => r.type === activeType)
    : data.results;
  const presentTypes = Object.keys(TYPE_META).filter((t) => counts[t]);

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Search", href: "/search" }]}
      title="Search"
      description="One index across news, visual discoveries, travel provinces, places, guides, events, quizzes, tools and authors."
    >
      {/* ── Query ──────────────────────────────────────────────────────────── */}
      <form action="/search" method="GET" className="relative max-w-2xl">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <label className="sr-only" htmlFor="global-search">
          Search the archive
        </label>
        <input
          id="global-search"
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search articles, discoveries, travel, quizzes and tools…"
          className="h-12 w-full rounded-md border border-input bg-surface pl-11 pr-28 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring"
        />
        {activeType && <input type="hidden" name="type" value={activeType} />}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      {q && (
        <div className="mt-8 space-y-6">
          <AIAnswerBox query={q} />

          {presentTypes.length > 1 && (
            <nav
              aria-label="Filter results by type"
              className="flex flex-wrap items-center gap-2"
            >
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                className={`${CHIP_BASE} ${!activeType ? CHIP_ACTIVE : CHIP_IDLE}`}
              >
                All ({data.results.length})
              </Link>
              {presentTypes.map((t) => {
                const meta = metaFor(t);
                return (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(q)}&type=${t}`}
                    className={`${CHIP_BASE} ${activeType === t ? CHIP_ACTIVE : CHIP_IDLE}`}
                  >
                    {meta.label} ({counts[t]})
                  </Link>
                );
              })}
            </nav>
          )}

          <p className="border-b border-border pb-3 text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{visible.length}</span>{" "}
            {visible.length === 1 ? "result" : "results"}
            {activeType ? ` in ${metaFor(activeType).label}` : ""} for &ldquo;{q}&rdquo;
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing matched that search"
              description={`No story, place or tool in the index carries “${q}”. Try a broader term such as “Cambodia”, “GPS” or “festival”, or clear the type filter.`}
              actionLabel="Clear search"
              actionHref="/search"
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((item) => (
                <ResultRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </div>
      )}

      {!q && (
        <div className="mt-8">
          <SectionHeader
            label="Index"
            title="Where to start"
            description="Six places the search box reaches into, if you would rather browse than query."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((s) => (
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
