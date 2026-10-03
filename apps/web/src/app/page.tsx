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
    <div className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen">
      {/* 1. BREAKING NEWS TICKER */}
      {heroArticle && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
            <span className="font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">
              Breaking
            </span>
            <Link 
              href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}
              className="font-medium text-gray-700 hover:text-blue-600 truncate transition-colors"
            >
              {heroArticle.title}
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. LEAD HERO EDITORIAL STORY */}
        {heroArticle && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-6 sm:p-10 space-y-5 flex flex-col justify-center order-2 lg:order-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <span>{heroArticle.country === "KH" ? "Cambodia" : "World Report"}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 font-medium">{heroArticle.source_attribution_text || "Editorial Team"}</span>
                </div>
                
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight hover:text-blue-600 transition-colors">
                    {heroArticle.title}
                  </h1>
                </Link>

                {heroArticle.title_km && (
                  <p className="text-base text-gray-600 leading-relaxed font-medium">
                    {heroArticle.title_km}
                  </p>
                )}

                <p className="text-base text-gray-600 leading-relaxed line-clamp-3">
                  {heroArticle.summary}
                </p>

                <div className="pt-4 flex items-center gap-3 text-sm text-gray-500 font-medium mt-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                     {(heroArticle.author?.name || "E").charAt(0).toUpperCase()}
                  </div>
                  <span>By {heroArticle.author?.name || "Senior Editorial Desk"}</span>
                  <span className="text-gray-300">•</span>
                  <span>
                    {heroArticle.published_at 
                      ? new Date(heroArticle.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) 
                      : "Today"}
                  </span>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`} className="block group h-full">
                  <div className="h-full min-h-[300px] w-full bg-gray-100 overflow-hidden relative">
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
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest News
              </h2>
            </div>

            <div className="space-y-6">
              {secondaryArticles.map((article) => {
                const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;
                return (
                  <article key={article.id} className="flex flex-col sm:flex-row gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 group transition-shadow hover:shadow-md">
                    {/* Thumbnail */}
                    <Link href={url} className="sm:w-1/3 shrink-0 block">
                      <div className="aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative">
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
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                          <span>{article.country === "KH" ? "Cambodia" : "World"}</span>
                        </div>

                        <Link href={url}>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                        </Link>

                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <span>{article.author?.name || "Editorial Staff"}</span>
                        <span className="text-gray-300">•</span>
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

            {/* In-feed Standard AdSlot (AdSense optimized) */}
            <div className="my-8 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_MID" />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (30%) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sidebar Top AdSlot (300x250 Standard) */}
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm p-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {/* Trending Stories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="pb-3 border-b-2 border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Trending Now
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {trendingList.map((item, idx) => (
                  <Link key={item.id} href={item.url || `/cambodia/news/${item.slug}`} className="py-4 first:pt-2 last:pb-0 flex items-start gap-4 group">
                    <span className="text-2xl font-extrabold text-blue-100 group-hover:text-blue-500 transition-colors w-8 shrink-0 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
                        {item.title}
                      </h4>
                      <div className="mt-2 text-xs text-gray-500 font-medium">
                        {item.views_count ? `${item.views_count.toLocaleString()} reads` : "Trending"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-6 text-sm text-blue-900 border border-blue-100">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                Subscribe to Newsletter
              </h4>
              <p className="text-blue-700/80 mb-4">
                Get the latest tech and world news delivered to your inbox daily.
              </p>
              <input type="email" placeholder="Email address" className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 bg-white" />
              <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">Subscribe</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
