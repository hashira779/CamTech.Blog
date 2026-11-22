import Link from "next/link";
import { ArrowUpRight, Compass, BookOpen, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Advertising & partnerships", alternates: { canonical: "/advertising" } };
const options = [
  { title: "Destination features", Icon: Compass, text: "Introduce a place, experience, or local business through a clearly labelled feature with practical information for travellers." },
  { title: "Useful tool sponsorships", Icon: Wrench, text: "Support a tool people come back to. A sponsorship should fit the task and let visitors finish what they came to do." },
  { title: "Thoughtful collaborations", Icon: BookOpen, text: "Propose an educational guide or a useful resource. We consider ideas that fit Cambodia, everyday life, and technology." },
];
export default function AdvertisingPage() {
  return (
    <div>
      <PageHeader breadcrumbs={[{label: "Advertising & partnerships"}]} eyebrow="Work with CamTech" title={<>A good fit.<br /><em>A useful connection.</em></>} description="We welcome partnership ideas that help our readers discover a place, understand something better, or get a useful task done." />
      <Container className="py-12 sm:py-16">
        <div className="grid gap-5 md:grid-cols-3">{options.map(({title,Icon,text}) => <section key={title} className="field-tool-card"><div className="field-tool-card-top"><span><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></span></div><h2 className="mt-6 font-display text-2xl">{title}</h2><p>{text}</p></section>)}</div>
        <section className="field-partnership-policy"><p className="field-eyebrow">Trust comes first</p><h2>Useful for readers. Clear about the relationship.</h2><ul><li><strong>Always labelled.</strong> Paid features and promotional placements must be identified as Sponsored or Advertisement. Affiliate links must disclose the relationship.</li><li><strong>Editorial independence.</strong> A partnership does not buy a positive review or approval of unsupported claims.</li><li><strong>A clear agreement.</strong> Scope, placement, and pricing are agreed before a campaign. We do not promise traffic, sales, or search rankings.</li><li><strong>Room for the reader.</strong> Advertising must not disguise navigation, interrupt a tool, or force accidental clicks.</li></ul><Link href="/contact" className="field-button">View contact options <ArrowUpRight size={16} aria-hidden="true" /></Link></section>
      </Container>
    </div>
  );
}
