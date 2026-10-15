"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Check, Users, DollarSign, RefreshCw, ShieldCheck } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// CRC-16/CCITT-FALSE checksum for EMVCo / KHQR
function crc16(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

export function KhqrGenerator() {
  const [bakongId, setBakongId] = useState("dara_sok@aba");
  const [merchantName, setMerchantName] = useState("Dara Sok");
  const [city, setCity] = useState("Phnom Penh");
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [amount, setAmount] = useState("12.50");

  // Bill split mode
  const [splitMode, setSplitMode] = useState(false);
  const [billTotal, setBillTotal] = useState("50.00");
  const [splitCount, setSplitCount] = useState("4");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Sync split bill calculation
  useEffect(() => {
    if (splitMode) {
      const total = Math.max(0, parseFloat(billTotal) || 0);
      const people = Math.max(1, parseInt(splitCount, 10) || 1);
      const perPerson = total / people;
      setAmount(currency === "USD" ? perPerson.toFixed(2) : Math.round(perPerson).toString());
    }
  }, [splitMode, billTotal, splitCount, currency]);

  // Construct EMVCo / KHQR string
  const khqrPayload = React.useMemo(() => {
    const id = bakongId.trim();
    if (!id) return "";

    // Tag 00: Payload Format Indicator = 01
    let payload = formatTlv("00", "01");

    // Tag 01: Point of Initiation (11: static, 12: dynamic with amount)
    const hasAmount = parseFloat(amount) > 0;
    payload += formatTlv("01", hasAmount ? "12" : "11");

    // Tag 29: Bakong Merchant Account Information
    // Subtag 00: Bakong Account ID
    const sub00 = formatTlv("00", id);
    payload += formatTlv("29", sub00);

    // Tag 52: Merchant Category Code
    payload += formatTlv("52", "5999");

    // Tag 53: Transaction Currency (840 = USD, 116 = KHR)
    payload += formatTlv("53", currency === "USD" ? "840" : "116");

    // Tag 54: Transaction Amount
    if (hasAmount) {
      const amtStr = currency === "USD" ? parseFloat(amount).toFixed(2) : Math.round(parseFloat(amount)).toString();
      payload += formatTlv("54", amtStr);
    }

    // Tag 58: Country Code (KH)
    payload += formatTlv("58", "KH");

    // Tag 59: Merchant Name
    payload += formatTlv("59", merchantName.trim() || "Recipient");

    // Tag 60: Merchant City
    payload += formatTlv("60", city.trim() || "Phnom Penh");

    // Tag 63: CRC16 Checksum
    const withCrcHeader = `${payload}6304`;
    const checksum = crc16(withCrcHeader);
    return `${withCrcHeader}${checksum}`;
  }, [bakongId, merchantName, city, currency, amount]);

  // Render QR
  useEffect(() => {
    if (!khqrPayload) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(khqrPayload, {
      width: 340,
      margin: 2,
      color: {
        dark: "#D91B24", // Official Bakong Red
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Gen error:", err));
  }, [khqrPayload]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `khqr-${currency}-${amount || "open"}.png`;
    a.click();
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(khqrPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            National Bank of Cambodia (NBC)
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Bakong KHQR Generator & Bill Splitter
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          EMVCo KHQR Standard
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={!splitMode ? "primary" : "outline"}
            size="sm"
            onClick={() => setSplitMode(false)}
          >
            Direct Payment QR
          </Button>
          <Button
            variant={splitMode ? "primary" : "outline"}
            size="sm"
            onClick={() => setSplitMode(true)}
            className="gap-1.5"
          >
            <Users size={14} />
            Split Bill with Friends
          </Button>
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

      {/* Bill Splitter Drawer if active */}
      {splitMode && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent flex items-center gap-1.5">
              <Users size={15} />
              Meal & Group Bill Splitter
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {currency === "USD"
                ? `$${parseFloat(amount || "0").toFixed(2)} per person`
                : `${Math.round(parseFloat(amount || "0")).toLocaleString()} ៛ per person`}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={`Total Bill Amount (${currency})`} id="split-total">
              <Input
                id="split-total"
                type="number"
                min={0}
                step={currency === "USD" ? 0.5 : 1000}
                value={billTotal}
                onChange={(e) => setBillTotal(e.target.value)}
                className="tabular-nums"
              />
            </FormField>

            <FormField label="Split Among (Number of Friends)" id="split-count">
              <Input
                id="split-count"
                type="number"
                min={1}
                max={50}
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                className="tabular-nums"
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Input Parameters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          label="Bakong Account ID / Phone"
          id="khqr-id"
          helperText="e.g. name@aba, 012345678@aclb, name@wing"
        >
          <Input
            id="khqr-id"
            value={bakongId}
            onChange={(e) => setBakongId(e.target.value)}
            placeholder="username@bank or phone@bank"
            className="font-mono text-xs"
          />
        </FormField>

        <FormField label="Account / Merchant Name" id="khqr-name">
          <Input
            id="khqr-name"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="e.g. Dara Sok"
          />
        </FormField>

        <FormField
          label={`Amount (${currency})`}
          id="khqr-amount"
          helperText="Leave 0 for customer to enter any amount."
        >
          <Input
            id="khqr-amount"
            type="number"
            min={0}
            step={currency === "USD" ? 0.25 : 500}
            value={amount}
            onChange={(e) => {
              if (splitMode) setSplitMode(false);
              setAmount(e.target.value);
            }}
            className="tabular-nums font-semibold"
          />
        </FormField>

        <FormField label="City / Province" id="khqr-city">
          <Input
            id="khqr-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Phnom Penh"
          />
        </FormField>
      </div>

      {/* Generated KHQR Display Box */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-muted p-6 text-center space-y-4">
        {qrDataUrl ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-red-600 bg-white p-5 shadow-md">
            {/* Bakong KHQR Header Banner */}
            <div className="mb-3 flex items-center justify-between w-full border-b border-red-200 pb-2 px-1">
              <span className="text-xs font-black tracking-widest text-red-600">KHQR</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Bakong NBC
              </span>
            </div>

            <img src={qrDataUrl} alt="Bakong KHQR Code" className="h-60 w-60 object-contain" />

            <div className="mt-3 text-center w-full">
              <p className="font-display text-base font-bold text-gray-900">{merchantName}</p>
              <p className="font-mono text-xs text-gray-600">{bakongId}</p>
              {parseFloat(amount) > 0 && (
                <div className="mt-2 rounded bg-red-50 py-1.5 px-3">
                  <span className="font-mono text-lg font-black text-red-600 tabular-nums">
                    {currency === "USD" ? `$${parseFloat(amount).toFixed(2)}` : `${Math.round(parseFloat(amount)).toLocaleString()} ៛`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-muted-foreground">
            <QrCode size={36} />
            <span className="text-xs">Enter your Bakong ID to generate KHQR</span>
          </div>
        )}

        {qrDataUrl && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download size={14} />
              Download KHQR Image
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyPayload} className="gap-1.5">
              {copiedPayload ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copiedPayload ? "Copied Raw Payload" : "Copy EMVCo String"}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-success" />
          <span>Compatible with ABA Mobile, ACLEDA, Wing, Canadia, TrueMoney, and all Bakong member apps.</span>
        </div>
      </div>
    </div>
  );
}
