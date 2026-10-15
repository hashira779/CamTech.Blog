"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  BookOpenText,
} from "lucide-react";
import { Quiz, QuizQuestion } from "@/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { EmptyState } from "@/components/shared/empty-state";
import { cleanText } from "@/lib/format";

/**
 * The answer key is optional in the API. When a question ships without one, the
 * old runner silently treated option 0 as correct and added it to the score —
 * which printed a number the reader did not earn. Those questions are now
 * marked "answer not published" and are left out of the score entirely.
 */
function answerKey(question: QuizQuestion): number | null {
  const idx = question.correct_answer_idx;
  if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0) return null;
  return idx < question.choices.length ? idx : null;
}

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const { lang, t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = quiz.questions ?? [];
  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;

  const scorableQuestions = questions.filter((q) => answerKey(q) !== null);
  const scoreableTotal = scorableQuestions.length;
  const percentage =
    scoreableTotal > 0 ? Math.round((score / scoreableTotal) * 100) : null;

  const questionText = (q: QuizQuestion) =>
    cleanText(lang === "km" && q.question_km ? q.question_km : q.question);

  const handleSelectOption = (optIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // Prevent changing after selection
    const newAnswers = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(newAnswers);

    // If last question answered, trigger scoring
    if (Object.keys(newAnswers).length === questions.length) {
      calculateFinalScore(newAnswers);
    }
  };

  const calculateFinalScore = (answers: Record<number, number>) => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      const correctIdx = answerKey(q);
      if (correctIdx === null) return; // no published key, nothing to score
      if (answers[idx] === correctIdx) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);

    // Confetti only when the real score clears the bar.
    if (scoreableTotal > 0 && finalScore >= questions.length * 0.6) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        /* canvas unavailable — the score panel still reads */
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setScore(0);
  };

  if (!questions.length || !currentQ) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="No questions published yet"
        description="This quiz has no questions in it, so there is nothing to score yet. Check the daily challenge again shortly."
        actionLabel="Read the news briefing"
        actionHref="/trending"
      />
    );
  }

  /* ── Summary ───────────────────────────────────────────────────────────── */
  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs sm:p-7">
        <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
          {t("quiz.complete")}
        </h2>
        {cleanText(quiz.title) && (
          <p className="mt-1.5 text-sm text-muted-foreground">{cleanText(quiz.title)}</p>
        )}

        <div className="mt-6 rounded-lg bg-surface-muted px-5 py-4">
          {scoreableTotal > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("quiz.score")}
              </p>
              <p className="mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground">
                {score}
                <span className="text-2xl text-muted-foreground"> / {scoreableTotal}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                {percentage}% correct across the questions with a published answer key.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              You answered {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"}. This quiz has no published
              answer key, so no score can be shown.
            </p>
          )}
        </div>

        <ol className="mt-7 space-y-3">
          {questions.map((q, idx) => {
            const chosen = selectedAnswers[idx];
            const correct = answerKey(q);
            const isCorrect = correct !== null && chosen === correct;
            const explanation = cleanText(q.explanation);
            const source = cleanText(q.source_reference);

            return (
              <li
                key={q.id || idx}
                className="rounded-lg border border-border bg-surface-muted/60 p-4"
              >
                <div className="flex items-start gap-2.5">
                  {correct === null ? (
                    <HelpCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : isCorrect ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      <span className="tabular-nums">{idx + 1}.</span> {questionText(q)}
                    </p>

                    {chosen !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Your answer:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            correct === null ? "text-foreground" : isCorrect ? "text-success" : "text-destructive"
                          )}
                        >
                          {cleanText(q.choices[chosen])}
                        </span>
                      </p>
                    )}

                    {correct !== null && !isCorrect && (
                      <p className="text-sm text-muted-foreground">
                        Correct answer:{" "}
                        <span className="font-medium text-success">{cleanText(q.choices[correct])}</span>
                      </p>
                    )}

                    {correct === null && (
                      <p className="text-xs text-muted-foreground">
                        Answer key not published for this question — it is not counted in your score.
                      </p>
                    )}

                    {explanation && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
                    )}

                    {source && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpenText size={12} aria-hidden="true" />
                        {t("quiz.source_ref")}: {source}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Button variant="primary" size="md" onClick={handleReset} className="gap-2">
            <RotateCcw size={15} aria-hidden="true" />
            {t("quiz.try_again")}
          </Button>
          <Button variant="ghost" size="md" asChild className="gap-2">
            <a href="/quiz">Other challenges</a>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Active question ───────────────────────────────────────────────────── */
  const chosenIdx = selectedAnswers[currentIndex];
  const correctIdx = answerKey(currentQ);
  const explanation = cleanText(currentQ.explanation);
  const source = cleanText(currentQ.source_reference);
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {quiz.category ? (
          <CategoryMark category={categoryKey("quiz")} tone="dot">
            {cleanText(quiz.category)}
          </CategoryMark>
        ) : (
          <span className="sr-only">{t("quiz.question")} {currentIndex + 1}</span>
        )}
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {t("quiz.question")} {currentIndex + 1} {t("quiz.of")} {questions.length}
        </span>
      </div>

      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={currentIndex + 1}
        aria-label={`${t("quiz.question")} ${currentIndex + 1} ${t("quiz.of")} ${questions.length}`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="mt-5 font-display text-xl leading-snug tracking-tight text-foreground sm:text-2xl">
        {questionText(currentQ)}
      </h2>

      <div className="mt-5 space-y-2.5" role="group" aria-label={questionText(currentQ)}>
        {currentQ.choices.map((choice, optIdx) => {
          const isChosen = optIdx === chosenIdx;
          const isKey = correctIdx !== null && optIdx === correctIdx;

          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => handleSelectOption(optIdx)}
              disabled={isAnswered}
              aria-pressed={isAnswered ? isChosen || isKey : undefined}
              className={cn(
                "flex w-full cursor-pointer items-start justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm leading-snug transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                !isAnswered &&
                  "border-border-strong bg-surface text-foreground hover:border-accent hover:bg-surface-muted",
                isAnswered &&
                  !isChosen &&
                  !isKey &&
                  "border-border bg-surface text-muted-foreground",
                isAnswered && isKey && "border-success/45 bg-success/10 font-medium text-success",
                isAnswered && isChosen && !isKey && "border-destructive/45 bg-destructive/10 text-destructive",
                isAnswered && "cursor-default"
              )}
            >
              <span className="min-w-0">{cleanText(choice)}</span>
              {isAnswered && isKey && (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              )}
              {isAnswered && isChosen && !isKey && (
                <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <p className="sr-only" role="status">
          {correctIdx === null
            ? "Answer recorded. No answer key is published for this question."
            : chosenIdx === correctIdx
              ? "Correct."
              : "Incorrect."}
        </p>
      )}

      {isAnswered && (explanation || source || correctIdx === null) && (
        <div className="mt-5 space-y-1.5 rounded-lg bg-surface-muted p-4">
          {correctIdx === null ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              This question has no published answer key, so it will not be counted in your score.
            </p>
          ) : (
            chosenIdx === correctIdx && (
              <p className="text-sm font-semibold text-success">Correct.</p>
            )
          )}
          {correctIdx !== null && chosenIdx !== correctIdx && (
            <p className="text-sm font-semibold text-destructive">
              Not quite — the correct answer is {cleanText(currentQ.choices[correctIdx])}.
            </p>
          )}
          {explanation && (
            <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
          )}
          {source && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpenText size={12} aria-hidden="true" />
              {t("quiz.source_ref")}: {source}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-1.5"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            disabled={!isAnswered}
            className="gap-1.5"
          >
            Next question
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="accent"
            size="sm"
            onClick={() => calculateFinalScore(selectedAnswers)}
            disabled={!isAnswered}
          >
            Finish &amp; see score
          </Button>
        )}
      </div>
    </div>
  );
}
