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
} from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { searchGlobal } from "@/lib/api";
import { AIAnswerBox } from "@/components/search/AIAnswerBox";
import type { SearchResultItem } from "@/types";

export const metadata: Metadata = {
  title: "Search | Daily Discovery",
  description:
    "One search across news, visual discoveries, travel provinces, places, guides, events, quizzes, tools and authors.",
};

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: typeof FileText; badge: string }> = {
  ARTICLE: { label: "News", icon: FileText, badge: "text-blue-600 dark:text-blue-400" },
  DISCOVERY: { label: "Discover", icon: Sparkles, badge: "text-purple-600 dark:text-purple-400" },
  QUIZ: { label: "Quiz", icon: HelpCircle, badge: "text-amber-600 dark:text-amber-400" },
  TOOL: { label: "Tools", icon: Wrench, badge: "text-cyan-600 dark:text-cyan-400" },
  DESTINATION: { label: "Provinces", icon: MapPin, badge: "text-emerald-600 dark:text-emerald-400" },
  PLACE: { label: "Places", icon: Compass, badge: "text-teal-600 dark:text-teal-400" },
  GUIDE: { label: "Guides", icon: BookOpen, badge: "text-emerald-600 dark:text-emerald-400" },
  EVENT: { label: "Events", icon: CalendarDays, badge: "text-rose-600 dark:text-rose-400" },
  AUTHOR: { label: "Authors", icon: User, badge: "text-indigo-600 dark:text-indigo-400" },
};

const CHIP_BASE =
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors";
const CHIP_ACTIVE =
  "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950";
const CHIP_IDLE =
  "border-slate-300 text-slate-600 hover:border-teal-500 hover:text-teal-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-400";

function metaFor(type: string) {
  return TYPE_META[type] || { label: type, icon: FileText, badge: "text-slate-500" };
}

const QUICK_LINKS = [
  { href: "/cambodia", label: "Cambodia news", icon: FileText },
  { href: "/travel", label: "Travel & provinces", icon: Compass },
  { href: "/discover", label: "Visual discoveries", icon: Sparkles },
  { href: "/quiz", label: "Daily quiz", icon: HelpCircle },
  { href: "/tools", label: "Everyday tools", icon: Wrench },
  { href: "/trending", label: "Trending now", icon: CalendarDays },
];

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
      description="One search across news, visual discoveries, travel provinces, places, guides, events, quizzes, tools and authors."
    >
      <div className="space-y-8">
        {/* Search box */}
        <form action="/search" method="GET" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search articles, discoveries, travel, quizzes, and tools…"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-28 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {activeType && <input type="hidden" name="type" value={activeType} />}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Search
          </button>
        </form>

        {q && (
          <div className="space-y-5">
            <AIAnswerBox query={q} />

            {presentTypes.length > 1 && (
              <div className="flex flex-wrap gap-2">
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
              </div>
            )}

            <div className="border-b border-slate-200 pb-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Found {visible.length} result{visible.length === 1 ? "" : "s"}
              {activeType ? ` in ${metaFor(activeType).label}` : ""} for{" "}
              &ldquo;{q}&rdquo;
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching results"
                description={`Nothing matched “${q}”. Try broader terms like “Cambodia”, “GPS”, or “festival”.`}
                actionLabel="Clear search"
                actionHref="/search"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visible.map((item) => {
                  const meta = metaFor(item.type);
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.url}
                      className="group flex gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-teal-500/50 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon className={`h-6 w-6 ${meta.badge}`} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div
                          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{meta.label}</span>
                          {item.category && (
                            <span className="text-slate-400 dark:text-slate-500">
                              • {item.category}
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-teal-600 dark:text-slate-100 dark:group-hover:text-teal-400">
                          {item.title}
                        </h3>
                        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {item.summary}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!q && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_LINKS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-teal-500/50 dark:border-slate-800 dark:bg-slate-900"
              >
                <s.icon className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicPageShell>
  );
}
