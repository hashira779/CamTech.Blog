import Link from "next/link";
import { AlertCircle, CheckCircle2, History, Send } from "lucide-react";

export default function CorrectionsPage() {
  const sampleCorrections = [
    {
      date: "September 18, 2026",
      articleTitle: "National Bank of Cambodia Expands Bakong QR Cross-Border Payments",
      articleSlug: "cambodia-bakong-cross-border-qr-payment-expansion",
      correctionText: "An earlier version of this summary stated that cross-border QR settlements included five new partner nations immediately. The text was updated to clarify that agreements have been signed with five nations, with bilateral pilot transactions commencing over the next two quarters.",
      editor: "Chhoy Chorn (Editor-in-Chief)"
    },
    {
      date: "September 15, 2026",
      articleTitle: "Silicon Photonics Breakthrough: Optical Computing Solves AI Energy Crunch",
      articleSlug: "silicon-photonics-optical-computing-ai-energy-crisis",
      correctionText: "Corrected the energy reduction metric in the Key Points section to reflect an 80% reduction in thermal dissipation rather than total system power consumption.",
      editor: "Tech Desk Lead"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <History className="w-4 h-4" />
          <span>Editorial Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Corrections & Retractions Log
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Daily Discovery is committed to uncompromising accuracy. When factual errors occur in our original summaries,
          timelines, or figures, we correct them transparently and log them publicly here.
        </p>
      </div>

      {/* How to report an error */}
      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
            Found an Error or Inaccuracy?
          </h2>
        </div>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          If you believe a published report contains factual errors or requires context adjustment, please submit a correction request to our standards desk. Please provide the article URL, specific text, and verified primary source documentation.
        </p>
        <div className="pt-2">
          <Link
            href="/contact?subject=Correction+Request"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit a Correction Request</span>
          </Link>
        </div>
      </div>

      {/* Corrections Log */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Public Correction History
        </h2>

        <div className="space-y-4">
          {sampleCorrections.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.date}</span>
                <span className="text-slate-400 font-medium">Reviewed by {item.editor}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Article:{" "}
                <Link
                  href={`/cambodia/news/${item.articleSlug}`}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-slate-300"
                >
                  {item.articleTitle}
                </Link>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <strong>Correction Note:</strong> {item.correctionText}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
