"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calculator, DollarSign, Users, ShieldCheck, Copy, Check, Download, AlertCircle } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveExchangeRate } from "@/lib/exchange-rate";

// Official General Department of Taxation (GDT) Cambodia Tax on Salary Brackets (Monthly in KHR)
const TAX_BRACKETS = [
  { min: 0, max: 1_500_000, rate: 0.0, label: "0 to 1,500,000 ៛", tag: "0%" },
  { min: 1_500_000, max: 2_000_000, rate: 0.05, label: "1,500,001 to 2,000,000 ៛", tag: "5%" },
  { min: 2_000_000, max: 8_500_000, rate: 0.10, label: "2,000,001 to 8,500,000 ៛", tag: "10%" },
  { min: 8_500_000, max: 12_500_000, rate: 0.15, label: "8,500,001 to 12,500,000 ៛", tag: "15%" },
  { min: 12_500_000, max: Infinity, rate: 0.20, label: "Above 12,500,000 ៛", tag: "20%" },
];

// NSSF cap: 1,200,000 KHR (~$296/mo). Employee contribution: 2%
const NSSF_MAX_WAGE_KHR = 1_200_000;
const NSSF_EMPLOYEE_PENSION_RATE = 0.02; // 2%
const DEPENDENT_ALLOWANCE_KHR = 150_000; // 150,000 KHR (~$37) per child / spouse

export function CambodiaSalaryTaxCalculator() {
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [grossSalary, setGrossSalary] = useState("1200"); // $1,200/mo
  const [dependentCount, setDependentCount] = useState("1"); // 1 child/spouse
  const [isResident, setIsResident] = useState(true);

  const liveRateHook = useLiveExchangeRate(4080);
  const [exchangeRate, setExchangeRate] = useState("4080");

  useEffect(() => {
    if (liveRateHook.rate) {
      setExchangeRate(liveRateHook.rate.toString());
    }
  }, [liveRateHook.rate]);

  const [copied, setCopied] = useState(false);


  const stats = useMemo(() => {
    const rawSalary = Math.max(0, parseFloat(grossSalary) || 0);
    const rate = Math.max(3000, parseFloat(exchangeRate) || 4080);
    const dependents = Math.max(0, parseInt(dependentCount, 10) || 0);

    // Convert salary to KHR
    const grossKhr = currency === "USD" ? rawSalary * rate : rawSalary;
    const grossUsd = currency === "USD" ? rawSalary : rawSalary / rate;

    // NSSF Employee Pension contribution (2% of capped wage)
    const nssfEligibleWageKhr = Math.min(grossKhr, NSSF_MAX_WAGE_KHR);
    const nssfEmployeeKhr = nssfEligibleWageKhr * NSSF_EMPLOYEE_PENSION_RATE;
    const nssfEmployeeUsd = nssfEmployeeKhr / rate;

    // NSSF Employer contribution (2% pension + 2.6% healthcare/occupational = 4.6%)
    const nssfEmployerKhr = nssfEligibleWageKhr * 0.046;
    const nssfEmployerUsd = nssfEmployerKhr / rate;

    // Dependent rebate: 150,000 KHR per dependent
    const totalRebateKhr = dependents * DEPENDENT_ALLOWANCE_KHR;

    // Taxable Salary base for GDT
    const taxableBaseKhr = Math.max(0, grossKhr - nssfEmployeeKhr - totalRebateKhr);

    // Calculate tax on salary (ToS)
    let totalTaxKhr = 0;
    const bracketBreakdown: Array<{
      label: string;
      taxableInBracket: number;
      rate: number;
      taxAmount: number;
    }> = [];

    if (!isResident) {
      // Non-resident flat 20% on gross salary without deductions
      totalTaxKhr = grossKhr * 0.20;
      bracketBreakdown.push({
        label: "Non-Resident Flat Rate (20%)",
        taxableInBracket: grossKhr,
        rate: 0.20,
        taxAmount: totalTaxKhr,
      });
    } else {
      // Progressive brackets
      for (const b of TAX_BRACKETS) {
        if (taxableBaseKhr > b.min) {
          const taxableInBracket = Math.min(taxableBaseKhr, b.max) - b.min;
          const tax = taxableInBracket * b.rate;
          totalTaxKhr += tax;
          bracketBreakdown.push({
            label: b.label,
            taxableInBracket,
            rate: b.rate,
            taxAmount: tax,
          });
        }
      }
    }

    const totalTaxUsd = totalTaxKhr / rate;
    const netSalaryKhr = grossKhr - nssfEmployeeKhr - totalTaxKhr;
    const netSalaryUsd = netSalaryKhr / rate;
    const effectiveTaxRate = grossKhr > 0 ? (totalTaxKhr / grossKhr) * 100 : 0;

    return {
      grossUsd,
      grossKhr,
      nssfEmployeeUsd,
      nssfEmployeeKhr,
      nssfEmployerUsd,
      nssfEmployerKhr,
      totalRebateKhr,
      totalRebateUsd: totalRebateKhr / rate,
      taxableBaseKhr,
      taxableBaseUsd: taxableBaseKhr / rate,
      totalTaxUsd,
      totalTaxKhr,
      netSalaryUsd,
      netSalaryKhr,
      effectiveTaxRate,
      bracketBreakdown,
      rate,
    };
  }, [grossSalary, currency, dependentCount, isResident, exchangeRate]);

  const handleCopy = () => {
    const text = `Cambodia Salary & Tax on Salary (ToS) Breakdown (2026-2029):
- Gross Salary: $${stats.grossUsd.toFixed(2)} (${stats.grossKhr.toLocaleString()} ៛)
- NSSF Pension (2%): $${stats.nssfEmployeeUsd.toFixed(2)} (${stats.nssfEmployeeKhr.toLocaleString()} ៛)
- Dependent Relief (${dependentCount}): $${stats.totalRebateUsd.toFixed(2)} (${stats.totalRebateKhr.toLocaleString()} ៛)
- Taxable Base: $${stats.taxableBaseUsd.toFixed(2)} (${stats.taxableBaseKhr.toLocaleString()} ៛)
- Tax on Salary (ToS): $${stats.totalTaxUsd.toFixed(2)} (${stats.totalTaxKhr.toLocaleString()} ៛)
- Net Take-Home Pay: $${stats.netSalaryUsd.toFixed(2)} (${stats.netSalaryKhr.toLocaleString()} ៛)
Effective Tax Rate: ${stats.effectiveTaxRate.toFixed(2)}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Official GDT & NSSF Guidelines
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cambodia Salary & Tax on Salary (ToS) Calculator
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currency === "USD" ? "primary" : "outline"}
            size="sm"
            onClick={() => setCurrency("USD")}
          >
            USD ($)
          </Button>
          <Button
            variant={currency === "KHR" ? "primary" : "outline"}
            size="sm"
            onClick={() => setCurrency("KHR")}
          >
            KHR (៛)
          </Button>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          label={`Monthly Gross Salary (${currency})`}
          id="tos-gross"
          helperText="Base wage before tax and NSSF deductions."
        >
          <Input
            id="tos-gross"
            type="number"
            min={0}
            step={currency === "USD" ? 50 : 200000}
            value={grossSalary}
            onChange={(e) => setGrossSalary(e.target.value)}
            className="tabular-nums font-semibold"
          />
        </FormField>

        <FormField
          label="Dependents (Spouse / Children)"
          id="tos-dependents"
          helperText="150,000 ៛ (~$37) tax rebate per dependent."
        >
          <Select
            id="tos-dependents"
            value={dependentCount}
            onChange={(e) => setDependentCount(e.target.value)}
          >
            <option value="0">0 Dependents (Single)</option>
            <option value="1">1 Dependent (150,000 ៛ relief)</option>
            <option value="2">2 Dependents (300,000 ៛ relief)</option>
            <option value="3">3 Dependents (450,000 ៛ relief)</option>
            <option value="4">4 Dependents (600,000 ៛ relief)</option>
            <option value="5">5+ Dependents (750,000 ៛ relief)</option>
          </Select>
        </FormField>

        <FormField label="Tax Residency Status" id="tos-residency">
          <Select
            id="tos-residency"
            value={isResident ? "resident" : "non-resident"}
            onChange={(e) => setIsResident(e.target.value === "resident")}
          >
            <option value="resident">Resident (0% - 20% Progressive)</option>
            <option value="non-resident">Non-Resident (Flat 20%)</option>
          </Select>
        </FormField>

        <FormField
          label="Exchange Rate (USD → KHR)"
          id="tos-rate"
          helperText="GDT monthly official rate."
        >
          <Input
            id="tos-rate"
            type="number"
            min={3000}
            max={5000}
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      {/* Output Summary Cards */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-success">
            Net Monthly Take-Home Pay
          </dt>
          <dd className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
            ${stats.netSalaryUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
            {Math.round(stats.netSalaryKhr).toLocaleString()} ៛ / month
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tax on Salary (ToS)
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-destructive">
            ${stats.totalTaxUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {Math.round(stats.totalTaxKhr).toLocaleString()} ៛ (Effective: {stats.effectiveTaxRate.toFixed(1)}%)
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            NSSF Employee Pension (2%)
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            ${stats.nssfEmployeeUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {Math.round(stats.nssfEmployeeKhr).toLocaleString()} ៛ (Max cap 24,000 ៛)
          </p>
        </div>
      </dl>

      {/* Detailed Deduction Breakdown */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Calculator size={16} className="text-accent" />
            Monthly Salary Deduction & Tax Flow
          </h3>
          <Badge variant="outline" size="sm">
            Rate: 1 USD = {stats.rate.toLocaleString()} KHR
          </Badge>
        </div>

        <div className="divide-y divide-border text-xs">
          <div className="flex justify-between py-2">
            <span className="font-medium text-foreground">Gross Monthly Salary:</span>
            <span className="font-bold tabular-nums text-foreground">
              ${stats.grossUsd.toFixed(2)} ({Math.round(stats.grossKhr).toLocaleString()} ៛)
            </span>
          </div>
          <div className="flex justify-between py-2 text-muted-foreground">
            <span>NSSF Employee Contribution (2% capped):</span>
            <span className="tabular-nums text-destructive">
              -${stats.nssfEmployeeUsd.toFixed(2)} (-{Math.round(stats.nssfEmployeeKhr).toLocaleString()} ៛)
            </span>
          </div>
          {stats.totalRebateKhr > 0 && (
            <div className="flex justify-between py-2 text-muted-foreground">
              <span>Dependent Relief ({dependentCount} × 150,000 ៛):</span>
              <span className="tabular-nums text-success">
                -${stats.totalRebateUsd.toFixed(2)} (-{Math.round(stats.totalRebateKhr).toLocaleString()} ៛)
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 font-medium">
            <span className="text-foreground">Taxable Salary Base (ToS Base):</span>
            <span className="tabular-nums text-foreground">
              ${stats.taxableBaseUsd.toFixed(2)} ({Math.round(stats.taxableBaseKhr).toLocaleString()} ៛)
            </span>
          </div>
          <div className="flex justify-between py-2 text-muted-foreground">
            <span>Monthly Tax on Salary (ToS):</span>
            <span className="tabular-nums text-destructive font-semibold">
              -${stats.totalTaxUsd.toFixed(2)} (-{Math.round(stats.totalTaxKhr).toLocaleString()} ៛)
            </span>
          </div>
          <div className="flex justify-between py-2.5 font-bold text-sm bg-surface-muted/50 px-2 rounded">
            <span className="text-foreground">Net Pay Transferred to Employee:</span>
            <span className="text-success tabular-nums">
              ${stats.netSalaryUsd.toFixed(2)} ({Math.round(stats.netSalaryKhr).toLocaleString()} ៛)
            </span>
          </div>
        </div>
      </section>

      {/* GDT Bracket Breakdown Table */}
      {isResident && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">
            GDT Cambodia Progressive Tax Brackets Applied
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Bracket Range (KHR)</th>
                  <th className="py-2 pr-3 font-semibold">Rate</th>
                  <th className="py-2 pr-3 font-semibold text-right">Taxable in Bracket</th>
                  <th className="py-2 text-right font-semibold">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TAX_BRACKETS.map((b, idx) => {
                  const applied = stats.bracketBreakdown.find((br) => br.rate === b.rate);
                  return (
                    <tr key={idx} className="hover:bg-surface-muted transition-colors">
                      <td className="py-2 pr-3 text-foreground">{b.label}</td>
                      <td className="py-2 pr-3 font-semibold text-accent">{b.tag}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                        {applied ? `${Math.round(applied.taxableInBracket).toLocaleString()} ៛` : "0 ៛"}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                        {applied && applied.taxAmount > 0
                          ? `${Math.round(applied.taxAmount).toLocaleString()} ៛ ($${(applied.taxAmount / stats.rate).toFixed(2)})`
                          : "0 ៛"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied breakdown!" : "Copy Tax Breakdown"}
        </Button>
      </div>
    </div>
  );
}
