/** Retired feature: old invitation and editor URLs must not remain live or indexed. */
export function GET() {
  return new Response("Wedding invitations are no longer available on CamTech.Blog.", {
    status: 410,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
