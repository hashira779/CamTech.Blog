export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
        Contact Daily Discovery Newsroom
      </h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        Have a question, press release, factual tip, or partnership inquiry? Reach our dedicated teams below:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">General Editorial Desk</span>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">editor@dailydiscovery.com</p>
          <p className="text-xs text-neutral-400">For news coverage, story inquiries, and press releases.</p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block">Corrections & Fact Checking</span>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">corrections@dailydiscovery.com</p>
          <p className="text-xs text-neutral-400">For reporting potential factual errors or broken attribution links.</p>
        </div>
      </div>
    </div>
  );
}
