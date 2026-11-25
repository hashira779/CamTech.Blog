"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ToolDispatcher } from "@/components/tools/ToolDispatcher";
import { ToolGuideSection } from "@/components/tools/ToolGuideSection";
import { CvNextSteps } from "@/components/tools/cv/CvNextSteps";
import { AdSlot } from "@/components/ads/AdSlot";
import { ALL_TOOLS } from "@/lib/tools-data";
import { cleanText, humanize } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tool } from "@/types";

/**
 * Localized shell around `/tools/[slug]` so navigation, headers, guide copy,
 * and CV Builder promotion respond cleanly to English & Khmer selection.
 */
export function ToolPageView({ tool }: { tool: Tool }) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";
  const isCv = tool.slug === "cv-builder";

  const localDef = ALL_TOOLS.find((item) => item.slug === tool.slug);
  const title = (isKm && (localDef?.name_km || tool.name_km)) || tool.name;
  const rawDescription = (isKm && (localDef?.description_km || tool.description_km)) || tool.description;
  const description = cleanText(rawDescription);

  const label = isCv ? t("cv.page_eyebrow") : humanize(tool.category);
  const breadcrumbRoot = isKm ? "ឧបករណ៍" : "Tools";

  return (
    <Section className="pb-12 pt-6 sm:pt-8" lang={isKm ? "km" : undefined}>
      <Container>
        <div className={`mx-auto w-full ${isCv ? "max-w-7xl" : "max-w-3xl"}`}>
          <Breadcrumbs
            items={
              isCv
                ? [{ label: t("nav.cv_builder") }]
                : [{ label: breadcrumbRoot, href: "/tools" }, { label: title }]
            }
            className="mb-6"
          />

          <SectionHeader
            as="h1"
            label={label}
            title={title}
            description={description || undefined}
          />

          <div
            className={`relative rounded-3xl border border-border/80 bg-gradient-to-b from-surface via-surface/95 to-surface-muted/30 shadow-sm ${
              isCv ? "p-3 sm:p-6" : "overflow-hidden p-6 backdrop-blur-xl sm:p-8"
            }`}
          >
            <ToolDispatcher tool={tool} />
          </div>

          <div className="mt-6">
            <AdSlot
              slot="TOOL_BOTTOM"
              eligible={[
                "json-formatter",
                "json-validator",
                "word-counter",
                "uuid-generator",
                "base64-converter",
                "url-encoder",
                "percentage-calculator",
                "qr-code-generator",
                "image-compressor",
                "color-contrast-checker",
              ].includes(tool.slug)}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0 text-success" aria-hidden="true" />
              {isCv
                ? isKm
                  ? "ដំណើរការផ្ទាល់លើ Browser · មិនរក្សាទុកទិន្នន័យ CV ក្នុង Database ឡើយ"
                  : "Runs directly in your browser · Zero account or database storage required"
                : isKm
                  ? "សូមពិនិត្យការពិពណ៌នារបស់ឧបករណ៍នីមួយៗសម្រាប់វិធីដំណើរការទិន្នន័យ។"
                  : "Check each tool’s description for its processing and data sources."}
            </span>
            {tool.version && <span className="tabular-nums">v{tool.version}</span>}
          </div>

          <ToolGuideSection slug={tool.slug} />

          {isCv && <CvNextSteps />}

          <Link
            href="/tools"
            className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            {isKm ? "ឧបករណ៍ទាំងអស់" : "All tools"}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
