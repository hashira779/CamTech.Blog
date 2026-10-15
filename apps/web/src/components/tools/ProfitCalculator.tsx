"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";

/**
 * Margin, markup and net profit on one unit price.
 *
 * `calculate()` is the original arithmetic, character for character. The three
 * coloured result tiles it used to feed are now one paper panel: a serif figure
 * for the number a reader came for, then a definition list for the rest, all on
 * tabular numerals so the columns line up.
 */
export function ProfitCalculator() {
  const [costPrice, setCostPrice] = useState<number>(50);
  const [sellingPrice, setSellingPrice] = useState<number>(85);
  const [units, setUnits] = useState<number>(100);

  const calculate = () => {
    const cost = Number(costPrice) || 0;
    const sale = Number(sellingPrice) || 0;
    const qty = Number(units) || 1;

    const unitProfit = sale - cost;
    const totalCost = cost * qty;
    const totalRevenue = sale * qty;
    const totalProfit = unitProfit * qty;

    const margin = sale > 0 ? (unitProfit / sale) * 100 : 0;
    const markup = cost > 0 ? (unitProfit / cost) * 100 : 0;

    return {
      unitProfit,
      totalCost,
      totalRevenue,
      totalProfit,
      margin,
      markup,
    };
  };

  const results = calculate();
  const money = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Unit cost price ($)" id="profit-cost">
          <Input
            id="profit-cost"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={costPrice}
            onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Unit selling price ($)" id="profit-selling">
          <Input
            id="profit-selling"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Units sold" id="profit-units">
          <Input
            id="profit-units"
            type="number"
            min="1"
            inputMode="numeric"
            value={units}
            onChange={(e) => setUnits(parseInt(e.target.value, 10) || 1)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      <div className="rounded-lg bg-surface-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Total net profit
        </p>
        <p
          className={
            results.totalProfit >= 0
              ? "mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground"
              : "mt-1.5 font-display text-4xl leading-none tabular-nums text-destructive"
          }
        >
          {results.totalProfit < 0 ? "-" : ""}${money(Math.abs(results.totalProfit))}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground tabular-nums">
          {results.unitProfit < 0
            ? `Loss of $${money(Math.abs(results.unitProfit))} per unit`
            : `$${money(results.unitProfit)} profit per unit`}{" "}
          across {units} units.
        </p>
      </div>

      <dl className="divide-y divide-border rounded-lg border border-border">
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Profit margin</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            {results.margin.toFixed(2)}%
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">
            Markup <span className="text-xs">above cost</span>
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            {results.markup.toFixed(2)}%
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Total revenue</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            ${money(results.totalRevenue)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Total inventory cost</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            ${money(results.totalCost)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
