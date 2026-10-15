import * as React from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, ListChecks, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { DESIGN_TOKENS } from "@/lib/tokens";
import { humanize } from "@/lib/format";

export interface QuizCardProps {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  questionCount?: number;
  difficulty?: string;
  estimatedMinutes?: number;
}

/**
 * One quiz in the quiz index.
 *
 * Every figure here has to come from the API: the old card defaulted to
 * "Daily Trivia / 5 Questions / Medium" and printed an "Interactive Score"
 * award even when none of that was true. Missing fields now render as nothing.
 */
export function QuizCard({
  slug,
  title,
  description,
  category,
  questionCount,
  difficulty,
  estimatedMinutes,
}: QuizCardProps) {
  const hasCount = typeof questionCount === "number" && questionCount > 0;
  const hasMinutes = typeof estimatedMinutes === "number" && estimatedMinutes > 0;

  return (
    <Card hoverEffect className="group flex h-full flex-col rounded-lg p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-category-quiz">
          <HelpCircle size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />
        </span>
        {category ? (
          <CategoryMark category={categoryKey("quiz")} tone="chip">
            {category}
          </CategoryMark>
        ) : null}
      </div>

      <h3 className="mb-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
        <Link href={`/quiz/${slug}`} className="transition-colors hover:text-accent">
          {title}
          <span className="sr-only"> — start quiz</span>
        </Link>
      </h3>

      {description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}

      {(hasCount || difficulty || hasMinutes) && (
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {hasCount && (
            <li className="inline-flex items-center gap-1.5 tabular-nums">
              <ListChecks size={13} aria-hidden="true" />
              {questionCount} questions
            </li>
          )}
          {difficulty && <li>{humanize(difficulty)}</li>}
          {hasMinutes && (
            <li className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock size={13} aria-hidden="true" />
              about {estimatedMinutes} min
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <span className="text-xs text-muted-foreground">Answer as you go</span>
        <Link
          href={`/quiz/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-foreground"
        >
          Start
          <ArrowRight
            size={DESIGN_TOKENS.iconSize.xs}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </Card>
  );
}
