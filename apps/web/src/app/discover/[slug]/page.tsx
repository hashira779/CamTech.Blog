import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, ChevronRight, CheckCircle2, BookOpen, ExternalLink, HelpCircle, Wrench } from "lucide-react";
import { getDiscoveryBySlug } from "@/lib/api";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const disc = await getDiscoveryBySlug(resolvedParams.slug);
  if (!disc) return { title: "Discovery Not Found" };
  return {
    title: `${disc.title} | Daily Discovery`,
    description: disc.intro,
    openGraph: {
      title: disc.title,
      description: disc.intro,
      images: [disc.hero_image_url],
      type: "article"
    }
  };
}

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const disc = await getDiscoveryBySlug(resolvedParams.slug);

  if (!disc) {
    notFound();
  }

  let visualSections: any[] = [];
  try {
    if (disc.visual_sections) visualSections = JSON.parse(disc.visual_sections);
  } catch (e) {}

  let importantFacts: string[] = [];
  try {
    if (disc.important_facts) importantFacts = JSON.parse(disc.important_facts);
  } catch (e) {}

  let sourcesList: any[] = [];
  try {
    if (disc.sources) sourcesList = JSON.parse(disc.sources);
  } catch (e) {}

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="hover:text-rose-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/discover" className="hover:text-rose-600 transition-colors font-medium text-neutral-600 dark:text-neutral-300">
          Discover
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-neutral-400">{disc.category}</span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          {disc.category}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
          {disc.title}
        </h1>
        <p className="text-base sm:text-lg font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {disc.intro}
        </p>
      </div>

      {/* Hero Visual */}
      <div className="space-y-2">
        <div className="overflow-hidden rounded-3xl aspect-[16/9] bg-neutral-100 dark:bg-neutral-900">
          <img
            src={disc.hero_image_url}
            alt={disc.title}
            className="w-full h-full object-cover"
          />
        </div>
        {disc.hero_image_credit && (
          <div className="text-right text-[11px] text-neutral-400 italic">
            Visual reference: {disc.hero_image_credit}
          </div>
        )}
      </div>

      {/* Main Explanation */}
      <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div dangerouslySetInnerHTML={{ __html: disc.main_explanation.replace(/\n\n/g, "<br/><br/>") }} />
      </div>

      <AdSlot slot="DISCOVERY_MID" />

      {/* Visual Section Breakdown Cards */}
      {visualSections.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white">
            Step-by-Step Anatomy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visualSections.map((sec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2"
              >
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {sec.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {sec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Facts Box */}
      {importantFacts.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Essential Scientific & Historical Facts</span>
          </h3>
          <ul className="space-y-2">
            {importantFacts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources & References */}
      {sourcesList.length > 0 && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Verified Scientific Sources & Literature
          </h4>
          <div className="flex flex-wrap gap-3">
            {sourcesList.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <span>{src.name}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Cross links to Quiz & Tools */}
      <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/quiz"
          className="p-5 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/10 flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Test yourself</span>
            <span className="font-bold text-sm text-neutral-900 dark:text-white">Take Today's Daily Quiz</span>
          </div>
          <HelpCircle className="h-5 w-5 text-rose-600 group-hover:rotate-12 transition-transform" />
        </Link>
        <Link
          href="/tools"
          className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Productivity</span>
            <span className="font-bold text-sm text-neutral-900 dark:text-white">Explore Everyday Tools</span>
          </div>
          <Wrench className="h-5 w-5 text-neutral-600 group-hover:rotate-12 transition-transform" />
        </Link>
      </div>

    </article>
  );
}
