export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
        Terms of Service
      </h1>
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
        <p>
          By accessing Daily Discovery, you agree to comply with these terms. The platform provides news summaries, original visual discoveries, and online utility calculators for educational and informational purposes.
        </p>
        <h2 className="text-lg font-bold">Intellectual Property & Fair Attribution</h2>
        <p>
          All original summaries, visual infographics, and proprietary tools are the property of Daily Discovery. Primary news facts and third-party quotes remain the intellectual property of their respective originating publishers and are referenced under fair citation.
        </p>
      </div>
    </div>
  );
}
