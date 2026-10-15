"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Route transition.
 *
 * Kept, but shortened: the old 15px spring travelled far enough that headings
 * visibly jumped on every navigation, and it ignored the reader's motion
 * preference. Under `prefers-reduced-motion` the page simply swaps.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 32, mass: 0.6 }
        }
        className="flex w-full flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
