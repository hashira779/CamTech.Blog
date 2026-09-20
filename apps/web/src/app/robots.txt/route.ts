import { NextResponse } from "next/server";

export function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: http://localhost:3000/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: { "Content-Type": "text/plain" }
  });
}
