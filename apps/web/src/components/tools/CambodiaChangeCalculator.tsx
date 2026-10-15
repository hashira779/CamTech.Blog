"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Coins, Banknote, ArrowRightLeft, DollarSign, Calculator, Copy, Check, RefreshCw } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveExchangeRate } from "@/lib/exchange-rate";

// Cambodian Riel Denominations in active circulation
const RIEL_DENOMINATIONS = [
  { val: 50000, label: "50,000 ៛ Note" },
  { val: 20000, label: "20,000 ៛ Note" },
  { val: 10000, label: "10,000 ៛ Note" },
  { val: 5000, label: "5,000 ៛ Note" },
  { val: 2000, label: "2,000 ៛ Note" },
  { val: 1000, label: "1,000 ៛ Note" },
  { val: 500, label: "500 ៛ Note" },
  { val: 100, label: "100 ៛ Note" },
];

export function CambodiaChangeCalculator() {
  const [totalCost, setTotalCost] = useState("6.25");
  const [costCurrency, setCostCurrency] = useState<"USD" | "KHR">("USD");
  const [paidAmount, setPaidAmount] = useState("10.00");
  const [paidCurrency, setPaidCurrency] = useState<"USD" | "KHR">("USD");

  const liveRateHook = useLiveExchangeRate(4100);
  const [exchangeRate, setExchangeRate] = useState("4100");

  useEffect(() => {
    if (liveRateHook.rate) {
      setExchangeRate(liveRateHook.rate.toString());
    }
  }, [liveRateHook.rate]);

  const [copied, setCopied] = useState(false);


  const stats = useMemo(() => {
    const rate = Math.max(3000, parseFloat(exchangeRate) || 4100);
    const rawCost = Math.max(0, parseFloat(totalCost) || 0);
    const rawPaid = Math.max(0, parseFloat(paidAmount) || 0);

    const costInUsd = costCurrency === "USD" ? rawCost : rawCost / rate;
    const paidInUsd = paidCurrency === "USD" ? rawPaid : rawPaid / rate;

    const changeUsd = paidInUsd - costInUsd;
    const changeKhr = Math.round(changeUsd * rate);

    const isSufficient = changeUsd >= 0;

    // Mixed change: Whole USD bills + remainder in KHR
    const wholeUsd = Math.floor(Math.max(0, changeUsd));
    const remainderUsd = Math.max(0, changeUsd - wholeUsd);
    // Round remainder in KHR to nearest 100 Riel (since 100 is smallest circulating bill)
    const mixedKhr = Math.round((remainderUsd * rate) / 100) * 100;

    // Banknote breakdown for the Riel portion
    let remainingRiel = Math.max(0, changeKhr);
    const notesBreakdown: Array<{ label: string; count: number; val: number }> = [];

    for (const d of RIEL_DENOMINATIONS) {
      if (remainingRiel >= d.val) {
        const count = Math.floor(remainingRiel / d.val);
        remainingRiel %= d.val;
        notesBreakdown.push({ label: d.label, count, val: d.val });
      }
    }

    return {
      rate,
      costInUsd,
      costInKhr: Math.round(costInUsd * rate),
      paidInUsd,
      paidInKhr: Math.round(paidInUsd * rate),
      changeUsd,
      changeKhr,
      wholeUsd,
      mixedKhr,
      isSufficient,
      shortageUsd: Math.abs(changeUsd),
      shortageKhr: Math.abs(changeKhr),
      notesBreakdown,
    };
  }, [totalCost, costCurrency, paidAmount, paidCurrency, exchangeRate]);

  const handleCopy = () => {
    const text = `Cambodia Cash Change Calculation:
- Bill Total: $${stats.costInUsd.toFixed(2)} (${stats.costInKhr.toLocaleString()} ៛)
- Paid by Customer: $${stats.paidInUsd.toFixed(2)} (${stats.paidInKhr.toLocaleString()} ៛)
- Change Due: $${stats.changeUsd.toFixed(2)} or ${stats.changeKhr.toLocaleString()} ៛
- Mixed Change Recommendation: $${stats.wholeUsd} USD + ${stats.mixedKhr.toLocaleString()} KHR
- Exchange Rate Applied: 1 USD = ${stats.rate} KHR`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Everyday Retail & Market Commerce
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            USD ↔ KHR Cash Change & Currency Calculator
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {liveRateHook.isLive ? (
            <Badge variant="success" size="sm" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live: 1$ = {liveRateHook.rate.toLocaleString()} ៛
            </Badge>
          ) : (
            <Badge variant="accent" size="sm">
              Retail Rate
            </Badge>
          )}
          <button
            type="button"
            onClick={liveRateHook.refresh}
            className="rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            title="Refresh Live Exchange Rate"
          >
            <RefreshCw size={13} className={liveRateHook.isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Quick Rate Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Market Rates:</span>
        {liveRateHook.isLive && (
          <button
            type="button"
            onClick={() => setExchangeRate(liveRateHook.rate.toString())}
            className={`rounded-full border px-2.5 py-1 transition-colors font-semibold ${
              exchangeRate === liveRateHook.rate.toString()
                ? "border-success bg-success/20 text-success"
                : "border-success/40 bg-surface hover:bg-surface-muted text-success"
            }`}
          >
            Live ({liveRateHook.rate.toLocaleString()} ៛)
          </button>
        )}
        {[4000, 4050, 4080, 4100, 4120].map((r) => (

          <button
            key={r}
            type="button"
            onClick={() => setExchangeRate(r.toString())}
            className={`rounded-full border px-2.5 py-1 transition-colors ${
              exchangeRate === r.toString()
                ? "border-accent bg-accent text-accent-foreground font-semibold"
                : "border-border bg-surface hover:bg-surface-muted text-foreground"
            }`}
          >
            1 USD = {r.toLocaleString()} ៛
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Item / Bill Total Cost</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step={costCurrency === "USD" ? 0.25 : 500}
              min={0}
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              className="tabular-nums font-semibold"
            />
            <Select
              value={costCurrency}
              onChange={(e) => setCostCurrency(e.target.value as "USD" | "KHR")}
              className="w-24 shrink-0"
            >
              <option value="USD">USD ($)</option>
              <option value="KHR">KHR (៛)</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Customer Cash Paid</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step={paidCurrency === "USD" ? 1 : 1000}
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="tabular-nums font-semibold"
            />
            <Select
              value={paidCurrency}
              onChange={(e) => setPaidCurrency(e.target.value as "USD" | "KHR")}
              className="w-24 shrink-0"
            >
              <option value="USD">USD ($)</option>
              <option value="KHR">KHR (៛)</option>
            </Select>
          </div>
        </div>

        <FormField label="Exchange Rate (USD to KHR)" id="change-rate">
          <Input
            id="change-rate"
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      {/* Change Due Results */}
      {stats.isSufficient ? (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Mixed Option (Standard in Cambodia) */}
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Recommended Mixed Change
            </dt>
            <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
              ${stats.wholeUsd} + {stats.mixedKhr.toLocaleString()} ៛
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Dollar notes + Riel small change
            </p>
          </div>

          {/* Full KHR Option */}
          <div className="rounded-lg border border-border bg-surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Full Change in Cambodian Riel
            </dt>
            <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
              {stats.changeKhr.toLocaleString()} ៛
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              If paying change entirely in cash notes
            </p>
          </div>

          {/* Full USD Option */}
          <div className="rounded-lg border border-border bg-surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Exact Change in USD
            </dt>
            <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
              ${stats.changeUsd.toFixed(2)}
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Exact decimal conversion
            </p>
          </div>
        </dl>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive space-y-1">
          <span className="font-bold text-sm">Underpaid / Shortage:</span>
          <p>
            Customer is short by ${stats.shortageUsd.toFixed(2)} ({stats.shortageKhr.toLocaleString()} ៛).
            Please collect more cash before giving change.
          </p>
        </div>
      )}

      {/* Cambodian Banknote Denominations Counter */}
      {stats.isSufficient && stats.changeKhr > 0 && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Banknote size={16} className="text-accent" />
            Cambodian Riel Banknotes to Hand Over
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.notesBreakdown.map((n) => (
              <div
                key={n.val}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{n.label}</span>
                <Badge variant="accent" size="sm" className="tabular-nums font-bold">
                  × {n.count}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied calculation!" : "Copy Change Summary"}
        </Button>
      </div>
    </div>
  );
}
