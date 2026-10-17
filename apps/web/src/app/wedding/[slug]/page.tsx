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

  const title = `${card.title} - ${card.groom_name} & ${card.bride_name}`;
  const description = `លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ប្រពៃណីខ្មែរ រវាងកូនប្រុស ${card.groom_name} និងកូនស្រី ${card.bride_name} នៅថ្ងៃទី ${card.solar_date}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: card.cover_image_url || card.groom_image_url || "",
          width: 1200,
          height: 630,
          alt: `${card.groom_name} & ${card.bride_name} Wedding`,
        },
      ],
    },
  };
}

export default async function WeddingCardPage({ params }: WeddingCardPageProps) {
  const { slug } = await params;
  const card = await fetchPublicWeddingCard(slug);

  return (
    <div className="min-h-screen bg-[#2a080c]">
      <PremierRoyalKhmerCard card={card} isPreview={false} />
    </div>
  );
}
