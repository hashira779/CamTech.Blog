import React from "react";
import { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
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
    <Section className="pb-12 pt-6 sm:pt-8">
      <Container width="reading">
        <Breadcrumbs items={[{ label: "Daily quiz", href: "/quiz" }]} className="mb-6" />

        <SectionHeader
          as="h1"
          label="Quiz"
          title="Daily knowledge challenge"
          description="Trivia grounded in verified facts. Each answer is scored as you go and explained with its reference."
        />

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
  );
}
