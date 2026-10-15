"use client";

import React, { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { humanize } from "@/lib/format";

type UnitCategory = "length" | "weight" | "temperature" | "speed" | "area";

interface UnitDef {
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const UNITS: Record<UnitCategory, Record<string, UnitDef>> = {
  length: {
    m: { name: "Meters", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
    km: { name: "Kilometers", symbol: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    cm: { name: "Centimeters", symbol: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    mm: { name: "Millimeters", symbol: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mi: { name: "Miles", symbol: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    yd: { name: "Yards", symbol: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    ft: { name: "Feet", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    in: { name: "Inches", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  },
  weight: {
    kg: { name: "Kilograms", symbol: "kg", toBase: (v) => v, fromBase: (v) => v },
    g: { name: "Grams", symbol: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mg: { name: "Milligrams", symbol: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    lb: { name: "Pounds", symbol: "lb", toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
    oz: { name: "Ounces", symbol: "oz", toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
  },
  temperature: {
    c: { name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
    f: { name: "Fahrenheit", symbol: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
    k: { name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  },
  speed: {
    kmh: { name: "Kilometers / hour", symbol: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    mph: { name: "Miles / hour", symbol: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    ms: { name: "Meters / second", symbol: "m/s", toBase: (v) => v, fromBase: (v) => v },
    knot: { name: "Knots", symbol: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  },
  area: {
    sqm: { name: "Square Meters", symbol: "m²", toBase: (v) => v, fromBase: (v) => v },
    ha: { name: "Hectares", symbol: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    sqkm: { name: "Square Kilometers", symbol: "km²", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    sqft: { name: "Square Feet", symbol: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    acre: { name: "Acres", symbol: "ac", toBase: (v) => v * 4046.8564, fromBase: (v) => v / 4046.8564 },
  },
};

const CATEGORIES: UnitCategory[] = ["length", "weight", "temperature", "speed", "area"];

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("ft");
  const [inputValue, setInputValue] = useState<number>(10);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const keys = Object.keys(UNITS[cat]);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const convert = () => {
    const val = Number(inputValue);
    if (isNaN(val)) return 0;
    const catUnits = UNITS[category];
    const fromDef = catUnits[fromUnit];
    const toDef = catUnits[toUnit];
    if (!fromDef || !toDef) return 0;

    const baseVal = fromDef.toBase(val);
    const result = toDef.fromBase(baseVal);
    return result;
  };

  const convertedValue = convert();

  const converter = (
    <div className="space-y-6 pt-2">
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-4">
          <FormField label="From" id="unit-from">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="unit-from"
                type="number"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                className="sm:w-32 tabular-nums"
              />
              <Select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                aria-label="Convert from unit"
              >
                {Object.entries(UNITS[category]).map(([key, u]) => (
                  <option key={key} value={key}>
                    {u.symbol} — {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </FormField>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={swapUnits}
          aria-label="Swap units"
          className="mb-0 rounded-full"
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
        </Button>

        <FormField label="To" id="unit-to">
          <Select
            id="unit-to"
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            aria-label="Convert to unit"
          >
            {Object.entries(UNITS[category]).map(([key, u]) => (
              <option key={key} value={key}>
                {u.symbol} — {u.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="rounded-lg bg-surface-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Result
        </p>
        <p className="mt-1.5 font-display text-4xl leading-none tabular-nums text-foreground">
          {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          <span className="ml-2 text-2xl text-muted-foreground">
            {UNITS[category][toUnit]?.symbol}
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground tabular-nums">
          {inputValue} {UNITS[category][fromUnit]?.name} ={" "}
          {convertedValue.toFixed(4)} {UNITS[category][toUnit]?.name}
        </p>
      </div>
    </div>
  );

  return (
    <Tabs value={category} onValueChange={(value) => handleCategoryChange(value as UnitCategory)}>
      <TabsList className="w-full justify-start">
        {CATEGORIES.map((cat) => (
          <TabsTrigger key={cat} value={cat}>
            {humanize(cat)}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* One panel; `value` tracks the active tab so every category renders the
          same controls against its own unit list. */}
      <TabsContent value={category}>{converter}</TabsContent>
    </Tabs>
  );
}
