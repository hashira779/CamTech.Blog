"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
import { localizeCategory, localizeDesk, useI18n } from "@/lib/i18n";

const TH = "text-muted-foreground dark:text-muted-foreground";
const TD = "align-top text-foreground dark:text-foreground";
const TD_MUTED = "align-top text-muted-foreground dark:text-muted-foreground";

export function SourcesClient({
  rows,
  jurisdictions,
}: {
  rows: Source[];
  jurisdictions: number;
}) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  return (
    <div className="flex w-full flex-1 flex-col" lang={isKm ? "km" : undefined}>
      <Container className="pt-8 sm:pt-12">
        <Breadcrumbs items={[{ label: t("sources.title") }]} />

        <div className="mt-6 border-b border-border pb-8">
          <p className="section-label text-accent">{t("sources.eyebrow")}</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {t("sources.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t("sources.description")}
          </p>

          {rows.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="section-label">{t("sources.count_label")}</dt>
                <dd className="tabular-nums text-foreground">{rows.length}</dd>
              </div>
              {jurisdictions > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="section-label">{t("sources.jurisdictions")}</dt>
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
              {isKm ? "មិនទាន់មានប្រភពព័ត៌មានត្រូវបានកត់ត្រាទេ។" : "The source registry is currently empty."}
            </p>
          ) : (
            <>
              <SectionHeader
                label={t("sources.count_label")}
                title={t("sources.recorded_title")}
                description={t("sources.recorded_desc")}
                as="h2"
              />

              <Table className="bg-card">
                <TableHeader className="border-border bg-surface-muted dark:border-border dark:bg-surface">
                  <TableRow>
                    <TableHead className={TH}>{t("sources.col_source")}</TableHead>
                    <TableHead className={TH}>{t("sources.col_country")}</TableHead>
                    <TableHead className={TH}>{t("sources.col_language")}</TableHead>
                    <TableHead className={TH}>{t("sources.col_trust")}</TableHead>
                    <TableHead className={TH}>{t("sources.col_license")}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-border bg-card dark:divide-border dark:bg-transparent">
                  {rows.map((source) => {
                    const notes = cleanText(source.license_notes);
                    const desk = localizeDesk(source.country, lang);
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
                              {localizeCategory(source.category, lang) || humanize(source.category)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={TD_MUTED}>
                          {source.country ? `${desk.label} (${source.country})` : "—"}
                        </TableCell>
                        <TableCell className={TD_MUTED}>
                          {source.language ? source.language.toUpperCase() : "—"}
                        </TableCell>
                        <TableCell className={TD}>
                          {source.trust_level ? humanize(source.trust_level) : "—"}
                        </TableCell>
                        <TableCell className={TD_MUTED}>
                          {notes ? (
                            <span className="block max-w-prose text-sm leading-relaxed">{notes}</span>
                          ) : (
                            <span>—</span>
                          )}
                          {source.website_url && (
                            <a
                              href={source.website_url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-foreground"
                            >
                              {isKm ? "គេហទំព័រដើម" : "Original site"}
                              <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </Container>
      </Section>
    </div>
  );
}
