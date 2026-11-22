import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getToolBySlug } from "@/lib/api";
import { ToolDispatcher } from "@/components/tools/ToolDispatcher";
import { AdSlot } from "@/components/ads/AdSlot";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cleanText, humanize } from "@/lib/format";
import { TOOL_GUIDES } from "@/lib/tool-guides";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getToolBySlug(resolvedParams.slug);
  if (!tool) return { title: "Tool Not Found" };
  return {
    title: `${tool.name} — free online tool`,
    description: tool.description,
  };
}

export default async function ToolExecutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const tool = await getToolBySlug(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  const description = cleanText(tool.description);
  const guide = TOOL_GUIDES[tool.slug];

  return (
    <Section className="pb-12 pt-6 sm:pt-8">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Tools", href: "/tools" },
              { label: tool.name },
            ]}
            className="mb-6"
          />

          <SectionHeader
            as="h1"
            label={humanize(tool.category)}
            title={tool.name}
            description={description || undefined}
          />

          {/* One panel per tool: the calculator supplies the fields, the page
              supplies the paper, so no route draws its own box. */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs sm:p-7">
            <ToolDispatcher tool={tool} />
          </div>

          <div className="mt-6">
            <AdSlot slot="TOOL_BOTTOM" eligible={[
              "json-formatter", "json-validator", "word-counter", "uuid-generator",
              "base64-converter", "url-encoder", "percentage-calculator",
              "qr-code-generator", "image-compressor", "color-contrast-checker",
            ].includes(tool.slug)} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0 text-success" aria-hidden="true" />
              Check each tool’s description for its processing and data sources.
            </span>
            {/* Only a real version string from the API is printed. */}
            {tool.version && <span className="tabular-nums">v{tool.version}</span>}
          </div>

          {guide && <section className="field-tool-guide" aria-labelledby="tool-guide-title"><p className="field-eyebrow">A quick guide</p><h2 id="tool-guide-title">Make the most of this tool.</h2><p>{guide.intro}</p><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol><aside><strong>Good to know</strong><p>{guide.note}</p></aside></section>}

          <Link
            href="/tools"
            className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            All tools
          </Link>
        </div>
      </Container>
    </Section>
  );
}
