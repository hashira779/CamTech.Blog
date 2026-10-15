import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTravelGuide } from "@/lib/api";
import type { TravelGuide } from "@/types";
import { generateTravelGuideJsonLd, generateBreadcrumbJsonLd, generateOgMeta, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { Byline, MetaDot } from "@/components/ui/byline";
import { cleanText, estimateReadingMinutes } from "@/lib/format";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getTravelGuide(slug);

  if (!guide) {
    return { title: "Guide Not Found" };
  }

  const ogMeta = generateOgMeta({
    title: guide.title,
    description: guide.summary,
    image: guide.hero_image_url,
    type: "article",
    url: `${SITE_URL}/travel/guides/${guide.slug}`,
    publishedTime: guide.published_at,
  });

  return {
    title: guide.title,
    description: guide.summary,
    alternates: {
      canonical: `${SITE_URL}/travel/guides/${guide.slug}`,
    },
    ...ogMeta,
  };
}

const LIST_LINE = /^\s*([-*•]|\d+[.)])\s+(.*)$/;

/**
 * Markdown-ish blocks written by the guide generator: `##`/`###` subheadings,
 * bullet and numbered lists, plain paragraphs. Presentation only — the raw text
 * is never rewritten.
 */
function GuideBlock({ block, isFirst }: { block: string; isFirst: boolean }) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const heading = trimmed.match(/^#{1,4}\s+(.*)$/);
  if (heading) {
    return (
      <h2 className="pt-4 font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
        {cleanText(heading[1])}
      </h2>
    );
  }

  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  const listLines = lines.map((line) => line.match(LIST_LINE));

  if (lines.length > 0 && listLines.every((match) => match)) {
    const ordered = /^\d/.test(listLines[0]![1]);
    const Tag = ordered ? "ol" : "ul";
    return (
      <Tag
        className={
          ordered
            ? "list-decimal space-y-2 pl-5 text-base leading-relaxed text-foreground/90 marker:text-muted-foreground"
            : "divide-y divide-border border-y border-border text-base leading-relaxed text-foreground/90"
        }
      >
        {listLines.map((match, i) => (
          <li key={i} className={ordered ? undefined : "py-2.5 pl-1"}>
            {cleanText(match![2])}
          </li>
        ))}
      </Tag>
    );
  }

  return (
    <p
      className={
        isFirst
          ? "drop-cap text-base leading-relaxed text-foreground/90 sm:text-lg"
          : "text-base leading-relaxed text-foreground/90 sm:text-lg"
      }
    >
      {cleanText(trimmed)}
    </p>
  );
}

export default async function TravelGuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide: TravelGuide | null = await getTravelGuide(slug);

  if (!guide) {
    notFound();
  }

  const guideJsonLd = generateTravelGuideJsonLd(guide, SITE_URL);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", url: "/" },
      { name: "Travel", url: "/travel" },
      { name: guide.title, url: `/travel/guides/${guide.slug}` },
    ],
    SITE_URL
  );

  const blocks = (guide.content || "").split("\n\n").filter((block) => block.trim());
  const minutes = estimateReadingMinutes(guide.content);

  return (
    <>
      <JsonLd data={guideJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <article className="flex w-full flex-1 flex-col">
        {/* Breadcrumb */}
        <Container className="pt-6 sm:pt-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <MetaDot />
            <Link href="/travel" className="transition-colors hover:text-foreground">
              Travel
            </Link>
            <MetaDot />
            <span className="text-foreground">Guide</span>
          </nav>
        </Container>

        {/* Headline */}
        <Container className="pt-8 pb-8 sm:pt-12">
          <div className="max-w-4xl">
            <CategoryMark category="travel" tone="dot">
              Field guide
            </CategoryMark>

            <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {cleanText(guide.title)}
            </h1>

            {guide.title_km && (
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{guide.title_km}</p>
            )}

            {guide.summary && (
              <p className="mt-5 max-w-2xl border-l border-border-strong pl-5 text-lg leading-relaxed text-muted-foreground">
                {cleanText(guide.summary)}
              </p>
            )}

            <Byline className="mt-6" date={guide.published_at} dateStyle="long" readingTime={minutes} size="md" />
          </div>
        </Container>

        {/* Photograph — honest tile when the guide has no verified image */}
        <Container className="pb-10">
          <Photo
            src={guide.hero_image_url}
            alt={cleanText(guide.title)}
            ratio="3/2"
            radius="hero"
            priority
            placeholderLabel="No verified photograph for this guide yet"
          />
        </Container>

        {/* Body */}
        <Container width="reading" className="space-y-5 pb-12 sm:pb-16">
          {blocks.map((block, idx) => (
            <GuideBlock key={idx} block={block} isFirst={idx === 0} />
          ))}
        </Container>

        {/* Editorial note */}
        <Container width="reading" className="pb-12">
          <aside className="rounded-lg border border-border bg-surface-muted p-6">
            <p className="section-label text-accent">How this guide is made</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              CamTech.Blog guides are written from our own reporting and checked against official
              tourism sources. Prices, opening times and closures change without notice, so each guide
              carries the date it was published. We do not accept payment for placement in a guide.
            </p>
            <Link
              href="/travel"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to travel
            </Link>
          </aside>
        </Container>
      </article>
    </>
  );
}
