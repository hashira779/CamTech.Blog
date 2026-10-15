import { NextResponse } from "next/server";
import { adsTxtBody } from "@/lib/ads";

/**
 * ads.txt — Authorized Digital Sellers.
 *
 * Google will not serve ads on a domain whose ads.txt does not list the publisher account, so this
 * file is the difference between a slot existing and a slot earning. It is generated from the same
 * account the page code uses (src/lib/ads.ts) instead of being a second copy of the number, because
 * the two drifting apart is what makes ads silently stop paying while every slot still looks fine.
 *
 * There used to be a static apps/web/public/ads.txt as well; a file in `public/` and a route on the
 * same path is a conflict Next warns about, so the static one is gone and this is the only source.
 *
 * Reachable at /ads.txt on whatever host the site is registered with — verify after deploy:
 *   curl -s https://<your-domain>/ads.txt
 */
export function GET() {
  const body = adsTxtBody();

  if (!body) {
    // No publisher account in this build. Say so rather than publishing a file that authorizes
    // nobody while looking like a working ads.txt.
    return new NextResponse("# AdSense publisher id is not configured for this build.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
