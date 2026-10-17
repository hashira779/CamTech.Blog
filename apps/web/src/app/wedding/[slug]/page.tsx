import React from "react";
import { Metadata } from "next";
import { fetchPublicWeddingCard } from "@/lib/wedding-api";
import { PremierRoyalKhmerCard } from "@/components/wedding/PremierRoyalKhmerCard";

interface WeddingCardPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WeddingCardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchPublicWeddingCard(slug);

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
  const card = await fetchPublicWeddingCard(slug);

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PremierRoyalKhmerCard card={card} isPreview={false} />
    </div>
  );
}
