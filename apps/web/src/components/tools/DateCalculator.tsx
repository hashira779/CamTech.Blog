"use client";

import React, { useState } from "react";
import { Calendar, Plus, Minus, Clock } from "lucide-react";

export function DateCalculator() {
  const [tab, setTab] = useState<"difference" | "add_sub">("difference");

  // Difference state
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Add/Sub state
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [numDays, setNumDays] = useState<number>(30);

  const getDifference = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Calculate business days
    let cur = new Date(s);
    let businessDays = 0;
    const direction = totalDays >= 0 ? 1 : -1;
    const absDays = Math.abs(totalDays);

    for (let i = 0; i < absDays; i++) {
      cur.setDate(cur.getDate() + direction);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
    }

    const weeks = Math.floor(Math.abs(totalDays) / 7);
    const remDays = Math.abs(totalDays) % 7;

    return {
      totalDays: Math.abs(totalDays),
      isPast: totalDays < 0,
      businessDays,
      weekendDays: Math.abs(totalDays) - businessDays,
      weeks,
      remDays,
    };
  };

  const getAddSubResult = () => {
    const b = new Date(baseDate);
    const mult = operation === "add" ? 1 : -1;
    b.setDate(b.getDate() + mult * numDays);

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return {
      resultDate: b.toISOString().split("T")[0],
      dayName: days[b.getDay()],
    };
  };

  const diffResult = getDifference();
  const addSubResult = getAddSubResult();

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("difference")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            tab === "difference"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Time Between Dates
        </button>
        <button
          onClick={() => setTab("add_sub")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            tab === "add_sub"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Add / Subtract Days
        </button>
      </div>

      {tab === "difference" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Duration
            </span>
            <div className="mt-2 text-4xl md:text-5xl font-black text-emerald-900 dark:text-emerald-100">
              {diffResult.totalDays} Days
            </div>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              Equivalent to <strong>{diffResult.weeks} weeks</strong> and{" "}
              <strong>{diffResult.remDays} days</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Working Business Days</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {diffResult.businessDays}
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Weekend Days</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {diffResult.weekendDays}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Starting Date
              </label>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Operation
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as "add" | "subtract")}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Number of Days
              </label>
              <input
                type="number"
                min="1"
                value={numDays}
                onChange={(e) => setNumDays(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Calculated Target Date
            </span>
            <div className="mt-2 text-4xl md:text-5xl font-black text-emerald-900 dark:text-emerald-100">
              {addSubResult.resultDate}
            </div>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
              Falls on a <strong>{addSubResult.dayName}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
