import React, { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicWeddingCard } from "@/lib/wedding-api";
import { PremierRoyalKhmerCard } from "@/components/wedding/PremierRoyalKhmerCard";
import { WeddingCard } from "@/types/wedding";

interface WeddingCardPageProps {
  params: Promise<{ slug: string }>;
}

type Lookup = { card: WeddingCard | null; unavailable: boolean };

/* One lookup per request, shared by the metadata and the page. "unavailable"
   means the wedding service couldn't answer: we say so rather than guess. */
const lookupCard = cache(async (slug: string): Promise<Lookup> => {
  try {
    return { card: await fetchPublicWeddingCard(slug), unavailable: false };
  } catch {
    return { card: null, unavailable: true };
  }
});

export async function generateMetadata({ params }: WeddingCardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { card } = await lookupCard(slug);

  if (!card) {
    return {
      title: { absolute: "លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ · Wedding invitation" },
      robots: { index: false, follow: false },
    };
  }

  const coupleNames = `${card.groom_name} & ${card.bride_name}`;
  const weddingTitle = card.title || "សិរីសួស្តី អាពាហ៍ពិពាហ៍";
  const title = `${weddingTitle}៖ ${coupleNames}`;
  const description = `លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ប្រពៃណីខ្មែរ រវាងកូនប្រុស ${card.groom_name} និងកូនស្រី ${card.bride_name} នៅថ្ងៃទី ${card.solar_date}`;
  const imageUrl = card.cover_image_url || card.groom_image_url || "";

  return {
    title: {
      absolute: title, // Prevents template append "| CamTech Blog" so the shared card has 100% clean title
    },
    description,
    // Private family invitations: shareable by link, not listed in search
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: "លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍", // Pure wedding title instead of blog site name
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${coupleNames} Wedding Invitation`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function WeddingCardPage({ params }: WeddingCardPageProps) {
  const { slug } = await params;
  const { card, unavailable } = await lookupCard(slug);

  if (unavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="font-moul text-xl text-[#7a4d0c] leading-loose">សូមអភ័យទោស</p>
          <h1 className="text-lg font-semibold text-[#2b2520]">
            លិខិតអញ្ជើញមិនអាចបង្ហាញបានបណ្តោះអាសន្ន
          </h1>
          <p className="text-sm text-stone-600">
            This invitation can&apos;t be loaded right now. Please refresh in a moment.
          </p>
        </div>
      </div>
    );
  }
  if (!card) notFound();

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PremierRoyalKhmerCard card={card} isPreview={false} />
    </div>
  );
}
