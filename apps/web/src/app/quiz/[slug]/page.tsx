import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDailyQuiz } from "@/lib/api";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cleanText, humanize } from "@/lib/format";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const quiz = await getDailyQuiz();
  if (!quiz) return { title: "Quiz Not Found" };
  return {
    title: `${cleanText(quiz.title)} | Daily Quiz | CamTech Blog`,
    description: cleanText(quiz.description) || undefined,
  };
}

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  // The daily quiz is the only quiz the API publishes; the slug is kept in the
  // route so links from the homepage and quiz cards resolve.
  const quiz = await getDailyQuiz();

  if (!quiz) {
    notFound();
  }

  void resolvedParams;

  const description = cleanText(quiz.description);

  return (
    <Section className="pb-12 pt-6 sm:pt-8">
      <Container width="reading">
        <Breadcrumbs
          items={[
            { label: "Daily quiz", href: "/quiz" },
            { label: cleanText(quiz.title) || "Quiz" },
          ]}
          className="mb-6"
        />

        <SectionHeader
          as="h1"
          label={humanize(quiz.category)}
          title={cleanText(quiz.title)}
          description={description || undefined}
        />

        <QuizRunner quiz={quiz} />
      </Container>
    </Section>
  );
}
