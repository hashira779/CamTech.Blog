import { Metadata } from "next";
import { Article, TravelGuide } from "@/types";

export const SITE_NAME = "Daily Discovery";
export const SITE_ALT_NAME = "CamTech Blog";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.camtech.cam";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const TWITTER_HANDLE = "@camtechblog";
export const DEFAULT_DESCRIPTION =
  "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.";

/**
 * Generate JSON-LD structured data for articles (NewsArticle schema).
 */
export function generateArticleJsonLd(article: Article, baseUrl: string = SITE_URL) {
  const articlePath =
    article.country === "KH"
      ? `/cambodia/news/${article.slug}`
      : `/world/news/${article.slug}`;
  const articleUrl = article.canonical_url || `${baseUrl}${articlePath}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.seo_title || article.title,
    description: article.seo_description || article.summary,
    image: article.hero_image_url
      ? [article.hero_image_url]
      : [DEFAULT_OG_IMAGE],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    author: {
      "@type": "Person",
      name: article.author?.name || "Editorial Team",
      ...(article.author?.slug
        ? { url: `${baseUrl}/author/${article.author.slug}` }
        : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    inLanguage: article.language || (article.country === "KH" ? "km-KH" : "en-US"),
  };

  if (article.title_km) {
    schema.alternateName = article.title_km;
  }

  return schema;
}

/**
 * Generate JSON-LD structured data for travel guides.
 */
export function generateTravelGuideJsonLd(guide: TravelGuide, baseUrl: string = SITE_URL) {
  const guideUrl = `${baseUrl}/travel/guides/${guide.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": guideUrl,
    },
    headline: guide.title,
    description: guide.summary,
    image: guide.hero_image_url ? [guide.hero_image_url] : [DEFAULT_OG_IMAGE],
    datePublished: guide.published_at,
    dateModified: guide.published_at,
    author: {
      "@type": "Organization",
      name: `${SITE_NAME} Travel Desk`,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    inLanguage: "en-US",
  };
}

/**
 * Generate JSON-LD structured data for breadcrumb navigation.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
  baseUrl: string = SITE_URL
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${baseUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * Flexible helper for generating OpenGraph & Twitter metadata.
 * Supports both positional arguments: (title, description, image, type)
 * and object arguments: ({ title, description, image, type, url, ... })
 */
export function generateOgMeta(
  titleOrOptions:
    | string
    | {
        title?: string;
        description?: string;
        image?: string;
        type?: "website" | "article";
        url?: string;
        publishedTime?: string;
        authors?: string[];
      },
  description?: string,
  image?: string,
  type: "website" | "article" = "website"
): {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: NonNullable<Metadata["twitter"]>;
} {
  const isObj = typeof titleOrOptions === "object" && titleOrOptions !== null;
  const effectiveTitle = isObj ? titleOrOptions.title || SITE_NAME : titleOrOptions;
  const effectiveDescription = isObj
    ? titleOrOptions.description || DEFAULT_DESCRIPTION
    : description || DEFAULT_DESCRIPTION;
  const effectiveImage = isObj ? titleOrOptions.image || DEFAULT_OG_IMAGE : image || DEFAULT_OG_IMAGE;
  const effectiveType = isObj ? titleOrOptions.type || "website" : type;
  const effectiveUrl = isObj ? titleOrOptions.url : undefined;

  return {
    openGraph: {
      title: effectiveTitle,
      description: effectiveDescription,
      siteName: SITE_NAME,
      url: effectiveUrl,
      locale: "en_US",
      type: effectiveType,
      images: [
        {
          url: effectiveImage,
          width: 1200,
          height: 630,
          alt: effectiveTitle,
        },
      ],
      ...(isObj && titleOrOptions.publishedTime && effectiveType === "article"
        ? {
            publishedTime: titleOrOptions.publishedTime,
            authors: titleOrOptions.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: effectiveTitle,
      description: effectiveDescription,
      creator: TWITTER_HANDLE,
      images: [effectiveImage],
    },
  };
}
