import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getToolBySlug } from "@/lib/api";
import { ToolPageView } from "@/components/tools/ToolPageView";

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

  return <ToolPageView tool={tool} />;
}
