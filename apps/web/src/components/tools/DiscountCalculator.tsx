"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Discount, coupon and tax stacked the same way the old card did — the maths is
 * the original `calculate()` untouched. What changed is the output: the two
 * saturated emerald/amber panels are now one quiet paper panel whose figures are
 * set on tabular numerals, because a saving is information, not a celebration.
 */
export function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  const calculate = () => {
    const orig = Number(originalPrice) || 0;
    const disc1 = Number(discountPercent) || 0;
    const disc2 = Number(additionalDiscount) || 0;
    const tax = Number(taxRate) || 0;

    const afterFirstDisc = orig * (1 - disc1 / 100);
    const finalBeforeTax = afterFirstDisc * (1 - disc2 / 100);
    const taxAmount = finalBeforeTax * (tax / 100);
    const finalPriceWithTax = finalBeforeTax + taxAmount;
    const totalSavings = orig - finalBeforeTax;
    const effectiveDiscountPercent = orig > 0 ? (totalSavings / orig) * 100 : 0;

    return {
      finalPrice: finalBeforeTax,
      totalSavings,
      effectiveDiscountPercent,
      taxAmount,
      finalPriceWithTax,
    };
  };

  const results = calculate();
  const money = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Original price ($)" id="disc-original">
          <Input
            id="disc-original"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Discount (%)" id="disc-primary">
          <Input
            id="disc-primary"
            type="number"
            min="0"
            max="100"
            inputMode="decimal"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Extra coupon (%)" id="disc-extra">
          <Input
            id="disc-extra"
            type="number"
            min="0"
            max="100"
            inputMode="decimal"
            value={additionalDiscount}
            onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Sales tax (%)" id="disc-tax">
          <Input
            id="disc-tax"
            type="number"
            min="0"
            max="100"
            inputMode="decimal"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      <fieldset className="border-t border-border pt-5">
        <legend className="section-label mb-3 text-muted-foreground">Quick discount</legend>
        <div className="flex flex-wrap gap-2">
          {[10, 15, 20, 25, 30, 40, 50, 70].map((pct) => {
            const active = discountPercent === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPercent(pct)}
                aria-pressed={active}
                className={cn(
                  "h-8 min-w-16 cursor-pointer rounded-md border px-3 text-xs font-semibold tabular-nums transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "border-transparent bg-accent text-accent-foreground"
                    : "border-border-strong bg-surface text-muted-foreground hover:border-foreground/30 hover:bg-surface-muted hover:text-foreground"
                )}
              >
                {pct}% off
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-lg bg-surface-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          You pay
        </p>
        <p className="mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground">
          ${money(results.finalPriceWithTax)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          Saving <span className="font-medium text-success">${money(results.totalSavings)}</span>
          {" · "}
          {results.effectiveDiscountPercent.toFixed(1)}% effective discount
        </p>
      </div>

      <dl className="divide-y divide-border rounded-lg border border-border">
        {taxRate > 0 && (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">Price before tax</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              ${money(results.finalPrice)}
            </dd>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">Tax added</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              ${money(results.taxAmount)}
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Discount applied to</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            ${money(Number(originalPrice) || 0)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
