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
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
            <span className="font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded text-[11px] shrink-0 border border-red-100 dark:border-red-900/40">
              Breaking
            </span>
            <Link 
              href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}
              className="font-medium text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-400 truncate transition-colors text-xs sm:text-sm"
            >
              {heroArticle.title}
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. LEAD HERO EDITORIAL STORY */}
        {heroArticle && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-6 sm:p-10 space-y-5 flex flex-col justify-center order-2 lg:order-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-teal-400">
                  <span>{heroArticle.country === "KH" ? "Cambodia" : "World Report"}</span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span className="text-gray-500 dark:text-slate-400 font-medium">{heroArticle.source_attribution_text || "Editorial Team"}</span>
                </div>
                
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight hover:text-blue-600 dark:hover:text-teal-400 transition-colors">
                    {heroArticle.title}
                  </h1>
                </Link>

                {heroArticle.title_km && (
                  <p className="text-base text-gray-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
                    {heroArticle.title_km}
                  </p>
                )}

                <p className="text-base text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {heroArticle.summary}
                </p>

                <div className="pt-4 flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 font-medium mt-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-teal-950 flex items-center justify-center text-blue-700 dark:text-teal-300 font-bold text-xs shrink-0">
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

              <div className="order-1 lg:order-2">
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`} className="block group h-full">
                  <div className="h-full min-h-[300px] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={heroArticle.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"}
                      alt={heroArticle.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 3. MAIN 70/30 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Stream (70%) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Latest News
              </h2>
            </div>

            <div className="space-y-6">
              {secondaryArticles.map((article) => {
                const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;
                return (
                  <article key={article.id} className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 group transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700">
                    {/* Thumbnail */}
                    <Link href={url} className="sm:w-1/3 shrink-0 block">
                      <div className="aspect-[4/3] rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden relative border border-gray-100 dark:border-slate-800">
                        <img
                          src={article.hero_image_url || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80"}
                          alt={article.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Meta & Heading */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-teal-400 flex items-center gap-2">
                          <span>{article.country === "KH" ? "Cambodia" : "World"}</span>
                        </div>

                        <Link href={url}>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-teal-400 transition-colors">
                            {article.title}
                          </h3>
                        </Link>

                        <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
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
            <div className="my-8 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-slate-500 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_MID" />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (30%) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sidebar Top AdSlot */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-slate-500 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {/* Trending Stories */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
              <div className="pb-3 border-b-2 border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Trending Now
                </h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {trendingList.map((item, idx) => (
                  <Link key={item.id} href={item.url || `/cambodia/news/${item.slug}`} className="py-4 first:pt-2 last:pb-0 flex items-start gap-4 group">
                    <span className="text-2xl font-extrabold text-blue-100 dark:text-slate-800 group-hover:text-blue-500 dark:group-hover:text-teal-400 transition-colors w-8 shrink-0 text-center font-mono">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-teal-400 leading-snug line-clamp-2 transition-colors">
                        {item.title}
                      </h4>
                      <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {item.views_count ? `${item.views_count.toLocaleString()} reads` : "Trending"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="bg-blue-50/80 dark:bg-slate-900 rounded-2xl p-6 text-sm text-blue-900 dark:text-slate-200 border border-blue-100 dark:border-slate-800">
              <h4 className="font-bold text-base mb-2 text-gray-900 dark:text-white">
                Daily Technology Brief
              </h4>
              <p className="text-gray-600 dark:text-slate-400 mb-4 text-xs leading-relaxed">
                Stay updated with curated Cambodian and international tech news delivered to your inbox every morning.
              </p>
              <input 
                type="email" 
                placeholder="name@company.com" 
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 mb-2 dark:text-white placeholder-gray-400" 
              />
              <button className="w-full bg-blue-600 hover:bg-blue-500 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-medium py-2 rounded-lg text-xs transition-colors shadow-sm">
                Subscribe Free
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
