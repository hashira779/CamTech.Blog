import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getArticleBySlug } from "@/lib/api";
import { ArticleReader } from "@/components/news/ArticleReader";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);
  if (!article) {
    return { title: "Article Not Found | Daily Discovery" };
  }
  return {
    title: `${article.seo_title || article.title} | Daily Discovery`,
    description: article.seo_description || article.summary,
    alternates: {
      canonical: `http://localhost:3000/world/news/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.hero_image_url ? [article.hero_image_url] : [],
      type: "article",
      publishedTime: article.published_at,
    }
  };
}

export default async function WorldArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.hero_image_url ? [article.hero_image_url] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      "@type": "Person",
      name: article.author?.name || "Daily Discovery Editorial Staff"
    },
    publisher: {
      "@type": "Organization",
      name: "Daily Discovery",
      url: "http://localhost:3000"
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `http://localhost:3000/world/news/${article.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleReader article={article} />
    </>
  );
}
