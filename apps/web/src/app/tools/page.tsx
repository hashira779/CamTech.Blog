import React from "react";
import { Metadata } from "next";
import { Calculator, Code2, Image as ImageIcon, FileText } from "lucide-react";
import { getTools } from "@/lib/api";
import type { Tool } from "@/types";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ToolCard } from "@/components/shared/tool-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/ui/reveal";


export const metadata: Metadata = {
  title: "Online Utilities & Productivity Tools | CamTech Blog",
  description:
    "Free calculators, developer formatters and image tools that run in your browser, with no downloads or tracking.",
};

export const revalidate = 60;

interface Group {
  key: string;
  category: Tool["category"];
  label: string;
  title: string;
  description: string;
  Icon: typeof Calculator;
}

const GROUPS: Group[] = [
  {
    key: "calculators",
    category: "CALCULATOR",
    label: "Calculators",
    title: "Calculators & financial utilities",
    description: "Percentages, discounts, loans, profit and dates, computed on your device.",
    Icon: Calculator,
  },
  {
    key: "developer",
    category: "DEVELOPER",
    label: "Developer",
    title: "Developer & data utilities",
    description: "Format, validate and inspect structured text.",
    Icon: Code2,
  },
  {
    key: "image",
    category: "IMAGE",
    label: "Image & media",
    title: "Image & QR utilities",
    description: "Compress pictures and encode links without uploading them anywhere.",
    Icon: ImageIcon,
  },
  {
    key: "text",
    category: "TEXT",
    label: "Text",
    title: "Writing & text tools",
    description: "Count words, characters and reading time as you type.",
    Icon: FileText,
  },
];

export default async function ToolsHubPage() {
  const tools = await getTools();

  const groups = GROUPS.map((group) => ({
    ...group,
    items: tools.filter((tool) => tool.category === group.category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex w-full flex-1 flex-col">
      <Section className="pb-8 pt-6 sm:pt-8">
        <Container>
          <Breadcrumbs items={[{ label: "Tools", href: "/tools" }]} className="mb-6" />

          <SectionHeader
            as="h1"
            label="Tools"
            title="Everyday online tools"
            description="Calculators, formatters and converters that run entirely in your browser. Nothing you enter is uploaded or stored."
          />

          {groups.length === 0 ? (
            <EmptyState
              icon={Calculator}
              title="No tools published yet"
              description="Utilities are added over time. Check back soon, or browse the daily quiz in the meantime."
              actionLabel="Daily quiz"
              actionHref="/quiz"
            />
          ) : (
            <div className="mt-10 space-y-12">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`${group.key}-heading`}>
                  <SectionHeader
                    as="h2"
                    label={group.label}
                    title={group.title}
                    description={group.description}
                    className="mb-5 sm:mb-6"
                  />
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((tool, idx) => (
                      <Reveal key={tool.id} index={idx} variant="up">
                        <ToolCard
                          slug={tool.slug}
                          name={tool.name}
                          category={group.label}
                          description={tool.description}
                          usageCount={tool.usage_count}
                          popular={tool.is_popular}
                        />
                      </Reveal>
                    ))}
                  </div>

                </section>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
