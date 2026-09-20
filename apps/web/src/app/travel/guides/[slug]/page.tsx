import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTravelGuide } from "@/lib/api";
import { BookOpen, Clock, Calendar, ArrowLeft, ShieldCheck, Share2 } from "lucide-react";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TravelGuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await getTravelGuide(slug);

  if (!guide) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/travel" className="hover:text-primary transition-colors">Travel</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Guides</span>
      </nav>

      {/* Back button */}
      <Link
        href="/travel"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Travel Hub
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3 h-3" /> Field Travel Guide
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {guide.read_time_minutes} read
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" /> 2026 Verified
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          {guide.title}
        </h1>

        {guide.title_km && (
          <p className="text-base text-muted-foreground font-khmer mb-4 leading-relaxed">
            {guide.title_km}
          </p>
        )}

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-serif italic border-l-4 border-primary pl-4 py-1 mb-6">
          {guide.summary}
        </p>
      </header>

      {/* Hero Visual */}
      {guide.hero_image_url && (
        <div className="rounded-2xl overflow-hidden mb-8 border shadow-sm aspect-[16/9] relative">
          <img
            src={guide.hero_image_url}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Guide Body Content */}
      <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed space-y-4">
        {guide.content.split("\n\n").map((block, idx) => {
          const trimmed = block.trim();
          if (trimmed.startsWith("### ")) {
            return (
              <h2 key={idx} className="text-xl sm:text-2xl font-bold mt-8 mb-3 text-foreground">
                {trimmed.replace("### ", "")}
              </h2>
            );
          }
          if (trimmed.startsWith("* ") || trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. ")) {
            return (
              <div key={idx} className="bg-muted/40 p-4 rounded-xl border my-3 space-y-2 text-sm">
                {trimmed.split("\n").map((line, li) => (
                  <p key={li} className="leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            );
          }
          return (
            <p key={idx} className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {trimmed}
            </p>
          );
        })}
      </div>

      {/* Editorial Disclosure Footer */}
      <div className="mt-12 pt-6 border-t bg-muted/30 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Editorial Standards Notice
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Daily Discovery guides are created through verified ground experience, consultation with local tourism authorities, and independent research. We do not accept sponsored placements or paid endorsements for our ranking recommendations.
        </p>
      </div>
    </article>
  );
}
