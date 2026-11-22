import type { Metadata } from "next";
import { getTools } from "@/lib/api";
import { ToolLibrary } from "@/components/tools/ToolLibrary";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "The everyday toolbox — calculators, converters and creative tools",
  description: "Find a tool for your next task. Browse calculators, image and QR tools, text utilities, and developer tools. No account needed.",
  alternates: { canonical: "/tools" },
};
export const revalidate = 60;

export default async function ToolsHubPage() {
  const tools = await getTools();
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader breadcrumbs={[{ label: "The toolbox" }]} eyebrow="A little everyday help" title={<>Less busywork.<br /><em>More getting things done.</em></>} description="The right little tool can make a big difference. Find a calculator, converter, or creative helper for the task in front of you." aside={<span className="field-eyebrow">No account required</span>} />
      <Container><ToolLibrary tools={tools} /></Container>
    </div>
  );
}
