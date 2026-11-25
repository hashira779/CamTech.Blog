"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TOOL_GUIDES } from "@/lib/tool-guides";
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
export function CvBuilderFeaturePage() {
  const { lang, t } = useI18n();
  const isKm = lang === "km";
  const guide = TOOL_GUIDES["cv-builder"];
  const guideStepsKm = [
    "បំពេញព័ត៌មានទំនាក់ទំនង សេចក្តីសង្ខេប និងបទពិសោធន៍ការងារ។ សរសេរអត្ថបទតាមភាសាខ្មែរ អង់គ្លេស ឬទាំងពីរភាសា។",
    "ជ្រើសរើសគំរូ CV ឥតគិតថ្លៃណាមួយក្នុងចំណោម ៣០ ម៉ូដ និងពិនិត្យមើលផ្ទាល់លើទំព័រ A4។ ដាក់បទពិសោធន៍ថ្មីបំផុតនៅខាងលើ។",
    "ចុច បោះពុម្ព / រក្សាទុក PDF ឬ ផ្ញើទៅ Telegram / QR តាមរយៈ @CamTech_Blog_bot មុនពេលចាកចេញ ឬ refresh ទំព័រ។",
  ];

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

          {guide && (
            <section className="field-tool-guide" aria-labelledby="cv-guide-title">
              <p className="field-eyebrow">{isKm ? "ការណែនាំរហ័ស" : "A quick guide"}</p>
              <h2 id="cv-guide-title">
                {isKm ? "បង្កើត CV ពីរភាសាស្អាតៗក្នុងរយៈពេលប៉ុន្មាននាទី។" : "Build a clean bilingual CV in minutes."}
              </h2>
              <p>
                {isKm
                  ? "បង្កើត CV សម្រាប់ដាក់ពាក្យការងារជាភាសាអង់គ្លេស ខ្មែរ ឬទាំងពីរភាសាព្រមគ្នា ដោយមិនចាំបាច់បង្កើតគណនីឡើយ។"
                  : guide.intro}
              </p>
              <ol>
                {(isKm ? guideStepsKm : guide.steps).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <aside>
                <strong>{isKm ? "គួរដឹងបន្ថែម" : "Good to know"}</strong>
                <p>
                  {isKm
                    ? "ទិន្នន័យ CV ស្ថិតតែក្នុងទំព័រដែលកំពុងបើកប៉ុណ្ណោះ ដោយមិនរក្សាទុកក្នុងគណនី ឬ Database ឡើយ។ នៅពេលអ្នកចុច ផ្ញើទៅ Telegram ឯកសារ PDF បណ្ដោះអាសន្នតែមួយត្រូវបានផ្ទុកក្នុង RAM cache ត្រឹម ១៥ នាទី រហូតដល់ផ្ញើរួច។"
                    : guide.note}
                </p>
              </aside>
            </section>
          )}
        </div>
      </Container>
    </Section>
  );
}
