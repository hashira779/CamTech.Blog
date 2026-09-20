"use client";

import React, { useState } from "react";
import { Percent, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PercentageCalculator() {
  const { t } = useI18n();
  
  // Type 1: What is P% of X?
  const [p1, setP1] = useState("15");
  const [x1, setX1] = useState("200");
  const res1 = (parseFloat(p1) && parseFloat(x1)) ? ((parseFloat(p1) / 100) * parseFloat(x1)).toFixed(2) : "0.00";

  // Type 2: X is what % of Y?
  const [x2, setX2] = useState("30");
  const [y2, setY2] = useState("120");
  const res2 = (parseFloat(x2) && parseFloat(y2) && parseFloat(y2) !== 0) ? ((parseFloat(x2) / parseFloat(y2)) * 100).toFixed(2) : "0.00";

  // Type 3: Percentage increase / decrease from A to B
  const [a3, setA3] = useState("80");
  const [b3, setB3] = useState("100");
  const diff3 = parseFloat(b3) - parseFloat(a3);
  const res3 = (parseFloat(a3) && parseFloat(a3) !== 0) ? ((diff3 / parseFloat(a3)) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Mode 1 */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          1. What is P% of X?
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-500">What is</span>
          <input
            type="number"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
          <span className="text-neutral-500">% of</span>
          <input
            type="number"
            value={x1}
            onChange={(e) => setX1(e.target.value)}
            className="w-28 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
          <span className="text-neutral-500">?</span>
        </div>
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white">
          Result: <span className="text-rose-600 dark:text-rose-400 text-lg">{res1}</span>
        </div>
      </div>

      {/* Mode 2 */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          2. X is what percent of Y?
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <input
            type="number"
            value={x2}
            onChange={(e) => setX2(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
          <span className="text-neutral-500">is what % of</span>
          <input
            type="number"
            value={y2}
            onChange={(e) => setY2(e.target.value)}
            className="w-28 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
          <span className="text-neutral-500">?</span>
        </div>
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white">
          Result: <span className="text-rose-600 dark:text-rose-400 text-lg">{res2}%</span>
        </div>
      </div>

      {/* Mode 3 */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          3. Percentage Increase or Decrease
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-neutral-500">From</span>
          <input
            type="number"
            value={a3}
            onChange={(e) => setA3(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
          <span className="text-neutral-500">to</span>
          <input
            type="number"
            value={b3}
            onChange={(e) => setB3(e.target.value)}
            className="w-28 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-center font-bold"
          />
        </div>
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white">
          Result: <span className={parseFloat(res3) >= 0 ? "text-emerald-500 text-lg" : "text-rose-500 text-lg"}>
            {parseFloat(res3) >= 0 ? `+${res3}% (Increase)` : `${res3}% (Decrease)`}
          </span>
        </div>
      </div>
    </div>
  );
}
