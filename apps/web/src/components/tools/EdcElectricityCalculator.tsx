"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Zap, DollarSign, Calendar, Copy, Check, RefreshCw, Settings2, Home, Building2, Layers } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveExchangeRate } from "@/lib/exchange-rate";

export interface TariffTier {
  id: number;
  min: number;
  max: number;
  rate: number;
  label: string;
}

const DEFAULT_EDC_TIERS: TariffTier[] = [
  { id: 1, min: 0, max: 10, rate: 380, label: "Tier 1 (1 - 10 kWh)" },
  { id: 2, min: 10, max: 50, rate: 480, label: "Tier 2 (11 - 50 kWh)" },
  { id: 3, min: 50, max: 200, rate: 610, label: "Tier 3 (51 - 200 kWh)" },
  { id: 4, min: 200, max: Infinity, rate: 730, label: "Tier 4 (> 200 kWh)" },
];

export function EdcElectricityCalculator() {
  // Rate plan mode: 'edc_tiered' (Official EDC), 'rental_flat' (Landlord/Rental), 'custom'
  const [pricingPlan, setPricingPlan] = useState<"edc_tiered" | "rental_flat" | "custom">("edc_tiered");

  // Rental flat rate per kWh (in KHR)
  const [flatRateKhr, setFlatRateKhr] = useState("1000");

  // Customizable tiers
  const [tiers, setTiers] = useState<TariffTier[]>(DEFAULT_EDC_TIERS);
  const [showTierEditor, setShowTierEditor] = useState(false);

  // Meter vs Units
  const [inputMode, setInputMode] = useState<"kwh" | "meter">("kwh");
  const [totalKwh, setTotalKwh] = useState("245");
  const [prevMeter, setPrevMeter] = useState("1420");
  const [currentMeter, setCurrentMeter] = useState("1665");

  // Live Exchange rate
  const liveRateHook = useLiveExchangeRate(4080);
  const [exchangeRate, setExchangeRate] = useState("4080");

  useEffect(() => {
    if (liveRateHook.rate) {
      setExchangeRate(liveRateHook.rate.toString());
    }
  }, [liveRateHook.rate]);

  const [copied, setCopied] = useState(false);

  // Update a specific tier's rate
  const handleUpdateTierRate = (id: number, newRate: number) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, rate: Math.max(0, newRate) } : t))
    );
  };

  const stats = useMemo(() => {
    let kwh = 0;
    if (inputMode === "kwh") {
      kwh = Math.max(0, parseFloat(totalKwh) || 0);
    } else {
      const prev = Math.max(0, parseFloat(prevMeter) || 0);
      const curr = Math.max(0, parseFloat(currentMeter) || 0);
      kwh = Math.max(0, curr - prev);
    }

    const rate = Math.max(3000, parseFloat(exchangeRate) || 4080);

    let totalCostKhr = 0;
    const tierBreakdown: Array<{
      label: string;
      rate: number;
      units: number;
      costKhr: number;
    }> = [];

    if (pricingPlan === "rental_flat") {
      const flat = Math.max(0, parseFloat(flatRateKhr) || 1000);
      totalCostKhr = kwh * flat;
      tierBreakdown.push({
        label: `Rental Flat Rate (${flat.toLocaleString()} ៛/kWh)`,
        rate: flat,
        units: kwh,
        costKhr: totalCostKhr,
      });
    } else {
      // Tiered (EDC or Custom)
      for (const t of tiers) {
        if (kwh > t.min) {
          const unitsInTier = Math.min(kwh, t.max) - t.min;
          const cost = unitsInTier * t.rate;
          totalCostKhr += cost;
          tierBreakdown.push({
            label: t.label,
            rate: t.rate,
            units: unitsInTier,
            costKhr: cost,
          });
        }
      }
    }

    const totalCostUsd = totalCostKhr / rate;
    const dailyKwh = kwh / 30;
    const dailyCostKhr = totalCostKhr / 30;
    const dailyCostUsd = totalCostUsd / 30;
    const averageRatePerKwh = kwh > 0 ? totalCostKhr / kwh : 0;

    return {
      kwh,
      totalCostKhr,
      totalCostUsd,
      dailyKwh,
      dailyCostKhr,
      dailyCostUsd,
      averageRatePerKwh,
      tierBreakdown,
      rate,
    };
  }, [inputMode, totalKwh, prevMeter, currentMeter, pricingPlan, flatRateKhr, tiers, exchangeRate]);

  const handleCopy = () => {
    const text = `Cambodia Electricity Bill Calculation:
- Plan: ${pricingPlan === "rental_flat" ? `Rental Flat (${flatRateKhr} ៛/kWh)` : "EDC Official Tiered"}
- Consumption: ${stats.kwh.toLocaleString()} kWh
- Total Bill: ${Math.round(stats.totalCostKhr).toLocaleString()} ៛ (≈ $${stats.totalCostUsd.toFixed(2)} USD)
- Average Effective Rate: ${Math.round(stats.averageRatePerKwh)} ៛/kWh
- Exchange Rate: 1 USD = ${stats.rate} KHR`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Dynamic & User-Configurable
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cambodia Electricity Bill & Tariff Calculator
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {liveRateHook.isLive ? (
            <Badge variant="success" size="sm" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Rate: 1$ = {liveRateHook.rate.toLocaleString()} ៛
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Standard Rate: 1$ = {exchangeRate} ៛
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

      {/* Pricing Plan Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Select Electricity Tariff Plan</label>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setPricingPlan("edc_tiered")}
            className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
              pricingPlan === "edc_tiered"
                ? "border-accent bg-accent/10 shadow-xs"
                : "border-border bg-surface hover:bg-surface-muted"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Home size={16} className="text-accent" />
              <span>Official EDC Meter</span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              Official residential tiered rate (380 - 730 ៛/kWh)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPricingPlan("rental_flat")}
            className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
              pricingPlan === "rental_flat"
                ? "border-accent bg-accent/10 shadow-xs"
                : "border-border bg-surface hover:bg-surface-muted"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Building2 size={16} className="text-accent" />
              <span>Rental Room / Landlord</span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              Phnom Penh rental flats (1,000 - 1,500 ៛/kWh flat)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPricingPlan("custom");
              setShowTierEditor(true);
            }}
            className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
              pricingPlan === "custom"
                ? "border-accent bg-accent/10 shadow-xs"
                : "border-border bg-surface hover:bg-surface-muted"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Settings2 size={16} className="text-accent" />
              <span>Customizable Tiers</span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              Edit individual tier rates or commercial tariffs
            </span>
          </button>
        </div>
      </div>

      {/* Rental Flat Rate Input if selected */}
      {pricingPlan === "rental_flat" && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">Common Rental Rates in Cambodia:</span>
            <div className="flex gap-2">
              {[800, 1000, 1200, 1500].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setFlatRateKhr(rate.toString())}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    flatRateKhr === rate.toString()
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {rate.toLocaleString()} ៛
                </button>
              ))}
            </div>
          </div>

          <FormField
            label="Custom Landlord Rate per kWh (KHR)"
            id="edc-flat-rate"
            helperText="Enter the exact amount your apartment/landlord charges per unit."
          >
            <Input
              id="edc-flat-rate"
              type="number"
              min={100}
              step={50}
              value={flatRateKhr}
              onChange={(e) => setFlatRateKhr(e.target.value)}
              className="tabular-nums font-semibold"
            />
          </FormField>
        </div>
      )}

      {/* Editable Tiers Panel if custom */}
      {pricingPlan === "custom" && (
        <div className="rounded-lg border border-border p-4 space-y-3 bg-surface-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground flex items-center gap-1.5">
              <Settings2 size={14} className="text-accent" />
              Edit Tariff Rates per kWh
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTiers(DEFAULT_EDC_TIERS)}
              className="text-xs h-7"
            >
              Reset to EDC Defaults
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => (
              <FormField key={t.id} label={t.label} id={`tier-edit-${t.id}`}>
                <div className="relative">
                  <Input
                    id={`tier-edit-${t.id}`}
                    type="number"
                    min={0}
                    step={10}
                    value={t.rate}
                    onChange={(e) => handleUpdateTierRate(t.id, parseFloat(e.target.value) || 0)}
                    className="tabular-nums pr-12 font-semibold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                    ៛/kWh
                  </span>
                </div>
              </FormField>
            ))}
          </div>
        </div>
      )}

      {/* Reading Mode */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === "kwh" ? "primary" : "outline"}
          size="sm"
          onClick={() => setInputMode("kwh")}
        >
          Enter Total Units (kWh)
        </Button>
        <Button
          variant={inputMode === "meter" ? "primary" : "outline"}
          size="sm"
          onClick={() => setInputMode("meter")}
        >
          Old vs New Meter Readings
        </Button>
      </div>

      {inputMode === "kwh" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Total Units Consumed (kWh)" id="edc-kwh">
            <Input
              id="edc-kwh"
              type="number"
              min={0}
              step={5}
              value={totalKwh}
              onChange={(e) => setTotalKwh(e.target.value)}
              className="tabular-nums font-semibold"
            />
          </FormField>

          <FormField
            label="USD/KHR Exchange Rate"
            id="edc-rate"
            helperText={liveRateHook.isLive ? "Live rate applied from Central Bank API." : "Custom rate."}
          >
            <Input
              id="edc-rate"
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Previous Meter Reading" id="edc-prev">
            <Input
              id="edc-prev"
              type="number"
              value={prevMeter}
              onChange={(e) => setPrevMeter(e.target.value)}
              className="tabular-nums"
            />
          </FormField>

          <FormField label="Current Meter Reading" id="edc-curr">
            <Input
              id="edc-curr"
              type="number"
              value={currentMeter}
              onChange={(e) => setCurrentMeter(e.target.value)}
              className="tabular-nums"
            />
          </FormField>

          <FormField label="USD/KHR Exchange Rate" id="edc-meter-rate">
            <Input
              id="edc-meter-rate"
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
        </div>
      )}

      {/* Bill Results */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Total Monthly Electricity Bill
          </dt>
          <dd className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
            {Math.round(stats.totalCostKhr).toLocaleString()} ៛
          </dd>
          <p className="mt-1 text-sm font-semibold text-muted-foreground tabular-nums">
            ≈ ${stats.totalCostUsd.toFixed(2)} USD
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total Units Consumed
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {stats.kwh.toLocaleString()} kWh
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            Effective avg: {Math.round(stats.averageRatePerKwh)} ៛/unit
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Daily Cost Estimate
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {Math.round(stats.dailyCostKhr).toLocaleString()} ៛
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            ≈ ${stats.dailyCostUsd.toFixed(2)} / day ({(stats.kwh / 30).toFixed(1)} kWh/d)
          </p>
        </div>
      </dl>

      {/* Step Breakdown Table */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Zap size={16} className="text-accent" />
          Tariff Calculation Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-semibold">Tariff Tier</th>
                <th className="py-2 pr-3 font-semibold">Rate per kWh</th>
                <th className="py-2 pr-3 font-semibold text-right">Units Applied</th>
                <th className="py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.tierBreakdown.map((t, idx) => (
                <tr key={idx} className="hover:bg-surface-muted transition-colors">
                  <td className="py-2.5 pr-3 text-foreground font-medium">{t.label}</td>
                  <td className="py-2.5 pr-3 tabular-nums font-semibold text-accent">
                    {t.rate.toLocaleString()} ៛/kWh
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    {t.units.toLocaleString()} kWh
                  </td>
                  <td className="py-2.5 text-right font-bold tabular-nums text-foreground">
                    {Math.round(t.costKhr).toLocaleString()} ៛ (${(t.costKhr / stats.rate).toFixed(2)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied bill estimate!" : "Copy Bill Estimate"}
        </Button>
      </div>
    </div>
  );
}
