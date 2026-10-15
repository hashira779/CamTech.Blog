import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getArticleBySlug } from "@/lib/api";
import { ArticleReader } from "@/components/news/ArticleReader";
import { articleSeoTitle, generateArticleJsonLd, generateOgMeta, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);
  if (!article) {
    return { title: "Article Not Found" };
  }

  const ogMeta = generateOgMeta({
    title: articleSeoTitle(article),
    description: article.seo_description || article.summary,
    image: article.hero_image_url,
    type: "article",
    url: `${SITE_URL}/cambodia/news/${article.slug}`,
    publishedTime: article.published_at,
    authors: article.author?.name ? [article.author.name] : undefined,
  });

  return {
    title: articleSeoTitle(article),
    description: article.seo_description || article.summary,
    alternates: {
      canonical: `${SITE_URL}/cambodia/news/${article.slug}`,
    },
    ...ogMeta,
  };
}

export default async function CambodiaArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const jsonLd = generateArticleJsonLd(article, SITE_URL);

  return (
    <>
      <JsonLd data={jsonLd} />
      <ArticleReader article={article} />
    </>
  );
}
