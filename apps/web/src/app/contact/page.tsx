import Link from "next/link";
import { ArrowUpRight, Mail, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get in touch", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const configured = (process.env.PUBLIC_CONTACT_EMAIL || "").trim();
  const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(configured) ? configured : null;
  return (
    <div>
      <PageHeader width="reading" breadcrumbs={[{ label: "Contact" }]} eyebrow="A conversation starts somewhere" title="Let’s make something useful." description="Share a correction, suggest a useful feature, or start a conversation about working with CamTech." />
      <Container width="reading" className="py-10 sm:py-14">
        {email ? <section className="field-contact-card"><Mail size={25} strokeWidth={1.5} aria-hidden="true" /><p className="field-eyebrow">Editorial & partnerships</p><h2>Get in touch directly.</h2><p>Include a page link for corrections, or a short description of your project for partnership enquiries.</p><a href={`mailto:${email}`} className="field-button">{email} <ArrowUpRight size={16} aria-hidden="true" /></a></section> : <section className="field-contact-card"><MessageSquare size={25} strokeWidth={1.5} aria-hidden="true" /><p className="field-eyebrow">Feedback & corrections</p><h2>Help make CamTech better.</h2><p>You can report a broken feature, suggest an improvement, or share a correction through the project’s public GitHub tracker. Include the page link and the source for a factual correction.</p><a href="https://github.com/hashira779/CamTech.Blog/issues/new" target="_blank" rel="noopener noreferrer" className="field-button">Open the feedback tracker <ArrowUpRight size={16} aria-hidden="true" /></a><p className="text-xs">GitHub account required. Reports are public; leave out passwords, private documents, and personal contact details.</p></section>}
        <div className="field-values mt-10"><p>Read how we handle corrections and what we expect from published content.</p><Link href="/corrections-policy" className="field-text-link">Corrections policy <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      </Container>
    </div>
  );
}
