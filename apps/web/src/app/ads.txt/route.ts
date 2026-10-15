import { NextResponse } from "next/server";

export function GET() {
  const content = "google.com, pub-1311307969887065, DIRECT, f08c47fec0942fa0\n";
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
