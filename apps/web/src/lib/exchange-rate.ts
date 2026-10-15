"use client";

import { useState, useEffect } from "react";

export interface ExchangeRateResult {
  rate: number;
  lastUpdated: string | null;
  isLoading: boolean;
  isLive: boolean;
  refresh: () => Promise<void>;
}

// In-memory cache for 30 minutes
let memoryCachedRate: { rate: number; timestamp: number; lastUpdated: string } | null = null;

export async function fetchLiveUsdKhrRate(): Promise<{ rate: number; lastUpdated: string | null; isLive: boolean }> {
  const now = Date.now();
  if (memoryCachedRate && now - memoryCachedRate.timestamp < 30 * 60 * 1000) {
    return {
      rate: memoryCachedRate.rate,
      lastUpdated: memoryCachedRate.lastUpdated,
      isLive: true,
    };
  }

  try {
    // Open Exchange Rates / ER-API: completely public, free, updated daily from central banks (including NBC)
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data = await res.json();
      const khr = data?.rates?.KHR;
      if (khr && typeof khr === "number" && khr > 3000 && khr < 5000) {
        const roundedRate = Math.round(khr);
        const lastUpdated = data.time_last_update_utc || new Date().toUTCString();
        memoryCachedRate = { rate: roundedRate, timestamp: now, lastUpdated };
        return { rate: roundedRate, lastUpdated, isLive: true };
      }
    }
  } catch (err) {
    console.warn("Public exchange rate API unreachable, using Cambodia standard default:", err);
  }

  return { rate: 4080, lastUpdated: null, isLive: false };
}

/**
 * Hook to get live USD to KHR exchange rate with live indicator and manual refresh.
 */
export function useLiveExchangeRate(initialDefault = 4080) {
  const [rate, setRate] = useState<number>(initialDefault);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);

  const loadRate = async () => {
    setIsLoading(true);
    const result = await fetchLiveUsdKhrRate();
    setRate(result.rate);
    setLastUpdated(result.lastUpdated);
    setIsLive(result.isLive);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRate();
  }, []);

  return {
    rate,
    setRate,
    lastUpdated,
    isLoading,
    isLive,
    refresh: loadRate,
  };
}
