"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Non-blocking route entry glide.
 *
 * Uses a GPU-composited `translate3d` settle keyed by pathname while keeping
 * initial opacity above 0.9 so content is always immediately readable and never
 * freezes on Framer Motion `AnimatePresence mode="wait"` exit transitions.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-settle flex w-full flex-1 flex-col">
      {children}
    </div>
  );
}
