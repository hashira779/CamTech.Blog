import { ReactNode } from "react";

/**
 * Layout slot wrapper around route pages.
 *
 * Intentionally avoids `AnimatePresence mode="wait"` over Next.js App Router
 * children, which can leave navigated routes faded out (`opacity: 0`) when
 * clicking rapidly between pages or streaming dynamic `loading.tsx` shells.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-1 flex-col">{children}</div>;
}
