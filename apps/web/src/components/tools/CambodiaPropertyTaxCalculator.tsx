"use client";

import React, { useState, useId } from "react";
import {
  Building2,
  Home,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Info,
  Coins,
  Printer,
  RotateCcw,
  Scale,
  Receipt,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

/* ── Cambodia Official Constants (GDT / NBC) ────────────────────────── */
const NBC_RATE = 4100; // 1 USD = 4,100 KHR
const EXEMPTION_GIFT_KHR = 100_000_000; // 100M KHR deduction for gift between direct relatives
const EXEMPTION_BOREY_USD = 70_000; // Borey relief threshold ($70,000) under state stimulus
const ANNUAL_PROPERTY_TAX_THRESHOLD_KHR = 100_000_000; // 100M KHR threshold for annual property tax

export type TransactionType = "sale" | "gift_relative" | "inheritance_relative" | "gift_non_relative";
export type TitleType = "hard" | "soft";
export type PropertyType = "residential_house" | "land" | "condo" | "borey";
export type CapitalGainsMethod = "standard_80" | "actual";

export function CambodiaPropertyTaxCalculator() {
  const propertyValueInputId = useId();
  const originalCostInputId = useId();

  // Inputs
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [propertyValue, setPropertyValue] = useState<number>(120_000);
  const [transactionType, setTransactionType] = useState<TransactionType>("sale");
  const [propertyType, setPropertyType] = useState<PropertyType>("residential_house");
  const [titleType, setTitleType] = useState<TitleType>("hard");
  const [isBoreyReliefEligible, setIsBoreyReliefEligible] = useState<boolean>(false);
  
  // Seller's Capital Gains Tax inputs
  const [includeCapitalGains, setIncludeCapitalGains] = useState<boolean>(true);
  const [capitalGainsMethod, setCapitalGainsMethod] = useState<CapitalGainsMethod>("standard_80");
  const [originalCostUSD, setOriginalCostUSD] = useState<number>(90_000);
  const [copied, setCopied] = useState<boolean>(false);

  // Normalize inputs to USD and KHR
  const valUSD = currency === "USD" ? propertyValue : propertyValue / NBC_RATE;
  const valKHR = currency === "KHR" ? propertyValue : propertyValue * NBC_RATE;

  // 1. Stamp Duty Tax (ពន្ធប្រថាប់ត្រា 4%)
  let stampDutyTaxKHR = 0;
  let exemptionBaseKHR = 0;
  let stampDutyNote = "";

  if (transactionType === "inheritance_relative") {
    // 100% Tax Exempt for inheritance between direct relatives (Parents, Spouses, Children, Grandparents)
    stampDutyTaxKHR = 0;
    exemptionBaseKHR = valKHR;
    stampDutyNote = "លើកលែងពន្ធ ១០០% (០ រៀល) ចំពោះមរតករវាងសាច់ញាតិផ្ទាល់ (ឪពុកម្តាយ-កូន, ប្តី-ប្រពន្ធ, ជីដូនជីតា-ចៅ) យោងច្បាប់សារពើពន្ធ។";
  } else if (transactionType === "gift_relative") {
    // First 100 Million KHR is tax-free. Remainder taxed at 4%
    exemptionBaseKHR = Math.min(valKHR, EXEMPTION_GIFT_KHR);
    const taxableBaseKHR = Math.max(0, valKHR - EXEMPTION_GIFT_KHR);
    stampDutyTaxKHR = taxableBaseKHR * 0.04;
    stampDutyNote = "លើកលែងពន្ធលើទឹកប្រាក់ ១០០,០០០,០០០ រៀល ដំបូង។ ទឹកប្រាក់លើសជាប់ពន្ធ ៤% (យោងប្រកាសអគ្គនាយកដ្ឋានពន្ធដារ GDT)។";
  } else if (propertyType === "borey" && isBoreyReliefEligible && valUSD <= EXEMPTION_BOREY_USD) {
    // Borey package under $70k state stimulus
    stampDutyTaxKHR = 0;
    exemptionBaseKHR = valKHR;
    stampDutyNote = "លើកលែងពន្ធប្រថាប់ត្រា ៤% ទាំងស្រុង តាមគោលការណ៍លើកទឹកចិត្តរបស់រាជរដ្ឋាភិបាលសម្រាប់ផ្ទះបុរីតម្លៃ ≤ $70,000។";
  } else {
    // Standard sale or non-relative gift: 4% of total valuation
    stampDutyTaxKHR = valKHR * 0.04;
    exemptionBaseKHR = 0;
    stampDutyNote = "អត្រាពន្ធ ៤% នៃតម្លៃកំណត់ដោយអគ្គនាយកដ្ឋានពន្ធដារ (GDT) ឬតម្លៃក្នុងកិច្ចសន្យាទិញ-លក់។";
  }

  const stampDutyTaxUSD = stampDutyTaxKHR / NBC_RATE;
  const exemptionBaseUSD = exemptionBaseKHR / NBC_RATE;

  // 2. Cadastre & Administrative Title Transfer Fees (សេវាសុរិយោដី / រដ្ឋបាល)
  let cadastreFeeUSD = 0;
  let cadastreNote = "";

  if (titleType === "hard") {
    // Hard title (L-MAP): Cadastral service, cadastre stamp, measurement & public registration
    // Typically ~ 600,000 KHR to 1,000,000 KHR (~$150 - $250) + nominal fee
    cadastreFeeUSD = 250;
    cadastreNote = "សេវាសុរិយោដីផ្លូវការកាត់ឈ្មោះប្លង់រឹង (L-MAP) នៅមន្ទីររៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់។";
  } else {
    // Soft title: Local sangkat / khan administration certification (~$150 - $300)
    cadastreFeeUSD = 180;
    cadastreNote = "កម្រៃសេវារដ្ឋបាលបញ្ជាក់ផ្ទេរសិទ្ធិកាន់កាប់ប្លង់ទន់នៅសាលាសង្កាត់ / សាលាស្រុក-ខណ្ឌ។";
  }
  const cadastreFeeKHR = cadastreFeeUSD * NBC_RATE;

  // 3. Seller's Capital Gains Tax 20% (ពន្ធលើចំណេញមូលធន - សម្រាប់អ្នកលក់)
  let sellerCapitalGainsUSD = 0;
  let sellerGainsNote = "";

  if (includeCapitalGains && transactionType === "sale") {
    if (capitalGainsMethod === "standard_80") {
      // 80% deemed deduction -> Tax is 20% on remaining 20% of sales price = 4% of total sales price
      sellerCapitalGainsUSD = valUSD * 0.20 * 0.20;
      sellerGainsNote = "វិធីសាស្ត្រកាត់កងតាមការកំណត់ ៨០%៖ ពន្ធត្រូវបង់ = ២០% លើប្រាក់ចំណេញ ២០% (ស្មើនឹង ៤% នៃថ្លៃលក់សរុប)។";
    } else {
      // Actual expense deduction: 20% on (Selling Price - Original Cost)
      const gain = Math.max(0, valUSD - originalCostUSD);
      sellerCapitalGainsUSD = gain * 0.20;
      sellerGainsNote = `វិធីសាស្ត្រកាត់កងតាមចំណាយជាក់ស្តែង៖ ២០% លើប្រាក់ចំណេញសុទ្ធ ($${gain.toLocaleString()} ក្រោយដកថ្លៃដើមទិញ $${originalCostUSD.toLocaleString()})។`;
    }
  }
  const sellerCapitalGainsKHR = sellerCapitalGainsUSD * NBC_RATE;

  // 4. Annual Property Tax Estimate (ពន្ធលើអចលនទ្រព្យប្រចាំឆ្នាំ ០.១%)
  const annualTaxableBaseKHR = Math.max(0, valKHR - ANNUAL_PROPERTY_TAX_THRESHOLD_KHR);
  const annualPropertyTaxKHR = annualTaxableBaseKHR * 0.001; // 0.1% on excess over 100M KHR
  const annualPropertyTaxUSD = annualPropertyTaxKHR / NBC_RATE;

  // Total Buyer Costs
  const totalBuyerCostUSD = stampDutyTaxUSD + cadastreFeeUSD;
  const totalBuyerCostKHR = stampDutyTaxKHR + cadastreFeeKHR;

  // Presets
  const applyPreset = (preset: {
    val: number;
    curr: "USD" | "KHR";
    tt: TransactionType;
    pt: PropertyType;
    tit: TitleType;
    borey: boolean;
  }) => {
    setCurrency(preset.curr);
    setPropertyValue(preset.val);
    setTransactionType(preset.tt);
    setPropertyType(preset.pt);
    setTitleType(preset.tit);
    setIsBoreyReliefEligible(preset.borey);
  };

  const handleCopySummary = () => {
    const text = `=== របាយការណ៍គណនាពន្ធប្រថាប់ត្រា & ផ្ទេរកម្មសិទ្ធិអចលនទ្រព្យ (CamTech) ===
តម្លៃអចលនទ្រព្យ: $${valUSD.toLocaleString()} (${valKHR.toLocaleString()} ៛)
ប្រភេទប្រតិបត្តិការ: ${
      transactionType === "sale"
        ? "ទិញ-លក់ទូទៅ"
        : transactionType === "gift_relative"
        ? "ប្រទានកម្មរវាងសាច់ញាតិផ្ទាល់"
        : transactionType === "inheritance_relative"
        ? "មរតករវាងសាច់ញាតិផ្ទាល់"
        : "ប្រទានកម្មទូទៅ"
    }
ប្រភេទប្លង់: ${titleType === "hard" ? "ប្លង់រឹង (L-MAP)" : "ប្លង់ទន់"}
----------------------------------------
[ចំណាយអ្នកទិញ]
• ពន្ធប្រថាប់ត្រា ៤% (Stamp Duty): $${stampDutyTaxUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${stampDutyTaxKHR.toLocaleString()} ៛)
• ទឹកប្រាក់លើកលែងពន្ធ: $${exemptionBaseUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${exemptionBaseKHR.toLocaleString()} ៛)
• សេវាសុរិយោដី / រដ្ឋបាល: ~$${cadastreFeeUSD.toLocaleString()}
• សរុបចំណាយអ្នកទិញ: $${totalBuyerCostUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
----------------------------------------
[ចំណាយអ្នកលក់]
• ពន្ធលើចំណេញមូលធន ២០%: $${sellerCapitalGainsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
----------------------------------------
ពន្ធលើអចលនទ្រព្យប្រចាំឆ្នាំ (០.១%): ~$${annualPropertyTaxUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} / ឆ្នាំ
គណនាដោយផ្អែកលើច្បាប់សារពើពន្ធ និងប្រកាសរបស់អគ្គនាយកដ្ឋានពន្ធដារ (GDT) កម្ពុជា។`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Studio Header ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
            <Scale size={13} className="text-foreground" />
            <span>GDT Cambodia Tax on Property Transfer · 2026</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            1 USD = {NBC_RATE.toLocaleString()} KHR (NBC Rate)
          </span>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cambodia Real Estate &amp; Transfer Tax Calculator
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            ម៉ាស៊ីនគណនាពន្ធប្រថាប់ត្រា ៤% (Stamp Duty), ការលើកលែងពន្ធរវាងសាច់ញាតិផ្ទាល់ (មរតក ០% &amp; ប្រទានកម្ម ១០០ លានរៀល), សេវាសុរិយោដីប្លង់រឹង/ទន់ និងពន្ធលើចំណេញមូលធន ២០% តាមច្បាប់សារពើពន្ធកម្ពុជា។
          </p>
        </div>
      </div>

      {/* ── Quick Scenario Presets ─────────────────────────────────── */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Real-World Scenarios (ករណីជាក់ស្តែងញឹកញាប់):
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                val: 68_000,
                curr: "USD",
                tt: "sale",
                pt: "borey",
                tit: "hard",
                borey: true,
              })
            }
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            🏡 ផ្ទះបុរី &lt; $70k (លើកលែងពន្ធ ៤%)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                val: 120_000,
                curr: "USD",
                tt: "gift_relative",
                pt: "residential_house",
                tit: "hard",
                borey: false,
              })
            }
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            👨‍👩‍👧 ឪពុកម្តាយឱ្យកូន (ប្រទានកម្ម $120k)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                val: 150_000,
                curr: "USD",
                tt: "inheritance_relative",
                pt: "residential_house",
                tit: "hard",
                borey: false,
              })
            }
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            📜 ផ្ទេរមរតកគ្រួសារ (ពន្ធ ០%)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                val: 180_000,
                curr: "USD",
                tt: "sale",
                pt: "residential_house",
                tit: "hard",
                borey: false,
              })
            }
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            🏢 ទិញ-លក់ផ្ទះទូទៅ ($180k ប្លង់រឹង)
          </button>
        </div>
      </div>

      {/* ── Main Interactive Configurator Form ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Property Valuation Input */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor={propertyValueInputId} className="text-xs font-bold uppercase tracking-wider text-foreground">
                Property Valuation / Price (តម្លៃអចលនទ្រព្យ) *
              </label>
              <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (currency !== "USD") {
                      setPropertyValue(Math.round(valUSD));
                      setCurrency("USD");
                    }
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    currency === "USD"
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currency !== "KHR") {
                      setPropertyValue(Math.round(valKHR));
                      setCurrency("KHR");
                    }
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    currency === "KHR"
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  KHR (៛)
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-muted-foreground">
                {currency === "USD" ? "$" : "៛"}
              </span>
              <input
                id={propertyValueInputId}
                type="number"
                min={0}
                step={currency === "USD" ? 1000 : 1000000}
                value={propertyValue || ""}
                onChange={(e) => setPropertyValue(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-border bg-background py-3.5 pl-8 pr-4 font-mono text-base font-bold text-foreground outline-none transition-all focus:border-foreground/50 focus:ring-2 focus:ring-foreground/5 sm:text-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Equivalent:{" "}
                <strong className="text-foreground">
                  {currency === "USD"
                    ? `${valKHR.toLocaleString()} ៛`
                    : `$${valUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </strong>
              </span>
              <span>Based on official GDT base valuation</span>
            </div>
          </div>

          {/* Transaction Type Radio Pods */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Transaction Category (ប្រភេទនៃការផ្ទេរកម្មសិទ្ធិ) *
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTransactionType("sale")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  transactionType === "sale"
                    ? "border-foreground bg-surface-muted text-foreground ring-1 ring-foreground/20"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold text-foreground">ទិញ-លក់ទូទៅ (Standard Sale)</span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  ពន្ធប្រថាប់ត្រា ៤% លើតម្លៃអចលនទ្រព្យ
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType("gift_relative")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  transactionType === "gift_relative"
                    ? "border-foreground bg-surface-muted text-foreground ring-1 ring-foreground/20"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold text-foreground">ប្រទានកម្មសាច់ញាតិ (Direct Gift)</span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  ឪពុកម្តាយ-កូន / ប្តី-ប្រពន្ធ (លើកលែង ១០០លានរៀល)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType("inheritance_relative")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  transactionType === "inheritance_relative"
                    ? "border-foreground bg-surface-muted text-foreground ring-1 ring-foreground/20"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold text-foreground">ផ្ទេរមរតកគ្រួសារ (Inheritance)</span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  មរតករវាងសាច់ញាតិផ្ទាល់ (លើកលែងពន្ធ ១០០%)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType("gift_non_relative")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  transactionType === "gift_non_relative"
                    ? "border-foreground bg-surface-muted text-foreground ring-1 ring-foreground/20"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold text-foreground">ប្រទានកម្មក្រៅសាច់ញាតិ (Other)</span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  ការឱ្យទៅបុគ្គលដទៃ (ជាប់ពន្ធ ៤% ពេញលេញ)
                </span>
              </button>
            </div>
          </div>

          {/* Title Type & Property Options */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Title Type */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Title Type (ប្រភេទប្លង់)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTitleType("hard")}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    titleType === "hard"
                      ? "border-foreground bg-foreground text-background shadow-2xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ប្លង់រឹង (Hard L-MAP)
                </button>
                <button
                  type="button"
                  onClick={() => setTitleType("soft")}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    titleType === "soft"
                      ? "border-foreground bg-foreground text-background shadow-2xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ប្លង់ទន់ (Soft Title)
                </button>
              </div>
            </div>

            {/* Property Classification */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Property Category (ប្រភេទអចលនទ្រព្យ)
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-foreground/40"
              >
                <option value="residential_house">ផ្ទះល្វែង / វីឡា (Residential)</option>
                <option value="borey">ផ្ទះក្នុងបុរី (Borey Residence)</option>
                <option value="land">ដីធ្លីសុទ្ធ (Land Only)</option>
                <option value="condo">អគារសហកម្មសិទ្ធិ / ខុនដូ (Condo)</option>
              </select>
            </div>
          </div>

          {/* Borey Government Relief Checkbox */}
          {propertyType === "borey" && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/60 p-3.5">
              <input
                id="borey-incentive"
                type="checkbox"
                checked={isBoreyReliefEligible}
                onChange={(e) => setIsBoreyReliefEligible(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
              />
              <label htmlFor="borey-incentive" className="text-xs text-foreground leading-relaxed cursor-pointer">
                <strong>បុរីទទួលការលើកទឹកចិត្តពីរាជរដ្ឋាភិបាល (តម្លៃ ≤ $70,000)៖</strong> អចលនទ្រព្យក្នុងគម្រោងបុរីដែលបានចុះបញ្ជីត្រឹមត្រូវ ទទួលបានការលើកលែងពន្ធប្រថាប់ត្រា ៤%។
              </label>
            </div>
          )}

          {/* Seller Capital Gains Section */}
          {transactionType === "sale" && (
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Seller&#39;s Capital Gains Tax 20% (ពន្ធលើចំណេញមូលធន)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeCapitalGains(!includeCapitalGains)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    includeCapitalGains ? "bg-foreground" : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-xs ring-0 transition duration-200 ease-in-out ${
                      includeCapitalGains ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {includeCapitalGains && (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setCapitalGainsMethod("standard_80")}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        capitalGainsMethod === "standard_80"
                          ? "border-foreground bg-surface-muted font-bold text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p>វិធីសាស្ត្រកាត់កង ៨០% (Determination)</p>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        បង់ត្រឹម ៤% នៃថ្លៃលក់សរុប (គ្មានវិក្កយបត្រថ្លៃដើម)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCapitalGainsMethod("actual")}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        capitalGainsMethod === "actual"
                          ? "border-foreground bg-surface-muted font-bold text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p>វិធីសាស្ត្រចំណាយជាក់ស្តែង (Actual Expense)</p>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ២០% លើចំណេញសុទ្ធ (មានវិក្កយបត្រទិញដើម)
                      </span>
                    </button>
                  </div>

                  {capitalGainsMethod === "actual" && (
                    <div className="space-y-1.5 pt-1">
                      <label htmlFor={originalCostInputId} className="text-[11px] font-semibold text-muted-foreground">
                        Original Purchase Cost (ថ្លៃដើមដែលបានទិញពីមុនមកជាដុល្លារ):
                      </label>
                      <input
                        id={originalCostInputId}
                        type="number"
                        min={0}
                        step={1000}
                        value={originalCostUSD}
                        onChange={(e) => setOriginalCostUSD(Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs font-bold text-foreground outline-none focus:border-foreground/50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Calculations & Official Invoice Breakdown (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Main Calculation Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                GDT Estimated Worksheet
              </span>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                Official Law Rules
              </span>
            </div>

            {/* Buyer Cost Highlight */}
            <div className="space-y-1 rounded-xl border border-border/80 bg-surface-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                Total Buyer Transfer Cost (ចំណាយអ្នកទិញសរុប)
              </p>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  ${totalBuyerCostUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {totalBuyerCostKHR.toLocaleString()} ៛
                </span>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-3 text-xs">
              {/* Stamp Duty 4% */}
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                <div>
                  <p className="font-semibold text-foreground">ពន្ធប្រថាប់ត្រា ៤% (Stamp Duty)</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {stampDutyNote}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-foreground">
                    ${stampDutyTaxUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {stampDutyTaxKHR.toLocaleString()} ៛
                  </span>
                </div>
              </div>

              {/* Exemption Base */}
              {exemptionBaseUSD > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5 text-success">
                  <p className="font-medium">ការលើកលែងពន្ធរដ្ឋ (Exemption)</p>
                  <p className="font-mono font-bold">
                    -${exemptionBaseUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}

              {/* Cadastre Registration Fee */}
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                <div>
                  <p className="font-semibold text-foreground">សេវាសុរិយោដី / រដ្ឋបាល (Cadastre Fee)</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {cadastreNote}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-foreground">
                    ${cadastreFeeUSD.toLocaleString()}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {cadastreFeeKHR.toLocaleString()} ៛
                  </span>
                </div>
              </div>

              {/* Seller's Capital Gains Tax */}
              {includeCapitalGains && transactionType === "sale" && (
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 text-amber-600 dark:text-amber-400">
                  <div>
                    <p className="font-semibold">ពន្ធលើចំណេញមូលធន ២០% (Seller Pays)</p>
                    <p className="text-[11px] opacity-80 leading-relaxed mt-0.5">
                      {sellerGainsNote}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold">
                      ${sellerCapitalGainsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <span className="font-mono text-[10px]">
                      {sellerCapitalGainsKHR.toLocaleString()} ៛
                    </span>
                  </div>
                </div>
              )}

              {/* Annual Property Tax */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  <p className="font-semibold text-foreground">ពន្ធលើអចលនទ្រព្យប្រចាំឆ្នាំ (០.១%)</p>
                  <p className="text-[10px] text-muted-foreground">
                    បង់ជារៀងរាល់ឆ្នាំមុនថ្ងៃ ៣០ កញ្ញា (លើស ១០០ លានរៀល)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-foreground">
                    ~${annualPropertyTaxUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} / ឆ្នាំ
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {annualPropertyTaxKHR.toLocaleString()} ៛
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Copy & Print */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-muted"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copied ? "បានចម្លងរួចរាល់" : "Copy Breakdown"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-muted"
              >
                <Printer size={14} />
                <span>Print Worksheet</span>
              </button>
            </div>
          </div>

          {/* Legal Notice & GDT Verification Pod */}
          <div className="rounded-2xl border border-border/80 bg-surface-muted/40 p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck size={15} className="text-success" />
              យោងតាមលិខិតបទដ្ឋានគតិយុត្តផ្លូវការ (Legal Basis)
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>
                <strong>ច្បាប់ស្តីពីសារពើពន្ធ៖</strong> កំណត់អត្រាពន្ធប្រថាប់ត្រា ៤% លើការផ្ទេរកម្មសិទ្ធិ ឬសិទ្ធិកាន់កាប់អចលនទ្រព្យ។
              </li>
              <li>
                <strong>ប្រកាសស្តីពីការលើកលែងពន្ធ៖</strong> លើកលែងលើទឹកប្រាក់ ១០០លានរៀល ចំពោះប្រទានកម្មសាច់ញាតិផ្ទាល់ និងលើកលែង ១០០% ចំពោះមរតក។
              </li>
              <li>
                <strong>ពន្ធលើចំណេញមូលធន (Capital Gains Tax)៖</strong> អត្រា ២០% អនុវត្តលើបុគ្គលសresident និង non-resident ដែលលក់អចលនទ្រព្យ។
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
