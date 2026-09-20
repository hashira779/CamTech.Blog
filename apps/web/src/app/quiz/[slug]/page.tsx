import { notFound } from "next/navigation";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export const revalidate = 60;

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  // Currently daily quiz is featured
  const quiz = await getDailyQuiz();

  if (!quiz) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          {quiz.category}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
          {quiz.title}
        </h1>
        <p className="text-xs text-neutral-500 max-w-lg mx-auto">
          {quiz.description}
        </p>
      </div>

      <QuizRunner quiz={quiz} />
    </div>
  );
}
