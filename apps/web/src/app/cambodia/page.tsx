import Link from "next/link";
import { MapPin } from "lucide-react";
import { getArticles } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";

export const revalidate = 60;

export default async function CambodiaNewsPage() {
  const { items } = await getArticles({ country: "KH", limit: 20 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-900 via-neutral-900 to-indigo-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400">
          <MapPin className="h-4 w-4" />
          <span>Regional Focus</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Cambodia & Regional News
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          In-depth reporting, verified government updates, economy, infrastructure, and technology across Phnom Penh and all provinces.
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
