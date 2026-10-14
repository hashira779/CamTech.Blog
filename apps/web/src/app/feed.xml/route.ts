import { NextResponse } from "next/server";
import { getArticles } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

export async function GET(request: Request) {
  const { items } = await getArticles({ limit: 30 });
  const host = request.headers.get("host");
  const protocol = host && !host.includes("localhost") ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : SITE_URL;

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Daily Discovery - News &amp; Visual Explanations</title>
  <link>${baseUrl}</link>
  <description>Verified news, visual explanations, and daily discovery platform.</description>
  <language>en</language>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
`;

  for (const a of items) {
    const link = a.country === "KH" ? `${baseUrl}/cambodia/news/${a.slug}` : `${baseUrl}/world/news/${a.slug}`;
    const cleanTitle = (a.title || "").replace(/\]\]>/g, "]]&gt;");
    const cleanSummary = (a.summary || "").replace(/\]\]>/g, "]]&gt;");
    rss += `  <item>
    <title><![CDATA[${cleanTitle}]]></title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString()}</pubDate>
    <description><![CDATA[${cleanSummary}]]></description>
  </item>\n`;
  }

  rss += `</channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
