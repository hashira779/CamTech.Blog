"use client";

import React, { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {(["length", "weight", "temperature", "speed", "area"] as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              category === cat
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Input & Units */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
            >
              {Object.entries(UNITS[category]).map(([key, u]) => (
                <option key={key} value={key}>
                  {u.symbol} - {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center md:pt-6">
          <button
            onClick={swapUnits}
            title="Swap units"
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">To</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
          >
            {Object.entries(UNITS[category]).map(([key, u]) => (
              <option key={key} value={key}>
                {u.symbol} - {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Card */}
      <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
          Conversion Result
        </span>
        <div className="text-4xl md:text-5xl font-black text-emerald-900 dark:text-emerald-100">
          {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
          <span className="text-2xl text-emerald-600 dark:text-emerald-400 font-bold">
            {UNITS[category][toUnit]?.symbol}
          </span>
        </div>
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
          {inputValue} {UNITS[category][fromUnit]?.name} = {convertedValue.toFixed(4)} {UNITS[category][toUnit]?.name}
        </p>
      </div>
    </div>
  );
}
