import type { Metadata } from "next";
import { CvBuilderFeaturePage } from "@/components/tools/cv/CvBuilderFeaturePage";
import { getPublicContactEmail } from "@/lib/contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Khmer & English CV Builder — 30+ A4 Studio & ATS Templates",
  description:
    "Create free English, Khmer, or bilingual A4 résumés across 30+ studio and ATS-friendly templates. Instant clean PDF export or direct Telegram QR send with zero login.",
  alternates: { canonical: "/cv-builder" },
  openGraph: {
    title: "Free Khmer & English CV Builder — CamTech.Blog",
    description:
      "30+ free A4 studio & ATS templates in English, Khmer, and Bilingual modes. Instant PDF export and Telegram Bot QR phone delivery.",
  },
};

export default function CvBuilderRoutePage() {
  return <CvBuilderFeaturePage feedbackEmail={getPublicContactEmail()} />;
}
