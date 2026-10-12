import Link from "next/link";
import { getArticles, getTrending } from "@/lib/api";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60;

export default async function HomePage() {
  const [articlesData, trendingData] = await Promise.all([
    getArticles({ limit: 12 }),
    getTrending()
  ]);

  const allArticles = articlesData.items || [];
  const heroArticle = allArticles[0];
  const secondaryArticles = allArticles.slice(1);
  const trendingList = [...(trendingData?.cambodia || []), ...(trendingData?.world || [])].slice(0, 5);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans antialiased min-h-screen transition-colors duration-200">
      {/* 1. BREAKING NEWS TICKER */}
      {heroArticle && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-gray-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full text-[10px] shrink-0 border border-rose-200/60 dark:border-rose-900/50 shadow-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-radar absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
              </span>
              <span>Breaking</span>
            </div>
            <Link 
              href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}
              className="font-medium text-gray-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 truncate transition-colors text-xs sm:text-sm group flex items-center gap-1.5"
            >
              <span className="truncate">{heroArticle.title}</span>
              <span className="text-gray-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. LEAD HERO EDITORIAL STORY */}
        {heroArticle && (
          <section className="relative group">
            {/* Ambient subtle glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/15 via-blue-500/10 to-indigo-500/15 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 group-hover:border-teal-500/30 dark:group-hover:border-teal-500/40">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-6 p-6 sm:p-10 space-y-5 flex flex-col justify-center order-2 lg:order-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/50">
                      {heroArticle.country === "KH" ? "Cambodia" : "World Report"}
                    </span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span className="text-gray-500 dark:text-slate-400 font-medium">{heroArticle.source_attribution_text || "Editorial Team"}</span>
                  </div>
                  
                  <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`} className="group/title">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-[1.15] group-hover/title:text-teal-600 dark:group-hover/title:text-teal-400 transition-colors tracking-tight">
                      {heroArticle.title}
                    </h1>
                  </Link>

                  {heroArticle.title_km && (
                    <p className="text-base text-gray-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
                      {heroArticle.title_km}
                    </p>
                  )}

                  <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {heroArticle.summary}
                  </p>

                  <div className="pt-4 flex items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-auto border-t border-gray-100 dark:border-slate-800/80">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                       {(heroArticle.author?.name || "E").charAt(0).toUpperCase()}
                    </div>
                    <span>By {heroArticle.author?.name || "Senior Editorial Desk"}</span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span>
                      {heroArticle.published_at 
                        ? new Date(heroArticle.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) 
                        : "Today"}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 order-1 lg:order-2 overflow-hidden bg-gray-100 dark:bg-slate-800 relative min-h-[300px] lg:min-h-[420px]">
                  <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`} className="block h-full group/img">
                    <img
                      src={heroArticle.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"}
                      alt={heroArticle.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. MAIN 70/30 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Stream (70%) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-gray-100 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Latest News</span>
              </h2>
            </div>

            <div className="space-y-4">
              {secondaryArticles.map((article, idx) => {
                const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;
                const staggerClass = `stagger-${Math.min((idx % 6) + 1, 6)}`;
                return (
                  <article 
                    key={article.id} 
                    className={`animate-fade-up ${staggerClass} hover-lift flex flex-col sm:flex-row gap-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 dark:border-slate-800 group hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-300`}
                  >
                    {/* Thumbnail */}
                    <Link href={url} className="sm:w-52 shrink-0 block">
                      <div className="aspect-[4/3] rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden relative border border-gray-100 dark:border-slate-800/80">
                        <img
                          src={article.hero_image_url || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80"}
                          alt={article.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      </div>
                    </Link>

                    {/* Meta & Heading */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-900/40 text-[10px]">
                            {article.country === "KH" ? "Cambodia" : "World"}
                          </span>
                          {article.category?.name && (
                            <>
                              <span className="text-gray-300 dark:text-slate-700">•</span>
                              <span className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">{article.category.name}</span>
                            </>
                          )}
                        </div>

                        <Link href={url}>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                        </Link>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                        <span>{article.author?.name || "Editorial Staff"}</span>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <span>
                          {article.published_at 
                            ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
                            : "Today"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* In-feed Standard AdSlot */}
            <div className="my-6 rounded-2xl overflow-hidden border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-slate-500 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_MID" />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (30%) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sidebar Top AdSlot */}
            <div className="rounded-2xl overflow-hidden border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-slate-500 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {/* Trending Stories */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="pb-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                    Trending Now
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {trendingList.map((item, idx) => (
                  <Link 
                    key={item.id} 
                    href={item.url || `/cambodia/news/${item.slug}`} 
                    className="py-3.5 first:pt-1 last:pb-0 flex items-start gap-3.5 group hover:translate-x-1 transition-transform duration-200"
                  >
                    <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/40 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 leading-snug line-clamp-2 transition-colors">
                        {item.title}
                      </h4>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                        {item.views_count ? `${item.views_count.toLocaleString()} reads` : "Trending story"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-50/90 via-sky-50/50 to-blue-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/30 rounded-3xl p-6 text-sm border border-teal-200/50 dark:border-teal-900/40 shadow-xs">
              <div className="relative z-10 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-teal-200/60 dark:border-teal-800/50 inline-block">
                  Curated Briefing
                </span>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                  Daily Technology Brief
                </h4>
                <p className="text-gray-600 dark:text-slate-300 text-xs leading-relaxed">
                  The latest in technology, science, and regional discoveries delivered straight to your inbox each morning.
                </p>
                <div className="space-y-2 pt-1">
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 bg-white dark:bg-slate-950 dark:text-white placeholder-gray-400 shadow-2xs" 
                  />
                  <button className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                    Subscribe Free
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
