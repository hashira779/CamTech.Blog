"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Calendar, Copy, Check, Download } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CompoundInterestCalculator() {
  const [initialPrincipal, setInitialPrincipal] = useState("5000");
  const [monthlyDeposit, setMonthlyDeposit] = useState("300");
  const [annualRate, setAnnualRate] = useState("8.5");
  const [years, setYears] = useState("5"); // 2026 to 2031
  const [compoundingFrequency, setCompoundingFrequency] = useState("12"); // monthly
  const [startYear, setStartYear] = useState("2026");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const P = Math.max(0, parseFloat(initialPrincipal) || 0);
    const PMT = Math.max(0, parseFloat(monthlyDeposit) || 0);
    const r = Math.max(0, parseFloat(annualRate) || 0) / 100.0;
    const t = Math.max(1, Math.min(30, parseInt(years, 10) || 1));
    const n = Math.max(1, parseInt(compoundingFrequency, 10) || 12);
    const baseYear = parseInt(startYear, 10) || 2026;

    const yearlyData: Array<{
      year: number;
      calendarYear: number;
      deposits: number;
      interestEarned: number;
      totalInterest: number;
      endingBalance: number;
    }> = [];

    let currentBalance = P;
    let totalDeposited = P;
    let totalInterest = 0;

    for (let yr = 1; yr <= t; yr++) {
      let yearStartBalance = currentBalance;
      let yearDeposits = 0;

      // Simulate month by month for accuracy
      for (let m = 1; m <= 12; m++) {
        currentBalance += PMT;
        yearDeposits += PMT;
        totalDeposited += PMT;

        // Interest compounding step
        const monthlyRate = r / n;
        // If compounding is monthly (12), add interest each month
        if (n === 12 || (n === 4 && m % 3 === 0) || (n === 2 && m % 6 === 0) || (n === 1 && m === 12)) {
          const stepInterest = currentBalance * (r / n);
          currentBalance += stepInterest;
        }
      }

      const interestThisYear = currentBalance - yearStartBalance - yearDeposits;
      totalInterest += interestThisYear;

      yearlyData.push({
        year: yr,
        calendarYear: baseYear + yr - 1,
        deposits: totalDeposited,
        interestEarned: interestThisYear,
        totalInterest: currentBalance - totalDeposited,
        endingBalance: currentBalance,
      });
    }

    const finalBalance = currentBalance;
    const totalPrincipal = totalDeposited;
    const finalInterest = Math.max(0, finalBalance - totalPrincipal);
    const principalPct = finalBalance > 0 ? (totalPrincipal / finalBalance) * 100 : 100;
    const interestPct = finalBalance > 0 ? (finalInterest / finalBalance) * 100 : 0;

    return {
      finalBalance,
      totalPrincipal,
      finalInterest,
      principalPct,
      interestPct,
      yearlyData,
    };
  }, [initialPrincipal, monthlyDeposit, annualRate, years, compoundingFrequency, startYear]);

  const handleCopy = () => {
    const text = `Compound Interest Projection (${startYear}-${parseInt(startYear, 10) + parseInt(years, 10) - 1}):
- Initial Principal: $${parseFloat(initialPrincipal || "0").toLocaleString()}
- Monthly Deposit: $${parseFloat(monthlyDeposit || "0").toLocaleString()}
- Annual Rate: ${annualRate}%
- Total Contributed: $${stats.totalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
- Total Interest Earned: $${stats.finalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
- Future Balance: $${stats.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = "Year,Calendar Year,Total Deposited ($),Interest Earned ($),Total Interest ($),Ending Balance ($)\n";
    stats.yearlyData.forEach((row) => {
      csv += `${row.year},${row.calendarYear},${row.deposits.toFixed(2)},${row.interestEarned.toFixed(2)},${row.totalInterest.toFixed(2)},${row.endingBalance.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compound-growth-${startYear}-projection.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            2026-2029 Forward Wealth Planning
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Compound Interest & Investment Calculator
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          Client-Side Only
        </Badge>
      </div>

      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Initial Starting Balance ($)" id="ci-initial">
          <Input
            id="ci-initial"
            type="number"
            min={0}
            step={100}
            value={initialPrincipal}
            onChange={(e) => setInitialPrincipal(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Regular Monthly Deposit ($)" id="ci-monthly">
          <Input
            id="ci-monthly"
            type="number"
            min={0}
            step={50}
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Estimated Annual Return (%)" id="ci-rate">
          <Input
            id="ci-rate"
            type="number"
            min={0}
            max={100}
            step={0.25}
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Investment Horizon (Years)" id="ci-years">
          <Input
            id="ci-years"
            type="number"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="tabular-nums"
          />
        </FormField>

        <FormField label="Compounding Frequency" id="ci-freq">
          <Select
            id="ci-freq"
            value={compoundingFrequency}
            onChange={(e) => setCompoundingFrequency(e.target.value)}
          >
            <option value="12">Monthly (12 times/year)</option>
            <option value="4">Quarterly (4 times/year)</option>
            <option value="2">Semi-Annually (2 times/year)</option>
            <option value="1">Annually (Once/year)</option>
          </Select>
        </FormField>

        <FormField label="Starting Year" id="ci-start-year">
          <Select
            id="ci-start-year"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          >
            <option value="2026">2026 (Current Plan)</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
          </Select>
        </FormField>
      </div>

      {/* Output Summary Cards */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total Future Value
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            ${stats.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            After {years} years (by year {parseInt(startYear, 10) + parseInt(years, 10)})
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total Principal Invested
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">
            ${stats.totalPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.principalPct.toFixed(1)}% of final balance
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total Interest Profit
          </dt>
          <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-success">
            +${stats.finalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </dd>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.interestPct.toFixed(1)}% compounding gain
          </p>
        </div>
      </dl>

      {/* Visual Composition Bar */}
      <div className="space-y-2 rounded-lg border border-border p-4">
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            Principal (${stats.totalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}): {stats.principalPct.toFixed(1)}%
          </span>
          <span className="font-semibold text-success">
            Interest Earned (${stats.finalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}): {stats.interestPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-surface-muted flex">
          <div
            style={{ width: `${stats.principalPct}%` }}
            className="bg-accent transition-all duration-500"
            title={`Principal: ${stats.principalPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${stats.interestPct}%` }}
            className="bg-success transition-all duration-500"
            title={`Interest: ${stats.interestPct.toFixed(1)}%`}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Summary"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadCsv} className="gap-1.5">
          <Download size={14} />
          Export Timeline (.csv)
        </Button>
      </div>

      {/* Year-by-Year Milestone Table */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Calendar size={16} className="text-accent" />
            Yearly Milestone Trajectory ({startYear} - {parseInt(startYear, 10) + parseInt(years, 10) - 1})
          </h3>
          <span className="text-xs text-muted-foreground">All figures computed locally</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-semibold">Calendar Year</th>
                <th className="py-2 pr-3 font-semibold text-right">Principal Deposited</th>
                <th className="py-2 pr-3 font-semibold text-right">Interest That Year</th>
                <th className="py-2 pr-3 font-semibold text-right">Cumulative Interest</th>
                <th className="py-2 text-right font-semibold">Ending Portfolio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.yearlyData.map((row) => (
                <tr key={row.year} className="hover:bg-surface-muted transition-colors">
                  <td className="py-2.5 pr-3 font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{row.calendarYear}</span>
                      {row.calendarYear <= 2029 && (
                        <Badge variant="outline" size="sm" className="text-[10px]">
                          Target
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    ${row.deposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-success">
                    +${row.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-success">
                    +${row.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right font-bold tabular-nums text-foreground">
                    ${row.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
