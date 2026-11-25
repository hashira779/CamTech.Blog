"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ToolGuideSection } from "@/components/tools/ToolGuideSection";
import { CvNextSteps } from "@/components/tools/cv/CvNextSteps";
import { useI18n } from "@/lib/i18n";

const CvBuilder = dynamic(
  () => import("./CvBuilder").then((module) => module.CvBuilder),
  {
    loading: () => (
      <p role="status" className="py-12 text-center text-sm text-muted-foreground">
        Loading CV studio…
      </p>
    ),
  },
);

/**
 * Dedicated top-level studio shell for the Free Khmer & English CV Builder feature.
 * Uses only design-system semantic tokens and responds cleanly to EN / KM language switches.
 */
export function CvBuilderFeaturePage({
  feedbackEmail = null,
}: {
  feedbackEmail?: string | null;
}) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  return (
    <Section className="pb-12 pt-6 sm:pt-8" lang={isKm ? "km" : undefined}>
      <Container>
        <div className="mx-auto w-full max-w-7xl">
          <Breadcrumbs
            items={[{ label: t("nav.cv_builder") }]}
            className="mb-6"
          />

          <SectionHeader
            as="h1"
            label={t("cv.page_eyebrow")}
            title={t("cv.page_title")}
            description={t("cv.page_desc")}
          />

          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-surface via-surface/95 to-surface-muted/30 p-3 shadow-sm sm:p-6">
            <CvBuilder />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0 text-success" aria-hidden="true" />
              {isKm
                ? "ដំណើរការផ្ទាល់លើ Browser · មិនរក្សាទុកទិន្នន័យ CV ក្នុង Database ឡើយ"
                : "Runs directly in your browser · Zero account or database storage required"}
            </span>
          </div>

          <ToolGuideSection slug="cv-builder" headingId="cv-guide-title" />
          <CvNextSteps feedbackEmail={feedbackEmail} />
        </div>
      </Container>
    </Section>
  );
}
