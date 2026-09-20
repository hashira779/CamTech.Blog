"use client";

import React, { useState } from "react";
import { TrendingUp, DollarSign, Percent } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Unit Cost Price ($)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              min="0"
              step="any"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Unit Selling Price ($)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              min="0"
              step="any"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Units Sold (Volume)
          </label>
          <input
            type="number"
            min="1"
            value={units}
            onChange={(e) => setUnits(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Profit Margin (%)
          </span>
          <div className="mt-2 text-4xl font-black text-emerald-900 dark:text-emerald-100">
            {results.margin.toFixed(2)}%
          </div>
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
            Profit as a percentage of total revenue
          </p>
        </div>

        <div className="p-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Markup (%)
          </span>
          <div className="mt-2 text-4xl font-black text-indigo-900 dark:text-indigo-100">
            {results.markup.toFixed(2)}%
          </div>
          <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
            Percentage added above cost price
          </p>
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Total Net Profit
          </span>
          <div className="mt-2 text-4xl font-black text-amber-900 dark:text-amber-100">
            ${results.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            ${results.unitProfit.toFixed(2)} profit per unit across {units} units
          </p>
        </div>
      </div>

      {/* Aggregate Balance */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
        <div>
          <span className="text-xs text-slate-500 block">Total Revenue</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ${results.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Total Inventory Cost</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ${results.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
