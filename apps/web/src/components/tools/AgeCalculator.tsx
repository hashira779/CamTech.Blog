"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";

/**
 * Exact age between two dates.
 *
 * `calculateAge()` is unchanged, including the month-borrow logic, the day-count
 * totals and the "birth date cannot be after the calculation date" guard. The
 * purple "next birthday" tile and the emerald age block are gone: the age is the
 * headline figure on paper, everything else is a definition list.
 */
export function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("1998-05-15");
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const calculateAge = () => {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    const t = new Date(targetDate);

    if (b > t) return { error: "Birth date cannot be after the calculation date" };

    let years = t.getFullYear() - b.getFullYear();
    let months = t.getMonth() - b.getMonth();
    let days = t.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(t.getFullYear(), t.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total difference in ms
    const diffTime = Math.abs(t.getTime() - b.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalHours = totalDays * 24;
    const totalWeeks = Math.floor(totalDays / 7);

    // Next birthday
    const nextBirthdayYear = (t.getMonth() > b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() >= b.getDate()))
      ? t.getFullYear() + 1
      : t.getFullYear();
    const nextBday = new Date(nextBirthdayYear, b.getMonth(), b.getDate());
    const daysUntilNext = Math.ceil((nextBday.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bornDay = daysOfWeek[b.getDay()];
    const nextBdayDay = daysOfWeek[nextBday.getDay()];

    return {
      years,
      months,
      days,
      totalDays,
      totalHours,
      totalWeeks,
      daysUntilNext,
      bornDay,
      nextBdayDay,
    };
  };

  const ageData = calculateAge();
  const error = ageData && "error" in ageData ? ageData.error : null;
  const result = ageData && !("error" in ageData) ? ageData : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date of birth" id="age-birth">
          <Input
            id="age-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </FormField>
        <FormField label="Calculate age on" id="age-target">
          <Input
            id="age-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </FormField>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      {result && (
        <>
          <div className="rounded-lg bg-surface-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Age on the calculation date
            </p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-4xl leading-none tabular-nums text-foreground">
              <span>
                {result.years}
                <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">years</span>
              </span>
              <span className="text-2xl">
                {result.months}
                <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">months</span>
              </span>
              <span className="text-2xl">
                {result.days}
                <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">days</span>
              </span>
            </p>
            <p className="mt-2.5 text-sm text-muted-foreground">
              Born on a <span className="font-medium text-foreground">{result.bornDay}</span>.
            </p>
          </div>

          <dl className="divide-y divide-border rounded-lg border border-border">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Total days</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {result.totalDays.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Total weeks</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {result.totalWeeks.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Total hours</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {result.totalHours.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Next birthday</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {result.daysUntilNext} days
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  on a {result.nextBdayDay}
                </span>
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
