"use client";

import * as React from "react";

/**
 * Scroll-linked scenes measure their own offsets. Framer re-measures on `resize`, so a single
 * synthetic resize after the window `load` event (every lazy image that was in the document has
 * settled) and after web fonts finish swapping keeps those measurements honest without a
 * scroll-hijacking library.
 */
export function useScrollRefresh() {
  React.useEffect(() => {
    let raf = 0;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
    };
  }, []);
}

/**
 * `true` while the element is on screen (with a margin). Scenes use it to pause their CSS
 * loops and skip camera work while the reader is somewhere else on the page.
 */
export function useOnScreen<T extends Element>(ref: React.RefObject<T | null>, margin = "200px") {
  const [onScreen, setOnScreen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return onScreen;
}

/** Matches a media query, `false` on the server and until mounted. */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * The reader's reduced-motion preference, hydration-safe: the server and the first client
 * render both assume motion, then React re-renders with the real value. Framer's own hook reads
 * `matchMedia` during the first render, which made the server and client markup disagree.
 */
export function useReducedMotionPref() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
