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

import { CompoundInterestCalculator } from "./CompoundInterestCalculator";
import { SalaryFreelanceCalculator } from "./SalaryFreelanceCalculator";
import { UuidGenerator } from "./UuidGenerator";
import { Base64Converter } from "./Base64Converter";
import { UrlEncoder } from "./UrlEncoder";
import { CsvToJsonConverter } from "./CsvToJsonConverter";
import { PasswordGenerator } from "./PasswordGenerator";
import { HashGenerator } from "./HashGenerator";
import { ColorContrastChecker } from "./ColorContrastChecker";
import { MarkdownPreviewer } from "./MarkdownPreviewer";
import { CambodiaSalaryTaxCalculator } from "./CambodiaSalaryTaxCalculator";
import { KhqrGenerator } from "./KhqrGenerator";
import { CambodiaChangeCalculator } from "./CambodiaChangeCalculator";
import { EdcElectricityCalculator } from "./EdcElectricityCalculator";
import { KhmerHolidayCalculator } from "./KhmerHolidayCalculator";
import { CambodiaWeatherAirQuality } from "./CambodiaWeatherAirQuality";
import { CambodiaIspNetworkChecker } from "./CambodiaIspNetworkChecker";
import { CryptoKhrConverter } from "./CryptoKhrConverter";
import { DnsLookupInspector } from "./DnsLookupInspector";
import { KnowledgeSearchTool } from "./KnowledgeSearchTool";

/**
 * Maps a tool slug to the component that runs it.
 *
 * Dispatch only — the page around it owns the panel, so no calculator draws its
 * own box, border or shadow.
 */
export function ToolDispatcher({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    // Cambodia-specific & Live Public API everyday utilities
    case "cambodia-weather-air-quality":
    case "cambodia-weather-radar":
      return <CambodiaWeatherAirQuality />;
    case "cambodia-isp-checker":
    case "cambodia-network-checker":
      return <CambodiaIspNetworkChecker />;
    case "crypto-khr-converter":
    case "usdt-khr-converter":
      return <CryptoKhrConverter />;
    case "dns-lookup-inspector":
    case "dns-lookup":
      return <DnsLookupInspector />;
    case "knowledge-search-tool":
    case "knowledge-search":
      return <KnowledgeSearchTool />;
    case "cambodia-salary-tax-calculator":
    case "salary-tax-cambodia":
      return <CambodiaSalaryTaxCalculator />;
    case "khqr-generator":
    case "bakong-khqr-generator":
      return <KhqrGenerator />;
    case "cambodia-change-calculator":
    case "khr-change-calculator":
      return <CambodiaChangeCalculator />;
    case "edc-electricity-calculator":
    case "cambodia-electricity-calculator":
      return <EdcElectricityCalculator />;
    case "khmer-holiday-calculator":
    case "cambodia-public-holidays":
      return <KhmerHolidayCalculator />;

    // Financial & everyday calculators
    case "percentage-calculator":
      return <PercentageCalculator />;
    case "compound-interest-calculator":
    case "investment-calculator":
      return <CompoundInterestCalculator />;
    case "salary-freelance-calculator":
    case "hourly-rate-calculator":
      return <SalaryFreelanceCalculator />;
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

    // Developer & Data utilities
    case "uuid-generator":
      return <UuidGenerator />;
    case "base64-converter":
      return <Base64Converter />;
    case "url-encoder":
      return <UrlEncoder />;
    case "csv-to-json":
      return <CsvToJsonConverter />;
    case "password-generator":
      return <PasswordGenerator />;
    case "hash-generator":
      return <HashGenerator />;

    // Media & Design utilities
    case "color-contrast-checker":
      return <ColorContrastChecker />;
    case "qr-code-generator":
      return <QrCodeGenerator />;
    case "image-compressor":
    case "image-resizer":
      return <ImageCompressor />;

    // Text utilities
    case "markdown-previewer":
      return <MarkdownPreviewer />;
    case "json-formatter":
    case "json-validator":
      return <JsonFormatter />;
    case "word-counter":
      return <WordCounter />;
    default:
      return <CambodiaSalaryTaxCalculator />;
  }
}


