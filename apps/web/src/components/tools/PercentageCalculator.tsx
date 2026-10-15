"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";

/**
 * Three percentage questions, one row each.
 *
 * The arithmetic is unchanged: the same `parseFloat` guards and the same
 * `.toFixed(2)` outputs, so the printed result is byte-identical to the old
 * card. Only the register moved — rose pills and dark boxes became a hairline
 * panel with labelled fields and a quiet result row aligned on tabular figures.
 */
function Mode({
  index,
  title,
  children,
  resultLabel,
  result,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  resultLabel: string;
  result: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`pct-mode-${index}`}
      className="border-b border-border pb-6 last:border-0 last:pb-0"
    >
      <h2
        id={`pct-mode-${index}`}
        className="section-label mb-4 text-muted-foreground"
      >
        <span className="tabular-nums">{index}.</span> {title}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-surface-muted px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {resultLabel}
        </span>
        <span className="font-display text-2xl leading-none tabular-nums text-foreground">
          {result}
        </span>
      </div>
    </section>
  );
}

export function PercentageCalculator() {
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
  const isIncrease = parseFloat(res3) >= 0;

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Percentage calculations</h2>

      <Mode index={1} title="What is P% of X?" resultLabel="Result" result={res1}>
        <FormField label="Percentage (P)" id="pct-of-percent">
          <Input
            id="pct-of-percent"
            type="number"
            inputMode="decimal"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
        <FormField label="Of value (X)" id="pct-of-value">
          <Input
            id="pct-of-value"
            type="number"
            inputMode="decimal"
            value={x1}
            onChange={(e) => setX1(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </Mode>

      <Mode index={2} title="X is what percent of Y?" resultLabel="Result" result={`${res2}%`}>
        <FormField label="Value (X)" id="pct-share-value">
          <Input
            id="pct-share-value"
            type="number"
            inputMode="decimal"
            value={x2}
            onChange={(e) => setX2(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
        <FormField label="Total (Y)" id="pct-share-total">
          <Input
            id="pct-share-total"
            type="number"
            inputMode="decimal"
            value={y2}
            onChange={(e) => setY2(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </Mode>

      <Mode
        index={3}
        title="Increase or decrease"
        resultLabel="Change"
        result={
          <span className={isIncrease ? "text-success" : "text-destructive"}>
            {isIncrease ? `+${res3}%` : `${res3}%`}
            <span className="ml-1.5 font-sans text-xs font-medium text-muted-foreground">
              {isIncrease ? "increase" : "decrease"}
            </span>
          </span>
        }
      >
        <FormField label="From (A)" id="pct-change-from">
          <Input
            id="pct-change-from"
            type="number"
            inputMode="decimal"
            value={a3}
            onChange={(e) => setA3(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
        <FormField label="To (B)" id="pct-change-to">
          <Input
            id="pct-change-to"
            type="number"
            inputMode="decimal"
            value={b3}
            onChange={(e) => setB3(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </Mode>
    </div>
  );
}
