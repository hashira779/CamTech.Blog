// Internal screening rules, not AdSense approval criteria or a substitute for editing.
export function hasSubstantiveContent(body?: string | null, summary = "", context = ""): boolean {
  const text = (body || "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ");
  if (text.replace(/\s/g, "").length < 1000) return false;
  const combined = `${text} ${summary} ${context}`.toLowerCase();
  if ([
    "official statements and documentation are being monitored",
    "further regional developments are expected to follow",
    "important indicator for stakeholders following regional and sector-specific trends",
    "sustained monitoring will clarify long-term impacts",
  ].some((phrase) => combined.includes(phrase))) return false;
  return text.trim().toLowerCase() !== summary.trim().toLowerCase();
}

export function isArticleEligible(article: {
  status?: string; quality_checklist_passed?: boolean; content?: string | null;
  summary?: string; why_it_matters?: string | null; primary_source_url?: string;
}): boolean {
  if (article.status !== "PUBLISHED" || !article.quality_checklist_passed) return false;
  try {
    const source = new URL(article.primary_source_url || "");
    if (!["http:", "https:"].includes(source.protocol) || source.username || !source.pathname.replace(/\//g, "")) return false;
  } catch { return false; }
  return hasSubstantiveContent(article.content, article.summary, article.why_it_matters || "");
}
