"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Coins,
  DollarSign,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Percent,
  Banknote,
  ShieldAlert,
} from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveExchangeRate } from "@/lib/exchange-rate";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  iconColor: string;
}

const SUPPORTED_ASSETS: CryptoAsset[] = [
  { id: "tether", symbol: "USDT", name: "Tether (TRC-20/ERC-20)", iconColor: "text-emerald-500" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", iconColor: "text-amber-500" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", iconColor: "text-indigo-500" },
  { id: "binancecoin", symbol: "BNB", name: "BNB (Binance Chain)", iconColor: "text-yellow-500" },
  { id: "solana", symbol: "SOL", name: "Solana", iconColor: "text-purple-500" },
];

interface PriceMap {
  [key: string]: {
    usd: number;
    khr: number;
    usd_24h_change?: number;
  };
}

const FALLBACK_PRICES: PriceMap = {
  tether: { usd: 1.0, khr: 4080, usd_24h_change: 0.05 },
  bitcoin: { usd: 81500, khr: 332520000, usd_24h_change: 1.2 },
  ethereum: { usd: 2380, khr: 9710400, usd_24h_change: -0.4 },
  binancecoin: { usd: 580, khr: 2366400, usd_24h_change: 0.8 },
  solana: { usd: 155, khr: 632400, usd_24h_change: 2.5 },
};

export function CryptoKhrConverter() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>("tether");
  const [amount, setAmount] = useState<string>("500");
  const [direction, setDirection] = useState<"crypto_to_fiat" | "fiat_to_crypto">("crypto_to_fiat");

  // Local OTC / P2P Exchanger fee percentage (e.g. 0.5% - 1.5%)
  const [feePercent, setFeePercent] = useState<number>(0.8);

  const [prices, setPrices] = useState<PriceMap>(FALLBACK_PRICES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const liveRateHook = useLiveExchangeRate(4080);

  const fetchCryptoPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,binancecoin,solana&vs_currencies=usd,khr&include_24hr_change=true"
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.tether) {
          setPrices(data);
          setIsLive(true);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch (err) {
      console.warn("CoinGecko public API unreachable, using fallback prices:", err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptoPrices();
  }, [fetchCryptoPrices]);

  const activeAsset = useMemo(() => {
    return SUPPORTED_ASSETS.find((a) => a.id === selectedAssetId) || SUPPORTED_ASSETS[0];
  }, [selectedAssetId]);

  const activePrice = useMemo(() => {
    const p = prices[selectedAssetId] || FALLBACK_PRICES[selectedAssetId];
    // If KHR rate is missing or stale, calculate using live USD/KHR rate
    const khrRate = p.khr || p.usd * (liveRateHook.rate || 4080);
    return {
      usd: p.usd,
      khr: khrRate,
      change24h: p.usd_24h_change ?? 0,
    };
  }, [prices, selectedAssetId, liveRateHook.rate]);

  // Conversion Calculations
  const stats = useMemo(() => {
    const rawInput = Math.max(0, parseFloat(amount) || 0);
    let cryptoQty = 0;
    let grossUsd = 0;
    let grossKhr = 0;

    if (direction === "crypto_to_fiat") {
      cryptoQty = rawInput;
      grossUsd = cryptoQty * activePrice.usd;
      grossKhr = cryptoQty * activePrice.khr;
    } else {
      grossUsd = rawInput;
      cryptoQty = activePrice.usd > 0 ? grossUsd / activePrice.usd : 0;
      grossKhr = grossUsd * (liveRateHook.rate || 4080);
    }

    // Cashout fee deduction
    const feeUsd = grossUsd * (feePercent / 100);
    const feeKhr = grossKhr * (feePercent / 100);

    const netUsd = Math.max(0, grossUsd - feeUsd);
    const netKhr = Math.max(0, grossKhr - feeKhr);

    // Banknote breakdown for Net KHR
    let remainder = Math.round(netKhr);
    const note50k = Math.floor(remainder / 50000);
    remainder %= 50000;
    const note20k = Math.floor(remainder / 20000);
    remainder %= 20000;
    const note10k = Math.floor(remainder / 10000);
    remainder %= 10000;
    const note5k = Math.floor(remainder / 5000);

    return {
      cryptoQty,
      grossUsd,
      grossKhr,
      feeUsd,
      feeKhr,
      netUsd,
      netKhr,
      banknotes: { note50k, note20k, note10k, note5k },
    };
  }, [amount, direction, activePrice, feePercent, liveRateHook.rate]);

  const handleCopyQuote = () => {
    const text = `Crypto to USD/KHR Cashout Calculation:
• Asset: ${stats.cryptoQty.toLocaleString()} ${activeAsset.symbol} (${activeAsset.name})
• Live Rate: 1 ${activeAsset.symbol} = $${activePrice.usd.toLocaleString()} USD (៛${Math.round(activePrice.khr).toLocaleString()} KHR)
• Gross Value: $${stats.grossUsd.toFixed(2)} USD (៛${Math.round(stats.grossKhr).toLocaleString()} KHR)
• P2P / Exchanger Fee (${feePercent}%): -$${stats.feeUsd.toFixed(2)} USD (-៛${Math.round(stats.feeKhr).toLocaleString()} KHR)
• Net Cash in Hand: $${stats.netUsd.toFixed(2)} USD (៛${Math.round(stats.netKhr).toLocaleString()} KHR)
• Source: CoinGecko Public Crypto Index`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            CoinGecko Public Index • Live USD & KHR
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            USDT & Crypto to KHR / USD Cashout Calculator
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge variant="success" size="sm" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Rates {lastUpdated && `(${lastUpdated})`}
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Standard Baseline
            </Badge>
          )}
          <button
            type="button"
            onClick={fetchCryptoPrices}
            disabled={isLoading}
            className="rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
            title="Refresh Live Crypto Rates"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Asset Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SUPPORTED_ASSETS.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          const p = prices[asset.id] || FALLBACK_PRICES[asset.id];
          const change = p?.usd_24h_change ?? 0;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedAssetId(asset.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-xs"
                  : "border-border bg-surface hover:bg-surface-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{asset.symbol}</span>
                <span
                  className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    change >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {change.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 font-mono text-xs font-semibold text-foreground">
                ${p ? p.usd.toLocaleString() : "--"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Inputs & Controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="crypto-amount-input"
          label={
            direction === "crypto_to_fiat"
              ? `Amount in ${activeAsset.symbol}`
              : "Amount in USD ($)"
          }
          helperText={`Current rate: 1 ${activeAsset.symbol} ≈ $${activePrice.usd.toLocaleString()}`}
        >
          <div className="relative">
            <Input
              id="crypto-amount-input"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16 text-lg font-mono font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              {direction === "crypto_to_fiat" ? activeAsset.symbol : "USD ($)"}
            </span>
          </div>
        </FormField>

        {/* Local P2P / OTC Exchanger Fee */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Percent size={13} className="text-accent" />
              <span>Local OTC / P2P Cashout Fee</span>
            </label>
            <span className="font-mono text-xs font-bold text-foreground">{feePercent}%</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[0, 0.5, 0.8, 1.0, 1.5, 2.0].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFeePercent(f)}
                className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                  feePercent === f
                    ? "border-accent bg-accent/10 text-accent font-bold"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                }`}
              >
                {f}%
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground block">
            Typical Cambodian OTC shops charge 0.5% - 1.2% to cash out USDT to paper dollars or Riel.
          </span>
        </div>
      </div>

      {/* Output Net Result Banner */}
      <div className="p-5 rounded-xl border border-accent/30 bg-accent/5 space-y-4">
        <div className="flex items-center justify-between border-b border-accent/20 pb-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Net Cash in Hand (After Exchanger Fee)
          </span>
          <Badge variant="outline" size="sm" className="font-mono text-accent">
            Fee Deducted: -${stats.feeUsd.toFixed(2)} USD
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* USD Net */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
            <span className="text-xs text-muted-foreground block">Net Cash in US Dollars</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-accent">$</span>
              <span className="font-display text-3xl font-bold text-foreground">
                {stats.netUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground uppercase font-medium">USD</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">
              Gross: ${stats.grossUsd.toFixed(2)} USD
            </span>
          </div>

          {/* KHR Net */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
            <span className="text-xs text-muted-foreground block">Net Cash in Cambodian Riel (៛)</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-foreground">
                {Math.round(stats.netKhr).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-accent">៛</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">
              Based on live FX: 1$ = {liveRateHook.rate.toLocaleString()} ៛
            </span>
          </div>
        </div>

        {/* Banknote Denominations Counter */}
        <div className="p-3 rounded-lg bg-surface-muted border border-border/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Banknote size={14} className="text-accent" />
            <span>Estimated Banknotes for Riel Payout:</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-1.5 rounded bg-surface border border-border/40">
              <span className="text-[10px] text-muted-foreground block">50,000 ៛</span>
              <span className="font-bold text-foreground">{stats.banknotes.note50k} bills</span>
            </div>
            <div className="p-1.5 rounded bg-surface border border-border/40">
              <span className="text-[10px] text-muted-foreground block">20,000 ៛</span>
              <span className="font-bold text-foreground">{stats.banknotes.note20k} bills</span>
            </div>
            <div className="p-1.5 rounded bg-surface border border-border/40">
              <span className="text-[10px] text-muted-foreground block">10,000 ៛</span>
              <span className="font-bold text-foreground">{stats.banknotes.note10k} bills</span>
            </div>
            <div className="p-1.5 rounded bg-surface border border-border/40">
              <span className="text-[10px] text-muted-foreground block">5,000 ៛</span>
              <span className="font-bold text-foreground">{stats.banknotes.note5k} bills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Summary Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Calculations are performed client-side. No wallet addresses or financial balances are shared.
        </span>
        <Button variant="outline" size="sm" onClick={handleCopyQuote} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          <span>{copied ? "Copied Quote" : "Copy Cashout Quote"}</span>
        </Button>
      </div>
    </div>
  );
}
