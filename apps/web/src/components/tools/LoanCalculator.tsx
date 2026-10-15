"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";

/**
 * Reducing-balance EMI.
 *
 * The formula, the zero-rate branch and the `en-US` currency formatting are the
 * original ones. Only the three coloured figures are gone: monthly EMI is the
 * headline on a paper panel and interest/repayment follow in a definition list.
 */
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

  const money = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Loan amount ($)" id="loan-amount">
          <Input
            id="loan-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Annual interest rate (%)" id="loan-rate">
          <Input
            id="loan-rate"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Tenure (months)" id="loan-months">
          <Input
            id="loan-months"
            type="number"
            min="1"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      <div className="rounded-lg bg-surface-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Monthly instalment
        </p>
        <p className="mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground">
          ${money(emi)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          {n} instalments on a ${money(p)} loan.
        </p>
      </div>

      <dl className="divide-y divide-border rounded-lg border border-border">
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Total interest</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">${money(totalInterest)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Total repayment</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">${money(totalPayment)}</dd>
        </div>
      </dl>
    </div>
  );
}
