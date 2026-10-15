import { notFound } from "next/navigation";
import { getAuthorBySlug, getArticles } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { NewsCard } from "@/components/shared/news-card";
import { Photo } from "@/components/ui/photo";
import { cleanText, formatCount } from "@/lib/format";

export const revalidate = 60;

/**
 * Author masthead + archive.
 *
 * Two invented things used to live here: a fallback bio for any author the API
 * had no biography for, and a "Verified Editorial Staff" badge every profile
 * wore regardless of the data. Both are gone — a profile now says only what
 * `Author` actually carries, and the story count is the API's own `total`.
 */
export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const { items: articles, total } = await getArticles({ author: slug, limit: 20 });

  const bio = cleanText(author.bio);
  const expertise = cleanText(author.expertise);
  const role = cleanText(author.role);
  const storyCount = total > 0 ? total : articles.length;

  return (
    <div className="flex w-full flex-1 flex-col">
      <Container className="pt-8 sm:pt-12">
        <Breadcrumbs items={[{ label: "Authors" }, { label: author.name }]} />

        {/* ── Masthead ────────────────────────────────────────────────────── */}
        <header className="mt-6 border-b border-border pb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {author.avatar_url && (
              <Photo
                src={author.avatar_url}
                alt={author.name}
                ratio="1/1"
                radius="lg"
                zoom={false}
                showCredit={false}
                className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
              />
            )}

            <div className="min-w-0 flex-1">
              {role && (
                <p className="section-label text-accent">{role}</p>
              )}
              <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {author.name}
              </h1>

              {bio && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {bio}
                </p>
              )}

              {(expertise || storyCount > 0) && (
                <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                  {expertise && (
                    <div className="flex items-baseline gap-2">
                      <dt className="section-label">
                        Focus
                      </dt>
                      <dd className="text-foreground">{expertise}</dd>
                    </div>
                  )}
                  {storyCount > 0 && (
                    <div className="flex items-baseline gap-2">
                      <dt className="section-label">
                        Stories
                      </dt>
                      <dd className="tabular-nums text-foreground">{formatCount(storyCount)}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </header>
      </Container>

      {/* ── Archive ─────────────────────────────────────────────────────── */}
      <Container className="py-10 sm:py-14">
        {articles.length > 0 ? (
          <>
            <SectionHeader
              label="Archive"
              title={`Reporting by ${author.name}`}
              description="Newest first, as published in the archive."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          </>
        ) : (
          <p className="py-10 text-sm leading-relaxed text-muted-foreground">
            No stories are listed for this byline yet.
          </p>
        )}
      </Container>

      {/* JSON-LD Person Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: author.name,
            jobTitle: author.role,
            description: author.bio,
            knowsAbout: author.expertise,
          }),
        }}
      />
    </div>
  );
}
