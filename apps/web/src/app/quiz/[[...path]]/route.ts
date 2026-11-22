/** The quiz feature is retired; keep old URLs out of search results. */
export function GET() {
  return new Response("Quizzes are no longer available on CamTech.Blog.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
  });
}
