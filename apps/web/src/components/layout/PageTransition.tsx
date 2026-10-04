"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          mass: 0.5,
        }}
        className="flex-1 w-full flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
