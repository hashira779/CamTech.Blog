import Link from "next/link";
import { Wrench, Calculator, Code2, ImageDown, ArrowRight } from "lucide-react";
import { getTools } from "@/lib/api";

export const revalidate = 60;

export default async function ToolsHubPage() {
  const tools = await getTools();

  const calculators = tools.filter((t) => t.category === "CALCULATOR");
  const devTools = tools.filter((t) => t.category === "DEVELOPER");
  const imageTools = tools.filter((t) => t.category === "IMAGE");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-rose-950 text-white space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400">
          <Wrench className="h-4 w-4" />
          <span>Productivity & Utilities Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Useful Everyday Online Tools
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          100% working, fast, and privacy-conscious calculators, developer formatters, and image tools.
          No ads trapping, no deceptive downloads, no accounts required.
        </p>
      </div>

      {/* Calculators Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <Calculator className="h-5 w-5 text-rose-600" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Calculators & Financial Utilities
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {calculators.map((t) => (
            <Link
              key={t.id}
              href={`/tools/${t.slug}`}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-bold text-rose-600 uppercase tracking-wider">Calculator</span>
                  <span>{t.usage_count} uses</span>
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {t.description}
                </p>
              </div>
              <div className="pt-4 mt-2 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>Launch Tool</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Developer Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <Code2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Developer & Data Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {devTools.map((t) => (
            <Link
              key={t.id}
              href={`/tools/${t.slug}`}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-bold text-indigo-600 uppercase tracking-wider">Developer</span>
                  <span>{t.usage_count} uses</span>
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {t.description}
                </p>
              </div>
              <div className="pt-4 mt-2 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Launch Tool</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Image & Media Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <ImageDown className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Image & File Utilities
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {imageTools.map((t) => (
            <Link
              key={t.id}
              href={`/tools/${t.slug}`}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-bold text-emerald-600 uppercase tracking-wider">Image / File</span>
                  <span>{t.usage_count} uses</span>
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {t.description}
                </p>
              </div>
              <div className="pt-4 mt-2 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Launch Tool</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
