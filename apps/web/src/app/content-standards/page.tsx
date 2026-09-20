export default function ContentStandardsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
        Content Standards & Integrity
      </h1>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
        <p>
          Section 61 Guidelines: Daily Discovery maintains an absolute prohibition against:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fabricated news, quotes, sources, or statistics.</li>
          <li>Misleading, emotionally manipulative, or deceptive headlines.</li>
          <li>Copied or scraped full articles presented as original reporting.</li>
          <li>Auto-published AI-generated text without human editorial review.</li>
          <li>Unauthorized copyrighted media without appropriate rights and attribution.</li>
        </ul>
        <p>
          Whenever information is disputed or subject to developing breaking conditions, it is explicitly identified as attributed or unverified until official confirmation is secured.
        </p>
      </div>
    </div>
  );
}
