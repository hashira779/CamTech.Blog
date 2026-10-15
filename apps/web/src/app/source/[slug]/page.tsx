import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getSourceBySlug, getArticles } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { NewsCard } from "@/components/shared/news-card";
import { cleanText, humanize } from "@/lib/format";

export const revalidate = 60;

function trustTone(trustLevel: string) {
  const v = trustLevel.toLowerCase();
  if (v.includes("high")) return "success" as const;
  if (v.includes("medium") || v.includes("partial")) return "warning" as const;
  if (v.includes("low")) return "destructive" as const;
  return "outline" as const;
}

/**
 * Source profile.
 *
 * The block used to advertise an "Attribution Policy: Strict Attribution
 * Required" that is not a field on `Source` — an invented guarantee on the page
 * that exists to prove the opposite. It now lists jurisdiction, language,
 * category, feed and licence notes, and nothing else.
 */
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

  const { items: articles, total } = await getArticles({ source: slug, limit: 20 });

  const trust = humanize(source.trust_level);
  const licenceNotes = cleanText(source.license_notes);
  const facts = [
    { label: "Jurisdiction", value: source.country },
    { label: "Language", value: source.language ? source.language.toUpperCase() : "" },
    { label: "Category", value: source.category },
    { label: "Stories here", value: String(total > 0 ? total : articles.length) },
  ].filter((fact) => cleanText(fact.value));

  return (
    <div className="flex w-full flex-1 flex-col">
      <Container className="pt-8 sm:pt-12">
        <Breadcrumbs items={[{ label: "Sources", href: "/sources" }, { label: source.name }]} />

        {/* ── Masthead ────────────────────────────────────────────────────── */}
        <header className="mt-6 border-b border-border pb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="section-label text-accent">Source registry</p>
              <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {source.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {trust && (
                  <Badge variant={trustTone(source.trust_level)} size="sm">
                    {trust}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Entries in this registry are the feeds and publishers the site draws on.{" "}
                  <Link href="/sources" className="text-accent hover:text-foreground">
                    View all sources
                  </Link>
                </p>
              </div>
            </div>

            {source.website_url && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <a href={source.website_url} target="_blank" rel="noopener noreferrer nofollow">
                  Publisher website
                  <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>

          {facts.length > 0 && (
            <dl className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="section-label">{fact.label}</dt>
                  <dd className="mt-1.5 text-sm font-medium text-foreground">
                    {fact.label === "Stories here" ? (
                      <span className="tabular-nums">{fact.value}</span>
                    ) : (
                      fact.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {source.feed_url && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="section-label">Feed</span>{" "}
              <a
                href={source.feed_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="break-all text-accent underline-offset-4 hover:underline"
              >
                {source.feed_url}
              </a>
            </p>
          )}

          {licenceNotes && (
            <div className="mt-8 border-l-2 border-accent bg-accent-soft/60 p-5">
              <p className="section-label text-muted-foreground">Licensing notes</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{licenceNotes}</p>
            </div>
          )}
        </header>
      </Container>

      {/* ── Stories from this source ────────────────────────────────────── */}
      <Container className="py-10 sm:py-14">
        {articles.length > 0 ? (
          <>
            <SectionHeader
              label="Syndicated"
              title={`Stories credited to ${source.name}`}
              description="Summaries written here; the original report stays with the publisher."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          </>
        ) : (
          <p className="py-10 text-sm leading-relaxed text-muted-foreground">
            No stories are currently credited to this source.
          </p>
        )}
      </Container>
    </div>
  );
}
