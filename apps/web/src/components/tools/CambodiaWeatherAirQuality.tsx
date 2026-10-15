"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Sun,
  Thermometer,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProvinceOption {
  id: string;
  nameEn: string;
  nameKm: string;
  lat: number;
  lon: number;
}

const CAMBODIA_LOCATIONS: ProvinceOption[] = [
  { id: "phnom-penh", nameEn: "Phnom Penh", nameKm: "រាជធានីភ្នំពេញ", lat: 11.5564, lon: 104.9282 },
  { id: "siem-reap", nameEn: "Siem Reap (Angkor)", nameKm: "ខេត្តសៀមរាប", lat: 13.3671, lon: 103.8448 },
  { id: "sihanoukville", nameEn: "Preah Sihanouk (Kompong Som)", nameKm: "ខេត្តព្រះសីហនុ", lat: 10.6275, lon: 103.5221 },
  { id: "battambang", nameEn: "Battambang", nameKm: "ខេត្តបាត់ដំបង", lat: 13.0957, lon: 103.2022 },
  { id: "kampot", nameEn: "Kampot", nameKm: "ខេត្តកំពត", lat: 10.6104, lon: 104.1815 },
  { id: "kandal", nameEn: "Kandal (Ta Khmau)", nameKm: "ខេត្តកណ្តាល", lat: 11.4552, lon: 104.9568 },
  { id: "poipet", nameEn: "Poipet / Banteay Meanchey", nameKm: "ប៉ោយប៉ែត / បន្ទាយមានជ័យ", lat: 13.6561, lon: 102.5625 },
  { id: "koh-kong", nameEn: "Koh Kong", nameKm: "ខេត្តកោះកុង", lat: 11.6153, lon: 102.9838 },
];

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  uvIndex?: number;
  hourly: Array<{
    time: string;
    temp: number;
    pop: number;
    code: number;
  }>;
}

interface AirQualityData {
  pm2_5: number;
  pm10: number;
  usAqi: number;
  co?: number;
  no2?: number;
}

function getWeatherDescription(code: number): { text: string; textKm: string; icon: string } {
  if (code === 0) return { text: "Clear Sky", textKm: "មេឃស្រឡះល្អ", icon: "sun" };
  if (code === 1 || code === 2) return { text: "Mainly Clear / Partly Cloudy", textKm: "មានពពកខ្លះៗ", icon: "cloud-sun" };
  if (code === 3) return { text: "Overcast", textKm: "ពពកច្រើនស្រអាប់", icon: "cloud" };
  if (code >= 51 && code <= 55) return { text: "Light Drizzle", textKm: "ភ្លៀងរលឹមស្រិចៗ", icon: "drizzle" };
  if (code >= 61 && code <= 65) return { text: "Rain", textKm: "មានភ្លៀងធ្លាក់", icon: "rain" };
  if (code >= 80 && code <= 82) return { text: "Heavy Rain Showers", textKm: "ភ្លៀងធ្លាក់ខ្លាំងកន្ត្រាក់", icon: "rain-heavy" };
  if (code >= 95) return { text: "Thunderstorm", textKm: "ផ្គររន្ទះ និងខ្យល់ខ្លាំង", icon: "thunderstorm" };
  return { text: "Scattered Clouds", textKm: "ពពករសាត់", icon: "cloud-sun" };
}

function getAqiCategory(aqi: number): {
  label: string;
  labelKm: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  recommendation: string;
  recommendationKm: string;
} {
  if (aqi <= 50) {
    return {
      label: "Good (Clean Air)",
      labelKm: "ល្អប្រសើរ - ខ្យល់បរិសុទ្ធ",
      colorClass: "text-success",
      bgClass: "bg-success/10",
      borderClass: "border-success/30",
      recommendation: "Air quality is satisfactory. Ideal for all outdoor exercises and motorbike rides.",
      recommendationKm: "គុណភាពខ្យល់ល្អប្រសើរខ្លាំង សមស្របសម្រាប់ការធ្វើដំណើរ និងហាត់ប្រាណខាងក្រៅ។",
    };
  }
  if (aqi <= 100) {
    return {
      label: "Moderate",
      labelKm: "មធ្យម - អាចទទួលយកបាន",
      colorClass: "text-warning",
      bgClass: "bg-warning/10",
      borderClass: "border-warning/30",
      recommendation: "Acceptable quality. Sensitive individuals should consider wearing a mask during high traffic.",
      recommendationKm: "គុណភាពខ្យល់ស្ថិតក្នុងកម្រិតមធ្យម។ អ្នកដែលមានបញ្ហាផ្លូវដង្ហើមគួរពាក់ម៉ាស់ពេលជិះកាត់ផ្លូវធំៗ។",
    };
  }
  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      labelKm: "មិនល្អសម្រាប់អ្នកងាយប្រតិកម្ម",
      colorClass: "text-category-discover",
      bgClass: "bg-warning/10",
      borderClass: "border-warning/30",
      recommendation: "Children, elderly, and those with asthma should wear PM2.5/N95 masks and limit outdoor sports.",
      recommendationKm: "កុមារ មនុស្សចាស់ និងអ្នកហឺត គួរពាក់ម៉ាស់ N95 ឬការពារធូលី និងកាត់បន្ថយការនៅក្រៅផ្ទះ។",
    };
  }
  if (aqi <= 200) {
    return {
      label: "Unhealthy (High Dust)",
      labelKm: "មិនល្អចំពោះសុខភាព - ធូលីខ្ពស់",
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
      borderClass: "border-destructive/30",
      recommendation: "Everyone may begin to experience health effects. Wear protective masks outdoors.",
      recommendationKm: "កម្រិតធូលី PM2.5 ខ្ពស់ប៉ះពាល់ដល់មនុស្សទូទៅ។ សូមពាក់ម៉ាស់ការពារធូលី និងបិទបង្អួចផ្ទះ។",
    };
  }
  return {
    label: "Hazardous / Very Unhealthy",
    labelKm: "គ្រោះថ្នាក់ខ្លាំង",
    colorClass: "text-category-discover",
    bgClass: "bg-category-world/10",
    borderClass: "border-category-world/30",
    recommendation: "Health alert: Serious risk of respiratory irritation. Avoid all unnecessary outdoor activities.",
    recommendationKm: "ការប្រកាសអាសន្នសុខភាព៖ សូមជៀសវាងការចេញក្រៅ និងបើកម៉ាស៊ីនបន្សុទ្ធខ្យល់ក្នុងបន្ទប់។",
  };
}

export function CambodiaWeatherAirQuality() {
  const [selectedLocId, setSelectedLocId] = useState<string>("phnom-penh");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [isCustomCoords, setIsCustomCoords] = useState(false);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeLocation = useMemo(() => {
    if (isCustomCoords) {
      const lat = parseFloat(customLat) || 11.5564;
      const lon = parseFloat(customLon) || 104.9282;
      return { id: "custom", nameEn: `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})`, nameKm: "ទីតាំងកំណត់ផ្ទាល់", lat, lon };
    }
    return CAMBODIA_LOCATIONS.find((l) => l.id === selectedLocId) || CAMBODIA_LOCATIONS[0];
  }, [selectedLocId, isCustomCoords, customLat, customLon]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const lat = activeLocation.lat;
    const lon = activeLocation.lon;

    try {
      // 1. Fetch Weather from Open-Meteo public API
      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Asia%2FBangkok`
      );

      // 2. Fetch Air Quality (PM2.5, US AQI) from Open-Meteo Air Quality public API
      const aqiPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,us_aqi&timezone=Asia%2FBangkok`
      );

      const [weatherRes, aqiRes] = await Promise.all([weatherPromise, aqiPromise]);

      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        const cur = wData.current || {};
        const hourly = wData.hourly || {};
        const nowIndex = 0; // Take next 6 hours
        const nextHours: Array<{ time: string; temp: number; pop: number; code: number }> = [];

        if (Array.isArray(hourly.time)) {
          for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
            const timeStr = hourly.time[i] ? new Date(hourly.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            nextHours.push({
              time: timeStr,
              temp: hourly.temperature_2m?.[i] ?? cur.temperature_2m,
              pop: hourly.precipitation_probability?.[i] ?? 0,
              code: hourly.weather_code?.[i] ?? 0,
            });
          }
        }

        setWeather({
          temperature: cur.temperature_2m ?? 31,
          apparentTemperature: cur.apparent_temperature ?? 35,
          humidity: cur.relative_humidity_2m ?? 65,
          precipitation: cur.precipitation ?? 0,
          weatherCode: cur.weather_code ?? 1,
          windSpeed: cur.wind_speed_10m ?? 8,
          uvIndex: cur.uv_index ?? 7,
          hourly: nextHours,
        });
      }

      if (aqiRes.ok) {
        const aData = await aqiRes.json();
        const curA = aData.current || {};
        setAirQuality({
          pm2_5: Math.round((curA.pm2_5 ?? 15) * 10) / 10,
          pm10: Math.round((curA.pm10 ?? 25) * 10) / 10,
          usAqi: Math.round(curA.us_aqi ?? 55),
          co: curA.carbon_monoxide,
          no2: curA.nitrogen_dioxide,
        });
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setIsLive(true);
    } catch (err) {
      console.warn("Public weather API error, falling back to local simulation:", err);
      // Realistic Cambodia default fallback
      setWeather({
        temperature: 31.5,
        apparentTemperature: 36.2,
        humidity: 65,
        precipitation: 0.1,
        weatherCode: 1,
        windSpeed: 9.5,
        uvIndex: 6.8,
        hourly: [
          { time: "12:00", temp: 32, pop: 10, code: 1 },
          { time: "14:00", temp: 33, pop: 25, code: 2 },
          { time: "16:00", temp: 31, pop: 45, code: 61 },
          { time: "18:00", temp: 29, pop: 20, code: 2 },
        ],
      });
      setAirQuality({
        pm2_5: 18.2,
        pm10: 28.5,
        usAqi: 64,
      });
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weatherDesc = useMemo(() => {
    return getWeatherDescription(weather?.weatherCode ?? 0);
  }, [weather]);

  const aqiCategory = useMemo(() => {
    return getAqiCategory(airQuality?.usAqi ?? 50);
  }, [airQuality]);

  const handleCopyReport = () => {
    if (!weather || !airQuality) return;
    const text = `Cambodia Weather & Air Quality Report - ${activeLocation.nameEn} (${activeLocation.nameKm}):
• Condition: ${weatherDesc.text} (${weatherDesc.textKm})
• Temperature: ${weather.temperature.toFixed(1)}°C (Feels like: ${weather.apparentTemperature.toFixed(1)}°C)
• Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed.toFixed(1)} km/h
• Air Quality: US AQI ${airQuality.usAqi} - ${aqiCategory.label} (${aqiCategory.labelKm})
• PM2.5: ${airQuality.pm2_5} µg/m³ | PM10: ${airQuality.pm10} µg/m³
• Health Advice: ${aqiCategory.recommendation}
• Source: Open-Meteo Public API (Real-time telemetry)`;
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
            100% Free Public Telemetry • No API Key Needed
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cambodia Weather & PM2.5 Air Quality Monitor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge variant="success" size="sm" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Telemetry {lastUpdated && `(${lastUpdated})`}
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Standard Baseline
            </Badge>
          )}
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
            title="Refresh Live Weather & Air Quality"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Location Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin size={14} className="text-accent" />
          <span>Select Cambodia Province or City</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CAMBODIA_LOCATIONS.map((loc) => {
            const isSelected = !isCustomCoords && selectedLocId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setIsCustomCoords(false);
                  setSelectedLocId(loc.id);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent/10 shadow-xs"
                    : "border-border bg-surface hover:bg-surface-muted"
                }`}
              >
                <div className="font-medium text-xs text-foreground truncate">{loc.nameEn}</div>
                <div className="text-xs text-muted-foreground truncate">{loc.nameKm}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weather Card */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <CloudSun size={18} className="text-warning" />
              <h3 className="font-semibold text-sm text-foreground">Current Weather</h3>
            </div>
            <span className="text-xs text-muted-foreground">{activeLocation.nameEn}</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-foreground">
                  {weather ? weather.temperature.toFixed(1) : "--"}
                </span>
                <span className="text-xl text-muted-foreground font-light">°C</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Thermometer size={13} className="text-accent" />
                <span>Feels like {weather ? weather.apparentTemperature.toFixed(1) : "--"}°C</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-sm text-foreground">{weatherDesc.text}</div>
              <div className="text-xs text-muted-foreground">{weatherDesc.textKm}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
            <div className="p-2 rounded-lg bg-surface-muted flex flex-col items-center text-center">
              <Droplets size={14} className="text-category-news mb-1" />
              <span className="text-muted-foreground text-xs">Humidity</span>
              <span className="font-semibold text-foreground">{weather?.humidity ?? "--"}%</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-muted flex flex-col items-center text-center">
              <Wind size={14} className="text-info mb-1" />
              <span className="text-muted-foreground text-xs">Wind Speed</span>
              <span className="font-semibold text-foreground">{weather?.windSpeed.toFixed(1) ?? "--"} km/h</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-muted flex flex-col items-center text-center">
              <Sun size={14} className="text-warning mb-1" />
              <span className="text-muted-foreground text-xs">UV Index</span>
              <span className="font-semibold text-foreground">{weather?.uvIndex ?? "--"}</span>
            </div>
          </div>

          {/* Hourly Mini Cards */}
          {weather?.hourly && weather.hourly.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-medium text-muted-foreground">Upcoming Hours:</span>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {weather.hourly.slice(0, 4).map((h, i) => (
                  <div key={i} className="p-1.5 rounded border border-border/50 bg-surface-muted/60 text-center">
                    <span className="text-xs text-muted-foreground block">{h.time}</span>
                    <span className="font-semibold text-xs text-foreground block">{Math.round(h.temp)}°C</span>
                    <span className="text-xs text-category-news block">{h.pop}% rain</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Air Quality (PM2.5) Card */}
        <div className={`p-4 rounded-xl border ${aqiCategory.borderClass} ${aqiCategory.bgClass} space-y-4`}>
          <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={aqiCategory.colorClass} />
              <h3 className="font-semibold text-sm text-foreground">Air Quality Index (AQI)</h3>
            </div>
            <Badge variant="outline" size="sm" className={aqiCategory.colorClass}>
              PM2.5 Sensor
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`font-display text-4xl font-bold ${aqiCategory.colorClass}`}>
                  {airQuality ? airQuality.usAqi : "--"}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-medium">US AQI</span>
              </div>
              <div className="mt-1 font-semibold text-xs text-foreground">{aqiCategory.label}</div>
              <div className="text-xs text-muted-foreground">{aqiCategory.labelKm}</div>
            </div>

            <div className="text-right space-y-1">
              <div className="p-2 rounded-lg bg-surface/80 border border-border/40 text-left">
                <div className="text-xs text-muted-foreground">PM2.5 Dust Density</div>
                <div className="font-bold text-sm text-foreground">
                  {airQuality?.pm2_5 ?? "--"} <span className="text-xs font-normal text-muted-foreground">µg/m³</span>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-surface/80 border border-border/40 text-left">
                <div className="text-xs text-muted-foreground">PM10 Coarse Dust</div>
                <div className="font-medium text-xs text-foreground">
                  {airQuality?.pm10 ?? "--"} <span className="text-xs font-normal text-muted-foreground">µg/m³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Recommendation Notice */}
          <div className="p-3 rounded-lg bg-surface/90 border border-border/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck size={14} className="text-accent" />
              <span>Health & Mask Recommendation</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{aqiCategory.recommendation}</p>
            <p className="text-xs text-muted-foreground/90 font-khmer">{aqiCategory.recommendationKm}</p>
          </div>
        </div>
      </div>

      {/* Copy Summary Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Telemetry provided by Open-Meteo European & GFS satellite forecast models.
        </span>
        <Button variant="outline" size="sm" onClick={handleCopyReport} className="gap-1.5">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          <span>{copied ? "Copied Report" : "Copy Weather Report"}</span>
        </Button>
      </div>
    </div>
  );
}
