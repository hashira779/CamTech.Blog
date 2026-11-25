import { Suspense } from "react";
import { createFeedbackChallenge, getPublicContactEmail } from "@/lib/contact";
import { ContactPageView } from "@/components/shared/ContactPageView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get in touch & report issues", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const challenge = createFeedbackChallenge();
  const hasProtectedEmail = Boolean(getPublicContactEmail());

  return (
    <Suspense fallback={null}>
      <ContactPageView challenge={challenge} hasProtectedEmail={hasProtectedEmail} />
    </Suspense>
  );
}
