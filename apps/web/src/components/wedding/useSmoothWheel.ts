import { useEffect } from "react";

/* Smooth mouse-wheel scrolling for the invitation on computers.

   A wheel moves the page in hard notches of about a hundred pixels, which
   makes the scroll-driven scenes (the walk into the hall) step instead of
   glide. Here each notch only moves a target, and the page eases toward it
   frame by frame. It is still the page's own scroll (window.scrollTo), so
   sticky sections, ScrollTrigger and scroll timelines all follow it.

   Left alone: touch screens and touchpads' own momentum is kept natural by
   following small pixel deltas directly; zooming (ctrl + wheel); anything
   that scrolls by itself under the pointer (a text box, a dialog); and
   anyone who asks for reduced motion. Keyboard, scrollbar and anchor
   scrolling carry on natively, and the target catches up with them. */
export function useSmoothWheel(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let ours = false;

    const max = () => document.documentElement.scrollHeight - window.innerHeight;

    const scrollsItself = (el: Element | null) => {
      for (; el && el !== document.body; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) return true;
      }
      return false;
    };

    const step = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.5) current = target;
      ours = true;
      window.scrollTo(0, current);
      raf = current === target ? 0 : requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (scrollsItself(e.target as Element)) return;
      // Touchpads send many small pixel steps with their own momentum: let
      // them through untouched
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) return;
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!raf) current = window.scrollY;
      target = Math.max(0, Math.min(max(), target + px));
      if (!raf) raf = requestAnimationFrame(step);
    };

    // Scrolling that didn't come from here (keys, scrollbar, links): follow it
    const onScroll = () => {
      if (ours) {
        ours = false;
        return;
      }
      if (!raf) target = current = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);
}
