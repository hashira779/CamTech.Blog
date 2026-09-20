import Link from "next/link";
import { HelpCircle, Award, CheckCircle, ArrowRight } from "lucide-react";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export const revalidate = 60;

export default async function QuizHubPage() {
  const dailyQuiz = await getDailyQuiz();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="h-4 w-4" />
          <span>Interactive Play & Trivia</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
          Daily Knowledge Challenge
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
          Non-deceptive, educational trivia grounded in verified scientific and geographical facts.
          Accessible to all visitors without requiring an account.
        </p>
      </div>

      {/* Featured Daily Quiz Runner */}
      {dailyQuiz ? (
        <QuizRunner quiz={dailyQuiz} />
      ) : (
        <div className="p-12 text-center text-neutral-400">
          No daily quiz scheduled today. Check back tomorrow!
        </div>
      )}

    </div>
  );
}
