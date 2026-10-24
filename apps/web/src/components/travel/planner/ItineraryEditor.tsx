"use client";

import * as React from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, Clock, GripVertical, Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  addStop,
  dayLegs,
  moveStop,
  moveStopToDay,
  parseHours,
  removeStop,
  reorderDay,
  updateStop,
  type Plan,
  type PlanPlace,
  type ScheduledStop,
  type Slot,
} from "@/lib/travel/itinerary";
import { humanize } from "@/lib/format";
import { PLACE_TYPE_KM } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { usePlannerCopy } from "./planner-copy";
import { dayColor } from "./day-colors";
import { isProvinceStandIn } from "@/lib/travel/photo";

interface EditorProps {
  plan: Plan;
  onChange: (plan: Plan) => void;
  bySlug: Map<string, PlanPlace>;
  reasons: Record<string, string[]>;
  conflicts: Set<string>;
}

const SLOTS: Slot[] = ["morning", "afternoon", "evening"];

function StopCard({
  stop,
  day,
  index,
  count,
  dayCount,
  place,
  reasons,
  conflict,
  onChange,
  plan,
  leg,
}: {
  leg?: string;
  stop: ScheduledStop;
  day: number;
  index: number;
  count: number;
  dayCount: number;
  place?: PlanPlace;
  reasons: string[];
  conflict: boolean;
  onChange: (plan: Plan) => void;
  plan: Plan;
}) {
  const { t, lang, num } = usePlannerCopy();
  const controls = useDragControls();
  const typeLabel = place ? (lang === "km" && PLACE_TYPE_KM[place.place_type] ? PLACE_TYPE_KM[place.place_type] : humanize(place.place_type)) : "";
  const hours = place?.opening_hours && parseHours(place.opening_hours) ? place.opening_hours : null;
  const whyText = reasons.map((r) => (r === "saved" ? t.whySaved : t.interests[r as keyof typeof t.interests] ?? r)).join(" · ");
  const name = place?.name ?? stop.slug;

  return (
    <Reorder.Item
      value={stop.slug}
      dragListener={false}
      dragControls={controls}
      className="it-stop relative rounded-xl border border-border bg-card"
      as="li"
    >
      {leg && <p className="it-leg border-b border-dashed border-border px-4 py-1.5 text-[0.7rem] text-muted-foreground">↑ {leg}</p>}
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <button
          type="button"
          aria-label={`${t.dragHandle}: ${name}`}
          onPointerDown={(e) => controls.start(e)}
          className="it-no-print -ml-1 hidden cursor-grab touch-none items-center self-stretch rounded-md px-1 text-muted-foreground hover:bg-surface-muted active:cursor-grabbing sm:flex"
          tabIndex={-1}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>

        <div className="relative hidden aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:block">
          <JourneyImage src={place?.hero_image_url} alt={name} sizes="80px" />
          {isProvinceStandIn(place?.hero_image_url) && (
            <span className="absolute inset-x-0 bottom-0 bg-tv-night/75 px-1 py-0.5 text-center text-[0.55rem] leading-tight text-tv-ivory">{t.provincePhotoShort}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: dayColor(day) }}>
              {num(day + 1)}.{num(index + 1)}
            </span>
            {typeLabel && <span className="text-muted-foreground">{typeLabel}</span>}
            {conflict && (
              <span className="inline-flex items-center gap-1 text-warning">
                <AlertTriangle size={12} aria-hidden="true" />
                {t.hoursConflict}
              </span>
            )}
          </div>
          <h4 className="mt-1 font-display text-lg leading-snug text-foreground">
            {place ? (
              <Link href={`/travel/place/${stop.slug}`} className="rounded-sm hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {name}
              </Link>
            ) : (
              <span className="text-muted-foreground">{name}</span>
            )}
          </h4>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} aria-hidden="true" />
            {hours ?? t.hoursNotRecorded}
          </p>
          {whyText && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">{t.why}</span> {whyText}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_1fr]">
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="sr-only sm:not-sr-only">{t.slotLabel}</span>
              <select
                aria-label={`${name}: ${t.slotLabel}`}
                value={stop.slot}
                onChange={(e) => onChange(updateStop(plan, day, index, { slot: e.target.value as Slot }))}
                className="min-h-10 rounded-md border border-border bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {t.slots[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="sr-only sm:not-sr-only">{t.time}</span>
              <input
                type="time"
                aria-label={`${name}: ${t.time}`}
                value={stop.time ?? ""}
                onChange={(e) => onChange(updateStop(plan, day, index, { time: e.target.value || undefined }))}
                className="min-h-10 rounded-md border border-border bg-background px-2 text-sm font-normal text-foreground"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-1">
              <span className="sr-only sm:not-sr-only">{t.note}</span>
              <input
                type="text"
                aria-label={`${name}: ${t.note}`}
                value={stop.note ?? ""}
                maxLength={280}
                placeholder={t.notePh}
                onChange={(e) => onChange(updateStop(plan, day, index, { note: e.target.value || undefined }))}
                className="min-h-10 rounded-md border border-border bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
          </div>
        </div>

        <div className="it-no-print flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            aria-label={`${t.moveUp}: ${name}`}
            disabled={index === 0}
            onClick={() => onChange(moveStop(plan, day, index, -1))}
            className="it-icon-btn"
          >
            <ArrowUp size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`${t.moveDown}: ${name}`}
            disabled={index === count - 1}
            onClick={() => onChange(moveStop(plan, day, index, 1))}
            className="it-icon-btn"
          >
            <ArrowDown size={15} aria-hidden="true" />
          </button>
          {dayCount > 1 && (
            <select
              aria-label={`${t.moveToDay}: ${name}`}
              value={day}
              onChange={(e) => onChange(moveStopToDay(plan, day, index, Number(e.target.value)))}
              className="min-h-9 max-w-[6.5rem] rounded-md border border-border bg-background px-1.5 text-xs text-foreground"
            >
              {Array.from({ length: dayCount }, (_, d) => (
                <option key={d} value={d}>
                  {t.day(d + 1)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            aria-label={`${t.remove}: ${name}`}
            onClick={() => onChange(removeStop(plan, day, index))}
            className="it-icon-btn hover:text-destructive"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

/** Every day of the plan, editable in place. All edits go through the pure helpers in `itinerary.ts`. */
export function ItineraryEditor({ plan, onChange, bySlug, reasons, conflicts }: EditorProps) {
  const { t } = usePlannerCopy();
  const planned = new Set(plan.days.flatMap((d) => d.stops.map((s) => s.slug)));
  const addable = Array.from(bySlug.values())
    .filter((p) => !planned.has(p.slug) && p.place_type !== "ACCOMMODATION")
    .sort((a, b) => a.name.localeCompare(b.name));
  const fmt = (km: number) => (km < 10 ? km.toFixed(1) : String(Math.round(km)));

  return (
    <ol className="space-y-8">
      {plan.days.map((day, d) => {
        const legs = dayLegs(day, bySlug);
        return (
          <li key={d} className="it-day" aria-labelledby={`it-day-${d}`}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full" style={{ background: dayColor(d) }} aria-hidden="true" />
              <h3 id={`it-day-${d}`} className="font-display text-2xl tracking-tight text-foreground">
                {t.day(d + 1)}
              </h3>
              <span className="text-xs text-muted-foreground">{t.stops(day.stops.length)}</span>
            </div>

            {day.stops.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{t.emptyDay}</p>
            ) : (
              <Reorder.Group
                as="ol"
                axis="y"
                values={day.stops.map((s) => s.slug)}
                onReorder={(slugs: string[]) => onChange(reorderDay(plan, d, slugs))}
                className="space-y-2"
              >
                {day.stops.map((stop, i) => (
                    <StopCard
                      key={stop.slug}
                      leg={i === 0 ? undefined : legs[i - 1] === null ? t.legUnknown : t.leg(fmt(legs[i - 1] as number))}
                      stop={stop}
                      day={d}
                      index={i}
                      count={day.stops.length}
                      dayCount={plan.days.length}
                      place={bySlug.get(stop.slug)}
                      reasons={reasons[stop.slug] ?? []}
                      conflict={conflicts.has(stop.slug)}
                      onChange={onChange}
                      plan={plan}
                    />
                ))}
              </Reorder.Group>
            )}

            {addable.length > 0 && (
              <div className="it-no-print mt-3 flex items-center gap-2">
                <Plus size={15} aria-hidden="true" className="text-muted-foreground" />
                <label htmlFor={`it-add-${d}`} className="sr-only">
                  {t.addPlace}
                </label>
                <select
                  id={`it-add-${d}`}
                  value=""
                  onChange={(e) => e.target.value && onChange(addStop(plan, d, e.target.value))}
                  className="min-h-10 w-full max-w-sm rounded-full border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="">
                    {t.addPlace} — {t.addPlaceNone}
                  </option>
                  {addable.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
