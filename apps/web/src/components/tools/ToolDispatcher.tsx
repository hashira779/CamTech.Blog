"use client";

import React from "react";
import { Tool } from "@/types";
import { PercentageCalculator } from "./PercentageCalculator";
import { LoanCalculator } from "./LoanCalculator";
import { QrCodeGenerator } from "./QrCodeGenerator";
import { JsonFormatter } from "./JsonFormatter";
import { ImageCompressor } from "./ImageCompressor";
import { AgeCalculator } from "./AgeCalculator";
import { DiscountCalculator } from "./DiscountCalculator";
import { ProfitCalculator } from "./ProfitCalculator";
import { DateCalculator } from "./DateCalculator";
import { UnitConverter } from "./UnitConverter";
import { WordCounter } from "./WordCounter";

export function ToolDispatcher({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    case "percentage-calculator":
      return <PercentageCalculator />;
    case "age-calculator":
      return <AgeCalculator />;
    case "discount-calculator":
      return <DiscountCalculator />;
    case "profit-calculator":
    case "margin-calculator":
      return <ProfitCalculator />;
    case "date-calculator":
    case "time-difference-calculator":
      return <DateCalculator />;
    case "unit-converter":
      return <UnitConverter />;
    case "loan-calculator":
      return <LoanCalculator />;
    case "qr-code-generator":
      return <QrCodeGenerator />;
    case "json-formatter":
    case "json-validator":
      return <JsonFormatter />;
    case "image-compressor":
    case "image-resizer":
      return <ImageCompressor />;
    case "word-counter":
      return <WordCounter />;
    default:
      return <PercentageCalculator />;
  }
}
