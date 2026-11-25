import { Suspense } from "react";
import { createFeedbackChallenge, getPublicContactEmail, isFeedbackInboxConfigured } from "@/lib/contact";
import { ContactPageView } from "@/components/shared/ContactPageView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get in touch", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const challenge = createFeedbackChallenge();
  const inboxEnabled = isFeedbackInboxConfigured();
  const hasProtectedEmail = Boolean(getPublicContactEmail());

  return (
    <Suspense fallback={null}>
      <ContactPageView
        challenge={challenge}
        inboxEnabled={inboxEnabled}
        hasProtectedEmail={hasProtectedEmail}
      />
    </Suspense>
  );
}
