import type { Metadata } from "next";
import { getTools } from "@/lib/api";
import { ToolLibrary } from "@/components/tools/ToolLibrary";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "CamTech Toolbox — 2026 Developer & Everyday Utilities",
  description: "Browse high-speed media downloaders, Bakong KHQR generator, salary tax calculators, and developer utilities. Zero accounts, 100% private.",
  alternates: { canonical: "/tools" },
};
export const dynamic = "force-dynamic";

export default async function ToolsHubPage() {
  const tools = await getTools();
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        breadcrumbs={[{ label: "The toolbox" }]}
        eyebrow="Developer & Everyday Utilities"
        title={
          <>
            Less busywork.<br />
            <em className="bg-gradient-to-r from-accent via-amber-600 to-accent bg-clip-text text-transparent not-italic font-bold">More getting things done.</em>
          </>
        }
        description="Everyday tools, calculators, and media utilities crafted for Cambodian creators, developers, and professionals. No account needed."
        aside={<span className="field-eyebrow font-mono text-[11px] text-accent font-bold">⚡ Zero login required</span>}
      />
      <Container>
        <ToolLibrary tools={tools} />
      </Container>
    </div>
  );
}
