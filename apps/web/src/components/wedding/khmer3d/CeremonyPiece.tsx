"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CeremonyKind } from "./assets";
import type { KhmerEngine, PiecePose } from "./engine";

interface CeremonyPieceProps {
  kind: CeremonyKind;
  /** Template accent, used for the lacquer on trays and cushions */
  accent: string;
  /** Starting turn so neighbouring pieces don't all face the same way */
  baseTurn?: number;
  /** Shown until the 3D piece is ready, and instead of it without WebGL */
  fallback: React.ReactNode;
  className?: string;
}

/* Phones and tablets: a lighter profile (lower canvas density, scroll-linked
   redraws capped near 30 per second). Measured on a 390px viewport with a
   4x-throttled CPU, drawing every piece on every scroll frame cost ~46 ms. */
const touchProfile = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* A ceremony object rendered in real 3D on its carved plinth.
   - loads three.js only when the piece nears the viewport
   - rises out of the page the first time it is seen
   - turns gently with scroll position (both directions), leans toward the
     pointer on hover; no continuous render loop when nothing changes
   - keeps the flat illustration when WebGL is unavailable or the context
     is lost */
export function CeremonyPiece({ kind, accent, baseTurn = 0, fallback, className = "relative" }: CeremonyPieceProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "fallback">("idle");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduced = prefersReducedMotion();
    const touch = touchProfile();
    let lastDraw = 0;
    let engine: KhmerEngine | null = null;
    let disposed = false;
    let raf = 0;
    let visible = false;
    let revealStart = 0;
    const pose: PiecePose = { rotY: baseTurn, tiltX: 0, tiltY: 0, reveal: reduced ? 1 : 0 };
    const target = { tiltX: 0, tiltY: 0 };

    const scrollTurn = () => {
      const r = wrap.getBoundingClientRect();
      const centre = (r.top + r.height / 2) / window.innerHeight - 0.5; // -0.5 (top) .. 0.5 (bottom)
      return baseTurn + Math.max(-1, Math.min(1, centre)) * 0.9;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!engine || disposed) return;
      // On touch devices, let scroll-driven redraws run at about 30 per second
      if (touch && revealStart && pose.reveal >= 1 && now - lastDraw < 30) {
        schedule();
        return;
      }
      lastDraw = now;
      let again = false;
      if (!reduced) {
        if (revealStart && pose.reveal < 1) {
          pose.reveal = Math.min(1, (now - revealStart) / 1300);
          again = pose.reveal < 1;
        }
        const dx = target.tiltX - pose.tiltX;
        const dy = target.tiltY - pose.tiltY;
        if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
          pose.tiltX += dx * 0.12;
          pose.tiltY += dy * 0.12;
          again = true;
        }
        pose.rotY = scrollTurn();
      }
      if (!engine.draw(kind, canvas, pose, accent)) {
        setStatus("fallback");
        return;
      }
      if (again) schedule();
    };
    const schedule = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    const sizeCanvas = () => {
      const r = wrap.getBoundingClientRect();
      const cap = touch || (navigator.hardwareConcurrency || 8) <= 4 ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const onScroll = () => schedule();
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.tiltX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.tiltY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    };
    const onPointerLeave = () => {
      target.tiltX = 0;
      target.tiltY = 0;
      schedule();
    };
    const start = async () => {
      try {
        const mod = await import("./engine");
        engine = await mod.getKhmerEngine(accent);
      } catch {
        engine = null;
      }
      if (disposed) return;
      if (!engine) {
        setStatus("fallback");
        return;
      }
      sizeCanvas();
      setStatus("ready");
      // Build the piece and compile its shaders while the browser is idle,
      // well before it scrolls in, instead of stalling the first frame it's seen
      const ready = engine;
      const run = () => {
        if (!disposed) void ready.prepare(kind);
      };
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(run, { timeout: 2000 });
      else idleId = globalThis.setTimeout(run, 150) as unknown as number;
      schedule();
    };

    // Start loading and preparing far ahead of the viewport
    let loading = false;
    let idleId = 0;
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loading) {
          loading = true;
          void start();
        }
      },
      { rootMargin: "1500px 0px" }
    );
    near.observe(wrap);

    // Draw only while actually on (or just off) screen; reveal once seen
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (entry.intersectionRatio > 0.25 && !revealStart) revealStart = performance.now();
          if (visible) schedule();
        }
      },
      { rootMargin: "300px 0px", threshold: [0, 0.25, 0.6] }
    );
    io.observe(wrap);
    const ro = new ResizeObserver(() => {
      sizeCanvas();
      schedule();
    });
    ro.observe(wrap);
    window.addEventListener("scroll", onScroll, { passive: true });
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerleave", onPointerLeave);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      else globalThis.clearTimeout(idleId);
      near.disconnect();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [kind, accent, baseTurn]);

  return (
    <div ref={wrapRef} className={className}>
      {/* While loading: a soft glow where the piece will stand (not the flat
          icon, which read as broken). The icon is kept for no-WebGL only. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${status === "idle" ? "opacity-100" : "opacity-0"}`}
      >
        <span className="wc-piece-loading w-[62%] aspect-square rounded-full" />
      </div>
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${status === "fallback" ? "opacity-100" : "opacity-0"}`}
      >
        {fallback}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
