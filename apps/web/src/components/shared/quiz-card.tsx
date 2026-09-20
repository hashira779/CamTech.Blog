import * as React from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS } from "@/lib/tokens";

export interface QuizCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  questionCount?: number;
  difficulty?: string;
}

export function QuizCard({
  slug,
  title,
  description,
  category = "Daily Trivia",
  questionCount = 5,
  difficulty = "Medium",
}: QuizCardProps) {
  return (
    <Card hoverEffect className="p-5 flex flex-col h-full group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
          <HelpCircle size={DESIGN_TOKENS.iconSize.lg} />
        </div>
        <div className="flex gap-1.5">
          <Badge variant="warning" size="sm">
            {difficulty}
          </Badge>
          <Badge variant="secondary" size="sm">
            {questionCount} Questions
          </Badge>
        </div>
      </div>

      <Link href={`/quiz/${slug}`} className="mb-2">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400 transition-colors">
          {title}
        </h3>
      </Link>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Award size={12} className="text-amber-500" />
          Interactive Score
        </span>
        <Link
          href={`/quiz/${slug}`}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          Start Quiz
          <ArrowRight size={DESIGN_TOKENS.iconSize.xs} />
        </Link>
      </div>
    </Card>
  );
}
