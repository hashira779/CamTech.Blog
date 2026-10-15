"use client";

import React, { useState, useMemo } from "react";
import { DollarSign, Briefcase, Calendar, Percent, Copy, Check } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SalaryFreelanceCalculator() {
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [targetNetAnnual, setTargetNetAnnual] = useState("48000"); // $4k/mo take home
  const [billableHoursPerWeek, setBillableHoursPerWeek] = useState("28");
  const [vacationWeeks, setVacationWeeks] = useState("4");
  const [monthlyOverhead, setMonthlyOverhead] = useState("250");
  const [taxRatePct, setTaxRatePct] = useState("15");
  const [profitBufferPct, setProfitBufferPct] = useState("10"); // emergency/savings
  const [copied, setCopied] = useState(false);

  // Exchange rate 1 USD = 4,050 KHR
  const KHR_RATE = 4050;

  const stats = useMemo(() => {
    const netTarget = Math.max(0, parseFloat(targetNetAnnual) || 0);
    const weeklyHours = Math.max(1, Math.min(60, parseFloat(billableHoursPerWeek) || 28));
    const offWeeks = Math.max(0, Math.min(20, parseFloat(vacationWeeks) || 0));
    const overheadMonthly = Math.max(0, parseFloat(monthlyOverhead) || 0);
    const taxRate = Math.max(0, Math.min(60, parseFloat(taxRatePct) || 0)) / 100.0;
    const profitBuffer = Math.max(0, Math.min(50, parseFloat(profitBufferPct) || 0)) / 100.0;

    const workingWeeks = Math.max(1, 52 - offWeeks);
    const annualBillableHours = workingWeeks * weeklyHours;

    // Gross target needed before tax: Gross * (1 - taxRate) = NetTarget + AnnualOverhead
    const annualOverhead = overheadMonthly * 12;
    const requiredIncomeBeforeTax = (netTarget + annualOverhead) / Math.max(0.01, 1 - taxRate);
    const totalGrossTarget = requiredIncomeBeforeTax * (1 + profitBuffer);

    const minHourlyRate = annualBillableHours > 0 ? totalGrossTarget / annualBillableHours : 0;
    const dailyRate = minHourlyRate * 8;
    const weeklyTarget = minHourlyRate * weeklyHours;
    const monthlyTarget = totalGrossTarget / 12;

    const annualTaxEstimate = totalGrossTarget * taxRate;

    return {
      workingWeeks,
      annualBillableHours,
      totalGrossTarget,
      annualOverhead,
      annualTaxEstimate,
      minHourlyRate,
      dailyRate,
      weeklyTarget,
      monthlyTarget,
    };
  }, [targetNetAnnual, billableHoursPerWeek, vacationWeeks, monthlyOverhead, taxRatePct, profitBufferPct]);

  const formatMoney = (amount: number) => {
    if (currency === "KHR") {
      const khr = amount * KHR_RATE;
      return `${Math.round(khr).toLocaleString()} ៛`;
    }
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCopy = () => {
    const text = `Freelance & Salary Rate Recommendation:
- Take-Home Target: ${formatMoney(parseFloat(targetNetAnnual || "0"))}/yr
- Billable Hours: ${billableHoursPerWeek} hrs/week (${stats.workingWeeks} weeks/yr)
- Minimum Hourly Rate: ${formatMoney(stats.minHourlyRate)}/hr
- Day Rate (8h): ${formatMoney(stats.dailyRate)}/day
- Monthly Target Gross: ${formatMoney(stats.monthlyTarget)}/mo
- Annual Gross Revenue: ${formatMoney(stats.totalGrossTarget)}/yr`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Professional & Remote Work
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Salary & Freelance Hourly Rate Calculator
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

      {/* Input Fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label={`Target Net Take-Home Pay (Annual ${currency})`}
          id="sal-net-target"
          helperText="The money you actually want in your bank after all costs & taxes."
        >
          <Input
            id="sal-net-target"
            type="number"
            min={0}
            step={1000}
            value={targetNetAnnual}
            onChange={(e) => setTargetNetAnnual(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField
          label="Billable Hours Per Week"
          id="sal-billable-hours"
          helperText="Typical freelance reality: 25-32 billable hours/week."
        >
          <Input
            id="sal-billable-hours"
            type="number"
            min={1}
            max={60}
            value={billableHoursPerWeek}
            onChange={(e) => setBillableHoursPerWeek(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField
          label="Vacation & Sick Weeks (Per Year)"
          id="sal-vacation"
          helperText="Standard recommendation: 4-6 weeks for health & rest."
        >
          <Input
            id="sal-vacation"
            type="number"
            min={0}
            max={20}
            value={vacationWeeks}
            onChange={(e) => setVacationWeeks(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField
          label={`Monthly Overhead & Tools (${currency})`}
          id="sal-overhead"
          helperText="SaaS, hardware, coworking, phone & internet."
        >
          <Input
            id="sal-overhead"
            type="number"
            min={0}
            step={50}
            value={monthlyOverhead}
            onChange={(e) => setMonthlyOverhead(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField
          label="Estimated Tax Rate (%)"
          id="sal-tax-rate"
          helperText="Personal income tax or corporate withholding."
        >
          <Input
            id="sal-tax-rate"
            type="number"
            min={0}
            max={50}
            step={1}
            value={taxRatePct}
            onChange={(e) => setTaxRatePct(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField
          label="Profit & Safety Buffer (%)"
          id="sal-buffer"
          helperText="Buffer for unpaid downtime, delays, and business savings."
        >
          <Input
            id="sal-buffer"
            type="number"
            min={0}
            max={40}
            step={1}
            value={profitBufferPct}
            onChange={(e) => setProfitBufferPct(e.target.value)}
            className="tabular-nums"
          />
        </FormField>
      </div>

      {/* Target Result Cards */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Minimum Hourly Rate
          </dt>
          <dd className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
            {formatMoney(stats.minHourlyRate)}
            <span className="text-sm font-normal text-muted-foreground">/hr</span>
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on {stats.annualBillableHours} billable hours/year
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Day Rate (8 Hours)
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {formatMoney(stats.dailyRate)}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            Weekly target: {formatMoney(stats.weeklyTarget)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Monthly Billing Target
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            {formatMoney(stats.monthlyTarget)}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            Annual Gross: {formatMoney(stats.totalGrossTarget)}
          </p>
        </div>
      </dl>

      {/* Financial Breakdown Table */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Briefcase size={16} className="text-accent" />
          Annual Financial Flow Breakdown
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">Target Take-Home (Net):</span>
            <span className="font-semibold text-foreground">{formatMoney(parseFloat(targetNetAnnual || "0"))}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">Annual Business Overhead:</span>
            <span className="font-semibold text-muted-foreground">+{formatMoney(stats.annualOverhead)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-muted-foreground">Estimated Taxes ({taxRatePct}%):</span>
            <span className="font-semibold text-destructive">+{formatMoney(stats.annualTaxEstimate)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-sm">
            <span className="text-foreground">Required Annual Gross Revenue:</span>
            <span className="text-accent">{formatMoney(stats.totalGrossTarget)}</span>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied recommendation!" : "Copy Rate Proposal"}
        </Button>
      </div>
    </div>
  );
}
