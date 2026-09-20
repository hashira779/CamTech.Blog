import React from "react";
import { Metadata } from "next";
import { PublicPageShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Daily Knowledge Challenge & Quizzes | Daily Discovery",
  description: "Non-deceptive, educational trivia grounded in verified scientific, technological, and geographical facts.",
};

export const revalidate = 60;

export default async function QuizHubPage() {
  const dailyQuiz = await getDailyQuiz();

  return (
    <PublicPageShell
      breadcrumbs={[{ label: "Daily Quizzes", href: "/quiz" }]}
      maxWidth="reading"
      badge={
        <Badge variant="warning" size="sm" className="gap-1">
          <HelpCircle size={12} />
          Interactive Knowledge Challenge
        </Badge>
      }
      title="Daily Knowledge Challenge"
      description="Educational trivia grounded in verified scientific, technological, and geographical facts. Test your knowledge instantly without mandatory signups."
    >
      <div className="py-4">
        {dailyQuiz ? (
          <QuizRunner quiz={dailyQuiz} />
        ) : (
          <EmptyState
            icon={HelpCircle}
            title="No quiz scheduled today"
            description="Our editorial team publishes new knowledge challenges every morning. Please check back tomorrow."
            actionLabel="Explore Discoveries"
            actionHref="/discover"
          />
        )}
      </div>
    </PublicPageShell>
  );
}
