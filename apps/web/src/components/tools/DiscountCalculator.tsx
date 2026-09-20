"use client";

import React, { useState } from "react";
import { Tag, DollarSign, Percent, ArrowRight } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Original Price ($)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              min="0"
              step="any"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Discount (%)
          </label>
          <div className="relative">
            <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Extra Coupon (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={additionalDiscount}
            onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Sales Tax (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Preset quick discount buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-500 mr-2">Quick Presets:</span>
        {[10, 15, 20, 25, 30, 40, 50, 70].map((pct) => (
          <button
            key={pct}
            onClick={() => setDiscountPercent(pct)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              discountPercent === pct
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {pct}% OFF
          </button>
        ))}
      </div>

      {/* Results Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Final Payable Price
          </span>
          <div className="mt-2 text-4xl md:text-5xl font-black text-emerald-900 dark:text-emerald-100">
            ${results.finalPriceWithTax.toFixed(2)}
          </div>
          {taxRate > 0 && (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
              Includes ${results.taxAmount.toFixed(2)} tax (${results.finalPrice.toFixed(2)} before tax)
            </p>
          )}
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Total Money Saved
          </span>
          <div className="mt-2 text-4xl md:text-5xl font-black text-amber-900 dark:text-amber-100">
            ${results.totalSavings.toFixed(2)}
          </div>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
            Effective discount of <strong>{results.effectiveDiscountPercent.toFixed(1)}%</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
