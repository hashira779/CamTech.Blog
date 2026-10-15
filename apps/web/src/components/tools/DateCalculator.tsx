"use client";

import React, { useState } from "react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Days between two dates, and a date a given number of days away.
 *
 * `getDifference()` and `getAddSubResult()` are the original loops and the
 * original UTC-mixed date maths — including the business-day count, which still
 * walks the range one day at a time. Only the surfaces moved: the emerald result
 * block is now a paper panel, and the two modes use the tab primitive instead of
 * hand-drawn underline buttons.
 */
export function DateCalculator() {
  const [tab, setTab] = useState<"difference" | "add_sub">("difference");

  // Difference state
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Add/Sub state
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [numDays, setNumDays] = useState<number>(30);

  const getDifference = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Calculate business days
    let cur = new Date(s);
    let businessDays = 0;
    const direction = totalDays >= 0 ? 1 : -1;
    const absDays = Math.abs(totalDays);

    for (let i = 0; i < absDays; i++) {
      cur.setDate(cur.getDate() + direction);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
    }

    const weeks = Math.floor(Math.abs(totalDays) / 7);
    const remDays = Math.abs(totalDays) % 7;

    return {
      totalDays: Math.abs(totalDays),
      isPast: totalDays < 0,
      businessDays,
      weekendDays: Math.abs(totalDays) - businessDays,
      weeks,
      remDays,
    };
  };

  const getAddSubResult = () => {
    const b = new Date(baseDate);
    const mult = operation === "add" ? 1 : -1;
    b.setDate(b.getDate() + mult * numDays);

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return {
      resultDate: b.toISOString().split("T")[0],
      dayName: days[b.getDay()],
    };
  };

  const diffResult = getDifference();
  const addSubResult = getAddSubResult();

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "difference" | "add_sub")}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="difference">Time between dates</TabsTrigger>
        <TabsTrigger value="add_sub">Add / subtract days</TabsTrigger>
      </TabsList>

      <TabsContent value="difference">
        <div className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" id="date-start">
              <Input
                id="date-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="End date" id="date-end">
              <Input
                id="date-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="rounded-lg bg-surface-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total duration
            </p>
            <p className="mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground">
              {diffResult.totalDays}
              <span className="ml-2 text-xl text-muted-foreground">days</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground tabular-nums">
              Equivalent to <span className="font-medium text-foreground">{diffResult.weeks} weeks</span>{" "}
              and <span className="font-medium text-foreground">{diffResult.remDays} days</span>.
            </p>
          </div>

          <dl className="divide-y divide-border rounded-lg border border-border">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Working business days</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {diffResult.businessDays}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">Weekend days</dt>
              <dd className="text-sm font-semibold tabular-nums text-foreground">
                {diffResult.weekendDays}
              </dd>
            </div>
          </dl>
        </div>
      </TabsContent>

      <TabsContent value="add_sub">
        <div className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Starting date" id="date-base">
              <Input
                id="date-base"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
              />
            </FormField>

            <FormField label="Operation" id="date-operation">
              <Select
                id="date-operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value as "add" | "subtract")}
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (-)</option>
              </Select>
            </FormField>

            <FormField label="Number of days" id="date-days">
              <Input
                id="date-days"
                type="number"
                min="1"
                inputMode="numeric"
                value={numDays}
                onChange={(e) => setNumDays(parseInt(e.target.value, 10) || 0)}
                className="tabular-nums"
              />
            </FormField>
          </div>

          <div className="rounded-lg bg-surface-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Target date
            </p>
            <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-foreground">
              {addSubResult.resultDate}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Falls on a <span className="font-medium text-foreground">{addSubResult.dayName}</span>.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
