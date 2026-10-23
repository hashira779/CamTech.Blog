import React from "react";
import { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cleanText, humanize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Daily Knowledge Challenge & Quizzes | CamTech Blog",
  description:
    "Educational trivia grounded in verified scientific, technological and geographical facts. Answer in your browser — no signup.",
};

export const revalidate = 60;

export default async function QuizHubPage() {
  const dailyQuiz = await getDailyQuiz();
  const questions = dailyQuiz?.questions ?? [];
  const runnable = Boolean(dailyQuiz && questions.length > 0);

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: "Daily quiz" }]}
        category="quiz"
        eyebrow="Quiz"
        title="Daily knowledge challenge"
        description="Trivia grounded in verified facts. Each answer is scored as you go and explained with its reference."
      />
      <Section className="pb-16 pt-2 sm:pt-4">
        <Container width="reading">
          {runnable && dailyQuiz ? (
            <div className="mt-8">
              <QuizRunner quiz={dailyQuiz} />
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={HelpCircle}
                title={dailyQuiz ? "This quiz has no questions yet" : "No quiz published today"}
                description={
                  dailyQuiz
                    ? `“${cleanText(dailyQuiz.title) || humanize(dailyQuiz.category)}” is listed, but no questions have been published for it yet.`
                    : "A new challenge is published when the editorial team has verified questions ready. Check back shortly."
                }
                actionLabel="Read the news briefing"
                actionHref="/trending"
              />
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
