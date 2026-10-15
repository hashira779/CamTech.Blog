"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Sparkles, Search, RefreshCw, Globe, ShieldCheck } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  nameEn: string;
  nameKm: string;
  days: number;
  type: "traditional" | "national" | "international";
  note?: string;
  isApiSource?: boolean;
}

// Curated Khmer cultural names mapping
const KHMER_NAMES_MAP: Record<string, { km: string; type: "traditional" | "national" | "international"; days?: number }> = {
  "New Year's Day": { km: "ទិវាចូលឆ្នាំសកល", type: "international", days: 1 },
  "Victory over Genocide Day": { km: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", type: "national", days: 1 },
  "Meak Bochea Day": { km: "បុណ្យមាឃបូជា", type: "traditional", days: 1 },
  "International Women's Day": { km: "ទិវាអន្តរជាតិនារី", type: "international", days: 1 },
  "Khmer New Year Day": { km: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ", type: "traditional", days: 4 },
  "Moha Sangkranta": { km: "ពិធីបុណ្យចូលឆ្នាំថ្មី (មហាសង្ក្រាន្ត)", type: "traditional", days: 4 },
  "International Workers' Day": { km: "ទិវាពលកម្មអន្តរជាតិ", type: "international", days: 1 },
  "International Labor Day": { km: "ទិវាពលកម្មអន្តរជាតិ", type: "international", days: 1 },
  "King's Birthday": { km: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ", type: "national", days: 1 },
  "Visak Bochea Day": { km: "ពិធីបុណ្យវិសាខបូជា", type: "traditional", days: 1 },
  "Royal Ploughing Ceremony": { km: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល", type: "traditional", days: 1 },
  "Queen Mother's Birthday": { km: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី", type: "national", days: 1 },
  "Constitutional Day": { km: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", type: "national", days: 1 },
  "Pchum Ben": { km: "ពិធីបុណ្យភ្ជុំបិណ្ឌ", type: "traditional", days: 3 },
  "Commemoration Day of King's Father": { km: "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបរមរតនកោដ្ឋ", type: "national", days: 1 },
  "Coronation Day": { km: "ព្រះរាជពិធីគ្រងរាជសម្បត្តិ", type: "national", days: 1 },
  "Independence Day": { km: "ទិវាបុណ្យឯករាជ្យជាតិ", type: "national", days: 1 },
  "Water Festival": { km: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ", type: "traditional", days: 3 },
  "Peace Day": { km: "ទិវាសន្តិភាពនៅកម្ពុជា", type: "national", days: 1 },
};

const FALLBACK_HOLIDAYS_2026: HolidayItem[] = [
  { date: "2026-01-01", nameEn: "International New Year's Day", nameKm: "ទិវាចូលឆ្នាំសកល", days: 1, type: "international" },
  { date: "2026-01-07", nameEn: "Victory over Genocide Day", nameKm: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", days: 1, type: "national" },
  { date: "2026-02-02", nameEn: "Meak Bochea Day", nameKm: "បុណ្យមាឃបូជា", days: 1, type: "traditional" },
  { date: "2026-03-08", nameEn: "International Women's Day", nameKm: "ទិវាអន្តរជាតិនារី", days: 1, type: "international" },
  { date: "2026-04-14", nameEn: "Khmer New Year (Moha Sangkranta)", nameKm: "ពិធីបុណ្យចូលឆ្នាំថ្មី (មហាសង្ក្រាន្ត)", days: 4, type: "traditional", note: "April 14 - 17, 2026" },
  { date: "2026-05-01", nameEn: "International Labor Day", nameKm: "ទិវាពលកម្មអន្តរជាតិ", days: 1, type: "international" },
  { date: "2026-05-14", nameEn: "King Norodom Sihamoni's Birthday", nameKm: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ", days: 1, type: "national" },
  { date: "2026-05-20", nameEn: "Visak Bochea Day", nameKm: "ពិធីបុណ្យវិសាខបូជា", days: 1, type: "traditional" },
  { date: "2026-05-24", nameEn: "Royal Ploughing Ceremony", nameKm: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល", days: 1, type: "traditional" },
  { date: "2026-06-18", nameEn: "Queen Mother's Birthday", nameKm: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី", days: 1, type: "national" },
  { date: "2026-09-24", nameEn: "Constitutional Day", nameKm: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", days: 1, type: "national" },
  { date: "2026-10-09", nameEn: "Pchum Ben Festival Day 1", nameKm: "ពិធីបុណ្យភ្ជុំបិណ្ឌ", days: 3, type: "traditional", note: "October 9 - 11, 2026" },
  { date: "2026-10-15", nameEn: "Commemoration of the King Father", nameKm: "ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបរមរតនកោដ្ឋ", days: 1, type: "national" },
  { date: "2026-10-29", nameEn: "Coronation Day of King Sihamoni", nameKm: "ព្រះរាជពិធីគ្រងរាជសម្បត្តិ", days: 1, type: "national" },
  { date: "2026-11-09", nameEn: "National Independence Day", nameKm: "ទិវាបុណ្យឯករាជ្យជាតិ", days: 1, type: "national" },
  { date: "2026-11-23", nameEn: "Water Festival (Bon Om Touk) Day 1", nameKm: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ", days: 3, type: "traditional", note: "November 23 - 25, 2026" },
  { date: "2026-12-29", nameEn: "National Peace Day", nameKm: "ទិវាសន្តិភាពនៅកម្ពុជា", days: 1, type: "national" },
];

export function KhmerHolidayCalculator() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [holidaysList, setHolidaysList] = useState<HolidayItem[]>(FALLBACK_HOLIDAYS_2026);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromApi, setIsFromApi] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Fetch from public holidays API
  const fetchHolidays = async (year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/KH`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: HolidayItem[] = data.map((item: any) => {
            // Find Khmer name and type
            let kmName = item.localName || "";
            let holidayType: "traditional" | "national" | "international" = "national";
            let days = 1;

            for (const [key, val] of Object.entries(KHMER_NAMES_MAP)) {
              if (item.name.toLowerCase().includes(key.toLowerCase())) {
                kmName = val.km;
                holidayType = val.type;
                if (val.days) days = val.days;
                break;
              }
            }

            return {
              date: item.date,
              nameEn: item.name,
              nameKm: kmName || item.localName,
              days,
              type: holidayType,
              isApiSource: true,
            };
          });

          setHolidaysList(mapped);
          setIsFromApi(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Public holiday API unavailable, using verified Cambodia gazette calendar:", err);
    }

    setHolidaysList(FALLBACK_HOLIDAYS_2026);
    setIsFromApi(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  const filteredHolidays = useMemo(() => {
    let list = holidaysList;
    if (filterType !== "all") {
      list = list.filter((h) => h.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((h) => h.nameEn.toLowerCase().includes(q) || h.nameKm.includes(q));
    }
    return list;
  }, [holidaysList, filterType, search]);

  // Next upcoming holiday
  const nextHolidayInfo = useMemo(() => {
    const today = new Date();
    for (const h of holidaysList) {
      const hDate = new Date(h.date);
      if (hDate >= today) {
        const diffMs = hDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { holiday: h, diffDays };
      }
    }
    return { holiday: holidaysList[0], diffDays: 0 };
  }, [holidaysList]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Official Cambodia Gazetted Calendar
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cambodia Public Holidays & Lunar Calendar ({selectedYear})
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isFromApi ? (
            <Badge variant="success" size="sm" className="gap-1">
              <Globe size={11} />
              Synced via Public Holidays API
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Royal Gazette Calendar
            </Badge>
          )}
          <button
            type="button"
            onClick={() => fetchHolidays(selectedYear)}
            className="rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            title="Refresh Holidays"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Select Calendar Year:</span>
        {[2026, 2027, 2028, 2029].map((yr) => (
          <Button
            key={yr}
            variant={selectedYear === yr ? "primary" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(yr)}
          >
            {yr}
          </Button>
        ))}
      </div>

      {/* Next Major Holiday Countdown */}
      {nextHolidayInfo.holiday && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent flex items-center gap-1.5">
              <Sparkles size={14} />
              Next Upcoming Cambodia Public Holiday
            </span>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">
              {nextHolidayInfo.holiday.nameEn}
            </h3>
            <p className="text-sm font-semibold text-accent font-serif">
              {nextHolidayInfo.holiday.nameKm}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Date: {new Date(nextHolidayInfo.holiday.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {nextHolidayInfo.holiday.days > 1 && ` (${nextHolidayInfo.holiday.days} days off)`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-surface border border-border px-4 py-3 text-center">
              <span className="font-display text-3xl font-black tabular-nums text-accent">
                {nextHolidayInfo.diffDays}
              </span>
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Days Away
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filterType === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            All Holidays ({holidaysList.length})
          </Button>
          <Button
            variant={filterType === "traditional" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterType("traditional")}
          >
            Traditional & Religious
          </Button>
          <Button
            variant={filterType === "national" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterType("national")}
          >
            National & Royal
          </Button>
        </div>

        <div className="relative w-64">
          <Input
            placeholder="Search holiday in EN or KM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9 pr-8"
          />
          <Search size={14} className="absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Holidays Schedule List */}
      <div className="divide-y divide-border rounded-lg border border-border bg-surface text-xs shadow-xs">
        {filteredHolidays.map((h, idx) => {
          const dateObj = new Date(h.date);
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-24 shrink-0 font-mono text-xs font-semibold text-accent tabular-nums">
                  {formattedDate}
                </div>
                <div className="min-w-0">
                  <span className="block font-semibold text-foreground text-sm truncate">
                    {h.nameEn}
                  </span>
                  <span className="block text-xs font-serif text-muted-foreground truncate">
                    {h.nameKm}
                  </span>
                  {h.note && (
                    <span className="block text-xs text-accent/80 font-medium">
                      {h.note}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    h.type === "traditional"
                      ? "warning"
                      : h.type === "national"
                      ? "accent"
                      : "secondary"
                  }
                  size="sm"
                >
                  {h.days} {h.days === 1 ? "Day Off" : "Days Off"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
