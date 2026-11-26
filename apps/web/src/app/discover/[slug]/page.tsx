import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDiscoveryBySlug } from "@/lib/api";
import { DiscoveryDetailClient } from "@/components/discover/DiscoveryDetailClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const disc = await getDiscoveryBySlug(resolvedParams.slug);
  if (!disc) return { title: "Discovery Not Found" };
  return {
    title: disc.title,
    description: disc.intro,
    openGraph: {
      title: disc.title,
      description: disc.intro,
      images: [disc.hero_image_url],
      type: "article",
    },
  };
}

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const disc = await getDiscoveryBySlug(resolvedParams.slug);

  if (!disc) {
    notFound();
  }

  return <DiscoveryDetailClient disc={disc} />;
}
