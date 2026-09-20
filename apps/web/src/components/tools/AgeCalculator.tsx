"use client";

import React, { useState } from "react";
import { Calendar, Clock, Gift, Sparkles, RefreshCw } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Calculate Age On
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {ageData && !("error" in ageData) && (
        <div className="space-y-6">
          {/* Main Display */}
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Current Chronological Age
            </span>
            <div className="mt-3 flex flex-wrap items-baseline gap-4">
              <div>
                <span className="text-4xl md:text-5xl font-black text-emerald-900 dark:text-emerald-100">
                  {ageData.years}
                </span>
                <span className="ml-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">years</span>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                  {ageData.months}
                </span>
                <span className="ml-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">months</span>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                  {ageData.days}
                </span>
                <span className="ml-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">days</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Born on a <strong>{ageData.bornDay}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">Total Days</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {ageData.totalDays.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">Total Weeks</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {ageData.totalWeeks.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">Total Hours</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {ageData.totalHours.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">Next Birthday</span>
              <span className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1 block">
                {ageData.daysUntilNext} days
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 block mt-0.5">
                On a {ageData.nextBdayDay}
              </span>
            </div>
          </div>
        </div>
      )}

      {ageData && "error" in ageData && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
          {ageData.error}
        </div>
      )}
    </div>
  );
}
