import { getPublicContactEmail } from "@/lib/contact";
import { ContactPageView } from "@/components/shared/ContactPageView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get in touch", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const contactEmail = getPublicContactEmail();
  return <ContactPageView contactEmail={contactEmail} />;
}
