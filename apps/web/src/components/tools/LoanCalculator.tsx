"use client";

import React, { useState } from "react";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";

export function LoanCalculator() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("8.5");
  const [months, setMonths] = useState("36");

  const p = parseFloat(amount) || 0;
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = parseInt(months) || 1;

  let emi = 0;
  if (p > 0 && n > 0) {
    if (r === 0) {
      emi = p / n;
    } else {
      emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
  }

  const totalPayment = emi * n;
  const totalInterest = totalPayment - p;

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl max-w-2xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-neutral-500 block mb-1">Loan Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-500 block mb-1">Annual Interest Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-500 block mb-1">Tenure (Months)</label>
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold text-sm"
          />
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Monthly EMI</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            ${emi.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Total Interest</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            ${totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Total Repayment</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-white mt-1 block">
            ${totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
