import { Compass, ShieldCheck, Award, HeartHandshake } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          Editorial Transparency
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          About Daily Discovery
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Daily Discovery is a modern, independent content and utility platform engineered to satisfy daily curiosity, provide verified news context, and offer practical online tools.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Strict Source Attribution</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            We never copy full articles or hide primary sources. Every news item retains clear links to original reporting.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
          <Award className="h-6 w-6 text-amber-500" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Original Editorial Value</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            We produce structured summaries ("What happened?"), key points, why-it-matters context, and chronological timelines.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
          <HeartHandshake className="h-6 w-6 text-rose-500" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">No Clickbait or Traps</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No fake tools, deceptive download buttons, or manipulative headlines. Tools are 100% functional and run client-side.
          </p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Our Mission</h2>
        <p>
          Founded in 2026, Daily Discovery serves readers across Cambodia and internationally who seek clean, reliable, and thoughtful information. We believe modern internet users deserve better than endless clickbait and scraped aggregator spam.
        </p>
        <p>
          By combining local Southeast Asian coverage with global technology and science breakthroughs, visual explainers, factual quizzes, and everyday utilities, we answer one central question: <em>&ldquo;Why would a real person return tomorrow?&rdquo;</em>
        </p>
      </div>
    </div>
  );
}
