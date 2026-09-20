# SEO & Structured Data Implementation

Search visibility is fundamental to Daily Discovery. We adhere to White-Hat SEO best practices, rich structured data, and high Core Web Vitals performance.

---

## 1. Dynamic Structured Data (Schema.org)

Every news article embeds a `NewsArticle` JSON-LD payload:
- `@context`: `https://schema.org`
- `@type`: `NewsArticle`
- `headline`: Canonical title
- `datePublished`: ISO publication timestamp
- `dateModified`: ISO update timestamp
- `author`: Person entity with author byline
- `publisher`: Organization entity (Daily Discovery)
- `mainEntityOfPage`: Canonical URL

---

## 2. Dynamic Feeds & Maps

- **Sitemap**: `/sitemap.xml` automatically includes all published articles, discoveries, quizzes, and policy pages with daily/hourly update frequencies.
- **Robots**: `/robots.txt` instructs search crawlers on allowed paths while disallowing `/admin` and `/api/`.
- **RSS Syndication**: `/feed.xml` outputs full RSS 2.0 formatted XML for aggregators, feed readers, and syndication partners.
