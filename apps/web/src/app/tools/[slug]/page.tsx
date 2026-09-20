import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Wrench, ShieldCheck } from "lucide-react";
import { getToolBySlug } from "@/lib/api";
import { ToolDispatcher } from "@/components/tools/ToolDispatcher";
import { AdSlot } from "@/components/ads/AdSlot";

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
    title: `${tool.name} | Free Online Tool | Daily Discovery`,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="hover:text-rose-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/tools" className="hover:text-rose-600 transition-colors font-medium text-neutral-600 dark:text-neutral-300">
          Tools
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-neutral-400">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          {tool.category}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
          {tool.name}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto">
          {tool.description}
        </p>
      </div>

      {/* Interactive Tool Runner */}
      <ToolDispatcher tool={tool} />

      <AdSlot slot="TOOL_BOTTOM" />

      {/* Transparency Guarantee */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>All calculations and file processing occur safely on your client device.</span>
        </div>
        <span className="font-mono text-[10px]">v{tool.version || "1.0"}</span>
      </div>

    </div>
  );
}
