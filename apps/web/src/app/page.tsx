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
    <div className="bg-white text-neutral-900 font-sans antialiased min-h-screen">
      {/* 1. BREAKING NEWS TICKER */}
      {heroArticle && (
        <div className="border-b border-neutral-200 bg-[#FAF9F6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px]">
              Top Story
            </span>
            <Link 
              href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}
              className="font-medium text-neutral-800 hover:text-neutral-950 truncate transition-colors"
            >
              {heroArticle.title}
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* 2. LEAD HERO EDITORIAL STORY (Classic Newspaper Lead) */}
        {heroArticle && (
          <section className="pb-10 border-b border-neutral-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  <span className="text-neutral-900 font-bold">{heroArticle.country === "KH" ? "Cambodia" : "World Report"}</span>
                  <span>•</span>
                  <span>{heroArticle.source_attribution_text || "Editorial Team"}</span>
                </div>
                
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`}>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-neutral-950 leading-tight hover:text-neutral-700 transition-colors">
                    {heroArticle.title}
                  </h1>
                </Link>

                {heroArticle.title_km && (
                  <p className="text-base text-neutral-600 font-sans leading-relaxed">
                    {heroArticle.title_km}
                  </p>
                )}

                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed line-clamp-3">
                  {heroArticle.summary}
                </p>

                <div className="pt-2 flex items-center gap-3 text-xs text-neutral-500 font-serif italic">
                  <span>By {heroArticle.author?.name || "Senior Editorial Desk"}</span>
                  <span>•</span>
                  <span>
                    {heroArticle.published_at 
                      ? new Date(heroArticle.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                      : "Today"}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Link href={heroArticle.country === "KH" ? `/cambodia/news/${heroArticle.slug}` : `/world/news/${heroArticle.slug}`} className="block group">
                  <div className="aspect-[16/10] bg-neutral-100 overflow-hidden border border-neutral-200">
                    <img
                      src={heroArticle.hero_image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"}
                      alt={heroArticle.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                  {heroArticle.hero_image_credit && (
                    <span className="block text-[10px] text-neutral-400 text-right mt-1.5 font-mono">
                      Photo: {heroArticle.hero_image_credit}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 3. MAIN 70/30 EDITORIAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Main Editorial Stream (70%) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="border-b-2 border-neutral-900 pb-2 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold uppercase tracking-tight text-neutral-950">
                Latest Dispatches & Analyses
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                {allArticles.length} Verified Stories
              </span>
            </div>

            <div className="space-y-6 divide-y divide-neutral-200">
              {secondaryArticles.map((article) => {
                const url = article.country === "KH" ? `/cambodia/news/${article.slug}` : `/world/news/${article.slug}`;
                return (
                  <article key={article.id} className="pt-6 first:pt-0 flex flex-col sm:flex-row gap-6 group">
                    {/* Thumbnail */}
                    <Link href={url} className="sm:w-1/3 shrink-0 block">
                      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden border border-neutral-200">
                        <img
                          src={article.hero_image_url || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80"}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Meta & Heading */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-2">
                          <span className="text-neutral-900 font-bold">{article.country === "KH" ? "Cambodia" : "World"}</span>
                          <span>•</span>
                          <span>{article.source_attribution_text || "Editorial Desk"}</span>
                        </div>

                        <Link href={url}>
                          <h3 className="text-lg sm:text-xl font-serif font-bold text-neutral-950 leading-snug group-hover:text-neutral-700 transition-colors">
                            {article.title}
                          </h3>
                        </Link>

                        {article.title_km && (
                          <p className="text-xs text-neutral-600 line-clamp-1">
                            {article.title_km}
                          </p>
                        )}

                        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 flex items-center gap-3 text-xs text-neutral-400 font-serif italic">
                        <span>By {article.author?.name || "Editorial Staff"}</span>
                        <span>•</span>
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
            <div className="p-4 bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_MID" />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (30%) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Sidebar Top AdSlot (300x250 Standard) */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 block mb-2">
                Advertisement
              </span>
              <AdSlot slot="HOME_TOP" />
            </div>

            {/* Trending Stories (Numbered 01-05) */}
            <div className="border border-neutral-200 bg-white p-5 space-y-4">
              <div className="border-b-2 border-neutral-900 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-neutral-950">
                  Most Read This Week
                </h3>
                <span className="text-[10px] font-mono uppercase text-emerald-600 font-semibold">
                  Live Index
                </span>
              </div>

              <div className="divide-y divide-neutral-100">
                {trendingList.map((item, idx) => (
                  <Link key={item.id} href={item.url || `/cambodia/news/${item.slug}`} className="py-3 first:pt-1 last:pb-0 flex items-start gap-3.5 group">
                    <span className="text-lg font-mono font-bold text-neutral-400 group-hover:text-neutral-900 transition-colors w-6 shrink-0">
                      0{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif font-bold text-neutral-900 group-hover:text-neutral-700 leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="mt-1 text-[10px] text-neutral-500 font-mono">
                        {item.views_count ? `${item.views_count.toLocaleString()} reads` : "Trending"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Publication Standards Box */}
            <div className="border border-neutral-200 bg-[#FAF9F6] p-5 space-y-2 text-xs">
              <h4 className="font-serif font-bold text-neutral-900 uppercase tracking-wider text-xs">
                Editorial Independence
              </h4>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                CamTech Blog operates under strict journalistic standards. All technological evaluations, ASEAN trade analyses, and scientific discoveries adhere to source verification protocols.
              </p>
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>Code of Ethics Certified</span>
                <Link href="/editorial-policy" className="underline text-neutral-800">Policy ↗</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
