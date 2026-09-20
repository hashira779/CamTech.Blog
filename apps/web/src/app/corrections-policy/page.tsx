export default function CorrectionsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          Accountability
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          Corrections & Retractions Policy
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Daily Discovery is committed to accuracy. When factual errors occur, we correct them transparently and promptly.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Reporting an Error</h2>
        <p>
          If you identify a factual inaccuracy, broken attribution link, misattributed quote, or outdated statistic in any article, please notify our editorial desk immediately at:
        </p>
        <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 font-mono text-xs">
          Email: corrections@dailydiscovery.com (Subject: [Correction Request] Article URL)
        </div>

        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Correction Process</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Verification:</strong> An editor cross-checks the claim against primary documentation.</li>
          <li><strong>Update:</strong> The article text is modified directly.</li>
          <li><strong>Transparency Note:</strong> A visible &ldquo;Correction Note&rdquo; is appended at the top or bottom of the article stating what was amended and the timestamp of the change.</li>
          <li><strong>Audit Logging:</strong> All changes are recorded in our tamper-evident administrative audit log.</li>
        </ol>
      </div>
    </div>
  );
}
