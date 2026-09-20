"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle, XCircle, Award, RotateCcw, ArrowRight, ExternalLink, HelpCircle } from "lucide-react";
import { Quiz, QuizQuestion } from "@/types";
import { useI18n } from "@/lib/i18n";

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const { lang, t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = quiz.questions;
  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;

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
      // In local mode, choice 0 is the default correct index for seeded questions
      const correctIdx = q.correct_answer_idx ?? 0;
      if (answers[idx] === correctIdx) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);

    // Confetti effect if good score!
    if (finalScore >= questions.length * 0.6) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
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

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-400">
        No questions available for this quiz.
      </div>
    );
  }

  // Final Summary Screen
  if (isSubmitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-2xl space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Award className="h-8 w-8" />
        </div>

        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {t("quiz.complete")}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {quiz.title}
          </p>
        </div>

        <div className="py-6 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 max-w-sm mx-auto">
          <div className="text-5xl font-black text-rose-600 dark:text-rose-400">
            {score}/{questions.length}
          </div>
          <div className="text-xs font-semibold text-neutral-500 mt-1">
            {percentage}% Factual Accuracy
          </div>
        </div>

        {/* Detailed Review List */}
        <div className="text-left space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Answer Explanations & Sources
          </h4>
          {questions.map((q, idx) => {
            const chosen = selectedAnswers[idx];
            const correct = q.correct_answer_idx ?? 0;
            const isCorrect = chosen === correct;
            return (
              <div key={q.id || idx} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 space-y-2">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {idx + 1}. {q.question}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
                  <strong className="text-neutral-800 dark:text-neutral-200">Explanation: </strong>
                  {q.explanation || "Verified factual answer based on authoritative reference."}
                </p>
                {q.source_reference && (
                  <div className="pl-6 text-[10px] text-neutral-400 flex items-center gap-1">
                    <span>Source: {q.source_reference}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("quiz.try_again")}
        </button>
      </div>
    );
  }

  // Active Question Card
  const chosenIdx = selectedAnswers[currentIndex];
  const correctIdx = currentQ.correct_answer_idx ?? 0;

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6">
      
      {/* Progress Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          {quiz.category}
        </span>
        <span className="font-semibold">
          {t("quiz.question")} {currentIndex + 1} {t("quiz.of")} {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-rose-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Text */}
      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white leading-snug">
        {lang === "km" && currentQ.question_km ? currentQ.question_km : currentQ.question}
      </h3>

      {/* Choices Grid */}
      <div className="space-y-3">
        {currentQ.choices.map((choice, optIdx) => {
          let optionStyles = "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900";
          
          if (isAnswered) {
            if (optIdx === correctIdx) {
              optionStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 font-semibold";
            } else if (optIdx === chosenIdx) {
              optionStyles = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200";
            } else {
              optionStyles = "opacity-50 border-neutral-200 dark:border-neutral-800";
            }
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelectOption(optIdx)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyles}`}
            >
              <span>{choice}</span>
              {isAnswered && optIdx === correctIdx && (
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
              )}
              {isAnswered && optIdx === chosenIdx && optIdx !== correctIdx && (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Box (Visible right after answering) */}
      {isAnswered && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2 animate-in fade-in duration-300">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            <strong className="text-neutral-900 dark:text-white">Explanation: </strong>
            {currentQ.explanation}
          </p>
          {currentQ.source_reference && (
            <span className="text-[10px] text-neutral-400 block">
              Reference: {currentQ.source_reference}
            </span>
          )}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold disabled:opacity-40"
          >
            Next Question
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => calculateFinalScore(selectedAnswers)}
            disabled={!isAnswered}
            className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40 shadow"
          >
            Finish & See Score
          </button>
        )}
      </div>

    </div>
  );
}
