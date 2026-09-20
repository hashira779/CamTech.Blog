import * as React from "react";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

export interface WizardShellProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  steps: WizardStep[];
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  children: React.ReactNode;
}

export function WizardShell({
  breadcrumbs,
  title,
  description,
  steps,
  currentStepIndex,
  onStepChange,
  onBack,
  onNext,
  isSubmitting = false,
  nextLabel = "Continue",
  backLabel = "Back",
  children,
}: WizardShellProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Breadcrumb */}
        {breadcrumbs && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? "bg-teal-700 text-white dark:bg-teal-600"
                        : isCurrent
                        ? "bg-white text-teal-700 border-2 border-teal-700 dark:bg-slate-900 dark:text-teal-400 dark:border-teal-400 shadow-xs"
                        : "bg-slate-100 text-slate-400 border border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : idx + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-medium hidden sm:block ${
                      isCurrent
                        ? "text-slate-900 dark:text-slate-100 font-semibold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Card Body */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-700 dark:text-teal-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {steps[currentStepIndex]?.title}
            </h2>
            {steps[currentStepIndex]?.description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {steps[currentStepIndex].description}
              </p>
            )}
          </div>

          <div>{children}</div>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          {!isFirstStep ? (
            <Button variant="outline" size="md" onClick={onBack} className="gap-1.5">
              <ArrowLeft size={14} />
              {backLabel}
            </Button>
          ) : (
            <div />
          )}

          {onNext && (
            <Button
              variant="primary"
              size="md"
              onClick={onNext}
              isLoading={isSubmitting}
              className="gap-1.5"
            >
              {nextLabel}
              {!isLastStep && <ArrowRight size={14} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
