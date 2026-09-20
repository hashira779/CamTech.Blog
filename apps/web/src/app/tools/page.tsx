import React from "react";
import { Metadata } from "next";
import { PublicPageShell } from "@/components/layout/public-shell";
import { ToolCard } from "@/components/shared/tool-card";
import { Badge } from "@/components/ui/badge";
import { getTools } from "@/lib/api";
import { Wrench, Calculator, Code2, QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Online Utilities & Productivity Tools | Daily Discovery",
  description: "Free, privacy-conscious financial calculators, developer utilities, and image conversion tools with zero ads or tracking.",
};

export const revalidate = 60;

export default async function ToolsHubPage() {
  const tools = await getTools();

  const calculators = tools.filter((t) => t.category === "CALCULATOR");
  const devTools = tools.filter((t) => t.category === "DEVELOPER");
  const imageTools = tools.filter((t) => t.category === "IMAGE");

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Tools & Utilities", href: "/tools" }]}
      badge={
        <Badge variant="default" size="sm" className="gap-1">
          <Wrench size={12} />
          Client Productivity Tools
        </Badge>
      }
      title="Useful Everyday Online Tools"
      description="Fast, privacy-conscious calculators, developer formatters, and image converters running directly in your browser without tracking or download traps."
    >
      <div className="space-y-12">
        {/* Calculators Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Calculator className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Calculators & Financial Utilities
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {calculators.map((t) => (
              <ToolCard
                key={t.id}
                slug={t.slug}
                name={t.name}
                category="Calculator"
                description={t.description}
              />
            ))}
          </div>
        </section>

        {/* Developer Tools Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Code2 className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Developer & Data Utilities
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {devTools.map((t) => (
              <ToolCard
                key={t.id}
                slug={t.slug}
                name={t.name}
                category="Developer"
                description={t.description}
              />
            ))}
          </div>
        </section>

        {/* Image & Media Tools Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <QrCode className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Image & QR Utilities
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {imageTools.map((t) => (
              <ToolCard
                key={t.id}
                slug={t.slug}
                name={t.name}
                category="File & Media"
                description={t.description}
              />
            ))}
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
