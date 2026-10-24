"use client";

import * as React from "react";

/**
 * The traveller's saved places and saved plans, kept in this browser's localStorage.
 *
 * There are no traveller accounts on this site, so nothing here is synced or backed up, and the
 * interface says "saved on this device" wherever it offers to save. A plan can still travel
 * between devices as a share link (see `encodePlan`).
 */

export interface SavedPlace {
  slug: string;
  name: string;
  destination_slug?: string | null;
  hero_image_url?: string | null;
}

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: string;
  /** `encodePlan()` output. */
  code: string;
  /** Per-stop notes, keyed "day:slug" — notes are not part of the share link. */
  notes?: Record<string, string>;
}

const PLACES_KEY = "tv_trip_places_v1";
const PLANS_KEY = "tv_trip_plans_v1";
const EVENT = "tv-trip-store";

function read<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    // Private mode or storage full: the caller tells the traveller it was not saved.
    return false;
  }
}

// Snapshots are cached per raw string so useSyncExternalStore sees a stable reference.
const snapshots = new Map<string, { raw: string | null; value: unknown[] }>();
const EMPTY: unknown[] = [];

function snapshot<T>(key: string): T[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY as T[];
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T[];
  const value = read<T>(key);
  snapshots.set(key, { raw, value });
  return value;
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PLACES_KEY || e.key === PLANS_KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSavedPlaces(): SavedPlace[] {
  return React.useSyncExternalStore(subscribe, () => snapshot<SavedPlace>(PLACES_KEY), () => EMPTY as SavedPlace[]);
}

export function useSavedPlans(): SavedPlan[] {
  return React.useSyncExternalStore(subscribe, () => snapshot<SavedPlan>(PLANS_KEY), () => EMPTY as SavedPlan[]);
}

export function toggleSavedPlace(place: SavedPlace): boolean {
  const list = read<SavedPlace>(PLACES_KEY);
  const exists = list.some((p) => p.slug === place.slug);
  const next = exists ? list.filter((p) => p.slug !== place.slug) : [...list, place].slice(-60);
  return write(PLACES_KEY, next);
}

export function removeSavedPlace(slug: string): boolean {
  return write(PLACES_KEY, read<SavedPlace>(PLACES_KEY).filter((p) => p.slug !== slug));
}

export function savePlan(plan: Omit<SavedPlan, "id" | "savedAt"> & { id?: string }): SavedPlan | null {
  const list = read<SavedPlan>(PLANS_KEY);
  const entry: SavedPlan = {
    ...plan,
    id: plan.id ?? `p${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...list.filter((p) => p.id !== entry.id)].slice(0, 20);
  return write(PLANS_KEY, next) ? entry : null;
}

export function deletePlan(id: string): boolean {
  return write(PLANS_KEY, read<SavedPlan>(PLANS_KEY).filter((p) => p.id !== id));
}
