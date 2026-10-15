import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getSources } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Source } from "@/types";
import { cleanText, humanize } from "@/lib/format";

export const revalidate = 60;

/** A registry row must never invent a value the pipeline did not return. */
function NotRecorded() {
  return (
    <span className="text-border-strong">
      <span aria-hidden="true">&mdash;</span>
      <span className="sr-only">Not recorded</span>
    </span>
  );
}

/**
 * `ui/table.tsx` still paints its own slate header/body/hover. Each override
 * repeats for `dark:` because tailwind-merge only drops a base class when the
 * same variant is supplied, and the primitive ships both.
 */
const TH = "text-muted-foreground dark:text-muted-foreground";
const TD = "align-top text-foreground dark:text-foreground";
const TD_MUTED = "align-top text-muted-foreground dark:text-muted-foreground";

function byName(a: Source, b: Source) {
  return a.name.localeCompare(b.name);
}

/**
 * Source registry.
 *
 * This page is the site's transparency claim, so it renders the `Source`
 * records and nothing else: name, country, language, trust level and licence
 * notes as stored. The old grid promised "Strict Attribution Required" for
 * every card, a label that is not a field on the record.
 */
export default async function SourcesDirectoryPage() {
  const sources = await getSources();
  const rows = [...(sources || [])].sort((a, b) => a.country.localeCompare(b.country) || byName(a, b));

  const jurisdictions = new Set(rows.map((source) => source.country).filter(Boolean)).size;

  return (
    <div className="flex w-full flex-1 flex-col">
      <Container className="pt-8 sm:pt-12">
        <Breadcrumbs items={[{ label: "Sources" }]} />

        <div className="mt-6 border-b border-border pb-8">
          <p className="section-label text-accent">Transparency &amp; attribution</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Source registry
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every publisher and feed this site draws on is listed below. We do not republish full
            articles or mirror external sites: stories are summarised here and credited to the
            original publisher, with a link back to the report they came from.
          </p>

          {rows.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="section-label">Sources</dt>
                <dd className="tabular-nums text-foreground">{rows.length}</dd>
              </div>
              {jurisdictions > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="section-label">
                    Jurisdictions
                  </dt>
                  <dd className="tabular-nums text-foreground">{jurisdictions}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </Container>

      <Section className="pt-8">
        <Container>
          {rows.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              The registry is empty right now — no sources are recorded, so nothing here is being
              credited.
            </p>
          ) : (
            <>
              <SectionHeader
                label="Registry"
                title="Recorded sources"
                description="Values are shown exactly as the ingestion pipeline records them."
                as="h2"
              />

              <Table className="bg-card">
                <TableHeader className="border-border bg-surface-muted dark:border-border dark:bg-surface">
                  <TableRow>
                    <TableHead className={TH}>Source</TableHead>
                    <TableHead className={TH}>Country</TableHead>
                    <TableHead className={TH}>Language</TableHead>
                    <TableHead className={TH}>Trust level</TableHead>
                    <TableHead className={TH}>Licence notes</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-border bg-card dark:divide-border dark:bg-transparent">
                  {rows.map((source) => {
                    const notes = cleanText(source.license_notes);
                    return (
                      <TableRow key={source.id} className="hover:bg-surface-muted/70 dark:hover:bg-surface">
                        <TableCell className={TD}>
                          <Link
                            href={`/source/${source.slug}`}
                            className="font-display text-base leading-snug transition-colors hover:text-accent"
                          >
                            {source.name}
                          </Link>
                          {source.category && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {humanize(source.category)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={TD_MUTED}>
                          {source.country ? source.country : <NotRecorded />}
                        </TableCell>

                        <TableCell className={TD_MUTED}>
                          {source.language ? source.language.toUpperCase() : <NotRecorded />}
                        </TableCell>

                        <TableCell className={TD}>
                          {source.trust_level ? humanize(source.trust_level) : <NotRecorded />}
                        </TableCell>

                        <TableCell className={TD_MUTED}>
                          {notes ? (
                            <span className="block max-w-prose text-sm leading-relaxed">{notes}</span>
                          ) : (
                            <NotRecorded />
                          )}
                          {source.website_url && (
                            <a
                              href={source.website_url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-foreground"
                            >
                              Original site
                              <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Missing a publisher, or is an attribution on one of our stories wrong?{" "}
                <Link href="/contact" className="text-accent hover:text-foreground">
                  Tell the newsroom
                </Link>
                . How corrections are handled is set out in the{" "}
                <Link href="/corrections-policy" className="text-accent hover:text-foreground">
                  corrections policy
                </Link>
                .
              </p>
            </>
          )}
        </Container>
      </Section>
    </div>
  );
}
