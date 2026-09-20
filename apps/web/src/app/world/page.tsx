import Link from "next/link";
import { Globe2 } from "lucide-react";
import { getArticles } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";

export const revalidate = 60;

export default async function WorldNewsPage() {
  const { items } = await getArticles({ country: "WORLD", limit: 20 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-neutral-900 to-neutral-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
          <Globe2 className="h-4 w-4" />
          <span>Global Coverage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          World News, Science & Technology
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          Frontier artificial intelligence, clean energy, space exploration, macroeconomic developments, and major international milestones with verified original synthesis.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
