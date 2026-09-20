import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Globe, Database, ChevronRight, BookOpen } from "lucide-react";
import { getSourceBySlug, getArticles } from "@/lib/api";
import { NewsCard } from "@/components/news/NewsCard";

export const revalidate = 60;

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const source = await getSourceBySlug(slug);

  if (!source) {
    notFound();
  }

  const { items: articles } = await getArticles({ source: slug, limit: 20 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/sources" className="hover:text-slate-900 dark:hover:text-slate-100">
          Sources
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{source.name}</span>
      </nav>

      {/* Source Profile Card */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              {source.trust_level.replace(/_/g, " ")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {source.name}
            </h1>
          </div>

          <a
            href={source.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <span>Visit Publisher Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Jurisdiction</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{source.country}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Primary Language</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{source.language.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Category</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{source.category}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Attribution Policy</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Strict Attribution Required</span>
          </div>
        </div>

        {source.license_notes && (
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            <strong>Attribution & Licensing Notes:</strong> {source.license_notes}
          </div>
        )}
      </div>

      {/* Stories derived from this source */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Verified Stories Attributed to {source.name}
        </h2>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500 font-medium">
              No published stories currently attributed to this source.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
