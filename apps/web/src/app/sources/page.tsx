import Link from "next/link";
import { ShieldCheck, ExternalLink, Globe, Database, Award } from "lucide-react";
import { getSources } from "@/lib/api";

export const revalidate = 60;

export default async function SourcesDirectoryPage() {
  const sources = await getSources();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
          <Database className="h-4 w-4" />
          <span>Transparency & Attribution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Verified Source Registry
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
          Daily Discovery maintains a strict, auditable Source Registry. We never scrape full text or mirror external publishers.
          Every external report is independently summarized, credited, and attributed to its original publisher.
        </p>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div
            key={source.id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {source.trust_level.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {source.country} • {source.language}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  <Link href={`/source/${source.slug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
                    {source.name}
                  </Link>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Category: {source.category}
                </p>
              </div>

              {source.license_notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {source.license_notes}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <Link
                href={`/source/${source.slug}`}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Attribution Profile →
              </Link>
              <a
                href={source.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <span>Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
