import { NextResponse } from "next/server";
import { getArticles, getDiscoveries, getTools } from "@/lib/api";

export async function GET() {
  const [articlesData, discoveriesData, tools] = await Promise.all([
    getArticles({ limit: 50 }),
    getDiscoveries(),
    getTools()
  ]);

  const baseUrl = "http://localhost:3000";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/cambodia</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/world</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/discover</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/quiz</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/trending</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url><loc>${baseUrl}/about</loc></url>
  <url><loc>${baseUrl}/editorial-policy</loc></url>
  <url><loc>${baseUrl}/corrections-policy</loc></url>
  <url><loc>${baseUrl}/privacy</loc></url>
  <url><loc>${baseUrl}/terms</loc></url>
  <url><loc>${baseUrl}/cookie-policy</loc></url>
  <url><loc>${baseUrl}/advertising</loc></url>
  <url><loc>${baseUrl}/contact</loc></url>
`;

  // Dynamic articles
  for (const a of articlesData.items) {
    const url = a.country === "KH" ? `${baseUrl}/cambodia/news/${a.slug}` : `${baseUrl}/world/news/${a.slug}`;
    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${a.updated_at ? a.updated_at.substring(0, 10) : new Date().toISOString().substring(0, 10)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  }

  // Dynamic discoveries
  for (const d of discoveriesData.items) {
    xml += `  <url>
    <loc>${baseUrl}/discover/${d.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  }

  // Dynamic tools
  for (const t of tools) {
    xml += `  <url>
    <loc>${baseUrl}/tools/${t.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
