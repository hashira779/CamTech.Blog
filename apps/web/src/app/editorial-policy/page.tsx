import { Shield, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          Standards & Ethics
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          Editorial & AI Policy
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          How Daily Discovery verifies information, attributes sources, uses artificial intelligence ethically, and maintains neutral political reporting.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">1. News Gathering & Source Attribution</h2>
          <p>
            Daily Discovery does not copy or republish complete articles from other publishers. We respect copyright and terms of service. External news items are referenced through official RSS feeds, press releases, and wire services for discovery and verification.
          </p>
          <p>
            Our journalists add genuine original value by producing concise summaries (&ldquo;What happened?&rdquo;), key bullet points, why-it-matters context, comparisons, timelines, and direct hyperlinks to original publishers. Source attribution is always prominent.
          </p>
        </section>

        <section className="space-y-3 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
            <Sparkles className="h-5 w-5" />
            <span>2. Strict Artificial Intelligence (AI) Policy</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <strong>AI MUST NOT automatically publish news.</strong> AI models may only assist human editors with draft summaries, entity extraction, category classification, and draft question generation.
          </p>
          <ul className="text-xs space-y-1.5 list-disc pl-5 text-neutral-600 dark:text-neutral-400">
            <li>We NEVER invent quotes, statistics, casualties, official statements, names, or scientific claims.</li>
            <li>All AI-assisted drafts enter an internal review queue (labeled <code>AI_DRAFT</code>) and require manual human verification against primary sources.</li>
            <li>Articles pass through our mandatory 13-point Quality Gate checklist before being published.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">3. Neutral Political & Electoral Coverage</h2>
          <p>
            The platform reports documented facts, attributes claims clearly (&ldquo;According to the ministry...&rdquo;, &ldquo;Reuters reported...&rdquo;), distinguishes reporting from analysis, and avoids political endorsements or fabricated polling.
          </p>
          <p>
            For political stories, we separate &ldquo;What happened?&rdquo;, &ldquo;Who said what?&rdquo;, &ldquo;What is documented?&rdquo;, and &ldquo;What remains disputed?&rdquo;. Daily Discovery is an information product, not a political persuasion mechanism.
          </p>
        </section>
      </div>
    </div>
  );
}
